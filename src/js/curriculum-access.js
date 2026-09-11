/* ============================================================================
 * #1149 — Curriculum access grant (Shawn board 11 Sep, ledger T133)
 *
 * Which curricula a staff member may be assigned. One row per (staff,
 * curriculum) in `curriculum_access`; no row = not granted; revoking deletes the
 * row. Granted from the staff profile by anyone who can already write an
 * assignment for that person.
 *
 * THE GATE IS THE RLS POLICY, NOT THIS FILE. `sbd_has_curriculum_access()` is
 * ANDed into the INSERT policy of foundations_assignments, instrument_assignments
 * and script_assignments (migration 20260911130000). Everything here exists so a
 * leader sees why a button is missing instead of watching an insert fail
 * (Standards B3: client-side scoping is a message, never a boundary).
 *
 * Preceptor is NOT here. It keeps preceptor_access, prcAccessControlHTML and its
 * apply/approve queue, per Iggie's decision 9.
 *
 * Own file per Standards B7 — no new domain in ui-views.js, which calls exactly
 * one function from here (caAccessControlHTML, in renderHProfile).
 * ==========================================================================*/

// The four gated curricula, in display order. MUST match the CHECK constraint on
// curriculum_access.curriculum and the list inside sbd_has_curriculum_access().
const CA_CURRICULA = ['foundations', 'instruments', 'scripts', 'endoscopy'];
const CA_LABELS = { foundations: 'Foundations', instruments: 'Instruments', scripts: 'SBD Language', endoscopy: 'Endoscopy' };

// ── Reading the registry (#1148) ─────────────────────────────────────────────
// The control lists the curricula the registry actually knows about, so it has no
// module list of its own to drift. An unhydrated/empty registry falls back to all
// four — same fallback registryModules() takes.
function caCurricula() {
  const seen = {};
  (DB.curriculumModules || []).forEach(r => { seen[r.curriculum] = (seen[r.curriculum] || 0) + 1; });
  const known = CA_CURRICULA.filter(c => seen[c]);
  return (known.length ? known : CA_CURRICULA.slice()).map(c => ({ key: c, label: CA_LABELS[c], modules: seen[c] || 0 }));
}

// Module id -> curriculum, through the registry. null = the registry does not
// list it, which the server treats as fail-open.
function caCurriculumOf(moduleId) {
  const r = (DB.curriculumModules || []).find(x => x.module_id === moduleId);
  return (r && CA_CURRICULA.indexOf(r.curriculum) >= 0) ? r.curriculum : null;
}

// ── Reading the grants ───────────────────────────────────────────────────────
// DB.curriculumAccess is null (not just empty) when the fetch failed or has not
// run — auth-init.js keeps that distinction on purpose. null means "we do not
// know", and not knowing must never hide a leader's Assign button; [] means "we
// know, and nobody is granted".
function caLoaded() { return Array.isArray(DB.curriculumAccess); }
function caGrant(staffId, curriculum) {
  if (!caLoaded()) return null;
  return DB.curriculumAccess.find(r => r.staffId === staffId && r.curriculum === curriculum) || null;
}
function caHasAccess(staffId, curriculum) { return !!caGrant(staffId, curriculum); }

// The client mirror of sbd_has_curriculum_access(): open when we do not know, open
// for a curriculum the registry does not gate, otherwise the grant decides.
function caCanBeAssigned(staffId, curriculum) {
  if (!caLoaded()) return true;
  if (CA_CURRICULA.indexOf(curriculum) < 0) return true;
  return caHasAccess(staffId, curriculum);
}
// Same question asked with a module id, for the assign functions.
function caCanAssignModule(staffId, moduleId) {
  const c = caCurriculumOf(moduleId);
  return c ? caCanBeAssigned(staffId, c) : true;
}
// The one refusal sentence, so the modal, the submit handler and the bulk paths
// cannot drift into three different wordings.
function caDenyToast(staffId, curriculum) {
  const s = (typeof getStaff === 'function') ? getStaff(staffId) : null;
  const who = (s && typeof fullName === 'function') ? fullName(s) : 'this person';
  toast(CA_LABELS[curriculum] + ' has not been granted to ' + who + ' — grant it on their profile first', 'err');
}

// ── Who may grant ────────────────────────────────────────────────────────────
// Client mirror of sbd_fi_can_manage_assignments(): the people who can already
// write an assignment for this person. Same predicate as endoCanAssign(); the
// server is what enforces it.
function caCanGrant() {
  const u = (typeof ST !== 'undefined') ? ST.user : null;
  return !!(u && ['staff_admin', 'assessor', 'staff_member'].indexOf(u.role) < 0);
}

