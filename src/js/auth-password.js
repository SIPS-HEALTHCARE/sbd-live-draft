// ============================================================
// AUTH PASSWORD — Forgot Password & Reset Flow
// ============================================================

let _recoveryToken = null;      // implicit-flow access_token from #access_token=…&type=recovery
let _recoveryTokenHash = null;  // token_hash from ?set_password=1&token_hash=… (redeemed on submit)

// ── On page load: open the set-password screen if the URL carries a token, and explain a dead link ──
//
// The token_hash branch is the one that matters. A GoTrue action link is a /auth/v1/verify URL
// and GoTrue spends the token on the FIRST GET, by anyone, so a hospital mailbox scanner that
// fetches every URL in a message burns it seconds after delivery and the person lands on a bare
// sign-in page. Carrying the hashed token on our own origin instead means opening the URL only
// renders this form; the token is redeemed by a POST in doResetPassword(), on the button press,
// which a scanner never does.
function checkForPasswordRecovery() {
  const qs = new URLSearchParams(window.location.search);
  const hashParams = {};
  (window.location.hash || '').replace('#', '').split('&').forEach(part => {
    const [k, v] = part.split('=');
    if (k && v) hashParams[k] = decodeURIComponent(v);
  });

  // 1. New scanner-proof link: ?set_password=1&token_hash=…  (also used by the Reset Password email template)
  const tokenHash = qs.get('token_hash');
  if (tokenHash) {
    _recoveryTokenHash = tokenHash;
    history.replaceState(null, '', window.location.pathname);
    _showResetOverlay();
    return;
  }

  // 2. Legacy implicit-flow link: #access_token=…&type=recovery (keep working while old emails are in flight)
  if (hashParams.type === 'recovery' && hashParams.access_token) {
    _recoveryToken = hashParams.access_token;
    history.replaceState(null, '', window.location.pathname);
    _showResetOverlay();
    return;
  }

  // 3. GoTrue bounced an already-used / expired link back to us: say so instead of showing the plain sign-in page
  if (hashParams.error_code || hashParams.error) {
    history.replaceState(null, '', window.location.pathname);
    const msg = hashParams.error_code === 'otp_expired'
      ? 'That link has already been used or has expired. Enter your email below and we will send a fresh one.'
      : 'That link could not be used. Enter your email below and we will send a fresh one.';
    _openForgotWithMessage(msg);
  }
}

function _showResetOverlay() {
  const loginEl = document.getElementById('login');
  const resetEl = document.getElementById('auth-reset-overlay');
  if (loginEl) {
    loginEl.classList.add('hidden');
    loginEl.style.display = 'none';   // overrides inline display set on the login screen
  }
  if (resetEl) resetEl.classList.remove('hidden');
}

function _openForgotWithMessage(msg) {
  const run = () => {
    if (typeof showForgotPassword === 'function') showForgotPassword();
    const errEl = document.getElementById('fp-error');
    if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
  };
  // the login card is revealed by auth-init after the session check; give it a tick
  setTimeout(run, 400);
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
  if (!_recoveryToken && !_recoveryTokenHash) { _resetErr('Reset link has expired. Please request a new one.', errEl); return; }

  if (btn) { btn.disabled = true; btn.textContent = 'Updating…'; }
  try {
    // Redeem the token_hash only now, on the person's click, never on page load.
    if (!_recoveryToken && _recoveryTokenHash) {
      const session = await SB_AUTH.verifyRecoveryTokenHash(_recoveryTokenHash);
      _recoveryToken = session.access_token;
      _recoveryTokenHash = null;
    }
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
    // A dead token leaves the person staring at an overlay that will never work. Send them to
    // the forgot-password panel with the reason, so the next step is one click and not a guess.
    const dead = /expired|invalid|not found|already/i.test(e.message || '');
    if (dead) {
      _recoveryToken = null; _recoveryTokenHash = null;
      const resetEl = document.getElementById('auth-reset-overlay');
      const loginEl = document.getElementById('login');
      if (resetEl) resetEl.classList.add('hidden');
      if (loginEl) { loginEl.classList.remove('hidden'); loginEl.style.display = ''; }
      _openForgotWithMessage('That link has already been used or has expired. Enter your email below and we will send a fresh one.');
    } else {
      _resetErr(e.message || 'Failed to update password. Please try again.', errEl);
    }
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
