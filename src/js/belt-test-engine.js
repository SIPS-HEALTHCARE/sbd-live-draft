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
   * BELT_TEST_CONFIG, the consolidated threshold table from the Scoring
   * Specification v1.0 §7. Per belt: knowledge overall min (the hard gate on
   * belt selection), per-level knowledge floors, simulation overall min,
   * per-level simulation floors, individual simulation response min, blended
   * min. Weights and severity bands are belt-invariant. The spec says not to
   * hardcode these values inline, so they live here only.
   * ------------------------------------------------------------------------*/
  var BELT_TEST_CONFIG = {
    weights: { knowledge: 0.60, simulation: 0.40 },
    // Condition severity is graded by the SIZE of the miss (Scoring Specification
    // v1.0 §10.2), not by a per-component margin: a 0.5-point miss and a 20-point
    // miss must not read the same. Two severities are fixed and never computed
    // from a gap (a dangerous finding, and an individual response below the
    // minimum) are set at the point they are raised.
    severity: {
      blockingGap: 5.0,  // gap > 5.0 below the floor  => BLOCKING
      requiredGap: 2.0,  // gap 2.0..5.0 inclusive     => REQUIRED, under 2.0 => ADVISORY
      watchMargin: 5     // passed but within this margin => WATCH flag
    },
    // Master constants, Scoring Specification v1.0 §7. Belt thresholds and the
    // component overall floors are §7.1. The knowledge per-level floor is a flat
    // 80.0 at every level and every belt (§7.2). The simulation per-level floors
    // step down from the belt's own simulation floor F as [F, F-5, F-10, F-10,
    // F-10] (§7.3), on the reasoning that the foundational scenarios are the ones
    // putting a patient at risk today. The individual response minimum is a
    // universal 65.0 (§7.4), the band the calibration standard defines as
    // passing at every belt level.
    //
    // No level is ungated any more: a null floor used to mean "this belt does not
    // gate this level", and the spec replaces that with a floor everywhere. Reader
    // code that still handles null is left alone rather than deleted, so restoring
    // a null floor stays a config change.
    belts: {
      White:  { kOverallMin: 80, kLevelFloors: { 1: 80, 2: 80, 3: 80, 4: 80, 5: 80 },
                simOverallMin: 72, simLevelFloors: { 1: 72, 2: 67, 3: 62, 4: 62, 5: 62 },
                simIndividualMin: 65, blendedMin: 75 },
      Yellow: { kOverallMin: 83, kLevelFloors: { 1: 80, 2: 80, 3: 80, 4: 80, 5: 80 },
                simOverallMin: 75, simLevelFloors: { 1: 75, 2: 70, 3: 65, 4: 65, 5: 65 },
                simIndividualMin: 65, blendedMin: 78 },
      Green:  { kOverallMin: 86, kLevelFloors: { 1: 80, 2: 80, 3: 80, 4: 80, 5: 80 },
                simOverallMin: 78, simLevelFloors: { 1: 78, 2: 73, 3: 68, 4: 68, 5: 68 },
                simIndividualMin: 65, blendedMin: 81 },
      Blue:   { kOverallMin: 89, kLevelFloors: { 1: 80, 2: 80, 3: 80, 4: 80, 5: 80 },
                simOverallMin: 82, simLevelFloors: { 1: 82, 2: 77, 3: 72, 4: 72, 5: 72 },
                simIndividualMin: 65, blendedMin: 85 },
      Brown:  { kOverallMin: 91, kLevelFloors: { 1: 80, 2: 80, 3: 80, 4: 80, 5: 80 },
                simOverallMin: 84, simLevelFloors: { 1: 84, 2: 79, 3: 74, 4: 74, 5: 74 },
                simIndividualMin: 65, blendedMin: 87 },
      Black:  { kOverallMin: 92, kLevelFloors: { 1: 80, 2: 80, 3: 80, 4: 80, 5: 80 },
                simOverallMin: 87, simLevelFloors: { 1: 87, 2: 82, 3: 77, 4: 77, 5: 77 },
                simIndividualMin: 65, blendedMin: 90 }
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

  // scoreKnowledge: per-level % correct, overall = the ITEM-WEIGHTED mean across
  // every knowledge item (Scoring Specification v1.0 §4.4), which is the canonical
  // rule and is NOT the mean of the five level means. The two agree only while
  // every level holds the same item count, and L5 holds 7 rather than 8 since the
  // TIR34 question was pulled, so they disagree by about a tenth of a point.
  // answers: { questionId: selectedOptionIndex }.
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
    // Item-weighted: every answered item carries equal weight, so a level holding
    // fewer questions does not carry the same weight as a full one.
    var overall = perQuestion.length
      ? (perQuestion.filter(function (q) { return q.correct; }).length / perQuestion.length) * 100
      : 0;
    return { levelScores: levelScores, overall: overall, perQuestion: perQuestion };
  }

  // scoreSimulation: per-level average, overall = the ITEM-WEIGHTED mean across
  // every response (spec §5.7), individual min = lowest single response.
  // scores: { questionId: 0-100 }.
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
    // Item-weighted, same rule and same reasoning as knowledge (spec §5.7).
    var overall = allScores.length
      ? allScores.reduce(function (a, b) { return a + b; }, 0) / allScores.length
      : 0;
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

  /* ---- Severity classification (Scoring Specification v1.0 §10.2) --------- */
  // Graded by the size of the miss, on the spec's proportionality requirement.
  // The same three bands apply to every floor family that is graded at all, so
  // knowledge and simulation no longer carry separate margins. The severities
  // that are FIXED, supervised practice for a dangerous finding and BLOCKING
  // for an individual response under the minimum, never come through here.

  function severityForGap(gap) {
    var s = BELT_TEST_CONFIG.severity;
    if (gap > s.blockingGap) return 'BLOCKING';
    if (gap >= s.requiredGap) return 'REQUIRED';
    return 'ADVISORY';
  }
  function knowledgeLevelSeverity(scored, required) { return severityForGap(required - scored); }
  function simLevelSeverity(scored, required) { return severityForGap(required - scored); }

  /* ---- Belt suggestion engine (Scoring Specification v1.0 §8.2) ----------- */
  // Walking Black->White, take the first belt satisfying BOTH the blended
  // threshold AND the knowledge gate. The knowledge floor is a hard gate on
  // selection, not a condition trigger (§8.4): a candidate whose blended reaches
  // Green on a knowledge overall of 84 does not get a conditional Green, the
  // engine steps down and awards Yellow. Knowledge is what confirms the
  // foundational framework is right, and no condition can hold that open while
  // the operator works at a level the framework does not support. Simulation
  // floors work the other way and only turn the belt conditional.
  //
  // This used to select on the blended score alone, which is the regression the
  // spec's own Vector 4 exists to catch.
  function suggestBeltFromBlended(blended, kOverall) {
    for (var i = 0; i < BELT_ORDER_DESC.length; i++) {
      var b = BELT_ORDER_DESC[i];
      var c = BELT_TEST_CONFIG.belts[b];
      if (blended >= c.blendedMin && kOverall >= c.kOverallMin) return b;
    }
    return null; // below even White -> REMEDIATION
  }

  /* ---- Floors evaluated against a specific target belt ------------------- */
  // Returns the structured floor results + the complete condition set +
  // reason codes + remediation/watch flags for THAT belt. Never short-circuits
  // — collects every failure (spec §8.4 "Collecting All Conditions").
  // scope (default 'both') gates which component's checks run. 'knowledge' or
  // 'simulation' evaluate that half ALONE — the other half's floors/overall/
  // criticals are treated as passed and produce no conditions — so a per-gate
  // belt test scores in isolation (Ph.2b per-component). 'both' is byte-identical
  // to the pre-split behavior (the combined path + the acceptance harness).
  function evaluateAtBelt(kScore, sScore, belt, scope) {
    scope = scope || 'both';
    var doK = scope === 'both' || scope === 'knowledge';
    var doS = scope === 'both' || scope === 'simulation';
    kScore = kScore || {}; sScore = sScore || {};
    var cfg = BELT_TEST_CONFIG.belts[belt];

    var kFloors = doK ? evaluateKnowledgeFloors(kScore.levelScores, belt) : { passed: true, failures: [] };
    var sFloors = doS ? evaluateSimulationFloors(sScore.levelAvgs, belt) : { passed: true, failures: [] };
    var indFloor = doS ? evaluateIndividualSim(sScore.perResponse, belt) : { passed: true, min: cfg.simIndividualMin, groups: [] };
    var crit = checkCriticals(doK ? kScore.perQuestion : [], doS ? sScore.perResponse : [], belt);

    var kOverallPassed = doK ? (kScore.overall >= cfg.kOverallMin) : true;
    var sOverallPassed = doS ? (sScore.overall >= cfg.simOverallMin) : true;

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

    // Individual simulation response failures (grouped by level). A response
    // under the minimum is BLOCKING outright, whether or not the scenario is
    // critical-tagged (spec §10.2, one of the two fixed severities). This is
    // the check that catches the gap a level average hides.
    indFloor.groups.forEach(function (g) {
      var sev = 'BLOCKING';
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
      conditions.push({ type: 'SIM_OVERALL_FAIL',
        severity: severityForGap(cfg.simOverallMin - sScore.overall),
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
      kFloorResults: doK ? floorRows(kScore.levelScores, cfg.kLevelFloors) : [],
      sFloorResults: doS ? floorRows(sScore.levelAvgs, cfg.simLevelFloors) : [],
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
    return composeResult(kScore, sScore, test);
  }

  // composeResult: the shared blend + suggested-belt + floors-at-suggested-belt
  // core (spec §8). Both the single-pass scoreBeltTest AND the deferred
  // combineComponents feed it kScore/sScore objects, so the combined
  // recommendation is identical however the two halves were collected.
  function composeResult(kScore, sScore, test) {
    test = test || {};
    var blended = (kScore.overall * BELT_TEST_CONFIG.weights.knowledge) +
                  (sScore.overall * BELT_TEST_CONFIG.weights.simulation);

    var suggestedBelt = suggestBeltFromBlended(blended, kScore.overall);

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
      component: 'combined',
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

  /* ---- Per-component scoring (Ph.2b — each gate stands on its own) --------- */
  // Score ONE half in isolation against the target belt's floors, with its own
  // pass/fail (outcome PASS | REMEDIATION). No blend, no suggested belt — the
  // recommendation is deferred to combineComponents once both halves exist. Each
  // row carries a component_detail blob (raw per-level/per-question scores) so
  // the deferred combine is byte-identical to a single-pass score even across
  // separate sessions.
  function componentShell(component, belt) {
    return {
      component: component,
      target_belt: belt || null,
      k_level_scores: {}, k_overall: null, k_floor_results: [], k_overall_passed: null,
      sim_responses: [], sim_level_avgs: {}, sim_overall: null,
      sim_floor_results: [], sim_individual_min: null, sim_overall_passed: null,
      blended_score: null, blended_passed: null, system_suggestion: null,
      outcome: null, suggestion_reason_codes: [], conditions: [],
      watch_flags: [], remediation_flags: [], component_detail: null,
      final_belt: null, override_applied: false, override_by: null,
      override_justification: null, override_at: null,
      status: 'PENDING_REVIEW',
      _engine_version: '2.0', _scored_at: new Date().toISOString()
    };
  }

  function scoreComponentKnowledge(test, mcqAnswers) {
    test = test || {};
    var belt = test.target_belt;
    var kScore = scoreKnowledge((test.questions || {}).knowledge || [], mcqAnswers);
    var ev = evaluateAtBelt(kScore, {}, belt, 'knowledge');
    var outcome = ev.allFloorsPass ? 'PASS' : 'REMEDIATION';
    var reasonCodes = ev.reasonCodes.slice(); reasonCodes.unshift(outcome);
    var row = componentShell('knowledge', belt);
    row.k_level_scores = roundLevels(kScore.levelScores);
    row.k_overall = round1(kScore.overall);
    row.k_floor_results = ev.kFloorResults;
    row.k_overall_passed = ev.kOverallPassed;
    row.outcome = outcome;                     // per-gate pass/fail
    row.suggestion_reason_codes = dedupe(reasonCodes);
    row.conditions = ev.conditions;
    row.remediation_flags = ev.remediationFlags;
    row.watch_flags = buildWatchFlags(kScore, { levelAvgs: {} }, belt); // knowledge watch only
    row.component_detail = { levelScores: kScore.levelScores, overall: kScore.overall, perQuestion: kScore.perQuestion };
    return row;
  }

  function scoreComponentSimulation(test, simScores) {
    test = test || {};
    var belt = test.target_belt;
    var sScore = scoreSimulation((test.questions || {}).simulation || [], simScores);
    var ev = evaluateAtBelt({}, sScore, belt, 'simulation');
    var outcome = ev.allFloorsPass ? 'PASS' : 'REMEDIATION';
    var reasonCodes = ev.reasonCodes.slice(); reasonCodes.unshift(outcome);
    var row = componentShell('simulation', belt);
    row.sim_responses = sScore.perResponse.map(function (r) { return { question_id: r.id, level: r.level, score: r.score }; });
    row.sim_level_avgs = roundLevels(sScore.levelAvgs);
    row.sim_overall = round1(sScore.overall);
    row.sim_floor_results = ev.sFloorResults;
    row.sim_individual_min = round1(sScore.individualMin);
    row.sim_overall_passed = ev.sOverallPassed;
    row.outcome = outcome;                     // per-gate pass/fail
    row.suggestion_reason_codes = dedupe(reasonCodes);
    row.conditions = ev.conditions;
    row.remediation_flags = ev.remediationFlags;
    row.watch_flags = buildWatchFlags({ levelScores: {} }, sScore, belt); // sim watch only
    row.component_detail = { levelAvgs: sScore.levelAvgs, overall: sScore.overall, individualMin: sScore.individualMin, perResponse: sScore.perResponse };
    return row;
  }

  // combineComponents: the deferred blended recommendation — run once BOTH
  // component rows exist. Reconstructs the kScore/sScore objects from the two
  // component_detail blobs and feeds composeResult, so the result equals what a
  // single-pass scoreBeltTest would have produced. Returns a component='combined'
  // row (blended_*, system_suggestion, outcome PASS/CONDITIONAL_PASS/REMEDIATION).
  function combineComponents(kDetail, sDetail, targetBelt) {
    kDetail = kDetail || {}; sDetail = sDetail || {};
    var kScore = { levelScores: kDetail.levelScores || {}, overall: kDetail.overall || 0, perQuestion: kDetail.perQuestion || [] };
    var sScore = { levelAvgs: sDetail.levelAvgs || {}, overall: sDetail.overall || 0, individualMin: sDetail.individualMin || 0, perResponse: sDetail.perResponse || [] };
    return composeResult(kScore, sScore, { target_belt: targetBelt });
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
    composeResult: composeResult,
    scoreComponentKnowledge: scoreComponentKnowledge,
    scoreComponentSimulation: scoreComponentSimulation,
    combineComponents: combineComponents,
    scoreBeltTest: scoreBeltTest
  };

  // Dual export: browser global + CommonJS (Node harness).
  root.BeltTestEngine = BeltTestEngine;
  root.BELT_TEST_CONFIG = BELT_TEST_CONFIG;
  if (typeof module !== 'undefined' && module.exports) module.exports = BeltTestEngine;

})(typeof globalThis !== 'undefined' ? globalThis : this);
