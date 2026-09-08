#!/usr/bin/env node
/* ============================================================================
 * verify-1123-read-mode.js — #1123 (Shawn board 137) acceptance harness
 *
 * Done-when: a module assigned as 'read' shows no test and completes on the
 * staffer's reading confirmation; one assigned as 'take' behaves as today; the
 * assignment row records the mode; the INSERT body carries it.
 *
 * Loads foundations.js + instruments.js whole (they only declare at load time)
 * with the globals they touch stubbed, then drives the in-memory engine.
 * Run:  node scripts/verify-1123-read-mode.js   (exit 0 only if all pass)
 * ==========================================================================*/
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..');
const FND = fs.readFileSync(path.join(root, 'src/js/foundations.js'), 'utf8');
const INST = fs.readFileSync(path.join(root, 'src/js/instruments.js'), 'utf8');
const HTML = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const MIG = fs.readFileSync(path.join(root, 'supabase/migrations/20260908150000_1123_assignment_mode_read_take.sql'), 'utf8');

const STAFF = { id: 'staff-1', fid: 'fac-1', name: 'Pat Reader', belt: 'White', role: 'Tech' };
const DB = { staff: [STAFF], facilities: [{ id: 'fac-1', name: 'F1' }], foundationsAssignments: [], foundationsProgress: [], instrumentAssignments: [], instrumentProgress: [] };
const ST = { staffId: STAFF.id, user: { name: 'Lead', role: 'facility_admin' } };
const sent = [];                                  // bodies the client would POST
const SB = {
  createFoundationsAssignment: b => (sent.push(['fnd', b]), Promise.resolve()),
  createInstrumentAssignment:  b => (sent.push(['inst', b]), Promise.resolve()),
  upsertFoundationsProgress: () => Promise.resolve(), upsertInstrumentProgress: () => Promise.resolve(),
  updateFoundationsAssignmentStatus: () => Promise.resolve(), updateInstrumentAssignmentStatus: () => Promise.resolve(),
};
let lastHTML = '';
const el = { set innerHTML(v) { lastHTML = v; }, get innerHTML() { return lastHTML; }, scrollTop: 0 };
const document = { getElementById: () => el, querySelectorAll: () => [] };
const api = new Function('DB','ST','SB','IS_LIVE','document','getStaff','toast','fullName','Security','openModal','closeModal','confirm','shuffleArray',
  FND + '\n' + INST + '\n' +
  'return {assignModule,assignInstModule,confirmFndRead,confirmInstRead,fndAssignmentMode,instAssignmentMode,getModuleGates,getInstModuleGates,renderSFoundations,renderSInstruments,openFndModule,openInstModule,hFndStaffDetail,hInstStaffDetail,hAssignFndModal,hAssignInstModal,saveGateScore,fiModuleSummary,FOUNDATIONS_MODULES,INSTRUMENT_MODULES};'
)(DB, ST, SB, true, document, id => DB.staff.find(s => s.id === id), () => {}, s => s.name, { sanitize: x => x }, (t, h) => { lastHTML = h; }, () => {}, () => true, a => a.slice());

let n = 0; const ok = (c, m) => { assert(c, m); n++; };
const fm = api.FOUNDATIONS_MODULES[0].id, fm2 = api.FOUNDATIONS_MODULES[1].id, im = api.INSTRUMENT_MODULES[0].id;

// 1. mode recorded on the row and sent to the backend; default is take
ok(api.assignModule(STAFF.id, fm, 'Lead', 'remediation', null, 'read'), 'read assign created');
ok(api.assignModule(STAFF.id, fm2, 'Lead', 'remediation', null), 'take assign created');
ok(api.assignInstModule(STAFF.id, im, 'Lead', 'onboarding', null, 'read'), 'inst read assign created');
ok(api.fndAssignmentMode(STAFF.id, fm) === 'read', 'fnd row records read');
ok(api.fndAssignmentMode(STAFF.id, fm2) === 'take', 'omitted mode defaults to take');
ok(api.fndAssignmentMode(STAFF.id, 'never-assigned') === 'take', 'unassigned reads as take');
ok(api.instAssignmentMode(STAFF.id, im) === 'read', 'inst row records read');
ok(sent.find(([k, b]) => k === 'fnd' && b.module_id === fm)[1].mode === 'read', 'INSERT body carries mode=read');
ok(sent.find(([k, b]) => k === 'fnd' && b.module_id === fm2)[1].mode === 'take', 'INSERT body carries mode=take');
ok(sent.find(([k]) => k === 'inst')[1].mode === 'read', 'inst INSERT body carries mode');

