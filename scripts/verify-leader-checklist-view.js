#!/usr/bin/env node
/* ============================================================================
 * verify-leader-checklist-view.js — T30 acceptance harness
 *
 * T30 (client ask, promised in writing 2026-07-25): a facility leader can read
 * the observation checklist their people are scored against, and still cannot
 * change it. One checklist per belt, shared platform-wide, SIPS-maintained.
 *
 * Three things can quietly break this screen, so all three are asserted against
 * the REAL shipped functions lifted out of src/js/ui-views.js:
 *
 *   1. NO EDIT CONTROL. The Done-when is "no edit control anywhere on it". A
 *      copied-in button or input from the observer console would satisfy a
 *      screenshot and violate the promise.
 *   2. BLACK BELT IS NOT EMPTY. The Black instrument carries items = [] with its
 *      dimensions in schema.components. A hand-rolled cl.items.map renders a
 *      blank screen for the one belt that certifies independent work — which is
 *      why this renders through ovsScorableUnits, the same flatten the observer
 *      console scores.
 *   3. ITEM TEXT IS ESCAPED. Checklist text is SIPS-authored, not leader-authored,
 *      but it still reaches innerHTML, so it goes through esc0 like the console.
 *
 * Run:  node scripts/verify-leader-checklist-view.js
 * Exit 0 only if every assertion passes.
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'src/js/ui-views.js'), 'utf8');

// Lift a top-level `function name(...){ ... }` out of the browser bundle. Same
// trick as verify-observation-evidence-gate.js: top-level declarations close on
// a brace at column 0.
function lift(name) {
  const lines = SRC.split('\n');
  const start = lines.findIndex(l => l.startsWith('function ' + name + '('));
  if (start === -1) throw new Error('function not found in ui-views.js: ' + name);
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i] === '}') return lines.slice(start, i + 1).join('\n');
  }
  throw new Error('unterminated function: ' + name);
}

/* ---- browser stand-ins ---- */
// esc0 is a one-liner in ui-views.js so lift() cannot bound it; this mirrors what
// Security.sanitize does to the characters that matter for innerHTML.
const PRELUDE = `
  const BELT_ORDER = ['White','Yellow','Green','Blue','Brown','Black'];
  function esc0(v){ return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  let __html = '';
  const ST = {};
  const document = { getElementById: () => ({ set innerHTML(v){ __html = v; }, get innerHTML(){ return __html; } }) };
  const window = {};
  let DB = { observationChecklists: [] };
  window.DB = DB;
`;

const sandbox = new Function(
  PRELUDE + lift('ovsScorableUnits') + '\n' + lift('ovsPassRule') + '\n' + lift('renderHChecklists') +
  `\nreturn { render(rows, belt){ DB.observationChecklists = rows; window.DB = DB; ST._clBelt = belt; renderHChecklists(); return __html; } };`
)();

/* ---- the live instrument shapes, per the 2026-08-07 prod read ---- */
const WHITE = { belt:'White', active:true, schema:{ type:'points', floorPoints:55 },
  items: [{ id:'w1', n:1, text:'Verifies the load contents against the count sheet', type:'M' }] };
const GREEN = { belt:'Green', active:true, schema:{ type:'mr', rules:{ advance:{ minRecommended:4 } } },
  items: [{ id:'g1', n:1, text:'Sets the cycle parameters', type:'M' }, { id:'g2', n:2, text:'Logs the biological indicator', type:'R' }] };
const BROWN = { belt:'Brown', active:true, schema:{ type:'composite', presentation:[{ id:'p1', n:1, text:'Opens with the safety case' }] },
  items: [{ id:'b1', n:1, text:'Leads the shift huddle', type:'M' }] };
// The trap: Black has NO items. Its dimensions live in schema.components.
const BLACK = { belt:'Black', active:true, items: [],
  schema:{ type:'components', components:[{ name:'Certification Component 1', dims:[
    { id:'d1', text:'Runs the department for a full shift unsupervised' },
    { id:'d2', text:'Escalates a failed load without prompting' } ] }] } };
