#!/usr/bin/env node
/* ============================================================================
 * verify-t79-assessment-grants.js — T79 acceptance harness
 *
 * T79 (client ask, 2026-07-30, two messages five minutes apart): approving an
 * assessment and generating a PIN must be two independent grants, and a new
 * SIPS admin role must start with nothing.
 *
 * ONE RULE, FOUR COPIES. The grant predicate ("does this person hold <grant>
 * at this facility") is written in four places that must agree:
 *     public.sbd_can_issue_pin(uuid) / sbd_can_approve_assessment(uuid)   SQL
 *     supabase/functions/sbd-assessor-pin/index.ts                        server
 *     supabase/functions/sbd-record-assessment/index.ts                   server
 *     effCanIssuePin / effCanApproveAssessment (ui-views.js)              client
 * If they drift, a button appears that the server refuses, or worse, the two
 * permissions quietly re-bundle and nobody notices because everything still
 * "works" for a master admin.
 *
 * The four ways this can silently break:
 *   1. Someone ORs the two grants together in a policy or an allow-list, and
 *      holding one silently carries the other again.
 *   2. 'sips_admin' gets added to a role allow-list or an RLS policy, so the
 *      role stops starting empty.
 *   3. An empty facility list stops meaning "everywhere" on one side only, so
 *      a grant means system-wide on the client and nothing on the server.
 *   4. A null facility starts permitting instead of denying.
 *
 * Run:  node scripts/verify-t79-assessment-grants.js
 * Exit 0 only if every assertion passes.
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const UI  = read('src/js/ui-views.js');
const PIN = read('supabase/functions/sbd-assessor-pin/index.ts');
const REC = read('supabase/functions/sbd-record-assessment/index.ts');
const MIGDIR = path.join(root, 'supabase/migrations-archive');
const T79SQL = read('supabase/migrations-archive/20260812120000_t79_split_assessment_grants.sql');

/* The negative assertions below ("X does NOT reference Y") must read CODE, not prose. The whole
 * point of the comments in these files is that each one names the other grant to explain why it
 * is absent, so a naive regex over the raw text reports the comment as the violation. */
const stripSql = (s) => s.replace(/^\s*--.*$/gm, '');
const stripJs  = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/.*$/gm, '');

let failures = 0;
function ok(cond, label) {
  if (cond) { console.log('  ✓ ' + label); return; }
  failures++;
  console.log('  ✗ ' + label);
}
function section(t) { console.log('\n' + t); }

/* ------------------------------------------------------------------------- *
 * 1. Lift the SHIPPED client helpers and run the truth table against them.
 *    Lifted, not re-implemented — a re-implementation would pass while the
 *    real code was broken, which is the whole failure mode this guards.
 * ------------------------------------------------------------------------- */
function liftFn(src, header, file) {
  const start = src.indexOf(header);
  if (start < 0) throw new Error(`could not find "${header}" in ${file}`);
  // Walk braces from the first { after the header to find the function end.
  let i = src.indexOf('{', start), depth = 0;
  if (i < 0) throw new Error(`no body for "${header}" in ${file}`);
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (depth === 0) return src.slice(start, j + 1); }
  }
  throw new Error(`unbalanced body for "${header}" in ${file}`);
}

const LIFTED = [
  'function _capsOf(u)',
  'function _t79GrantAt(u, key, fid)',
  'function _t79PinRoleAt(u, fid)',
  'function _t79ApproveRoleAt(u, fid)',
  'function effCanIssuePin(fid, u)',
  'function effCanApproveAssessment(fid, u)',
  'function effHasAnyAssessmentGrant(u)',
].map(h => liftFn(UI, h, 'ui-views.js'));

const ROLES_LINE = [
  (UI.match(/^var T79_PIN_ROLES=.*$/m) || [])[0],
  (UI.match(/^var T79_APPROVE_ROLES=.*$/m) || [])[0],
].join('\n').trim() || null;
if (!ROLES_LINE) { console.log('✗ the T79 role-list constants were not found in ui-views.js'); process.exit(1); }

// ST is the only global the lifted helpers touch (via the `u=u||ST.user` default). Every case
// below passes `u` explicitly, so a null session here is correct and keeps the harness honest.
const API = new Function('ST',
  ROLES_LINE + '\n' + LIFTED.join('\n') +
  '\nreturn {effCanIssuePin, effCanApproveAssessment, effHasAnyAssessmentGrant};'
)({ user: null });

const FAC_A = 'aaaaaaaa-0000-0000-0000-000000000001';
const FAC_B = 'bbbbbbbb-0000-0000-0000-000000000002';
const sips = (caps) => ({ role: 'sips_admin', fid: null, assignedFids: [], capabilities: caps });