// 2. staff card + reader: read mode shows the label and no gate, take mode unchanged
api.renderSFoundations();
ok(lastHTML.includes('reading only'), 'staff card shows the reading-only label');
ok(lastHTML.includes('Knowledge 0/3'), 'take-mode card still shows its gates');
ST._fndTab = 'gate1'; api.openFndModule(fm);
ok(!lastHTML.includes('Gate 1: Knowledge') && !lastHTML.includes('Submit'), 'read-mode reader hides the gate tabs and the test');
ok(lastHTML.includes('I have read this module'), 'read-mode reader offers the confirmation');
ST._fndTab = 'gate1'; api.openFndModule(fm2);
ok(lastHTML.includes('Gate 1: Knowledge') && lastHTML.includes('Submit'), 'take-mode reader still has the test');

// 3. completion for read mode = reading confirmed; take mode still needs the 3-gate rule
api.confirmFndRead(fm);
let g = api.getModuleGates(STAFF.id, fm);
ok(g.complete === true && g.g1.read === true && g.g2.na && g.g3.na, 'read confirm completes with na g2/g3');
ok(DB.foundationsAssignments.find(a => a.moduleId === fm).status === 'completed', 'assignment status completed');
ok(lastHTML.includes('Reading confirmed'), 'reader shows confirmed state');
api.confirmFndRead(fm2);
ok(api.getModuleGates(STAFF.id, fm2).complete === false, 'confirm is refused on a take-mode module');
api.saveGateScore(STAFF.id, fm2, 'g1', 100); api.saveGateScore(STAFF.id, fm2, 'g1', 100); api.saveGateScore(STAFF.id, fm2, 'g1', 100);
ok(api.getModuleGates(STAFF.id, fm2).complete === false, 'take mode: 3 knowledge passes alone do not complete');
api.confirmInstRead(im);
ok(api.getInstModuleGates(STAFF.id, im).complete === true, 'instruments read confirm completes');
ok(DB.instrumentAssignments[0].status === 'completed', 'inst assignment status completed');
const sum = api.fiModuleSummary(api.FOUNDATIONS_MODULES[0], DB.foundationsAssignments[0], DB.foundationsProgress.find(p => p.moduleId === fm));
ok(sum.status === 'complete' && sum.completedDateApprox, 'report summary sees the read completion with a date');

// 4. leader views + picker
api.hFndStaffDetail(STAFF.id);
ok(lastHTML.includes('Reading only') && lastHTML.includes('Reading confirmed'), 'leader detail shows read status line');
ok(lastHTML.includes('Gate 3: Confirm Observed Demonstrations'), 'leader detail still shows G3 checklist for the take module');
api.hInstStaffDetail(STAFF.id);
ok(lastHTML.includes('Reading only') && !lastHTML.includes('Gate 3: Confirm Observations'), 'inst leader detail: no checklist for read module');
ST.user.role = 'facility_admin'; api.hAssignFndModal(STAFF.id);
ok(lastHTML.includes('id="fnd-assign-mode"') && lastHTML.includes('value="read"'), 'fnd picker offers read/take');
api.hAssignInstModal(STAFF.id);
ok(lastHTML.includes('id="inst-assign-mode"'), 'inst picker offers read/take');

// 5. wiring: cache-busts bumped, migration carries both tables + guard blocks
ok(/foundations\.js\?v=24/.test(HTML) && /instruments\.js\?v=16/.test(HTML) && /auth-init\.js\?v=45/.test(HTML), 'cache-busters bumped');
ok(/alter table public\.foundations_assignments\s+add column if not exists mode/.test(MIG) && /alter table public\.instrument_assignments\s+add column if not exists mode/.test(MIG), 'migration adds mode to both tables');
ok(MIG.includes("if v_mode = 'read' then") && MIG.includes("new.module_id like 'en-%'") && MIG.includes('set status = v_status'), 'guard: read pin, en-% kept, status mirror');

console.log('verify-1123-read-mode: ' + n + ' assertions passed');
