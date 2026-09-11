-- #1224 (Shawn board 148, ledger T132): clear the synthetic observation gate.
--
-- WHAT WAS WRONG
-- `confirmPlacement()` (ui-views.js:4654 at HEAD dc5852e3) wrote cur_comp, cur_sim AND
-- cur_obs to 'pass' when an admin confirmed a belt placement. Competency and Simulation
-- are the two components the placement assessment actually administers, so those are
-- truthful. Nothing in that flow observes anyone on the floor — no checklist, no observer,
-- no `observations` row — so cur_obs = 'pass' was a gate with nothing behind it. The
-- client fix ships alongside this migration; this corrects the rows already written.
-- (#1121 was a different fix: it stopped the F&I G3 checklist stamping score:100. It never
-- touched this write.)
--
-- COUNTS, read live from prod 2026-09-11
--   select count(*) from staff where cur_obs = 'pass';                        -- 42
--   ...of which, with NO observation evidence of any kind (the set below)      -- 40
--   ...with some observation trace, left alone                                 --  2
-- Shawn's board says 40; his number and this one agree exactly. The issue's 41 counts
-- placement history entries, not evidence. The two rows this migration does NOT touch are
-- 2e550aae-ea87-4694-ab9a-52f848be8dca and c280aa16-7f97-40f1-8b7c-c2822463b5ed: both
-- carry a staff.history entry of type 'Observation', and c280aa16 also has an
-- `observations` row. Ambiguous, so they are left for a human to rule on rather than
-- cleared by a script.
--
-- EVIDENCE DEFINITION (fail-safe: any trace at all disqualifies a row from the clear)
--   an `observations` row for that staff_id, in any status; OR
--   a staff.history entry whose `type` matches '%observ%', in any result.
-- Note for the reader: prod holds 3 `observations` rows total and ZERO with
-- review_status = 'approved', i.e. no belt observation has ever been confirmed end to end
-- through the observation console. That is why the set is nearly the whole population.
--
-- THE 40 TOUCHED IDS (snapshot 2026-09-11; §2 recomputes the set at run time and §4 proves
-- the two agree, so a row that gained evidence between now and the run is skipped, not
-- clobbered):
--   White  (20): 030ad05f-b58f-4900-90a1-3d88fd2c066c, 03c70f2d-aeea-4376-8c51-55d2f36ccf67,
--     1e19dd63-e341-4966-9e41-0dfbfd8f402e, 1faa5482-4123-41d4-bf18-80753d7c5b0a,
--     2da12bfc-15b3-48fd-a56e-7f02316aa3dd, 56d90b07-108f-45c4-9336-af2bd711575e,
--     59995835-2c1a-455f-8f51-c7591b646dda, 6236c52e-c5e5-41a8-82b8-7622239687fe,
--     76cd66b4-7b50-46cb-88b1-81dea871c6e0, 82818479-1ee1-43bd-ac0d-1af7c14a9855,
--     82e1fad5-7187-4cb4-9cc4-00222238f052, 85532960-8fcc-4dbb-9bba-f72de01d958c,
--     8611c672-e808-41ee-af39-e10540219e09, 9c4f1c94-e752-4772-8019-b2a1879ab45a,
--     a02adffa-427a-4d95-83c3-102fd9c83254, a0ce6d62-4a5d-44b1-b216-d4ac0fb684da,
--     a915e7e8-b339-44cf-a28f-ea8ac559c1ef, bfaa015c-b97c-45a3-91eb-9fae0f0a589d,
--     ee800588-8dce-4b53-a3cf-426b12af15c1, ef26185e-8c64-4726-91bc-4e036a8a6ea6
--   Yellow  (7): 066f487e-d120-4a3f-a541-51df6bd4fabb, 0a8dfa17-b950-4580-94fb-b3634d8bc40f,
--     19bd3586-08c7-439f-aea4-e003b8f35ab9, acdf2d19-80f4-4091-884e-7031d9ceeb2d,
--     b8a4226c-5ef7-46f4-8010-e8994582048d, dbfb72ee-cc0b-44ca-a332-5ec2653abce6,
--     e275566e-4d2f-456f-a5ed-effb3d604536
--   Green  (10): 0db804b2-570f-4c0a-9d42-c9628c34400c, 1495c526-778d-45cc-a9d1-c449365ffb7c,
--     306d6a8b-e148-466f-a39f-8680d89f1ee3, 4853c978-1504-4f1c-98db-4d8a30bbb0e8,
--     49f910d3-52bc-48b3-b474-2f145ccfc253, 65e1985e-2047-4bbe-87c8-213861448a2c,
--     731c1d29-f043-450f-8f1e-817b5fac4f4a, 94483787-342d-4b91-8e0c-d1528f0ed1da,
--     a9a825bb-9a9b-4355-ab4e-2c44ea126349, c88df188-6a61-4d5e-8cf8-108f9c28714e
--   Brown   (3): 0499d090-2279-4959-a3f8-b73122c61b6c, 8be54724-3d6d-4d35-a53f-a1b5aa07009e,
--     f9a295f8-2aec-4ac2-9d06-61b603f5f7de
--
-- BLAST RADIUS. cur_obs feeds three things and nothing else:
--   1. getWindowStatus() (logic.js:92) gate-locks the next-belt window until all three
--      current-belt gates pass — EXCEPT at White, which short-circuits. So of the 40, the
--      20 White rows change nothing operationally and the 20 non-White (7 Yellow, 10 Green,
--      3 Brown) read "Complete current belt assessments first" until a real observation is
--      recorded. That lock is the intended outcome, not a side effect.
--   2. calcPoints() (logic.js) — each cleared gate drops 50 points. Points are computed
--      client-side on every render; `staff` has no stored points column, so there is
--      nothing else to re-derive.
--   3. Display: the "Observation Gate Passed" stat card and the profile gate cards move
--      from Passed to Not Started.
-- The way back in is the assessor's Record Assessment modal (type Observation, target belt
-- = the staffer's CURRENT belt), which routes to submitAssessment() -> cur_obs. The
-- candidate-facing observation console is a NEXT-belt gate by design (requestObservation
-- is only ever called with nextBelt) and writes nxt_obs, so it cannot clear this.
--
-- DRY RUN, proven against prod 2026-09-11 (whole body run with `rollback` in place of
-- `commit`, nothing persisted — re-checked after: cur_obs='pass' still 42, backup table
-- absent). It reported: would_clear 40, backup_rows 40, now_null 40, left_pass 2,
-- cur_comp+cur_sim still pass on all 40, newly window-locked (non-White) 20.
--
-- ROLLBACK. Wrapped: §1 snapshots the pre-state into a table that survives the run. To undo:
--   update public.staff s set cur_obs = b.cur_obs
--     from public.staff_obs_gate_backup_1224 b where b.id = s.id;
--   drop table public.staff_obs_gate_backup_1224;
-- Keep the backup table until #1224 is closed out and the read-back is on the ledger.