section('1. The two grants are independently holdable (the whole point of T79)');
{
  const pinOnly = sips({ issue_pin: true });
  const aprOnly = sips({ approve_assessment: true });
  ok(API.effCanIssuePin(FAC_A, pinOnly) === true,          'PIN-only grant CAN generate a PIN');
  ok(API.effCanApproveAssessment(FAC_A, pinOnly) === false, 'PIN-only grant CANNOT approve');
  ok(API.effCanApproveAssessment(FAC_A, aprOnly) === true,  'approve-only grant CAN approve');
  ok(API.effCanIssuePin(FAC_A, aprOnly) === false,          'approve-only grant CANNOT generate a PIN');

  const both = sips({ issue_pin: true, approve_assessment: true });
  ok(API.effCanIssuePin(FAC_A, both) && API.effCanApproveAssessment(FAC_A, both),
     'both grants together give both permissions');
}

section('2. A fresh SIPS admin reaches nothing');
{
  const fresh = sips({});
  ok(API.effCanIssuePin(FAC_A, fresh) === false,          'no PIN generation');
  ok(API.effCanApproveAssessment(FAC_A, fresh) === false, 'no approval');
  ok(API.effHasAnyAssessmentGrant(fresh) === false,       'no assessment nav (portal is empty)');
  ok(API.effCanIssuePin(null, fresh) === false,            'and a null facility does not open a door');
}

section('3. Facility scope: absent/empty = everywhere, listed = only those, null fid denies');
{
  const wide    = sips({ issue_pin: true });                                  // no list at all
  const emptied = sips({ issue_pin: true, issue_pin_facilities: [] });        // empty list
  const scoped  = sips({ issue_pin: true, issue_pin_facilities: [FAC_A] });
  ok(API.effCanIssuePin(FAC_A, wide) && API.effCanIssuePin(FAC_B, wide),      'absent list = every facility');
  ok(API.effCanIssuePin(FAC_B, emptied) === true,                             'empty list = every facility (mirrors the SQL)');
  ok(API.effCanIssuePin(FAC_A, scoped) === true,                              'scoped grant permits a listed facility');
  ok(API.effCanIssuePin(FAC_B, scoped) === false,                             'scoped grant refuses an unlisted facility');
  ok(API.effCanIssuePin(null, scoped) === false,                              'scoped grant + null facility denies, never leaks');
  ok(API.effCanIssuePin(null, wide) === true,                                 'system-wide grant + null facility still permits');
}

section('4. No live holder lost a permission when T79 shipped (additive-only decision)');
{
  const master  = { role: 'master_admin', fid: null, assignedFids: [], capabilities: {} };
  const scopedA = { role: 'staff_admin', fid: null, assignedFids: [FAC_A], capabilities: {} };
  const openSA  = { role: 'staff_admin', fid: null, assignedFids: [], capabilities: {} };
  const facAdm  = { role: 'facility_admin', fid: FAC_A, assignedFids: [], capabilities: {} };
  ok(API.effCanIssuePin(FAC_B, master) && API.effCanApproveAssessment(FAC_B, master), 'master_admin keeps both, anywhere');
  ok(API.effCanIssuePin(FAC_A, scopedA) === true,  'staff_admin keeps PIN generation at an assigned facility');
  ok(API.effCanIssuePin(FAC_B, scopedA) === false, 'staff_admin is still bounded by assigned_facility_ids');
  ok(API.effCanIssuePin(FAC_B, openSA) === true,   'staff_admin with an empty assigned list keeps every facility (unchanged rule)');
  ok(API.effCanApproveAssessment(FAC_A, facAdm) === true,  'facility_admin keeps the record-outcome half at its own facility');
  ok(API.effCanApproveAssessment(FAC_B, facAdm) === false, 'facility_admin does not reach another facility');
  ok(API.effCanIssuePin(FAC_A, facAdm) === false,  'facility_admin still has no PIN generation (it never did)');

  const plainStaff = { role: 'staff_member', fid: FAC_A, assignedFids: [], capabilities: {} };
  ok(API.effCanIssuePin(FAC_A, plainStaff) === false && API.effCanApproveAssessment(FAC_A, plainStaff) === false,
     'a plain staff_member holds neither');
}

section('4b. The client is never WIDER than the narrowest server gate');
{
  // Each of these caught a real drift while T79 was being written. A hidden button that would have
  // worked is a nuisance; a visible button the server refuses mid-action is the bug. So where the
  // two server paths disagree, the client must follow the stricter one.

  // sbd-assessor-pin has no master_admin-style bypass for system_admin — it is bounded by
  // assigned_facility_ids like everyone else. Sharing one role rule across both grants made the
  // client say yes here while the server said no.
  const sysScoped = { role: 'system_admin', fid: null, assignedFids: [FAC_A], capabilities: {} };
  ok(API.effCanIssuePin(FAC_B, sysScoped) === false,
     'system_admin with a scoped assigned list cannot generate a PIN elsewhere (pin gate has no bypass)');
  ok(API.effCanApproveAssessment(FAC_B, sysScoped) === true,
     'but system_admin IS network-wide for recording an outcome (sbd-record-assessment unscopedRoles)');

  // "Empty assigned list means everywhere" is a staff_admin rule only. sbd-record-assessment gives
  // the facility-bound roles own-facility-or-assigned-membership, with no empty-means-everywhere.
  const facAdmEmpty = { role: 'facility_admin', fid: FAC_A, assignedFids: [], capabilities: {} };
  const eduEmpty    = { role: 'educator',       fid: FAC_A, assignedFids: [], capabilities: {} };
  ok(API.effCanApproveAssessment(FAC_B, facAdmEmpty) === false,
     'facility_admin with an empty assigned list does NOT reach another facility');
  ok(API.effCanApproveAssessment(FAC_A, facAdmEmpty) === true,
     'facility_admin still reaches its own facility');
  ok(API.effCanApproveAssessment(FAC_B, eduEmpty) === false,
     'educator with an empty assigned list does NOT reach another facility');
  ok(API.effCanIssuePin(FAC_B, eduEmpty) === true,
     'but educator DOES keep PIN generation everywhere on an empty list (sbd-assessor-pin rule, unchanged)');
}

