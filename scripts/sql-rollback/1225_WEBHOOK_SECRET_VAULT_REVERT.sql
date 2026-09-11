-- ============================================================================
-- REVERT — #1225 / T131, manual rollback of
--          supabase/migrations/20260912150000_1225_webhook_secret_vault.sql
--
-- ⚠⚠ DO NOT PLACE THIS FILE IN supabase/migrations/ ⚠⚠
--   Every .sql there is auto-applied in timestamp order; a revert sitting next to
--   its up-migration would run straight after it and undo the change silently.
--
-- What this restores: the three functions the migration dropped —
-- handle_registration_alert (unbound then, unbound after: this recreates the
-- function only, NOT a trigger) and the two dead approval functions, bodies
-- copied from 20260903120000_baseline_production_schema.sql.
--
-- What this does NOT do, on purpose:
--   • It does not put a literal bearer back into handle_welcome_email. That is
--     the defect the card exists to remove, and writing the value into a file in
--     git would recreate it in a second place. handle_welcome_email is left on
--     the Vault read.
--   • It does not undo the ROTATION. Reverting the rotation is two paired ops,
--     old value in both places, in this order:
--         select vault.update_secret(
--           (select id from vault.secrets where name = 'sbd_emails_webhook_secret'),
--           '<old value>');
--         supabase secrets set WEBHOOK_SECRET='<old value>'   # then redeploy sbd-emails
--     Between those two the trigger's call is refused 403 by sbd-emails. That
--     window costs nothing today (see the note below), but keep it short.
--
-- Note for whoever runs this: as of 2026-09-12 the sbd-emails edge function has
-- no branch for INSERT on auth.users, so handle_welcome_email's post has always
-- returned 200 {ignored:true,"reason":"unmatched trigger"} and no welcome email
-- has ever been queued. Rolling this back restores the old secret handling, not
-- a working welcome email — there is nothing to restore on that side.
-- ============================================================================
begin;

-- ── revert 3 · the two dead approval functions (still dead: both read
--    public.sbd_pending_registrations, which does not exist) ─────────────────
create or replace function public.sbd_approve_registration(
  p_registration_id uuid, p_facility_id text, p_reviewed_by uuid default null
) returns jsonb
  language plpgsql security definer set search_path to ''
as $$
DECLARE
  v_reg record;
BEGIN
  SELECT * INTO v_reg FROM public.sbd_pending_registrations WHERE id = p_registration_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registration not found';
  END IF;
  IF v_reg.status != 'pending' THEN
    RAISE EXCEPTION 'Registration already processed';
  END IF;

  -- Create facility
  INSERT INTO public.sbd_facilities(id, name, location, department, contact_name, contact_email, since)
  VALUES (
    p_facility_id,
    v_reg.facility_name,
    v_reg.location,
    v_reg.department,
    v_reg.contact_name,
    v_reg.contact_email,
    to_char(now(), 'Mon YYYY')
  );

  -- Create portal user for the facility
  INSERT INTO public.sbd_portal_users(email, role, name, title, facility_id, initials)
  VALUES (
    v_reg.contact_email,
    'hospital',
    v_reg.contact_name,
    'Dept. Manager',
    p_facility_id,
    upper(left(split_part(v_reg.contact_name, ' ', 1), 1) || left(split_part(v_reg.contact_name, ' ', 2), 1))
  );

  -- Mark registration approved
  UPDATE public.sbd_pending_registrations
  SET status = 'approved', reviewed_by = p_reviewed_by, reviewed_at = now()
  WHERE id = p_registration_id;

  RETURN jsonb_build_object('success', true, 'facility_id', p_facility_id);
END;
$$;

revoke all on function public.sbd_approve_registration(uuid, text, uuid) from public;
grant  all on function public.sbd_approve_registration(uuid, text, uuid) to service_role;

comment on function public.sbd_approve_registration(uuid, text, uuid) is
  'NOT IN USE as of 2026-09-10. Reads sbd_pending_registrations and writes sbd_facilities, neither of which exists in this database, so any call raises undefined_table. Superseded by the sbd-approve-registration edge function. Retained only as a record of the original design. See board item 156.';

create or replace function public.sbd_reject_registration(
  p_registration_id uuid, p_reviewed_by uuid default null
) returns jsonb
  language plpgsql security definer set search_path to ''
as $$
BEGIN
  UPDATE public.sbd_pending_registrations
  SET status = 'rejected', reviewed_by = p_reviewed_by, reviewed_at = now()
  WHERE id = p_registration_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registration not found or already processed';
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

revoke all on function public.sbd_reject_registration(uuid, uuid) from public;
grant  all on function public.sbd_reject_registration(uuid, uuid) to service_role;

comment on function public.sbd_reject_registration(uuid, uuid) is
  'NOT IN USE as of 2026-09-10. Reads sbd_pending_registrations, which does not exist in this database, so any call raises undefined_table. Rejection runs through the portal and the sbd-emails registration_denied path. Retained only as a record of the original design. See board item 156.';

-- ── revert 2 · the unbound duplicate, restored on the Vault read (never the
--    literal). No trigger is created: it had none before either. ─────────────
create or replace function public.handle_registration_alert() returns trigger
  language plpgsql security definer set search_path to 'public'
as $$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret
    from vault.decrypted_secrets
   where name = 'sbd_emails_webhook_secret';

  if v_secret is null or v_secret = '' then
    raise warning 'handle_registration_alert: vault secret sbd_emails_webhook_secret is missing or empty; sbd-emails not called';
    return new;
  end if;

  perform net.http_post(
    url     := 'https://mhijaqahbceuahfzezbh.supabase.co/functions/v1/sbd-emails',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || v_secret
    ),
    body    := jsonb_build_object(
      'type',   TG_OP,
      'table',  TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', row_to_json(new)
    )
  );

  return new;
end;
$$;

revoke all on function public.handle_registration_alert() from public;
grant  all on function public.handle_registration_alert() to service_role;

comment on function public.handle_registration_alert() is
  'Restored by the #1225 revert. Bound to no trigger, exactly as it was before 2026-09-12. Reads the bearer from Vault secret sbd_emails_webhook_secret; never inline it here.';

commit;
