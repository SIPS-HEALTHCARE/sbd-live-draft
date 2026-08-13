#!/usr/bin/env node
// Self-check for the No Belt placement approval (Iggie, 2026-08-12) and the T106 fix
// (2026-08-13). Extracts confirmPlacement() from ui-views.js, runs it against stubs, asserts:
//   1. No Belt approval: review keeps confirmed_belt null (so reports keep printing the
//      engine's "No Belt Issued"), staff.belt = 'None', NO gates grandfathered, no since date.
//   2. Normal belt approval is byte-for-byte the old behavior (belt set, gates passed, since set).
//   3. Override of a suggested belt to No Belt reads as 'adjusted'.
//   4. T106: a rejected staff write (e.g. 23514 check violation) commits NOTHING — the review
//      stays pending in memory, no success state, an error toast fires.
//   5. T106: on the live path the staff PATCH goes first and both bodies are correct.
// NOTE: this is a fixture, not a schema test. The DB-side guarantee (staff_belt_check allows
// 'None') can only be verified with the read-only SQL in migration 20260813120000.
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '../src/js/ui-views.js'), 'utf8');
const m = src.match(/async function confirmPlacement\(prId\)\{[\s\S]*?\n\}/);
assert(m, 'async confirmPlacement not found in ui-views.js');

// ── stub factory ───────────────────────────────────────────────────────────
function build(isLive, sbFetchImpl){
  const ctx = {
    staff: {}, DB: { placementReviews: [] }, els: {},
    patches: [], toasts: [],
  };
  const confirmPlacement = new Function(
    'DB','ST','IS_LIVE','document','getStaff','cleanName','updatePlacementBadge',
    'renderAPlacementReviews','toast','sbFetch','handleSyncError',
    m[0] + '; return confirmPlacement;'
  )(ctx.DB, { user: { name: 'Iggie' } }, isLive,
    { getElementById: id => ctx.els[id] || null },
    id => ctx.staff[id], n => n, () => {}, () => {},
    (msg, type) => ctx.toasts.push({ msg, type }),
    sbFetchImpl || ((url, opts) => { ctx.patches.push({ url, opts }); return Promise.resolve(); }),
    () => {});
  return { ctx, confirmPlacement };
}

