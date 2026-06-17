// src/js/activity.js — P1 activity & engagement tracking (client side).
// Batches events and flushes to the sbd-log-activity edge function (IS_LIVE only); in demo mode
// events stay in DB.activityLog. Identity is stamped server-side from the JWT, so the client
// only sends { event_type, event_meta, ts }. Loaded BEFORE ui-views.js so its hooks can call
// logActivity(); exposes logActivity / startActivitySession / endActivitySession / flushActivity.

(function () {
  const FLUSH_INTERVAL_MS = 30000;        // periodic background flush
  const HEARTBEAT_MS = 5 * 60 * 1000;     // 5-min session heartbeat (carries cumulative duration)
  const MAX_BATCH = 100;                  // flush early once the batch grows this large

  const SESSION = { startTime: null, batch: [], flushTimer: null, heartbeatTimer: null, started: false, unloadBound: false };

  const nowIso = () => new Date().toISOString();
  const elapsedSec = () => SESSION.startTime ? Math.round((Date.now() - SESSION.startTime) / 1000) : 0;
  const isLive = () => (typeof IS_LIVE !== 'undefined' && IS_LIVE);
  const authToken = () => (typeof SB_SESSION !== 'undefined' && SB_SESSION && SB_SESSION.access_token)
    || (typeof ST !== 'undefined' && ST && ST.session && ST.session.access_token) || '';

  function logActivity(eventType, meta) {
    try {
      const evt = { event_type: String(eventType || 'unknown'), event_meta: meta || {}, ts: nowIso() };
      SESSION.batch.push(evt);
      if (typeof DB !== 'undefined' && DB) { (DB.activityLog = DB.activityLog || []).push(evt); }
      if (SESSION.batch.length >= MAX_BATCH) flushActivity();
    } catch (e) { /* instrumentation must never throw into the caller */ }
  }

  function flushActivity() {
    try {
      if (!SESSION.batch.length) return;
      if (!isLive()) { SESSION.batch = []; return; }        // demo: keep only the DB.activityLog mirror
      const token = authToken();
      if (!token) return;                                    // not authed yet — keep batch, retry next flush
      const events = SESSION.batch.splice(0, SESSION.batch.length);
      fetch(`${SB_API_URL}/functions/v1/sbd-log-activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': (typeof SB_ANON_KEY !== 'undefined' ? SB_ANON_KEY : ''),
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ events }),
        keepalive: true,   // lets the request finish during page unload (sendBeacon can't set auth headers)
      }).catch(() => { /* best-effort */ });
    } catch (e) { /* swallow */ }
  }

  function startActivitySession() {
    if (SESSION.started) return;
    SESSION.started = true;
    SESSION.startTime = Date.now();
    logActivity('login', { role: (typeof ST !== 'undefined' && ST.user) ? ST.user.role : null });
    logActivity('session_start', {});
    SESSION.flushTimer = setInterval(flushActivity, FLUSH_INTERVAL_MS);
    SESSION.heartbeatTimer = setInterval(() => {
      logActivity('heartbeat', { session_sec: elapsedSec() });
      flushActivity();
    }, HEARTBEAT_MS);
    if (!SESSION.unloadBound) {
      SESSION.unloadBound = true;
      window.addEventListener('beforeunload', () => {
        if (SESSION.started) { logActivity('session_end', { session_sec: elapsedSec() }); flushActivity(); }
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flushActivity();
      });
    }
    flushActivity();
  }

  function endActivitySession() {
    if (!SESSION.started) return;
    logActivity('session_end', { session_sec: elapsedSec() });
    logActivity('logout', {});
    if (SESSION.flushTimer) clearInterval(SESSION.flushTimer);
    if (SESSION.heartbeatTimer) clearInterval(SESSION.heartbeatTimer);
    SESSION.flushTimer = null;
    SESSION.heartbeatTimer = null;
    SESSION.started = false;
    SESSION.startTime = null;
    flushActivity();
  }

  window.logActivity = logActivity;
  window.flushActivity = flushActivity;
  window.startActivitySession = startActivitySession;
  window.endActivitySession = endActivitySession;
})();
