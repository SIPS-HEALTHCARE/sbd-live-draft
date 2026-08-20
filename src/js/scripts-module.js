// ============================================================================
// T92 — Scripts as a standalone assignable module
//
// Client ask, 3 August call: "we want it to still be here, but we also want to
// have a separate module just for the scripts on the side... it's going to stay
// here, but also be here", because "if somebody passes belts but they need to
// refine their scripts, we want to be able to assign them just that module".
//
// So this is a SECOND SURFACE over content that does not move. The scripts live
// where they always have — as sections inside FULL_CURRICULUM_DATA.belts — and
// they keep rendering inside the belt content (Study & Practice -> Full
// Curriculum, and its Scripts tab). Nothing here copies a line of script text:
// scriptSectionsForBelt() selects those same sections at render time, and the
// Study & Practice Scripts tab calls this same function, so "which sections are
// the scripts" has one definition instead of two (Standards B6).
//
// STORAGE (T92a) — its own table, script_assignments (20260820120000): the
// fourth assignment table of the pattern, same shape as foundations_/
// instrument_/preceptor_assignments, hydrated into DB.scriptAssignments.
// The client's 2026-08-13 brief made storage explicit: assigned deliberately,
// one person at a time, and NOT bundled inside another track — which retires
// T92's original foundations_assignments module_id='scripts' piggyback (rows
// moved by the migration; getFoundationsAssignments() keeps filtering the id
// as a guard against pre-migration stale rows). RLS carries the same rule
// set: leaders write, assessors blocked from INSERT/UPDATE, DELETE is
// master_admin only, reads own-or-leader.
// See docs/decisions/2026-08-06-t92-scripts-standalone-module.md.
//
// Completion is leader-confirmed, not gated: scripts are spoken language with
// no question bank, so there is nothing to auto-score. The assignment's own
// status column carries it ('assigned' -> 'completed').
// ============================================================================
'use strict';

// SCRIPTS_MODULE_ID ('scripts') is declared in foundations.js, which loads
// first and whose getFoundationsAssignments() filter needs it. Consumed here.

// Titles that name script content in the belt curriculum. Covers every belt:
// White S5+S6, Yellow S4, Green S4, Blue S4-S8, Brown S4, Black S4.
const SCRIPTS_TITLE_RE = /script|approved language|forbidden language/i;

// The single definition of "which curriculum sections are the scripts".
// Reads the live curriculum — never a copy of it.
function scriptSectionsForBelt(belt) {
  const secs = (typeof FULL_CURRICULUM_DATA !== 'undefined' && FULL_CURRICULUM_DATA.belts
    && FULL_CURRICULUM_DATA.belts[belt]) || [];
  return secs.filter(sec => sec && SCRIPTS_TITLE_RE.test(sec.title || ''));
}

// Belts that actually carry script sections, in belt order.
//
// `upTo` caps the list at one belt — pass a staff member's own belt and they get
// White..theirs. Nowhere else on the platform does a staffer read curriculum
// above their own belt (Study & Practice is hard-locked to s.belt, no selector),
// and the client's ask was for people who "pass belts but need to refine their
// scripts", i.e. belts already earned. Called with no argument it returns every
// belt, which is what leader-side totals want.
function scriptsBeltsWithContent(upTo) {
  const order = (typeof BELT_ORDER !== 'undefined') ? BELT_ORDER
    : ['White', 'Yellow', 'Green', 'Blue', 'Brown', 'Black'];
  // An unrecognised belt caps at nothing rather than at everything — a scope
  // guard should fail closed.
  const cap = upTo ? order.indexOf(upTo) : order.length - 1;
  return order.slice(0, cap + 1).filter(b => scriptSectionsForBelt(b).length > 0);
}

// ── Assignment state ────────────────────────────────────────────────────────
function scriptsAssignment(staffId) {
  return (DB.scriptAssignments || [])
    .find(a => a.staffId === staffId && a.moduleId === SCRIPTS_MODULE_ID) || null;
}
function isScriptsAssigned(staffId) { return !!scriptsAssignment(staffId); }

// Leaders assign; assessors cannot (Foundations rule D1/D3, and RLS #55 would
// reject the write anyway, so the guard here is honest rather than decorative).
function scriptsCanAssign() {
  const u = ST.user;
  return !!(u && !['staff_admin', 'assessor', 'staff_member'].includes(u.role));
}

