// ============================================================
// AUTH PASSWORD — Forgot Password & Reset Flow
// ============================================================

let _recoveryToken = null;

// ── Check for password recovery hash on page load ──
function checkForPasswordRecovery() {
  const hash = window.location.hash;
  if (!hash) return;
  const params = {};
  hash.replace('#', '').split('&').forEach(part => {
    const [k, v] = part.split('=');
    if (k && v) params[k] = decodeURIComponent(v);
  });
  if (params.type === 'recovery' && params.access_token) {
    _recoveryToken = params.access_token;
    history.replaceState(null, '', window.location.pathname);
    const loginEl = document.getElementById('login');
    const resetEl = document.getElementById('auth-reset-overlay');
    if (loginEl) loginEl.classList.add('hidden');
    if (resetEl) resetEl.classList.remove('hidden');
  }
}

// ── Show Forgot Password panel ──
function showForgotPassword() {
  const signin = document.getElementById('auth-signin');
  const register = document.getElementById('auth-register');
  const forgot = document.getElementById('auth-forgot');
  const sent = document.getElementById('auth-forgot-sent');
  if (signin) signin.style.display = 'none';
  if (register) register.style.display = 'none';
  if (forgot) forgot.style.display = 'block';
  if (sent) sent.style.display = 'none';
  const tabS = document.getElementById('tab-signin');
  const tabR = document.getElementById('tab-register');
  if (tabS) tabS.classList.remove('active');
  if (tabR) tabR.classList.remove('active');
  const errEl = document.getElementById('fp-error');
  if (errEl) errEl.style.display = 'none';
}

// ── Back to Sign In ──
function backToSignIn() {
  const forgot = document.getElementById('auth-forgot');
  const sent = document.getElementById('auth-forgot-sent');
  const signin = document.getElementById('auth-signin');
  if (forgot) forgot.style.display = 'none';
  if (sent) sent.style.display = 'none';
  if (signin) signin.style.display = 'block';
  const tabS = document.getElementById('tab-signin');
  const tabR = document.getElementById('tab-register');
  if (tabS) tabS.classList.add('active');
  if (tabR) tabR.classList.remove('active');
  const fpEmail = document.getElementById('fp-email');
  if (fpEmail) fpEmail.value = '';
  const errEl = document.getElementById('fp-error');
  if (errEl) errEl.style.display = 'none';
}

// ── Send Reset Email ──
async function doForgotPassword() {
  const emailEl = document.getElementById('fp-email');
  const errEl  = document.getElementById('fp-error');
  const btn    = document.getElementById('fp-btn');
  const email  = (emailEl?.value || '').trim().toLowerCase();

  if (!email || !Security.isEmail(email)) {
    if (errEl) { errEl.textContent = 'Please enter a valid email address.'; errEl.style.display = 'block'; }
    return;
  }
  if (!Security.rateLimit('forgotpw', 3, 600000)) {
    if (errEl) { errEl.textContent = 'Too many requests. Please wait a few minutes.'; errEl.style.display = 'block'; }
    return;
  }
  if (errEl) errEl.style.display = 'none';
  if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
  try {
    await SB_AUTH.requestPasswordReset(email);
    const forgot = document.getElementById('auth-forgot');
    const sent   = document.getElementById('auth-forgot-sent');
    if (forgot) forgot.style.display = 'none';
    if (sent)   sent.style.display   = 'block';
  } catch (e) {
    if (errEl) { errEl.textContent = 'Something went wrong. Please try again.'; errEl.style.display = 'block'; }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Send Reset Link'; }
  }
}

// ── Password strength (0–3) ──
function calcPasswordStrength(pass) {
  if (!pass || pass.length < 6) return 0;
  let score = 0;
  if (pass.length >= 8) score++;
  if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score++;
  if (/[!@#$%^&*()\-_+=\[\]{};':"\\|,.<>\/?]/.test(pass)) score++;
  return score;
}

// ── Strength bar: reset form ──
function updateResetStrengthBar(pass) {
  _updateStrengthBar('reset-strength-bar', 'reset-strength-label', pass);
}

// ── Strength bar: settings form ──
function updateSettingsStrengthBar(pass) {
  _updateStrengthBar('settings-strength-bar', 'settings-strength-label', pass);
}

function _updateStrengthBar(barId, labelId, pass) {
  const score  = calcPasswordStrength(pass);
  const bar    = document.getElementById(barId);
  const label  = document.getElementById(labelId);
  if (!bar || !label) return;
  const levels = ['', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const colors = ['', '#ef4444', '#f59e0b', '#22c55e', '#14b8a6'];
  const widths = ['0%', '25%', '50%', '75%', '100%'];
  bar.style.width      = pass.length > 0 ? (widths[score] || '0%') : '0%';
  bar.style.background = colors[score] || 'transparent';
  label.textContent    = pass.length > 0 ? (levels[score] || 'Weak') : '';
  label.style.color    = colors[score] || 'var(--txt3)';
}

// ── Set New Password (recovery flow) ──
async function doResetPassword() {
  const passEl  = document.getElementById('reset-pass');
  const pass2El = document.getElementById('reset-pass2');
  const errEl   = document.getElementById('reset-error');
  const btn     = document.getElementById('reset-btn');
  const pass    = passEl?.value  || '';
  const pass2   = pass2El?.value || '';

  if (errEl) errEl.style.display = 'none';

  if (pass.length < 8) { _resetErr('Password must be at least 8 characters.', errEl); return; }
  if (!/[A-Z]/.test(pass)) { _resetErr('Password must include at least one uppercase letter.', errEl); return; }
  if (!/[0-9]/.test(pass)) { _resetErr('Password must include at least one number.', errEl); return; }
  if (pass !== pass2) { _resetErr('Passwords do not match.', errEl); return; }
  if (!_recoveryToken) { _resetErr('Reset link has expired. Please request a new one.', errEl); return; }

  if (btn) { btn.disabled = true; btn.textContent = 'Updating…'; }
  try {
    await SB_AUTH.updatePassword(_recoveryToken, pass);
    _recoveryToken = null;
    const resetEl  = document.getElementById('auth-reset-overlay');
    const loginEl  = document.getElementById('login');
    if (resetEl) resetEl.classList.add('hidden');
    if (loginEl) loginEl.classList.remove('hidden');
    if (typeof switchAuthTab === 'function') switchAuthTab('signin');
    const succEl = document.getElementById('auth-success');
    if (succEl) { succEl.textContent = '✓ Password updated. Please sign in with your new password.'; succEl.style.display = 'block'; }
  } catch (e) {
    _resetErr(e.message || 'Failed to update password. The link may have expired.', errEl);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Set New Password'; }
  }
}

function _resetErr(msg, errEl) {
  if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
}

// ── Run on page load ──
(function() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkForPasswordRecovery);
  } else {
    checkForPasswordRecovery();
  }
})();
