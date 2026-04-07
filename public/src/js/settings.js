// ============================================================
// ACCOUNT & SETTINGS VIEW
// ============================================================

function _settingsPfx() {
  if (typeof getPortalPrefix === 'function') return getPortalPrefix();
  const m = { hospital:'h', admin:'a', master_admin:'a', staff_admin:'a', staff_member:'s', system_admin:'x', facility_admin:'h' };
  return m[ST.portal] || m[ST.user?.role] || 'h';
}

function _getSessionTimeRemaining(expiresAt) {
  const remaining = expiresAt - (Date.now() / 1000);
  if (remaining <= 0) return { label: 'Expired', urgent: true };
  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  return { label: h > 0 ? `${h}h ${m}m remaining` : `${m}m remaining`, urgent: remaining < 1800 };
}

function renderSettingsView() {
  const u = ST.user;
  if (!u) return;
  const prefix      = _settingsPfx();
  const el          = document.getElementById(prefix + '-settings');
  if (!el) return;
  const canEditTitle = (u.role !== 'staff_member');
  const sess         = (typeof SB_SESSION !== 'undefined' && SB_SESSION && SB_SESSION.expires_at)
    ? _getSessionTimeRemaining(SB_SESSION.expires_at) : { label: 'Unknown', urgent: false };

  el.innerHTML = `
  <div class="page-hd">
    <div class="page-title">Account &amp; Settings</div>
    <div class="page-sub">Manage your profile and account security</div>
  </div>
  <div style="max-width:620px;display:flex;flex-direction:column;gap:18px;padding-bottom:40px">

    <!-- PROFILE CARD -->
    <div class="card" style="padding:24px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
        <svg viewBox="0 0 18 18" fill="none" width="15" height="15" style="color:var(--gold)"><circle cx="9" cy="6" r="3.5" stroke="currentColor" stroke-width="1.4"/><path d="M3 16c0-3 2.7-5.5 6-5.5s6 2.5 6 5.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        <div style="font-size:14px;font-weight:700">Profile Information</div>
      </div>
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:22px;padding:14px;background:var(--bg);border:1px solid var(--bdr);border-radius:var(--r)">
        <div id="settings-avatar" style="width:52px;height:52px;border-radius:50%;background:var(--gold-bg);border:2px solid var(--gold-bd);display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:800;color:var(--gold);flex-shrink:0">${Security.sanitize(u.initials||'--')}</div>
        <div>
          <div style="font-size:13px;font-weight:600">${Security.sanitize(u.name||'--')}</div>
          <div style="font-size:11px;color:var(--txt3);margin-top:2px">${Security.sanitize(u.email||'')}</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div class="form-group">
          <label class="form-label">Display Name</label>
          <input class="form-input" id="settings-name" value="${Security.sanitize(u.name||'')}" oninput="onSettingsNameInput(this.value)" placeholder="Your full name">
        </div>
        ${canEditTitle ? `<div class="form-group"><label class="form-label">Title / Role Label</label><input class="form-input" id="settings-title" value="${Security.sanitize(u.title||'')}" placeholder="e.g. Department Manager"></div>` : ''}
        <div class="g2" style="gap:10px">
          <div class="form-group">
            <label class="form-label" style="color:var(--txt3)">Initials <span style="font-weight:400;opacity:.7">(auto)</span></label>
            <input class="form-input" id="settings-initials" value="${Security.sanitize(u.initials||'')}" readonly style="opacity:.55;cursor:default">
          </div>
          <div class="form-group">
            <label class="form-label" style="color:var(--txt3)">Email <span style="font-weight:400;opacity:.7">(read-only)</span></label>
            <input class="form-input" value="${Security.sanitize(u.email||'')}" readonly style="opacity:.55;cursor:default">
          </div>
        </div>
        <div id="settings-profile-result" style="display:none;font-size:12px;padding:8px 12px;border-radius:var(--rs)"></div>
        <div><button class="btn btn-gold" onclick="saveProfileInfo()" style="padding:9px 22px">Save Profile</button></div>
      </div>
    </div>

    <!-- CHANGE PASSWORD CARD -->
    <div class="card" style="padding:24px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
        <svg viewBox="0 0 18 18" fill="none" width="15" height="15" style="color:var(--gold)"><rect x="3" y="8" width="12" height="9" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M6 8V6a3 3 0 016 0v2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        <div style="font-size:14px;font-weight:700">Change Password</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div class="form-group" style="position:relative">
          <label class="form-label">New Password</label>
          <input class="form-input" id="settings-pass" type="password" placeholder="Enter new password" style="padding-right:36px" oninput="updateSettingsStrengthBar(this.value)">
          <span class="pw-toggle" onclick="togglePasswordVisibility('settings-pass',this)" style="position:absolute;right:12px;bottom:8px;cursor:pointer;color:var(--txt3);display:flex;align-items:center;justify-content:center;height:24px;width:24px;border-radius:4px;transition:.15s">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </span>
        </div>
        <div style="margin-top:-4px">
          <div style="height:3px;background:var(--bdr);border-radius:2px;overflow:hidden"><div id="settings-strength-bar" style="height:100%;width:0%;border-radius:2px;transition:width .3s,background .3s"></div></div>
          <div id="settings-strength-label" style="font-size:10px;color:var(--txt3);margin-top:3px;min-height:14px"></div>
        </div>
        <div class="form-group" style="position:relative">
          <label class="form-label">Confirm New Password</label>
          <input class="form-input" id="settings-pass2" type="password" placeholder="Confirm new password" style="padding-right:36px">
          <span class="pw-toggle" onclick="togglePasswordVisibility('settings-pass2',this)" style="position:absolute;right:12px;bottom:8px;cursor:pointer;color:var(--txt3);display:flex;align-items:center;justify-content:center;height:24px;width:24px;border-radius:4px;transition:.15s">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </span>
        </div>
        <div style="font-size:11px;color:var(--txt3);line-height:1.6">Requires: 8+ characters &bull; Uppercase letter &bull; Number</div>
        <div id="settings-pw-result" style="display:none;font-size:12px;padding:8px 12px;border-radius:var(--rs)"></div>
        <div><button class="btn btn-gold" id="settings-pw-btn" onclick="changePasswordFromSettings()" style="padding:9px 22px">Update Password</button></div>
      </div>
    </div>

    <!-- SESSION CARD -->
    <div class="card" style="padding:24px">
      <div style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;user-select:none" onclick="toggleSessionInfo()">
        <div style="display:flex;align-items:center;gap:10px">
          <svg viewBox="0 0 18 18" fill="none" width="15" height="15" style="color:var(--txt2)"><circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="1.4"/><path d="M9 5v4l3 2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
          <div style="font-size:14px;font-weight:700">Session Information</div>
        </div>
        <svg id="session-chevron" viewBox="0 0 14 14" fill="none" width="14" height="14" style="color:var(--txt3);transition:transform .2s"><path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
      </div>
      <div id="session-info-body" style="display:none;margin-top:18px;border-top:1px solid var(--bdr);padding-top:16px">
        <div style="display:flex;flex-direction:column;gap:10px">
          <div style="display:flex;justify-content:space-between;font-size:12.5px"><span style="color:var(--txt3)">Account Role</span><span style="font-weight:600">${Security.sanitize(u.role||'--')}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:12.5px"><span style="color:var(--txt3)">Auth ID</span><span style="font-family:monospace;font-size:10.5px;color:var(--txt2)">${Security.sanitize((u.authUid||'').slice(0,18))}…</span></div>
          <div style="display:flex;justify-content:space-between;font-size:12.5px"><span style="color:var(--txt3)">Session Expires</span><span style="font-weight:600;color:${sess.urgent?'var(--err)':'var(--txt)'}">${sess.label}</span></div>
          <div style="margin-top:8px">
            <button class="btn btn-ghost btn-sm" onclick="signOutAllDevices()" style="font-size:12px;border-color:var(--err-bd);color:var(--err)">
              <svg viewBox="0 0 18 18" fill="none" width="13" height="13"><path d="M12 14H15a1 1 0 001-1V5a1 1 0 00-1-1H12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M9 12l3-3-3-3M12 9H5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Sign Out of All Devices
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>`;
}