// Returns true if a row was created, false if one already existed — same
// contract as assignModule(), which the UNIQUE(staff_id,module_id) index backs.
// assignModule() itself is deliberately NOT reused: it also seeds a 3-gate
// foundations_progress row, and this module has no gates to track.
function assignScriptsModule(staffId, assignedBy, trigger) {
  if (!DB.scriptAssignments) DB.scriptAssignments = [];
  if (scriptsAssignment(staffId)) return false;
  const s = (typeof getStaff === 'function') ? getStaff(staffId) : null;
  const a = {
    id: 'sa-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    staffId, moduleId: SCRIPTS_MODULE_ID,
    assignedBy: assignedBy || null,
    type: 'remediation', trigger: trigger || null,
    facilityId: s ? s.fid : null,
    assignedDate: new Date().toISOString().slice(0, 10),
    status: 'assigned'
  };
  DB.scriptAssignments.push(a);
  _scriptsSaveAssignment(a);
  return true;
}

function _scriptsSaveAssignment(a) {
  try {
    if (typeof IS_LIVE !== 'undefined' && IS_LIVE && typeof SB !== 'undefined' && SB.createScriptAssignment) {
      SB.createScriptAssignment({
        staff_id: a.staffId, module_id: a.moduleId, assigned_by: a.assignedBy || null,
        type: a.type, trigger: a.trigger, assignment_type: a.type, trigger_event: a.trigger,
        facility_id: a.facilityId || null, assigned_date: a.assignedDate, status: a.status
      }).catch(e => {
        if (typeof handleSyncError === 'function') handleSyncError(e, 'Scripts assignment');
        else console.warn('[scripts] assignment sync', e && e.message);
      });
    }
  } catch (e) { console.warn('[scripts] assignment sync', e); }
}

function setScriptsStatus(staffId, status) {
  const a = scriptsAssignment(staffId);
  if (!a) return;
  a.status = status;
  try {
    if (typeof IS_LIVE !== 'undefined' && IS_LIVE && typeof SB !== 'undefined' && SB.updateScriptAssignmentStatus) {
      SB.updateScriptAssignmentStatus(staffId, SCRIPTS_MODULE_ID, status).catch(e => {
        if (typeof handleSyncError === 'function') handleSyncError(e, 'Scripts status');
        else console.warn('[scripts] status sync', e && e.message);
      });
    }
  } catch (e) { console.warn('[scripts] status sync', e); }
}

// ── Staff portal nav gate: the tab exists only for the person it is assigned to
function applyScriptsNavGate(staffId) {
  const n = document.getElementById('s-nav-scripts');
  if (n) n.style.display = isScriptsAssigned(staffId) ? 'flex' : 'none';
}

