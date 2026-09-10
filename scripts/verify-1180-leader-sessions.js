#!/usr/bin/env node
// #1180 static check — the scoping rules that make this function safe, asserted against the
// source so a later edit cannot quietly widen them. Run: node scripts/verify-1180-leader-sessions.js
const fs = require('fs');
let fail = 0;
const ok = (c, m) => { console.log(`  ${c ? '✓' : '✗'} ${m}`); if (!c) fail++; };

const FN = fs.readFileSync('supabase/functions/sbd-leader-sessions/index.ts', 'utf8');
const ADMIN = fs.readFileSync('supabase/functions/sbd-admin-sessions/index.ts', 'utf8');

console.log('#1180 sbd-leader-sessions');
ok(/LEADER_ROLES = \['facility_admin', 'hospital'\]/.test(FN), 'admits exactly facility_admin + hospital');
ok(!/master_admin|staff_admin|system_admin/.test(FN.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '')), 'no admin role reaches this function (outside comments)');
ok(/\.in\('facility_id', scopeFids\)/.test(FN), 'the session query is filtered by the caller scope');
ok(/scopeFids\.length === 0/.test(FN) && FN.indexOf('scopeFids.length === 0') < FN.indexOf(".from('sbd_assessment_sessions')"),
   'an empty scope returns early — it never falls through to an unfiltered read');
ok(!/scopeFids: string\[\] \| null|scopeFids = null/.test(FN), 'scope is never nullable (no "null means all" path)');
ok(!/session_token|pin_hash|progress|\bpin\b/i.test(FN.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '')), 'no PIN, token or answer data is selected or returned');
ok(!/\.(insert|update|upsert|delete)\(/.test(FN), 'read-only: no write call anywhere');
ok(!/\.eq\('status'/.test(FN), 'every status is returned, not active-only');

console.log('sbd-admin-sessions unchanged');
ok(/const ADMIN_ROLES = \['master_admin', 'staff_admin', 'system_admin'\];/.test(ADMIN), 'ADMIN_ROLES is still the original three');
ok(/\.eq\('status', 'active'\)/.test(ADMIN), 'still active-only');

console.log(fail ? `\n  ${fail} assertion(s) FAILED` : '\n  all assertions passed');
process.exit(fail ? 1 : 0);