begin;

-- ── 1. Snapshot (the rollback) ─────────────────────────────────────────────────
create table if not exists public.staff_obs_gate_backup_1224 (
  id          uuid primary key,
  belt        text,
  cur_obs     text,
  backed_up_at timestamptz not null default now()
);

comment on table public.staff_obs_gate_backup_1224 is
  '#1224 rollback: staff.cur_obs as it stood before migration 20260912120000 cleared the synthetic placement pass. Drop once the correction is confirmed on the ledger.';

-- No RLS policies: service role / migration only, exactly like every other one-shot
-- correction table. Enabling RLS with zero policies denies every client outright.
alter table public.staff_obs_gate_backup_1224 enable row level security;

-- ── 2. The set: cur_obs='pass' with no observation evidence of any kind ────────
create temporary table _obs_reset_targets on commit drop as
select s.id, s.belt, s.cur_obs
from public.staff s
where s.cur_obs = 'pass'
  and not exists (select 1 from public.observations o where o.staff_id = s.id)
  and not exists (
    select 1 from jsonb_array_elements(coalesce(s.history, '[]'::jsonb)) h
    where h->>'type' ilike '%observ%'
  );

insert into public.staff_obs_gate_backup_1224 (id, belt, cur_obs)
select t.id, t.belt, t.cur_obs from _obs_reset_targets t
on conflict (id) do nothing;

-- ── 3. Clear the gate. cur_comp and cur_sim are untouched on purpose ──────────
update public.staff s
set cur_obs = null, updated_at = now()
from _obs_reset_targets t
where s.id = t.id;

-- ── 4. Assert before commit. 40 is the number counted live on 2026-09-11; a drift
--      either way means the population moved and this needs re-reading, not running.
do $$
declare
  v_cleared int;
  v_left    int;
begin
  select count(*) into v_cleared from _obs_reset_targets;
  select count(*) into v_left from public.staff where cur_obs = 'pass';

  if v_cleared <> 40 then
    raise exception '#1224: expected 40 rows to clear, found % — re-read the population before running', v_cleared;
  end if;
  -- The 2 evidence-bearing rows must survive untouched.
  if v_left <> 2 then
    raise exception '#1224: expected 2 evidence-bearing rows to remain at cur_obs=pass, found %', v_left;
  end if;

  raise notice '#1224: cleared % synthetic observation passes, % evidence-bearing rows left in place', v_cleared, v_left;
end $$;

commit;

-- ── Verify (read back from prod, after the run) ───────────────────────────────
--   select count(*) from public.staff where cur_obs = 'pass';               -- expect 2
--   select count(*) from public.staff_obs_gate_backup_1224;                 -- expect 40
--   select belt, count(*) from public.staff
--    where id in (select id from public.staff_obs_gate_backup_1224)
--      and cur_obs is null group by 1;      -- expect White 20, Yellow 7, Green 10, Brown 3
--   -- competency/simulation must be untouched by this migration:
--   select count(*) from public.staff
--    where id in (select id from public.staff_obs_gate_backup_1224)
--      and cur_comp = 'pass' and cur_sim = 'pass';                          -- expect 40
