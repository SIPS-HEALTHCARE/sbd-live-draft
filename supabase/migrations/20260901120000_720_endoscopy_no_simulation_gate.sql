-- 20260901120000_720_endoscopy_no_simulation_gate.sql
-- #720 (ledger T108) — endoscopy leader assignments never complete.
--
-- SYMPTOM (found by Sriman on the live database, 2026-08-31): a leader assigns
-- en-01 to a named staff member; the staff member passes the Knowledge gate and
-- the leader confirms all 28 observation items, but foundations_progress.complete
-- stays false and the assignment never flips to 'completed'. The app's own view
-- of the module says complete. The row and the screen disagree.
--
-- ROOT CAUSE, in the DB and not in endoscopy.js — two independent halves, both in
-- public.sbd_fi_progress_guard() (trg_fi_fnd_prog_guard, BEFORE INSERT OR UPDATE
-- on foundations_progress). Current live body is from 20260703120000 §3, NOT the
-- original 20260702130000 §4b; the original did not have half 1 at all, which is
-- why this only shows up now:
--
--   1. INSERT branch, 20260703120000 §3 lines "if not is_owner then ... new.g2 :=
--      open". assignEndoModule() (src/js/endoscopy.js) seeds the progress row with
--      g2 pre-passed, because endoscopy has NO simulation gate — no scenario bank
--      exists for it (D2, docs/decisions/2026-08-28-t108-endoscopy-build.md). The
--      insert is a leader assigning to somebody else, so is_owner is false and the
--      guard rewrites that seeded g2 straight back to open. The client does send
--      gate 2 as passed; the guard silently discards it. Every leader assignment
--      hits this — which is every endoscopy assignment, since #720's whole point is
--      that endoscopy is assign-by-name-only, never self-started.
--      The seed is then never recovered, and this is the part worth being precise
--      about: endoscopy.js only seeds g2 pass on the `if(!p)` branch, i.e. when it
--      has no progress row at all. Once the row exists, every later write echoes
--      back the g2 it LOADED from the server (_fndProgToBackend sends the whole
--      row), which is now open. The owner's own write cannot heal it either — it
--      faithfully re-sends open. And the UPDATE branch pins it for everyone else:
--      "if not is_owner then new.g2 := old.g2" on each leader observation
--      confirmation. One discarded insert value strands the row permanently.
--
--   2. `complete` is derived from all three gates being 'pass'. Endoscopy completes
--      on gates 1 and 3 only. Even if half 1 were fixed by hand, a two-gate module
--      measured against a three-gate rule can only complete by way of a g2 value
--      nobody earned.
--
-- WHY NOT "exempt en- modules from the guard": half 1's reset exists for a real
-- reason — 20260703120000 §2 (P2) closed the hole where a leader could seed a
-- brand-new row with passed quizzes and, via trg_fi_fnd_prog_status_sync, a
-- completed assignment for a staff member who never sat the test. Exempting en-
-- modules from that reset would reopen it for g1, the 14-of-14 Knowledge gate that
-- is endoscopy's only real quiz. That is the one gate that must stay unforgeable.
--
-- FIX: stop treating g2 as a gate for endoscopy and let the SERVER own it. For
-- module_id like 'en-%' the guard overwrites g2 with an explicitly not-applicable
-- pass, after the actor checks, so it holds on INSERT and UPDATE and for every
-- actor — leader, owner, service role. Two consequences, one line:
--   * the client no longer has to seed g2 and can no longer be overridden on it;
--   * the existing three-gate `complete` derivation now reads g1 && g3 && (forced
--     pass), i.e. exactly the two-gate rule endoscopy.js applies locally. The app
--     and the row agree without a second, endoscopy-shaped complete rule.
-- g1 keeps its non-owner INSERT reset untouched: the P2 protection stands, and a
-- leader still cannot seed a passed Knowledge gate for anybody.
--
-- The "na":true marker is deliberate: a g2 reading pass with no attempts, on a
-- module nobody ever sat a simulation for, must be self-evidently server-set and
-- not mistaken for an earned pass by a future reader or auditor. Frontend reads g2
-- key-by-key (status/score/attempts, foundations.js), so the extra key is inert,
-- and no endoscopy screen renders g2 at all.
--
-- SCOPE: 'en-' is endoscopy's own prefix (ENDO_MODULE_PREFIX, foundations.js:818)
-- and collides with nothing — foundations uses fm-*, instruments im-*/oi*-*,
-- scripts its own id. The guard is shared with instrument_progress, which can
-- therefore never match this branch; no table check is needed to keep it out.
--
-- APPLIED BY: the USER (Supabase MCP has no SBD prod access).
-- PRE-FLIGHT (read-only) — confirm the hardened body is what is actually live,
-- since this file is written against it:
--   select prosrc ~ 'if not is_owner then' as hardened_insert_live
--     from pg_proc where proname = 'sbd_fi_progress_guard';
--   Expected: true. If false, 20260703120000 is not applied — STOP and report,
--   because then only half 2 below applies and half 1 is not yet a live defect.
--
-- VERIFIED BEFORE WRITING, not reasoned about: the guard body, the two triggers and
-- the client's write sequence were replayed on a throwaway postgres 15. Against the
-- live 20260703120000 body the reported symptom reproduces exactly — after the
-- leader confirms G3: g1 pass, g2 OPEN, g3 pass, complete FALSE, assignment stuck
-- at 'assigned'. Against the body below the same sequence ends complete TRUE and
-- 'completed'. Also confirmed there: the §2 backfill flips a stranded row and syncs
-- its assignment, re-running it updates 0 rows, fm-01 behaviour is bit-identical
-- before and after, and a leader inserting en-01 with g1 forged to pass still has
-- that g1 reset to open (only g2 is server-owned).
--
-- SAFE TO RE-RUN. Idempotent: create or replace + a backfill that is a no-op once
-- the rows are already correct.
-- ROLLBACK: re-apply 20260703120000 §3 (restores the previous body), accepting
-- that endoscopy assignments stop completing again.

