-- P0-3 (2026-07-18) · hospital_systems — full CRUD was open to PUBLIC.
-- Finding: anon could INSERT/UPDATE/DELETE hospital systems (e.g. delete a whole system).
-- New posture (per the finding: "authenticated read, admin write"):
--   • SELECT  → any authenticated user (the app renders the systems list for system_admin
--               context and registration assignment).
--   • WRITE   → admins only, via public.sbd_is_admin() (master_admin / staff_admin / admin,
--               plus the three hardcoded SIPS master emails). Defined in
--               20260611120000_transfer_requests.sql.
-- Client write paths (createHospitalSystem / updateHospitalSystem / deleteHospitalSystem in
-- api-supabase.js) run from the master-admin UI and satisfy sbd_is_admin(). sbd-matrix-seeder
-- upserts with the service role (bypasses RLS).
--
-- NOTE: this removes anon read. If the PUBLIC (pre-auth) registration form ever needs the
-- systems list, that path must be re-scoped or served via an edge function — flagged for QA.
begin;

alter table public.hospital_systems enable row level security;

do $$
declare pol record;
begin
  for pol in select policyname from pg_policies
             where schemaname = 'public' and tablename = 'hospital_systems'
  loop
    execute format('drop policy if exists %I on public.hospital_systems', pol.policyname);
  end loop;
end $$;

revoke all on public.hospital_systems from anon, authenticated;
revoke all on public.hospital_systems from public;
grant select, insert, update, delete on public.hospital_systems to authenticated;
grant all on public.hospital_systems to service_role;

create policy hospital_systems_read_authenticated on public.hospital_systems
  for select to authenticated using (true);

create policy hospital_systems_insert_admin on public.hospital_systems
  for insert to authenticated with check (public.sbd_is_admin());

create policy hospital_systems_update_admin on public.hospital_systems
  for update to authenticated using (public.sbd_is_admin()) with check (public.sbd_is_admin());

create policy hospital_systems_delete_admin on public.hospital_systems
  for delete to authenticated using (public.sbd_is_admin());

commit;

-- Rollback:
--   drop policy if exists hospital_systems_read_authenticated on public.hospital_systems;
--   drop policy if exists hospital_systems_insert_admin       on public.hospital_systems;
--   drop policy if exists hospital_systems_update_admin       on public.hospital_systems;
--   drop policy if exists hospital_systems_delete_admin       on public.hospital_systems;
--   create policy hospital_systems_all_all on public.hospital_systems
--     for all using (true) with check (true);
--   grant all on public.hospital_systems to anon, authenticated;