const PLACEMENT = { belt:'Placement-Initial', active:true, schema:{ type:'tiered', tiers:[{ label:'White', places:'White' }] },
  items: [{ id:'t1', n:1, text:'Names the instrument categories', tier:'White' }] };
const ALL = [WHITE, GREEN, BROWN, BLACK, PLACEMENT];

/* ---- tiny test framework ---- */
let passed = 0, failed = 0;
function ok(name, cond, detail) {
  if (cond) { passed++; console.log('  ✓ ' + name); }
  else { failed++; console.log('  ✗ ' + name + (detail ? '\n      ' + detail : '')); }
}

console.log('\nT30 — leader read-only checklist view\n');

console.log('1. No edit control anywhere on the screen');
ALL.forEach(cl => {
  const html = sandbox.render(ALL, cl.belt);
  const writey = /<input|<textarea|<button|contenteditable|onclick=/i.exec(html);
  ok(cl.belt + ' renders no input, textarea, button or click handler',
     !writey, writey ? 'found: ' + writey[0] : '');
});
// The one handler on the screen is the picker, and it only re-renders.
const pickerHtml = sandbox.render(ALL, 'White');
ok('the only handler is the picker onchange, which re-renders and nothing else',
   (pickerHtml.match(/on[a-z]+=/gi) || []).every(h => h.toLowerCase() === 'onchange=') &&
   /onchange="ST\._clBelt=this\.value;renderHChecklists\(\)"/.test(pickerHtml));
ok('no api / sbFetch / save call appears in the rendered markup',
   !/sbFetch|api\.|saveDemoData|ovsScore\(|ovsNote\(/.test(pickerHtml));

console.log('\n2. Black belt renders its dimensions, not an empty list');
const black = sandbox.render(ALL, 'Black');
ok('Black shows dimension text from schema.components',
   black.includes('Runs the department for a full shift unsupervised') &&
   black.includes('Escalates a failed load without prompting'));
ok('Black reports 2 scored items, not 0', /2 scored items/.test(black),
   'a cl.items.map would report 0 here');
ok('Black shows the components pass rule', /every component dimension must pass/i.test(black));

console.log('\n3. Every live schema kind renders its scored units');
[[WHITE,'Verifies the load contents'], [GREEN,'Logs the biological indicator'],
 [BROWN,'Opens with the safety case'], [PLACEMENT,'Names the instrument categories']].forEach(([cl, needle]) => {
  const html = sandbox.render(ALL, cl.belt);
  ok(cl.schema.type + ' (' + cl.belt + ') renders its units', html.includes(needle));
});
ok('composite renders BOTH Part A and Part B',
   sandbox.render(ALL, 'Brown').includes('Leads the shift huddle') &&
   sandbox.render(ALL, 'Brown').includes('Opens with the safety case'));

console.log('\n4. Placement instruments are offered in their own group');
ok('picker carries both optgroups', /Belt Instruments/.test(pickerHtml) && /Placement Instruments/.test(pickerHtml));
ok('belts are listed in BELT_ORDER', pickerHtml.indexOf('>White<') < pickerHtml.indexOf('>Green<'));

console.log('\n5. Item text is escaped on the way to innerHTML');
const XSS = { belt:'White', active:true, schema:{ type:'points' },
  items:[{ id:'x', n:1, text:'<img src=x onerror="alert(1)">' }] };
const xssHtml = sandbox.render([XSS], 'White');
ok('a script-shaped item text is neutralised',
   !/<img/.test(xssHtml) && xssHtml.includes('&lt;img'));

console.log('\n6. Degenerate inputs do not throw');
ok('no active checklists renders an empty state',
   /No active observation checklists/.test(sandbox.render([], 'White')));
ok('an instrument with no scored units says so',
   /No scored items are seeded/.test(
     sandbox.render([{ belt:'White', active:true, items:[], schema:{ type:'components', components:[] } }], 'White')));
ok('an unknown selected belt falls back to the first row',
   sandbox.render(ALL, 'Chartreuse').includes('Verifies the load contents'));

console.log('\n' + (failed ? `FAILED — ${failed} failing, ${passed} passing\n` : `OK — ${passed} assertions passed\n`));
process.exit(failed ? 1 : 0);
