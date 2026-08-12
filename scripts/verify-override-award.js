// Assessor-override award verification.  node scripts/verify-override-award.js [path-to-old-ui-views.js]
//
// Live case (Sharon Greene-Golden, review 02cac3d4): an assessor override moved her Blue to
// Brown, but the report re-judged the award purely from scores, and her blended 85.9 against
// Brown's 87 printed BELT AWARDED NONE. The fix: a review with status 'adjusted' prints the
// adjusted belt as awarded while every score, floor and condition still grades against that belt
// unchanged.
//
// 2026-08-12 (Iggie): the override must not appear ON the report. An overridden belt prints
// exactly like a normally awarded one — no "ASSESSOR OVERRIDE" label, no attribution line, no
// override in the report status. The attribution stays in the record and in the model
// (m.override), which the internal views read.
//
// This harness slices the real functions out of ui-views.js (no DB, no DOM, no writes) and:
//   1. proves the override case awards the adjusted belt with attribution,
//   2. proves the score-derived outcome/conditions are NOT changed by the override,
//   3. proves non-adjusted reviews produce output identical to the pre-change model
//      (pass the pre-change ui-views.js as argv[2]; without it those checks are skipped),
//   4. smoke-tests both report renderers for the ABSENCE of override wording.
const fs = require('fs');
const path = require('path');
const REPO = path.resolve(__dirname, '..');

require(path.join(REPO, 'src/js/belt-test-engine.js'));
const BELT_TEST_CONFIG = globalThis.BELT_TEST_CONFIG;
if (!BELT_TEST_CONFIG) throw new Error('BELT_TEST_CONFIG not exported from belt-test-engine.js');

// Slice by anchor, not line number (same approach as tools/verify/t65-scoring-check.js).
function makeSlicer(file) {
  const src = fs.readFileSync(file, 'utf8').split('\n');
  return function block(startsWith) {
    const i = src.findIndex(l => l.startsWith(startsWith));
    if (i < 0) throw new Error('anchor not found in ' + file + ': ' + startsWith);
    for (let j = i; j < src.length; j++) {
      if (['}', '};', ']', '];', '`;'].includes(src[j])) {
        if (src[j] === '`;') continue; // template close inside a fn; keep walking to the brace
        return src.slice(i, j + 1).join('\n');
      }
    }
    throw new Error('no closing brace for: ' + startsWith);
  };
}

const DEPS = [
  'const SBD_BELT_ORDER',
  'function sbdSpecConfig(',
  'function sbdBeltThresholds(',
  'function sbdSpecFloors(',
  'function sbdSpecOveralls(',
  'function sbdKnowledgeOverall(',
  'function sbdKnowledgeFloor(',
  'function sbdSimFloor(',
  'function sbdIsDangerousResponse(',
  'function detectDangerousAnswers(',
  'function _dangerousRiskDesc(',
  'const RPT_STANDARDS',
  'const LEVEL_LABELS',
];

function buildModel(file) {
  const block = makeSlicer(file);
  const code = DEPS.concat(['function rptComputeModel(']).map(block).join('\n\n');
  return new Function('BELT_TEST_CONFIG', 'window', code + '\nreturn { rptComputeModel };')(BELT_TEST_CONFIG, {}).rptComputeModel;
}

function buildRenderers(file) {
  const block = makeSlicer(file);
  const code = DEPS.concat([
    'function rptComputeModel(',
    'function deriveOutcome(',
    'function _certBasis(',
    'function buildAssessmentReportHTML(',
    'function downloadAssessmentReport(',
  ]).map(block).join('\n\n');
  let printed = null;
  const env = {
    openPrintWindow: (title, body) => { printed = body; },
    toast: () => {},
    getStaff: () => null,
    getFac: () => null,
    fullName: (s) => s ? `${s.first || ''} ${s.last || ''}`.trim() : '',
    nextBelt: (b) => { const o = ['White','Yellow','Green','Blue','Brown','Black']; const i = o.indexOf(b); return i >= 0 && i < 5 ? o[i + 1] : null; },
    Security: { sanitize: (s) => String(s) },
  };
  const fns = new Function(
    'BELT_TEST_CONFIG', 'window', 'DB', 'openPrintWindow', 'toast', 'getStaff', 'getFac', 'fullName', 'nextBelt', 'Security',
    code + '\nreturn { buildAssessmentReportHTML, downloadAssessmentReport };'
  );
  return {
    renderB: (pr, staff, fac) => {
      const f = fns(BELT_TEST_CONFIG, {}, { placementReviews: [pr] }, env.openPrintWindow, env.toast, env.getStaff, env.getFac, env.fullName, env.nextBelt, env.Security);
      return f.buildAssessmentReportHTML(pr, staff, fac);
    },
    renderA: (pr) => {
      printed = null;
      const f = fns(BELT_TEST_CONFIG, {}, { placementReviews: [pr] }, env.openPrintWindow, env.toast, env.getStaff, env.getFac, env.fullName, env.nextBelt, env.Security);
      f.downloadAssessmentReport(pr.id);
      return printed;
    },
  };
}

