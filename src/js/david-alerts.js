// src/js/david-alerts.js — P3 Proactive Intelligence: client-side alert rules engine.
// Evaluates the roadmap §6.4 rules over the now-flowing P1 (sbd_activity_log) + P2 + in-memory
// staff data and returns prioritized alerts. One getFacilityActivity() fetch yields both
// last-login and score-trend signals (P1 logs `login` and `practice_complete{pct}` events), so
// no per-staff fetches. Exposed as window.DavidAlerts. Loaded before DavidChat.js.

(function () {
  const nm = (s) => `${s.first || ''} ${s.last || ''}`.trim() || ('Staff ' + s.id);
  const dAt = (since) => (typeof daysAt === 'function') ? daysAt(since) : null;
  const bIdx = (b) => (typeof beltIdx === 'function') ? beltIdx(b) : 0;

  // Per-staff signals derived from activity rows (created_at DESC). Handles facility scope
  // (rows carry staff_id) and single-staff scope (rows don't — attribute to the one staff).
  function buildCtx(staffList, rows) {
    const ctx = { lastLoginDays: {}, trend: {} };
    const byStaff = {};
    const single = staffList.length === 1 ? String(staffList[0].id) : null;
    (rows || []).forEach(r => {
      const sid = r.staff_id ? String(r.staff_id) : single;
      if (!sid) return;
      (byStaff[sid] = byStaff[sid] || []).push(r);
    });
    staffList.forEach(s => {
      const rs = byStaff[String(s.id)] || [];
      const logins = rs.filter(r => r.event_type === 'login');
      ctx.lastLoginDays[s.id] = logins.length ? Math.floor((Date.now() - new Date(logins[0].created_at).getTime()) / 86400000) : null;
      const pcs = rs.filter(r => r.event_type === 'practice_complete' && r.event_meta && typeof r.event_meta.pct === 'number');
      if (pcs.length >= 2) {
        const d = pcs[0].event_meta.pct - pcs[pcs.length - 1].event_meta.pct;
        ctx.trend[s.id] = d > 0 ? 'improving' : (d < 0 ? 'declining' : 'flat');
      } else ctx.trend[s.id] = null;
    });
    return ctx;
  }

  // Per-staff rules (roadmap §6.4). Each returns a message string or null.
  const STAFF_RULES = [
    { id: 'no_login_30d', sev: 'high', fn: (s, c) => { const d = c.lastLoginDays[s.id]; return (d != null && d >= 30) ? `${nm(s)} hasn't logged in for ${d}+ days` : null; } },
    { id: 'no_login_14d', sev: 'warn', fn: (s, c) => { const d = c.lastLoginDays[s.id]; return (d != null && d >= 14 && d < 30) ? `${nm(s)} hasn't logged in for ${d} days` : null; } },
    { id: 'declining_scores', sev: 'warn', fn: (s, c) => c.trend[s.id] === 'declining' ? `${nm(s)}'s practice scores are trending down` : null },
    { id: 'ready_not_requested', sev: 'warn', fn: (s) => {
        const ps = (s.practiceScores || {})[s.belt] || {};
        const ready = (ps.knowledge || 0) >= 80 && (ps.simulation || 0) >= 80;
        const requested = (typeof DB !== 'undefined' && (DB.queue || []).some(q => q.sid === s.id && q.status === 'pending'));
        return (ready && !requested) ? `${nm(s)} is practice-ready (≥80%) for ${s.belt} but hasn't requested assessment` : null;
      } },
    { id: 'window_soon', sev: 'info', fn: (s) => {
        if (typeof getWindowStatus !== 'function') return null;
        const w = getWindowStatus(s);
        if (w.status === 'open' && w.daysLeft != null && w.daysLeft <= 7) return `${nm(s)}'s assessment window closes in ${w.daysLeft}d`;
        if (w.status === 'closed' && w.daysUntilOpen != null && w.daysUntilOpen <= 7) return `${nm(s)}'s assessment window reopens in ${w.daysUntilOpen}d`;
        return null;
      } },
    { id: 'stagnation_45d', sev: 'warn', fn: (s) => {
        const d = dAt(s.since);
        const nxtProgress = [s.nxt && s.nxt.c, s.nxt && s.nxt.s, s.nxt && s.nxt.o].filter(x => x === 'pass').length;
        return (d != null && d >= 45 && nxtProgress === 0 && bIdx(s.belt) < 5) ? `${nm(s)} has been at ${s.belt} for ${d}d with no progress toward the next belt` : null;
      } },
  ];

  function facilityGreenDrop(fid) {
    try {
      const t = (typeof DB !== 'undefined' && DB.trends) ? DB.trends[fid] : null;
      if (!t) return null;
      const years = Object.keys(t).sort();
      const latest = t[years[years.length - 1]];
      const g = latest && latest.g;
      if (Array.isArray(g) && g.length >= 2) {
        const drop = g[g.length - 2] - g[g.length - 1];
        if (drop >= 5) return { id: 'facility_green_drop', severity: 'high', message: `Facility Green+ competency dropped ${drop.toFixed(1)}% in the latest period` };
      }
    } catch (e) { /* trends optional */ }
    return null;
  }

  // scope: 'staff' | 'facility' | 'system' | 'admin'. Returns prioritized alert objects.
  async function scanAlerts(scope, id) {
    if (typeof DB === 'undefined') return [];
    let staffList = [], activityRows = [];
    if (scope === 'staff' && id) {
      const s = (DB.staff || []).find(x => String(x.id) === String(id));
      staffList = s ? [s] : [];
      try { if (typeof SB !== 'undefined' && SB.getStaffActivity) activityRows = await SB.getStaffActivity(id, 1000) || []; } catch (e) {}
    } else if (scope === 'facility' && id) {
      staffList = (DB.staff || []).filter(s => s.fid === id);
      try { if (typeof SB !== 'undefined' && SB.getFacilityActivity) activityRows = await SB.getFacilityActivity(id, 3000) || []; } catch (e) {}
    } else if (scope === 'system' && id) {
      const sysFids = (DB.facilities || []).filter(f => f.systemId === id).map(f => f.id);
      staffList = (DB.staff || []).filter(s => sysFids.includes(s.fid));
      // multi-facility: skip the activity fetch; in-memory rules (window/ready/stagnation) still fire.
    } else { // admin
      staffList = (DB.staff || []);
    }

    const ctx = buildCtx(staffList, activityRows);
    const alerts = [];
    staffList.forEach(s => STAFF_RULES.forEach(r => {
      const m = r.fn(s, ctx);
      if (m) alerts.push({ id: r.id, severity: r.sev, staffId: s.id, message: m });
    }));
    if (scope === 'facility' && id) { const fa = facilityGreenDrop(id); if (fa) alerts.push(fa); }

    const order = { high: 0, warn: 1, info: 2 };
    alerts.sort((a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3));
    return alerts;
  }

  // Prompt-injection string for David's context (Channel A).
  async function aiSerializeAlerts(scope, id) {
    const alerts = await scanAlerts(scope, id);
    if (!alerts.length) return '';
    const top = alerts.slice(0, 12).map(a => `  • [${a.severity}] ${a.message}`).join('\n');
    return `ACTIVE ALERTS (${alerts.length}; coach toward the recommended action for each):\n${top}`;
  }

  window.DavidAlerts = { scanAlerts, aiSerializeAlerts };
})();
