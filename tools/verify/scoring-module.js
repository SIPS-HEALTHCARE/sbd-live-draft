// Loads the live placement-scoring functions out of ui-views.js as a plain Node module.
//
// ui-views.js is a 15,000-line browser file with no module boundaries, so the only way to
// run this scoring code outside a live session is to slice the functions out by anchor.
// Slicing by anchor rather than by line number matters: the file is edited constantly and
// hardcoded ranges silently pick up the wrong code.
//
// Shared by tools/verify/t65-scoring-check.js and scripts/rescore-placements.js so both
// grade with the SAME engine the browser runs — a second copy of the belt logic is exactly
// how a report and a card came to disagree before.
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..', '..');

const ANCHORS = [
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
  'function sbdIsDangerousResponse(',
  'function _dangerousRiskDesc(',
  'function detectDangerousAnswers(',
  'function deriveOutcome(',
  'function sbdAdvancementBlock(',
];

const EXPORTS = `{ sbdKnowledgeOverall, sbdSuggestBelt, sbdBeltThresholds, sbdSpecFloors,
    sbdSpecOveralls, sbdKnowledgeFloor, sbdSimFloor, rptComputeModel, deriveOutcome,
    sbdBuildProvisions, sbdOpenProvisions, sbdHasOpenProvision, sbdAdvancementBlock,
    sbdIsDangerousResponse, detectDangerousAnswers, _dangerousRiskDesc }`;

// Optionally point at a different checkout of ui-views.js (verify-override-award.js compares
// against the pre-change file extracted from git).
module.exports = function loadScoringModule(uiViewsPath) {
  const src = fs.readFileSync(uiViewsPath || path.join(REPO, 'src/js/ui-views.js'), 'utf8').split('\n');

  function block(startsWith) {
    const i = src.findIndex(l => l.startsWith(startsWith));
    if (i < 0) throw new Error('anchor not found: ' + startsWith);
    for (let j = i; j < src.length; j++) {
      if (['}', '};', ']', '];'].includes(src[j])) return src.slice(i, j + 1).join('\n');
    }
    throw new Error('no closing brace for: ' + startsWith);
  }

  // belt-test-engine.js is an IIFE bound to globalThis, and dual-exports for Node.
  require(path.join(REPO, 'src/js/belt-test-engine.js'));
  const BELT_TEST_CONFIG = globalThis.BELT_TEST_CONFIG;
  if (!BELT_TEST_CONFIG) throw new Error('BELT_TEST_CONFIG not exported from belt-test-engine.js');

  const slices = ANCHORS.map(block).join('\n\n');
  return new Function('BELT_TEST_CONFIG', 'window', `${slices}\n  return ${EXPORTS};`)(BELT_TEST_CONFIG, undefined);
};
