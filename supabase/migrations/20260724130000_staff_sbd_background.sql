-- Profile "SBD Background" fields (Ignacio 2026-07-23): capture, in the profile tab,
-- how long a staff member has been in the SBD program and how many years they have
-- been certified in SBD. Two nullable integers on the staff record; edited from the
-- profile by staff/facility admins, shown in the profile + staff report.

alter table public.staff add column if not exists sbd_program_years integer;
alter table public.staff add column if not exists sbd_cert_years    integer;

comment on column public.staff.sbd_program_years is 'Years the staff member has been in the SBD program (profile SBD Background).';
comment on column public.staff.sbd_cert_years    is 'Years the staff member has been certified in SBD (profile SBD Background).';
