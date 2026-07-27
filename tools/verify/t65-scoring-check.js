// T65 verification harness.  node tools/verify/t65-scoring-check.js
//
// Slices the placement-scoring functions out of ui-views.js and runs them against a real
// candidate's stored responses. No database, no DOM, no network, no writes.
//
// It exists because these functions are 4000 lines apart in a 15000-line file with no module
// boundaries, so there is no way to exercise them except in a browser with a live session,
// and the defects it guards against (a placeholder belt printed as a determination, a floor
// table drifting out of step with the spec) are exactly the kind that look fine on screen.
const fs = require('fs');
const path = require('path');
const REPO = path.resolve(__dirname, '..', '..');

const src = fs.readFileSync(path.join(REPO, 'src/js/ui-views.js'), 'utf8').split('\n');
const grab = (from, to) => src.slice(from - 1, to).join('\n');   // 1-indexed, inclusive

// belt-test-engine.js is an IIFE bound to globalThis, and dual-exports for Node.
require(path.join(REPO, 'src/js/belt-test-engine.js'));
const BELT_TEST_CONFIG = globalThis.BELT_TEST_CONFIG;
if (!BELT_TEST_CONFIG) throw new Error('BELT_TEST_CONFIG not exported from belt-test-engine.js');

// Slice by anchor rather than by line number: this file is edited constantly and hardcoded
// line ranges silently pick up the wrong code.
function block(startsWith) {
  const i = src.findIndex(l => l.startsWith(startsWith));
  if (i < 0) throw new Error('anchor not found: ' + startsWith);
  for (let j = i; j < src.length; j++) {
    if (['}', '};', ']', '];'].includes(src[j])) return src.slice(i, j + 1).join('\n');
  }
  throw new Error('no closing brace for: ' + startsWith);
}

const slices = [
  'const SBD_BELT_ORDER',
  'function sbdSpecConfig(',
  'function sbdBeltThresholds(',
  'function sbdSpecFloors(',
  'function sbdBuildProvisions(',
  'function sbdOpenProvisions(',
  'function sbdHasOpenProvision(',
  'function sbdSpecOveralls(',
  'function sbdKnowledgeOverall(',
  'function sbdSuggestBelt(',
  'const RPT_STANDARDS',
  'function rptComputeModel(',
  'const LEVEL_LABELS',
  'function sbdKnowledgeFloor(',
  'function sbdSimFloor(',
  'const DANGEROUS_PATTERNS',
  'const _DANGEROUS_RISKS',
  'function _dangerousRiskDesc(',
  'function detectDangerousAnswers(',
  'function deriveOutcome(',
  'function sbdAdvancementBlock(',
].map(a => a.startsWith('const ') ? block(a) : block(a)).join('\n\n');

const mod = new Function('BELT_TEST_CONFIG', 'window', slices + `
  return { sbdKnowledgeOverall, sbdSuggestBelt, sbdBeltThresholds, sbdSpecFloors,
           sbdSpecOveralls, sbdKnowledgeFloor, sbdSimFloor, rptComputeModel, deriveOutcome,
           sbdBuildProvisions, sbdOpenProvisions, sbdHasOpenProvision, sbdAdvancementBlock };
`)(BELT_TEST_CONFIG, undefined);

// ---------------------------------------------------------------- Williams' stored responses
// Knowledge: L1 8 questions / 7 correct, L2-L4 8/8, L5 7/7. The L1 miss is the p6 dangerous one.
const responses = [];
const kSpec = { 1: [8, 7], 2: [8, 8], 3: [8, 8], 4: [8, 8], 5: [7, 7] };
Object.keys(kSpec).forEach(l => {
  const [total, correct] = kSpec[l];
  for (let i = 0; i < total; i++) {
    const isMiss = (i >= correct);
    responses.push({
      type: 'knowledge', level: Number(l), qId: `k${l}-${i}`,
      correct: !isMiss,
      isDangerous: isMiss && Number(l) === 1,
      question: isMiss && Number(l) === 1
        ? 'A single-use instrument looks clean after a case. What do you do?'
        : `Knowledge question L${l} #${i + 1}`,
      answer: isMiss && Number(l) === 1
        ? 'Reuse the single-use instrument since it looks clean'
        : 'Correct answer',
      correctAnswer: 'Correct answer',
    });
  }
});
const simSpec = {
  1: [72, 58, 58, 78], 2: [72, 35, 45, 58], 3: [58, 68, 35, 72],
  4: [72, 68, 58, 72], 5: [72, 72, 68, 58],
};
Object.keys(simSpec).forEach(l => {
  simSpec[l].forEach((score, i) => {
    responses.push({ type: 'simulation', level: Number(l), qId: `s${l}-${i}`,
      aiScore: score, question: `Simulation scenario L${l} #${i + 1}`, answer: 'candidate answer' });
  });
});

