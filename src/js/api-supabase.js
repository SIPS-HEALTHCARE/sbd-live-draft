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
  async refreshSession() {
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
  restoreSession(){
    try {
      const raw = localStorage.getItem('sbd_session');
      if(!raw) return null;
      const session = JSON.parse(raw);
      if(session.expires_at && Date.now()/1000 > session.expires_at){
        localStorage.removeItem('sbd_session');
        return null;
      }
      SB_SESSION = session;
      return session;
    } catch{ return null; }
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
    const f = fid ? `&facility_id=eq.${encodeURIComponent(fid)}` : '';
    return sbFetch(`/rest/v1/sbd_assessment_queue?status=eq.pending${f}&select=*&order=requested_at.desc`);
  },
  submitAssessmentQueue(data){ return sbFetch('/rest/v1/sbd_assessment_queue', { method:'POST', body:data }); },
  resolveAssessmentQueue(id, status){ return sbFetch(`/rest/v1/sbd_assessment_queue?id=eq.${id}`, { method:'PATCH', body:{ status, resolved_at:new Date().toISOString() } }); },
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
  // ── User Profiles ──
  getUserProfile(userId){ return sbFetch(`/rest/v1/sbd_portal_users?auth_uid=eq.${userId}&select=*`); },
  getAllAdminProfiles(){ return sbFetch('/rest/v1/sbd_portal_users?select=*&order=name.asc'); },
  updateUserProfile(userId, data){ return sbFetch(`/rest/v1/sbd_portal_users?auth_uid=eq.${userId}`, { method:'PATCH', body:data }); },
  syncUserClaims(data){ return sbFetch('/functions/v1/sbd-sync-user-claims', { method:'POST', body:data }); },
  // ── Registrations ──
  getPendingRegistrations(){ return sbFetch('/rest/v1/registrations?status=eq.pending&select=*&order=requested_at.desc'); },
  submitRegistration(data){ return sbFetch('/rest/v1/registrations', { method:'POST', prefer:'return=minimal', body:data }); },
  approveRegistration(id, facilityName, systemId, assignRole){ return sbFetch('/functions/v1/sbd-approve-registration', { method:'POST', body:{registration_id:id, facility_name:facilityName, assign_system_id:systemId, assign_role:assignRole} }); },
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
  // ── Placement Reviews ──
  getPlacementReviews(fid){ const f=fid?`&fid=eq.${encodeURIComponent(fid)}`:''; return sbFetch(`/rest/v1/placement_reviews?select=*&order=submitted_at.desc${f}`); },
  insertPlacementReview(data){ return sbFetch('/rest/v1/placement_reviews', { method:'POST', body:data }); },
  updatePlacementReview(id, data){ return sbFetch(`/rest/v1/placement_reviews?id=eq.${id}`, { method:'PATCH', body:data }); },
  // ── Promotion Approvals ──
  getPromotionApprovals(fid){ const f=fid?`&facility_id=eq.${encodeURIComponent(fid)}`:''; return sbFetch(`/rest/v1/sbd_promotions?status=eq.pending${f}&select=*&order=created_at.desc`); },
  submitPromotionApproval(data){ return sbFetch('/rest/v1/sbd_promotions', { method:'POST', body:data }); },
  updatePromotionApproval(id, data){ return sbFetch(`/rest/v1/sbd_promotions?id=eq.${id}`, { method:'PATCH', body:data }); },
  // ── Hospital Systems ──
  getHospitalSystems(){ return sbFetch('/rest/v1/hospital_systems?select=id,name,active,created_at&order=name.asc'); },
  createHospitalSystem(data){ return sbFetch('/rest/v1/hospital_systems?select=id,name,active,created_at', { method:'POST', body:data }); },
  getHospitalSystemByName(name){ return sbFetch('/rest/v1/hospital_systems?name=eq.'+encodeURIComponent(name)+'&select=id,name,active,created_at', { method:'GET' }); },
  getHospitalSystemByNameIlike(name){ return sbFetch('/rest/v1/hospital_systems?name=ilike.'+encodeURIComponent(name)+'&select=id,name,active,created_at', { method:'GET' }); },
  updateHospitalSystem(id, data){ return sbFetch(`/rest/v1/hospital_systems?id=eq.${id}&select=id,name,active,created_at`, { method:'PATCH', body:data }); },
  deleteHospitalSystem(id){ return sbFetch(`/rest/v1/hospital_systems?id=eq.${id}`, { method:'DELETE' }); },
  // ── Free Agents ──
  getFreeAgents(){ return sbFetch('/rest/v1/sbd_free_agents?select=*&order=released_at.desc'); },
  purgeFreeAgent(id){ return sbFetch(`/rest/v1/sbd_free_agents?id=eq.${id}`, { method:'DELETE' }); },
  releaseToFreeAgent(data){ return sbFetch('/functions/v1/release-to-free-agent', { method:'POST', body:data }); },
  assignFreeAgent(data){ return sbFetch('/functions/v1/assign-free-agent', { method:'POST', body:data }); },
  // ── Free Agent remote helpers (named to match IS_LIVE call sites) ──
  releaseToFreeAgentRemote(data){ return sbFetch('/functions/v1/sbd-release-to-free-agent', { method:'POST', body:data }); },
  assignFreeAgentRemote(data){ return sbFetch('/functions/v1/sbd-assign-free-agent', { method:'POST', body:data }); },
  // ── Schedule ──
  getSchedule(fid, startDate, endDate){ return sbFetch(`/rest/v1/sbd_schedule?facility_id=eq.${encodeURIComponent(fid)}&date=gte.${startDate}&date=lte.${endDate}&select=*&order=date.asc`); },
  getStaffScheduleRange(fid, startDate, endDate){ return sbFetch(`/rest/v1/sbd_schedule?facility_id=eq.${encodeURIComponent(fid)}&date=gte.${startDate}&date=lte.${endDate}&select=*&order=date.asc`); },
  createSchedule(data){ return sbFetch('/rest/v1/sbd_schedule', { method:'POST', body:data }); },
  updateSchedule(id, data){ return sbFetch(`/rest/v1/sbd_schedule?id=eq.${id}`, { method:'PATCH', body:data }); },
  deleteSchedule(id){ return sbFetch(`/rest/v1/sbd_schedule?id=eq.${id}`, { method:'DELETE' }); },
  // ── Attendance ──
  getAttendance(fid, date){ return sbFetch(`/rest/v1/sbd_attendance?facility_id=eq.${encodeURIComponent(fid)}&date=eq.${date}&select=*`); },
  getStaffAttendance(staffId){ return sbFetch(`/rest/v1/sbd_attendance?staff_id=eq.${staffId}&select=*&order=date.desc`); },
  recordAttendance(data){ return sbFetch('/rest/v1/sbd_attendance', { method:'POST', body:data }); },
  updateAttendance(id, data){ return sbFetch(`/rest/v1/sbd_attendance?id=eq.${id}`, { method:'PATCH', body:data }); },
  // ── Assessment PIN Authorization ──
  generateAssessmentPin(staffId, assessmentType='placement'){ return sbFetch('/functions/v1/sbd-assessor-pin', { method:'POST', body:{ action:'generate_pin', staff_id:staffId, assessment_type:assessmentType } }); },
  validateAssessmentPin(pin, staffId, assessmentType='placement'){ return sbFetch('/functions/v1/sbd-assessor-pin', { method:'POST', body:{ action:'validate_pin', pin, staff_id:staffId, assessment_type:assessmentType, device_info:{ userAgent:navigator.userAgent, screenWidth:screen.width, platform:navigator.platform } } }); },
  validateAssessmentSession(sessionToken){ return sbFetch('/functions/v1/sbd-assessor-pin', { method:'POST', body:{ action:'validate_session', session_token:sessionToken } }); },
  saveAssessmentProgress(sessionToken, progress){ return sbFetch('/functions/v1/sbd-assessor-pin', { method:'POST', body:{ action:'save_progress', session_token:sessionToken, progress } }); },
  completeAssessmentSession(sessionToken){ return sbFetch('/functions/v1/sbd-assessor-pin', { method:'POST', body:{ action:'complete_session', session_token:sessionToken } }); }
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
  DB.pendingRegs = [];
  DB.placementReviews = [];
  DB.schedule = [];
  DB.attendance = [];
  console.log('SBD Platform: Global state reset.');
}

