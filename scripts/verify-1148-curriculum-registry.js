#!/usr/bin/env node
/* ============================================================================
 * verify-1148-curriculum-registry.js — #1148 acceptance harness (board 134, T129)
 *
 * Done when: the table matches the constants row for row (count per curriculum
 * asserted), the Foundations and Instruments leader panels read the registry,
 * and nothing changes on screen for a leader.
 *
 * The three ways this silently breaks:
 *   1. A constant changes (module added, renamed, reordered) and nobody re-runs
 *      the seed — migration seed block and constants drift apart.
 *   2. A panel function is edited back to FOUNDATIONS_MODULES / INSTRUMENT_MODULES,
 *      so the registry is no longer what a leader sees.
 *   3. registryModules() joins wrong: a registry equal to the constants must
 *      render the identical id/num/title list, and an empty registry must fall
 *      back to the constant (the "nothing changes on screen" guarantee).
 *
 * Run:  node scripts/verify-1148-curriculum-registry.js
 * Prod read-back (after applying 20260908140000):
 *       supabase db query --linked -f supabase/verify/1148_curriculum_modules_check.sql
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');
const { registryRows, seedSql, GATE_SHAPES } = require('./curriculum-registry-seed');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const FND = read('src/js/foundations.js');
const INST = read('src/js/instruments.js');
const MIG = read('supabase/migrations/20260908140000_1148_curriculum_modules.sql');
const CHECK = read('supabase/verify/1148_curriculum_modules_check.sql');

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

let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('  \x1b[32m✓\x1b[0m ' + msg); }
  else { failed++; console.log('  \x1b[31m✗ ' + msg + '\x1b[0m'); }
}

const rows = registryRows();
const byCur = {};
rows.forEach(r => { byCur[r.curriculum] = (byCur[r.curriculum] || 0) + 1; });

console.log('\n#1148 — Curriculum registry (curriculum_modules)\n');

console.log('1. Registry rows derived from the constants');
const EXPECTED = { foundations: 10, instruments: 4, scripts: 1, endoscopy: 14, preceptor: 15 };
Object.keys(EXPECTED).forEach(k =>
  ok(byCur[k] === EXPECTED[k], k + ': ' + (byCur[k] || 0) + ' rows (expected ' + EXPECTED[k] + ')'));
ok(rows.length === 44, rows.length + ' rows total (expected 44)');
ok(new Set(rows.map(r => r.module_id)).size === rows.length, 'module_id is unique across all five curricula');
ok(rows.every(r => GATE_SHAPES.includes(r.gate_shape)), 'every gate_shape is in the CHECK vocabulary');
ok(rows.every(r => r.title && Number.isInteger(r.sequence) && r.sequence > 0), 'every row has a title and a positive sequence');
Object.keys(EXPECTED).forEach(k => {
  const seqs = rows.filter(r => r.curriculum === k).map(r => r.sequence).sort((a, b) => a - b);
  ok(seqs.every((s, i) => s === i + 1), k + ': sequence is 1..' + seqs.length + ' with no gaps');
});
ok(rows.find(r => r.module_id === 'en-14').gate_shape === 'knowledge_observation'
   && rows.filter(r => r.curriculum === 'endoscopy' && r.module_id !== 'en-14').every(r => r.gate_shape === 'knowledge'),
   'endoscopy: 13 chapters are knowledge-only, the en-14 capstone is knowledge+observation');
ok(rows.find(r => r.module_id === 'scripts').gate_shape === 'leader_confirmed', "scripts: one row, id 'scripts', leader_confirmed");

console.log('\n2. Migration seed block equals the constants, row for row');
ok(MIG.includes(seedSql()), 'seed block in 20260908140000 is byte-identical to `node scripts/curriculum-registry-seed.js` output');
ok(/enable row level security/.test(MIG), 'RLS enabled');
ok(/cm_select[^;]*for select to authenticated using \(true\)/s.test(MIG), 'read policy: any authenticated user');
ok(/cm_admin_write[^;]*for all to authenticated\s+using \(public\.sbd_is_master_admin\(\)\)/s.test(MIG), 'write policy: sbd_is_master_admin() only');
ok(/sbd_mfa_gate[^;]*as restrictive/s.test(MIG), 'T33 aal2 gate carried (name has no sbd_/foundations_ prefix, so the loop would miss it)');
ok(/revoke all on public\.curriculum_modules from anon/.test(MIG), 'anon revoked');
GATE_SHAPES.forEach(g => ok(MIG.includes("'" + g + "'"), 'CHECK constraint lists ' + g));
Object.keys(EXPECTED).forEach(k =>
  ok(new RegExp('"' + k + '":' + EXPECTED[k] + '\\b').test(CHECK), 'prod read-back expects ' + k + '=' + EXPECTED[k]));

console.log('\n3. Foundations and Instruments leader panels read the registry');
const sandbox = new Function(
  liftBlock(FND, 'const FOUNDATIONS_MODULES = [', 'foundations.js') + '\n' +
  liftBlock(INST, 'const INSTRUMENT_MODULES = [', 'instruments.js') + '\n' +
  'const DB = {};\n' +
  liftBlock(FND, 'function registryModules', 'foundations.js') + '\n' +
  liftBlock(FND, 'function fndModules', 'foundations.js') + '\n' +
  liftBlock(INST, 'function instModules', 'instruments.js') + '\n' +
  'return { DB, FOUNDATIONS_MODULES, INSTRUMENT_MODULES, registryModules, fndModules, instModules };'
)();
const { DB, FOUNDATIONS_MODULES, INSTRUMENT_MODULES, fndModules, instModules } = sandbox;
const shape = list => list.map(m => m.id + '|' + m.num + '|' + m.title).join('\n');

DB.curriculumModules = [];
ok(fndModules() === FOUNDATIONS_MODULES, 'empty registry: Foundations falls back to the constant (same array)');
ok(instModules() === INSTRUMENT_MODULES, 'empty registry: Instruments falls back to the constant (same array)');

DB.curriculumModules = rows.map(r => Object.assign({ active: true }, r)).reverse(); // order must not matter
ok(shape(fndModules()) === shape(FOUNDATIONS_MODULES), 'seeded registry: Foundations id/num/title list is identical to the constant');
ok(shape(instModules()) === shape(INSTRUMENT_MODULES), 'seeded registry: Instruments id/num/title list is identical to the constant');
ok(fndModules().every(m => Array.isArray(m.observations) && m.observations.length), 'registry rows carry the constant\'s observation list (G3 checklist still renders)');
ok(fndModules().every(m => m.questions && m.simulations), 'registry rows carry the constant\'s question and simulation banks');

DB.curriculumModules = rows.map(r => Object.assign({ active: r.module_id !== 'fm-03' }, r));
ok(fndModules().length === 9 && !fndModules().some(m => m.id === 'fm-03'), 'active=false hides a module from the leader panel');
DB.curriculumModules = rows.map(r => Object.assign({ active: true }, r)).concat([{ curriculum: 'foundations', module_id: 'fm-99', title: 'Ghost', sequence: 99, gate_shape: 'knowledge', active: true }]);
ok(fndModules().length === 10, 'a registry row with no constant behind it is dropped, not rendered');
DB.curriculumModules = rows.map(r => r.module_id === 'fm-01' ? Object.assign({ active: true }, r, { title: 'Renamed' }) : Object.assign({ active: true }, r));
ok(fndModules()[0].title === 'Renamed' && FOUNDATIONS_MODULES[0].title === 'Foundations', 'a registry retitle shows on the panel without mutating the constant');

const panels = [
  [FND, 'function renderHTraining', 'FOUNDATIONS_MODULES'], [FND, 'function hFndStaffDetail', 'FOUNDATIONS_MODULES'],
  [FND, 'function hAssignFndModal', 'FOUNDATIONS_MODULES'], [FND, 'function hAssignAllFnd', 'FOUNDATIONS_MODULES'],
  [FND, 'function assignAllModules', 'FOUNDATIONS_MODULES'],
  [INST, 'function renderHInstruments', 'INSTRUMENT_MODULES'], [INST, 'function hInstStaffDetail', 'INSTRUMENT_MODULES'],
  [INST, 'function hAssignInstModal', 'INSTRUMENT_MODULES'], [INST, 'function hAssignAllInst', 'INSTRUMENT_MODULES'],
  [INST, 'function assignAllInstModules', 'INSTRUMENT_MODULES'],
];
panels.forEach(([src, fn, constant]) => {
  const body = liftBlock(src, fn, 'panel').replace(/\/\/.*$/gm, '');
  const reader = constant === 'FOUNDATIONS_MODULES' ? 'fndModules()' : 'instModules()';
  ok(!body.includes(constant) && body.includes(reader), fn.replace('function ', '') + '() reads ' + reader + ', not ' + constant);
});
ok(!/All 10<|All 4<|All 10 modules|All 4 instrument/.test(FND + INST), 'no hardcoded module counts left in the leader panels');
ok(/renderSFoundations[^]*FOUNDATIONS_MODULES\.forEach/.test(FND), 'staff-side renderSFoundations still reads the constant (its switch is a later curriculum step)');

console.log('\n4. Wiring');
const API = read('src/js/api-supabase.js'), INIT = read('src/js/auth-init.js'), HTML = read('index.html');
ok(/getCurriculumModules\(\)\{ return sbFetch\('\/rest\/v1\/curriculum_modules\?select=\*&active=is\.true/.test(API), 'SB.getCurriculumModules fetches active rows');
ok(/DB\.curriculumModules = \[\];/.test(API), 'resetDB clears DB.curriculumModules');
ok(/SB\.getCurriculumModules \? SB\.getCurriculumModules\(\)/.test(INIT) && /window\.DB\.curriculumModules = currModules\|\|\[\];/.test(INIT), 'initAppData hydrates DB.curriculumModules (error → [] → constants fallback)');
// Minimums, not exact pins: later issues bump these too (#1123 moved foundations/instruments/auth-init).
const vOf = f => Number((HTML.match(new RegExp(f.replace('.', '\\.') + '\\?v=(\\d+)')) || [])[1] || 0);
ok(vOf('foundations.js') >= 23 && vOf('instruments.js') >= 15 && vOf('api-supabase.js') >= 68 && vOf('auth-init.js') >= 44, 'cache-bust bumped on all four edited scripts');

console.log('\n' + passed + ' passed, ' + failed + ' failed\n');
process.exit(failed ? 1 : 0);
