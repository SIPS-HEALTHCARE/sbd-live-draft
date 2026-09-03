// ============================================================ T33 ADMIN MFA (TOTP)
// Enforces multi-factor sign-in for admin-tier accounts. doLogin() calls
// MFA.ensureAal2() after the profile fetch and BEFORE any data hydration — the
// sbd_mfa_gate restrictive RLS policies return nothing to an aal1 admin session,
// so the challenge must complete first.
//
// Raw GoTrue REST (this app has no supabase-js): /auth/v1/factors endpoints.
// The ADMIN_ROLES list exists in four places that must agree: here, the migration
// 20260812130000 (sbd_mfa_satisfied), and the MFA_ADMIN_ROLES block inlined in
// each role-gated edge function. scripts/verify-t33-security-tail.js asserts it.

const MFA = {
  ADMIN_ROLES: ['master_admin','staff_admin','admin','master','sips_admin','system_admin'],

  roleRequiresMfa(role){ return this.ADMIN_ROLES.includes(String(role||'')); },

  aalOf(token){
    try {
      const p = JSON.parse(atob(String(token||'').split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
      return p.aal || 'aal1';
    } catch(_){ return 'aal1'; }
  },

  async _authFetch(path, opts={}){
    const res = await fetch(`${SB_API_URL}/auth/v1${path}`, {
      method: opts.method || 'GET',
      headers: {
        'apikey': SB_ANON_KEY,
        'Authorization': `Bearer ${SB_SESSION && SB_SESSION.access_token}`,
        'Content-Type': 'application/json'
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if(!res.ok) throw new Error((data && (data.msg || data.message || data.error_description || data.error)) || 'HTTP '+res.status);
    return data;
  },

  // Factor verification returns a full aal2 token response; adopt it exactly the
  // way SB_AUTH.signIn does so refresh/restore keep working unchanged.
  _adoptSession(data){
    SB_SESSION = data;
    localStorage.setItem('sbd_session', JSON.stringify({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      user: data.user
    }));
  },

  async _listTotpFactors(){
    const u = await this._authFetch('/user');
    return ((u && u.factors) || []).filter(f => (f.factor_type || f.type) === 'totp');
  },

  // Resolves true once the session is aal2; false if the user cancels.
  async ensureAal2(){
    if(!SB_SESSION || !SB_SESSION.access_token) return false;
    if(this.aalOf(SB_SESSION.access_token) === 'aal2') return true;

    let factors;
    try { factors = await this._listTotpFactors(); }
    catch(e){ console.warn('MFA: factor list failed:', e.message); factors = []; }

    const verified = factors.find(f => f.status === 'verified');
    if(verified) return this._runModal({ mode:'challenge', factorId: verified.id });

    // Abandoned enrollments block re-enrolling under the same name — clear them.
    for(const f of factors.filter(f => f.status !== 'verified')){
      try { await this._authFetch('/factors/'+f.id, { method:'DELETE' }); } catch(_){}
    }
    let enrolled;
    try {
      enrolled = await this._authFetch('/factors', {
        method:'POST',
        body:{ factor_type:'totp', friendly_name:'SBD Admin TOTP' }
      });
    } catch(e){
      toast('Could not start MFA enrollment: '+e.message, 'warn');
      return false;
    }
    return this._runModal({ mode:'enroll', factorId: enrolled.id, totp: enrolled.totp || {} });
  },

  // One modal for both flows. Returns a promise: true = verified (session
  // adopted at aal2), false = cancelled.
  _runModal({ mode, factorId, totp }){
    return new Promise((resolve) => {
      const old = document.getElementById('mfa-overlay');
      if(old) old.remove();

      const ovl = document.createElement('div');
      ovl.id = 'mfa-overlay';
      ovl.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(10,12,16,.85);display:flex;align-items:center;justify-content:center;padding:16px';

      const enrollBlock = mode !== 'enroll' ? '' : `
        <p style="margin:0 0 12px;color:#aab;font-size:.85rem;line-height:1.5">
          Administrator accounts require two-factor authentication. Scan this QR code
          with an authenticator app (Google Authenticator, Authy, 1Password…), then
          enter the 6-digit code it shows.</p>
        <div id="mfa-qr" style="background:#fff;border-radius:8px;padding:10px;display:flex;justify-content:center;margin:0 0 10px"></div>
        <div style="margin:0 0 12px;font-size:.75rem;color:#889">Can't scan? Enter this key manually:<br>
          <code style="user-select:all;word-break:break-all;color:#c49a20">${(totp && totp.secret) || ''}</code></div>`;

      const challengeBlock = mode !== 'challenge' ? '' : `
        <p style="margin:0 0 12px;color:#aab;font-size:.85rem;line-height:1.5">
          Enter the 6-digit code from your authenticator app to finish signing in.</p>`;

      ovl.innerHTML = `
        <div style="background:#161a22;border:1px solid #2a3040;border-radius:12px;max-width:380px;width:100%;padding:22px">
          <h3 style="margin:0 0 10px;color:#e8eaef;font-size:1.05rem">
            ${mode === 'enroll' ? 'Set up two-factor authentication' : 'Two-factor verification'}</h3>
          ${enrollBlock}${challengeBlock}
          <input id="mfa-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="123456"
            style="width:100%;box-sizing:border-box;background:#0e1118;border:1px solid #2a3040;border-radius:8px;color:#e8eaef;font-size:1.3rem;letter-spacing:.35em;text-align:center;padding:10px;margin:0 0 8px">
          <div id="mfa-err" style="display:none;color:#e0685e;font-size:.8rem;margin:0 0 8px"></div>
          <button id="mfa-verify" style="width:100%;background:#c49a20;border:0;border-radius:8px;color:#14161c;font-weight:600;padding:11px;cursor:pointer">Verify</button>
          <button id="mfa-cancel" style="width:100%;background:none;border:0;color:#889;padding:10px 0 0;cursor:pointer;font-size:.8rem">Cancel and sign out</button>
        </div>`;
      document.body.appendChild(ovl);

      // GoTrue returns totp.qr_code as either a data: URL or a raw SVG string.
      if(mode === 'enroll'){
        const qrEl = ovl.querySelector('#mfa-qr');
        const qr = (totp && totp.qr_code) || '';
        if(qr.startsWith('data:')){
          const img = document.createElement('img');
          img.src = qr; img.alt = 'TOTP QR code'; img.style.cssText = 'width:180px;height:180px';
          qrEl.appendChild(img);
        } else {
          qrEl.innerHTML = qr;
          const svg = qrEl.querySelector('svg');
          if(svg){ svg.style.width = '180px'; svg.style.height = '180px'; }
        }
      }

      const codeEl = ovl.querySelector('#mfa-code');
      const errEl = ovl.querySelector('#mfa-err');
      const btnEl = ovl.querySelector('#mfa-verify');
      const done = (val) => { ovl.remove(); resolve(val); };

      const verify = async () => {
        const code = (codeEl.value || '').trim();
        if(!/^\d{6}$/.test(code)){ errEl.textContent = 'Enter the 6-digit code.'; errEl.style.display = 'block'; return; }
        btnEl.disabled = true; btnEl.textContent = 'Verifying…';
        try {
          const ch = await this._authFetch(`/factors/${factorId}/challenge`, { method:'POST' });
          const session = await this._authFetch(`/factors/${factorId}/verify`, {
            method:'POST', body:{ challenge_id: ch.id, code }
          });
          this._adoptSession(session);
          done(true);
        } catch(e){
          errEl.textContent = 'That code did not verify. Check your authenticator and try again.';
          errEl.style.display = 'block';
          console.warn('MFA verify failed:', e.message);
          btnEl.disabled = false; btnEl.textContent = 'Verify';
          codeEl.value = ''; codeEl.focus();
        }
      };

      btnEl.onclick = verify;
      codeEl.onkeydown = (e) => { if(e.key === 'Enter') verify(); };
      ovl.querySelector('#mfa-cancel').onclick = () => done(false);
      setTimeout(() => codeEl.focus(), 50);
    });
  }
};
window.MFA = MFA;
