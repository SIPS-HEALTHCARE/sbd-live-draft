-- ── T33 (issue S13) · Enforce MFA (aal2) for admin-tier sessions at the data interface ──
--
-- Supabase JWTs carry an `aal` claim: 'aal1' = password only, 'aal2' = password +
-- verified TOTP factor. This migration makes an admin-tier password-only session
-- worthless at the data interface:
--
--   1. public.sbd_mfa_satisfied() — true when the caller is NOT an admin-tier
--      account, or when their JWT is aal2. The admin-tier test mirrors the three
--      trust legs of sbd_is_admin() (app_metadata claim, sbd_portal_users lookup,
--      SIPS email allowlist) so no leg can bypass the gate.
--   2. sbd_is_admin() gains the gate directly (covers its USING/WITH CHECK users).
--   3. A RESTRICTIVE policy `sbd_mfa_gate` on every RLS-enabled belt-platform
--      table. Restrictive policies AND with the existing permissive ones, so no
--      existing policy is edited and non-admin roles are untouched. service_role
--      bypasses RLS as before; the policies are TO authenticated, so anon flows
--      (registration submits) are untouched.
--   4. sbd_portal_users keeps an own-row SELECT exception: doLogin() must read the
--      caller's own profile at aal1 to learn whether their role requires MFA at
--      all. Writes on that table get the full gate.
--
-- ⚠️ DEPLOY ORDER: frontend (mfa.js) and edge functions FIRST, this migration
-- LAST. Applied against the old frontend, every admin sees empty screens until
-- they sign in through the new TOTP flow.
-- Design note: docs/decisions/2026-08-12-t33-admin-mfa-retention-interface-gate.md
-- Read-back: supabase/verify/t33_mfa_gate_check.sql

-- ── 1 · The predicate ──────────────────────────────────────────────────────────
-- SECURITY DEFINER so the sbd_portal_users lookup is not itself subject to the
-- restrictive policy this migration adds to that table (no recursion).
-- The admin-tier role list below exists in four places that must agree:
-- here, src/js/mfa.js (MFA.ADMIN_ROLES), and the MFA_ADMIN_ROLES block inlined in
-- each role-gated edge function. scripts/verify-t33-security-tail.js asserts it.
create or replace function public.sbd_mfa_satisfied()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2'
    or not (
      coalesce(auth.jwt()->'app_metadata'->>'role', '')
        in ('master_admin','staff_admin','admin','master','sips_admin','system_admin')
      or exists (
        select 1 from public.sbd_portal_users u
        where (u.auth_uid = auth.uid()
               or u.id = auth.uid()
               or lower(u.email) = lower(coalesce(auth.jwt()->>'email','')))
          and u.role in ('master_admin','staff_admin','admin','master','sips_admin','system_admin')
      )
      or lower(coalesce(auth.jwt()->>'email','')) in
         ('jjacobs@sipsconsults.com','izambrano@sipsconsults.com','dpayne@sipsconsults.com')
    );
$$;

revoke all on function public.sbd_mfa_satisfied() from public;
revoke all on function public.sbd_mfa_satisfied() from anon;
grant execute on function public.sbd_mfa_satisfied() to authenticated;

-- ── 2 · Gate sbd_is_admin() itself ─────────────────────────────────────────────
-- Body is the 20260723130000 version AND the new predicate. Covers every policy
-- and definer function that consults sbd_is_admin() without waiting for T34's
-- helper review.
create or replace function public.sbd_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select public.sbd_mfa_satisfied()
    and (
      coalesce(auth.jwt()->'app_metadata'->>'role',
               auth.jwt()->>'role')
        in ('master_admin','staff_admin','admin')
      or exists (
        select 1 from public.sbd_portal_users u
        where (u.id = auth.uid() or lower(u.email) = lower(coalesce(auth.jwt()->>'email','')))
          and u.role in ('master_admin','staff_admin','admin')
      )
      or lower(coalesce(auth.jwt()->>'email','')) in
         ('jjacobs@sipsconsults.com','izambrano@sipsconsults.com','dpayne@sipsconsults.com')
    );
$$;

-- ── 3 · Restrictive gate on every RLS-enabled belt-platform table ──────────────
-- Patterns sbd_* / david_* are belt-platform-owned (TASKS.md Risks §6: other SIPS
-- properties in this project use bb_*, aip_*, demo_*, tco_*, hfl_*, op44_*,
-- underwriting_*, page_events — none match). The explicit list adds the
-- belt-platform tables that carry no prefix. Tables in the list that do not exist
-- or have RLS off are simply skipped; sbd_portal_users is handcrafted in §4.
do $$
declare t record;
begin
  for t in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relrowsecurity
      and c.relname <> 'sbd_portal_users'
      and (c.relname like 'sbd\_%'
           or c.relname like 'david\_%'
           or c.relname like 'foundations\_%'
           or c.relname like 'instrument\_%'
           or c.relname in (
             'facilities','staff','assessment_history','registrations',
             'placement_reviews','hospital_systems','transfer_requests',
             'practice_scores','practice_attempts','activity_log',
             'assessment_pin_attempts','staff_history',
             'schedule','attendance','promotion_approvals','user_profiles',
             'free_agents','facility_shifts','assessment_queue'))
  loop
    execute format('drop policy if exists sbd_mfa_gate on public.%I', t.relname);
    execute format(
      'create policy sbd_mfa_gate on public.%I as restrictive for all to authenticated '
      || 'using (public.sbd_mfa_satisfied()) with check (public.sbd_mfa_satisfied())',
      t.relname);
  end loop;
end $$;

-- ── 4 · sbd_portal_users: own-row SELECT exception, full gate on writes ────────
-- The login flow reads the caller's own profile BEFORE the MFA challenge (that is
-- how it learns the role). Nothing else is readable at aal1 by an admin.
drop policy if exists sbd_mfa_gate_select on public.sbd_portal_users;
create policy sbd_mfa_gate_select on public.sbd_portal_users
  as restrictive for select to authenticated
  using (auth_uid = auth.uid() or id = auth.uid() or public.sbd_mfa_satisfied());

drop policy if exists sbd_mfa_gate_insert on public.sbd_portal_users;
create policy sbd_mfa_gate_insert on public.sbd_portal_users
  as restrictive for insert to authenticated
  with check (public.sbd_mfa_satisfied());

drop policy if exists sbd_mfa_gate_update on public.sbd_portal_users;
create policy sbd_mfa_gate_update on public.sbd_portal_users
  as restrictive for update to authenticated
  using (public.sbd_mfa_satisfied())
  with check (public.sbd_mfa_satisfied());

drop policy if exists sbd_mfa_gate_delete on public.sbd_portal_users;
create policy sbd_mfa_gate_delete on public.sbd_portal_users
  as restrictive for delete to authenticated
  using (public.sbd_mfa_satisfied());

-- ── Post-apply check (read-only) ───────────────────────────────────────────────
-- select schemaname, tablename, policyname, permissive, cmd
--   from pg_policies where policyname like 'sbd_mfa_gate%' order by tablename;
-- Expect permissive = 'RESTRICTIVE' on every row.
-- Full read-back: supabase/verify/t33_mfa_gate_check.sql
