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

  window.DavidSerializers = { aiSerializePracticeHistory, aiSerializeEngagement, aiSerializeFacilityEngagement, aiSerializeVelocity };
})();