begin;

-- ----------------------------------------------------------------------------
-- 1. Guard: server-owned g2 for endoscopy. Body otherwise byte-identical to
--    20260703120000 §3 (actor checks, facility fill, D4 preserve, revoke
--    cascade, NULL-safe server-derived complete).
-- ----------------------------------------------------------------------------

create or replace function public.sbd_fi_progress_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  actor     uuid := auth.uid();
  is_leader boolean := false;
  is_owner  boolean := false;
begin
  if actor is not null then
    is_leader := public.sbd_fi_actor_role() in
                ('master_admin','admin','facility_admin','staff_admin','hospital','assessor')
      or lower(coalesce(auth.jwt()->>'email','')) in
        ('jjacobs@sipsconsults.com','izambrano@sipsconsults.com','dpayne@sipsconsults.com');
    is_owner  := (new.staff_id = actor)
      or exists (select 1 from public.sbd_portal_users u
                where u.auth_uid = actor and u.staff_id is not null
                  and u.staff_id::text = new.staff_id::text);

    if tg_op = 'UPDATE' then
      -- D4: only the owning staff member may change g1/g2; only leaders g3.
      if not is_owner  then new.g1 := old.g1; new.g2 := old.g2; end if;
      if not is_leader then new.g3 := old.g3; end if;
    else
      -- INSERT: a non-owner cannot seed quiz results; a non-leader cannot
      -- seed confirmed observations. Shapes match the column defaults.
      if not is_owner then
        new.g1 := '{"status":"open","score":0,"attempts":[]}'::jsonb;
        new.g2 := '{"status":"open","score":0,"attempts":[]}'::jsonb;
      end if;
      if not is_leader then new.g3 := '{"status":"open","items":[]}'::jsonb; end if;
    end if;
  end if;

  -- #720: endoscopy (en-%) has no simulation gate — no scenario bank exists for
  -- it. g2 is not a gate here, so the server owns it rather than asking the
  -- client to seed a value the actor checks above would then discard. Placed
  -- AFTER those checks on purpose: it must win on the leader INSERT (which
  -- resets g2 to open) and on the leader UPDATE (which pins g2 to old), which
  -- between them are every write an assign-by-name-only module ever gets.
  -- Completion then falls out of the unchanged three-gate rule below as g1 && g3.
  if new.module_id like 'en-%' then
    new.g2 := '{"status":"pass","score":100,"attempts":[],"na":true}'::jsonb;
  end if;

  if new.facility_id is null then
    select s.fid into new.facility_id from public.staff s where s.id = new.staff_id;
  end if;

  -- Revoke cascade (§8.2): an explicitly-unconfirmed item forces g3 out of 'pass'
  -- (the frontend leaves status 'pass' when an educator un-confirms an item).
  if (new.g3->>'status') = 'pass' and exists (
      select 1 from jsonb_array_elements(coalesce(new.g3->'items','[]'::jsonb)) it
      where coalesce(it->>'confirmed','false') <> 'true'
    ) then
    new.g3 := jsonb_set(new.g3, '{status}', '"open"');
  end if;

  -- `complete` is server-derived: all three gates must be 'pass'.
  -- coalesce: a gate JSON missing "status" yields SQL NULL -> treat as false
  -- rather than aborting the write against the NOT NULL column.
  new.complete := coalesce(((new.g1->>'status') = 'pass'
              and (new.g2->>'status') = 'pass'
              and (new.g3->>'status') = 'pass'), false);
  new.updated_at := now();
  return new;
