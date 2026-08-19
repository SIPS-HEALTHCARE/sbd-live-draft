-- Board item 142 (2026-08-19): alert when a registration sits approved with no
-- auth user behind it.
--
-- That state is how the 18 August incident stayed invisible: the approval email
-- had gone out, the registration read approved, and the account underneath had
-- been rolled back. Nobody could see it from any screen. The atomic rollback in
-- sbd-approve-registration stops the known path that created these, and the
-- portal Delete User button leaves one behind by design when an account is
-- removed but its registration stays approved (live example on 2026-08-18:
-- cortney.jumper@nemours.org). This check is the backstop for every path,
-- known and unknown.
--
-- Shape: a SQL function on pg_cron, same pattern as sbd-recover-placements
-- (job 4). It queues one email per stranded registration to every active
-- master_admin, through the existing sbd_email_queue -> sbd-email-processor
-- pipeline, and dedupes on the registration id so one stranded row alerts once,
-- not once per hour. The 10-minute grace keeps it from firing on an approval
-- that is mid-flight, and the 7-day window keeps the scan off ancient rows the
-- client has already ruled on (24 pre-fix strays predate the incident and are
-- known; alerting on those would be noise, not signal).

create or replace function public.sbd_check_stranded_registrations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  queued integer := 0;
begin
  with stranded as (
    select r.id, r.email, r.name, r.facility, r.reviewed_at
    from public.registrations r
    where r.status = 'approved'
      and r.reviewed_at > now() - interval '7 days'
      and r.reviewed_at < now() - interval '10 minutes'
      and not exists (
        select 1 from auth.users u where lower(u.email) = lower(r.email)
      )
      and not exists (
        select 1 from public.sbd_email_queue q
        where q.template = 'admin_alert'
          and q.body_data->>'registration_id' = r.id::text
      )
  ),
  recipients as (
    select p.email
    from public.sbd_portal_users p
    where p.role = 'master_admin' and p.active
  ),
  ins as (
    insert into public.sbd_email_queue
      (recipient_email, template, subject, body_data, status, attempts, created_at)
    select
      rec.email,
      'admin_alert',
      'SBD alert: an approval has no account behind it',
      jsonb_build_object(
        'alert_kind', 'stranded_registration',
        'registration_id', s.id,
        'reg_name', s.name,
        'reg_email', s.email,
        'reg_facility', s.facility,
        'approved_at', s.reviewed_at
      ),
      'pending', 0, now()
    from stranded s cross join recipients rec
    returning 1
  )
  select count(*) into queued from ins;
  return queued;
end;
$$;

comment on function public.sbd_check_stranded_registrations() is
  'Board 142: queues an admin_alert email for every registration that reads approved with no auth.users row behind it. Runs on pg_cron; dedupes per registration id.';

-- Hourly at :30, offset from the recovery job so the two never contend.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'sbd-stranded-registration-alert') then
    perform cron.unschedule('sbd-stranded-registration-alert');
  end if;
  perform cron.schedule(
    'sbd-stranded-registration-alert',
    '30 * * * *',
    'select public.sbd_check_stranded_registrations();'
  );
end;
$$;
