// ============================================================ T33 ADMIN MFA (TOTP + #1144 EMAIL CODE)
// Enforces multi-factor sign-in for admin-tier accounts. doLogin() calls
// MFA.ensureAal2() after the profile fetch and BEFORE any data hydration — the
// sbd_mfa_gate restrictive RLS policies return nothing to an unverified admin
// session, so the challenge must complete first.
//
// Two doors (Iggie ruling 9/3, #1144):
//   TOTP  — raw GoTrue REST (/auth/v1/factors); the verified session is aal2 and
//           replaces SB_SESSION. Default.
//   Email — sbd-mfa-email edge function mails a 6-digit code; verifying writes a
//           row keyed by this JWT's session_id that sbd_mfa_satisfied() reads. The
//           session stays aal1 in the JWT; the database, not the token, holds the proof.
//
// The ADMIN_ROLES list exists in four places that must agree: here, the migration
// 20260910120000 (sbd_mfa_satisfied), and the MFA_ADMIN_ROLES block inlined in
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

  // #1144: the one edge function an admin may reach at aal1. Errors carry the
  // server's `code` (RATE_LIMITED, COOLDOWN, NO_CODE, INVALID_CODE) for the UI.
  async _emailFetch(action, body={}){
    const res = await fetch(`${SB_API_URL}/functions/v1/sbd-mfa-email`, {
      method: 'POST',
      headers: {
        'apikey': SB_ANON_KEY,
        'Authorization': `Bearer ${SB_SESSION && SB_SESSION.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action, ...body })
    });
    const text = await res.text();
    let data = null; try { data = text ? JSON.parse(text) : null; } catch(_){ data = null; }
    if(!res.ok){
      const err = new Error((data && data.error) || 'HTTP '+res.status);
      err.code = (data && data.code) || ('HTTP_'+res.status);
      err.status = res.status;
      throw err;
    }
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

  // Resolves true once the session is verified (aal2 TOTP, or an email-verified
  // row for this session); false if the user cancels.
  async ensureAal2(){
    if(!SB_SESSION || !SB_SESSION.access_token) return false;
    if(this.aalOf(SB_SESSION.access_token) === 'aal2') return true;

    // #1144: a reload (restoreSessionOnLoad → doLogin) keeps the same session_id,
    // so an email verification from earlier today still stands. Any failure here
    // (function not deployed yet, network) just falls through to the TOTP flow.
    let email = '';
    try {
      const st = await this._emailFetch('status');
      if(st && st.verified) return true;
      email = (st && st.email) || '';
    } catch(e){ console.warn('MFA: email status check failed:', e.message); }

    let factors;
    try { factors = await this._listTotpFactors(); }
    catch(e){ console.warn('MFA: factor list failed:', e.message); factors = []; }

    const verified = factors.find(f => f.status === 'verified');
    if(verified) return this._runModal({ mode:'challenge', factorId: verified.id, email });

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
      // Enrollment is down but the email door may still be open.
      if(email) return this._runModal({ mode:'email', email, noTotp:true });
      return false;
    }
    return this._runModal({ mode:'enroll', factorId: enrolled.id, totp: enrolled.totp || {}, email });
  },

  // One modal for all three flows. Returns a promise: true = verified, false =
  // cancelled. The email mode is reachable from enroll/challenge via a footer
  // link and can switch back; the promise outlives the switches.
  _runModal({ mode, factorId, totp, email, noTotp }){
    return new Promise((resolve) => {
      const old = document.getElementById('mfa-overlay');
      if(old) old.remove();

      const ovl = document.createElement('div');
      ovl.id = 'mfa-overlay';
      ovl.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(10,12,16,.85);display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto';
      document.body.appendChild(ovl);

      const totpMode = mode === 'email' ? 'challenge' : mode;   // where "use authenticator" goes back to
      let emailSent = false, cooldownTimer = null;
      const done = (val) => { clearInterval(cooldownTimer); ovl.remove(); resolve(val); };
      const esc = (s) => String(s||'').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

      const P = 'margin:0 0 12px;color:#aab;font-size:.85rem;line-height:1.5';
      const LINK = 'background:none;border:0;color:#c49a20;padding:0;cursor:pointer;font-size:.8rem;text-decoration:underline';

      const render = (m) => {
        clearInterval(cooldownTimer);
        const enrollBlock = m !== 'enroll' ? '' : `
          <p style="${P}">
            Administrator accounts require two-factor authentication. Scan this QR code
            with an authenticator app (Google Authenticator, Authy, 1Password…), then
            enter the 6-digit code it shows.</p>
          <div id="mfa-qr" style="background:#fff;border-radius:8px;padding:10px;display:flex;justify-content:center;margin:0 0 10px"></div>
          <div style="margin:0 0 12px;font-size:.75rem;color:#889">Can't scan? Enter this key manually:<br>
            <code style="user-select:all;word-break:break-all;color:#c49a20">${(totp && totp.secret) || ''}</code></div>`;

        const challengeBlock = m !== 'challenge' ? '' : `
          <p style="${P}">Enter the 6-digit code from your authenticator app to finish signing in.</p>`;

        const emailBlock = m !== 'email' ? '' : `
          <p style="${P}">${emailSent
            ? `We emailed a 6-digit code to <strong style="color:#e8eaef">${esc(email)}</strong>. It expires in 10 minutes.`
            : `Sending a 6-digit code to <strong style="color:#e8eaef">${esc(email)}</strong>…`}</p>`;

        // Footer: the other door. Email is offered from both TOTP modes; TOTP is
        // offered back from email unless enrollment itself failed.
        const altLink = m === 'email'
          ? (noTotp ? '' : `<button id="mfa-alt" style="${LINK}">Use my authenticator app instead</button>`)
          : (email ? `<button id="mfa-alt" style="${LINK}">No phone on hand? Email me a code instead</button>` : '');
        const resendLink = m !== 'email' ? '' : `<button id="mfa-resend" style="${LINK};margin-right:14px" disabled>Resend code</button>`;

        ovl.innerHTML = `
          <div style="background:#161a22;border:1px solid #2a3040;border-radius:12px;max-width:380px;width:100%;padding:22px;margin:auto">
            <h3 style="margin:0 0 10px;color:#e8eaef;font-size:1.05rem">
              ${m === 'enroll' ? 'Set up two-factor authentication' : m === 'email' ? 'Check your email' : 'Two-factor verification'}</h3>
            ${enrollBlock}${challengeBlock}${emailBlock}
            <input id="mfa-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="123456"
              style="width:100%;box-sizing:border-box;background:#0e1118;border:1px solid #2a3040;border-radius:8px;color:#e8eaef;font-size:1.3rem;letter-spacing:.35em;text-align:center;padding:10px;margin:0 0 8px">
            <div id="mfa-err" style="display:none;color:#e0685e;font-size:.8rem;margin:0 0 8px"></div>
            <button id="mfa-verify" style="width:100%;background:#c49a20;border:0;border-radius:8px;color:#14161c;font-weight:600;padding:11px;cursor:pointer">Verify</button>
            <div style="margin:12px 0 0;text-align:center">${resendLink}${altLink}</div>
            <button id="mfa-cancel" style="width:100%;background:none;border:0;color:#889;padding:10px 0 0;cursor:pointer;font-size:.8rem">Cancel and sign out</button>
          </div>`;

        // GoTrue returns totp.qr_code as either a data: URL or a raw SVG string.
        if(m === 'enroll'){
          const qrEl = ovl.querySelector('#mfa-qr');
          const qr = (totp && totp.qr_code) || '';
          if(qr.startsWith('data:')){
            const img = document.createElement('img');
            img.src = qr; img.alt = 'TOTP QR code'; img.style.cssText = 'width:220px;height:220px';
            qrEl.appendChild(img);
          } else {
            qrEl.innerHTML = qr;
            const svg = qrEl.querySelector('svg');
            if(svg){
              // goqrsvg emits width/height but no viewBox; CSS sizing then clips
              // instead of scaling and the QR loses its bottom-left finder. #1141
              if(!svg.getAttribute('viewBox')){
                const w = parseFloat(svg.getAttribute('width')) || 0, h = parseFloat(svg.getAttribute('height')) || 0;
                if(w && h) svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
              }
              svg.style.width = '220px'; svg.style.height = '220px';
            }
          }
        }

        const codeEl = ovl.querySelector('#mfa-code');
        const errEl = ovl.querySelector('#mfa-err');
        const btnEl = ovl.querySelector('#mfa-verify');
        const altEl = ovl.querySelector('#mfa-alt');
        const resendEl = ovl.querySelector('#mfa-resend');
        const showErr = (msg) => { errEl.textContent = msg; errEl.style.display = 'block'; };
        const reset = () => { btnEl.disabled = false; btnEl.textContent = 'Verify'; codeEl.value = ''; codeEl.focus(); };

        const startCooldown = (secs) => {
          if(!resendEl) return;
          clearInterval(cooldownTimer);
          let left = secs;
          resendEl.disabled = true; resendEl.textContent = `Resend code (${left}s)`;
          cooldownTimer = setInterval(() => {
            left--;
            if(left <= 0){ clearInterval(cooldownTimer); resendEl.disabled = false; resendEl.textContent = 'Resend code'; }
            else resendEl.textContent = `Resend code (${left}s)`;
          }, 1000);
        };

        const sendEmail = async () => {
          try {
            const r = await this._emailFetch('send_code');
            if(r && r.already_verified){ done(true); return; }
            emailSent = true;
            render('email');
          } catch(e){
            console.warn('MFA email send failed:', e.message);
            if(e.code === 'COOLDOWN'){ emailSent = true; render('email'); startCooldown(e.retry_after_seconds || 60); return; }
            if(!emailSent){
              // Nothing was ever sent: fall back to TOTP with the reason, or fail closed.
              if(noTotp){ showErr(e.message); return; }
              render(totpMode); ovl.querySelector('#mfa-err').textContent = 'Could not email a code: '+e.message; ovl.querySelector('#mfa-err').style.display = 'block';
              return;
            }
            showErr(e.message);
          }
        };

        const verify = async () => {
          const code = (codeEl.value || '').trim();
          if(!/^\d{6}$/.test(code)){ showErr('Enter the 6-digit code.'); return; }
          btnEl.disabled = true; btnEl.textContent = 'Verifying…';
          if(m === 'email'){
            try {
              const r = await this._emailFetch('verify_code', { code });
              if(r && r.verified){ done(true); return; }
              showErr('That code did not verify.'); reset();
            } catch(e){
              console.warn('MFA email verify failed:', e.message);
              showErr(e.message || 'That code did not verify.');
              reset();
              if(e.code === 'RATE_LIMITED' || e.code === 'NO_CODE'){ btnEl.disabled = true; }
            }
            return;
          }
          try {
            const ch = await this._authFetch(`/factors/${factorId}/challenge`, { method:'POST' });
            const session = await this._authFetch(`/factors/${factorId}/verify`, {
              method:'POST', body:{ challenge_id: ch.id, code }
            });
            this._adoptSession(session);
            done(true);
          } catch(e){
            showErr('That code did not verify. Check your authenticator and try again.');
            console.warn('MFA verify failed:', e.message);
            reset();
          }
        };

        btnEl.onclick = verify;
        codeEl.onkeydown = (e) => { if(e.key === 'Enter') verify(); };
        ovl.querySelector('#mfa-cancel').onclick = () => done(false);
        if(altEl) altEl.onclick = () => { if(m === 'email') render(totpMode); else { render('email'); } };
        if(resendEl) resendEl.onclick = () => { resendEl.disabled = true; sendEmail(); };
        setTimeout(() => codeEl.focus(), 50);

        if(m === 'email'){
          if(!emailSent) sendEmail();           // first entry: mail the code, re-render on success
          else startCooldown(60);
        }
      };

      render(mode);
    });
  }
};
window.MFA = MFA;