// ── Staff portal: the assigned module ───────────────────────────────────────
function renderSScripts() {
  const el = document.getElementById('s-scripts');
  if (!el) return;
  const s = getStaff(ST.staffId);
  if (!s) { el.innerHTML = '<div class="empty-state"><div class="empty-ttl">No Staff Record</div></div>'; return; }
  const a = scriptsAssignment(s.id);
  if (!a) {
    // Reachable if a saved sessionStorage view routes straight here after the
    // module was unassigned. Same re-check pattern as the assessor consoles.
    el.innerHTML = '<div class="empty-state"><div class="empty-ttl">Not Assigned</div>'
      + '<div class="empty-desc">The Scripts module is not currently assigned to you. Your scripts are always available inside Study &amp; Practice.</div></div>';
    return;
  }

  const belts = scriptsBeltsWithContent(s.belt);
  if (!belts.length) { el.innerHTML = '<div class="empty-state"><div class="empty-ttl">No script content found</div></div>'; return; }
  if (!window._scriptsBelt || belts.indexOf(window._scriptsBelt) === -1) {
    window._scriptsBelt = belts.indexOf(s.belt) !== -1 ? s.belt : belts[0];
  }
  const belt = window._scriptsBelt;
  const bColor = (typeof BELT_CLR !== 'undefined' && BELT_CLR[belt]) || 'var(--gold)';
  const done = a.status === 'completed';
  const sane = (v) => (typeof Security !== 'undefined' && Security.sanitize) ? Security.sanitize(v) : v;

  let html = '<div class="card mb16"><div class="card-hd"><div class="card-ttl">Scripts</div>'
    + '<span class="pill ' + (done ? 'p-ok' : 'p-gold') + '">' + (done ? 'Completed' : 'In Progress') + '</span></div>'
    + '<div class="card-body">'
    + '<p style="font-size:13px;color:var(--txt2);line-height:1.6;margin:0 0 10px">Your leader assigned the scripts on their own so you can work over just this part. '
    + 'Deliver every script from memory with the exact approved language, and know why each forbidden phrase fails. '
    + 'These are the same scripts that sit inside your belt curriculum — nothing here replaces that.</p>'
    + '<div style="font-size:11px;color:var(--txt3)">Assigned by ' + sane(a.assignedBy || '—')
    + (a.assignedDate ? ' &middot; ' + sane(a.assignedDate) : '')
    + (a.trigger ? ' &middot; ' + sane(a.trigger) : '') + '</div>'
    + '</div></div>';

  // Belt selector — someone sent back to refine scripts may need any belt they
  // have already earned, not only their current one. Never a belt above it.
  html += '<div style="display:flex;gap:6px;overflow-x:auto;margin-bottom:14px;padding-bottom:2px">'
    + belts.map(b => {
      const on = b === belt;
      const c = (typeof BELT_CLR !== 'undefined' && BELT_CLR[b]) || 'var(--gold)';
      const n = scriptSectionsForBelt(b).length;
      return '<div style="padding:8px 14px;border-radius:var(--rs);font-size:12.5px;font-weight:' + (on ? '700' : '500')
        + ';cursor:pointer;white-space:nowrap;flex-shrink:0;color:' + (on ? c : 'var(--txt2)')
        + ';background:' + (on ? c + '18' : 'transparent') + ';border:1px solid ' + (on ? c + '40' : 'var(--bdr)') + '"'
        + ' onclick="window._scriptsBelt=\'' + b + '\';renderSScripts()">' + b + ' <span style="opacity:.6">' + n + '</span></div>';
    }).join('') + '</div>';

  const styler = (typeof _styleCurriculumHTML === 'function') ? _styleCurriculumHTML : (h => h);
  html += scriptSectionsForBelt(belt).map(sec =>
    '<div class="card mb16"><div class="card-body">'
    + '<div style="font-size:11px;font-weight:700;color:' + bColor + ';letter-spacing:.06em;text-transform:uppercase;margin-bottom:10px">' + sec.title + '</div>'
    + '<div class="cs-body">' + styler(sec.html) + '</div>'
    + '</div></div>').join('');

  html += '<div style="background:rgba(196,154,32,.05);border:1px solid var(--gold-bd);border-radius:var(--rs);padding:11px 14px">'
    + '<div style="font-size:10.5px;font-weight:700;color:var(--gold);margin-bottom:5px">HOW THIS MODULE CLOSES</div>'
    + '<div style="font-size:12px;color:var(--txt2);line-height:1.6">Practice each script out loud until the words are automatic, then deliver them to your leader. '
    + 'Your leader marks this module complete once your delivery meets the approved language.</div></div>';

  el.innerHTML = html;
}

// ── Leader: the assign screen (one column inside the existing Training table)
function scriptsCellHTML(staffId) {
  const a = scriptsAssignment(staffId);
  const canAssign = scriptsCanAssign();
  const isMaster = !!(ST.user && ST.user.role === 'master_admin');
  if (!a) {
    return canAssign
      ? '<button class="btn btn-ghost btn-xs" onclick="hAssignScriptsModal(\'' + staffId + '\')">Assign</button>'
      : '<span class="tc-muted">None</span>';
  }
  let h = '<span class="' + (a.status === 'completed' ? 'tc-ok' : 'tc-warn') + '" style="font-size:11.5px">'
    + (a.status === 'completed' ? 'Completed' : 'Assigned') + '</span>';
  if (canAssign) {
    h += ' <button class="btn btn-ghost btn-xs" onclick="hToggleScriptsDone(\'' + staffId + '\')">'
      + (a.status === 'completed' ? 'Reopen' : 'Mark done') + '</button>';
  }
  // Unassign is master_admin only, matching hUnassignFnd and the DELETE policy.
  if (isMaster) {
    h += ' <button class="btn btn-ghost btn-xs" style="border-color:rgba(239,68,68,.4);color:#f87171" onclick="hUnassignScripts(\'' + staffId + '\')">Unassign</button>';
  }
  return h;
}

