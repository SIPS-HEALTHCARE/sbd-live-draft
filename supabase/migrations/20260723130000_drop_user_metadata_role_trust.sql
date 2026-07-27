-- ── Drop client-writable user_metadata.role from every RLS trust path ─────────
-- user_metadata is self-writable by any logged-in user via auth.updateUser(), so any
-- policy leg reading auth.jwt()->'user_metadata'->>'role' lets a user self-promote to
-- master_admin. Legit admins are covered by the surviving branches in every policy:
-- app_metadata (server-only writable), sbd_portal_users lookup, and the SIPS email
-- allowlist. Three trust points below; the two free-agent edge functions had the same
-- fallback and are fixed in the same commit (redeploy required).

-- ── 1 · david_audit_logs read policy (the #120 follow-up hole) ─────────────────
drop policy if exists "Master Admins can view audit logs" on public.david_audit_logs;
create policy "Master Admins can view audit logs" on public.david_audit_logs
  for select to authenticated
  using (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'master_admin'
    or exists (
      select 1 from public.sbd_portal_users u
      where (u.id = auth.uid()
             or lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
        and u.role = 'master_admin'
    )
    or lower(coalesce(auth.jwt() ->> 'email', '')) in
       ('jjacobs@sipsconsults.com', 'izambrano@sipsconsults.com', 'dpayne@sipsconsults.com')
  );

-- ── 2 · sbd_is_admin() — same leg, but this one gates WRITES ──────────────────
-- (transfer_requests, hospital_systems, practice_attempts, activity_log,
-- assessment_pin_attempts all use it in USING/WITH CHECK.)
create or replace function public.sbd_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select
    coalesce(auth.jwt()->'app_metadata'->>'role',
             auth.jwt()->>'role')
      in ('master_admin','staff_admin','admin')
    or exists (
      select 1 from public.sbd_portal_users u
      where (u.id = auth.uid() or lower(u.email) = lower(coalesce(auth.jwt()->>'email','')))
        and u.role in ('master_admin','staff_admin','admin')
    )
    or lower(coalesce(auth.jwt()->>'email','')) in
       ('jjacobs@sipsconsults.com','izambrano@sipsconsults.com','dpayne@sipsconsults.com');
$$;

-- ── 3 · david_wiki_pages read policy — was user_metadata ONLY ──────────────────
-- Replaced with the same three-branch master_admin check as the audit policy.
drop policy if exists "Allow Master Admins to read wiki" on public.david_wiki_pages;
create policy "Allow Master Admins to read wiki" on public.david_wiki_pages
  for select to authenticated
  using (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'master_admin'
    or exists (
      select 1 from public.sbd_portal_users u
      where (u.id = auth.uid()
             or lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
        and u.role = 'master_admin'
    )
    or lower(coalesce(auth.jwt() ->> 'email', '')) in
       ('jjacobs@sipsconsults.com', 'izambrano@sipsconsults.com', 'dpayne@sipsconsults.com')
  );

-- ── Post-apply check (read-only) ───────────────────────────────────────────────
-- select polname, pg_get_expr(polqual, polrelid) from pg_policy
--  where polrelid in ('public.david_audit_logs'::regclass, 'public.david_wiki_pages'::regclass);
-- select prosrc from pg_proc where proname = 'sbd_is_admin';
-- All three must contain no 'user_metadata'.