// ── Data Mappers: Backend (flat) <-> App (nested) ──
// All live-mode reads go through fromBackend mappers.
// All live-mode writes go through toBackend mappers.

// ── Free Agents (sbd_free_agents table) ──────────────────────────────────────
// The free agent record is shaped like a staff object so it can be passed to
// calcPoints(), beltBadge(), etc. without crashing.
function mapFreeAgentFromBackend(row){
  if(!row) return null;
  return {
    id:             row.id,
    staffId:        row.staff_id,
    // Staff-compatible shape so UI helpers (calcPoints, beltBadge etc.) work:
    first:          row.first_name || (row.name||'').split(' ')[0] || '--',
    last:           row.last_name  || (row.name||'').split(' ').slice(1).join(' ') || '',
    role:           row.staff_role || '',
    belt:           row.belt       || 'White',
    since:          row.belt_since || null,
    stars:          row.stars      || 0,
    promo:          false,
    cur:            { c: null, s: null, o: null },
    nxt:            { c: null, s: null, o: null },
    ps:             row.ps_data    || { enrolled:false, done:false, track:null, mod:null, tracks:{} },
    oip:            row.oip        || null,
    history:        row.staff_history || [],
    // Free-agent specific fields:
    fid:            row.previous_facility_id || null,
    fromFacName:    row.from_facility_name   || '--',
    releaseReason:  row.release_reason       || row.reason || '',
    releaseNotes:   row.release_notes        || row.notes  || '',
    releasedAt:     row.released_at          || null,
    facilityHistory:[]
  };
}

