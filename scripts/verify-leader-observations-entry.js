#!/usr/bin/env node
/* ============================================================================
 * verify-leader-observations-entry.js — leader-portal observations door
 *
 * Client ask (2026-07-30, captured late): the observation consoles were reachable
 * from the admin portal and — since #73 — from the staff portal for a granted
 * assessor, but a facility admin lives in the leader (h-) portal and had no
 * entry at all. The role was meant to reach it; the door was missing.
 *
 * Done when: reachable from facility admin navigation, scoped to that facility
 * server side, and a facility admin at another site cannot read it.
 *
 * The three ways this can silently break:
 *   1. The nav item or the view div is dropped from index.html — the console is
 *      unreachable again, with no error anywhere.
 *   2. renderHView stops setting ovsMount='h' — both consoles then render into
 *      the admin portal's hidden containers and the leader sees a blank screen.
 *   3. The facility filter is dropped from a render function — the counts stop
 *      matching the rows RLS returns.
 *
 * Server-side scope is asserted against the shipped SQL, not the browser: the
 * facility tier of sbd_obs_facility_scope + obs_select_scoped are what actually
 * stop a facility admin at another site.
 *
 * Run:  node scripts/verify-leader-observations-entry.js
 * Exit 0 only if every assertion passes.
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const HTML = read('index.html');
const UI = read('src/js/ui-views.js');
const RLS = read('supabase/migrations/20260703233921_observations_facility_scoping_rls.sql');
const T91 = read('supabase/migrations/20260807120000_t91_review_observations_assessor_facility_scope.sql');

let pass = 0, fail = 0;
const ok = (cond, msg) => { if(cond){ pass++; console.log('  \x1b[32m✓\x1b[0m ' + msg); }
                            else { fail++; console.log('  \x1b[31m✗\x1b[0m ' + msg); } };
const section = t => console.log('\n' + t);

// The body of renderHView, so an assertion cannot be satisfied by the admin or staff mount.
const hView = UI.slice(UI.indexOf('function renderHView('),
                       UI.indexOf('function renderAView('));

section('1. The door exists in the leader portal');
ok(/id="h-nav-observations"[^>]*onclick="hNav\(this,'h-observations'/.test(HTML),
   'index.html: Observations nav item calls hNav into h-observations');
ok(/id="h-nav-observationreviews"[^>]*onclick="hNav\(this,'h-observationreviews'/.test(HTML),
   'index.html: Observation Reviews nav item calls hNav into h-observationreviews');
ok(/id="h-observations"/.test(HTML) && /id="h-observationreviews"/.test(HTML),
   'index.html: both view containers exist (ovsEl resolves h-<view>)');

section('2. Facility admin navigation reveals it');
ok(/_showObs\s*=\s*_showFacAdmin\s*\|\|\s*effIsAssessor\(\)/.test(hView),
   'renderHView: facility admin (or a granted assessor) reveals the nav items');
ok(/'h-nav-observations','h-nav-observationreviews'/.test(hView),
   'renderHView: both nav items are toggled by that gate');
ok(/'h-observations':\s*\(\)\s*=>\s*\{\s*if\(_showObs\)/.test(hView)
   && /'h-observationreviews':\s*\(\)\s*=>\s*\{\s*if\(_showObs\)/.test(hView),
   'renderHView: each view re-checks the gate (a saved sessionStorage view routes by id)');

section('3. The consoles render into this portal, not a hidden one');
ok(/ovsMount\s*=\s*'h'/.test(hView), "renderHView: sets ovsMount='h'");
ok(/'h-observations','h-observationreviews'/.test(hView),
   'renderHView: both views are in the hide list, so leaving one closes it');
ok(/renderAObservations\(\)/.test(hView) && /renderAObservationReviews\(\)/.test(hView),
   'renderHView: reuses the existing render functions — one console, three mounts, no copy');

section('4. Client-side scope matches the server tier');
const fnBody = (name, end) => UI.slice(UI.indexOf('function ' + name), UI.indexOf('function ' + end));
const queue  = fnBody('renderAObservations(', 'ovsOpenCapture(');
const review = fnBody('renderAObservationReviews(', 'confirmObservation(');
const filt = /role === 'facility_admin' \|\| u\.role === 'hospital'\) && u\.fid\)\s*\n?\s*(pool|observerList) = \1\.filter\(\w+ => String\(\w+\.fid\) === String\(u\.fid\)\)/;
ok(filt.test(queue),  'renderAObservations: queue filtered to the leader\'s own facility');
ok(filt.test(review), 'renderAObservationReviews: review pool filtered the same way');
ok(/observerList = observerList\.filter\(s => String\(s\.fid\) === String\(u\.fid\)\)/.test(queue),
   'renderAObservations: the Active Observers tab is scoped too');

section('5. A facility admin at another site cannot read it (server side)');
ok(/create or replace function public\.sbd_obs_facility_scope/.test(RLS),
   'sbd_obs_facility_scope exists — the scope is a DB function, not a UI filter');
ok(/u\.role in \('facility_admin','hospital'\)[\s\S]{0,120}u\.facility_id::text = target_fid::text/.test(RLS),
   'facility tier: facility_admin/hospital match ONLY their own facility_id');
// The live SELECT policy is the T91 rewrite; it must still route through the helper.
ok(/create policy obs_select_scoped on public\.observations[\s\S]{0,400}sbd_obs_facility_scope\(fid\)/.test(T91),
   'obs_select_scoped (current version) still gates reads on sbd_obs_facility_scope(fid)');
ok(!/facility_admin/.test(T91.replace(/--[^\n]*/g, '')) ,
   'the T91 rewrite adds no separate facility_admin branch that could widen the tier');

console.log('\n' + (fail ? '\x1b[31mFAIL\x1b[0m' : '\x1b[32mPASS\x1b[0m') + `  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
