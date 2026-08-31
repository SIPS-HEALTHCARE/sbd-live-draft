#!/usr/bin/env node
/* ============================================================================
 * verify-endoscopy-module.js — T108 / #720 acceptance harness
 *
 * Done-when (Iggie): a leader assigns Flexible Endoscope Reprocessing to one
 * named person; that person sees it; nobody else at their belt level does;
 * the true/false gate scores itself; the observation gate carries the 28
 * items; the leader can complete the module; no facility-wide or belt-driven
 * trigger exists for it.
 *
 * The five ways this can silently break:
 *   1. 'en-01' leaks into FOUNDATIONS_MODULES or assignAllModules() — the
 *      exact facility-wide/belt-driven trigger the client forbade.
 *   2. A stale/live 'en-*' row turns the Foundations "N/10" convention into
 *      N/11 (the same class of bug T92/T92a guarded against for Scripts).
 *   3. The 14-item Knowledge gate (8 T/F + 6 fill-blank) drifts from the
 *      manual's answer key, or the 100%-required pass rule regresses to a
 *      percentage threshold (reopening the guessing loophole this was built
 *      to close — see docs/decisions/2026-08-28-t108-endoscopy-build.md).
 *   4. The 28-item / 5-group Observation checklist or the 4 Written-Answer
 *      items drift from the Preceptor Guide's Competency Verification.
 *   5. The answer-key hint meant for leaders leaks into the staff-facing view.
 *
 * Run:  node scripts/verify-endoscopy-module.js
 * Exit 0 only if every assertion passes.
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const UI = fs.readFileSync(path.join(root, 'src/js/ui-views.js'), 'utf8');
const ENDO = fs.readFileSync(path.join(root, 'src/js/endoscopy.js'), 'utf8');
const FND = fs.readFileSync(path.join(root, 'src/js/foundations.js'), 'utf8');
const HTML = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function liftBlock(src, startsWith, file) {
  const lines = src.split('\n');
  const start = lines.findIndex(l => l.startsWith(startsWith));
  if (start === -1) throw new Error('not found in ' + file + ': ' + startsWith);
  let depth = 0, started = false;
  for (let i = start; i < lines.length; i++) {
    const opens = (lines[i].match(/[{[]/g) || []).length;
    const closes = (lines[i].match(/[}\]]/g) || []).length;
    depth += opens - closes;
    if (opens > 0) started = true;
    if (started && depth <= 0) return lines.slice(start, i + 1).join('\n');
  }
  throw new Error('unterminated block in ' + file + ': ' + startsWith);
}
function liftDecl(src, name, file) {
  const m = src.match(new RegExp('^const ' + name + " = '[^']*';$", 'm'));
  if (!m) throw new Error('const ' + name + ' must be declared in ' + file);
  return m[0];
}

const sandbox = new Function(
  liftDecl(FND, 'SCRIPTS_MODULE_ID', 'foundations.js') + '\n' +
  liftDecl(FND, 'ENDO_MODULE_PREFIX', 'foundations.js') + '\n' +
  'const DB = {};\n' +
  liftBlock(FND, 'function getFoundationsAssignments', 'foundations.js') + '\n' +
  liftBlock(ENDO, 'const ENDOSCOPY_MODULES = [', 'endoscopy.js') + '\n' +
  liftBlock(ENDO, 'function getEndoAssignments', 'endoscopy.js') + '\n' +
  liftBlock(ENDO, 'function endoGatePassed', 'endoscopy.js') + '\n' +
  liftBlock(ENDO, 'function endoObsReady', 'endoscopy.js') + '\n' +
  'const toast=()=>{}; const _fndSaveProgress=()=>{}; const _fndSaveAssignment=()=>{};' +
  ' const _fndSaveAssignmentStatus=()=>{};\n' +
  liftBlock(ENDO, 'function assignEndoModule', 'endoscopy.js').replace(/getStaff/g, '(()=>null)') + '\n' +
  liftBlock(ENDO, 'function saveEndoGateScore', 'endoscopy.js') + '\n' +
  liftBlock(ENDO, 'function markEndoG3Item', 'endoscopy.js') + '\n' +
  liftBlock(ENDO, 'function _endoNormalize', 'endoscopy.js') + '\n' +
  'return { DB, getFoundationsAssignments, getEndoAssignments, ENDOSCOPY_MODULES,' +
  ' endoGatePassed, endoObsReady, assignEndoModule, saveEndoGateScore, markEndoG3Item, _endoNormalize };'
)();

const { DB, getFoundationsAssignments, getEndoAssignments, ENDOSCOPY_MODULES,
        endoGatePassed, endoObsReady, assignEndoModule, saveEndoGateScore,
        markEndoG3Item, _endoNormalize } = sandbox;
const m = ENDOSCOPY_MODULES[0];

let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('  \x1b[32m✓\x1b[0m ' + msg); }
  else { failed++; console.log('  \x1b[31m✗ ' + msg + '\x1b[0m'); }
}

console.log('\nT108 / #720 — Endoscopy modules, assignable to named people\n');

console.log('1. No facility-wide or belt-driven trigger exists');
ok(!/FOUNDATIONS_MODULES\s*=\s*\[[^]*en-01/.test(FND.slice(0, FND.indexOf(']', FND.indexOf('FOUNDATIONS_MODULES')))),
  "'en-01' does not appear inside the FOUNDATIONS_MODULES array literal");
const assignAllBody = liftBlock(FND, 'function assignAllModules', 'foundations.js');
ok(!/ENDOSCOPY_MODULES|en-0/.test(assignAllBody),
  'assignAllModules() (the onboarding "All 10" button) never references endoscopy');
ok(!/ENDOSCOPY_MODULES/.test(FND.replace(/\/\/.*$/gm, '')),
  'foundations.js never merges ENDOSCOPY_MODULES outside of an explanatory comment');

console.log('\n2. The Foundations "N/10" convention stays honest with an en-01 row present');
DB.foundationsAssignments = [
  { staffId: 'staff-1', moduleId: 'fm-01', status: 'completed' },
  { staffId: 'staff-1', moduleId: 'fm-04', status: 'assigned' },
  { staffId: 'staff-1', moduleId: 'en-01', status: 'assigned' },
  { staffId: 'staff-2', moduleId: 'en-01', status: 'completed' }
];
const a1 = getFoundationsAssignments('staff-1');
ok(a1.length === 2, 'a staffer with 2 Foundations modules + endoscopy reads back as 2, not 3');
ok(!a1.some(a => a.moduleId.startsWith('en-')), 'no en-* row in the Foundations accessor output');
ok(getFoundationsAssignments('staff-2').length === 0,
  'a staffer with ONLY endoscopy assigned shows zero Foundations modules');
ok(getEndoAssignments('staff-1').length === 1 && getEndoAssignments('staff-1')[0].moduleId === 'en-01',
  'the endoscopy accessor sees exactly the en-* rows, scoped to the requested staffer');
ok(getEndoAssignments('staff-3').length === 0, 'an unassigned staffer sees nothing (visibility, not lock)');

console.log('\n3. Gate 1 — 14 items, matches the manual\'s answer key, ALL required to pass');
ok(m.questions.length === 14, 'module carries 14 knowledge items, got ' + m.questions.length);
const tf = m.questions.filter(q => q.type === 'tf');
const fill = m.questions.filter(q => q.type === 'fill');
ok(tf.length === 8 && fill.length === 6, '8 True/False + 6 fill-in-the-blank, got ' + tf.length + '/' + fill.length);
const expectedTF = [1, 1, 0, 1, 1, 0, 0, 1]; // 1=False, 0=True, per the manual's Answer Key §A
ok(tf.every((q, i) => q.ans === expectedTF[i]),
  'True/False answers match the manual Answer Key §A verbatim (1-F,2-F,3-T,4-F,5-F,6-T,7-T,8-F)');
const expectedFill = ['immediately', 'removed', 'clean', 'minimum effective concentration', 'dry', 'distal'];
ok(fill.every((q, i) => q.accepted.map(_endoNormalize).includes(expectedFill[i])),
  'fill-in-the-blank accepted answers match the manual Answer Key §B verbatim');
ok(_endoNormalize('Immediately.') === _endoNormalize('immediately'),
  'normalization is case/whitespace/trailing-period insensitive');

console.log('\n4. Pass rule requires ALL 14 correct — not a percentage threshold (guessing fix, 2026-08-28)');
DB.foundationsProgress = [];
let p = saveEndoGateScore('s', 'en-01', 13, 14);
ok(p.g1.status !== 'pass', '13 of 14 correct does NOT pass');
p = saveEndoGateScore('s', 'en-01', 14, 14);
ok(p.g1.status === 'pass' && endoGatePassed(p.g1), '14 of 14 correct passes');
ok(!/>=\s*80/.test(liftBlock(ENDO, 'function saveEndoGateScore', 'endoscopy.js')),
  'saveEndoGateScore contains no 80%-style threshold — pass is score===total only');

console.log('\n5. Gate 2 is seeded pre-passed (no scenario bank exists — D2, design note 2026-08-28)');
const assignBody = liftBlock(ENDO, 'function assignEndoModule', 'endoscopy.js');
ok(/g2:\{status:'pass'/.test(assignBody), 'assignEndoModule seeds g2 as already-passed');
ok(!/'gate2'/.test(ENDO) && !/Gate 2: Simulation/.test(ENDO),
  'no Gate 2 tab exists in the staff-facing module viewer');

console.log('\n6. Gate 3 — 28 observation items in the Preceptor Guide\'s 5 groups + 4 Written Answers');
ok(m.observations.length === 28, 'module carries 28 observation items, got ' + m.observations.length);
const groupCounts = {};
m.observations.forEach(o => { groupCounts[o.group] = (groupCounts[o.group] || 0) + 1; });
const expectedGroups = { 'Pre-Cleaning & Transport': 4, 'Leak Testing': 6, 'Manual Cleaning': 9,
  'HLD, Rinse, Dry, Storage': 7, 'Documentation': 2 };
ok(JSON.stringify(groupCounts) === JSON.stringify(expectedGroups),
  'group sizes match the Preceptor Guide exactly: ' + JSON.stringify(groupCounts));
ok(m.writtenAnswers.length === 4, '4 written-answer items (Final Assessment §C, questions 15-18), got ' + m.writtenAnswers.length);
ok(m.writtenAnswers.every(w => typeof w.key === 'string' && w.key.length > 0),
  'every written-answer item carries a marking-hint key for the leader');
const ids = m.observations.map(o => o.id).concat(m.writtenAnswers.map(w => w.id));
ok(new Set(ids).size === ids.length, 'all 32 G3 item ids are unique');

console.log('\n7. Observation unlocks on the Knowledge gate alone (G2 is a seeded stand-in, not a real gate)');
ok(endoObsReady({ g1: { status: 'pass' } }) === true, 'ready once G1 has passed');
ok(endoObsReady({ g1: { status: 'open' } }) === false, 'not ready before G1 passes');
ok(!/endoObsReady[^]*?g2/.test(liftBlock(ENDO, 'function endoObsReady', 'endoscopy.js')),
  'endoObsReady never inspects g2');

console.log('\n8. The leader-only answer-key hint never reaches the staff-facing renderer');
const staffG3 = liftBlock(ENDO, 'function renderEndoG3View', 'endoscopy.js');
const leaderDetail = liftBlock(ENDO, 'function hEndoStaffDetail', 'endoscopy.js');
ok(!/\.key\b/.test(staffG3), 'renderSEndoscopy\'s G3 view (staff-facing) never reads the .key field');
ok(/\.key\b/.test(leaderDetail), 'hEndoStaffDetail (leader-facing) shows the .key marking hint');

console.log('\n9. Assign is refused to assessors/staff_admin, same as every other F&I module');
const endoCanAssignBody = liftBlock(ENDO, 'function endoCanAssign', 'endoscopy.js');
["'staff_admin'", "'assessor'", "'staff_member'"].forEach(role =>
  ok(endoCanAssignBody.includes(role), 'endoCanAssign() excludes ' + role));

console.log('\n10. Wiring: nav hidden by default, script load order, cache-busts bumped');
ok(/id="s-nav-endoscopy"[^>]*style="display:none"/.test(HTML),
  'the staff nav item is hidden by default (revealed only by applyEndoscopyNavGate)');
const order = ['foundations.js', 'endoscopy.js', 'ui-views.js'].map(f => HTML.indexOf('src/js/' + f));
ok(order[0] < order[1] && order[1] < order[2],
  'script tag order: foundations.js -> endoscopy.js -> ui-views.js');
ok(/foundations\.js\?v=(\d+)/.test(HTML) && /endoscopy\.js\?v=(\d+)/.test(HTML),
  '?v= cache-bust present on both foundations.js and endoscopy.js');
ok(/applyEndoscopyNavGate/.test(UI), 'ui-views.js calls applyEndoscopyNavGate() in enterPortal');
ok(/'s-endoscopy'/.test(UI), 'ui-views.js registers the s-endoscopy view');

console.log('\n11. DB guard: g2 is server-owned for en- modules, g1 protection intact');
// The defect Sriman found on the live DB 2026-08-31: sbd_fi_progress_guard reset
// the client's seeded g2 pass on every leader INSERT (is_owner false) and pinned it
// on every leader UPDATE, so `complete` — derived from all three gates — could
// never be true for a module that has only two. Asserted here rather than in SQL
// because re-applying 20260703120000 silently restores the old body (that file's
// own RE-RUN HAZARDS note describes this class), and the symptom is invisible until
// a leader has already walked a real person through all 28 observation items.
const MIG = (function () {
  const dir = path.join(root, 'supabase/migrations');
  const f = fs.readdirSync(dir).filter(x => /_720_endoscopy_no_simulation_gate\.sql$/.test(x));
  ok(f.length === 1, 'the #720 endoscopy guard migration exists (found ' + f.length + ')');
  return f.length ? fs.readFileSync(path.join(dir, f[0]), 'utf8') : '';
})();
const guardBody = MIG.slice(MIG.indexOf('create or replace function public.sbd_fi_progress_guard'));
const endoBranch = guardBody.indexOf("new.module_id like 'en-%'");
const actorBlock = guardBody.indexOf('if tg_op = \'UPDATE\' then');
const completeCalc = guardBody.indexOf('new.complete :=');
ok(endoBranch > -1, 'the guard carries the en-% branch');
ok(endoBranch > actorBlock,
  'the en-% g2 override sits AFTER the actor checks (else the leader INSERT reset and the leader UPDATE pin both still win)');
ok(endoBranch < completeCalc,
  'the en-% g2 override sits BEFORE the `complete` derivation (else completion still reads the un-overridden g2)');
ok(/new\.g2 := '\{"status":"pass"[^']*\}'::jsonb;/.test(guardBody),
  'the override sets g2 to a passed shape, so the unchanged three-gate rule reduces to g1 && g3');
ok(/"na":true/.test(guardBody),
  'the forced g2 is marked "na":true, so an unearned pass is never mistaken for a real one');
ok(/if not is_owner then\s*\n\s*new\.g1 := '\{"status":"open"/.test(guardBody),
  'the non-owner INSERT reset of g1 is still there — a leader still cannot seed a passed Knowledge gate (20260703120000 P2)');
ok(!/new\.g1 := '\{"status":"pass"/.test(guardBody),
  'nothing in the guard ever force-passes g1');
ok(guardBody.includes("module_id like 'en-%'") && !/instrument/.test(guardBody.slice(endoBranch, completeCalc)),
  'the branch keys on the en- prefix alone; instrument_progress shares this guard and can never match it');

console.log('\n' + (failed === 0
  ? '\x1b[32mAll ' + passed + ' assertions passed.\x1b[0m\n'
  : '\x1b[31m' + failed + ' of ' + (passed + failed) + ' assertions FAILED.\x1b[0m\n'));
process.exit(failed === 0 ? 0 : 1);
