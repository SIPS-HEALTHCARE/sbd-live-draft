#!/usr/bin/env node
/* ============================================================================
 * verify-1208-typed-response.js — #1208 (Shawn board 164) acceptance harness
 *
 * Done-when: a candidate types an answer on a module's simulation question,
 * submitting it writes one row carrying the question, the staff member and the
 * attempt, and the row reads back.
 *
 * Drives the real in-memory engine (foundations.js + instruments.js loaded whole
 * with their globals stubbed) and asserts the bodies the client would POST, then
 * checks the migration's RLS shape statically.
 * Run:  node scripts/verify-1208-typed-response.js   (exit 0 only if all pass)
 * ==========================================================================*/
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..');
const FND = fs.readFileSync(path.join(root, 'src/js/foundations.js'), 'utf8');
const INST = fs.readFileSync(path.join(root, 'src/js/instruments.js'), 'utf8');
const API = fs.readFileSync(path.join(root, 'src/js/api-supabase.js'), 'utf8');
const HTML = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const MIG = fs.readFileSync(path.join(root, 'supabase/migrations/20260912140000_1208_module_gate_responses.sql'), 'utf8');

const STAFF = { id: 'staff-1', fid: 'fac-1', name: 'Pat Tech', belt: 'White', role: 'Tech' };
const DB = { staff: [STAFF], facilities: [{ id: 'fac-1', name: 'F1' }], foundationsAssignments: [], foundationsProgress: [], instrumentAssignments: [], instrumentProgress: [] };
const ST = { staffId: STAFF.id, user: { name: 'Lead', role: 'facility_admin' } };

const posted = [];                                 // every logGateResponses body
const SB = {
  createFoundationsAssignment: () => Promise.resolve(), createInstrumentAssignment: () => Promise.resolve(),
  upsertFoundationsProgress: () => Promise.resolve(), upsertInstrumentProgress: () => Promise.resolve(),
  updateFoundationsAssignmentStatus: () => Promise.resolve(), updateInstrumentAssignmentStatus: () => Promise.resolve(),
  logGateResponses: rows => (posted.push(rows), Promise.resolve()),
};

// One fake textarea per sim-answer id; everything else gets the shared container.
const boxes = new Map();
let lastHTML = '';
const el = { set innerHTML(v) { lastHTML = v; }, get innerHTML() { return lastHTML; }, scrollTop: 0 };
const document = {
  getElementById: id => {
    if (!/-sim-ans-/.test(id)) return el;
    if (!boxes.has(id)) boxes.set(id, { value: '', disabled: false });
    return boxes.get(id);
  },
  querySelector: () => null,                       // nothing selected -> score 0, attempt still counts
  querySelectorAll: () => [],
};

const api = new Function('DB','ST','SB','IS_LIVE','document','getStaff','toast','fullName','Security','shuffleArray','handleSyncError',
  FND + '\n' + INST + '\n' +
  'return {assignModule,assignInstModule,renderFndGateAssessment,renderInstGate,submitFndGate,submitInstGate,' +
  'getModuleGates,getInstModuleGates,fiSimAnswerHTML,fiSaveSimAnswers,FOUNDATIONS_MODULES,INSTRUMENT_MODULES,FND_GATE_DRAW,FI_SIM_ANSWER_MAX};'
)(DB, ST, SB, true, document, id => DB.staff.find(s => s.id === id), () => {}, s => s.name, { sanitize: x => x }, a => a.slice(), () => {});

let n = 0; const ok = (c, m) => { assert(c, m); n++; };
const box = id => document.getElementById(id);   // creates it on first touch, as the browser would
const M = api.FOUNDATIONS_MODULES[0], IM = api.INSTRUMENT_MODULES[0];
const drawOf = m => Math.min(api.FND_GATE_DRAW, m.simulations.length);