end $$;

-- ----------------------------------------------------------------------------
-- 2. Backfill the en- rows already stranded with g2 open by the old guard.
--    The UPDATE re-fires the guard, which forces g2 and recomputes `complete`;
--    trg_fi_fnd_prog_status_sync then flips any row whose g1+g3 already pass to
--    a 'completed' assignment. That sync is the point — these are the rows the
--    client has been staring at. Runs as service role (auth.uid() null), so the
--    actor branch is skipped entirely and no g1/g3 value is touched.
-- ----------------------------------------------------------------------------

update public.foundations_progress
   set g2 = g2                          -- guard overwrites it; this only fires the trigger
 where module_id like 'en-%'
   and g2 is distinct from '{"status":"pass","score":100,"attempts":[],"na":true}'::jsonb;

commit;

-- ----------------------------------------------------------------------------
-- POST-APPLY VERIFICATION (read-only)
-- ----------------------------------------------------------------------------
-- 1. Branch is live, and the g1 protection was NOT weakened on the way in:
--      select prosrc ~ 'en-%' as endo_branch_live,
--             prosrc ~ 'if not is_owner then' as g1_protection_intact
--        from pg_proc where proname = 'sbd_fi_progress_guard';
--      Expected: true, true.
-- 2. No endoscopy row is left with an un-passed g2:
--      select count(*) from public.foundations_progress
--       where module_id like 'en-%' and (g2->>'status') is distinct from 'pass';
--      Expected: 0.
-- 3. Row now agrees with the app: complete is exactly g1 pass and g3 pass:
--      select staff_id, module_id, g1->>'status' g1, g3->>'status' g3, complete
--        from public.foundations_progress where module_id like 'en-%' order by 1;
--      Expected: complete = true on precisely the rows showing g1 pass + g3 pass.
-- 4. Assignments followed the sync (no row complete-but-still-assigned):
--      select p.staff_id, p.module_id, p.complete, a.status
--        from public.foundations_progress p
--        join public.foundations_assignments a using (staff_id, module_id)
--       where p.module_id like 'en-%' and p.complete and a.status <> 'completed';
--      Expected: 0 rows.
-- 5. Non-endoscopy modules untouched — fm- rows keep the three-gate rule:
--      select count(*) from public.foundations_progress
--       where module_id like 'fm-%' and complete
--         and ((g1->>'status') <> 'pass' or (g2->>'status') <> 'pass'
--              or (g3->>'status') <> 'pass');
--      Expected: 0.
