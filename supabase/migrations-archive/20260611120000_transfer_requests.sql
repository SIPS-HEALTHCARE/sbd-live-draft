-- Module 3 / STAFF-F6: persist the dual-admin transfer verification queue.
-- Previously DB.pendingTransfers lived only in client memory, so a second admin
-- in another session could never see or approve a request, and the backend
-- release executed at request time (single-admin). This table makes the queue
-- durable and shared; execution is deferred until a second admin approves.
--
-- Run this in the Supabase SQL editor BEFORE (or together with) deploying the
-- frontend from branch fix/module-3-staff-management.

create table public.transfer_requests (
  id                uuid primary key default gen_random_uuid(),
  type              text not null check (type in ('release','assignment')),
  staff_id          uuid,            -- release: the staff row being released
  fa_id             uuid,            -- assignment: the free_agents row being placed
  staff_name        text,
  belt              text,
  from_fac_id       uuid,
  from_fac_name     text,
  to_fac_id         uuid,
  to_fac_name       text,
  to_fac_loc        text,
  reason            text,
  notes             text,
  effect_date       date,
  status            text not null default 'pending' check (status in ('pending','approved','denied')),
  requested_by      text not null,   -- portal user id of the initiating admin (self-approval guard)
  requested_by_name text,
  requested_at      timestamptz not null default now(),
  decided_by        text,            -- approving/denying admin (must differ from requested_by)
  decided_by_name   text,
  decided_at        timestamptz,
  deny_reason       text,
  created_at        timestamptz not null default now()
);

create index transfer_requests_status_idx on public.transfer_requests (status);
create index transfer_requests_staff_idx  on public.transfer_requests (staff_id);

alter table public.transfer_requests enable row level security;

-- Admin check mirroring the role-resolution order used by the sbd-* edge functions:
-- JWT app/user metadata role -> sbd_portal_users by auth uid -> by email -> known
-- SIPS master-admin emails. NOTE: a bare auth.jwt()->>'role' is NOT reliable here —
-- in a stock Supabase JWT it is the Postgres role ('authenticated'), and master
-- admins may not exist in sbd_portal_users at all (they are hardcoded in the
-- frontend), which is exactly why sbd-release-to-free-agent has the same fallbacks.
create or replace function public.sbd_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select
    coalesce(auth.jwt()->'app_metadata'->>'role',
             auth.jwt()->'user_metadata'->>'role',
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

create policy "transfer_requests_admin_all" on public.transfer_requests for all
  to authenticated
  using (public.sbd_is_admin())
  with check (public.sbd_is_admin());
