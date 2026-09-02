#!/usr/bin/env node
/* #1107: the Role Management card mirrors the Assessor grant onto issue_pin, but only while the
 * two are already equal. Lifts the SHIPPED helpers and the normalisation loop out of ui-views.js
 * (not re-implemented) and runs the six "done when" cases against them.  Run: node scripts/verify-1107-pin-grant-sync.js */
'use strict';
const fs = require('fs'), path = require('path');
const UI = fs.readFileSync(path.join(__dirname, '..', 'src/js/ui-views.js'), 'utf8');
function lift(header) {
  const start = UI.indexOf(header); if (start < 0) throw new Error('missing ' + header);
  let i = UI.indexOf('{', start), d = 0;
  for (let j = i; j < UI.length; j++) { if (UI[j] === '{') d++; else if (UI[j] === '}' && --d === 0) return UI.slice(start, j + 1); }
  throw new Error('unbalanced ' + header);
}
const NORMALISE = (() => { const s = UI.indexOf("['assessor','issue_pin','approve_assessment'].forEach"); return UI.slice(s, UI.indexOf('});', s) + 3); })();
const apply = new Function('caps', 'mutate',
  [lift('function _rmPinKey(c)'), lift('function _rmAssessorKey(c)'), lift('function _rmMirrorAssessorOntoPin(caps, pinBefore, pinInSync)'),
   'caps=JSON.parse(JSON.stringify(caps));',
   'const pinBefore=_rmPinKey(caps), pinInSync=pinBefore===_rmAssessorKey(caps);',
   'mutate(caps); _rmMirrorAssessorOntoPin(caps, pinBefore, pinInSync);', NORMALISE, 'return caps;'].join('\n'));

const F1 = 'f1', F2 = 'f2';
let fail = 0;
const eq = (label, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) fail++; console.log((ok ? '  ✓ ' : '  ✗ ') + label + (ok ? '' : '\n      got  ' + JSON.stringify(got) + '\n      want ' + JSON.stringify(want))); };

eq('grant Assessor -> issue_pin true, no lists yet',
  apply({}, c => { c.assessor = true; }), { assessor: true, issue_pin: true });
eq('add a facility -> PIN list follows',
  apply({ assessor: true, issue_pin: true }, c => { c.assessor_facilities = [F1]; }),
  { assessor: true, issue_pin: true, assessor_facilities: [F1], issue_pin_facilities: [F1] });
eq('remove the last facility -> both lists dropped (system wide), grants kept',
  apply({ assessor: true, issue_pin: true, assessor_facilities: [F1], issue_pin_facilities: [F1] }, c => { c.assessor_facilities = []; }),
  { assessor: true, issue_pin: true });
eq('hand-set different PIN scope survives an educator edit',
  apply({ assessor: true, assessor_facilities: [F1, F2], issue_pin: true, issue_pin_facilities: [F1] }, c => { c.educator_facilities = [F2]; }),
  { assessor: true, assessor_facilities: [F1, F2], issue_pin: true, issue_pin_facilities: [F1], educator_facilities: [F2] });
eq('hand-set different PIN scope survives an assessor facility add',
  apply({ assessor: true, assessor_facilities: [F1], issue_pin: true, issue_pin_facilities: [F2] }, c => { c.assessor_facilities.push(F2); }),
  { assessor: true, assessor_facilities: [F1, F2], issue_pin: true, issue_pin_facilities: [F2] });
eq('revoke Assessor -> PIN grant and list removed',
  apply({ assessor: true, assessor_facilities: [F1], issue_pin: true, issue_pin_facilities: [F1] }, c => { delete c.assessor; }), {});
eq('turning the PIN grant itself off while in sync is honoured, not undone',
  apply({ assessor: true, issue_pin: true }, c => { delete c.issue_pin; }), { assessor: true });
eq('legacy assessor with no PIN grant: unrelated edit does not silently grant one',
  apply({ assessor: true }, c => { c.educator_facilities = [F1]; }), { assessor: true, educator_facilities: [F1] });
eq('list order does not count as divergence',
  apply({ assessor: true, assessor_facilities: [F1, F2], issue_pin: true, issue_pin_facilities: [F2, F1] }, c => { c.assessor_facilities = [F1]; }),
  { assessor: true, assessor_facilities: [F1], issue_pin: true, issue_pin_facilities: [F1] });

console.log(fail ? `\n${fail} failed` : '\nall passed');
process.exit(fail ? 1 : 0);
