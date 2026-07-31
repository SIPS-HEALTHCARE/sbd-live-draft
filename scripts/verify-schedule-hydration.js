#!/usr/bin/env node
/* ============================================================================
 * verify-schedule-hydration.js — QA 2026-07-29 findings 1 and 2
 *
 * Zero-dependency check on the leader-portal schedule read path. Extracts the
 * real _loadFacilitySchedule / _mergeRowsById from src/js/ui-views.js and the
 * real mappers from src/js/api-supabase.js, then runs them against a stub SB.
 * No Supabase access, no browser.
 *
 *   node scripts/verify-schedule-hydration.js
 *
 * What it proves:
 *   1. Hydration    a stored row lands in DB.schedule/DB.attendance, mapped
 *   2. No doubling  a row already held locally is replaced, not appended
 *   3. Finding 2    after hydration the DB.schedule.find(...) lookup that
 *                   saveShift/execBulkSchedule/importScheduleCSV use to choose
 *                   update-vs-create finds the row -- the miss that wrote
 *                   duplicates is what this closes
 *   4. Fetch count  once per (facility, year); the viewed year and the current
 *                   year are both covered, neither fetched twice
 *   5. Retry        a failed load clears its flag so the next render retries
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const UI = fs.readFileSync(path.join(ROOT, 'src/js/ui-views.js'), 'utf8');
const API = fs.readFileSync(path.join(ROOT, 'src/js/api-supabase.js'), 'utf8');

let passed = 0, failed = 0;
function ok(cond, label) {
  if (cond) { passed++; console.log(`  \x1b[32mPASS\x1b[0m  ${label}`); }
  else { failed++; console.log(`  \x1b[31mFAIL\x1b[0m  ${label}`); }
}

// Pull one `function name(...){...}` out of a source file by brace matching.
function extractFn(src, name) {
  const start = src.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`${name} not found -- was it renamed?`);
  let depth = 0, i = src.indexOf('{', start);
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (depth === 0) return src.slice(start, j + 1); }
  }
  throw new Error(`unbalanced braces in ${name}`);
}

// The loader block is contiguous: the flag map, the merge helper, the loader.
const blockStart = UI.indexOf('const _schedLoaded = {};');
const blockEnd = UI.indexOf('function renderHSchedule(){');
if (blockStart < 0 || blockEnd < blockStart) throw new Error('loader block not found in ui-views.js');
const LOADER_SRC = UI.slice(blockStart, blockEnd);

const MAPPERS_SRC = extractFn(API, 'mapScheduleFromBackend') + '\n' + extractFn(API, 'mapAttendanceFromBackend');

// Build a fresh sandbox per case so the per-(fid,year) flag map starts empty.
function sandbox({ schedule = [], attendance = [], fetcher }) {
  const DB = { schedule, attendance };
  const ST = { portal: 'h', hView: 'h-schedule' };
  const calls = [];
  const SB = {
    getSchedule(fid, s, e) { calls.push({ t: 'sch', fid, s, e }); return fetcher('sch', fid, s, e); },
    getFacilityAttendance(fid, s, e) { calls.push({ t: 'att', fid, s, e }); return fetcher('att', fid, s, e); }
  };
  let renders = 0;
  const factory = new Function(
    'DB', 'ST', 'SB', 'IS_LIVE', 'console', '_refreshHAtt', 'renderXSchedule',
    MAPPERS_SRC + '\n' + LOADER_SRC + '\nreturn {_loadFacilitySchedule,_mergeRowsById,_schedLoaded};'
  );
  const api = factory(DB, ST, SB, true, { warn() {} }, () => { renders++; }, () => {});
  return { DB, SB, api, calls, renders: () => renders };
}

const NOW = new Date().getFullYear();
const schRow = (id, date, shift) => ({
  id, facility_id: 'fac-1', date, shift, assigned_staff: ['staff-a'],
  published_by: 'leader-1', notes: 'TEST', zone_assignments: {}
});
const attRow = (id, date) => ({
  id, facility_id: 'fac-1', date, shift: 'AM', staff_id: 'staff-a', status: 'pto', marked_by: 'leader-1'
});
const flush = () => new Promise(r => setImmediate(r));

async function main() {
  console.log('\n\x1b[1mQA 2026-07-29 findings 1 and 2 -- schedule read path\x1b[0m\n');

  /* 1 + 2 + 3 */
  {
    const stored = schRow('row-1', `${NOW}-07-30`, 'AM');
    const box = sandbox({
      // A row created earlier in this same session, stale: no notes, no publish stamp.
      schedule: [{ id: 'row-1', fid: 'fac-1', date: `${NOW}-07-30`, shift: 'AM', assignedStaff: [], publishedBy: null, notes: '', zoneAssignments: {} }],
      fetcher: t => Promise.resolve(t === 'sch' ? [stored] : [attRow('att-1', `${NOW}-07-30`)])
    });
    box.api._loadFacilitySchedule('fac-1', NOW);
    await flush();

    ok(box.DB.schedule.length === 1, 'stored row merges over the session row instead of doubling it');
    const s = box.DB.schedule[0];
    ok(s.fid === 'fac-1' && s.publishedBy === 'leader-1' && s.notes === 'TEST',
      'row is mapped through mapScheduleFromBackend (fid, publishedBy, notes)');
    ok(box.DB.attendance.length === 1 && box.DB.attendance[0].status === 'pto',
      'attendance hydrates for the whole facility, not one date');

    // The exact lookup saveShift / execBulkSchedule / importScheduleCSV use.
    const found = box.DB.schedule.find(x => x.fid === 'fac-1' && x.date === `${NOW}-07-30` && x.shift === 'AM');
    ok(!!found, 'finding 2: the update-vs-create lookup now finds the stored row');
    ok(box.renders() === 1, 'one re-render once rows arrive');
  }

  /* an unrelated stored row is appended, not swallowed */
  {
    const box = sandbox({
      schedule: [{ id: 'local-only', fid: 'fac-1', date: `${NOW}-08-01`, shift: 'PM', assignedStaff: ['x'], publishedBy: null, notes: '', zoneAssignments: {} }],
      fetcher: t => Promise.resolve(t === 'sch' ? [schRow('row-2', `${NOW}-07-30`, 'AM')] : [])
    });
    box.api._loadFacilitySchedule('fac-1', NOW);
    await flush();
    ok(box.DB.schedule.length === 2, 'a stored row with a new id is appended alongside existing rows');
  }

  /* awaitable: what execBulkSchedule / importScheduleCSV rely on before choosing
     update-vs-create. Awaiting the loader must guarantee the rows are merged. */
  {
    const box = sandbox({
      fetcher: t => Promise.resolve(t === 'sch' ? [schRow('row-4', `${NOW}-07-30`, 'AM')] : [])
    });
    await box.api._loadFacilitySchedule('fac-1');
    ok(box.DB.schedule.length === 1, 'awaiting the loader resolves after the rows are merged');
    // Second await must not re-fetch, and must still be awaitable (cached promise, not `true`).
    const before = box.calls.length;
    await box.api._loadFacilitySchedule('fac-1');
    ok(box.calls.length === before, 'awaiting an already-loaded facility-year does not re-fetch');
  }

  /* 4 */
  {
    const box = sandbox({ fetcher: () => Promise.resolve([]) });
    box.api._loadFacilitySchedule('fac-1', NOW);
    box.api._loadFacilitySchedule('fac-1', NOW);
    await flush();
    ok(box.calls.length === 2, `current year fetched once (schedule + attendance), got ${box.calls.length}`);

    box.api._loadFacilitySchedule('fac-1', NOW - 2);
    await flush();
    const years = new Set(box.calls.map(c => c.s.slice(0, 4)));
    ok(box.calls.length === 4, `viewing an older year adds exactly one fetch pair, got ${box.calls.length}`);
    ok(years.has(String(NOW)) && years.has(String(NOW - 2)), 'both the current year and the viewed year are covered');
    ok(box.calls.every(c => c.s.endsWith('-01-01') && c.e.endsWith('-12-31')), 'each fetch spans a full calendar year');

    box.api._loadFacilitySchedule('fac-2', NOW);
    await flush();
    ok(box.calls.length === 6, 'a second facility loads independently');
  }

  /* 5 */
  {
    let attempt = 0;
    const box = sandbox({
      fetcher: t => { if (attempt === 0 && t === 'sch') return Promise.reject(new Error('boom')); return Promise.resolve(t === 'sch' ? [schRow('row-3', `${NOW}-07-30`, 'AM')] : []); }
    });
    box.api._loadFacilitySchedule('fac-1', NOW);
    await flush();
    ok(box.DB.schedule.length === 0, 'a failed load leaves the arrays alone');
    attempt = 1;
    box.api._loadFacilitySchedule('fac-1', NOW);
    await flush();
    ok(box.DB.schedule.length === 1, 'the failed year is retried on the next render, not cached as done');
  }

  console.log(`\n  ${passed} passed, ${failed} failed.\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(2); });