function onSettingsNameInput(val) {
  const words = val.trim().split(/\s+/).filter(Boolean);
  let initials = '';
  if (words.length >= 2) initials = (words[0][0] + words[words.length - 1][0]).toUpperCase();
  else if (words.length === 1) initials = words[0].slice(0, 2).toUpperCase();
  const initialsEl = document.getElementById('settings-initials');
  if (initialsEl) initialsEl.value = initials;
  const avatarEl = document.getElementById('settings-avatar');
  if (avatarEl) avatarEl.textContent = initials || '--';
}

async function saveProfileInfo() {
  const u         = ST.user;
  if (!u) return;
  const nameEl    = document.getElementById('settings-name');
  const initialsEl= document.getElementById('settings-initials');
  const titleEl   = document.getElementById('settings-title');
  const resultEl  = document.getElementById('settings-profile-result');
  const name      = (nameEl?.value || '').trim();
  const initials  = (initialsEl?.value || '').trim().toUpperCase();
  const title     = titleEl ? (titleEl.value || '').trim() : null;

  if (!name) { _showSettingsMsg(resultEl, 'Display name cannot be empty.', 'err'); return; }

  try {
    const updates = { name, initials };
    if (title !== null) updates.title = title;
    await SB.updateUserProfile(u.authUid, updates);
    ST.user.name = name; ST.user.initials = initials;
    if (title !== null) ST.user.title = title;
    _updateSidebarAvatar();
    _showSettingsMsg(resultEl, '✓ Profile saved successfully.', 'ok');
    setTimeout(() => { if (resultEl) resultEl.style.display = 'none'; }, 3000);
  } catch (e) {
    _showSettingsMsg(resultEl, 'Failed to save: ' + e.message, 'err');
  }
}

