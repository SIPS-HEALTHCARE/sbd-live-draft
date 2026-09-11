#!/usr/bin/env node
/* ============================================================================
 * verify-1224-observation-gate.js — #1224 (Shawn board 148, ledger T132)
 *
 * Done-when: a new placement shows observation as PENDING, not passed; a real
 * observation pass still lands; the stale rows are corrected.
 *
 * The defect: confirmPlacement() grandfathered all three current-belt gates.
 * Competency and Simulation are the two components a placement assessment
 * actually administers — those are truthful. Observation is not: nothing in the
 * placement flow observes anybody, so cur_obs='pass' was a gate with nothing
 * behind it.
 *
 * The three ways this comes back:
 *   1. cur_obs (or `o:'pass'`) creeps back into the confirmPlacement writes.
 *   2. The window engine's gate-lock is loosened to paper over the new PENDING
 *      state, which restores the original lie one layer down.
 *   3. The real writer (submitAssessment -> cur gate when targetBelt ===
 *      current belt) is refactored away, leaving no path to clear the gate.
 *
 * NOT in scope, deliberately: submitBeltOverride() (~line 11036) also writes
 * cur_obs='pass' on a promotion. That is an explicit, reason-gated, audited
 * master-admin override, not a placement, and board 148 scopes only the confirm
 * path — see the design note. Assertion 12 pins it so the decision is visible
 * rather than forgotten.
 *
 * Run:  node scripts/verify-1224-observation-gate.js   (exit 0 only if all pass)
 * ==========================================================================*/
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const UI = read('src/js/ui-views.js');
const LOGIC = read('src/js/logic.js');
const HTML = read('index.html');
const MIG = read('supabase/migrations/20260912120000_1224_observation_gate_reset.sql');

let n = 0; const ok = (c, m) => { assert(c, m); n++; };

// ── 1. The behaviour: run the real window engine ──────────────────────────────
// logic.js declares at load time and getWindowStatus() is the whole point of the
// change, so drive it rather than grepping for its shape.
const logic = new Function('window', 'beltIdx', 'daysAt',
  LOGIC + '\nreturn {getWindowStatus, calcPoints};'
).call(null, undefined,
  b => ['White', 'Yellow', 'Green', 'Blue', 'Brown', 'Black'].indexOf(b),
  () => 0);

const placed = belt => ({ belt, since: new Date().toISOString().slice(0, 10),
  cur: { c: 'pass', s: 'pass', o: null } });

ok(logic.getWindowStatus(placed('Yellow')).status === 'locked',
  'a freshly placed Yellow reads LOCKED: the observation gate is pending, not passed');
ok(/current belt assessments/i.test(logic.getWindowStatus(placed('Green')).label),
  'the lock tells the staffer what to do, it does not just say closed');
ok(logic.getWindowStatus(placed('White')).status !== 'locked',
  'White is exempt from the gate-lock, so the routine new-hire path is unaffected');
ok(logic.getWindowStatus({ belt: 'Yellow', since: '2026-09-11',
  cur: { c: 'pass', s: 'pass', o: 'pass' } }).status !== 'locked',
  'a REAL observation pass still opens the window — the gate works, it is just honest now');

// ── 2. The write: confirmPlacement grandfathers two gates, not three ──────────
const confirm = UI.slice(UI.indexOf('async function confirmPlacement'),
                         UI.indexOf('// ============================================================ OIP ENGINE'));
ok(confirm.length > 500 && confirm.length < 12000, 'confirmPlacement body located');
ok(/cur_comp:\s*'pass',\s*cur_sim:\s*'pass'\s*\}/.test(confirm),
  'the staff PATCH still grandfathers Competency and Simulation (the two the placement measures)');
// `cur_obs:` — the write shape. Prose mentions of the column in the comments are fine;
// what must not exist is a key/value pair putting it in the PATCH body.
ok(!/cur_obs\s*:/.test(confirm),
  'the staff PATCH assigns cur_obs nowhere — absent, so a genuine earlier pass is not cleared either');
ok(!/o:\s*'pass'/.test(confirm),
  'the in-memory mirror does not set the observation gate to pass');
ok(/Object\.assign\(\{c:null, s:null, o:null\}, s\.cur, \{c:'pass', s:'pass'\}\)/.test(confirm),
  'the in-memory mirror spreads the existing gates rather than replacing the object (§B11 habit)');

// ── 3. The real writer is still wired ────────────────────────────────────────
ok(/targetIdx===curIdx\)\{ s\.cur\[gateKey\]=raResult; \}/.test(UI),
  'submitAssessment still routes a current-belt result onto cur — the way a real observation lands');
ok(/type==='Competency'\?'c':type==='Simulation'\?'s':'o'/.test(UI),
  'Observation is still one of the three recordable assessment types');

// ── 4. The out-of-scope sibling, pinned so the decision stays visible ────────
const override = UI.slice(UI.indexOf('function submitBeltOverride'),
                          UI.indexOf('function renderHProfile'));
ok(/cur_obs:\s*isPromotion \? 'pass' : null/.test(override),
  'submitBeltOverride is UNCHANGED by #1224 (out of scope; see the design note) — ' +
  'if this fails, someone changed it: update the note and the ledger rather than this line');

// ── 5. The migration ─────────────────────────────────────────────────────────
ok(/^begin;/m.test(MIG) && /^commit;/m.test(MIG), 'the correction is wrapped in an explicit transaction');
ok(/staff_obs_gate_backup_1224/.test(MIG), 'the pre-state is snapshotted, so the run is reversible');
ok(/expected 40 rows to clear/.test(MIG),
  'the migration asserts its own count and refuses to run against a drifted population');
ok(/set cur_obs = null/.test(MIG) && !/set cur_comp/.test(MIG) && !/set cur_sim/.test(MIG),
  'the migration clears the observation gate only — competency and simulation are untouched');
ok(/not exists \(select 1 from public\.observations/.test(MIG)
   && /ilike '%observ%'/.test(MIG),
  'the target set is fail-safe: any observation trace at all keeps a row out of the clear');

// ── 6. Wiring: at or past #1224's number (later tasks bump it too) ───────────
const m = HTML.match(/ui-views\.js\?v=(\d+)/);
ok(!!m && Number(m[1]) >= 239, 'ui-views cache-buster is at or past 239');

console.log('verify-1224-observation-gate: ' + n + ' assertions passed');