function hAssignScriptsModal(staffId) {
  if (!scriptsCanAssign()) { toast('Assessors cannot assign modules', 'err'); return; }
  const s = getStaff(staffId); if (!s) return;
  if (isScriptsAssigned(staffId)) { toast('Scripts already assigned', 'info'); return; }
  const belts = scriptsBeltsWithContent(s.belt);
  const total = belts.reduce((n, b) => n + scriptSectionsForBelt(b).length, 0);
  let html = '<div style="margin-bottom:12px;font-size:13px;color:var(--txt2)">Assign the <strong style="color:var(--txt)">Scripts</strong> module to <strong style="color:var(--txt)">' + fullName(s) + '</strong>.</div>';
  html += '<div style="font-size:12px;color:var(--txt3);line-height:1.6;margin-bottom:14px">A Scripts tab appears for this person only, carrying the ' + total
    + ' script sections from White through ' + s.belt + ' Belt — the belts they have reached. '
    + 'The scripts stay in place inside the belt curriculum — this does not move them.</div>';
  html += '<div style="margin-bottom:12px"><label style="display:block;font-size:12px;color:var(--txt2);margin-bottom:4px">Reason <span style="color:var(--txt3)">(what prompted this, optional)</span></label>';
  html += '<input id="scripts-assign-trigger" type="text" class="form-input" placeholder="e.g. OR phone script drift, observed 2026-08-05"></div>';
  html += '<div style="display:flex;gap:8px;justify-content:flex-end">';
  html += '<button class="btn btn-ghost btn-sm" onclick="closeModal()">Cancel</button>';
  html += '<button class="btn btn-gold btn-sm" onclick="hDoAssignScripts(\'' + s.id + '\')">Assign</button></div>';
  openModal('Assign Scripts', html, 'modal-sm');
}

function hDoAssignScripts(staffId) {
  if (!scriptsCanAssign()) { toast('Assessors cannot assign modules', 'err'); return; }
  const el = document.getElementById('scripts-assign-trigger');
  const trigger = (el && el.value.trim()) ? el.value.trim() : null;
  const ok = assignScriptsModule(staffId, ST.user ? ST.user.name : 'Manager', trigger);
  closeModal();
  toast(ok ? 'Scripts module assigned' : 'Scripts already assigned — skipped', ok ? 'ok' : 'info');
  if (typeof renderHTraining === 'function') renderHTraining();
}

function hToggleScriptsDone(staffId) {
  if (!scriptsCanAssign()) { toast('Assessors cannot change module status', 'err'); return; }
  const a = scriptsAssignment(staffId); if (!a) return;
  const next = a.status === 'completed' ? 'assigned' : 'completed';
  setScriptsStatus(staffId, next);
  toast(next === 'completed' ? 'Scripts module marked complete' : 'Scripts module reopened', 'ok');
  if (typeof renderHTraining === 'function') renderHTraining();
}

function hUnassignScripts(staffId) {
  if (!(ST.user && ST.user.role === 'master_admin')) { toast('Only the Master Admin can unassign modules', 'err'); return; }
  if (!confirm('Unassign the Scripts module? The staff member loses the tab; their scripts stay available inside Study & Practice.')) return;
  DB.scriptAssignments = (DB.scriptAssignments || [])
    .filter(a => !(a.staffId === staffId && a.moduleId === SCRIPTS_MODULE_ID));
  try {
    if (typeof IS_LIVE !== 'undefined' && IS_LIVE && typeof SB !== 'undefined' && SB.deleteScriptAssignment) {
      SB.deleteScriptAssignment(staffId, SCRIPTS_MODULE_ID).catch(e => {
        if (typeof handleSyncError === 'function') handleSyncError(e, 'Scripts unassign');
      });
    }
  } catch (e) { console.warn('[scripts] unassign sync', e); }
  toast('Scripts module unassigned', 'info');
  if (typeof renderHTraining === 'function') renderHTraining();
}
