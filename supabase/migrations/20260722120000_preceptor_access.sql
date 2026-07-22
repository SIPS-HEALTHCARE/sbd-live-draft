-- ============================================================================
-- SBD Preceptor Certification — Phase 3: master-admin access control
-- Spec: docs/decisions/2026-07-22-preceptor-certification-ph3.md (synopsis §4)
-- ----------------------------------------------------------------------------
-- ADDITIVE. One access record per user, belt-independent, master-admin-controlled,
-- read first at curriculum entry. Nothing else reads this table.
--   state: 'granted' (any belt) | 'revoked' (locked, progress preserved) | 'default'
--          (fall back to belt eligibility). Absence of a row = default.
--   granted_by = master admin's display name (text, like assigned_by).
-- ROLLBACK: drop table if exists public.preceptor_access;
-- ============================================================================

begin;

create table if not exists public.preceptor_access (
  id          uuid primary key default gen_random_uuid(),
  staff_id    uuid not null unique,
  state       text not null default 'default' check (state in ('granted','revoked','default')),
  granted_by  text,
  granted_at  timestamptz not null default now(),
  reason      text,
  updated_at  timestamptz not null default now()
);

create index if not exists idx_preceptor_access_staff on public.preceptor_access(staff_id);

alter table public.preceptor_access enable row level security;

-- Read: a user reads their own record; leaders/master read across scope (toggle + entry check).
drop policy if exists prc_access_select on public.preceptor_access;
create policy prc_access_select on public.preceptor_access
  for select to authenticated
  using (staff_id = auth.uid() or public.sbd_fi_leader_scope(staff_id));

-- Write: MASTER ADMIN ONLY. sbd_is_master_admin() lacks the SIPS-email fallback, so the SIPS
-- principals (who may write via email, not a portal master row) are added explicitly, mirroring
-- the master tier of sbd_fi_leader_scope. This control stays at SIPS by design (synopsis §4).
drop policy if exists prc_access_write on public.preceptor_access;
create policy prc_access_write on public.preceptor_access
  for all to authenticated
  using (
    public.sbd_is_master_admin()
    or lower(coalesce(auth.jwt()->>'email','')) in
       ('jjacobs@sipsconsults.com','izambrano@sipsconsults.com','dpayne@sipsconsults.com')
  )
  with check (
    public.sbd_is_master_admin()
    or lower(coalesce(auth.jwt()->>'email','')) in
       ('jjacobs@sipsconsults.com','izambrano@sipsconsults.com','dpayne@sipsconsults.com')
  );

grant select, insert, update, delete on public.preceptor_access to authenticated;

commit;
