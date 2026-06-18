/* ============================================================================
 * belt-test-engine.js — Dynamic Belt Test scoring engine (Track A4)
 *
 * Authoritative source: "SBD OS Belt Assessment Scoring Logic Specification"
 * v2.0 (Dr. Jake Tayler Jacobs, May 12 2026, repo root PDF). Implements the
 * corrected four-stage gated pipeline EXACTLY as specified:
 *   Stage 1  Per-level floor check (Knowledge L1-L5, Simulation L1-L5)
 *   Stage 2  Component overall minimum (Knowledge, Simulation)
 *   Stage 3  Blended minimum  ( K*0.60 + S*0.40 )
 *   Stage 4  Critical-question check (Blue Belt and above)
 *
 * ⚠️ This is NOT the legacy BELT_THRESHOLDS / deriveOutcome() in ui-views.js.
 *    That config is the placement-report 50/50 blend and is intentionally left
 *    untouched. This engine owns its own BELT_TEST_CONFIG (spec §9) and is the
 *    ONLY scorer for the dynamic belt test. Results are persisted and never
 *    recomputed on read (spec §12).
 *
 * Pure functions only — no DOM, no network. Dual-exported: attaches to the
 * global (browser) and module.exports (Node harness / require()).
 * ==========================================================================*/
