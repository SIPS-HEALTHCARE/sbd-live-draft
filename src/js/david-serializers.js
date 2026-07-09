// src/js/david-serializers.js
// Channel A serializers (DAVID phased build plan §2): small, dynamic, per-entity context
// computed client-side and appended to David's prompt. Loaded before DavidChat.js and exposed
// as window.DavidSerializers. Each serializer is async (may fetch fresh rows) and returns a
// prompt-ready string, or '' when there's nothing to say (never throws into the caller).

(function () {
  function attemptPct(a) {
    if (typeof a.pct === 'number') return a.pct;
    return a.total ? Math.round((a.score / a.total) * 100) : null;
  }

  // P0.3 — recent practice attempts, per belt/mode trend, and most-missed questions for ONE staff member.
  // Data is SELF-GRADED (FULL_QUESTION_BANKS practice), so the output says so explicitly.
  async function aiSerializePracticeHistory(staffId) {
    if (!staffId || typeof SB === 'undefined' || !SB.getPracticeAttempts) return '';
    let rows;
    try { rows = await SB.getPracticeAttempts(staffId, 50); }
    catch (e) { return ''; }
    if (!Array.isArray(rows) || rows.length === 0) return '';

    const byKey = {};
    rows.forEach(r => {
      const key = `${r.belt || '?'} / ${r.mode || '?'}`;
      (byKey[key] = byKey[key] || []).push(r);
    });

    const lines = [];
    Object.keys(byKey).forEach(key => {
      const attempts = byKey[key].slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const latest = attemptPct(attempts[0]);
      const best = Math.max(...attempts.map(a => attemptPct(a) || 0));
      const recent = attempts.slice(0, 5).map(attemptPct).filter(v => v !== null);
      const trend = recent.length >= 2 ? (recent[0] - recent[recent.length - 1]) : 0;
      const dir = trend > 0 ? 'improving' : (trend < 0 ? 'declining' : 'flat');
      lines.push(`  • ${key}: ${attempts.length} attempt(s), latest ${latest}%, best ${best}%, recent trend ${dir}`);
    });

    // Aggregate most-missed questions across all attempts.
    const missCounts = {};
    rows.forEach(r => {
      (Array.isArray(r.wrong_questions) ? r.wrong_questions : []).forEach(w => {
        const q = (w && w.q) ? String(w.q).slice(0, 140) : '';
        if (q) missCounts[q] = (missCounts[q] || 0) + 1;
      });
    });
    const topMisses = Object.entries(missCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

    let out = `PRACTICE HISTORY (self-assessed — learner self-graded; treat as a study signal, not an objective score):\n${lines.join('\n')}`;
    if (topMisses.length) {
      out += `\n  Most-missed practice questions (times missed):\n` + topMisses.map(([q, n]) => `    - (${n}x) ${q}`).join('\n');
    }
    return out.trim();
  }

  // ── P1 engagement helpers ──
  const daysAgo = (n) => Date.now() - n * 86400000;
  const tsMs = (r) => new Date(r.created_at).getTime();
  const countSince = (rows, type, sinceMs) => rows.filter(r => r.event_type === type && tsMs(r) >= sinceMs).length;
  const lastOf = (rows, type) => { const r = rows.find(x => x.event_type === type); return r ? r.created_at : null; }; // rows are created_at DESC
  function activeDays(rows, sinceMs) {
    const days = new Set();
    rows.forEach(r => { if (tsMs(r) >= sinceMs) days.add(r.created_at.slice(0, 10)); });
    return days.size;
  }
  function studyMinutes(rows, sinceMs) {
    // Sum the duration carried by completed sessions (session_end). Heartbeats are a fallback
    // signal only and are intentionally NOT summed here to avoid double-counting.
    const sec = rows
      .filter(r => r.event_type === 'session_end' && tsMs(r) >= sinceMs && r.event_meta && typeof r.event_meta.session_sec === 'number')
      .reduce((a, r) => a + r.event_meta.session_sec, 0);
    return Math.round(sec / 60);
  }

  // P1 — per-staff engagement: login frequency, study time, practice cadence, consistency.
  async function aiSerializeEngagement(staffId) {
    if (!staffId || typeof SB === 'undefined' || !SB.getStaffActivity) return '';
    let rows;
    try { rows = await SB.getStaffActivity(staffId, 1000); } catch (e) { return ''; }
    if (!Array.isArray(rows) || rows.length === 0) return '';
    const last = lastOf(rows, 'login');
    return `ENGAGEMENT (from activity log):
  • Logins: ${countSince(rows, 'login', daysAgo(7))} (7d) / ${countSince(rows, 'login', daysAgo(30))} (30d) / ${countSince(rows, 'login', daysAgo(90))} (90d); last login ${last ? new Date(last).toLocaleDateString() : 'not recorded'}
  • Study time (30d): ~${studyMinutes(rows, daysAgo(30))} min across completed sessions
  • Practice tests completed (30d): ${countSince(rows, 'practice_complete', daysAgo(30))}
  • Active days (30d): ${activeDays(rows, daysAgo(30))}/30 (consistency)`.trim();
  }

  // P1 — facility-wide engagement: active staff, cadence, and the zero-login list.
  async function aiSerializeFacilityEngagement(fid) {
    if (!fid || typeof SB === 'undefined' || !SB.getFacilityActivity) return '';
    let rows;
    try { rows = await SB.getFacilityActivity(fid, 2000); } catch (e) { return ''; }
    if (!Array.isArray(rows) || rows.length === 0) return '';
    const since30 = daysAgo(30);
    const logins30 = rows.filter(r => r.event_type === 'login' && tsMs(r) >= since30);
    const activeStaff = new Set(logins30.filter(r => r.staff_id).map(r => String(r.staff_id)));
    let zeroLogin = [];
    try {
      const fidStaff = (typeof DB !== 'undefined' && DB.staff) ? DB.staff.filter(s => s.fid === fid) : [];
      zeroLogin = fidStaff
        .filter(s => !activeStaff.has(String(s.id)))
        .map(s => `${s.first || ''} ${s.last || ''}`.trim() || String(s.id));
    } catch (e) { /* DB.staff may be unavailable */ }
    let out = `FACILITY ENGAGEMENT (last 30d, from activity log):
  • Active staff (logged in): ${activeStaff.size}
  • Total logins: ${logins30.length}; practice tests completed: ${countSince(rows, 'practice_complete', since30)}`;
    if (zeroLogin.length) out += `\n  • No login in 30d (${zeroLogin.length}): ${zeroLogin.slice(0, 20).join(', ')}${zeroLogin.length > 20 ? '…' : ''}`;
    return out.trim();
  }

  // P2 — learning velocity, gate-readiness (§6.3 weighting), ETA to next belt, vs facility avg.
  // Built on existing data: staff.history/since (in-memory DB.staff) + practiceScores +
  // sbd_practice_attempts (P0.3) + sbd_activity_log (P1). Reuses logic.js calcVelocity/
  // calcGateReadiness/generateProjection.
  async function aiSerializeVelocity(staffId) {
    const staff = (typeof DB !== 'undefined' && DB.staff) ? DB.staff.find(s => String(s.id) === String(staffId)) : null;
    if (!staff) return '';
    let attempts = [], activity = [];
    try { attempts = await SB.getPracticeAttempts(staffId, 50) || []; } catch (e) {}
    try { activity = await SB.getStaffActivity(staffId, 1000) || []; } catch (e) {}

    const since30 = daysAgo(30);
    // practice signal: avg best % (knowledge + simulation) at current belt
    const ps = (staff.practiceScores || {})[staff.belt] || {};
    const practicePct = Math.round(((ps.knowledge || 0) + (ps.simulation || 0)) / 2);
    // trend signal: attempts are created_at DESC, so [0] = most recent
    const pcts = attempts.map(a => typeof a.pct === 'number' ? a.pct : (a.total ? Math.round(a.score / a.total * 100) : null)).filter(v => v !== null);
    let trendScore = 10, trendLabel = 'flat';
    if (pcts.length >= 2) { const d = pcts[0] - pcts[pcts.length - 1]; trendScore = d > 0 ? 20 : (d < 0 ? 5 : 10); trendLabel = d > 0 ? 'improving' : (d < 0 ? 'declining' : 'flat'); }
    // study + consistency from activity (30d)
    const studyMin = Math.round(activity.filter(r => r.event_type === 'session_end' && r.event_meta && typeof r.event_meta.session_sec === 'number' && tsMs(r) >= since30).reduce((a, r) => a + r.event_meta.session_sec, 0) / 60);
    const studyScore = Math.min(20, Math.round(studyMin / 120 * 20));        // ~2h over 30d => full 20
    const activeDayCount = new Set(activity.filter(r => tsMs(r) >= since30).map(r => r.created_at.slice(0, 10))).size;
    const consistencyScore = Math.min(20, Math.round(activeDayCount / 15 * 20)); // ~15 active days/30 => full 20

    const vel = (typeof calcVelocity === 'function') ? calcVelocity(staff) : null;
    const readiness = (typeof calcGateReadiness === 'function') ? calcGateReadiness(staff, { practicePct, studyScore, trendScore, consistencyScore }) : null;
    const proj = (typeof generateProjection === 'function') ? generateProjection(staff) : null;

    // facility-average velocity for comparison (in-memory peers)
    let facAvg = null;
    try {
      const peers = (DB.staff || []).filter(s => s.fid === staff.fid);
      if (peers.length && typeof calcVelocity === 'function') {
        facAvg = +(peers.reduce((a, s) => a + (calcVelocity(s).gatesPerMonth || 0), 0) / peers.length).toFixed(2);
      }
    } catch (e) {}

    const lines = [];
    if (readiness) lines.push(`  • Gate-readiness: ${readiness.total}/100 (practice ${readiness.breakdown.practice}/40, study ${readiness.breakdown.study}/20, trend ${readiness.breakdown.trend}/20, consistency ${readiness.breakdown.consistency}/20)`);
    if (vel) lines.push(`  • Velocity: ${vel.gatesPerMonth} gates/month (${vel.passedGates} passed over ~${vel.months} mo)${facAvg !== null ? `; facility avg ${facAvg}` : ''}`);
    if (proj && proj.nextBelt) lines.push(`  • Next belt: ${proj.nextBelt} — ${proj.summary} (ETA ~${proj.projectedWeeks} wk, confidence ${proj.confidence})`);
    lines.push(`  • Recent score trend: ${trendLabel}; study ~${studyMin} min/30d; active ${activeDayCount} days/30d`);
    return `LEARNING VELOCITY & READINESS:\n${lines.join('\n')}`;
  }

  // Fix 4 D1 — compact placement-review lines for the platform snapshot. Serializes ONLY
  // summary fields; responses[] (full answer transcripts) are deliberately excluded (token blowup).
  // Sync: reads the already-mapped rows it is given, never fetches.
  function aiSerializePlacements(reviews) {
    if (!Array.isArray(reviews) || reviews.length === 0) return '';
    const lines = reviews.map(pr => {
      const levels = Object.entries(pr.levelScores || {})
        .map(([lvl, pct]) => `L${lvl} ${Math.round(Number(pct) || 0)}%`).join(' / ');
      return `  • ${pr.staffName || 'Unknown'} (staff ${pr.staffId || '—'}): status=${pr.status || '—'}, tentative=${pr.tentativeBelt || '—'}, confirmed=${pr.confirmedBelt || '—'}`
        + (levels ? `, levels: ${levels}` : '')
        + (pr.submittedAt ? `, submitted ${String(pr.submittedAt).slice(0, 10)}` : '')
        + (pr.reviewedAt ? `, reviewed ${String(pr.reviewedAt).slice(0, 10)}` : '');
    });
    return `[PLACEMENTS] (placement assessments, summary only — answer transcripts not included):\n${lines.join('\n')}`;
  }

  // Fix 4 D2 — static F/I module catalog, one line per module, so David can name real module
  // ids/titles/domains when recommending retraining. Sync; reads the load-time constants.
  function aiSerializeTrainingCatalog() {
    const fnd = (typeof FOUNDATIONS_MODULES !== 'undefined') ? FOUNDATIONS_MODULES : [];
    const inst = (typeof INSTRUMENT_MODULES !== 'undefined') ? INSTRUMENT_MODULES : [];
    if (!fnd.length && !inst.length) return '';
    const f = fnd.map(m => `  • ${m.id}: ${m.title} (domain: ${m.domain})`).join('\n');
    const i = inst.map(m => `  • ${m.id}: ${m.title} (${m.belt} Belt, domain: ${m.domain})`).join('\n');
    return `[TRAINING_CATALOG] (assignable modules; each has 3 gates: knowledge, simulation, observation):\nFoundations:\n${f}\nInstruments:\n${i}`;
  }

  // Fix 4 D2 — compact per-staff F/I progress (module id + gate statuses + best score).
  // Scope is enforced by the caller-supplied staffList: rows for other staff are dropped.
  function aiSerializeTrainingProgress(staffList, fndProgress, instProgress) {
    const nameOf = {};
    (staffList || []).forEach(s => { nameOf[String(s.id)] = `${s.first || ''} ${s.last || ''}`.trim() || String(s.id); });
    const gate = (g) => g ? `${g.status || 'open'}${typeof g.score === 'number' && g.score > 0 ? `(${g.score}%)` : ''}` : 'open';
    const byStaff = {};
    const add = (rows) => (rows || []).forEach(p => {
      const sid = String(p.staffId);
      if (!(sid in nameOf)) return;
      (byStaff[sid] = byStaff[sid] || []).push(`${p.moduleId} G1=${gate(p.g1)} G2=${gate(p.g2)} G3=${(p.g3 && p.g3.status) || 'open'}${p.complete ? ' ✓complete' : ''}`);
    });
    add(fndProgress); add(instProgress);
    const sids = Object.keys(byStaff);
    if (!sids.length) return '';
    return `[TRAINING_PROGRESS] (Foundations fm-* / Instruments im-* per staff):\n${sids.map(sid => `  • ${nameOf[sid]}: ${byStaff[sid].join('; ')}`).join('\n')}`;
  }

  // Fix 4 D2b — David #72(b): deterministic placement -> module retraining recommendations.
  // Rule (plans/TEAM-INSTRUCTION.md): per staff, take the most recent placement_reviews row;
  // for each response whose qId maps to a Foundations module, read score ?? aiScore — knowledge
  // responses carry `score`, simulation responses carry `aiScore`, never both, so reading only
  // `score` would silently drop every simulation answer. Roll up per module (avg), gated on
  // MIN_MODULE_QS answered questions; skip modules already complete. <70% recommend, 70-79% watch
  // (off by default), >=80% silent. Sync — reads already-loaded rows, never fetches. Suggestion
  // only: no write tool exists for David to act on this.
  const PLACEMENT_MODULE_MAP = {
    p1:1,p2:1,p6:1,p7:1,p16:1,p27:1,p28:1,p38:1,p50:1,p52:1,p55:1,p56:1,
    p3:2,p4:2,p5:2,p9:2,p10:2,p12:2,p14:2,p17:2,p21:2,p39:2,
    p18:3,p20:3,p23:3,p24:3,p31:3,p34:3,p36:3,p48:3,
    p8:4,p11:4,p60:4,
    p15:5,p19:5,p22:5,p29:5,
    p13:6,p25:6,p26:6,p30:6,p32:6,p37:6,p42:6,p43:6,p44:6,p45:6,p49:6,
    p35:7,
    p33:9,p40:9,p41:9,p46:9,p47:9,p51:9,p53:9,p54:9,p57:9,
    p58:10,p59:10,
  };
  const PLACEMENT_MODULE_TITLES = {1:'Foundations',2:'Decontamination',3:'Inspection & Identification',4:'Assembly & Tray Building',5:'Packaging & Wrapping',6:'Sterilization',7:'Storage & Distribution',8:'High-Level Disinfection',9:'Quality Assurance',10:'Professional Development'};

  function aiSerializePlacementModuleRecommendations(placements, staffList, foundationsProgress) {
    const MIN_MODULE_QS = 3, INCLUDE_WATCH = false;
    if (!Array.isArray(placements) || !placements.length) return '';
    const nameOf = {};
    (staffList || []).forEach(s => { nameOf[String(s.id)] = `${s.first || ''} ${s.last || ''}`.trim() || String(s.id); });

    // Match the staff-self path's "latest" comparator (submittedAt, falling back to createdAt)
    // so both views pick the same row for the same person when submittedAt is unset.
    const latestTs = (pr) => new Date(pr.submittedAt || pr.createdAt || 0);
    const latestByStaff = {};
    placements.forEach(pr => {
      const sid = String(pr.staffId);
      const prev = latestByStaff[sid];
      if (!prev || latestTs(pr) > latestTs(prev)) latestByStaff[sid] = pr;
    });

    const lines = [];
    Object.values(latestByStaff).forEach(pr => {
      const sid = String(pr.staffId);
      const responses = Array.isArray(pr.responses) ? pr.responses : [];
      if (!responses.length) return;
      const agg = {};
      responses.forEach(r => {
        const m = PLACEMENT_MODULE_MAP[r.qId]; if (!m) return;
        const s = (r.score != null) ? Number(r.score) : (r.aiScore != null ? Number(r.aiScore) : null);
        if (s == null || Number.isNaN(s)) return;
        (agg[m] = agg[m] || { sum: 0, n: 0 }); agg[m].sum += s; agg[m].n += 1;
      });
      const doneModules = new Set(
        (foundationsProgress || []).filter(p => String(p.staffId) === sid && p.complete)
          .map(p => Number(String(p.moduleId).replace('fm-', '')))
      );
      const recs = [];
      Object.keys(agg).forEach(m => {
        const { sum, n } = agg[m];
        if (n < MIN_MODULE_QS) return;
        const mNum = Number(m);
        if (doneModules.has(mNum)) return;
        const score = Math.round(sum / n);
        if (score < 70) recs.push({ m: mNum, score, band: 'recommend' });
        else if (INCLUDE_WATCH && score < 80) recs.push({ m: mNum, score, band: 'watch' });
      });
      if (!recs.length) return;
      recs.sort((a, b) => a.score - b.score || a.m - b.m);
      const who = nameOf[sid] || `staff ${sid}`;
      const modStr = recs.map(r => `fm-${String(r.m).padStart(2, '0')} ${PLACEMENT_MODULE_TITLES[r.m]} (${r.score}%${r.band === 'watch' ? ' watch' : ''})`).join(', ');
      lines.push(`  • ${who}: ${modStr}`);
    });
    if (!lines.length) return '';
    return `[PLACEMENT_RETRAINING] (deterministic rule, David #72(b); latest placement per person, lowest score first — SUGGEST to the leader, never auto-assign):\n${lines.join('\n')}`;
  }

  // P4 — facility compliance forecast: current Green+ %, velocity trajectory, survey-readiness,
  // and the bottleneck (critical-path staff). Built on in-memory DB.staff + logic.js engine.
  async function aiSerializeComplianceForecast(fid) {
    if (!fid || typeof DB === 'undefined' || !DB.staff) return '';
    const staffList = DB.staff.filter(s => s.fid === fid);
    if (!staffList.length) return '';
    const f = (typeof calcComplianceForecast === 'function') ? calcComplianceForecast(staffList) : null;
    if (!f) return '';
    const lines = [
      `  • Current Green+ (Green/Blue/Brown/Black): ${f.currentPct}% (${f.greenPlusCount}/${f.n})`,
      `  • Below Green: ${f.belowGreen}; facility avg velocity ${f.avgVelocity} gates/month`,
      `  • Survey-readiness (competency-weighted): ${f.surveyReadiness}/100`,
    ];
    if (f.bottleneckNames.length) lines.push(`  • Bottleneck (stalled 45d+, no progress): ${f.bottleneckNames.slice(0, 10).join(', ')}`);
    return `COMPLIANCE FORECAST (this facility):\n${lines.join('\n')}\n  To answer "will we hit X% Green+ by <date>": project from current %, the below-Green count, and the avg velocity; flag the bottleneck staff as the critical path to close the gap.`;
  }

  window.DavidSerializers = { aiSerializePracticeHistory, aiSerializeEngagement, aiSerializeFacilityEngagement, aiSerializeVelocity, aiSerializeComplianceForecast, aiSerializePlacements, aiSerializeTrainingCatalog, aiSerializeTrainingProgress, aiSerializePlacementModuleRecommendations };
})();
