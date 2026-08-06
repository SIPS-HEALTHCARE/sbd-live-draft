#!/usr/bin/env node
/* ============================================================================
 * verify-scripts-module.js — T92 acceptance harness
 *
 * T92 (client ask, 2026-08-03 call): the scripts stay inside the belt content
 * AND additionally exist as a module a leader can assign to one person.
 *
 * The three ways this can silently break:
 *   1. A belt stops yielding script sections (a curriculum retitle) — the
 *      assigned module then shows an empty belt tab.
 *   2. Someone "moves" the scripts out of FULL_CURRICULUM_DATA.belts, which is
 *      the one thing the client explicitly said must not happen.
 *   3. The scripts assignment row leaks into Foundations counts, turning the
 *      "N/10 modules" convention into N/11.
 *
 * Run:  node scripts/verify-scripts-module.js
 * Exit 0 only if every assertion passes.
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const UI = fs.readFileSync(path.join(root, 'src/js/ui-views.js'), 'utf8');
const SCRIPTS = fs.readFileSync(path.join(root, 'src/js/scripts-module.js'), 'utf8');
const FND = fs.readFileSync(path.join(root, 'src/js/foundations.js'), 'utf8');

/* ---- lift the real shipped code, no re-implementation ---- */
function liftBlock(src, startsWith, file) {
  const lines = src.split('\n');
  const start = lines.findIndex(l => l.startsWith(startsWith));
  if (start === -1) throw new Error('not found in ' + file + ': ' + startsWith);
  for (let i = start; i < lines.length; i++) {
    if (lines[i] === '};' || lines[i] === '}') return lines.slice(start, i + 1).join('\n');
  }
  throw new Error('unterminated block in ' + file + ': ' + startsWith);
}
function liftDecl(src, name, file) {
  const m = src.match(new RegExp('^const ' + name + " = '[^']*';$", 'm'));
  if (!m) throw new Error('const ' + name + ' must be declared in ' + file
    + ' (it loads before scripts-module.js, and getFoundationsAssignments needs it)');
  return m[0];
}

const sandbox = new Function(
  liftBlock(UI, 'const FULL_CURRICULUM_DATA = {', 'ui-views.js') + '\n' +
  "const BELT_ORDER = ['White','Yellow','Green','Blue','Brown','Black'];\n" +
  liftBlock(SCRIPTS, 'const SCRIPTS_TITLE_RE', 'scripts-module.js') + '\n' +
  liftBlock(SCRIPTS, 'function scriptSectionsForBelt', 'scripts-module.js') + '\n' +
  liftBlock(SCRIPTS, 'function scriptsBeltsWithContent', 'scripts-module.js') + '\n' +
  // Lifted, not hardcoded: the declaration must live in foundations.js, which
  // loads first. See the "no cross-file load-order dependency" check below.
  liftDecl(FND, 'SCRIPTS_MODULE_ID', 'foundations.js') + '\n' +
  'const DB = {};\n' +
  liftBlock(FND, 'function getFoundationsAssignments', 'foundations.js') + '\n' +
  'return { FULL_CURRICULUM_DATA, BELT_ORDER, scriptSectionsForBelt, scriptsBeltsWithContent,' +
  ' getFoundationsAssignments, DB, SCRIPTS_MODULE_ID };'
)();

const { FULL_CURRICULUM_DATA, BELT_ORDER, scriptSectionsForBelt, scriptsBeltsWithContent,
        getFoundationsAssignments, DB } = sandbox;

/* ---- tiny test framework ---- */
let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('  \x1b[32m✓\x1b[0m ' + msg); }
  else { failed++; console.log('  \x1b[31m✗ ' + msg + '\x1b[0m'); }
}

console.log('\nT92 — Scripts as a standalone assignable module\n');

