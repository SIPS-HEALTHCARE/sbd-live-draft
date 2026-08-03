-- T60, step 2 of 3: remove the stored passwords that nothing needs any more, and make sure
-- they cannot accumulate again.
--
-- Step 1 closed the table to everyone but SIPS admins. The passwords themselves were still
-- sitting there. 96 rows held one:
--
--   approved   86 rows, 85 with a password
--   denied     10 rows, 10 with a password
--   pending     1 row,   1 with a password
--
-- A password is only ever needed while a request is pending. sbd-approve-registration reads
-- it, creates the auth user with it, and from that moment the auth system holds the
-- credential and the copy here is residue. A denied request never needed one at all.
--
-- So this clears the password on every row that is not pending: 95 rows. The pending one is
-- deliberately left alone, otherwise approving it would have no credential to create the
-- account with.
--
-- The trigger then keeps it that way. sbd-approve-registration sets status to 'approved'
-- only after it has created the auth user, and it holds the password in a local variable
-- for the welcome email, so nulling the column at that moment takes nothing the function
-- still needs. Denial is a plain PATCH from the admin screen and never wanted it either.
--
-- What this still does not do: the flow continues to park a password in a table for as long
-- as a request is pending. Closing that is step 3 and it is the only real fix. And nothing
-- here can undo whatever was read while the table was open to all 75 accounts.

update public.registrations
   set password = null
 where status is distinct from 'pending'
   and password is not null;

create or replace function public.sbd_clear_registration_password()
returns trigger
language plpgsql
as $$
begin
  -- Once a request stops being pending the credential lives in auth.users. Keeping a second
  -- copy here buys nothing and is exactly what T60 was.
  if new.status is distinct from 'pending' then
    new.password := null;
  end if;
  return new;
end $$;

drop trigger if exists sbd_registrations_clear_password on public.registrations;

create trigger sbd_registrations_clear_password
before insert or update on public.registrations
for each row
execute function public.sbd_clear_registration_password();

comment on function public.sbd_clear_registration_password() is
  'T60: drops the stored password the moment a registration stops being pending, so approved and denied rows never carry a credential again.';
