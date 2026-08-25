#!/usr/bin/env node
// #718: asserts no entry path stamps White Belt without a decision.
// Reads the shipped source (same pattern as verify-t79); fails loud on regression.
const fs = require('fs');
const read = (p) => fs.readFileSync(require('path').join(__dirname, '..', p), 'utf8');

const ui = read('src/js/ui-views.js');
const api = read('src/js/api-supabase.js');
const bulk = read('supabase/functions/bulk-upload-staff/index.ts');
const approve = read('supabase/functions/sbd-approve-registration/index.ts');
const claims = read('supabase/functions/sbd-sync-user-claims/index.ts');

const checks = [
  // 1. Add Staff modal: Unassessed is the first, preselected option.
  ['modal preselects Unassessed', /id="ns-belt"[^>]*><option value="None" selected>Unassessed/.test(ui)],
  // 2. addStaff sends placement_needed explicitly, never inherits the column default.
  ['addStaff sets placementNeeded', /placementNeeded:unassessed/.test(ui)],
  ['mapper carries placement_needed', /placementNeeded !== undefined\) obj\.placement_needed/.test(api)],
  // 3. Bulk upload: blank belt → None, None is a legal CSV value.
  ['bulk blank belt → None', /\|\| 'None'/.test(bulk) && /'None','White'/.test(bulk)],
  ['bulk flags unassessed', /placement_needed: beltTitle === 'None'/.test(bulk)],
  // 4. Registration approval + user-claims sync start rows unassessed.
  ['approve-registration unassessed', /belt: 'None'/.test(approve) && /placement_needed: true/.test(approve)],
  ['sync-user-claims unassessed', /belt: 'None'/.test(claims) && /placement_needed: true/.test(claims)],
  // 5. No write path stamps White by default anymore (display literals like
  //    beltReq:'White' and belt==='White' comparisons are fine; `belt: 'White'` writes are not).
  ['no default-White writes remain', ![ui, bulk, approve, claims].some(src => /belt:\s*'White'\s*[,}]/.test(src))],
  // 6. Display fallbacks no longer invent White for a missing belt.
  ['no || White fallbacks remain', !/\|\|\s*'White'/.test(api) && !/belt\|\|'White'/.test(ui)],
  // 7. Read side (#718 reports): unbelted people are drawn and never labeled "None Belt".
  ['beltLabel/beltName helpers exist', /function beltName\(b\)\{ return \(!b \|\| b==='None'\) \? 'No Belt' : b; \}/.test(read('src/js/utils.js'))],
  ['BELT_DIST ends with None', /const BELT_DIST = \[\.\.\.BELT_ORDER\]\.reverse\(\)\.concat\('None'\)/.test(read('src/js/logic.js'))],
  ['distribution charts iterate BELT_DIST', (ui.match(/BELT_DIST\.map\(/g) || []).length >= 5],
  ['print colour map has None', /BELT_CLR_PRINT = \{None:/.test(ui)],
  // Staff-belt interpolations must route through beltLabel/beltName. Target-belt templates
  // (targetBelt, m.belt, t.belt, nb…) can never be 'None' and are exempt.
  ['no raw staff-belt " Belt" labels remain', !/\$\{(s|st|x|fa|ps|staff|curBelt)(\.belt)?\} Belt/.test(ui) && !/[^A-Za-z](s|fa|staff)\.belt\s*\+\s*' Belt'/.test(ui)],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) failed++;
}
process.exit(failed ? 1 : 0);
