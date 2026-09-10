#!/usr/bin/env node
/* ============================================================================
 * verify-1121-observation-score.js — #1121 (Shawn board 148, ledger T132)
 *
 * Done-when: a leader confirms an observation checklist end to end, the
 * progress row reads g3 pass with a truthful score or null, the module summary
 * shows the same, and NO code path writes 100 without a checklist.
 *
 * An observation is a confirmation, not a percentage. The four curricula used
 * to stamp score:100 the moment the last item was ticked (and score:0 when one
 * was untucked), which reads as a graded 100% nobody measured. This harness
 * drives each engine's real confirm path and asserts the number is simply not
 * there — status carries the whole meaning.
 *
 * The three ways this can silently come back:
 *   1. A curriculum re-adds `p.g3.score=100` on allDone (Foundations,
 *      Instruments, Endoscopy and Preceptor each own their own copy).
 *   2. A summary re-fabricates it downstream via `g3.score||0`, printing 0 for
 *      a gate nobody has opened.
 *   3. The revoke cascade stops reverting `pass -> open` once the score write
 *      that used to sit beside it is gone.
 *
 * NOT in scope, deliberately: the `na:true` shapes (#720 endoscopy g2/g3,
 * #1143, #1123 read mode) carry score:100 too, but they are written and pinned
 * by `sbd_fi_progress_guard` server-side and are explicitly flagged
 * not-applicable. Changing those is a migration, not a client edit.
 *
 * Run:  node scripts/verify-1121-observation-score.js   (exit 0 only if all pass)
 * ==========================================================================*/
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const FND = read('src/js/foundations.js'), INST = read('src/js/instruments.js');
const ENDO = read('src/js/endoscopy.js'), PRC = read('src/js/preceptor.js');
const HTML = read('index.html');

let n = 0; const ok = (c, m) => { assert(c, m); n++; };

// ── the sandbox: these files only declare at load time ─────────────────────
const STAFF = { id: 'staff-1', fid: 'fac-1', name: 'Pat Observed', belt: 'White', role: 'Tech' };
const DB = { staff: [STAFF], facilities: [{ id: 'fac-1', name: 'F1' }],
  foundationsAssignments: [], foundationsProgress: [],
  instrumentAssignments: [], instrumentProgress: [],
  preceptorAssignments: [], preceptorProgress: [] };
const ST = { staffId: STAFF.id, user: { id: 'u1', name: 'Lead', role: 'master_admin' } };
const el = { innerHTML: '', scrollTop: 0 };
const args = [DB, ST, {}, false, { getElementById: () => el, querySelectorAll: () => [] },
  id => DB.staff.find(s => s.id === id), () => {}, s => s.name, { sanitize: x => x },
  () => {}, () => {}, () => true, a => a.slice()];
const load = (src, ret) => new Function('DB', 'ST', 'SB', 'IS_LIVE', 'document', 'getStaff',
  'toast', 'fullName', 'Security', 'openModal', 'closeModal', 'confirm', 'shuffleArray',
  src + '\nreturn {' + ret + '};').apply(null, args);

const fi = load(FND + '\n' + INST,
  'assignModule,assignInstModule,saveGateScore,saveInstGateScore,markG3Item,markInstG3Item,' +
  'getModuleGates,getInstModuleGates,fiModuleSummary,FOUNDATIONS_MODULES,INSTRUMENT_MODULES');
const endo = load(FND + '\n' + ENDO,
  'assignEndoModule,saveEndoGateScore,markEndoG3Item,ENDOSCOPY_MODULES');
const prc = load(FND + '\n' + PRC,
  'assignPrcModule,savePrcGateScore,markPrcG3Item,getPrcModuleGates,prcModuleSummary,PRECEPTOR_MODULES');

// ── 1. Foundations: confirm the checklist end to end ───────────────────────
const fm = fi.FOUNDATIONS_MODULES.find(m => (m.observations || []).length);
fi.assignModule(STAFF.id, fm.id, 'Lead', 'remediation', null);
for (let i = 0; i < 3; i++) { fi.saveGateScore(STAFF.id, fm.id, 'g1', 100); fi.saveGateScore(STAFF.id, fm.id, 'g2', 100); }
fm.observations.forEach(o => fi.markG3Item(STAFF.id, fm.id, o.id, true, 'Lead'));
let g = fi.getModuleGates(STAFF.id, fm.id);
ok(g.g3.status === 'pass', 'foundations: every item confirmed passes the observation gate');
ok(g.g3.score === undefined, 'foundations: the pass carries no fabricated score');
ok(g.complete === true, 'foundations: the module completes on 3 K + 3 S + confirmed observation');
ok(g.g3.items.filter(i => i.confirmed).length === fm.observations.length,
  'foundations: the checklist itself is the evidence, one row per item');

