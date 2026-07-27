-- T62a: the people whose password was exposed but who have no account yet.
--
-- T62 set the notice on 64 of the 75 existing accounts. But 96 people had a password stored,
-- and about 32 of them have no account at all: their registration was denied, or is still
-- waiting, or was simply never approved. A popup cannot reach somebody who cannot sign in.
--
-- Shawn's instruction was the right shape: do nothing special for them now, and if they ever
-- do get in, show them the notice then. This is that, made automatic rather than remembered.
--
-- When an account is created for somebody whose registration predates the fix, the notice is
-- set on the way in. So the first time they ever sign in, they see it.
--
-- The cutoff is 2026-07-27 00:04:35 UTC, when migration 20260727000435_registrations_rls_t60
-- closed the table. Before that moment a registration's password was readable by every
-- signed-in account. After it, only SIPS admins could read one, and the purge trigger from
-- step 2 clears it the moment the request stops being pending. So a registration submitted
-- after the cutoff was never exposed and its owner should not be told it was.
--
-- This also covers the test leader account being created for T59: that registration went in
-- on 2026-07-26, before the cutoff, so it will carry the notice. That is correct rather than
-- incidental. Its password was in the open table for the few minutes before step 1 landed.
--
-- The trigger sets the column only when it is not already set, so approving somebody twice,
-- or an admin editing the row later, cannot resurrect a notice the person has already
-- answered by changing their password.

create or replace function public.sbd_set_password_notice_on_new_account()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.password_notice_at is not null or new.password_notice_ack_at is not null then
    return new;
  end if;

  if new.email is not null and exists (
       select 1 from public.registrations r
        where lower(r.email) = lower(new.email)
          and r.requested_at < timestamptz '2026-07-27 00:04:35+00'
     ) then
    new.password_notice_at := now();
  end if;

  return new;
end $$;

drop trigger if exists sbd_portal_users_password_notice on public.sbd_portal_users;

create trigger sbd_portal_users_password_notice
before insert on public.sbd_portal_users
for each row
execute function public.sbd_set_password_notice_on_new_account();

comment on function public.sbd_set_password_notice_on_new_account() is
  'T62a: an account created for somebody who registered before the registrations table was closed on 2026-07-27 carries the password-change notice from the start, so they see it the first time they sign in. Registrations after that cutoff were never exposed and are left alone.';
