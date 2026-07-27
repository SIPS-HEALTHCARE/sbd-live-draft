-- T62: tell the people whose password was exposed, inside the app.
--
-- T60 closed the hole and cleared the stored passwords, but neither step can undo whatever
-- was read while `registrations` was open to every signed-in account. The people whose
-- password sat there still have that password, and many will have reused it elsewhere.
--
-- This is a notice, not an enforcement. It does not lock anyone out, does not expire a
-- password, and does not force a reset at the next sign in. Somebody who ignores it keeps
-- signing in exactly as before. That is deliberate: the point is to give people the
-- information, not to take their access away over something that was our fault.
--
-- Two columns rather than one flag, so the state is honest:
--   password_notice_at      when the notice became due for this person
--   password_notice_ack_at  when they actually changed their password
--
-- `ack` is set only on a successful password change, never on dismissing the dialog.
-- Dismissing closes it for that session and it returns at the next sign in. Showing a
-- security notice once and then going quiet means most people never act on it.
--
-- Who gets it: everyone whose email appears in `registrations`. 96 of those 97 rows held a
-- stored password, so the presence of a registration is the accurate marker. The passwords
-- themselves were cleared in T60 step 2, which is why membership rather than the column is
-- what this keys on.
--
-- Neither column is in the T53 privilege guard's list, so a person can record their own
-- acknowledgement through the existing self-update policy without that policy becoming a way
-- to change role, facility or account state.

alter table public.sbd_portal_users
  add column if not exists password_notice_at     timestamptz,
  add column if not exists password_notice_ack_at timestamptz;

comment on column public.sbd_portal_users.password_notice_at is
  'T62: when the password-change notice became due, because this person''s password had been stored in the registrations table while it was readable by every signed-in account.';

comment on column public.sbd_portal_users.password_notice_ack_at is
  'T62: when this person actually changed their password. Set only on a successful change, never on dismissing the notice.';

update public.sbd_portal_users p
   set password_notice_at = now()
 where p.password_notice_at is null
   and exists (
     select 1 from public.registrations r
      where lower(r.email) = lower(p.email)
   );
