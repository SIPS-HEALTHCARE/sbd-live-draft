-- T113/T60: the signup form no longer collects a password, and the approval edge
-- function no longer reads one. This makes the column permanently null rather than
-- dropping it, so a stale cached client that still POSTs `password` gets its value
-- discarded instead of a PostgREST unknown-column error. The column can be dropped
-- in a later cleanup once no old clients remain.
--
-- Apply AFTER deploying the new sbd-approve-registration function. Applied before,
-- pending registrations would lose their password and the OLD function would fall
-- back to its shared temporary password.

update public.registrations set password = null where password is not null;

create or replace function public.registrations_null_password()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.password := null;
  return new;
end;
$$;

drop trigger if exists trg_registrations_null_password on public.registrations;
create trigger trg_registrations_null_password
  before insert or update on public.registrations
  for each row execute function public.registrations_null_password();
