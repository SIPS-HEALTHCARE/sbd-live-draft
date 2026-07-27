-- T22 / finding S1: placement_reviews was readable and writable by every signed-in user.
--
-- The table carried a single policy, pr_all_all, defined as
--   FOR ALL TO authenticated USING (true) WITH CHECK (true)
-- plus a redundant pr_select_all doing the same for SELECT. With 49 live rows holding
-- real belt placement decisions, that meant all 66 non-SIPS accounts (49 staff members,
-- 9 hospital, 8 facility_admin) could read every placement review on the platform and
-- change any of them by calling the data interface directly.
--
-- Who actually needs what, taken from the application rather than assumed:
--   * A candidate finishing their placement assessment INSERTs their own row
--     (ui-views.js writes the row on submit) and later reads it back to check whether it
--     exists (a targeted staff_id = self query). So: self insert, self read.
--   * The Placement Reviews screen lives in the admin portal (a-placementreviews) and is
--     shown to SIPS admins only. So: SIPS admins read all and are the only ones who can
--     confirm or change a review.
--   * Facility leaders get a facility-scoped read. Their screens surface placement state
--     for their own people, and this matches how sbd_schedule already scopes hospital
--     reads. It is still a large tightening from "everyone reads everything".
--   * DELETE is master admin only. The reset and recovery paths run through edge functions
--     on the service role, which bypasses RLS, so nothing routine depends on this.
--
-- SIPS admins keep an unscoped read on purpose. One row has a null fid and eight point at
-- staff records that no longer exist; scoping the admin read would hide exactly the rows
-- that still need a decision. Narrowing staff_admin to its assigned facilities is a
-- separate call and is deliberately not made here.
--
-- Helper choice: the sbd_ prefixed helpers are STABLE with a fixed search_path, unlike the
-- older get_user_role/get_user_fid pair, so they are used throughout.

alter table public.placement_reviews enable row level security;

drop policy if exists pr_all_all    on public.placement_reviews;
drop policy if exists pr_select_all on public.placement_reviews;
drop policy if exists pr_select     on public.placement_reviews;
drop policy if exists pr_insert     on public.placement_reviews;
drop policy if exists pr_update     on public.placement_reviews;
drop policy if exists pr_delete     on public.placement_reviews;

create policy pr_select on public.placement_reviews
for select to authenticated
using (
  public.sbd_get_user_role() in ('master_admin','admin','staff_admin','system_admin')
  or staff_id = auth.uid()
  or (
    public.sbd_get_user_role() in ('hospital','facility_admin')
    and fid is not null
    and fid::text = public.sbd_get_user_facility()
  )
);

create policy pr_insert on public.placement_reviews
for insert to authenticated
with check (
  staff_id = auth.uid()
  or public.sbd_get_user_role() in ('master_admin','admin','staff_admin','system_admin')
);

create policy pr_update on public.placement_reviews
for update to authenticated
using      (public.sbd_get_user_role() in ('master_admin','admin','staff_admin','system_admin'))
with check (public.sbd_get_user_role() in ('master_admin','admin','staff_admin','system_admin'));

create policy pr_delete on public.placement_reviews
for delete to authenticated
using (public.sbd_is_master_admin());

comment on table public.placement_reviews is
  'Belt placement decisions. RLS (T22): SIPS admins read all and are the only writers; a candidate reads and inserts only their own row; facility leaders read their own facility.';
