#!/usr/bin/env node
/* ============================================================================
 * verify-set-password-link.js, acceptance harness for the set-password link
 *
 * The incident this guards (17-18 Aug 2026): approved staff opened their
 * "Set Your Password" email, clicked the button, and landed on a plain sign-in
 * screen with no account they could get into.
 *
 * Cause: the email carried GoTrue's own action_link, which is an
 * /auth/v1/verify URL. GoTrue spends that token on the FIRST GET, by anyone.
 * Hospital mailboxes run link scanners that GET every URL in a message within
 * seconds of delivery, so the token was gone before the human clicked. Measured
 * on one account: link issued 19:33:35, consumed 19:33:45 by an agent that was
 * not her browser, a Microsoft scanner HEAD at 19:33:55, and every attempt of
 * hers after that returned "One-time token not found".
 *
 * The fix has three halves and all three can silently regress:
 *   1. The function must email the HASHED token on our own origin, never
 *      action_link. A GET of our URL only renders a form.
 *   2. The page must redeem that token by POST, and only when the person
 *      presses the button, never on page load, or we have rebuilt the bug
 *      with extra steps.
 *   3. A spent or expired link must say so and offer a fresh one, instead of
 *      dropping the person on a blank sign-in screen (which is what everyone
 *      actually experienced).
 *
 * Run:  node scripts/verify-set-password-link.js
 * Exit 0 only if every assertion passes.
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const AUTHPW = fs.readFileSync(path.join(root, 'src/js/auth-password.js'), 'utf8');
const API = fs.readFileSync(path.join(root, 'src/js/api-supabase.js'), 'utf8');
const FN = fs.readFileSync(path.join(root, 'supabase/functions/sbd-approve-registration/index.ts'), 'utf8');
const INDEX = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

let passed = 0, failed = 0;
function ok(cond, label, detail) {
  if (cond) { passed++; console.log('  \x1b[32mok\x1b[0m   ' + label); }
  else { failed++; console.log('  \x1b[31mFAIL\x1b[0m ' + label + (detail ? '\n         ' + detail : '')); }
}

/* ---- a fake page, so the real shipped code runs rather than a re-implementation ---- */
function loadPage(url, opts = {}) {
  const els = {};
  const mk = () => {
    const e = { textContent: '', value: '', style: {}, disabled: false, _cls: new Set() };
    e.classList = { add: c => e._cls.add(c), remove: c => e._cls.delete(c), contains: c => e._cls.has(c) };
    return e;
  };
  ['login', 'auth-reset-overlay', 'auth-signin', 'auth-register', 'auth-forgot',
   'auth-forgot-sent', 'tab-signin', 'tab-register', 'fp-error', 'fp-email', 'fp-btn',
   'reset-pass', 'reset-pass2', 'reset-error', 'reset-btn', 'auth-success',
   'reset-strength-bar', 'reset-strength-label'].forEach(id => { els[id] = mk(); });

  const u = new URL(url);
  const calls = { verify: [], update: [] };
  const timers = [];

  const sandbox = {
    console,
    window: { location: { search: u.search, hash: u.hash, pathname: u.pathname } },
    history: { replaceState() {} },
    document: { getElementById: id => els[id] || null, readyState: 'complete', addEventListener() {} },
    URLSearchParams,
    setTimeout: fn => { timers.push(fn); },
    Security: { isEmail: () => true, rateLimit: () => true },
    SB_AUTH: {
      async verifyRecoveryTokenHash(h) {
        calls.verify.push(h);
        if (opts.verifyThrows) throw new Error(opts.verifyThrows);
        return { access_token: 'AT-from-' + h };
      },
      async updatePassword(tok, pass) {
        calls.update.push([tok, pass]);
        if (opts.updateThrows) throw new Error(opts.updateThrows);
        return true;
      }
    }
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(AUTHPW, sandbox);

  return { fn: sandbox, els, calls, flush: () => timers.splice(0).forEach(f => f()) };
}

const goodPass = p => { p.els['reset-pass'].value = p.els['reset-pass2'].value = 'Testpass1'; };

(async () => {

console.log('\n1. The email link the function builds');
ok(!/properties\.action_link|properties\?\.action_link/.test(FN),
  'sbd-approve-registration never reads action_link (a scanner burns it on the first GET)');
ok(/properties\?\.hashed_token/.test(FN),
  'it reads hashed_token instead');
ok(/set_password=1&token_hash=\$\{encodeURIComponent\(hashedToken\)\}/.test(FN),
  'and puts it on our own origin as ?set_password=1&token_hash=…');
ok(/belt\.sterilebydesign\.ai\/\?set_password=1/.test(FN),
  'pointing at the production origin');
ok(!/throw new Error\([^)]*set-password link/i.test(FN),
  'a link failure is non-fatal. Throwing here would roll back a perfectly good account');
ok(/crypto\.randomUUID\(\)/.test(FN) && !/TemporarySBD|TemporaryPassword|'Welcome1/.test(FN),
  'the auth user is created with a random throwaway credential, never a shared constant');

console.log('\n2. The redeem call is a POST');
ok(/async verifyRecoveryTokenHash\(tokenHash\)/.test(API),
  'SB_AUTH.verifyRecoveryTokenHash exists');
ok(/verifyRecoveryTokenHash[\s\S]{0,400}?method:\s*'POST'/.test(API),
  'it POSTs to /auth/v1/verify, so a scanner GET cannot consume the token');
ok(/verifyRecoveryTokenHash[\s\S]{0,400}?type:\s*'recovery',\s*token_hash/.test(API),
  "it sends { type: 'recovery', token_hash }");

console.log('\n3. Opening the link costs nothing');
{
  const p = loadPage('https://belt.sterilebydesign.ai/?set_password=1&token_hash=pkce_abc');
  p.fn.checkForPasswordRecovery();
  ok(p.calls.verify.length === 0,
    'page load redeems NOTHING. This is the whole point of the fix',
    'verify calls on load: ' + p.calls.verify.length);
  ok(!p.els['auth-reset-overlay'].classList.contains('hidden'), 'the set-password form is shown');
  ok(p.els['login'].style.display === 'none',
    'the login card is hidden by inline style, not just the class (auth-init re-reveals the class)');
}

console.log('\n4. The token is spent on the button press, once');
{
  const p = loadPage('https://belt.sterilebydesign.ai/?set_password=1&token_hash=pkce_abc');
  p.fn.checkForPasswordRecovery();
  goodPass(p);
  await p.fn.doResetPassword();
  ok(p.calls.verify.length === 1, 'redeemed exactly once', JSON.stringify(p.calls.verify));
  ok(p.calls.update.length === 1 && p.calls.update[0][0] === 'AT-from-pkce_abc',
    'the password update uses the session that redeeming returned', JSON.stringify(p.calls.update));
  ok(/Password updated/.test(p.els['auth-success'].textContent),
    'and the person is told to sign in', p.els['auth-success'].textContent);
}

console.log('\n5. Emails already in flight keep working');
{
  const p = loadPage('https://belt.sterilebydesign.ai/#access_token=LEGACY&type=recovery');
  p.fn.checkForPasswordRecovery();
  ok(!p.els['auth-reset-overlay'].classList.contains('hidden'),
    'the old #access_token=…&type=recovery link still opens the form');
  goodPass(p);
  await p.fn.doResetPassword();
  ok(p.calls.verify.length === 0, 'no redeem call, that token is already a session');
  ok(p.calls.update.length === 1 && p.calls.update[0][0] === 'LEGACY',
    'it is used directly', JSON.stringify(p.calls.update));
}

console.log('\n6. A dead link explains itself instead of showing a blank sign-in page');
{
  const p = loadPage('https://belt.sterilebydesign.ai/#error_code=otp_expired&error=access_denied');
  p.fn.checkForPasswordRecovery();
  p.flush();
  ok(p.els['auth-forgot'].style.display === 'block', 'GoTrue bounce lands on the forgot-password panel');
  ok(/already been used or has expired/.test(p.els['fp-error'].textContent) &&
     p.els['fp-error'].style.display === 'block',
    'with the reason on screen', p.els['fp-error'].textContent);
}
{
  const p = loadPage('https://belt.sterilebydesign.ai/?set_password=1&token_hash=spent',
                     { verifyThrows: 'Email link is invalid or has expired' });
  p.fn.checkForPasswordRecovery();
  goodPass(p);
  await p.fn.doResetPassword();
  p.flush();
  ok(p.els['auth-reset-overlay'].classList.contains('hidden'), 'a spent token closes the dead form');
  ok(p.els['login'].style.display === '', 'and restores the login card it hid on the way in');
  ok(p.els['auth-forgot'].style.display === 'block' &&
     /already been used or has expired/.test(p.els['fp-error'].textContent),
    'dropping the person on Forgot Password with the reason', p.els['fp-error'].textContent);
}

console.log('\n7. A real error must NOT be mistaken for a dead link');
{
  const p = loadPage('https://belt.sterilebydesign.ai/?set_password=1&token_hash=ok',
                     { updateThrows: 'Network request failed' });
  p.fn.checkForPasswordRecovery();
  goodPass(p);
  await p.fn.doResetPassword();
  ok(!p.els['auth-reset-overlay'].classList.contains('hidden'),
    'the person keeps their form and their typed password');
  ok(/Network request failed/.test(p.els['reset-error'].textContent),
    'and sees the actual reason inline', p.els['reset-error'].textContent);
}

console.log('\n8. A normal visitor is untouched');
{
  const p = loadPage('https://belt.sterilebydesign.ai/');
  p.fn.checkForPasswordRecovery();
  p.flush();
  ok(p.els['login'].style.display !== 'none', 'the sign-in screen is not hidden');
  ok(p.els['auth-forgot'].style.display !== 'block', 'the forgot panel is not force-opened');
  ok(p.els['auth-reset-overlay']._cls.size === 0, 'the reset overlay is left alone');
}

console.log('\n9. The browser will actually fetch the new files');
{
  const api = INDEX.match(/api-supabase\.js\?v=(\d+)/);
  const authpw = INDEX.match(/auth-password\.js\?v=(\d+)/);
  ok(api && Number(api[1]) >= 63, 'api-supabase.js cache-bust bumped to 63+', api && api[0]);
  ok(authpw && Number(authpw[1]) >= 21, 'auth-password.js cache-bust bumped to 21+', authpw && authpw[0]);
}

console.log('\n' + (failed === 0
  ? '\x1b[32mAll ' + passed + ' assertions passed.\x1b[0m\n'
  : '\x1b[31m' + failed + ' of ' + (passed + failed) + ' assertions FAILED.\x1b[0m\n'));
process.exit(failed === 0 ? 0 : 1);

})();