section('5. The independence invariant, checked in the server code itself');
{
  // The failure that matters most: someone ORs the grants back together. These assertions read
  // the shipped files, so re-bundling fails the harness even if every unit test still passes.
  // Bounded slice, not slice-to-end: staff_select below aq_update legitimately references the PIN
  // grant (reads), so an unbounded slice would report the read fix as a re-bundle.
  const policyBody = (name) => {
    const from = T79SQL.indexOf('create policy ' + name);
    if (from < 0) throw new Error('policy not found: ' + name);
    const end = T79SQL.indexOf('\n);', from);
    return stripSql(T79SQL.slice(from, end < 0 ? T79SQL.length : end));
  };
  const aqUpdate = policyBody('aq_update');
  ok(/sbd_can_approve_assessment\(facility_id\)/.test(aqUpdate), 'aq_update honours the approve grant');
  ok(!/sbd_can_issue_pin/.test(aqUpdate),                        'aq_update does NOT honour the PIN grant (writes stay split)');

  // A grant that authorises a write but not the read it needs is half-shipped: RLS returns fewer
  // rows silently, so the screen just looks empty. Reads are shared; writes are not.
  const staffSelect = policyBody('staff_select');
  ok(/sbd_can_issue_pin\(fid\)/.test(staffSelect) && /sbd_can_approve_assessment\(fid\)/.test(staffSelect),
     'staff_select lets BOTH grants read the staff they apply to');
  ok(/or sbd_is_assessor\(fid\)/.test(staffSelect) && /id = auth\.uid\(\)/.test(staffSelect),
     'staff_select keeps its pre-T79 branches (copied from 20260730170000)');
  ok(/create or replace function public\.sbd_can_issue_pin\(p_fid uuid\)/.test(T79SQL),        'sbd_can_issue_pin exists');
  ok(/create or replace function public\.sbd_can_approve_assessment\(p_fid uuid\)/.test(T79SQL),'sbd_can_approve_assessment exists');
  ok(/jsonb_array_length\(p\.capabilities->'issue_pin_facilities'\) = 0/.test(T79SQL),
     'the SQL treats an empty PIN facility list as system wide, matching the client helper');

  const pinCode = stripJs(PIN), recCode = stripJs(REC);
  ok(/issue_pin/.test(pinCode),               'sbd-assessor-pin checks the PIN grant');
  ok(!/approve_assessment/.test(pinCode),     'sbd-assessor-pin does NOT check the approve grant');
  ok(/approve_assessment/.test(recCode),      'sbd-record-assessment checks the approve grant');
  ok(!/issue_pin/.test(recCode),              'sbd-record-assessment does NOT check the PIN grant');
}

section("6. 'sips_admin' is in no server allow-list and no policy — that is why it starts empty");
{
  ok(!/sips_admin/.test(stripJs(PIN)), "sbd-assessor-pin never names sips_admin");
  ok(!/sips_admin/.test(stripJs(REC)), "sbd-record-assessment never names sips_admin");
  const offenders = fs.readdirSync(MIGDIR)
    .filter(f => f.endsWith('.sql'))
    .filter(f => /sips_admin/.test(stripSql(fs.readFileSync(path.join(MIGDIR, f), 'utf8'))));
  ok(offenders.length === 0, 'no migration grants sips_admin anything' +
     (offenders.length ? ' (found in: ' + offenders.join(', ') + ')' : ''));
}

section('7. The client-side gate is a second line, not the enforcement');
{
  // If these guards vanish the server still refuses; if the SERVER checks vanish, nothing does.
  ok(/_t79GateApprove/.test(UI),                          'approve/deny share one client guard');
  ok(/function showGeneratePinModal/.test(UI) && /effCanIssuePin\(s\.fid\)/.test(UI),
     'every PIN caller routes through one guard in showGeneratePinModal');
  ok(/'sips_admin'/.test(UI) && /roleMap/.test(UI),        'sips_admin is mapped to a portal (not left to the hospital default)');
}

console.log('\n' + (failures ? `✗ ${failures} assertion(s) failed` : '✓ all T79 assertions passed'));
process.exit(failures ? 1 : 0);