// ── 1. the box renders on G2 and ONLY on G2 ─────────────────────────────────
api.assignModule(STAFF.id, M.id, 'Lead', 'onboarding', null);
const g1HTML = api.renderFndGateAssessment(M, STAFF, 'g1', M.questions, 'K', 'd');
ok(!/-sim-ans-/.test(g1HTML), 'G1 knowledge gate has no typed box');
const g2HTML = api.renderFndGateAssessment(M, STAFF, 'g2', M.simulations, 'S', 'd');
const boxCount = (g2HTML.match(/id="fnd-sim-ans-/g) || []).length;
ok(boxCount === drawOf(M), 'G2 renders one typed box per drawn scenario (' + boxCount + ')');
ok(/<textarea/.test(g2HTML) && g2HTML.includes('maxlength="' + api.FI_SIM_ANSWER_MAX + '"'), 'box is a capped textarea');
ok(/optional/i.test(g2HTML), 'box is labelled optional');
ok(!/<textarea[^>]*\brequired\b/.test(g2HTML) && /onclick="submitFndGate/.test(g2HTML), 'box is not required and Submit stays unconditional');

// ── 2. submitting writes one row per NON-EMPTY box ──────────────────────────
box('fnd-sim-ans-' + M.id + '-0').value = '  Quarantine the tray and tell the charge tech.  ';
box('fnd-sim-ans-' + M.id + '-2').value = 'Re-run decontamination, then document it.';
api.submitFndGate(M.id, 'g2');
ok(posted.length === 1, 'one POST for the attempt');
const rows = posted[0];
ok(rows.length === 2, 'only the two answered scenarios are written, not all ' + drawOf(M));
const r0 = rows[0];
ok(r0.staff_id === STAFF.id && r0.module_id === M.id && r0.gate === 'g2', 'row carries staff, module, gate');
ok(r0.question_ref === 'sim-0' && rows[1].question_ref === 'sim-2', 'question_ref is the bank index of the scenario answered');
ok(r0.question_text === M.simulations[0].s, 'question_text is the scenario as the candidate saw it');
ok(r0.answer_text === 'Quarantine the tray and tell the charge tech.', 'answer_text is trimmed, not padded');
ok(r0.attempt_no === 1, 'attempt_no is 1 on the first attempt');
ok(!('is_correct' in r0) && !('score' in r0), 'no scoring fields — that is #1209');
// the row ties back to the attempt the progress engine just recorded
ok(api.getModuleGates(STAFF.id, M.id).g2.attempts.length === r0.attempt_no, 'attempt_no matches the g2.attempts[] position');
ok(box('fnd-sim-ans-' + M.id + '-0').disabled === true, 'boxes lock once the attempt is graded');

// ── 3. a second attempt increments attempt_no ───────────────────────────────
api.renderFndGateAssessment(M, STAFF, 'g2', M.simulations, 'S', 'd');
boxes.forEach(b => { b.value = ''; b.disabled = false; });
box('fnd-sim-ans-' + M.id + '-1').value = 'Second pass answer.';
api.submitFndGate(M.id, 'g2');
ok(posted.length === 2 && posted[1][0].attempt_no === 2, 'second attempt writes attempt_no 2');

// ── 4. nothing typed -> nothing written, and the gate still scores ──────────
api.renderFndGateAssessment(M, STAFF, 'g2', M.simulations, 'S', 'd');
boxes.forEach(b => { b.value = ''; b.disabled = false; });
const before = posted.length, attemptsBefore = api.getModuleGates(STAFF.id, M.id).g2.attempts.length;
api.submitFndGate(M.id, 'g2');
ok(posted.length === before, 'an empty attempt posts nothing');
ok(api.getModuleGates(STAFF.id, M.id).g2.attempts.length === attemptsBefore + 1, 'the attempt is still scored and saved');

// ── 5. Instruments goes through the SAME helpers (Standards B6) ─────────────
ok(!/function fiSimAnswerHTML|function fiSaveSimAnswers/.test(INST), 'instruments.js does not redefine the helpers');
ok(/function fiSimAnswerHTML/.test(FND) && /function fiSaveSimAnswers/.test(FND), 'helpers are defined once, in foundations.js');
api.assignInstModule(STAFF.id, IM.id, 'Lead', 'onboarding', null);
const iG1 = api.renderInstGate(IM, STAFF, 'g1', IM.questions, 'K', 'd');
ok(!/-sim-ans-/.test(iG1), 'instruments G1 has no typed box');
const iG2 = api.renderInstGate(IM, STAFF, 'g2', IM.simulations, 'S', 'd');
ok((iG2.match(/id="inst-sim-ans-/g) || []).length === Math.min(api.FND_GATE_DRAW, IM.simulations.length), 'instruments G2 renders the boxes');
ok(!/id="fnd-sim-ans-/.test(iG2), 'instruments boxes use their own id prefix — no DOM collision');
box('inst-sim-ans-' + IM.id + '-0').value = 'Inspect the jaws under magnification.';
const beforeI = posted.length;
api.submitInstGate(IM.id, 'g2');
ok(posted.length === beforeI + 1, 'instruments submit posts');
ok(posted[posted.length - 1][0].module_id === IM.id && posted[posted.length - 1][0].gate === 'g2' && posted[posted.length - 1][0].attempt_no === 1, 'instruments row carries module, gate, attempt');

// ── 6. wiring: the API method, the cache-busts ─────────────────────────────
ok(/logGateResponses\(rows\)/.test(API) && /module_gate_responses/.test(API), 'SB.logGateResponses posts to module_gate_responses');
// Cache-busters only ever go up; assert the floor #1208 shipped, not the number.
const vAtLeast = (f, min) => { const m = HTML.match(new RegExp(f.replace('.', '\\.') + '\\?v=(\\d+)')); return !!m && +m[1] >= min; };
ok(vAtLeast('foundations.js', 27) && vAtLeast('instruments.js', 19) && vAtLeast('api-supabase.js', 72), 'cache-busters bumped');

// ── 7. the migration's RLS shape ───────────────────────────────────────────
ok(/create table if not exists public\.module_gate_responses/.test(MIG), 'migration creates the table');
ok(/create policy mgr_self_insert/.test(MIG) && /create policy mgr_select/.test(MIG), 'insert + select policies');
ok(!/create policy \w+ on public\.module_gate_responses\s+for (update|delete)/i.test(MIG), 'append-only: no UPDATE/DELETE policy');
ok(/create policy sbd_mfa_gate on public\.module_gate_responses\s+as restrictive/.test(MIG), 'T33 MFA gate written out (the prefix loop does not reach this name)');
ok(/revoke all on public\.module_gate_responses from anon/.test(MIG), 'anon revoked (the #1228 lesson)');
ok(/grant select, insert on public\.module_gate_responses to authenticated/.test(MIG), 'authenticated gets exactly select + insert');
ok(/sbd_fi_leader_scope\(staff_id\)/.test(MIG), 'leader reads reuse sbd_fi_leader_scope');
// The card named aip_question_responses; nothing may actually reach it (its FKs
// point into the AIP schema retired in #61). Endpoints only — the prose in the
// design comments names the table on purpose.
ok(!/rest\/v1\/aip_/.test(FND + INST + API), 'no client endpoint touches the retired AIP tables');

console.log('verify-1208-typed-response: ' + n + ' assertions passed');
