#!/usr/bin/env node
/* ============================================================================
 * verify-1122-registration-reissue.js — acceptance harness for #1122 (board 155)
 *
 * The re-issue control for one stranded registration: master admin only, same
 * function path as approval, one link, one email, one audit row, 10-minute
 * cooldown, no belt or staff change.
 *
 * Run:  node scripts/verify-1122-registration-reissue.js
 * Exit 0 only if every assertion passes.
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const rd = p => fs.readFileSync(path.join(root, p), 'utf8');
const FN = rd('supabase/functions/sbd-approve-registration/index.ts');
const MIG = rd('supabase/migrations/20260908120000_1122_stranded_registrations_rpc.sql');
const API = rd('src/js/api-supabase.js');
const UI = rd('src/js/ui-views.js');
const INIT = rd('src/js/auth-init.js');
const HTML = rd('index.html');

let passed = 0, failed = 0;
function ok(cond, label, detail) {
  if (cond) { passed++; console.log('  \x1b[32mok\x1b[0m   ' + label); }
  else { failed++; console.log('  \x1b[31mFAIL\x1b[0m ' + label + (detail ? '\n         ' + detail : '')); }
}
const branch = FN.slice(FN.indexOf("if (action === 'reissue_link')"), FN.indexOf("if (regData.status !== 'pending')"));

console.log('\n1. Same function path, one link builder');
ok(branch.length > 0, 'the re-issue branch lives inside sbd-approve-registration');
ok((FN.match(/auth\.admin\.generateLink\(/g) || []).length === 1, 'generateLink still has exactly ONE call site (T115 relies on it)');
ok((FN.match(/buildSetPasswordLink\(regData\.email\)/g) || []).length === 2, 'both paths go through buildSetPasswordLink');
ok(/const REISSUE_COOLDOWN_MS = 10 \* 60 \* 1000/.test(FN), '10-minute cooldown constant');

console.log('\n2. Gates');
ok(/\['master_admin', 'admin'\]\.includes\(profile\.role\)/.test(branch), 'master admin only');
ok(branch.indexOf('mfaDenied') === -1 && FN.indexOf('if (mfaDenied(profile.role, jwt))') < FN.indexOf("if (action === 'reissue_link')"), 'the shared T33 MFA guard runs before the branch');
ok(/regData\.status !== 'approved'/.test(branch), 'only an approved row can be re-issued');
ok(/REISSUE_ROLES\.includes\(assign_role\)/.test(branch) && !/master_admin'|staff_admin'/.test(FN.slice(FN.indexOf('const REISSUE_ROLES'), FN.indexOf('const REISSUE_ROLES') + 120)), 'registration-facing roles only, no SIPS-internal role from this path');
ok(/from\('facilities'\)\.select\('id'\)\.eq\('id', facility_name\)/.test(branch), 'facility must already exist (none is created)');
ok(!/from\('staff'\)/.test(branch) && !/belt/.test(branch.replace(/\/\/[^\n]*/g, '')), 'no staff row, no belt (comments aside)');
ok(!/from\('registrations'\)\.update/.test(branch), 'the registration row itself is not rewritten');

console.log('\n3. Rate limit from the audit row');
ok(/eq\('action', 'registration_link_reissued'\)/.test(branch) && /eq\('detail->>registration_id', registration_id\)/.test(branch) && /\.gte\('created_at', since\)/.test(branch), 'last successful re-issue for THIS registration inside the window');
ok(/httpStatus = 429/.test(branch) && /status: httpStatus/.test(FN), 'a second click inside 10 minutes is refused with 429');
ok(branch.indexOf('registration_link_reissued') < branch.indexOf('createUser('), 'the cooldown check runs before anything is created');

