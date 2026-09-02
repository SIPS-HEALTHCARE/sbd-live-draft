-- ============================================================================
-- PHASE 1 — Foundations & Instruments backend CORRECTNESS
--   plans/FOUNDATIONS_INSTRUMENTS_PRODUCTION_PLAN.md  §"PHASE 1"
--   plans/phase0/PHASE_0_DECISION_BRIEF.md  (findings that shaped this file)
-- ----------------------------------------------------------------------------
-- APPLIED BY: the USER (Claude has no SBD prod access). Ship as a file; run it.
-- SAFETY:     Additive + idempotent. No data destruction. Safe to run whether
--             prod matches the migration files or was patched out-of-band. Prefer
--             a Supabase branch/staging first if one exists.
--
-- WHAT THIS FIXES
--   [P0 #1 — REAL]  assigned_by is typed `uuid` (20260625000000:16, 020000:7) but
--     the frontend writes ST.user.name, a STRING (foundations.js:489/852,
--     instruments.js:236/382). The insert is rejected by Postgres, the error is
--     swallowed by `.catch(console.warn)`, and the in-memory optimistic write
--     masks it -> assignments do NOT persist. FIX: widen assigned_by -> text
--     (matches what the frontend sends AND reads back, auth-init.js:2064-2067).
--
--   [GRANTS]  The 3 shipped migrations issue no GRANTs. Add addendum-§5 grants
--     (idempotent) so PostgREST can reach the tables; RLS still gates access.
--
-- WHAT THIS DELIBERATELY DOES **NOT** DO  (Phase 0 correction — see brief Part A)
--   [P0 #2 — FALSE ALARM]  The plan's Phase 1 Step 2 said to swap
--     `staff_id = auth.uid()` -> `(auth.jwt()->>'staff_id')::uuid`. That would
--     REGRESS a correct predicate: staff.id IS auth.uid() (sbd-approve-registration
--     index.ts:191-192; sbd-sync-user-claims index.ts:218,249) and NO JWT custom
--     claims are minted anywhere (no auth hook in config.toml; three migrations
--     warn auth.jwt()->>'staff_id'/'role' is never set). schema.sql (the audit's
--     source) is DOC-ONLY and does not reflect prod. => The own-row predicate is
--     LEFT AS `staff_id = auth.uid()`. Do NOT "fix" it.
--     >> If Phase-0 Check 5 shows ZERO overlap between staff.id and auth.users.id,
--        STOP and revisit — only then would a predicate change be warranted.
--
-- NOTE ON POLICY RECREATION: the *_assign_select policies (20260625010000:7-13,
--   20260625020000:33-37) contain `assigned_by = auth.uid()`. Once assigned_by is
--   text, that comparison is a `text = uuid` type error, so those two SELECT
--   policies are dropped BEFORE the type change and recreated WITHOUT that branch.
--   The branch was already dead (assigner is a leader -> sees rows via the role
--   branch), so nothing is lost.
--
-- ROLLBACK (inverse), if ever needed:
--   * assigned_by: `alter table public.foundations_assignments alter column
--     assigned_by type uuid using assigned_by::uuid;` (mirror instruments) --
--     NOTE this fails if any non-uuid names were stored; clear them first.
--   * select policies: recreate the prior versions from 20260625010000 / 020000.
--   * grants: `revoke ... from anon, authenticated;` (only if they were absent
--     before -- generally leave grants in place).
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. Drop the assign-SELECT policies that reference assigned_by (recreated in §3
--    after the type change). Idempotent via `if exists`.
-- ----------------------------------------------------------------------------
drop policy if exists fnd_assign_select  on public.foundations_assignments;
drop policy if exists inst_assign_select on public.instrument_assignments;

-- ----------------------------------------------------------------------------
-- 2. Widen assigned_by uuid -> text. Guarded so it is a no-op if prod already
--    has it as text (patched out-of-band). Non-destructive: uuid::text is a
--    lossless cast; existing rows (if any) are preserved.
-- ----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='foundations_assignments'
               and column_name='assigned_by' and data_type='uuid') then
    alter table public.foundations_assignments
      alter column assigned_by type text using assigned_by::text;
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='instrument_assignments'
               and column_name='assigned_by' and data_type='uuid') then
    alter table public.instrument_assignments
      alter column assigned_by type text using assigned_by::text;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 3. Recreate the assign-SELECT policies WITHOUT the dead `assigned_by=auth.uid()`
--    branch. Identity/self-scope predicate is KEPT as `staff_id = auth.uid()`
--    (Phase 0 Finding 1). Leader visibility unchanged (role check via
--    sbd_portal_users.auth_uid = auth.uid()).
-- ----------------------------------------------------------------------------
create policy fnd_assign_select on public.foundations_assignments
  for select to authenticated
  using (
    staff_id = auth.uid()
    or exists (select 1 from public.sbd_portal_users u
               where u.auth_uid = auth.uid()
                 and u.role in ('master_admin','facility_admin','staff_admin','hospital'))
  );

create policy inst_assign_select on public.instrument_assignments
  for select to authenticated
  using (
    staff_id = auth.uid()
    or exists (select 1 from public.sbd_portal_users u
               where u.auth_uid = auth.uid()
                 and u.role in ('master_admin','facility_admin','staff_admin','hospital'))
  );

-- ----------------------------------------------------------------------------
-- 4. GRANTs (addendum §5). Idempotent -- re-granting is a no-op. RLS still gates
--    row access; these only permit PostgREST to attempt the operation.
--    Assignments: full CRUD. Progress: no DELETE (mirrors the plan §1 step 3).
-- ----------------------------------------------------------------------------
grant select, insert, update, delete on public.foundations_assignments to anon, authenticated;
grant select, insert, update, delete on public.instrument_assignments  to anon, authenticated;
grant select, insert, update         on public.foundations_progress    to anon, authenticated;
grant select, insert, update         on public.instrument_progress     to anon, authenticated;

commit;

-- ============================================================================
-- POST-APPLY VERIFICATION (run these read-only checks after applying)
--   1) assigned_by is text on both tables:
--      select table_name, data_type from information_schema.columns
--       where column_name='assigned_by'
--         and table_name in ('foundations_assignments','instrument_assignments');
--   2) assign-select policies no longer reference assigned_by:
--      select policyname, qual from pg_policies
--       where policyname in ('fnd_assign_select','inst_assign_select');
--   3) grants present for authenticated:
--      select table_name, grantee, privilege_type
--       from information_schema.role_table_grants
--       where table_name like 'foundations_%' or table_name like 'instrument_%';
--   4) FUNCTIONAL: a manager assigns a module to a real staff member -> the row
--      persists across reload; that staff member logs in, sees it, and can
--      submit G1/G2 with scores persisting. No `.catch(console.warn)` insert
--      failures in the network tab.
-- ============================================================================
