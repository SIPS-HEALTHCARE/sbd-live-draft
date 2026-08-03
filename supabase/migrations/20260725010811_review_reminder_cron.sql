-- Twice-daily reminder for reviews still waiting on a decision.
--
-- Client ruling (2026-07-24): a pending review chases the admins twice a day until
-- it is approved or denied, covering placement reviews, belt gate requests and
-- preceptor applications, emailing every SIPS admin.
--
-- 01:00 and 13:00 UTC, which is 9pm and 9am US Eastern, so one lands at the start
-- of the working day and one at the end. sbd-review-reminders re-reads what is
-- still pending on each run, so an item drops out as soon as it is decided and no
-- reminder state has to be tracked.
--
-- The key below is the publishable anon key already shipped in the frontend and
-- used by the existing cron jobs. It carries no privileges of its own; the function
-- itself runs with the service role.

select cron.unschedule('sbd-review-reminders')
where exists (select 1 from cron.job where jobname = 'sbd-review-reminders');

select cron.schedule(
  'sbd-review-reminders',
  '0 1,13 * * *',
  $$
  SELECT net.http_post(
    url := 'https://mhijaqahbceuahfzezbh.supabase.co/functions/v1/sbd-review-reminders',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oaWphcWFoYmNldWFoZnplemJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MDkwNzksImV4cCI6MjA4OTM4NTA3OX0.GZcvOFxm4uNdTFPnq-rfwHaMVhWbIJWY7QMYToPa7mQ","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oaWphcWFoYmNldWFoZnplemJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MDkwNzksImV4cCI6MjA4OTM4NTA3OX0.GZcvOFxm4uNdTFPnq-rfwHaMVhWbIJWY7QMYToPa7mQ"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