function _updateSidebarAvatar() {
  const u = ST.user; if (!u) return;
  const prefix = _settingsPfx();
  const nameEl = document.getElementById(prefix + '-uav-name');
  const initEl = document.getElementById(prefix + '-uav-initials');
  const roleEl = document.getElementById(prefix + '-uav-role');
  if (nameEl) nameEl.textContent = u.name;
  if (initEl) initEl.textContent = u.initials;
  if (roleEl && u.title) roleEl.textContent = u.title;
}

async function changePasswordFromSettings() {
  const passEl   = document.getElementById('settings-pass');
  const pass2El  = document.getElementById('settings-pass2');
  const resultEl = document.getElementById('settings-pw-result');
  const btn      = document.getElementById('settings-pw-btn');
  const pass     = passEl?.value  || '';
  const pass2    = pass2El?.value || '';
  if (resultEl) resultEl.style.display = 'none';

  if (pass.length < 8) { _showSettingsMsg(resultEl,'Password must be at least 8 characters.','err'); return; }
  if (!/[A-Z]/.test(pass)) { _showSettingsMsg(resultEl,'Must include at least one uppercase letter.','err'); return; }
  if (!/[0-9]/.test(pass)) { _showSettingsMsg(resultEl,'Must include at least one number.','err'); return; }
  if (pass !== pass2) { _showSettingsMsg(resultEl,'Passwords do not match.','err'); return; }

  const token = (typeof SB_SESSION !== 'undefined' && SB_SESSION && SB_SESSION.access_token) ? SB_SESSION.access_token : null;
  if (!token) { _showSettingsMsg(resultEl,'Session expired. Please sign in again.','err'); return; }

  if (btn) { btn.disabled = true; btn.textContent = 'Updating…'; }
  try {
    await SB_AUTH.updatePassword(token, pass);
    if (passEl) passEl.value = ''; if (pass2El) pass2El.value = '';
    if (typeof updateSettingsStrengthBar === 'function') updateSettingsStrengthBar('');
    _showSettingsMsg(resultEl,'✓ Password updated successfully.','ok');
    setTimeout(() => { if (resultEl) resultEl.style.display = 'none'; }, 4000);
  } catch (e) {
    _showSettingsMsg(resultEl, e.message || 'Failed to update password.', 'err');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Update Password'; }
  }
}

function _showSettingsMsg(el, msg, type) {
  if (!el) return;
  el.textContent = msg;
  if (type === 'ok') {
    el.style.background = 'rgba(34,197,94,.1)'; el.style.color = '#22c55e'; el.style.border = '1px solid rgba(34,197,94,.25)';
  } else {
    el.style.background = 'var(--err-bg)'; el.style.color = 'var(--err)'; el.style.border = '1px solid var(--err-bd)';
  }
  el.style.display = 'block';
}

function toggleSessionInfo() {
  const body    = document.getElementById('session-info-body');
  const chevron = document.getElementById('session-chevron');
  if (!body) return;
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : 'block';
  if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
}

async function signOutAllDevices() {
  const token = (typeof SB_SESSION !== 'undefined' && SB_SESSION) ? SB_SESSION.access_token : null;
  if (token) {
    try {
      await fetch(`${SB_API_URL}/auth/v1/logout?scope=global`, {
        method: 'POST',
        headers: { 'apikey': SB_ANON_KEY, 'Authorization': `Bearer ${token}` }
      });
    } catch (_) {}
  }
  if (typeof logout === 'function') logout();
}
