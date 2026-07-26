-- T25 and T25a: the last two tables still carrying FOR ALL USING(true) WITH CHECK(true).
--
-- Both were created with the same open pair every other table on this platform started
-- with: an ALL policy that allows everything, plus a redundant SELECT policy doing the
-- same. Any signed-in account could read and rewrite either table by calling the data
-- interface directly.
--
-- facility_shifts (T25), 0 rows, feature shipped 2026-07-24
--
--   Read: any signed-in user at that facility. Staff need this, not just leaders. The
--   schedule renders a shift label against each assigned block, and that label comes out
--   of this table, so scoping the read to leaders only would leave staff looking at
--   unlabelled shifts.
--   Write and delete: SIPS admins anywhere, facility leaders on their own facility only.
--   The two write paths are saveShiftDef (ui-views.js:10383) and deleteShift (10397),
--   both reached from buildShiftManager, which renders inside renderHSchedule (10115,
--   the facility leader schedule) and renderXSchedule (11315, the admin schedule).
--   fid is uuid here and sbd_get_user_facility() returns text, so the comparison casts.
--
-- free_agents (T25a), 12 rows
--
--   This is the released-staff registry. Rows carry a person's name, belt, star count,
--   release reason, release notes and their whole OIP blob, for people who have left a
--   facility. It was readable by all 66 non-SIPS accounts.
--
--   Read: SIPS admins only. Every consumer of DB.freeAgents is an admin portal screen:
--   renderAFreeAgents, updateFANB, and the report, profile and assign modals. No staff
--   screen and no facility leader screen reads it.
--   Write: nobody from the browser. purgeFreeAgent exists at api-supabase.js:345 but is
--   never called from anywhere. The real release and assign paths run through the
--   sbd-release-to-free-agent and sbd-assign-free-agent edge functions on the service
--   role, which bypasses RLS entirely, so removing the browser write breaks nothing.
--   Delete: master admin only, as a manual recovery hatch.
--
--   Known effect: getFreeAgents() is called during hydration for every signed-in user,
--   so a staff member or facility leader now receives an empty list instead of 12 rows.
--   That is a filtered read, not an error, and nothing they can see consumes it.

alter table public.facility_shifts enable row level security;

drop policy if exists fs_all_all    on public.facility_shifts;
drop policy if exists fs_select_all on public.facility_shifts;
drop policy if exists fs_select     on public.facility_shifts;
drop policy if exists fs_insert     on public.facility_shifts;
drop policy if exists fs_update     on public.facility_shifts;
drop policy if exists fs_delete     on public.facility_shifts;

create policy fs_select on public.facility_shifts
for select to authenticated
using (
  public.sbd_get_user_role() in ('master_admin','admin','staff_admin','system_admin')
  or (fid is not null and fid::text = public.sbd_get_user_facility())
);

create policy fs_insert on public.facility_shifts
for insert to authenticated
with check (
  public.sbd_get_user_role() in ('master_admin','admin','staff_admin','system_admin')
  or (
    public.sbd_get_user_role() in ('hospital','facility_admin')
    and fid is not null
    and fid::text = public.sbd_get_user_facility()
  )
);

create policy fs_update on public.facility_shifts
for update to authenticated
using (
  public.sbd_get_user_role() in ('master_admin','admin','staff_admin','system_admin')
  or (
    public.sbd_get_user_role() in ('hospital','facility_admin')
    and fid is not null
    and fid::text = public.sbd_get_user_facility()
  )
)
with check (
  public.sbd_get_user_role() in ('master_admin','admin','staff_admin','system_admin')
  or (
    public.sbd_get_user_role() in ('hospital','facility_admin')
    and fid is not null
    and fid::text = public.sbd_get_user_facility()
  )
);

create policy fs_delete on public.facility_shifts
for delete to authenticated
using (
  public.sbd_get_user_role() in ('master_admin','admin','staff_admin','system_admin')
  or (
    public.sbd_get_user_role() in ('hospital','facility_admin')
    and fid is not null
    and fid::text = public.sbd_get_user_facility()
  )
);

comment on table public.facility_shifts is
  'Shift definitions per facility. RLS (T25): anyone signed in at that facility reads them so schedule labels resolve; SIPS admins and that facility''s leaders are the only writers.';

alter table public.free_agents enable row level security;

drop policy if exists fa_all_all    on public.free_agents;
drop policy if exists fa_select_all on public.free_agents;
drop policy if exists fa_select     on public.free_agents;
drop policy if exists fa_insert     on public.free_agents;
drop policy if exists fa_update     on public.free_agents;
drop policy if exists fa_delete     on public.free_agents;

create policy fa_select on public.free_agents
for select to authenticated
using (public.sbd_get_user_role() in ('master_admin','admin','staff_admin','system_admin'));

create policy fa_update on public.free_agents
for update to authenticated
using      (public.sbd_get_user_role() in ('master_admin','admin','staff_admin','system_admin'))
with check (public.sbd_get_user_role() in ('master_admin','admin','staff_admin','system_admin'));

create policy fa_delete on public.free_agents
for delete to authenticated
using (public.sbd_is_master_admin());

-- No INSERT policy on purpose. Releasing someone to the registry is an edge function on
-- the service role; there is no browser insert path to preserve.

comment on table public.free_agents is
  'Released staff registry, holding belt, stars, release reason and OIP for people who left a facility. RLS (T25a): SIPS admins only. Releases and assignments run through edge functions on the service role.';
