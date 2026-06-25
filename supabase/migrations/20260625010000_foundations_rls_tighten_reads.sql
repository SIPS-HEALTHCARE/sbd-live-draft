-- Tighten Foundations read scope: staff see only their own rows; leaders see all.
-- (Initial policy used select using(true), which let any authenticated user read
-- every staff member's progress. Found during review.)
drop policy if exists fnd_assign_select on public.foundations_assignments;
drop policy if exists fnd_prog_select   on public.foundations_progress;

create policy fnd_assign_select on public.foundations_assignments
  for select to authenticated
  using (staff_id = auth.uid()
         or assigned_by = auth.uid()
         or exists (select 1 from public.sbd_portal_users u
                    where u.auth_uid = auth.uid()
                      and u.role in ('master_admin','facility_admin','staff_admin','hospital')));

create policy fnd_prog_select on public.foundations_progress
  for select to authenticated
  using (staff_id = auth.uid()
         or exists (select 1 from public.sbd_portal_users u
                    where u.auth_uid = auth.uid()
                      and u.role in ('master_admin','facility_admin','staff_admin','hospital')));
