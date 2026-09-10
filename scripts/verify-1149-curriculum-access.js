#!/usr/bin/env node
/* ============================================================================
 * verify-1149-curriculum-access.js — #1149 acceptance harness (board 11 Sep, T133)
 *
 * The four ways this can silently break:
 *   1. The four curricula drift apart between the CHECK constraint, the SQL
 *      gate's IN list and CA_CURRICULA in the client — a curriculum in one and
 *      not the others is either ungated or unfixable from the profile.
 *   2. `preceptor` creeps into this grant, which decision 9 put in
 *      preceptor_access and nowhere else.
 *   3. An assign path stops routing through the refusal, so the RLS policy
 *      rejects the insert and the leader sees nothing but a failed sync.
 *   4. The migration swaps the policies WITHOUT the backfill running first,
 *      which stops every live assignment until each person is granted.
 *
 * Reads the shipped files; re-implements nothing.
 * Run:  node scripts/verify-1149-curriculum-access.js
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

const CA = read('src/js/curriculum-access.js');
const MIG = read('supabase/migrations/20260911130000_1149_curriculum_access.sql');
const FND = read('src/js/foundations.js');
const INST = read('src/js/instruments.js');
const SCR = read('src/js/scripts-module.js');
const ENDO = read('src/js/endoscopy.js');
const UI = read('src/js/ui-views.js');
const AUTH = read('src/js/auth-init.js');
const API = read('src/js/api-supabase.js');
const HTML = read('index.html');

let failed = 0;
function ok(cond, msg) {
  if (cond) { console.log('  ✓ ' + msg); return; }
  console.log('  ✗ ' + msg);
  failed++;
}
function section(t) { console.log('\n' + t); }

/* ── 1. one list of curricula, in three places ───────────────────────────── */
section('1. The four gated curricula agree everywhere');
const clientList = (CA.match(/const CA_CURRICULA = \[([^\]]*)\]/) || [])[1];
ok(!!clientList, 'CA_CURRICULA is declared in curriculum-access.js');
const client = (clientList || '').match(/'([a-z]+)'/g).map(s => s.replace(/'/g, '')).sort();
ok(client.join(',') === 'endoscopy,foundations,instruments,scripts',
  'client list is exactly foundations/instruments/scripts/endoscopy — got ' + client.join(','));

// The CHECK constraint on the table, and the IN list inside the SQL gate.
const checkList = (MIG.match(/check \(curriculum in \(([^)]*)\)\)/) || [])[1];
const sqlCheck = (checkList || '').match(/'([a-z]+)'/g).map(s => s.replace(/'/g, '')).sort();
ok(sqlCheck.join(',') === client.join(','),
  'the curriculum_access CHECK constraint matches the client list');
const gateLists = MIG.match(/m\.curriculum in \('foundations','instruments','scripts','endoscopy'\)/g) || [];
ok(gateLists.length >= 2,
  'sbd_has_curriculum_access() filters on the same four curricula (' + gateLists.length + ' occurrences)');

/* ── 2. preceptor is not in this grant ───────────────────────────────────── */
section('2. Preceptor stays in preceptor_access (decision 9)');
ok(client.indexOf('preceptor') < 0, 'preceptor is absent from CA_CURRICULA');
ok(sqlCheck.indexOf('preceptor') < 0, 'preceptor is absent from the CHECK constraint');
// Prose in the header names preceptor_access to say it is out of scope; what must
// not appear is code reaching into it.
ok(!/DB\.preceptorAccess|PreceptorAccess\(|prcAccessState|prcSetAccess/.test(CA),
  'curriculum-access.js never reads or writes preceptor access');
ok(/prcAccessControlHTML/.test(UI), 'the preceptor profile control is still rendered');

/* ── 3. every assign path carries the refusal ────────────────────────────── */
section('3. The four assign chokepoints refuse an ungranted curriculum');
function fnBody(src, signature, file) {
  const i = src.indexOf(signature);
  if (i < 0) throw new Error('not found in ' + file + ': ' + signature);
  return src.slice(i, i + 1400);
}
ok(/caCanAssignModule\(staffId,moduleId\)/.test(fnBody(FND, 'function assignModule(', 'foundations.js')),
  'foundations assignModule() checks caCanAssignModule (covers Foundations + Endoscopy rows)');
ok(/caCanAssignModule\(sid,mid\)/.test(fnBody(INST, 'function assignInstModule(', 'instruments.js')),
  'assignInstModule() checks caCanAssignModule');
ok(/caCanBeAssigned\(staffId, 'scripts'\)/.test(fnBody(SCR, 'function assignScriptsModule(', 'scripts-module.js')),
  "assignScriptsModule() checks caCanBeAssigned(_, 'scripts')");
ok(/caCanAssignModule\(staffId,moduleId\)/.test(fnBody(ENDO, 'function assignEndoModule(', 'endoscopy.js')),
  'assignEndoModule() checks caCanAssignModule');

section('4. The four leader panels show a reason instead of the Assign button');
ok(/caAssignControlHTML\(r\.s\.id,'foundations'/.test(FND), 'Foundations panel routes Assign through caAssignControlHTML');
ok(/caAssignControlHTML\(r\.s\.id,'instruments'/.test(INST), 'Instruments panel routes Assign through caAssignControlHTML');
ok(/caAssignControlHTML\(staffId, 'scripts'/.test(SCR), 'Scripts cell routes Assign through caAssignControlHTML');
ok(/caAssignControlHTML\(r\.s\.id,'endoscopy'/.test(ENDO), 'Endoscopy panel routes Assign through caAssignControlHTML');
// Bulk assign must refuse loudly, not assign zero modules in silence.
ok(/caCanBeAssigned\(staffId,'foundations'\)/.test(fnBody(FND, 'function hAssignAllFnd(', 'foundations.js')),
  'hAssignAllFnd() refuses with a message rather than assigning nothing');
ok(/caCanBeAssigned\(sid,'instruments'\)/.test(fnBody(INST, 'function hAssignAllInst(', 'instruments.js')),
  'hAssignAllInst() refuses with a message rather than assigning nothing');

/* ── 5. the migration's order and its rollback ───────────────────────────── */
section('5. The migration backfills BEFORE it swaps the policies');
const iBackfill = MIG.indexOf('insert into public.curriculum_access');
const iSwap = MIG.indexOf('drop policy if exists fnd_assign_insert');
ok(iBackfill > 0 && iSwap > 0 && iBackfill < iSwap,
  'the backfill insert comes before the first INSERT-policy swap');
ok(/create table if not exists public\.curriculum_access/.test(MIG) && MIG.indexOf('create table if not exists public.curriculum_access') < iBackfill,
  'the table is created before the backfill');
['fnd_assign_insert', 'inst_assign_insert', 'scr_assign_insert'].forEach(p => {
  const re = new RegExp('create policy ' + p + '[\\s\\S]{0,320}?sbd_has_curriculum_access');
  ok(re.test(MIG), p + ' is recreated with the sbd_has_curriculum_access gate');
  const re2 = new RegExp('create policy ' + p + '[\\s\\S]{0,320}?sbd_fi_can_manage_assignments');
  ok(re2.test(MIG), p + ' still carries sbd_fi_can_manage_assignments');
});
ok(/as restrictive for all to authenticated[\s\S]{0,120}sbd_mfa_satisfied/.test(MIG),
  'the T33/#1144 restrictive sbd_mfa_gate policy is written out explicitly');
ok(/begin;/.test(MIG) && /commit;/.test(MIG), 'the whole migration is one transaction');
ok(!/references public\.staff/.test(MIG),
  'no FK to staff (the three assignment tables have none; it would break the backfill on an orphan row)');

/* ── 6. fail-open, so a bad fetch cannot hide every Assign button ────────── */
section('6. Not-knowing fails OPEN');
ok(/function caLoaded\(\) \{ return Array\.isArray\(DB\.curriculumAccess\); \}/.test(CA),
  'caLoaded() distinguishes null (unknown) from [] (known, nobody granted)');
ok(/if \(!caLoaded\(\)\) return true;/.test(CA), 'caCanBeAssigned() returns true when the grants are unknown');
ok(/return null; \}\)/.test(AUTH) || /return null; \}\)/.test(AUTH.replace(/\s+/g, ' ')),
  'auth-init.js hydrates null (not []) when the curriculum_access fetch fails');
ok(/window\.DB\.curriculumAccess = Array\.isArray\(currAccess\)/.test(AUTH),
  'auth-init.js keeps the null through to DB.curriculumAccess');
ok(/not exists \(\s*select 1 from public\.curriculum_modules/.test(MIG),
  'the SQL gate fails open for a module the registry does not list');

/* ── 7. wiring ───────────────────────────────────────────────────────────── */
section('7. Wiring');
ok(/getCurriculumAccess\(\)/.test(API) && /upsertCurriculumAccess\(row\)/.test(API) && /deleteCurriculumAccess\(staffId, curriculum\)/.test(API),
  'api-supabase.js carries the three accessors (revoke is a DELETE)');
ok(/caAccessControlHTML\(s\.id,context\)/.test(UI), 'renderHProfile renders the grant control');
// B7: the domain lives in its own file. ui-views.js may reference exactly one
// name from it (twice on one line — the typeof guard and the call).
const uiCalls = [...new Set((UI.match(/\bca[A-Z][A-Za-z]*(?=\s*\()/g) || []))];
ok(uiCalls.length === 1 && uiCalls[0] === 'caAccessControlHTML',
  'ui-views.js references exactly one curriculum-access function — got ' + (uiCalls.join(', ') || 'none'));
const tag = HTML.match(/src\/js\/curriculum-access\.js\?v=(\d+)/);
ok(!!tag, 'index.html loads curriculum-access.js with a ?v= cache-bust');
const iCA = HTML.indexOf('src/js/curriculum-access.js');
ok(iCA > HTML.indexOf('src/js/endoscopy.js') && iCA < HTML.indexOf('src/js/ui-views.js'),
  'it loads after endoscopy.js and before ui-views.js');

/* ── 8. the branch itself, run for real ──────────────────────────────────── */
section('8. The gate decides correctly (curriculum-access.js loaded and run)');
const STAFF = { id: 'staff-1', fid: 'fac-1', name: 'Pat Granted', belt: 'White' };
const REGISTRY = [
  { module_id: 'fm-01', curriculum: 'foundations', title: 'F1', sequence: 1, active: true },
  { module_id: 'im-wb', curriculum: 'instruments', title: 'I1', sequence: 1, active: true },
  { module_id: 'en-01', curriculum: 'endoscopy',   title: 'E1', sequence: 1, active: true },
  { module_id: 'scripts', curriculum: 'scripts',   title: 'S',  sequence: 1, active: true },
  { module_id: 'P01', curriculum: 'preceptor',     title: 'P1', sequence: 1, active: true }
];
function loadCA(access) {
  const DB = { curriculumModules: REGISTRY, curriculumAccess: access, staff: [STAFF] };
  const ST = { user: { name: 'Lead', role: 'master_admin' } };
  return new Function('DB', 'ST', 'SB', 'IS_LIVE', 'toast', 'getStaff', 'fullName', 'Security', 'confirm',
    CA + '\nreturn {caCanBeAssigned,caCanAssignModule,caCurricula,caAccessControlHTML,caSetAccess};')
    (DB, ST, undefined, false, () => {}, id => DB.staff.find(x => x.id === id), s => s.name,
     { sanitize: x => x }, () => true);
}

// grants unknown (fetch failed) -> OPEN, or a bad fetch hides every Assign button
let m = loadCA(null);
ok(m.caCanBeAssigned(STAFF.id, 'foundations') === true, 'unknown grants (null) fail OPEN');

// known and empty -> DENY. This is the case that must NOT fail open.
m = loadCA([]);
ok(m.caCanBeAssigned(STAFF.id, 'foundations') === false, 'known-and-empty denies foundations');
ok(m.caCanAssignModule(STAFF.id, 'fm-01') === false, 'and denies it by module id too');
ok(m.caCanAssignModule(STAFF.id, 'P01') === true, 'a preceptor module is not gated here');
ok(m.caCanAssignModule(STAFF.id, 'no-such-module') === true, 'an off-registry module fails OPEN');

// the foundations grant must not carry endoscopy, though both ride foundations_assignments
m = loadCA([{ staffId: STAFF.id, curriculum: 'foundations', grantedBy: 'Lead', grantedAt: '2026-09-11T00:00:00Z' }]);
ok(m.caCanAssignModule(STAFF.id, 'fm-01') === true, 'the foundations grant allows fm-01');
ok(m.caCanAssignModule(STAFF.id, 'en-01') === false, 'and does NOT leak into en-01 (endoscopy)');
ok(m.caCanBeAssigned('someone-else', 'foundations') === false, 'the grant is per person');

// the control reads the registry, names the grantor and the date, and omits preceptor
const html = m.caAccessControlHTML(STAFF.id, 'admin');
ok(m.caCurricula().map(c => c.key).join(',') === 'foundations,instruments,scripts,endoscopy',
  'caCurricula() lists the four the registry knows, in order');
ok(/Granted/.test(html) && /Lead/.test(html) && /2026-09-11/.test(html),
  'the control shows the grantor and the date on a granted row');
ok(/Not granted/.test(html), 'and shows the ungranted curricula as not granted');
// The header tooltip mentions preceptor to say it is granted elsewhere; what must
// not exist is a preceptor ROW or its Grant button.
ok(!/caSetAccess\('staff-1','preceptor'/.test(html),
  'the control never offers a Preceptor grant button (decision 9)');
ok(m.caCurricula().every(c => c.key !== 'preceptor'),
  'and caCurricula() drops preceptor even though the registry lists it');
ok(/caSetAccess\('staff-1','foundations',false/.test(html), 'a granted row offers Revoke');
ok(/caSetAccess\('staff-1','instruments',true/.test(html), 'an ungranted row offers Grant');
const opens = (html.match(/<div/g) || []).length, closes = (html.match(/<\/div>/g) || []).length;
ok(opens === closes, 'the control\'s markup balances (' + opens + ' div open, ' + closes + ' close)');

console.log('\n' + (failed ? '✗ ' + failed + ' assertion(s) failed' : '✓ all #1149 assertions pass'));
process.exit(failed ? 1 : 0);