(async () => {
  // ── case 1: engine suggested No Belt, assessor approves at No Belt ─────────
  const a = build(false);
  a.ctx.staff['s1'] = { id: 's1', belt: 'White', placementNeeded: true };
  a.ctx.DB.placementReviews.push({ id: 'pr1', staffId: 's1', staffName: 'Theresa Mills', tentativeBelt: null, status: 'pending' });
  a.ctx.els['pr-belt-pr1'] = { value: 'None' };
  a.ctx.els['pr-note-pr1'] = { value: '' };
  await a.confirmPlacement('pr1');
  const pr1 = a.ctx.DB.placementReviews[0], s1 = a.ctx.staff['s1'];
  assert.strictEqual(pr1.confirmedBelt, null, 'No Belt must not store a confirmed belt (report override hazard)');
  assert.strictEqual(pr1.status, 'confirmed', 'No Belt matching a No Belt suggestion is a confirmation');
  assert.strictEqual(pr1.confirmedBy, 'Iggie');
  assert.strictEqual(s1.belt, 'None', 'staff stays unbelted');
  assert.strictEqual(s1.cur, undefined, 'No Belt must not grandfather any gates');
  assert.strictEqual(s1.since, undefined, 'No Belt earns no belt date');
  assert.strictEqual(s1.placementNeeded, false);
  assert.strictEqual(s1.history[0].belt, 'None');
  assert.match(s1.history[0].note, /remediation/i);

  // ── case 2: normal belt approval unchanged ─────────────────────────────────
  a.ctx.staff['s2'] = { id: 's2', belt: 'White', placementNeeded: true };
  a.ctx.DB.placementReviews.push({ id: 'pr2', staffId: 's2', staffName: 'Norma L. Case', tentativeBelt: 'Green', status: 'pending' });
  a.ctx.els['pr-belt-pr2'] = { value: 'Green' };
  a.ctx.els['pr-note-pr2'] = { value: '' };
  await a.confirmPlacement('pr2');
  const pr2 = a.ctx.DB.placementReviews[1], s2 = a.ctx.staff['s2'];
  assert.strictEqual(pr2.confirmedBelt, 'Green');
  assert.strictEqual(pr2.status, 'confirmed');
  assert.strictEqual(s2.belt, 'Green');
  assert.deepStrictEqual(s2.cur, { c: 'pass', s: 'pass', o: 'pass' }, 'placement still grandfathers current gates');
  assert(s2.since, 'belt earn date set');

  // ── case 3: assessor overrides a suggested belt to No Belt → adjusted ──────
  a.ctx.staff['s3'] = { id: 's3', belt: 'White', placementNeeded: true };
  a.ctx.DB.placementReviews.push({ id: 'pr3', staffId: 's3', staffName: 'Edge Case', tentativeBelt: 'Yellow', status: 'pending' });
  a.ctx.els['pr-belt-pr3'] = { value: 'None' };
  await a.confirmPlacement('pr3');
  assert.strictEqual(a.ctx.DB.placementReviews[2].status, 'adjusted');
  assert.strictEqual(a.ctx.staff['s3'].belt, 'None');

  // ── case 4 (T106): live write rejected → nothing commits, no success state ─
  const b = build(true, () => Promise.reject(new Error('new row for relation "staff" violates check constraint "staff_belt_check"')));
  b.ctx.staff['s4'] = { id: 's4', belt: 'White', placementNeeded: true };
  b.ctx.DB.placementReviews.push({ id: 'pr4', staffId: 's4', staffName: 'Frederick', tentativeBelt: null, status: 'pending' });
  b.ctx.els['pr-belt-pr4'] = { value: 'None' };
  await b.confirmPlacement('pr4');
  const pr4 = b.ctx.DB.placementReviews[0], s4 = b.ctx.staff['s4'];
  assert.strictEqual(pr4.status, 'pending', 'a failed write must leave the review pending');
  assert.strictEqual(pr4.confirmedBy, undefined, 'no confirmer recorded on failure');
  assert.strictEqual(s4.belt, 'White', 'staff untouched on failure');
  assert.strictEqual(s4.history, undefined, 'no history entry on failure');
  assert.strictEqual(s4.placementNeeded, true, 'placement still flagged on failure');
  assert(b.ctx.toasts.some(t => t.type === 'err'), 'failure must surface an error toast');
  assert(!b.ctx.toasts.some(t => t.type === 'ok'), 'failure must not show the success toast');

  // ── case 5 (T106): live success — staff PATCH first, both bodies correct ───
  const c = build(true);
  c.ctx.staff['s5'] = { id: 's5', belt: 'White', placementNeeded: true };
  c.ctx.DB.placementReviews.push({ id: 'pr5', staffId: 's5', staffName: 'Lindsay Holovachuk', tentativeBelt: null, status: 'pending' });
  c.ctx.els['pr-belt-pr5'] = { value: 'None' };
  await c.confirmPlacement('pr5');
  assert.strictEqual(c.ctx.patches.length, 2, 'both tables written');
  assert.match(c.ctx.patches[0].url, /\/rest\/v1\/staff\?/, 'constraint-prone staff PATCH goes first');
  assert.match(c.ctx.patches[1].url, /\/rest\/v1\/placement_reviews\?/);
  const sBody = c.ctx.patches[0].opts.body, rBody = c.ctx.patches[1].opts.body;
  assert.strictEqual(sBody.belt, 'None');
  assert.strictEqual(sBody.placement_needed, false);
  assert.strictEqual(sBody.history.length, 1, 'exactly one Placement history entry');
  assert.strictEqual(sBody.history[0].type, 'Placement');
  assert(!('since' in sBody) && !('cur_comp' in sBody), 'No Belt grandfathers nothing');
  assert.strictEqual(rBody.confirmed_belt, null);
  assert.strictEqual(rBody.status, 'confirmed');
  assert.strictEqual(rBody.confirmed_by, 'Iggie');
  assert(c.ctx.toasts.some(t => t.type === 'ok'), 'success toast after both writes land');

  console.log('verify-no-belt-placement: all assertions passed');
})().catch(e => { console.error(e); process.exit(1); });