// ── Promotion Approvals (promotion_approvals table) ───────────────────────────
function mapPromotionApprovalFromBackend(row){
  if(!row) return null;
  return {
    id:              row.id,
    staffId:         row.staff_id,
    fid:             row.fid,
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
    fid:           ap.fid,
    current_role:  ap.currentRole,
    proposed_role: ap.proposedRole,
    from_belt:     ap.belt,
    to_belt:       ap.proposedBelt,
    status:        ap.status    || 'pending',
    submitted_by:  ap.submittedBy,
    reviewed_by:   ap.decidedBy  || null,
    reviewed_at:   ap.decidedAt  || null,
    review_notes:  ap.reviewNotes || ''
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
    ps: {
      enrolled: row.ps_enrolled || false,
      done: row.ps_done || false,
      track: row.ps_track || null,
      mod: row.ps_module || null,
      tracks: row.ps_tracks || {}
    },
    oip: row.oip || null,
    history: row.history || [],
    created_at: row.created_at,
    updated_at: row.updated_at,
    placementNeeded: row.placement_needed,
    placementAcknowledged: row.placement_acknowledged || false,
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
    stars: staff.stars || 0,
    promo: staff.promo || false,
    ps_enrolled: staff.ps?.enrolled || false,
    ps_done: staff.ps?.done || false,
    ps_track: staff.ps?.track || null,
    ps_mod: staff.ps?.mod || null,
    ps_tracks: staff.ps?.tracks || null,
    oip: staff.oip || null,
    history: staff.history || null
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
  return obj;
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
  return {
    id: row.id,
    sid: row.staff_id,
    fid: row.facility_id || row.fid,
    type: row.assessment_type || row.type,
    targetBelt: row.target_belt,
    status: row.status,
    date: row.requested_at ? new Date(row.requested_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '',
    requested_at: row.requested_at,
    resolved_at: row.resolved_at || null
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
    requested_at: item.requested_at || new Date().toISOString()
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
    protected:    row.protected
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

function mapScheduleFromBackend(row){
  return {
    id: row.id,
    fid: row.facility_id,
    date: row.date,
    shift: row.shift,
    assignedStaff: row.assigned_staff_ids || [],
    zoneAssignments: row.zone_assignments || {}
  };
}

function mapScheduleToBackend(sch){
  return {
    id: sch.id,
    facility_id: sch.fid,
    date: sch.date,
    shift: sch.shift,
    assigned_staff_ids: sch.assignedStaff || [],
    zone_assignments: sch.zoneAssignments || {}
  };
}

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
