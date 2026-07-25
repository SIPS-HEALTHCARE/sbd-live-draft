-- The capability setter previously returned success even when the UPDATE matched no
-- row, so granting a capability against an id with no matching portal user showed
-- "Capabilities updated" in the UI while nothing actually changed. That made a failed
-- grant indistinguishable from a successful one. Raise instead, so the person doing
-- the grant sees it fail.

create or replace function public.sbd_set_user_capabilities(p_staff_id uuid, p_caps jsonb)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_rows integer;
begin
  if not public.sbd_is_master_admin() then
    raise exception 'Only a master admin can change capabilities';
  end if;

  update public.sbd_portal_users
     set capabilities = coalesce(p_caps, '{}'::jsonb)
   where auth_uid = p_staff_id;

  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    raise exception 'No portal user matches that login id, so no capabilities were changed';
  end if;
end;
$function$;