// ── Synthetic responses shaped like the live case ────────────────────────────
// 39/40 knowledge (97.5%) + uniform simulation 68 → blended 85.7, under Brown's 87 threshold
// but a genuine knowledge foundation: exactly the shape the old evaluator produced.
function mkResponses(kCorrectOf40, simScore) {
  const rs = [];
  let k = 0, s = 0;
  for (let l = 1; l <= 5; l++) for (let i = 0; i < 8; i++, k++)
    rs.push({ qId: 'k' + k, level: l, type: 'knowledge', question: 'K question ' + k, answer: 'ans', correct: k < kCorrectOf40 });
  for (let l = 1; l <= 5; l++) for (let i = 0; i < 4; i++, s++)
    rs.push({ qId: 's' + s, level: l, type: 'simulation', question: 'S scenario ' + s, answer: 'ans', aiScore: simScore });
  return rs;
}

const overriddenPR = {
  id: 'pr-override', staffId: 'st1', fid: 'f1', staffName: 'Sharon Test', staffTitle: 'Technician',
  status: 'adjusted', tentativeBelt: 'Blue', confirmedBelt: 'Brown',
  confirmedBy: 'J. Jacobs', confirmedAt: '2026-08-08T00:00:00+00:00', // timestamptz shape, as PostgREST returns it
  assessorNote: 'Assessor Error Correction — simulation scored by the pre-calibration evaluator',
  responses: mkResponses(39, 68), levelScores: {}, submittedAt: '2026-05-01',
};
const confirmedPR   = { ...overriddenPR, id: 'pr-confirmed', status: 'confirmed' };
const pendingPR     = { ...overriddenPR, id: 'pr-pending', status: 'pending', confirmedBelt: null, confirmedBy: null, confirmedAt: null };
const adjustedNoBelt = { ...overriddenPR, id: 'pr-adj-nobelt', confirmedBelt: null };
const adjustedClears = { ...overriddenPR, id: 'pr-adj-clears', confirmedBelt: 'White' };

let pass = 0, fail = 0;
const ok = (cond, label) => { if (cond) { pass++; console.log('  PASS  ' + label); } else { fail++; console.log('  FAIL  ' + label); } };

const model = buildModel(path.join(REPO, 'src/js/ui-views.js'));

console.log('\n1. Overridden review (adjusted → Brown, scores under Brown)');
const m = model(overriddenPR);
ok(m.belt === 'Brown', 'floors and thresholds grade against Brown (belt = Brown)');
ok(m.th && m.th.blended === (BELT_TEST_CONFIG.belts.Brown || {}).blendedMin, 'threshold row is Brown\'s own');
ok(m.blended < m.th.blended, 'fixture is real: blended sits under Brown\'s threshold');
ok(m.outcome !== 'CLEAN' && m.outcome !== 'CONDITIONAL', 'score-derived outcome unchanged (not promoted): ' + m.outcome);
ok(m.beltAwarded === 'Brown', 'BELT AWARDED prints Brown, not NONE');
ok(m.overrideAward === true, 'award is marked as standing on the override');
ok(m.override && m.override.by === 'J. Jacobs' && m.override.at === '2026-08-08', 'attribution carries who and when');
ok(m.determination === `BROWN BELT -- Conditional (${[m.nSup && m.nSup + ' supervised-practice', m.nBlock && m.nBlock + ' blocking', m.nReq && m.nReq + ' required', m.nAdv && m.nAdv + ' advisory'].filter(Boolean).join(', ') || 'no conditions'})`, 'determination reads like a normal conditional award: ' + m.determination);
ok(m.nextBelt === 'Black', 'next-belt target follows the awarded belt (Black)');
ok(m.conditions.length > 0, 'development conditions still present (' + m.conditions.length + ')');