console.log('\n4. One email, one audit row, rollback intact');
ok(/email_exists/.test(branch), 'an existing account is refused (createUser doubles as the existence check)');
ok((branch.match(/from\('sbd_email_queue'\)\.insert\(/g) || []).length === 1 && /template: 'registration_approved'/.test(branch), 'exactly one email, same template as approval');
ok((branch.match(/from\('sbd_account_audit'\)\.insert\(/g) || []).length === 1 && /action: 'registration_link_reissued'/.test(branch) && /actor_auth_uid: adminId/.test(branch), 'exactly one audit row carrying who re-issued');
ok(branch.indexOf("from('sbd_email_queue').insert(") < branch.indexOf("from('sbd_account_audit').insert("), 'audit written LAST, so it records only a re-issue that fully happened');
ok(/createdAuthUserId = authUser\.user\.id/.test(branch) && /createdPortalRow = !existingRow/.test(branch) && /queuedEmailId = queuedRow\?\.id/.test(branch), 'rollback trackers are set so the shared catch can undo a partial re-issue');
ok(!/registrationApproved = true/.test(branch), 'the approve-path flip tracker is never set (nothing to put back to pending)');

console.log('\n5. Listing RPC');
ok(/create or replace function public\.sbd_stranded_registrations\(\)/.test(MIG), 'RPC exists');
ok(/security definer/.test(MIG) && /public\.sbd_is_master_admin\(\)/.test(MIG) && /public\.sbd_mfa_satisfied\(\)/.test(MIG), 'definer inlines master-admin AND aal2 checks (bypasses sbd_mfa_gate otherwise)');
ok(/status = 'approved'/.test(MIG) && /not exists \(select 1 from auth\.users u where lower\(u\.email\) = lower\(r\.email\)\)/.test(MIG), 'same stranded predicate as board 142');
ok(/revoke all on function public\.sbd_stranded_registrations\(\) from anon/.test(MIG) && /grant execute .* to authenticated/.test(MIG), 'anon revoked, authenticated may call (and gets nothing unless master admin)');
ok(/registration_link_reissued/.test(MIG) && /last_reissued_at/.test(MIG), 'returns last_reissued_at for the client-side cooldown hint');

console.log('\n6. Frontend');
ok(/getStrandedRegistrations\(\)\{ return sbFetch\('\/rest\/v1\/rpc\/sbd_stranded_registrations'/.test(API), 'SB.getStrandedRegistrations calls the RPC');
ok(/reissueRegistrationLink\(id, facilityId, assignRole\)\{ return sbFetch\('\/functions\/v1\/sbd-approve-registration'.*action:'reissue_link'/.test(API), 'SB.reissueRegistrationLink posts the action to the same function');
ok(/ST\.user\.role==='master_admin' && typeof SB!=='undefined' && SB\.getStrandedRegistrations/.test(INIT), 'loaded for master admins only, non-blocking');
ok(/function openReissueRegModal\(rid\)/.test(UI) && /async function reissueRegLink\(rid\)/.test(UI), 'modal + handler exist');
ok(/Approved Without an Account/.test(UI) && /openReissueRegModal\('\$\{r\.id\}'\)/.test(UI), 'the card renders a Re-issue button per stranded row');
ok(/const REISSUE_COOLDOWN_MS = 10\*60\*1000/.test(UI) && /coolingDown\?'disabled/.test(UI), 'the button greys inside the cooldown (server still enforces)');
ok(!/'master_admin'|'staff_admin'/.test(UI.slice(UI.indexOf('const roles=[['), UI.indexOf('const roles=[[') + 260)), 'the modal offers no SIPS-internal role');
const v = (f) => Number((HTML.match(new RegExp(f.replace('.', '\\.') + '\\?v=(\\d+)')) || [])[1]);
ok(v('api-supabase.js') >= 67 && v('ui-views.js') >= 231 && v('auth-init.js') >= 43, 'cache-busts bumped (api 67+, ui-views 231+, auth-init 43+)', JSON.stringify([v('api-supabase.js'), v('ui-views.js'), v('auth-init.js')]));

console.log(failed === 0
  ? '\n\x1b[32mAll ' + passed + ' assertions passed.\x1b[0m\n'
  : '\n\x1b[31m' + failed + ' of ' + (passed + failed) + ' assertions FAILED.\x1b[0m\n');
process.exit(failed === 0 ? 0 : 1);
