#!/usr/bin/env node
/* ============================================================================
 * verify-observation-evidence-gate.js — T91 acceptance harness
 *
 * T91 (client ask, 2026-08-03 call): an observation answer must be typed or
 * spoken, never only selected. The 0-3 / PASS-FAIL taps stay because the outcome
 * engine and every stored record depend on them; what changed is that a tap with
 * no written or dictated account does not count as an answer.
 *
 * This proves the gate against the REAL shipped functions, lifted out of
 * src/js/ui-views.js by name (they are top-level declarations, so the closing
 * brace sits at column 0). If someone edits the gate or the outcome engine and
 * breaks the rule, this fails.
 *
 * Run:  node scripts/verify-observation-evidence-gate.js
 * Exit 0 only if every assertion passes.
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'src/js/ui-views.js'), 'utf8');

// Lift a top-level `function name(...){ ... }` out of the browser bundle.
function lift(name) {
  const lines = SRC.split('\n');
  const start = lines.findIndex(l => l.startsWith('function ' + name + '('));
  if (start === -1) throw new Error('function not found in ui-views.js: ' + name);
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i] === '}') return lines.slice(start, i + 1).join('\n');
  }
  throw new Error('unterminated function: ' + name);
}

const OVS_MIN_NOTE  = Number((SRC.match(/const OVS_MIN_NOTE  = (\d+)/) || [])[1]);
const OVS_MIN_WORDS = Number((SRC.match(/const OVS_MIN_WORDS = (\d+)/) || [])[1]);
const sandbox = new Function(
  'const OVS_MIN_NOTE = ' + OVS_MIN_NOTE + ', OVS_MIN_WORDS = ' + OVS_MIN_WORDS + ';\n' +
  lift('ovsNoteOk') + '\n' + lift('ovsEffectiveScores') + '\n' + lift('ovsComputeOutcome') +
  '\nreturn { ovsNoteOk, ovsEffectiveScores, ovsComputeOutcome };'
)();
const { ovsNoteOk, ovsEffectiveScores, ovsComputeOutcome } = sandbox;

/* ---- tiny test framework ---- */
let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('  \x1b[32m✓\x1b[0m ' + msg); }
  else { failed++; console.log('  \x1b[31m✗ ' + msg + '\x1b[0m'); }
}

const EVIDENCE = 'Stated the item and the destination on all three handoffs.';
const NO_STOP = { active: false };

/* ---- fixtures: one instrument per schema the engine supports ---- */
const POINTS = { belt: 'White', schema: { type: 'points', floorPoints: 6 },
  items: [{ id: 'p1', n: 1 }, { id: 'p2', n: 2 }, { id: 'p3', n: 3 }] };
const MR = { belt: 'Yellow', schema: { type: 'mr', rules: { advance: { minRecommended: 1 } } },
  items: [{ id: 'm1', n: 1, type: 'M' }, { id: 'r1', n: 2, type: 'R' }] };
const COMPONENTS = { belt: 'Black', schema: { type: 'components',
  components: [{ name: 'Sterilization', dims: [{ id: 'd1', text: 'a' }, { id: 'd2', text: 'b' }] }] },
  items: [] };
const TIERED = { belt: 'Placement', schema: { type: 'tiered', tiers: [{ label: 'T1', places: 'White' }] },
  items: [{ id: 't1', n: 1, tier: 'T1' }] };
const COMPOSITE = { belt: 'Brown', schema: { type: 'composite',
  presentation: [{ id: 'c1', n: 1, text: 'a' }, { id: 'c2', n: 2, text: 'b' }],
  rules: { presentation: { advance: 2, conditionalMin: 1 } } },
  items: [{ id: 'a1', n: 1, type: 'M' }] };

const noteAll = ids => ids.reduce((o, id) => (o[id] = EVIDENCE, o), {});

console.log('\nOVS_MIN_NOTE =', OVS_MIN_NOTE, ' OVS_MIN_WORDS =', OVS_MIN_WORDS, '\n');

// Exactly at both floors, built from the constants so it tracks any change to them.
const AT_FLOOR = ('word '.repeat(OVS_MIN_WORDS - 1) + 'x'.repeat(Math.max(1, OVS_MIN_NOTE - 5 * (OVS_MIN_WORDS - 1))));

console.log('1. ovsNoteOk — what counts as a typed or spoken answer');
ok(OVS_MIN_NOTE > 0 && OVS_MIN_WORDS > 0, 'a minimum evidence length and word count are configured');
ok(ovsNoteOk(EVIDENCE) === true, 'a real sentence is accepted');
ok(ovsNoteOk('') === false, 'empty string rejected');
ok(ovsNoteOk(null) === false, 'null rejected');
ok(ovsNoteOk(undefined) === false, 'undefined rejected');
ok(ovsNoteOk('   \n\t  ') === false, 'whitespace-only rejected (trimmed, not counted)');
ok(ovsNoteOk(AT_FLOOR.trim()) === true, 'exactly at both floors accepted');
ok(ovsNoteOk('x'.repeat(OVS_MIN_NOTE * 3)) === false,
  'one padded token is rejected however long — words are counted, not characters alone');
