-- T60, step 1 of 3: stop every signed-in account reading 96 people's passwords.
--
-- public.registrations holds a `password` column. 96 rows carry a value and none of them
-- is hashed: no $2, $argon or $scrypt prefix, lengths from 6 to 20 characters, which is the
-- shape of a typed password and not of any digest. On top of that the table carried:
--
--   reg_all_all      ALL    to authenticated  USING (true) WITH CHECK (true)
--   reg_select_all   SELECT to authenticated  USING (true)
--   reg_insert_all   INSERT to authenticated  WITH CHECK (true)
--
-- Measured as an ordinary staff_member, every probe rolled back:
--   registration rows readable            97
--   stored passwords readable             96, covering 96 distinct people
--   approve a pending registration        1 row
--   delete a pending registration         1 row
--   overwrite other people's passwords    12 rows
--
-- So it was a disclosure and a write hole at once, and a candidate could approve their own
-- account request. The people involved are real staff at the client's facilities using real
-- work addresses, and password reuse across systems is the normal case, so the reach goes
-- past this application.
--
-- What this migration does NOT do, deliberately:
--   * It does not touch the stored passwords. Purging them is destructive and is step 2.
--     sbd-approve-registration reads regData.password as the credential when it creates the
--     auth user, so pending rows still need theirs; approved rows do not and are residue.
--   * It does not change the registration flow so that no password is ever parked in a
--     table. That is step 3 and it is the only real fix.
--   * It cannot undo whatever has already been read. Anyone whose password sat here should
--     be told to change it.
--
-- Login is untouched. Authentication runs against auth.users through /auth/v1/token and has
-- no relationship to this table, which is only the request-an-account queue.
--
-- Who still needs what, read out of the application rather than assumed:
--   * The register form posts as `anon`, since sbFetch falls back to the anon key when
--     there is no session. "Allow public registration submission" is therefore kept exactly
--     as it is; without it nobody could request an account at all.
--   * The Registrations screen (renderARegistrations) is in the SIPS admin portal, so
--     admins read.
--   * Deny is a direct PATCH from that screen, so admins update.
--   * Approve goes through the sbd-approve-registration edge function on the service role,
--     which bypasses RLS entirely, so it is unaffected either way.
--   * Nothing else reads it. getPendingRegistrations runs during hydration for every user,
--     but each hydration call is wrapped in a catch that yields [], and the four consumers
--     of DB.pendingRegs are all admin surfaces. A staff member now receives an empty list,
--     which is a filtered read and not an error.
--
-- To put it back exactly as it was, if something unforeseen depends on the old behaviour:
--   create policy reg_all_all on public.registrations
--     for all to authenticated using (true) with check (true);

alter table public.registrations enable row level security;

drop policy if exists reg_all_all    on public.registrations;
drop policy if exists reg_select_all on public.registrations;
drop policy if exists reg_insert_all on public.registrations;
drop policy if exists reg_select     on public.registrations;
drop policy if exists reg_update     on public.registrations;
drop policy if exists reg_delete     on public.registrations;

create policy reg_select on public.registrations
for select to authenticated
using (public.sbd_get_user_role() in ('master_admin','admin','staff_admin','system_admin'));

create policy reg_update on public.registrations
for update to authenticated
using      (public.sbd_get_user_role() in ('master_admin','admin','staff_admin','system_admin'))
with check (public.sbd_get_user_role() in ('master_admin','admin','staff_admin','system_admin'));

create policy reg_delete on public.registrations
for delete to authenticated
using (public.sbd_is_master_admin());

comment on table public.registrations is
  'Account requests awaiting review. RLS (T60): read and decided by SIPS admins only; anonymous visitors may submit one. Until step 2 lands this table still holds unhashed passwords, so treat every column as sensitive.';

comment on column public.registrations.password is
  'T60: unhashed. Needed only until sbd-approve-registration consumes it to create the auth user. Rows that are no longer pending should not carry one; purging them is step 2, and step 3 removes the column from the flow entirely.';