// ── The profile control ──────────────────────────────────────────────────────
// Rendered by renderHProfile. Shows the state to anyone who can open the profile;
// the Grant/Revoke buttons appear only for a leader who could assign anyway.
function caAccessControlHTML(staffId, context) {
  const canGrant = caCanGrant();
  const ctx = context || 'admin';
  const rows = caCurricula().map(c => {
    const g = caGrant(staffId, c.key);
    const on = !!g;
    const when = g && g.grantedAt ? String(g.grantedAt).slice(0, 10) : '';
    const by = g && g.grantedBy ? g.grantedBy : '';
    const tip = on
      ? ('Granted' + (by ? ' by ' + by : '') + (when ? ' on ' + when : ''))
      : ('Not granted — ' + c.label + ' cannot be assigned to this person');
    const btn = canGrant
      ? '<button class="btn btn-ghost btn-xs" style="' + (on ? 'border-color:rgba(239,68,68,.4);color:#f87171' : 'border-color:var(--gold-bd);color:var(--gold)')
        + '" onclick="caSetAccess(\'' + staffId + '\',\'' + c.key + '\',' + (on ? 'false' : 'true') + ',\'' + ctx + '\')">'
        + (on ? 'Revoke' : 'Grant') + '</button>'
      : '';
    return '<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-top:1px solid var(--bdr)" title="' + Security.sanitize(tip) + '">'
      + '<span style="flex:1;font-size:11.5px;color:var(--txt2)">' + c.label
      + '<span style="color:var(--txt3)"> &middot; ' + c.modules + ' module' + (c.modules === 1 ? '' : 's') + '</span></span>'
      + '<span style="font-size:11px;font-weight:600;color:' + (on ? '#4ade80' : 'var(--txt3)') + '">' + (on ? 'Granted' : 'Not granted') + '</span>'
      + (on && (by || when) ? '<span style="font-size:10.5px;color:var(--txt3);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + Security.sanitize((by || '') + (when ? ' &middot; ' + when : '')) + '</span>' : '')
      + btn + '</div>';
  }).join('');
  return '<div style="border:1px solid var(--bdr);border-radius:8px;padding:7px 11px;min-width:340px" title="Which curricula this person may be assigned (#1149). Preceptor access is granted separately.">'
    + '<div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--txt3)">'
    + '<svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--gold)"><path d="M4 3h9l3 3v11H4z"/><path d="M7 8h6M7 11h6"/></svg>'
    + 'Curriculum access' + (caLoaded() ? '' : ' <span style="color:var(--warn)">&middot; not loaded</span>') + '</div>'
    + rows + '</div>';
}

// ── Granting and revoking ────────────────────────────────────────────────────
function _caSave(staffId, curriculum, row) {
  try {
    if (typeof IS_LIVE === 'undefined' || !IS_LIVE || typeof SB === 'undefined') return;
    const p = row ? (SB.upsertCurriculumAccess && SB.upsertCurriculumAccess(row))
                  : (SB.deleteCurriculumAccess && SB.deleteCurriculumAccess(staffId, curriculum));
    if (p && p.catch) p.catch(e => {
      if (typeof handleSyncError === 'function') handleSyncError(e, 'Curriculum access');
      else console.warn('[ca] access sync', e && e.message);
    });
  } catch (e) { console.warn('[ca] access sync', e); }
}

// on = true grants, false revokes (deletes the row). The server refuses anyone
// who could not write an assignment for this person anyway.
function caSetAccess(staffId, curriculum, on, context) {
  if (!caCanGrant()) { toast('Granting curriculum access is limited to leaders and admins', 'err'); return; }
  if (CA_CURRICULA.indexOf(curriculum) < 0) return;
  const label = CA_LABELS[curriculum];
  if (!on && !confirm('Revoke ' + label + ' access? Modules already assigned stay assigned and keep their progress — this only stops new assignments.')) return;
  if (!Array.isArray(DB.curriculumAccess)) DB.curriculumAccess = [];
  const now = new Date().toISOString();
  const by = (typeof ST !== 'undefined' && ST.user && ST.user.name) || null;
  if (on) {
    let row = DB.curriculumAccess.find(r => r.staffId === staffId && r.curriculum === curriculum);
    if (!row) { row = { staffId: staffId, curriculum: curriculum }; DB.curriculumAccess.push(row); }
    row.grantedBy = by; row.grantedAt = now;
    _caSave(staffId, curriculum, { staff_id: staffId, curriculum: curriculum, granted_by: by, granted_at: now });
  } else {
    DB.curriculumAccess = DB.curriculumAccess.filter(r => !(r.staffId === staffId && r.curriculum === curriculum));
    _caSave(staffId, curriculum, null);
  }
  toast(label + (on ? ' access granted' : ' access revoked — existing assignments untouched'), on ? 'ok' : 'info');
  if (context === 'rolemgmt' && typeof renderARoleMgmt === 'function') renderARoleMgmt();
  else if (typeof renderHProfile === 'function') renderHProfile(staffId, context === 'h' ? 'h' : 'admin');
}

// ── The leader panels ────────────────────────────────────────────────────────
// Wraps a panel's Assign button: the button when the curriculum is granted, a
// muted reason when it is not. All four panels (Foundations, Instruments,
// Scripts, Endoscopy) route their Assign button through this.
function caAssignControlHTML(staffId, curriculum, btnHTML) {
  if (caCanBeAssigned(staffId, curriculum)) return btnHTML;
  return '<span class="tc-muted" style="font-size:11px" title="'
    + CA_LABELS[curriculum] + ' has not been granted to this person. A leader grants it on their profile."'
    + '>No access</span>';
}