// Review 2026-08-07: the floor used to be 10 characters, so this passed.
ok(ovsNoteOk('did it fine') === false, '"did it fine" rejected — not an account of anything');
ok(ovsNoteOk('ok') === false, '"ok" rejected');
ok(ovsNoteOk('he did all four steps') === false,
  'four short words under the character floor rejected');

console.log('\n2. ovsEffectiveScores — a tapped score with no evidence is not an answer');
ok(Object.keys(ovsEffectiveScores({ p1: 3 }, {})).length === 0,
  'score without evidence is dropped');
ok(ovsEffectiveScores({ p1: 3 }, { p1: EVIDENCE }).p1 === 3,
  'score with evidence survives');
ok(ovsEffectiveScores({ p1: 0 }, { p1: EVIDENCE }).p1 === 0,
  'a 0 with evidence survives (0 is a real score, not a missing one)');
ok(ovsEffectiveScores({ p1: 'fail' }, { p1: EVIDENCE }).p1 === 'fail',
  'a PASS/FAIL value with evidence survives');
ok(Object.keys(ovsEffectiveScores({ p1: 3, p2: 2 }, { p1: EVIDENCE, p2: 'short' })).length === 1,
  'evidence below the floor does not rescue its score');
ok(Object.keys(ovsEffectiveScores({}, noteAll(['p1']))).length === 0,
  'evidence without a score contributes nothing on its own');
ok(Object.keys(ovsEffectiveScores(null, null)).length === 0, 'null inputs are safe');

console.log('\n3. The gate reaches the outcome engine — no schema can be passed by tapping');
const cases = [
  ['points',     POINTS,     { p1: 3, p2: 3, p3: 3 }, ['p1', 'p2', 'p3'], 'advance'],
  ['mr',         MR,         { m1: 3, r1: 3 },        ['m1', 'r1'],       'advance'],
  ['components', COMPONENTS, { d1: 'pass', d2: 'pass' }, ['d1', 'd2'],    'advance'],
  ['tiered',     TIERED,     { t1: 3 },               ['t1'],             'advance'],
  ['composite',  COMPOSITE,  { a1: 3, c1: 'pass', c2: 'pass' }, ['a1', 'c1', 'c2'], 'advance'],
];
cases.forEach(([label, cl, scores, ids, want]) => {
  const bare = ovsComputeOutcome(cl, ovsEffectiveScores(scores, {}), NO_STOP);
  const full = ovsComputeOutcome(cl, ovsEffectiveScores(scores, noteAll(ids)), NO_STOP);
  ok(bare.outcome === 'incomplete', `${label}: fully tapped, zero evidence → incomplete (cannot submit)`);
  ok(full.outcome === want, `${label}: fully tapped WITH evidence → ${want}`);
});

console.log('\n4. Partial evidence still blocks submission');
const partial = ovsComputeOutcome(POINTS,
  ovsEffectiveScores({ p1: 3, p2: 3, p3: 3 }, { p1: EVIDENCE, p2: EVIDENCE }), NO_STOP);
ok(partial.outcome === 'incomplete', 'points: one item missing its answer → incomplete');

console.log('\n5. A mandatory failure still cannot be hidden behind missing evidence');
// mr short-circuits on a mandatory miss before the completeness check. With no evidence
// the item is invisible, so the record reads incomplete rather than a false pass —
// the observer must write the answer either way, and the fail then lands.
const manNoEvidence = ovsComputeOutcome(MR, ovsEffectiveScores({ m1: 0, r1: 3 }, {}), NO_STOP);
const manEvidence   = ovsComputeOutcome(MR, ovsEffectiveScores({ m1: 0, r1: 3 }, noteAll(['m1', 'r1'])), NO_STOP);
ok(manNoEvidence.outcome === 'incomplete', 'mandatory miss without evidence → incomplete, never advance');
ok(manEvidence.outcome === 'do_not_advance', 'mandatory miss with evidence → do not advance');

console.log('\n6. Stop-Work still overrides everything, evidence or not');
const stopped = ovsComputeOutcome(POINTS,
  ovsEffectiveScores({ p1: 3, p2: 3, p3: 3 }, noteAll(['p1', 'p2', 'p3'])), { active: true });
ok(stopped.outcome === 'do_not_advance', 'Stop-Work → do not advance');

console.log('\n7. Records submitted before T91 read back unchanged');
// confirmObservation recomputes from item_scores alone. That path must NOT be gated,
// or every pre-T91 pending record would silently flip to a failed gate on approval.
const legacy = ovsComputeOutcome(POINTS, { p1: 3, p2: 3, p3: 3 }, NO_STOP);
ok(legacy.outcome === 'advance', 'ungated recompute of an old record still advances');
ok(!/ovsEffectiveScores/.test(
  (SRC.split('\n').slice(
    SRC.split('\n').findIndex(l => l.startsWith('function confirmObservation(')),
    SRC.split('\n').findIndex(l => l.startsWith('function returnObservation('))
  ).join('\n'))
), 'confirmObservation does not apply the evidence gate to stored records');

console.log(`\n${failed === 0 ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}  ${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