// summary is the ONLY place the number used to escape (report + PDF readers)
let sum = fi.fiModuleSummary(fm, DB.foundationsAssignments[0], g);
ok(sum.gates.observation.status === 'pass', 'summary: observation reads pass');
ok(sum.gates.observation.score === null, 'summary: observation score is null, not 100');
const unassigned = fi.fiModuleSummary(fi.FOUNDATIONS_MODULES[fi.FOUNDATIONS_MODULES.length - 1], null, null);
ok(unassigned.gates.observation.score === null,
  'summary: an untouched gate reports null, not a stand-in 0');

// revoke cascade still works with the score gone
fi.markG3Item(STAFF.id, fm.id, fm.observations[0].id, false, 'Lead');
g = fi.getModuleGates(STAFF.id, fm.id);
ok(g.g3.status === 'open' && g.complete === false, 'foundations: unticking one item revokes the pass');
ok(g.g3.score === undefined, 'foundations: the revoke writes no score either');

// ── 2. Instruments: same engine, its own copy of the branch ────────────────
const im = fi.INSTRUMENT_MODULES.find(m => (m.observations || []).length);
fi.assignInstModule(STAFF.id, im.id, 'Lead', 'remediation', null);
for (let i = 0; i < 3; i++) { fi.saveInstGateScore(STAFF.id, im.id, 'g1', 100); fi.saveInstGateScore(STAFF.id, im.id, 'g2', 100); }
im.observations.forEach(o => fi.markInstG3Item(STAFF.id, im.id, o.id, true, 'Lead'));
const ig = fi.getInstModuleGates(STAFF.id, im.id);
ok(ig.g3.status === 'pass' && ig.complete === true, 'instruments: checklist confirms and completes');
ok(ig.g3.score === undefined, 'instruments: the pass carries no fabricated score');

// ── 3. Endoscopy: capstone is the only module with a real checklist ────────
const em = endo.ENDOSCOPY_MODULES.find(m => (m.observations || []).length);
DB.foundationsProgress.push({ staffId: STAFF.id, moduleId: em.id,
  g1: { status: 'pass', score: 100, attempts: [{ date: '2026-09-11', score: 100 }] },
  g2: { status: 'pass', score: 100, attempts: [], na: true },
  g3: { status: 'open', items: [] }, complete: false });
em.observations.concat(em.writtenAnswers).forEach(o => endo.markEndoG3Item(STAFF.id, em.id, o.id, true, 'Lead'));
const eg = DB.foundationsProgress.find(p => p.moduleId === em.id);
ok(eg.g3.status === 'pass' && eg.complete === true, 'endoscopy: capstone checklist confirms and completes');
ok(eg.g3.score === undefined, 'endoscopy: the pass carries no fabricated score');

// ── 4. Preceptor: its own summary, its own copy of the branch ──────────────
const pm = prc.PRECEPTOR_MODULES[0];
DB.preceptorAssignments.push({ staffId: STAFF.id, moduleId: pm.id, status: 'assigned', assignedDate: '2026-09-11' });
DB.preceptorProgress.push({ staffId: STAFF.id, moduleId: pm.id,
  g1: { status: 'pass', score: 100, attempts: [1, 2, 3].map(() => ({ date: '2026-09-11', score: 100 })) },
  g2: { status: 'pass', score: 0, attempts: [] }, g3: { status: 'open', items: [] }, complete: false });
prc.markPrcG3Item(STAFF.id, pm.id, pm.id + '-cap', true, 'Lead');
const pg = prc.getPrcModuleGates(STAFF.id, pm.id);
ok(pg.g3.status === 'pass' && pg.complete === true, 'preceptor: capstone confirms and completes');
ok(pg.g3.score === undefined, 'preceptor: the pass carries no fabricated score');
const psum = prc.prcModuleSummary(pm, DB.preceptorAssignments[0], pg);
ok(psum.gates.observation.status === 'pass' && psum.gates.observation.score === null,
  'preceptor summary: observation reads pass with a null score');

// ── 5. Source guard: the write cannot creep back into any of the four ──────
[['foundations.js', FND], ['instruments.js', INST], ['endoscopy.js', ENDO], ['preceptor.js', PRC]]
  .forEach(([name, src]) => {
    ok(!/g3\.score\s*=\s*\d/.test(src), name + ': no code path assigns a number to g3.score');
    ok(/if\(allDone\)\{p\.g3\.status='pass';\}/.test(src),
      name + ': the allDone branch sets status alone');
  });
ok(!/observation:\{status:g3\.status,\s*score:g3\.score\|\|0\}/.test(FND + PRC),
  'neither summary re-fabricates a 0 for an untouched observation gate');

// ── 6. Wiring: cache-busters bumped, or the fix never reaches a browser ────
ok(/foundations\.js\?v=25/.test(HTML), 'foundations cache-buster bumped to 25');
ok(/instruments\.js\?v=17/.test(HTML), 'instruments cache-buster bumped to 17');
ok(/preceptor\.js\?v=11/.test(HTML), 'preceptor cache-buster bumped to 11');
ok(/endoscopy\.js\?v=4/.test(HTML), 'endoscopy cache-buster bumped to 4');

console.log('verify-1121-observation-score: ' + n + ' assertions passed');
