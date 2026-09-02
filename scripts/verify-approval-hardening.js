#!/usr/bin/env node
/* ============================================================================
 * verify-approval-hardening.js, acceptance harness for board items 141/142/143
 *
 * 141: the approve function's rollback is atomic over everything the call did.
 *      The 18 August shape (approved registration + queued welcome email + no
 *      account) must be unreachable: every side effect is tracked and the catch
 *      walks them back in reverse order.
 * 142: a pg_cron check queues one admin alert per stranded registration
 *      (approved, no auth user), deduped so it fires once, not hourly forever.
 * 143: the three dead objects are dropped and ONLY those three; the table and
 *      the surviving trigger stay.
 *
 * Run:  node scripts/verify-approval-hardening.js
 * Exit 0 only if every assertion passes.
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const FN = fs.readFileSync(path.join(root, 'supabase/functions/sbd-approve-registration/index.ts'), 'utf8');
const MAIL = fs.readFileSync(path.join(root, 'supabase/functions/sbd-send-emails/index.ts'), 'utf8');
const M142 = fs.readFileSync(path.join(root, 'supabase/migrations-archive/20260819225511_stranded_registration_alert.sql'), 'utf8');
const M143 = fs.readFileSync(path.join(root, 'supabase/migrations-archive/20260819225523_retire_dead_approval_code.sql'), 'utf8');

let passed = 0, failed = 0;
function ok(cond, label, detail) {
  if (cond) { passed++; console.log('  \x1b[32mok\x1b[0m   ' + label); }
  else { failed++; console.log('  \x1b[31mFAIL\x1b[0m ' + label + (detail ? '\n         ' + detail : '')); }
}

console.log('\n1. 141: every side effect is tracked');
ok(/let createdPortalRow = false/.test(FN), 'portal row creation is tracked');
ok(/let createdStaffRow = false/.test(FN), 'staff row creation is tracked');
ok(/let registrationApproved = false/.test(FN), 'the registration flip is tracked');
ok(/let queuedEmailId[^=]*= null/.test(FN), 'the queued email id is captured');
ok(/if \(authCreated\) createdPortalRow = true/.test(FN),
  'portal tracked ONLY when the auth user is new (an existing-user upsert may have UPDATED a real row a rollback must never delete)');
ok(/\} else if \(authCreated\) \{\s*createdStaffRow = true/.test(FN),
  'staff tracked only on success and only for a new auth user');
ok(/\.select\('id'\)\.single\(\)/.test(FN), 'the email queue insert returns its row id');

console.log('\n2. 141: the unchecked write is now checked');
ok(/const \{ error: regUpdateError \}/.test(FN) && /Failed to mark registration approved/.test(FN),
  'the registration status update throws on failure instead of returning success');

console.log('\n3. 141: the catch walks everything back, in reverse order');
const catchBlock = FN.slice(FN.indexOf("console.error('Approve Error:'"));
ok(/from\('sbd_email_queue'\)\.delete\(\)/.test(catchBlock) && /eq\('status', 'pending'\)/.test(catchBlock),
  'a still-pending queued email is deleted (a sent one is left alone)');
ok(/status: 'pending', reviewed_at: null, reviewed_by: null/.test(catchBlock),
  'the registration is put back to pending');
ok(/createdStaffRow && createdAuthUserId/.test(catchBlock), 'the created staff row is removed');
ok(/createdPortalRow && createdAuthUserId/.test(catchBlock), 'the created portal row is removed');
const order = ['sbd_email_queue', 'registrationApproved', 'createdStaffRow', 'createdPortalRow',
               'deleteUser(createdAuthUserId)', 'createdFacilityId'].map(m => catchBlock.indexOf(m));
ok(order.every(i => i >= 0) && order.every((v, i, a) => i === 0 || v > a[i - 1]),
  'cleanup order is the reverse of creation: email, registration, staff, portal, auth user, facility',
  JSON.stringify(order));
ok((catchBlock.match(/catch \(e: any\)/g) || []).length >= 6,
  'each rollback step is individually try/caught so one failure cannot strand the rest');

console.log('\n4. 142: the stranded-approval alert');
ok(/create or replace function public\.sbd_check_stranded_registrations/.test(M142), 'the check function exists');
ok(/status = 'approved'/.test(M142) && /not exists \(\s*select 1 from auth\.users/.test(M142),
  'it looks for approved registrations with no auth user');
ok(/q\.body_data->>'registration_id' = r\.id::text/.test(M142),
  'deduped on registration id, one alert per stranded row ever');
ok(/interval '10 minutes'/.test(M142), 'a grace period keeps in-flight approvals out');
ok(/interval '7 days'/.test(M142), 'the scan window keeps the 24 known pre-fix strays out of the signal');
ok(/role = 'master_admin' and p\.active/.test(M142), 'recipients are the active master admins, read live, not hardcoded');
ok(/cron\.schedule\(\s*'sbd-stranded-registration-alert',\s*'30 \* \* \* \*'/.test(M142),
  'scheduled hourly at :30, offset from the recovery job');
ok(/cron\.unschedule\('sbd-stranded-registration-alert'\)/.test(M142), 're-running the migration replaces the job instead of stacking a second one');

console.log('\n5. 142: the alert template renders');
ok(/admin_alert: \{/.test(MAIL), 'sbd-send-emails carries the admin_alert template');
ok(/Approval Without an Account/.test(MAIL) && /data\.reg_email/.test(MAIL),
  'it shows who is stranded and on which address');
ok(/once per registration/.test(MAIL), 'and says it will not repeat');

console.log('\n6. 143: three drops, and only those three');
ok(/drop trigger if exists trg_password_reset_created on public\.sbd_password_resets/.test(M143),
  'the 118-email trigger goes');
ok(/drop function if exists public\.sbd_on_password_reset_created\(\)/.test(M143), 'with its function');
ok(/drop trigger if exists trg_registrations_null_password/.test(M143), 'the duplicate null-password trigger goes');
ok(/drop function if exists public\.sbd_on_registration_approved\(\)/.test(M143), 'the never-bound incident-night function goes');
ok(!/drop table/.test(M143), 'NO table is dropped, sbd_password_resets keeps its rows as history');
ok(!/drop trigger if exists sbd_registrations_clear_password/.test(M143),
  'the surviving null-password guard is untouched');
ok(/comment on table public\.sbd_password_resets/.test(M143), 'the table is marked retired for the next reader');

console.log('\n7. The scanner-fix guarantees still hold on the edited function');
ok(!/properties\.action_link|properties\?\.action_link/.test(FN), 'still no action_link anywhere');
ok(/properties\?\.hashed_token/.test(FN), 'still the hashed token on our origin');
ok(/crypto\.randomUUID\(\)/.test(FN) && !/TemporarySBD/.test(FN), 'still a random throwaway credential');

console.log('\n' + (failed === 0
  ? '\x1b[32mAll ' + passed + ' assertions passed.\x1b[0m\n'
  : '\x1b[31m' + failed + ' of ' + (passed + failed) + ' assertions FAILED.\x1b[0m\n'));
process.exit(failed === 0 ? 0 : 1);
