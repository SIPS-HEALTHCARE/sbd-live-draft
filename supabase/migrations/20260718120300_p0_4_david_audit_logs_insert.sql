-- P0-4 (2026-07-18) · david_audit_logs — anyone could forge audit entries.
-- Finding: the INSERT policy "Admins can insert audit logs" was WITH CHECK (true) with no
-- role restriction (migration 20260422161200), so any caller could insert forged audit rows.
-- An audit log that unprivileged callers can write to is worse than none — it launders
-- fabricated history. All real writers are service-role edge functions (david-anomaly-detector,
-- david-admin-api), which bypass RLS and need no INSERT policy.
--
-- Fix: drop the open INSERT policy, revoke INSERT from anon/authenticated/PUBLIC, and keep the
-- existing master-admin SELECT policy (recreated idempotently, byte-for-byte unchanged).
begin;

alter table public.david_audit_logs enable row level security;

drop policy if exists "Admins can insert audit logs" on public.david_audit_logs;

revoke insert on public.david_audit_logs from anon, authenticated;
revoke insert on public.david_audit_logs from public;
grant all on public.david_audit_logs to service_role;

-- Master-admin read (unchanged from 20260422161200; recreate to guarantee known-good state).
drop policy if exists "Master Admins can view audit logs" on public.david_audit_logs;
create policy "Master Admins can view audit logs" on public.david_audit_logs
  for select to authenticated using (auth.jwt() ->> 'role' = 'master_admin');

commit;

-- Rollback (restores the forge-able insert hole — revert only):
--   create policy "Admins can insert audit logs" on public.david_audit_logs
--     for insert with check (true);
--   grant insert on public.david_audit_logs to anon, authenticated;