console.log('1. Every belt yields script content to the assignable module');
BELT_ORDER.forEach(b => {
  const secs = scriptSectionsForBelt(b);
  ok(secs.length > 0, b + ' Belt: ' + secs.length + ' script section(s) — '
    + secs.map(s => s.title.replace(/^SECTION \d+: /, '')).join(' | ').slice(0, 72));
});
ok(scriptsBeltsWithContent().length === BELT_ORDER.length,
  'unscoped (leader-side totals): all ' + BELT_ORDER.length + ' belts, not a subset');

console.log('\n1b. A staff member is never offered a belt above their own');
// Study & Practice is hard-locked to s.belt; the assigned module must not be the
// one place a White Belt can read the Black Belt scripts.
BELT_ORDER.forEach((b, i) => {
  const offered = scriptsBeltsWithContent(b);
  ok(offered.join(',') === BELT_ORDER.slice(0, i + 1).join(','),
    b + ' Belt staffer is offered ' + offered.join(', '));
});
ok(scriptsBeltsWithContent('Bogus').length === 0,
  'an unrecognised belt fails closed (offers nothing, not everything)');

console.log('\n2. The scripts have not been moved out of the belt content');
// The client's constraint: "it is going to stay here, but also be here." The
// module derives from these arrays, so the proof is that the script sections are
// still SECTIONS OF THE BELT CURRICULUM, addressable by their belt.
BELT_ORDER.forEach(b => {
  const belt = FULL_CURRICULUM_DATA.belts[b] || [];
  const secs = scriptSectionsForBelt(b);
  ok(secs.length > 0 && secs.every(s => belt.indexOf(s) !== -1),
    b + ' Belt script sections are still members of FULL_CURRICULUM_DATA.belts.' + b);
  ok(belt.length > secs.length,
    b + ' Belt curriculum still carries its non-script sections too ('
    + belt.length + ' total, ' + secs.length + ' scripts)');
});
// No second copy of the script text anywhere in the new module file.
ok(!/APPROVED LANGUAGE/.test(SCRIPTS),
  'scripts-module.js contains no copy of the script text (renders the curriculum by reference)');

console.log('\n3. The scripts assignment stays invisible to Foundations');
DB.foundationsAssignments = [
  { staffId: 'staff-1', moduleId: 'fm-01', status: 'completed' },
  { staffId: 'staff-1', moduleId: 'fm-04', status: 'assigned' },
  { staffId: 'staff-1', moduleId: 'scripts', status: 'assigned' },
  { staffId: 'staff-2', moduleId: 'scripts', status: 'completed' }
];
const a1 = getFoundationsAssignments('staff-1');
ok(a1.length === 2, 'a staffer with 2 Foundations modules + Scripts reads back as 2, not 3');
ok(!a1.some(a => a.moduleId === 'scripts'), 'no scripts row in the Foundations accessor output');
ok(getFoundationsAssignments('staff-2').length === 0,
  'a staffer with ONLY Scripts assigned shows zero Foundations modules (no phantom enrollment)');
ok(a1.every(a => a.staffId === 'staff-1'), 'still scoped to the requested staffer');

console.log('\n4. Foundations does not depend on scripts-module.js loading');
// index.html loads foundations.js first. If the id were declared in the later
// file, a 404 there would ReferenceError every Foundations screen.
ok(!/^const SCRIPTS_MODULE_ID/m.test(SCRIPTS),
  'scripts-module.js consumes SCRIPTS_MODULE_ID and does not redeclare it (a second top-level const is a SyntaxError)');
ok(/^const SCRIPTS_MODULE_ID/m.test(FND),
  'foundations.js — the file that loads first and needs it — owns the declaration');

console.log('\n' + (failed === 0
  ? '\x1b[32mAll ' + passed + ' assertions passed.\x1b[0m\n'
  : '\x1b[31m' + failed + ' of ' + (passed + failed) + ' assertions FAILED.\x1b[0m\n'));
process.exit(failed === 0 ? 0 : 1);