console.log('\n2. Same scores, status confirmed — the old behavior must hold exactly');
const mc = model(confirmedPR);
ok(mc.beltAwarded === null, 'confirmed review with scores under threshold still awards nothing');
ok(mc.override === null && mc.overrideAward === false, 'no override fields on a confirmed review');
ok(mc.outcome === m.outcome, 'outcome identical to the overridden twin (scoring untouched)');
ok(JSON.stringify(mc.conditions) === JSON.stringify(m.conditions), 'conditions identical to the overridden twin');

console.log('\n3. Adjusted with no confirmed belt — defensive, treated as not overridden');
const mn = model(adjustedNoBelt);
ok(mn.override === null && mn.overrideAward === false, 'no override without a confirmed belt');

console.log('\n4. Adjusted where the scores DO clear the confirmed belt');
const ma = model(adjustedClears);
ok(ma.outcome === 'CLEAN' || ma.outcome === 'CONDITIONAL', 'score outcome kept: ' + ma.outcome);
ok(ma.overrideAward === false, 'award stands on the scores, not the override');
ok(ma.beltAwarded === 'White', 'awarded belt is the adjusted belt');
ok(ma.override !== null, 'attribution data still present for the renderers');

const oldPath = process.argv[2];
if (oldPath && fs.existsSync(oldPath)) {
  console.log('\n5. Non-adjusted reviews vs the pre-change model (' + path.basename(oldPath) + ')');
  const oldModel = buildModel(oldPath);
  for (const pr of [confirmedPR, pendingPR, adjustedNoBelt]) {
    const a = oldModel(pr), b = model(pr);
    const keys = Object.keys(a);
    const diff = keys.filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
    ok(diff.length === 0, pr.id + ': every pre-existing field identical' + (diff.length ? ' — differs: ' + diff.join(', ') : ''));
  }
} else {
  console.log('\n5. (skipped — pass the pre-change ui-views.js as argv[2] to diff old vs new)');
}

console.log('\n6. Renderer smoke tests — the award prints, the override does not');
// Any of these strings on a report is the regression: they are what a leader or client would read.
const OV_WORDS = [/override/i, /assessor adjustment/i, /J\. Jacobs/, /Assessor Error Correction/];
const noOverrideWording = html => OV_WORDS.filter(re => re.test(html)).map(String);

const R = buildRenderers(path.join(REPO, 'src/js/ui-views.js'));
const htmlA = R.renderA(overriddenPR);
ok(!!htmlA, 'renderer A (review-card Report button) produced a document');
ok(htmlA.includes('BROWN'), 'A: prints BROWN as the awarded belt');
ok(!htmlA.includes('>NONE<'), 'A: BELT AWARDED no longer NONE');
ok(htmlA.includes('CONDITIONAL'), 'A: award labelled like a normal conditional award');
ok(noOverrideWording(htmlA).length === 0, 'A: no override wording on the report — ' + (noOverrideWording(htmlA).join(', ') || 'clean'));
const htmlA2 = R.renderA(confirmedPR);
ok(htmlA2.includes('>NONE<'), 'A: confirmed twin unchanged (NONE)');

const staffStub = { first: 'Sharon', last: 'Test', role: 'Technician' };
const facStub = { name: 'Test Facility' };
const htmlB = R.renderB(overriddenPR, staffStub, facStub);
ok(htmlB.includes('BROWN BELT, Conditional'), 'B: report status reads like a normal conditional award');
ok(!htmlB.includes('No belt is in effect'), 'B: eligibility text does not contradict the award');
ok(!htmlB.includes('White Belt assessment (regardless of level assessed)'), 'B: no White re-assess line on an overridden award');
ok(noOverrideWording(htmlB).length === 0, 'B: no override wording on the report — ' + (noOverrideWording(htmlB).join(', ') || 'clean'));
const htmlB2 = R.renderB(confirmedPR, staffStub, facStub);
ok(noOverrideWording(htmlB2).length === 0, 'B: confirmed twin carries no override wording either');
// The record behind the report keeps the attribution.
ok(m.override.by === 'J. Jacobs' && m.override.at === '2026-08-08' && m.override.note.startsWith('Assessor Error Correction'), 'attribution still lives in the model, off the report');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
