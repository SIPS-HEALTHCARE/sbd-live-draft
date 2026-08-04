// ============================================================ BACKEND CONFIG
// The Virtual-Deployment Branch: mhijaqahbceuahfzezbh
const SB_API_URL = 'https://mhijaqahbceuahfzezbh.supabase.co';
const SB_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oaWphcWFoYmNldWFoZnplemJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MDkwNzksImV4cCI6MjA4OTM4NTA3OX0.GZcvOFxm4uNdTFPnq-rfwHaMVhWbIJWY7QMYToPa7mQ';
let SB_SESSION = null;

// ── Authenticated fetch helper ──
async function sbFetch(path, opts={}, retryCount=0){
  // Check if token is expired or close to expiring (within 2 minutes)
  if (SB_SESSION && SB_SESSION.expires_at) {
    const now = Date.now() / 1000;
    if (now > SB_SESSION.expires_at - 120 && SB_SESSION.refresh_token) {
      await SB_AUTH.refreshSession();
    }
  }

  const token = SB_SESSION && SB_SESSION.access_token;
  const headers = {
    'apikey': SB_ANON_KEY,
    'Authorization': `Bearer ${token || SB_ANON_KEY}`,
    'Content-Type': 'application/json',
    ...(opts.headers||{})
  };
  // Prevent CORS errors on Edge Functions by omitting the Prefer header
  if (!path.startsWith('/functions/')) {
    headers['Prefer'] = opts.prefer || 'return=representation';
  }
  const _timeout = new Promise((_,rej)=>setTimeout(()=>rej(new Error('Request timed out')),12000));
  try {
    const res = await Promise.race([
      fetch(SB_API_URL+path, {
        method: opts.method || 'GET',
        headers,
        body: opts.body ? JSON.stringify(opts.body) : undefined,
      }),
      _timeout
    ]);

    // If 401 Unauthorized and we haven't retried yet, try to refresh and retry
    if (res.status === 401 && retryCount === 0 && SB_SESSION && SB_SESSION.refresh_token) {
      const refreshed = await SB_AUTH.refreshSession();
      if (refreshed) {
        return sbFetch(path, opts, 1);
      }
    }

    if(!res.ok){
      const err = await res.json().catch(()=>({message:res.statusText}));
      throw new Error(err.message || err.error || 'HTTP '+res.status);
    }
    if (res.status === 204) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch(e) {
    if(path.includes('report_audit_log')) return null;
    console.warn('sbFetch:', path, e.message);
    throw e;
  }
}

// ── Auth layer ──
const SB_AUTH = {
  _refreshInFlight: null,
  // Single-flight refresh. A burst of parallel sbFetch calls (the placement submit
  // fires every simulation AI score at once via Promise.allSettled) must NOT each
  // POST the refresh token on their own. Supabase has refresh-token rotation with
  // reuse detection enabled, so racing/replayed refreshes get flagged and the whole
  // session is revoked -- a spurious hard logout, classically right at submit, which
  // also drops the submission. Collapsing all concurrent callers onto one in-flight
  // refresh promise removes the race. Return contract is unchanged (true/false).
  refreshSession() {
    if (this._refreshInFlight) return this._refreshInFlight;
    this._refreshInFlight = this._doRefreshSession()
      .finally(() => { this._refreshInFlight = null; });
    return this._refreshInFlight;
  },
  async _doRefreshSession() {
    if (!SB_SESSION || !SB_SESSION.refresh_token) return false;
    try {
      const res = await fetch(`${SB_API_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: { 'apikey': SB_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: SB_SESSION.refresh_token })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error_description || data.error);

      SB_SESSION = data;
      localStorage.setItem('sbd_session', JSON.stringify({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
        user: data.user
      }));
      return true;
    } catch (e) {
      console.warn("Session refresh failed:", e.message);
      return false;
    }
  },
  async signIn(email, password){
    const data = await fetch(`${SB_API_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'apikey': SB_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }).then(r => r.json());
    if(data.error) throw new Error(data.error_description || data.error);
    SB_SESSION = data;
    localStorage.setItem('sbd_session', JSON.stringify({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      user: data.user
    }));
    return data;
  },
  async signOut(){
    try {
      await fetch(`${SB_API_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: { 'apikey': SB_ANON_KEY, 'Authorization': `Bearer ${SB_SESSION && SB_SESSION.access_token}` }
      });
    } catch(_){}
    SB_SESSION = null;
    localStorage.removeItem('sbd_session');
  },
  async restoreSession(){
    try {
      const raw = localStorage.getItem('sbd_session');
      if(!raw) return null;
      const session = JSON.parse(raw);
      SB_SESSION = session; // set first so refreshSession() can read refresh_token

      // Access token still valid (or no expiry recorded) → use as-is
      if(!session.expires_at || Date.now()/1000 < session.expires_at - 120){
        return session;
      }

      // Access token expired or within 2 min of expiring → refresh instead of logging out
      if(session.refresh_token){
        const ok = await this.refreshSession();
        if(ok) return SB_SESSION; // refreshSession() updated SB_SESSION + localStorage
      }

      // No refresh token, or refresh genuinely failed → now it is safe to clear
      SB_SESSION = null;
      localStorage.removeItem('sbd_session');
      return null;
    } catch {
      SB_SESSION = null;
      return null;
    }
  },
  // ── Send password recovery email ──
  async requestPasswordReset(email){
    const res = await fetch(`${SB_API_URL}/auth/v1/recover`, {
      method: 'POST',
      headers: { 'apikey': SB_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, redirectTo: window.location.origin || 'https://belt.sterilebydesign.ai' })
    });
    return res.ok;
  },
  // ── Update password using a session or recovery access token ──
  async updatePassword(accessToken, newPassword){
    const res = await fetch(`${SB_API_URL}/auth/v1/user`, {
      method: 'PUT',
      headers: {
        'apikey': SB_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password: newPassword })
    });
    const data = await res.json().catch(() => ({}));
    if(!res.ok) throw new Error(data.error_description || data.msg || 'Password update failed');
    return data;
  }
};

const SB = {
  // ── Facilities ──
  getFacilities(){ return sbFetch('/rest/v1/facilities?select=*&order=name.asc'); },
  createFacility(data){ return sbFetch('/rest/v1/facilities', { method:'POST', body:data }); },
  updateFacility(id, data){ return sbFetch(`/rest/v1/facilities?id=eq.${id}`, { method:'PATCH', body:data }); },
  deactivateFacility(id){ return sbFetch(`/rest/v1/facilities?id=eq.${id}`, { method:'PATCH', body:{ active:false, deactivated_at:new Date().toISOString() } }); },
  reactivateFacility(id){ return sbFetch(`/rest/v1/facilities?id=eq.${id}`, { method:'PATCH', body:{ active:true, deactivated_at:null } }); },
  // ── Staff ──
  getStaffByFacility(fid){ return sbFetch(`/rest/v1/staff?fid=eq.${encodeURIComponent(fid)}&select=*&order=last.asc`); },
  getAllStaff(){ return sbFetch('/rest/v1/staff?select=*&order=fid.asc,last.asc'); },
  createStaff(data){ return sbFetch('/rest/v1/staff', { method:'POST', body:data }); },
  updateStaff(id, data){ return sbFetch(`/rest/v1/staff?id=eq.${id}`, { method:'PATCH', body:data }); },
  bulkCreateStaff(records){ return sbFetch('/rest/v1/staff', { method:'POST', prefer:'return=minimal', body:records }); },
  deleteStaff(id){ return sbFetch(`/rest/v1/staff?id=eq.${id}`, { method:'DELETE' }); },
  // ── Assessment Queue ──
  getPendingAssessments(fid){
    // pending = staff-requested awaiting approval; approved = gate-approved, kept
    // hydrated so the belt-test entry card and admin queue can see them (A4).
    const f = fid ? `&facility_id=eq.${encodeURIComponent(fid)}` : '';
    return sbFetch(`/rest/v1/sbd_assessment_queue?status=in.(pending,approved)${f}&select=*&order=requested_at.desc`);
  },
  submitAssessmentQueue(data){ return sbFetch('/rest/v1/sbd_assessment_queue', { method:'POST', body:data }); },
  resolveAssessmentQueue(id, status){ return sbFetch(`/rest/v1/sbd_assessment_queue?id=eq.${id}`, { method:'PATCH', body:{ status, resolved_at:new Date().toISOString() } }); },
  // Persist an admin review action (approve/deny) on a gate request. `data` carries the merged
  // {practiceKnowledge, practiceSimulation, review:{...}} so the row's practice scores survive
  // (PostgREST PATCH replaces the column wholesale). `resolved` stamps resolved_at for terminal actions.
  reviewAssessmentQueue(id, status, data, resolved){
    const body = { status, data };
    if (resolved) body.resolved_at = new Date().toISOString();
    return sbFetch(`/rest/v1/sbd_assessment_queue?id=eq.${id}`, { method:'PATCH', body });
  },
  // ── Dynamic Belt Test (A4) ──
  generateBeltTest(staffId, targetBelt, component){ return sbFetch('/functions/v1/sbd-generate-belt-test', { method:'POST', body:{ staff_id:staffId, target_belt:targetBelt, component: component || undefined } }); },
  getMyBeltTest(staffId, targetBelt){ return sbFetch(`/rest/v1/sbd_belt_tests?staff_id=eq.${staffId}&target_belt=eq.${encodeURIComponent(targetBelt)}&status=eq.active&select=*&limit=1`); },
  insertBeltTestResult(data){ return sbFetch('/rest/v1/sbd_belt_test_results', { method:'POST', body:data }); },
  getBeltTestResults(fid){ const f=fid?`&facility_id=eq.${encodeURIComponent(fid)}`:''; return sbFetch(`/rest/v1/sbd_belt_test_results?select=*&order=submitted_at.desc${f}`); },
  updateBeltTestResult(id, data){ return sbFetch(`/rest/v1/sbd_belt_test_results?id=eq.${id}`, { method:'PATCH', body:data }); },
  markBeltTestSubmitted(id){ return sbFetch(`/rest/v1/sbd_belt_tests?id=eq.${id}`, { method:'PATCH', body:{ status:'submitted', submitted_at:new Date().toISOString() } }); },
  // ── Assessments (via edge function for atomic RPC + audit) ──
  recordAssessment(staff, type, targetBelt, result, notes, assessorId, timestamp){
    return sbFetch('/functions/v1/sbd-record-assessment', {
      method:'POST',
      body: { staff, type, targetBelt, result, notes, assessorId, timestamp }
    });
  },
  // ── Reset Test Assessment (master_admin-only utility, mode = 'preview' | 'execute') ──
  resetTestAssessment(email, mode){
    return sbFetch('/functions/v1/sbd-reset-test-assessment', {
      method:'POST',
      body: { email, mode }
    });
  },
  // Force-submit an in-progress / timed-out placement AS-IS (blanks score zero),
  // scoring exactly like the candidate screen. mode 'preview' = score only,
  // 'execute' = write the placement_reviews row + complete the session (#18/#35).
  forceSubmitPlacement(email, mode){
    return sbFetch('/functions/v1/sbd-force-submit-placement', {
      method:'POST',
      body: { email, mode }
    });
  },
  // ── SBD Foundations (#22) ──
  getFoundationsAssignments(){ return sbFetch('/rest/v1/foundations_assignments?select=*'); },
  getFoundationsProgress(){ return sbFetch('/rest/v1/foundations_progress?select=*'); },
  // ignore-duplicates: a cross-session double-assign (unique staff_id,module_id)
  // is a benign no-op, not a 409 error toast (Addendum 8.3).
  createFoundationsAssignment(data){ return sbFetch('/rest/v1/foundations_assignments?on_conflict=staff_id,module_id', { method:'POST', prefer:'resolution=ignore-duplicates,return=minimal', body:data }); },
  // Upsert keyed on (staff_id, module_id) so a gate update overwrites the row.
  upsertFoundationsProgress(row){ return sbFetch('/rest/v1/foundations_progress?on_conflict=staff_id,module_id', { method:'POST', prefer:'resolution=merge-duplicates,return=minimal', body:row }); },
  updateFoundationsAssignmentStatus(staffId, moduleId, status){ return sbFetch(`/rest/v1/foundations_assignments?staff_id=eq.${staffId}&module_id=eq.${encodeURIComponent(moduleId)}`, { method:'PATCH', prefer:'return=minimal', body:{ status } }); },
  // Unassign (RLS: DELETE is master admin only). Progress rows stay as history (Addendum 8.4).
  deleteFoundationsAssignment(staffId, moduleId){ return sbFetch(`/rest/v1/foundations_assignments?staff_id=eq.${staffId}&module_id=eq.${encodeURIComponent(moduleId)}`, { method:'DELETE', prefer:'return=minimal' }); },
  // ── SBD Instruments (#22) ──
  getInstrumentAssignments(){ return sbFetch('/rest/v1/instrument_assignments?select=*'); },
  getInstrumentProgress(){ return sbFetch('/rest/v1/instrument_progress?select=*'); },
  createInstrumentAssignment(data){ return sbFetch('/rest/v1/instrument_assignments?on_conflict=staff_id,module_id', { method:'POST', prefer:'resolution=ignore-duplicates,return=minimal', body:data }); },
  upsertInstrumentProgress(row){ return sbFetch('/rest/v1/instrument_progress?on_conflict=staff_id,module_id', { method:'POST', prefer:'resolution=merge-duplicates,return=minimal', body:row }); },
  updateInstrumentAssignmentStatus(staffId, moduleId, status){ return sbFetch(`/rest/v1/instrument_assignments?staff_id=eq.${staffId}&module_id=eq.${encodeURIComponent(moduleId)}`, { method:'PATCH', prefer:'return=minimal', body:{ status } }); },
  deleteInstrumentAssignment(staffId, moduleId){ return sbFetch(`/rest/v1/instrument_assignments?staff_id=eq.${staffId}&module_id=eq.${encodeURIComponent(moduleId)}`, { method:'DELETE', prefer:'return=minimal' }); },
  // ── SBD Preceptor Certification (#78 Ph1) — mirrors the Foundations/Instruments matrix, table prefix swapped ──
  getPreceptorModules(){ return sbFetch('/rest/v1/preceptor_modules?select=*&order=seq.asc'); },
  getPreceptorAssignments(){ return sbFetch('/rest/v1/preceptor_assignments?select=*'); },
  getPreceptorProgress(){ return sbFetch('/rest/v1/preceptor_progress?select=*'); },
  createPreceptorAssignment(data){ return sbFetch('/rest/v1/preceptor_assignments?on_conflict=staff_id,module_id', { method:'POST', prefer:'resolution=ignore-duplicates,return=minimal', body:data }); },
  upsertPreceptorProgress(row){ return sbFetch('/rest/v1/preceptor_progress?on_conflict=staff_id,module_id', { method:'POST', prefer:'resolution=merge-duplicates,return=minimal', body:row }); },
  updatePreceptorAssignmentStatus(staffId, moduleId, status){ return sbFetch(`/rest/v1/preceptor_assignments?staff_id=eq.${staffId}&module_id=eq.${encodeURIComponent(moduleId)}`, { method:'PATCH', prefer:'return=minimal', body:{ status } }); },
  deletePreceptorAssignment(staffId, moduleId){ return sbFetch(`/rest/v1/preceptor_assignments?staff_id=eq.${staffId}&module_id=eq.${encodeURIComponent(moduleId)}`, { method:'DELETE', prefer:'return=minimal' }); },
  // ── SBD Preceptor Certification (#78 Ph3) — master-admin access control (RLS: read own-or-leader, write master-admin only) ──
  getPreceptorAccess(){ return sbFetch('/rest/v1/preceptor_access?select=*'); },
  upsertPreceptorAccess(row){ return sbFetch('/rest/v1/preceptor_access?on_conflict=staff_id', { method:'POST', prefer:'resolution=merge-duplicates,return=minimal', body:row }); },
  // ── User Profiles ──
  getUserProfile(userId){ return sbFetch(`/rest/v1/sbd_portal_users?auth_uid=eq.${userId}&select=*`); },
  getAllAdminProfiles(){ return sbFetch('/rest/v1/sbd_portal_users?select=*&order=name.asc'); },
  updateUserProfile(userId, data){ return sbFetch(`/rest/v1/sbd_portal_users?auth_uid=eq.${userId}`, { method:'PATCH', body:data }); },
  // #73 v1.1: master-admin-only capability write via the SECURITY DEFINER RPC (role-checked server-side).
  setUserCapabilities(authUid, caps){ return sbFetch('/rest/v1/rpc/sbd_set_user_capabilities', { method:'POST', body:{ p_staff_id: authUid, p_caps: caps || {} } }); },
  syncUserClaims(data){ return sbFetch('/functions/v1/sbd-sync-user-claims', { method:'POST', body:data }); },
  // ── David OG access ──
  // Mirrors supabase/functions/david-chat/auth.ts so the nav matches what the
  // backend will actually authorize. master_admin → always (supreme); otherwise
  // the facility toggle AND the per-user toggle must both be active. RLS scopes
  // david_user_access to the caller's own row. Returns {authorized, tier}.
  async getDavidAccess(user){
    try {
      if(!user) return { authorized:false, tier:null };
      if(user.role === 'master_admin') return { authorized:true, tier:'supreme' };
      if(!user.fid) return { authorized:false, tier:null };
      const fac = await sbFetch(`/rest/v1/david_facility_access?facility_id=eq.${encodeURIComponent(user.fid)}&select=is_active,tier`);
      const facRow = Array.isArray(fac) ? fac[0] : null;
      if(!facRow || !facRow.is_active) return { authorized:false, tier:null };
      const usr = await sbFetch(`/rest/v1/david_user_access?user_id=eq.${encodeURIComponent(user.id)}&select=is_active`);
      const usrRow = Array.isArray(usr) ? usr[0] : null;
      if(!usrRow || !usrRow.is_active) return { authorized:false, tier:null };
      return { authorized:true, tier: facRow.tier || 'base' };
    } catch(e){
      console.warn('getDavidAccess failed:', e);
      return { authorized:false, tier:null };
    }
  },
  // ── Registrations ──
  getPendingRegistrations(){ return sbFetch('/rest/v1/registrations?status=eq.pending&select=*&order=requested_at.desc'); },
  submitRegistration(data){ return sbFetch('/rest/v1/registrations', { method:'POST', prefer:'return=minimal', body:data }); },
  approveRegistration(id, facilityName, systemId, assignRole){ return sbFetch('/functions/v1/sbd-approve-registration', { method:'POST', body:{registration_id:id, facility_name:facilityName, assign_system_id:systemId, assign_role:assignRole} }); },
  // Deactivate (active=false) / reactivate (active=true) a portal account. Bans
  // or unbans the auth user server-side so login truly stops; no data is deleted.
  setAccountActive(authUid, active, reason){ return sbFetch('/functions/v1/sbd-set-account-active', { method:'POST', body:{ auth_uid:authUid, active:active, reason:reason||null } }); },
  denyRegistration(id, reviewedBy){ return sbFetch(`/rest/v1/registrations?id=eq.${id}`, { method:'PATCH', body:{status:'denied', reviewed_at:new Date().toISOString(), reviewed_by:reviewedBy} }); },
  // ── Analytics ──
  getFacilityTrends(fid){ return sbFetch(`/rest/v1/sbd_facility_trends?facility_id=eq.${encodeURIComponent(fid)}&select=*&order=year.asc,month_index.asc`); },
  bulkUploadStaff(payload){    return sbFetch('/functions/v1/bulk-upload-staff', {
      method: 'POST',
      body: { payload }
    });
  },
  // ── Audit Log ──
  logReportDownload(fid, by){ return sbFetch('/rest/v1/sbd_report_audit_log', { method:'POST', prefer:'return=minimal', body:{facility_id:fid, generated_by:by, generated_at:new Date().toISOString()} }); },
  // ── Practice attempts (P0.3 — append-only history + wrong-question log) ──
  logPracticeAttempt(attempt){ return sbFetch('/rest/v1/sbd_practice_attempts', { method:'POST', prefer:'return=minimal', body:attempt }); },
  getPracticeAttempts(staffId, limit=50){ return sbFetch(`/rest/v1/sbd_practice_attempts?staff_id=eq.${encodeURIComponent(staffId)}&select=*&order=created_at.desc&limit=${limit}`); },
  // ── Activity log (P1 — engagement metrics; rows written by sbd-log-activity edge fn) ──
  getStaffActivity(staffId, limit=1000){ return sbFetch(`/rest/v1/sbd_activity_log?staff_id=eq.${encodeURIComponent(staffId)}&select=event_type,event_meta,created_at&order=created_at.desc&limit=${limit}`); },
  getFacilityActivity(fid, limit=2000){ return sbFetch(`/rest/v1/sbd_activity_log?facility_id=eq.${encodeURIComponent(fid)}&select=event_type,event_meta,created_at,staff_id&order=created_at.desc&limit=${limit}`); },
  // ── Placement Reviews ──
  getPlacementReviews(fid){ const f=fid?`&fid=eq.${encodeURIComponent(fid)}`:''; return sbFetch(`/rest/v1/placement_reviews?select=*&order=submitted_at.desc${f}`); },
  insertPlacementReview(data){ return sbFetch('/rest/v1/placement_reviews', { method:'POST', body:data }); },
  updatePlacementReview(id, data){ return sbFetch(`/rest/v1/placement_reviews?id=eq.${id}`, { method:'PATCH', body:data }); },
  // ── Promotion Approvals ──
  getPromotionApprovals(fid){ const f=fid?`&facility_id=eq.${encodeURIComponent(fid)}`:''; return sbFetch(`/rest/v1/sbd_promotions?status=eq.pending${f}&select=*&order=created_at.desc`); },
  submitPromotionApproval(data){ return sbFetch('/rest/v1/sbd_promotions', { method:'POST', body:data }); },
  updatePromotionApproval(id, data){ return sbFetch(`/rest/v1/sbd_promotions?id=eq.${id}`, { method:'PATCH', body:data }); },
  // ── Observations (OVS — third assessment gate) ──
  // Instruments (12 seeded rows) are the system of record; never mutated from the app.
  getObservationChecklists(){ return sbFetch('/rest/v1/observation_checklists?active=eq.true&select=*'); },
  getObservations(){ return sbFetch('/rest/v1/observations?select=*&order=created_at.desc'); },
  insertObservation(data){ return sbFetch('/rest/v1/observations', { method:'POST', body:data }); },
  updateObservation(id, data){ return sbFetch(`/rest/v1/observations?id=eq.${id}`, { method:'PATCH', body:data }); },
  // T37: two-PIN check moved server-side. Observer PINs live in sbd_observer_pins (RLS on,
  // no policies), so no browser can read one — both calls below go through a service-role
  // function, and the staff payload carries only the observer_pin_set flag.
  unlockObservation(observationId, observerPin, candidatePin){ return sbFetch('/functions/v1/sbd-observation-unlock', { method:'POST', body:{ observation_id:observationId, observer_pin:observerPin, candidate_pin:candidatePin } }); },
  // Master-admin only, enforced in the function. Returns the observer's existing PIN, or
  // mints one on first call; it never rotates an existing PIN.
  setObserverPin(staffId){ return sbFetch('/functions/v1/sbd-observer-pin', { method:'POST', body:{ action:'get_or_create', staff_id:staffId } }).then(r => r && r.pin); },
  // ── Hospital Systems ──
  getHospitalSystems(){ return sbFetch('/rest/v1/hospital_systems?select=id,name,active,created_at&order=name.asc'); },
  createHospitalSystem(data){ return sbFetch('/rest/v1/hospital_systems?select=id,name,active,created_at', { method:'POST', body:data }); },
  getHospitalSystemByName(name){ return sbFetch('/rest/v1/hospital_systems?name=eq.'+encodeURIComponent(name)+'&select=id,name,active,created_at', { method:'GET' }); },
  getHospitalSystemByNameIlike(name){ return sbFetch('/rest/v1/hospital_systems?name=ilike.'+encodeURIComponent(name)+'&select=id,name,active,created_at', { method:'GET' }); },
  updateHospitalSystem(id, data){ return sbFetch(`/rest/v1/hospital_systems?id=eq.${id}&select=id,name,active,created_at`, { method:'PATCH', body:data }); },
  deleteHospitalSystem(id){ return sbFetch(`/rest/v1/hospital_systems?id=eq.${id}`, { method:'DELETE' }); },
  // ── Free Agents ──
  getFreeAgents(){ return sbFetch('/rest/v1/free_agents?select=*&order=released_at.desc'); },
  purgeFreeAgent(id){ return sbFetch(`/rest/v1/free_agents?id=eq.${id}`, { method:'DELETE' }); },
  // ── Free Agent remote helpers (named to match IS_LIVE call sites) ──
  releaseToFreeAgentRemote(data){ return sbFetch('/functions/v1/sbd-release-to-free-agent', { method:'POST', body:data }); },
  assignFreeAgentRemote(data){ return sbFetch('/functions/v1/sbd-assign-free-agent', { method:'POST', body:data }); },
  // ── Transfer Requests (dual-admin verification queue, transfer_requests table) ──
  getTransferRequests(){ return sbFetch('/rest/v1/transfer_requests?select=*&order=requested_at.desc'); },
  createTransferRequest(data){ return sbFetch('/rest/v1/transfer_requests', { method:'POST', body:data }); },
  updateTransferRequest(id, data){ return sbFetch(`/rest/v1/transfer_requests?id=eq.${id}`, { method:'PATCH', body:data }); },
  // ── Schedule ──
  getSchedule(fid, startDate, endDate){ return sbFetch(`/rest/v1/sbd_schedule?facility_id=eq.${encodeURIComponent(fid)}&date=gte.${startDate}&date=lte.${endDate}&select=*&order=date.asc`); },
  getStaffScheduleRange(fid, startDate, endDate){ return sbFetch(`/rest/v1/sbd_schedule?facility_id=eq.${encodeURIComponent(fid)}&date=gte.${startDate}&date=lte.${endDate}&select=*&order=date.asc`); },
  createSchedule(data){ return sbFetch('/rest/v1/sbd_schedule', { method:'POST', body:data }); },
  updateSchedule(id, data){ return sbFetch(`/rest/v1/sbd_schedule?id=eq.${id}`, { method:'PATCH', body:data }); },
  deleteSchedule(id){ return sbFetch(`/rest/v1/sbd_schedule?id=eq.${id}`, { method:'DELETE' }); },
  // ── Position School completion requests ──
  // A candidate asks for sign-off on a track; a leader approves or denies it.
  getPSCompletionRequests(){ return sbFetch('/rest/v1/ps_completion_requests?select=*&order=created_at.desc'); },
  createPSCompletionRequest(data){ return sbFetch('/rest/v1/ps_completion_requests', { method:'POST', body:data }); },
  decidePSCompletionRequest(id, data){ return sbFetch(`/rest/v1/ps_completion_requests?id=eq.${id}`, { method:'PATCH', body:data }); },
  // ── Facility shift definitions ──
  // Custom shifts a facility defines on top of SHIFT_DEF_DEFAULT. Upsert is keyed on
  // (fid, shift_id) so re-saving an existing shift edits it rather than duplicating.
  getFacilityShiftDefs(fid){ return sbFetch(`/rest/v1/facility_shifts?fid=eq.${encodeURIComponent(fid)}&select=*`); },
  upsertFacilityShiftDef(data){ return sbFetch('/rest/v1/facility_shifts?on_conflict=fid,shift_id', { method:'POST', prefer:'resolution=merge-duplicates', body:data }); },
  deleteFacilityShiftDef(fid, shiftId){ return sbFetch(`/rest/v1/facility_shifts?fid=eq.${encodeURIComponent(fid)}&shift_id=eq.${encodeURIComponent(shiftId)}`, { method:'DELETE' }); },
  // ── Attendance ──
  getAttendance(fid, date){ return sbFetch(`/rest/v1/sbd_attendance?facility_id=eq.${encodeURIComponent(fid)}&date=eq.${date}&select=*`); },
  // The leader attendance record is a whole year for every staff member at once, so the
  // single-date getAttendance above cannot serve it. Mirrors getSchedule's range shape.
  getFacilityAttendance(fid, startDate, endDate){ return sbFetch(`/rest/v1/sbd_attendance?facility_id=eq.${encodeURIComponent(fid)}&date=gte.${startDate}&date=lte.${endDate}&select=*&order=date.asc`); },
  getStaffAttendance(staffId){ return sbFetch(`/rest/v1/sbd_attendance?staff_id=eq.${staffId}&select=*&order=date.desc`); },
  recordAttendance(data){ return sbFetch('/rest/v1/sbd_attendance', { method:'POST', body:data }); },
  updateAttendance(id, data){ return sbFetch(`/rest/v1/sbd_attendance?id=eq.${id}`, { method:'PATCH', body:data }); },
  // ── Assessment PIN Authorization ──
  generateAssessmentPin(staffId, assessmentType='placement'){ return sbFetch('/functions/v1/sbd-assessor-pin', { method:'POST', body:{ action:'generate_pin', staff_id:staffId, assessment_type:assessmentType } }); },
  validateAssessmentPin(pin, staffId, assessmentType='placement'){ return sbFetch('/functions/v1/sbd-assessor-pin', { method:'POST', body:{ action:'validate_pin', pin, staff_id:staffId, assessment_type:assessmentType, device_info:{ userAgent:navigator.userAgent, screenWidth:screen.width, platform:navigator.platform } } }); },
  validateAssessmentSession(sessionToken){ return sbFetch('/functions/v1/sbd-assessor-pin', { method:'POST', body:{ action:'validate_session', session_token:sessionToken } }); },
  saveAssessmentProgress(sessionToken, progress){ return sbFetch('/functions/v1/sbd-assessor-pin', { method:'POST', body:{ action:'save_progress', session_token:sessionToken, progress } }); },
  completeAssessmentSession(sessionToken){ return sbFetch('/functions/v1/sbd-assessor-pin', { method:'POST', body:{ action:'complete_session', session_token:sessionToken } }); },
  // #21 admin in-progress tracker. Admin-gated service-role read; the function
  // scopes results to the caller's facilities (master_admin sees all).
  getInProgressAssessments(){ return sbFetch('/functions/v1/sbd-admin-sessions', { method:'POST', body:{} }); },
  notifyPlacementEvent(type, data){ return sbFetch('/functions/v1/sbd-emails', { method:'POST', body:{ type, data } }); }
};
if (typeof window !== 'undefined') {
  window.SB = SB;
  window.sbFetch = sbFetch;
  window.SB_AUTH = SB_AUTH;
}

// ── Shared State Management ──
function resetDB(){
  if(typeof DB === 'undefined') return;
  DB.facilities = [];
  DB.staff = [];
  DB.hospitalSystems = [];
  DB.systems = []; // For backward compatibility / transition
  DB.users = [];
  DB.queue = [];
  DB.promotionApprovals = [];
  DB.freeAgents = [];
  DB.pendingTransfers = [];
  DB.pendingRegs = [];
  DB.placementReviews = [];
  DB.beltTestResults = [];
  DB.observations = [];
  DB.observationChecklists = [];
  DB.schedule = [];
  DB.attendance = [];
  DB.foundationsAssignments = [];
  DB.foundationsProgress = [];
  DB.instrumentAssignments = [];
  DB.instrumentProgress = [];
  DB.preceptorAssignments = [];
  DB.preceptorProgress = [];
  DB.preceptorModules = [];
  DB.preceptorAccess = [];
  console.log('SBD Platform: Global state reset.');
}

// ── Data Mappers: Backend (flat) <-> App (nested) ──
// All live-mode reads go through fromBackend mappers.
// All live-mode writes go through toBackend mappers.

// ── Free Agents (free_agents table) ──────────────────────────────────────────
// The free agent record is shaped like a staff object so it can be passed to
// calcPoints(), beltBadge(), etc. without crashing.
function mapFreeAgentFromBackend(row){
  if(!row) return null;
  return {
    id:             row.id,
    staffId:        row.staff_id,            // uuid → matches staff.id for the assign round-trip
    // Staff-compatible shape so UI helpers (calcPoints, beltBadge etc.) work:
    first:          row.first || (row.name||'').split(' ')[0] || '--',
    last:           row.last  || (row.name||'').split(' ').slice(1).join(' ') || '',
    role:           row.role        || '',
    belt:           row.belt        || 'White',
    since:          row.since       || null,
    sbdYears:       row.sbd_program_years != null ? row.sbd_program_years : null,
    certYears:      row.sbd_cert_years    != null ? row.sbd_cert_years    : null,
    stars:          row.stars       || 0,
    promo:          false,
    cur:            { c: null, s: null, o: null },
    nxt:            { c: null, s: null, o: null },
    ps:             row.ps_data       || { enrolled:false, done:false, track:null, mod:null, tracks:{} },
    oip:            row.oip           || null,
    history:        row.staff_history || [],
    // Free-agent specific fields (free_agents table columns):
    fid:            row.from_fac_id   || null,
    fromFacName:    row.from_fac_name || '--',
    releaseReason:  row.release_reason|| '',
    releaseNotes:   row.release_notes || '',
    releasedAt:     row.released_at   || null,
    facilityHistory:[]
  };
}

// ── Transfer Requests (transfer_requests table) ───────────────────────────────
// The dual-admin verification queue (DB.pendingTransfers). Persisted so a second
// admin in another session can see and approve requests; execution of the actual
// release/assignment is deferred to approveTransfer().

// Optimistic local ids ('fa-…', 'local-…', 'fac-…') must never reach a uuid
// column — Postgres 400s the whole insert on invalid uuid syntax.
function isUuidId(v){ return typeof v==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v); }

function mapTransferFromBackend(row){
  if(!row) return null;
  const tr = {
    id:              row.id,
    type:            row.type,
    staffId:         row.staff_id || null,
    faId:            row.fa_id    || null,
    staffName:       row.staff_name || '',
    belt:            row.belt || 'White',
    fromFacId:       row.from_fac_id   || null,
    fromFacName:     row.from_fac_name || (row.type==='assignment' ? 'Free Agent Pool' : '--'),
    toFacId:         row.to_fac_id     || null,
    toFacName:       row.to_fac_name   || (row.type==='release' ? 'Free Agent Pool' : '--'),
    toFacLoc:        row.to_fac_loc    || '',
    reason:          row.reason || '',
    notes:           row.notes  || '',
    effectDate:      row.effect_date || null,
    status:          row.status || 'pending',
    requestedBy:     row.requested_by,
    requestedByName: row.requested_by_name || 'Admin',
    requestedAt:     (row.requested_at || '').slice(0,10)
  };
  if(row.status === 'approved'){
    tr.approvedBy     = row.decided_by;
    tr.approvedByName = row.decided_by_name || 'Admin';
    tr.approvedAt     = (row.decided_at || '').slice(0,10);
  } else if(row.status === 'denied'){
    tr.deniedBy       = row.decided_by;
    tr.deniedByName   = row.decided_by_name || 'Admin';
    tr.deniedAt       = (row.decided_at || '').slice(0,10);
    tr.denyReason     = row.deny_reason || '';
  }
  return tr;
}
function mapTransferToBackend(tr){
  if(!tr) return null;
  return {
    type:              tr.type,
    staff_id:          isUuidId(tr.staffId)   ? tr.staffId   : null,
    fa_id:             isUuidId(tr.faId)      ? tr.faId      : null,
    staff_name:        tr.staffName || null,
    belt:              tr.belt || null,
    from_fac_id:       isUuidId(tr.fromFacId) ? tr.fromFacId : null,
    from_fac_name:     tr.fromFacName || null,
    to_fac_id:         isUuidId(tr.toFacId)   ? tr.toFacId   : null,
    to_fac_name:       tr.toFacName   || null,
    to_fac_loc:        tr.toFacLoc    || null,
    reason:            tr.reason || null,
    notes:             tr.notes  || null,
    effect_date:       tr.effectDate || null,
    status:            tr.status || 'pending',
    requested_by:      tr.requestedBy,
    requested_by_name: tr.requestedByName || null
  };
}

// ── Promotion Approvals (promotion_approvals table) ───────────────────────────
function mapPromotionApprovalFromBackend(row){
  if(!row) return null;
  return {
    id:              row.id,
    staffId:         row.staff_id,
    fid:             row.facility_id,
    status:          row.status          || 'pending',
    currentRole:     row.current_role    || '',
    proposedRole:    row.proposed_role   || '',
    submittedBy:     row.submitted_by    || '',
    submittedByRole: '',   // not stored in this table; left blank safely
    requestedAt:     row.created_at ? new Date(row.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '',
    proposedBelt:    row.to_belt         || null,
    belt:            row.from_belt       || null,
    decidedBy:       row.reviewed_by     || null,
    decidedAt:       row.reviewed_at     || null,
    reviewNotes:     row.review_notes    || '',
    created_at:      row.created_at,
    updated_at:      row.updated_at
  };
}
function mapPromotionApprovalToBackend(ap){
  if(!ap) return null;
  return {
    staff_id:      ap.staffId,
    facility_id:   ap.fid,
    current_role:  ap.currentRole,
    proposed_role: ap.proposedRole,
    from_belt:     ap.belt,
    to_belt:       ap.proposedBelt || null,
    status:        ap.status    || 'pending',
    submitted_by:  ap.submittedBy,
    reviewed_by:   ap.decidedBy  || null,
    reviewed_at:   ap.decidedAt  || null,
    review_notes:  ap.reviewNotes || ap.notes || ''
  };
}


function mapStaffFromBackend(row){
  if(!row) return null;
  return {
    id: row.id,
    fid: row.fid || row.facility_id, // check both just in case a view is used elsewhere
    first: row.first || row.first_name,
    last: row.last || row.last_name,
    role: row.role,
    belt: row.belt,
    since: row.since || row.belt_since,
    stars: row.stars || 0,
    promo: row.promo || row.promo_recommended || false,
    cur: { c: row.cur_comp || null, s: row.cur_sim || null, o: row.cur_obs || null },
    nxt: { c: row.nxt_comp || null, s: row.nxt_sim || null, o: row.nxt_obs || null },
    observer: row.observer || false,
    // T37: the PIN itself is never sent to a browser (it lives in sbd_observer_pins).
    // This flag is all the interface needs to render "PIN set" / "Generate PIN"; the value
    // is fetched on demand, master-admin only, via SB.getObserverPin/setObserverPin.
    observerPinSet: row.observer_pin_set || false,
    ps: {
      enrolled: row.ps_enrolled || false,
      done: row.ps_done || false,
      track: row.ps_track || null,
      mod: row.ps_module || null,
      tracks: row.ps_tracks || {}
    },
    oip: row.oip || null,
    history: row.history || [],
    practiceScores: row.practice_scores || {},
    created_at: row.created_at,
    updated_at: row.updated_at,
    placementNeeded: row.placement_needed,
    placementAcknowledged: row.placement_acknowledged || false,
    windowOverride: row.window_override || null,
    assessmentGateOverride: row.assessment_gate_override || null,
    // T65: patient-safety provisions raised by a dangerous assessment answer. Array of
    // entries; an entry with clearedAt null is still open and gates advancement.
    dangerousProvisions: row.dangerous_provisions || [],
  };
}

function mapStaffToBackend(staff){
  if(!staff) return null;
  const obj = {
    id: staff.id,
    fid: staff.fid,
    first: staff.first,
    last: staff.last,
    role: staff.role,
    belt: staff.belt,
    since: staff.since || null,
    sbd_program_years: staff.sbdYears != null ? staff.sbdYears : null,
    sbd_cert_years: staff.certYears != null ? staff.certYears : null,
    stars: staff.stars || 0,
    promo: staff.promo || false,
    ps_enrolled: staff.ps?.enrolled || false,
    ps_done: staff.ps?.done || false,
    ps_track: staff.ps?.track || null,
    ps_mod: staff.ps?.mod || null,
    ps_tracks: staff.ps?.tracks || null,
    oip: staff.oip || null,
    history: staff.history || null,
    practice_scores: staff.practiceScores || null,
    window_override: staff.windowOverride || null,
    assessment_gate_override: staff.assessmentGateOverride || null,
    dangerous_provisions: staff.dangerousProvisions || null
  };
  if(staff.cur){
    obj.cur_comp = staff.cur.c || null;
    obj.cur_sim  = staff.cur.s || null;
    obj.cur_obs  = staff.cur.o || null;
  }
  if(staff.nxt){
    obj.nxt_comp = staff.nxt.c || null;
    obj.nxt_sim  = staff.nxt.s || null;
    obj.nxt_obs  = staff.nxt.o || null;
  }
  if(staff.observer !== undefined) obj.observer = !!staff.observer;
  return obj;
}

// Backend column subset for Position School progress + stars, derived from the
// canonical mapStaffToBackend mapping so the column names live in exactly one
// place. The award-star / track flows must PATCH these real columns -- writing
// a bare `ps` key (which is NOT a column on staff) silently 400s and loses the
// star on the next refresh.
function mapStaffPSToBackend(staff){
  const full = mapStaffToBackend(staff) || {};
  return {
    ps_enrolled: full.ps_enrolled,
    ps_done:     full.ps_done,
    ps_track:    full.ps_track,
    ps_mod:      full.ps_mod,
    ps_tracks:   full.ps_tracks,
    stars:       full.stars
  };
}

// T65: the provision column on its own. Clearing a provision is an administrator action on
// one field, and it must not ride along with a whole-record write -- a full staff PATCH from a
// stale in-memory copy is how progress gates and history have been erased before.
function mapStaffProvisionsToBackend(staff){
  return { dangerous_provisions: (staff && staff.dangerousProvisions) || null };
}

function mapFacilityFromBackend(row){
  if(!row) return null;
  return {
    id: row.id,
    name: typeof titleCase === 'function' ? titleCase(row.name) : row.name,
    loc: row.loc,
    dept: row.dept,
    contact: row.contact,
    email: row.email,
    since: row.since || null,
    active: row.active !== false,
    systemId: row.system_id || null,
    deactivatedAt: row.deactivated_at || null,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function mapFacilityToBackend(fac){
  if(!fac) return null;
  return {
    name: fac.name,
    loc: fac.loc,
    dept: fac.dept,
    contact: fac.contact,
    email: fac.email,
    since: fac.since || null,
    active: fac.active !== false,
    system_id: fac.systemId || null
  };
}

function mapQueueFromBackend(row){
  if(!row) return null;
  const d = row.data || {};
  const rev = d.review || {};
  return {
    id: row.id,
    sid: row.staff_id,
    fid: row.facility_id || row.fid,
    type: row.assessment_type || row.type,
    targetBelt: row.target_belt,
    status: row.status,
    date: row.requested_at ? new Date(row.requested_at).toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}) : '',
    requested_at: row.requested_at,
    requestedAt: row.requested_at || null,           // camel — badge + request filters depend on this
    resolved_at: row.resolved_at || null,
    practiceKnowledge: d.practiceKnowledge ?? undefined,
    practiceSimulation: d.practiceSimulation ?? undefined,
    approvedBy: rev.action==='approved' ? rev.by : undefined,
    approvedAt: rev.action==='approved' ? rev.at : undefined
  };
}

function mapQueueToBackend(item){
  if(!item) return null;
  return {
    staff_id: item.sid,
    facility_id: item.fid,
    assessment_type: item.type,
    target_belt: item.targetBelt,
    status: item.status || 'pending',
    requested_at: item.requested_at || item.requestedAt || new Date().toISOString(),
    data: {
      practiceKnowledge: item.practiceKnowledge ?? null,
      practiceSimulation: item.practiceSimulation ?? null
    }
  };
}

function mapPlacementReviewFromBackend(row){
  if(!row) return null;
  return {
    id:           row.id,
    staffId:      row.staff_id,
    fid:          row.fid,
    staffName:    row.staff_name || null,
    staffTitle:   row.staff_title || null,
    status:       row.status,
    tentativeBelt:row.tentative_belt,
    confirmedBelt:row.confirmed_belt,
    responses:    row.responses   || [],
    levelScores:  row.level_scores|| {},
    submittedAt:  row.submitted_at,
    confirmedAt:  row.confirmed_at || null,
    confirmedBy:  row.confirmed_by || null,
    reviewedBy:   row.reviewed_by,
    reviewedAt:   row.reviewed_at,
    assessorNote: row.assessor_note,
    createdAt:    row.created_at
  };
}
function mapPlacementReviewToBackend(pr){
  if(!pr) return null;
  return {
    staff_id:       pr.staffId,
    fid:            pr.fid,
    staff_name:     pr.staffName || null,
    staff_title:    pr.staffTitle || null,
    status:         pr.status,
    tentative_belt: pr.tentativeBelt,
    confirmed_belt: pr.confirmedBelt,
    responses:      pr.responses   || [],
    level_scores:   pr.levelScores || {},
    submitted_at:   pr.submittedAt,
    confirmed_at:   pr.confirmedAt || null,
    confirmed_by:   pr.confirmedBy || null,
    reviewed_by:    pr.reviewedBy,
    reviewed_at:    pr.reviewedAt,
    assessor_note:  pr.assessorNote
  };
}

// ── Dynamic Belt Test (A4) ───────────────────────────────────────────────
function mapBeltTestFromBackend(row){
  if(!row) return null;
  return {
    id:            row.id,
    staffId:       row.staff_id,
    fid:           row.facility_id,
    queueIds:      row.queue_ids || [],
    targetBelt:    row.target_belt,
    seed:          row.seed,
    testDate:      row.test_date,
    questions:     row.questions || { knowledge:[], simulation:[] },
    variantStatus: row.variant_status,
    status:        row.status,
    createdAt:     row.created_at,
    submittedAt:   row.submitted_at || null
  };
}
function mapBeltTestResultFromBackend(row){
  if(!row) return null;
  return {
    id:               row.id,
    testId:           row.test_id,
    staffId:          row.staff_id,
    fid:              row.facility_id,
    targetBelt:       row.target_belt,
    component:        row.component || 'combined',
    submittedAt:      row.submitted_at,
    scoredAt:         row.scored_at,
    kLevelScores:     row.k_level_scores || {},
    kOverall:         row.k_overall,
    kFloorResults:    row.k_floor_results || [],
    kOverallPassed:   row.k_overall_passed,
    simResponses:     row.sim_responses || [],
    simLevelAvgs:     row.sim_level_avgs || {},
    simOverall:       row.sim_overall,
    simFloorResults:  row.sim_floor_results || [],
    simIndividualMin: row.sim_individual_min,
    simOverallPassed: row.sim_overall_passed,
    blendedScore:     row.blended_score,
    blendedPassed:    row.blended_passed,
    systemSuggestion: row.system_suggestion,
    outcome:          row.outcome,
    reasonCodes:      row.suggestion_reason_codes || [],
    conditions:       row.conditions || [],
    watchFlags:       row.watch_flags || [],
    remediationFlags: row.remediation_flags || [],
    finalBelt:        row.final_belt,
    overrideApplied:  row.override_applied === true,
    overrideBy:       row.override_by,
    overrideJustification: row.override_justification,
    overrideAt:       row.override_at,
    notes:            row.notes || null,
    componentDetail:  row.component_detail || null,
    status:           row.status,
    createdAt:        row.created_at
  };
}
// engineResult = output of BeltTestEngine.scoreBeltTest (snake-ish already).
function mapBeltTestResultToBackend(engineResult, ctx){
  ctx = ctx || {};
  return {
    test_id:                 ctx.testId || null,
    staff_id:                ctx.staffId,
    facility_id:             ctx.fid || null,
    target_belt:             engineResult.target_belt || ctx.targetBelt,
    component:               engineResult.component || ctx.component || 'combined',
    submitted_at:            ctx.submittedAt || new Date().toISOString(),
    scored_at:               engineResult._scored_at || new Date().toISOString(),
    k_level_scores:          engineResult.k_level_scores || {},
    k_overall:               engineResult.k_overall,
    k_floor_results:         engineResult.k_floor_results || [],
    k_overall_passed:        engineResult.k_overall_passed,
    sim_responses:           engineResult.sim_responses || [],
    sim_level_avgs:          engineResult.sim_level_avgs || {},
    sim_overall:             engineResult.sim_overall,
    sim_floor_results:       engineResult.sim_floor_results || [],
    sim_individual_min:      engineResult.sim_individual_min,
    sim_overall_passed:      engineResult.sim_overall_passed,
    blended_score:           engineResult.blended_score,
    blended_passed:          engineResult.blended_passed,
    system_suggestion:       engineResult.system_suggestion,
    outcome:                 engineResult.outcome,
    suggestion_reason_codes: engineResult.suggestion_reason_codes || [],
    conditions:              engineResult.conditions || [],
    watch_flags:             engineResult.watch_flags || [],
    remediation_flags:       engineResult.remediation_flags || [],
    component_detail:        engineResult.component_detail || null,
    notes:                   ctx.notes != null ? ctx.notes : (engineResult.notes || null),
    status:                  engineResult.status || 'PENDING_REVIEW'
  };
}
if (typeof window !== 'undefined') {
  window.mapBeltTestFromBackend = mapBeltTestFromBackend;
  window.mapBeltTestResultFromBackend = mapBeltTestResultFromBackend;
  window.mapBeltTestResultToBackend = mapBeltTestResultToBackend;
}
// ── Observations (observations table) ────────────────────────────────────────
// One row per observation. The instrument snapshot, item scores, handshake PINs,
// computed outcome, and the review decision all live on the row.
function mapObservationFromBackend(row){
  if(!row) return null;
  return {
    id:              row.id,
    staffId:         row.staff_id,
    fid:             row.fid,
    targetBelt:      row.target_belt,
    context:         row.context || 'gate',
    checklistBelt:   row.checklist_belt || null,
    checklistVersion:row.checklist_version || 1,
    status:          row.status || 'draft',
    itemScores:      row.item_scores || {},
    stopWork:        row.stop_work || null,
    totalPoints:     row.total_points,
    outcome:         row.outcome || null,
    outcomeReasons:  row.outcome_reasons || [],
    handshake:       row.handshake || null,
    observerId:      row.assessor_id || null,
    observerName:    row.assessor_name || null,
    recommendedBelt: row.recommended_belt || null,
    reviewStatus:    row.review_status || 'pending',
    reviewedBy:      row.reviewed_by || null,
    reviewedByName:  row.reviewed_by_name || null,
    reviewedAt:      row.reviewed_at || null,
    returnReason:    row.return_reason || null,
    startedAt:       row.started_at || null,
    submittedAt:     row.submitted_at || null,
    createdAt:       row.created_at || null
  };
}

function mapHospitalSystemFromBackend(row){
  if(!row) return null;
  return {
    id:          row.id,
    name:        row.name,
    active:      row.active !== false,
    contact:     row.contact,
    email:       row.email,
    createdAt:   row.created_at
  };
}
function mapHospitalSystemToBackend(sys){
  if(!sys) return null;
  const obj = {
    name:         sys.name,
    active:       sys.active !== false,
    contact:      sys.contact,
    email:        sys.email
  };
  return obj;
}

function mapUserFromBackend(row){
  if(!row) return null;
  return {
    id:           row.id,
    authUid:      row.auth_uid,
    email:        row.email,
    password_hash:row.password_hash,
    role:         row.role,
    name:         row.name,
    title:        row.title,
    initials:     row.initials,
    fid:          row.facility_id,
    systemId:     row.system_id,
    sid:          row.staff_id || row.auth_uid || row.id || null,
    assignedFids: row.assigned_facility_ids || [],
    active:       row.active,
    protected:    row.protected,
    capabilities: row.capabilities || {},
    // T62: the password-change notice. `at` is when it became due, `ackAt` is when the
    // person actually changed their password. Dismissing the dialog never sets ackAt.
    passwordNoticeAt:    row.password_notice_at    || null,
    passwordNoticeAckAt: row.password_notice_ack_at || null
  };
}
function mapUserToBackend(u){
  if(!u) return null;
  return {
    auth_uid:              u.authUid,
    email:                 u.email,
    password_hash:         u.password_hash,
    role:                  u.role,
    name:                  u.name,
    title:                 u.title,
    initials:              u.initials,
    facility_id:           u.fid,
    system_id:             u.systemId,
    staff_id:              u.sid,
    assigned_facility_ids: u.assignedFids || [],
    active:                u.active,
    protected:             u.protected
  };
}

// The column is `assigned_staff`, not `assigned_staff_ids`. Sending the wrong name meant
// every schedule write was rejected by the database and the table stayed empty (T55).
// `published_by` and `notes` were never mapped at all, which is why Publish to Staff had
// nothing to mark and shift notes never came back.
//
// published_by carries the publish state as well as the identity: null means the schedule
// exists but has not been released to staff yet.
function mapScheduleFromBackend(row){
  return {
    id: row.id,
    fid: row.facility_id,
    date: row.date,
    shift: row.shift,
    assignedStaff: row.assigned_staff || [],
    publishedBy: row.published_by || null,
    notes: row.notes || '',
    zoneAssignments: row.zone_assignments || {}
  };
}

function mapScheduleToBackend(sch){
  return {
    id: sch.id,
    facility_id: sch.fid,
    date: sch.date,
    shift: sch.shift,
    assigned_staff: sch.assignedStaff || [],
    published_by: sch.publishedBy || null,
    notes: sch.notes || '',
    zone_assignments: sch.zoneAssignments || {}
  };
}

// Position School completion requests. Frontend shape predates the table, so the
// mapper keeps the original field names the views already use.
function mapPSCompletionRequestFromBackend(row){
  return {
    id: row.id,
    sid: row.staff_id,
    fid: row.facility_id,
    tid: row.track_id,
    trackName: row.track_name,
    practiceK: row.practice_k,
    practiceS: row.practice_s,
    status: row.status,
    decidedBy: row.decided_by,
    decidedAt: row.decided_at,
    requestedAt: row.created_at
      ? new Date(row.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})
      : ''
  };
}

function mapPSCompletionRequestToBackend(r){
  return {
    staff_id: r.sid,
    facility_id: r.fid || null,
    track_id: r.tid,
    track_name: r.trackName || null,
    practice_k: r.practiceK != null ? r.practiceK : null,
    practice_s: r.practiceS != null ? r.practiceS : null,
    status: r.status || 'pending'
  };
}

// Facility shift definitions. The frontend keeps these as
// DB.facilityShifts[fid][shiftId] = {id,label,name,start,end,icon,color,bg,bd}.
function mapShiftDefFromBackend(row){
  return {
    id: row.shift_id,
    label: row.label,
    name: row.name,
    start: row.start_time,
    end: row.end_time,
    icon: row.icon || '',
    color: row.color || '',
    bg: row.bg || '',
    bd: row.bd || ''
  };
}

function mapShiftDefToBackend(fid, def){
  return {
    fid: fid,
    shift_id: def.id,
    label: def.label || def.id,
    name: def.name,
    start_time: def.start,
    end_time: def.end,
    icon: def.icon || null,
    color: def.color || null,
    bg: def.bg || null,
    bd: def.bd || null
  };
}

// Unchanged in shape, but nothing this mapper produced could be stored until T55: staff_id
// and coverage_for were integer columns being sent uuids, and arrived_at, left_at and note
// did not exist on the table at all. `points` is deliberately not mapped; the app derives it
// from status through calcAttendancePoints, so storing it would create a second truth.
function mapAttendanceFromBackend(row){
  return {
    id: row.id,
    fid: row.facility_id,
    date: row.date,
    shift: row.shift,
    staffId: row.staff_id,
    status: row.status,
    arrivedAt: row.arrived_at,
    leftAt: row.left_at,
    coverageFor: row.coverage_for,
    note: row.note,
    markedBy: row.marked_by
  };
}

function mapAttendanceToBackend(att){
  return {
    id: att.id,
    facility_id: att.fid,
    date: att.date,
    shift: att.shift,
    staff_id: att.staffId,
    status: att.status,
    arrived_at: att.arrivedAt,
    left_at: att.leftAt,
    coverage_for: att.coverageFor,
    note: att.note,
    marked_by: att.markedBy
  };
}
