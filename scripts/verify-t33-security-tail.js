#!/usr/bin/env node
/* ============================================================================
 * verify-t33-security-tail.js — T33 (issue S13) acceptance harness
 *
 * T33's three pieces: (1) MFA enforced on admin sign-in, (2) a written data
 * retention policy stored in the repo, (3) per-role restrictions on the data
 * interface, applied and read back.
 *
 * ONE LIST, MANY COPIES. The admin-tier role list ("which roles must hold an
 * aal2 session") exists in:
 *     src/js/mfa.js (MFA.ADMIN_ROLES)                                 client
 *     supabase/migrations/20260812130000_..._gate.sql                 SQL ×2
 *     MFA_ADMIN_ROLES inlined in 15 edge functions (#47: the deploy
 *     pipeline cannot resolve ../_shared imports)                     server
 * If any copy drifts, one surface stops requiring MFA for a role the others
 * require it for — and nobody notices because everything still "works".
 *
 * This file checks the SHIPPED code. The live-database read-back is
 * supabase/verify/t33_mfa_gate_check.sql (§5 there covers the real-session
 * check the done-when asks for).
 *
 * Run:  node scripts/verify-t33-security-tail.js
 * Exit 0 only if every assertion passes.
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

let failures = 0;
function ok(cond, label) {
  if (cond) { console.log('  ✓ ' + label); return; }
  failures++;
  console.log('  ✗ ' + label);
}
function section(t) { console.log('\n' + t); }

const CANON = ['master_admin', 'staff_admin', 'admin', 'master', 'sips_admin', 'system_admin'];
const sameSet = (arr) =>
  Array.isArray(arr) && arr.length === CANON.length && CANON.every(r => arr.includes(r));

// Pull every quoted string out of a bracketed list literal.
const listFrom = (src, re) => {
  const m = src.match(re);
  if (!m) return null;
  return (m[1].match(/'[^']+'/g) || []).map(s => s.slice(1, -1));
};

/* ── 1. Retention policy (piece 2) ────────────────────────────────────────── */
section('1. Data retention policy document');
let policy = '';
try { policy = read('docs/DATA_RETENTION_POLICY.md'); } catch (_) {}
ok(policy.length > 1000, 'docs/DATA_RETENTION_POLICY.md exists and is substantive');
for (const heading of ['What the platform stores', 'Retention schedule', 'Enforcement status', 'Access control']) {
  ok(policy.includes(heading), `policy covers "${heading}"`);
}
ok(policy.includes('No account is ever deleted'), 'policy carries the client T31 rule verbatim');

/* ── 2. Client MFA flow (piece 1, client side) ────────────────────────────── */
section('2. Client MFA flow');
const MFAJS = read('src/js/mfa.js');
const UI = read('src/js/ui-views.js');
const HTML = read('index.html');

const clientRoles = listFrom(MFAJS, /ADMIN_ROLES:\s*\[([^\]]+)\]/);
ok(sameSet(clientRoles), 'mfa.js ADMIN_ROLES matches the canonical admin-tier list');
ok(/\/factors'/.test(MFAJS) && /challenge/.test(MFAJS) && /verify/.test(MFAJS),
   'mfa.js drives the GoTrue enroll → challenge → verify endpoints');
ok(/_adoptSession/.test(MFAJS) && /sbd_session/.test(MFAJS),
   'the aal2 session replaces the stored sbd_session (refresh/restore keep working)');

const gateIdx = UI.indexOf('MFA.ensureAal2');
const hydrateIdx = UI.indexOf('await initAppData()');
ok(gateIdx > -1, 'doLogin calls MFA.ensureAal2');
ok(gateIdx > -1 && hydrateIdx > -1 && gateIdx < hydrateIdx,
   'the MFA gate runs BEFORE data hydration (aal1 admin hydration would be empty)');
ok(/signOut/.test(UI.slice(gateIdx, gateIdx + 600)),
   'declining the MFA challenge signs the session out');