const williams = {
  id: '620f327e-a8ec-4db7-a7a3-d29556c34363',
  staffName: 'David Williams', staffTitle: 'Sterile Processing Technician',
  confirmedBelt: null, tentativeBelt: null,   // as stored today: pending, tentative_belt White
  responses,
};

// ---------------------------------------------------------------------------------- assertions
let failures = 0;
const near = (a, b, tol = 0.05) => Math.abs(a - b) <= tol;
function check(label, actual, expected, ok) {
  const pass = ok === undefined ? String(actual) === String(expected) : ok;
  if (!pass) failures++;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}\n        got ${JSON.stringify(actual)}   expected ${JSON.stringify(expected)}`);
}

console.log('=== spec table is being read, not a local copy ===');
check('Green sim floors from BELT_TEST_CONFIG',
  mod.sbdSpecFloors('Green').simLevelFloors, { 1: 78, 2: 75, 3: 70, 4: null, 5: null },
  JSON.stringify(mod.sbdSpecFloors('Green').simLevelFloors) === JSON.stringify({ 1: 78, 2: 75, 3: 70, 4: null, 5: null }));
check('Green individual response minimum', mod.sbdSpecOveralls('Green').individual, 72);
check('threshold rows ordered highest belt first', mod.sbdBeltThresholds()[0].belt, 'Black');

console.log('\n=== spec 5.2 knowledge overall ===');
const kOnly = responses.filter(r => r.type === 'knowledge');
check('Williams knowledge overall (mean of five level scores)',
  mod.sbdKnowledgeOverall(kOnly), 97.5, near(mod.sbdKnowledgeOverall(kOnly), 97.5));
check('correct-over-total would have been 97.4', Math.round(38 / 39 * 1000) / 10, 97.4);

console.log('\n=== draft-report engine (rptComputeModel) ===');
const m = mod.rptComputeModel(williams);
check('kOverall', m.kOverall, 97.5, near(m.kOverall, 97.5));
check('simOverall', m.simOverall, 62.5, near(m.simOverall, 62.5));
check('blended', m.blended, 83.5, near(m.blended, 83.5));
check('belt determined from scores (no White placeholder)', m.belt, 'Green');
check('belt was actually determined', m.beltIsDetermined, true);
check('outcome', m.outcome, 'CONDITIONAL');
check('determination line', m.determination, 'GREEN BELT -- Conditional', /^GREEN BELT -- Conditional/.test(m.determination));
const simFloors = m.simLevels.map(s => s.floor);
check('simulation floors are Green\'s, L4/L5 ungated', simFloors, [78, 75, 70, null, null],
  JSON.stringify(simFloors) === JSON.stringify([78, 75, 70, null, null]));
check('sim L4 (67.5) is not a failure', m.simLevels[3].pass, true);
check('sim L5 (67.5) is not a failure', m.simLevels[4].pass, true);
check('sim L1 (66.5) fails the 78 floor', m.simLevels[0].pass, false);
const kFloors = m.kLevels.map(k => k.floor);
check('knowledge floors are Green\'s, L4/L5 ungated', kFloors, [90, 85, 80, null, null],
  JSON.stringify(kFloors) === JSON.stringify([90, 85, 80, null, null]));
check('knowledge L1 (87.5) fails the 90 floor', m.kLevels[0].pass, false);
check('individual response minimum is Green\'s 72, not a flat 50', m.simResponseMin, 72);
check('no condition cites a null floor',
  m.conditions.filter(c => /null/.test(c.finding + c.title + c.action)).length, 0);
check('dangerous answer raises supervised practice as condition 1',
  m.conditions[0] && m.conditions[0].sev, 'SUPERVISED PRACTICE REQUIRED');
check('belt is still issued despite the dangerous answer', m.beltAwarded, 'Green');

console.log('\n=== report-generator engine (deriveOutcome) ===');
const d = mod.deriveOutcome(williams);
check('knowledgeOverall', d.knowledgeOverall, 97.5, near(d.knowledgeOverall, 97.5));
check('simOverall', d.simOverall, 62.5, near(d.simOverall, 62.5));
check('blended', d.blended, 83.5, near(d.blended, 83.5));
check('targetBelt derived, not the White placeholder', d.targetBelt, 'Green');
check('beltIsDetermined', d.beltIsDetermined, true);
check('outcome', d.outcome, 'CONDITIONAL');
check('thresholds are Green\'s', [d.thresh.blended, d.thresh.knowledge, d.thresh.sim], [81, 86, 78],
  JSON.stringify([d.thresh.blended, d.thresh.knowledge, d.thresh.sim]) === JSON.stringify([81, 86, 78]));
const lvlConds = d.conditions.filter(c => /Level \d/.test(c.title));
check('no condition names a level Green does not gate',
  lvlConds.filter(c => /Level [45] (knowledge|simulation)/.test(c.title)).map(c => c.title), [],
  lvlConds.filter(c => /Level [45] (knowledge|simulation)/.test(c.title)).length === 0);
check('supervised practice is condition 1', d.conditions[0].severity, 'SUPERVISED PRACTICE REQUIRED');
check('no condition text contains "undefined" or "null"',
  d.conditions.filter(c => /undefined|null/.test(c.title + c.finding + c.requiredAction)).length, 0);

console.log('\n=== the two engines agree ===');
check('same belt', [m.belt, d.targetBelt], 'Green/Green', m.belt === d.targetBelt);
check('same blended', [m.blended, d.blended], 'equal', near(m.blended, d.blended, 0.1));
check('same knowledge overall', [m.kOverall, d.knowledgeOverall], 'equal', near(m.kOverall, d.knowledgeOverall, 0.1));
check('same outcome family', [m.outcome, d.outcome], 'CONDITIONAL', m.outcome === 'CONDITIONAL' && d.outcome === 'CONDITIONAL');

console.log('\n=== regressions ===');
check('sbdSuggestBelt(97, 88, 63, 83, false)', mod.sbdSuggestBelt(97, 88, 63, 83, false), 'Green Belt Conditional');
check('sbdSuggestBelt(97, 88, 63, 83, true) still issues the belt', mod.sbdSuggestBelt(97, 88, 63, 83, true), 'Green Belt Conditional');
check('sbdSuggestBelt(50, 50, 50, 50, false)', mod.sbdSuggestBelt(50, 50, 50, 50, false), 'No Belt');
check('sbdSuggestBelt(95, 95, 95, 95, false)', mod.sbdSuggestBelt(95, 95, 95, 95, false), 'Black Belt');

// A partial assessment: L1 only, 7 of 8. Empty levels must be skipped, not counted as zero.
const partial = kOnly.filter(r => r.level === 1);
check('partial (L1 only, 7/8) knowledge overall skips empty levels',
  mod.sbdKnowledgeOverall(partial), 87.5, near(mod.sbdKnowledgeOverall(partial), 87.5));

// A candidate below every threshold must not be handed a belt by the report either.
const weak = { staffName: 'Low Scorer', responses: [
  ...[1, 2, 3, 4, 5].flatMap(l => Array.from({ length: 8 }, (_, i) => ({
    type: 'knowledge', level: l, qId: `wk${l}-${i}`, correct: i < 4, question: 'q', answer: 'a' }))),
  ...[1, 2, 3, 4, 5].flatMap(l => Array.from({ length: 4 }, (_, i) => ({
    type: 'simulation', level: l, qId: `ws${l}-${i}`, aiScore: 50, question: 'q', answer: 'a' }))),
] };
const w = mod.rptComputeModel(weak);
check('below every threshold: no belt awarded', w.beltAwarded, null);
check('below every threshold: belt was NOT determined', w.beltIsDetermined, false);
const wd = mod.deriveOutcome(weak);
check('report engine agrees: no belt', wd.beltIsDetermined, false);
check('report engine measures the miss against White', wd.targetBelt, 'White');

console.log('\n=== dangerous provisions (T65) ===');
const provs = mod.sbdBuildProvisions(responses, williams.id);
check('one provision raised from Williams\' assessment', provs.length, 1);
check('it carries the answer given', /Reuse the single-use instrument/.test(provs[0].answer), true);
check('it starts open', provs[0].cleared_at, null);
check('it names the review it came from', provs[0].source_review_id, williams.id);
const withOpen = { id: 'x', dangerousProvisions: provs };
check('an open provision holds advancement', !!mod.sbdAdvancementBlock(withOpen), true);
check('the hold names the supervisor sign-off, not a re-test',
  /supervisor must observe correct practice/.test(mod.sbdAdvancementBlock(withOpen)), true);
const clearedOne = { id: 'x', dangerousProvisions: [Object.assign({}, provs[0], {
  cleared_at: '2026-07-28T10:00:00.000Z', cleared_by_name: 'Ignacio Zambrano II' })] };
check('a cleared provision releases the hold', mod.sbdAdvancementBlock(clearedOne), null);
check('the cleared entry is kept, not deleted', clearedOne.dangerousProvisions.length, 1);
check('who cleared it survives on the record',
  clearedOne.dangerousProvisions[0].cleared_by_name, 'Ignacio Zambrano II');
check('a correct answer to a dangerous question raises nothing',
  mod.sbdBuildProvisions([{ type:'knowledge', level:1, qId:'k', isDangerous:true, correct:true }], 'r').length, 0);
check('a wrong answer to an unflagged question raises nothing',
  mod.sbdBuildProvisions([{ type:'knowledge', level:1, qId:'k', isDangerous:false, correct:false }], 'r').length, 0);
check('no provisions means no hold', mod.sbdAdvancementBlock({ id:'y' }), null);

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`);
process.exit(failures === 0 ? 0 : 1);