(function (root) {
  'use strict';

  // Belt progression. Ascending order = index 0..5.
  var BELTS = ['White', 'Yellow', 'Green', 'Blue', 'Brown', 'Black'];
  // Suggestion engine walks Black -> White (spec §8.2).
  var BELT_ORDER_DESC = ['Black', 'Brown', 'Blue', 'Green', 'Yellow', 'White'];
  var LEVELS = [1, 2, 3, 4, 5];

  function beltRank(belt) { return BELTS.indexOf(belt); }

  /* --------------------------------------------------------------------------
   * BELT_TEST_CONFIG — spec §9 consolidated threshold table, verbatim.
   * Per belt: knowledge overall min, per-level knowledge floors (null = N/A),
   * simulation overall min, per-level simulation floors, individual simulation
   * response min, blended min. Weights and severity margins are belt-invariant.
   * "Do not hardcode these values inline" (spec §9) — they live here only.
   * ------------------------------------------------------------------------*/
  var BELT_TEST_CONFIG = {
    weights: { knowledge: 0.60, simulation: 0.40 },
    // Severity margins (spec §8.3 / §10.1).
    severity: {
      knowledgeRequiredMargin: 8, // K level >8 below floor => REQUIRED, else ADVISORY
      simRequiredMargin: 5,       // Sim level >5 below floor => REQUIRED, else ADVISORY
      watchMargin: 5              // passed but within this margin => WATCH flag
    },
    belts: {
      White:  { kOverallMin: 80, kLevelFloors: { 1: 80, 2: null, 3: null, 4: null, 5: null },
                simOverallMin: 72, simLevelFloors: { 1: 70, 2: null, 3: null, 4: null, 5: null },
                simIndividualMin: 65, blendedMin: 75 },
      Yellow: { kOverallMin: 83, kLevelFloors: { 1: 88, 2: 80, 3: null, 4: null, 5: null },
                simOverallMin: 75, simLevelFloors: { 1: 75, 2: 70, 3: null, 4: null, 5: null },
                simIndividualMin: 68, blendedMin: 78 },
      Green:  { kOverallMin: 86, kLevelFloors: { 1: 90, 2: 85, 3: 80, 4: null, 5: null },
                simOverallMin: 78, simLevelFloors: { 1: 78, 2: 75, 3: 70, 4: null, 5: null },
                simIndividualMin: 72, blendedMin: 81 },
      Blue:   { kOverallMin: 89, kLevelFloors: { 1: 95, 2: 90, 3: 85, 4: 80, 5: null },
                simOverallMin: 82, simLevelFloors: { 1: 82, 2: 80, 3: 78, 4: 75, 5: null },
                simIndividualMin: 75, blendedMin: 85 },
      Brown:  { kOverallMin: 91, kLevelFloors: { 1: 98, 2: 93, 3: 88, 4: 85, 5: 80 },
                simOverallMin: 84, simLevelFloors: { 1: 83, 2: 82, 3: 80, 4: 78, 5: 75 },
                simIndividualMin: 77, blendedMin: 87 },
      Black:  { kOverallMin: 92, kLevelFloors: { 1: 100, 2: 95, 3: 90, 4: 88, 5: 85 },
                simOverallMin: 87, simLevelFloors: { 1: 85, 2: 85, 3: 82, 4: 80, 5: 78 },
                simIndividualMin: 78, blendedMin: 90 }
    }
  };

  // Critical-question check applies for Blue Belt and above only (spec §4, §10.2).
  function criticalChecked(belt) { return beltRank(belt) >= beltRank('Blue'); }

  function round1(n) { return Math.round(n * 10) / 10; }

  function groupByLevel(items) {
    var by = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    (items || []).forEach(function (it) {
      var L = Number(it.level);
      if (by[L]) by[L].push(it);
    });
    return by;
  }

  /* ---- Stage inputs ------------------------------------------------------ */

  // scoreKnowledge: per-level % correct, overall = MEAN OF LEVEL SCORES (spec
  // §5.2 — NOT raw count / total). answers: { questionId: selectedOptionIndex }.
  function scoreKnowledge(questions, answers) {
    answers = answers || {};
    var by = groupByLevel(questions);
    var levelScores = {};
    var perQuestion = [];
    LEVELS.forEach(function (L) {
      var qs = by[L];
      var correct = 0;
      qs.forEach(function (q) {
        var picked = answers[q.id];
        var isCorrect = picked != null && Number(picked) === Number(q.correct);
        if (isCorrect) correct++;
        perQuestion.push({ id: q.id, level: L, slot: q.slot, correct: isCorrect,
          is_critical: !!q.is_critical, category: q.slot });
      });
      levelScores[L] = qs.length ? (correct / qs.length) * 100 : null;
    });
    var present = LEVELS.map(function (L) { return levelScores[L]; })
                        .filter(function (v) { return v != null; });
    var overall = present.length ? present.reduce(function (a, b) { return a + b; }, 0) / present.length : 0;
    return { levelScores: levelScores, overall: overall, perQuestion: perQuestion };
  }

  // scoreSimulation: per-level average, overall = mean of level averages,
  // individual min = lowest single response. scores: { questionId: 0-100 }.
  function scoreSimulation(questions, scores) {
    scores = scores || {};
    var by = groupByLevel(questions);
    var levelAvgs = {};
    var perResponse = [];
    var allScores = [];
    LEVELS.forEach(function (L) {
      var qs = by[L];
      var sum = 0, n = 0;
      qs.forEach(function (q) {
        var sc = Number(scores[q.id]);
        if (!isFinite(sc)) sc = 0;
        sum += sc; n++;
        allScores.push(sc);
        perResponse.push({ id: q.id, level: L, slot: q.slot, score: sc,
          is_critical: !!q.is_critical, category: q.slot });
      });
      levelAvgs[L] = n ? sum / n : null;
    });
    var present = LEVELS.map(function (L) { return levelAvgs[L]; })
                        .filter(function (v) { return v != null; });
    var overall = present.length ? present.reduce(function (a, b) { return a + b; }, 0) / present.length : 0;
    var individualMin = allScores.length ? Math.min.apply(null, allScores) : 0;
    return { levelAvgs: levelAvgs, overall: overall, individualMin: individualMin, perResponse: perResponse };
  }

  /* ---- Stage 1: per-level floor checks ----------------------------------- */

  function evaluateKnowledgeFloors(levelScores, belt) {
    var floors = BELT_TEST_CONFIG.belts[belt].kLevelFloors;
    var failures = [];
    LEVELS.forEach(function (L) {
      var req = floors[L];
      if (req == null) return; // N/A at this belt
      var scored = levelScores[L];
      if (scored == null) return;
      if (scored < req) failures.push({ level: L, scored: scored, required: req, passed: false });
    });
    return { passed: failures.length === 0, failures: failures };
  }

  function evaluateSimulationFloors(levelAvgs, belt) {
    var floors = BELT_TEST_CONFIG.belts[belt].simLevelFloors;
    var failures = [];
    LEVELS.forEach(function (L) {
      var req = floors[L];
      if (req == null) return;
      var scored = levelAvgs[L];
      if (scored == null) return;
      if (scored < req) failures.push({ level: L, scored: scored, required: req, passed: false });
    });
    return { passed: failures.length === 0, failures: failures };
  }

  // Individual simulation response minimum (spec §6.5). Applies to EVERY
  // response regardless of whether that level is gated. Failures are grouped
  // by level so the condition set matches the spec §14 worked example.
  function evaluateIndividualSim(perResponse, belt) {
    var min = BELT_TEST_CONFIG.belts[belt].simIndividualMin;
    var byLevel = {};
    perResponse.forEach(function (r) {
      if (r.score < min) {
        (byLevel[r.level] = byLevel[r.level] || []).push(r);
      }
    });
    var groups = Object.keys(byLevel).map(function (L) {
      var resps = byLevel[L];
      return {
        level: Number(L),
        required: min,
        responses: resps.map(function (r) { return { id: r.id, score: r.score, is_critical: r.is_critical }; }),
        critical: resps.some(function (r) { return r.is_critical; })
      };
    });
    return { passed: groups.length === 0, min: min, groups: groups };
  }

  /* ---- Stage 4: critical-question check (Blue+) -------------------------- */

  function checkCriticals(perQuestionK, perResponseS, belt) {
    if (!criticalChecked(belt)) return { passed: true, misses: [] };
    var misses = [];
    perQuestionK.forEach(function (q) {
      if (q.is_critical && !q.correct) {
        misses.push({ kind: 'knowledge', id: q.id, level: q.level, category: q.category });
      }
    });
    // A critical simulation scenario scored below the individual floor is a
    // BLOCKING critical condition (handled in evaluateIndividualSim grouping);
    // we additionally surface it as a critical miss for the flag set.
    var indMin = BELT_TEST_CONFIG.belts[belt].simIndividualMin;
    perResponseS.forEach(function (r) {
      if (r.is_critical && r.score < indMin) {
        misses.push({ kind: 'simulation', id: r.id, level: r.level, category: r.category, score: r.score });
      }
    });
    return { passed: misses.length === 0, misses: misses };
  }

  /* ---- Severity classification (spec §8.3) ------------------------------- */
  // Component OVERALL minimum failures are REQUIRED regardless of margin
  // (spec §8.3 lists ADVISORY only for LEVEL averages; spec §14 classifies a
  // 3.5-pt overall miss as REQUIRED). LEVEL failures split on the margin.

  function knowledgeLevelSeverity(scored, required) {
    var m = BELT_TEST_CONFIG.severity.knowledgeRequiredMargin;
    return (required - scored) > m ? 'REQUIRED' : 'ADVISORY';
  }
  function simLevelSeverity(scored, required) {
    var m = BELT_TEST_CONFIG.severity.simRequiredMargin;
    return (required - scored) > m ? 'REQUIRED' : 'ADVISORY';
  }

  /* ---- Belt suggestion engine (spec §8.2) -------------------------------- */
  // Blended score SETS the belt: first belt (walking Black->White) whose
  // blended min the candidate meets. Floors then set PASS vs CONDITIONAL_PASS.
  function suggestBeltFromBlended(blended) {
    for (var i = 0; i < BELT_ORDER_DESC.length; i++) {
      var b = BELT_ORDER_DESC[i];
      if (blended >= BELT_TEST_CONFIG.belts[b].blendedMin) return b;
    }
    return null; // below even White -> REMEDIATION
  }

  /* ---- Floors evaluated against a specific target belt ------------------- */
  // Returns the structured floor results + the complete condition set +
  // reason codes + remediation/watch flags for THAT belt. Never short-circuits
  // — collects every failure (spec §8.4 "Collecting All Conditions").
  function evaluateAtBelt(kScore, sScore, belt) {
    var cfg = BELT_TEST_CONFIG.belts[belt];

    var kFloors = evaluateKnowledgeFloors(kScore.levelScores, belt);
    var sFloors = evaluateSimulationFloors(sScore.levelAvgs, belt);
    var indFloor = evaluateIndividualSim(sScore.perResponse, belt);
    var crit = checkCriticals(kScore.perQuestion, sScore.perResponse, belt);

    var kOverallPassed = kScore.overall >= cfg.kOverallMin;
    var sOverallPassed = sScore.overall >= cfg.simOverallMin;

    var conditions = [];
    var reasonCodes = [];
    var remediationFlags = [];

    // Knowledge level floor failures.
    kFloors.failures.forEach(function (f) {
      var sev = knowledgeLevelSeverity(f.scored, f.required);
      conditions.push({ type: 'KNOWLEDGE_LEVEL_FAIL', severity: sev, level: f.level,
        scored: round1(f.scored), required: f.required });
      remediationFlags.push({ flag: 'KNOWLEDGE_LEVEL_FAIL', severity: 'Critical', level: f.level,
        score: round1(f.scored), floor: f.required });
    });
    if (kFloors.failures.length) reasonCodes.push('KNOWLEDGE_FLOOR_FAIL');

    // Simulation level floor failures.
    sFloors.failures.forEach(function (f) {
      var sev = simLevelSeverity(f.scored, f.required);
      conditions.push({ type: 'SIM_LEVEL_FAIL', severity: sev, level: f.level,
        scored: round1(f.scored), required: f.required });
      remediationFlags.push({ flag: 'SIM_LEVEL_FAIL', severity: 'Critical', level: f.level,
        score: round1(f.scored), floor: f.required });
    });
    if (sFloors.failures.length) reasonCodes.push('SIM_FLOOR_FAIL');

    // Individual simulation response failures (grouped by level). BLOCKING if
    // any response in the group is critical-tagged, else REQUIRED (spec §14).
    indFloor.groups.forEach(function (g) {
      var sev = g.critical ? 'BLOCKING' : 'REQUIRED';
      conditions.push({ type: 'SIM_INDIVIDUAL_FAIL', severity: sev, level: g.level,
        required: g.required, responses: g.responses });
      g.responses.forEach(function (r) {
        remediationFlags.push({ flag: 'SIM_INDIVIDUAL_LOW', severity: 'Critical',
          id: r.id, level: g.level, score: r.score, floor: g.required });
      });
    });
    if (indFloor.groups.length) reasonCodes.push('SIM_INDIVIDUAL_FAIL');

    // Component overall minimum failures (always REQUIRED).
    if (!kOverallPassed) {
      conditions.push({ type: 'KNOWLEDGE_OVERALL_FAIL', severity: 'REQUIRED',
        scored: round1(kScore.overall), required: cfg.kOverallMin });
      reasonCodes.push('KNOWLEDGE_OVERALL_FAIL');
    }
    if (!sOverallPassed) {
      conditions.push({ type: 'SIM_OVERALL_FAIL', severity: 'REQUIRED',
        scored: round1(sScore.overall), required: cfg.simOverallMin });
      reasonCodes.push('SIM_OVERALL_FAIL');
    }

    // Critical-question misses (Blue+). Always BLOCKING.
    crit.misses.forEach(function (m) {
      conditions.push({ type: 'CRITICAL_QUESTION_MISS', severity: 'BLOCKING',
        kind: m.kind, id: m.id, level: m.level, category: m.category });
      remediationFlags.push({ flag: 'CRITICAL_QUESTION_MISS', severity: 'Critical',
        id: m.id, level: m.level, category: m.category });
    });
    if (crit.misses.length) reasonCodes.push('CRITICAL_QUESTION_MISS');

    var allFloorsPass = kFloors.passed && sFloors.passed && indFloor.passed &&
                        kOverallPassed && sOverallPassed && crit.passed;

    return {
      belt: belt,
      kFloorResults: floorRows(kScore.levelScores, cfg.kLevelFloors),
      sFloorResults: floorRows(sScore.levelAvgs, cfg.simLevelFloors),
      kOverallPassed: kOverallPassed,
      sOverallPassed: sOverallPassed,
      individualFloorPassed: indFloor.passed,
      criticalPassed: crit.passed,
      allFloorsPass: allFloorsPass,
      conditions: conditions,
      reasonCodes: reasonCodes,
      remediationFlags: remediationFlags
    };
  }

  function floorRows(scoresByLevel, floors) {
    return LEVELS.map(function (L) {
      var req = floors[L];
      var scored = scoresByLevel[L];
      return {
        level: L,
        scored: scored == null ? null : round1(scored),
        required: req, // null = N/A at this belt
        passed: req == null ? null : (scored != null && scored >= req)
      };
    });
  }

  // Watch flags: a level that PASSED its floor but lands within watchMargin.
  function buildWatchFlags(kScore, sScore, belt) {
    var cfg = BELT_TEST_CONFIG.belts[belt];
    var m = BELT_TEST_CONFIG.severity.watchMargin;
    var flags = [];
    LEVELS.forEach(function (L) {
      var kReq = cfg.kLevelFloors[L], kSc = kScore.levelScores[L];
      if (kReq != null && kSc != null && kSc >= kReq && (kSc - kReq) <= m) {
        flags.push({ flag: 'KNOWLEDGE_LEVEL_WATCH', severity: 'Warning', level: L,
          score: round1(kSc), floor: kReq, margin: round1(kSc - kReq) });
      }
      var sReq = cfg.simLevelFloors[L], sSc = sScore.levelAvgs[L];
      if (sReq != null && sSc != null && sSc >= sReq && (sSc - sReq) <= m) {
        flags.push({ flag: 'SIM_LEVEL_WATCH', severity: 'Warning', level: L,
          score: round1(sSc), floor: sReq, margin: round1(sSc - sReq) });
      }
    });
    return flags;
  }

  /* ---- Top-level composition --------------------------------------------- */
  // scoreBeltTest(test, mcqAnswers, simScores) -> spec §12 AssessmentResult.
  //   test       : { target_belt, questions: { knowledge:[...], simulation:[...] } }
  //   mcqAnswers : { knowledgeQuestionId: selectedOptionIndex }
  //   simScores  : { simQuestionId: 0-100 numeric (AI or keyword fallback) }
  function scoreBeltTest(test, mcqAnswers, simScores) {
    var questions = test.questions || {};
    var kScore = scoreKnowledge(questions.knowledge || [], mcqAnswers);
    var sScore = scoreSimulation(questions.simulation || [], simScores);

    var blended = (kScore.overall * BELT_TEST_CONFIG.weights.knowledge) +
                  (sScore.overall * BELT_TEST_CONFIG.weights.simulation);

    var suggestedBelt = suggestBeltFromBlended(blended);

    var outcome, evalAtBelt, conditions, reasonCodes, remediationFlags, watchFlags;

    if (!suggestedBelt) {
      // Blended below even White Belt threshold -> full remediation.
      outcome = 'REMEDIATION';
      conditions = [];
      reasonCodes = ['BLENDED_BELOW_ALL_THRESHOLDS'];
      // Still evaluate floors against White for the remediation plan detail.
      evalAtBelt = evaluateAtBelt(kScore, sScore, 'White');
      remediationFlags = evalAtBelt.remediationFlags;
      watchFlags = buildWatchFlags(kScore, sScore, 'White');
    } else {
      evalAtBelt = evaluateAtBelt(kScore, sScore, suggestedBelt);
      conditions = evalAtBelt.conditions;
      reasonCodes = evalAtBelt.reasonCodes.slice();
      remediationFlags = evalAtBelt.remediationFlags;
      watchFlags = buildWatchFlags(kScore, sScore, suggestedBelt);
      outcome = evalAtBelt.allFloorsPass ? 'PASS' : 'CONDITIONAL_PASS';
      reasonCodes.unshift(outcome);
    }

    var systemSuggestion = (outcome === 'REMEDIATION') ? 'REMEDIATION' : suggestedBelt;

    return {
      // Knowledge
      k_level_scores: roundLevels(kScore.levelScores),
      k_overall: round1(kScore.overall),
      k_floor_results: evalAtBelt.kFloorResults,
      k_overall_passed: kScore.overall >= (suggestedBelt ? BELT_TEST_CONFIG.belts[suggestedBelt].kOverallMin : BELT_TEST_CONFIG.belts.White.kOverallMin),
      // Simulation
      sim_responses: sScore.perResponse.map(function (r) {
        return { question_id: r.id, level: r.level, score: r.score }; }),
      sim_level_avgs: roundLevels(sScore.levelAvgs),
      sim_overall: round1(sScore.overall),
      sim_floor_results: evalAtBelt.sFloorResults,
      sim_individual_min: round1(sScore.individualMin),
      sim_overall_passed: sScore.overall >= (suggestedBelt ? BELT_TEST_CONFIG.belts[suggestedBelt].simOverallMin : BELT_TEST_CONFIG.belts.White.simOverallMin),
      // Blended
      blended_score: round1(blended),
      blended_passed: !!suggestedBelt,
      // Suggestion
      target_belt: test.target_belt || null,
      system_suggestion: systemSuggestion,
      outcome: outcome,
      suggestion_reason_codes: dedupe(reasonCodes),
      conditions: conditions,
      watch_flags: watchFlags,
      remediation_flags: remediationFlags,
      // Final / override (present-but-unused at v1; assessor surface fills these)
      final_belt: null,
      override_applied: false,
      override_by: null,
      override_justification: null,
      override_at: null,
      status: 'PENDING_REVIEW',
      // Diagnostics
      _engine_version: '2.0',
      _scored_at: new Date().toISOString()
    };
  }

  function roundLevels(obj) {
    var out = {};
    LEVELS.forEach(function (L) { out['L' + L] = obj[L] == null ? null : round1(obj[L]); });
    return out;
  }
  function dedupe(arr) {
    var seen = {}, out = [];
    arr.forEach(function (x) { if (!seen[x]) { seen[x] = 1; out.push(x); } });
    return out;
  }

  var BeltTestEngine = {
    BELTS: BELTS,
    LEVELS: LEVELS,
    BELT_TEST_CONFIG: BELT_TEST_CONFIG,
    beltRank: beltRank,
    scoreKnowledge: scoreKnowledge,
    scoreSimulation: scoreSimulation,
    evaluateKnowledgeFloors: evaluateKnowledgeFloors,
    evaluateSimulationFloors: evaluateSimulationFloors,
    evaluateIndividualSim: evaluateIndividualSim,
    checkCriticals: checkCriticals,
    suggestBeltFromBlended: suggestBeltFromBlended,
    evaluateAtBelt: evaluateAtBelt,
    buildWatchFlags: buildWatchFlags,
    scoreBeltTest: scoreBeltTest
  };

  // Dual export: browser global + CommonJS (Node harness).
  root.BeltTestEngine = BeltTestEngine;
  root.BELT_TEST_CONFIG = BELT_TEST_CONFIG;
  if (typeof module !== 'undefined' && module.exports) module.exports = BeltTestEngine;

})(typeof globalThis !== 'undefined' ? globalThis : this);