ok(/src\/js\/mfa\.js\?v=\d+/.test(HTML), 'index.html loads mfa.js with a cache-bust param');

/* ── 3. Migration (pieces 1+3, database side) ─────────────────────────────── */
section('3. Migration 20260812130000');
const SQL = read('supabase/migrations/20260812130000_t33_admin_mfa_aal2_gate.sql');
ok(/create or replace function public\.sbd_mfa_satisfied/.test(SQL), 'defines sbd_mfa_satisfied()');
ok(/security definer set search_path = public/.test(SQL), 'predicate is definer with pinned search_path');
ok(/aal'?,\s*'aal1'\)\s*=\s*'aal2'/.test(SQL.replace(/\s+/g, ' ')), 'predicate keys on the JWT aal claim');
ok(/as restrictive for all to authenticated/.test(SQL), 'gate policies are RESTRICTIVE, TO authenticated');
ok(/revoke all on function public\.sbd_mfa_satisfied\(\) from anon/.test(SQL), 'anon cannot execute the predicate');

const sqlLists = [...SQL.matchAll(/in \(([^)]*'master_admin'[^)]*)\)/g)]
  .map(m => (m[1].match(/'[^']+'/g) || []).map(s => s.slice(1, -1)))
  .filter(l => l.includes('sips_admin')); // the admin-tier lists, not sbd_is_admin's legacy 3-role list
ok(sqlLists.length >= 2 && sqlLists.every(sameSet),
   'both SQL admin-tier role lists match the canonical list');

const isAdminIdx = SQL.indexOf('function public.sbd_is_admin');
ok(isAdminIdx > -1 && SQL.slice(isAdminIdx).includes('sbd_mfa_satisfied()'),
   'sbd_is_admin() is gated on the predicate');
ok(/sbd_mfa_gate_select on public\.sbd_portal_users/.test(SQL)
   && /auth_uid = auth\.uid\(\) or id = auth\.uid\(\) or public\.sbd_mfa_satisfied\(\)/.test(SQL),
   'sbd_portal_users keeps the own-row SELECT exception (login must learn the role pre-challenge)');
ok(!/sbd_mfa_gate on public\.sbd_portal_users/.test(SQL),
   'the generic FOR ALL gate is NOT applied to sbd_portal_users (it would break login)');

/* ── 4. Edge-function guards (piece 1, server side) ───────────────────────── */
section('4. Edge-function guards (15 copies must agree)');
const GUARDED = [
  'david-admin-api/index.ts', 'david-chat/auth.ts', 'sbd-sync-user-claims/index.ts',
  'sbd-set-account-active/index.ts', 'sbd-approve-registration/index.ts',
  'sbd-assign-free-agent/index.ts', 'sbd-release-to-free-agent/index.ts',
  'bulk-upload-staff/index.ts', 'sbd-admin-sessions/index.ts', 'sbd-observer-pin/index.ts',
  'sbd-force-submit-placement/index.ts', 'sbd-reset-test-assessment/index.ts',
  'sbd-record-assessment/index.ts', 'sbd-assessor-pin/index.ts', 'sbd-observation-unlock/index.ts',
];
for (const f of GUARDED) {
  const src = read('supabase/functions/' + f);
  const roles = listFrom(src, /MFA_ADMIN_ROLES = \[([^\]]+)\]/);
  const calls = /mfaDenied\(/.test(src) && src.includes("!== 'aal2'");
  ok(sameSet(roles) && calls, `${f} carries the guard with the canonical role list`);
}

/* ── 5. Wrap up ───────────────────────────────────────────────────────────── */
section('5. Result');
if (failures) {
  console.log(`  ${failures} assertion(s) FAILED`);
  process.exit(1);
}
console.log('  all assertions passed');
console.log('  → live read-back: run supabase/verify/t33_mfa_gate_check.sql after applying the migration');
