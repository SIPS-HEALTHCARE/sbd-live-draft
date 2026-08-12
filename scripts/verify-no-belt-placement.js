#!/usr/bin/env node
// Self-check for the No Belt placement approval (Iggie, 2026-08-12).
// Extracts confirmPlacement() from ui-views.js, runs it against stubs, and asserts:
//   1. No Belt approval: review keeps confirmed_belt null (so reports keep printing the
//      engine's "No Belt Issued"), staff.belt = 'None', NO gates grandfathered, no since date.
//   2. Normal belt approval is byte-for-byte the old behavior (belt set, gates passed, since set).
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '../src/js/ui-views.js'), 'utf8');
const m = src.match(/function confirmPlacement\(prId\)\{[\s\S]*?\n\}/);
assert(m, 'confirmPlacement not found in ui-views.js');

// ── stubs ──────────────────────────────────────────────────────────────────
const staff = {};
const DB = { placementReviews: [] };
const ST = { user: { name: 'Iggie' } };
const IS_LIVE = false;
const patches = [];
const els = {};
const document = { getElementById: id => els[id] || null };
const getStaff = id => staff[id];
const cleanName = n => n;
const updatePlacementBadge = () => {};
const renderAPlacementReviews = () => {};
const toast = () => {};
const sbFetch = (url, opts) => { patches.push({ url, opts }); return Promise.resolve(); };
const handleSyncError = () => {};

const confirmPlacement = new Function(
  'DB','ST','IS_LIVE','document','getStaff','cleanName','updatePlacementBadge',
  'renderAPlacementReviews','toast','sbFetch','handleSyncError',
  m[0] + '; return confirmPlacement;'
)(DB, ST, IS_LIVE, document, getStaff, cleanName, updatePlacementBadge,
  renderAPlacementReviews, toast, sbFetch, handleSyncError);

// ── case 1: engine suggested No Belt, assessor approves at No Belt ─────────
staff['s1'] = { id: 's1', belt: 'White', placementNeeded: true };
DB.placementReviews.push({ id: 'pr1', staffId: 's1', staffName: 'Theresa Mills', tentativeBelt: null, status: 'pending' });
els['pr-belt-pr1'] = { value: 'None' };
els['pr-note-pr1'] = { value: '' };
confirmPlacement('pr1');
const pr1 = DB.placementReviews[0], s1 = staff['s1'];
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
staff['s2'] = { id: 's2', belt: 'White', placementNeeded: true };
DB.placementReviews.push({ id: 'pr2', staffId: 's2', staffName: 'Norma L. Case', tentativeBelt: 'Green', status: 'pending' });
els['pr-belt-pr2'] = { value: 'Green' };
els['pr-note-pr2'] = { value: '' };
confirmPlacement('pr2');
const pr2 = DB.placementReviews[1], s2 = staff['s2'];
assert.strictEqual(pr2.confirmedBelt, 'Green');
assert.strictEqual(pr2.status, 'confirmed');
assert.strictEqual(s2.belt, 'Green');
assert.deepStrictEqual(s2.cur, { c: 'pass', s: 'pass', o: 'pass' }, 'placement still grandfathers current gates');
assert(s2.since, 'belt earn date set');

// ── case 3: assessor overrides a suggested belt to No Belt → adjusted ──────
staff['s3'] = { id: 's3', belt: 'White', placementNeeded: true };
DB.placementReviews.push({ id: 'pr3', staffId: 's3', staffName: 'Edge Case', tentativeBelt: 'Yellow', status: 'pending' });
els['pr-belt-pr3'] = { value: 'None' };
confirmPlacement('pr3');
assert.strictEqual(DB.placementReviews[2].status, 'adjusted');
assert.strictEqual(staff['s3'].belt, 'None');

console.log('verify-no-belt-placement: all assertions passed');
