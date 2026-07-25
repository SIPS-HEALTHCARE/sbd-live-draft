-- Position School completion requests.
--
-- A candidate who has reached Observation on a track can request sign-off. Until now
-- the request only existed in browser memory, so it vanished on refresh and no leader
-- ever saw it, even though the candidate was told "your supervisor will review".
--
-- Scoping mirrors the observation model: a candidate sees and creates their own
-- requests, facility leaders and SIPS admins see their facility's, and only a leader
-- or admin can decide one.

create table if not exists public.ps_completion_requests (
  id            uuid primary key default gen_random_uuid(),
  staff_id      uuid not null,
  facility_id   uuid,
  track_id      text not null,
  track_name    text,
  practice_k    integer,
  practice_s    integer,
  status        text not null default 'pending',
  decided_by    uuid,
  decided_at    timestamptz,
  created_at    timestamptz default now()
);

alter table public.ps_completion_requests drop constraint if exists ps_completion_requests_status_check;
alter table public.ps_completion_requests
  add constraint ps_completion_requests_status_check
  check (status in ('pending','approved','denied'));

create unique index if not exists ps_completion_requests_open_uniq
  on public.ps_completion_requests (staff_id, track_id)
  where status = 'pending';

create index if not exists ps_completion_requests_scope_idx
  on public.ps_completion_requests (facility_id, status, created_at desc);

alter table public.ps_completion_requests enable row level security;
grant all on public.ps_completion_requests to service_role;
grant select, insert, update on public.ps_completion_requests to authenticated;

drop policy if exists pscr_select on public.ps_completion_requests;
create policy pscr_select on public.ps_completion_requests
  for select to authenticated
  using (
    staff_id = auth.uid()
    or public.sbd_is_master_admin()
    or public.sbd_is_assessor()
    or public.sbd_leads_facility_of(staff_id)
  );

drop policy if exists pscr_insert on public.ps_completion_requests;
create policy pscr_insert on public.ps_completion_requests
  for insert to authenticated
  with check ( staff_id = auth.uid() and status = 'pending' );

drop policy if exists pscr_update on public.ps_completion_requests;
create policy pscr_update on public.ps_completion_requests
  for update to authenticated
  using (
    public.sbd_is_master_admin()
    or public.sbd_is_assessor()
    or public.sbd_leads_facility_of(staff_id)
  )
  with check (
    public.sbd_is_master_admin()
    or public.sbd_is_assessor()
    or public.sbd_leads_facility_of(staff_id)
  );
