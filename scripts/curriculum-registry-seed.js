#!/usr/bin/env node
/* ============================================================================
 * curriculum-registry-seed.js — #1148 (Shawn board 134, ledger T129)
 *
 * One registry row per module across the five curricula, read straight out of
 * the shipped constants (FOUNDATIONS_MODULES, INSTRUMENT_MODULES,
 * PRECEPTOR_MODULES, ENDOSCOPY_MODULES, the Scripts module). The constants stay
 * the source of truth; this script is how the curriculum_modules table is kept
 * equal to them.
 *
 *   node scripts/curriculum-registry-seed.js        -> prints the idempotent upsert SQL
 *   require('./curriculum-registry-seed').registryRows()  (verify script uses this)
 *
 * The seed block inside supabase/migrations/20260908140000_1148_curriculum_modules.sql
 * is this script's output, pasted verbatim. When a constant changes, re-run it and
 * apply the printed SQL with `supabase db query --linked`; the verify script fails
 * until the two agree again.
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

// Same lifters as verify-endoscopy-module.js: run the real shipped declarations,
// never a re-typed copy of them.
function liftBlock(src, startsWith, file) {
  const lines = src.split('\n');
  const start = lines.findIndex(l => l.startsWith(startsWith));
  if (start === -1) throw new Error('not found in ' + file + ': ' + startsWith);
  let depth = 0, started = false;
  for (let i = start; i < lines.length; i++) {
    const opens = (lines[i].match(/[{[]/g) || []).length;
    const closes = (lines[i].match(/[}\]]/g) || []).length;
    depth += opens - closes;
    if (opens > 0) started = true;
    if (started && depth <= 0) return lines.slice(start, i + 1).join('\n');
  }
  throw new Error('unterminated block in ' + file + ': ' + startsWith);
}
function liftRange(src, startsWith, endsWith, file) {
  const lines = src.split('\n');
  const a = lines.findIndex(l => l.startsWith(startsWith));
  if (a === -1) throw new Error('not found in ' + file + ': ' + startsWith);
  const b = lines.findIndex((l, i) => i > a && l.startsWith(endsWith));
  if (b === -1) throw new Error('not found in ' + file + ': ' + endsWith);
  return lines.slice(a, b + 1).join('\n');
}

function constants() {
  const FND = read('src/js/foundations.js');
  const INST = read('src/js/instruments.js');
  const PRC = read('src/js/preceptor.js');
  const ENDO = read('src/js/endoscopy.js');
  return new Function(
    liftBlock(FND, 'const FOUNDATIONS_MODULES = [', 'foundations.js') + '\n' +
    liftBlock(INST, 'const INSTRUMENT_MODULES = [', 'instruments.js') + '\n' +
    liftBlock(PRC, 'const PRECEPTOR_MODULES = [', 'preceptor.js') + '\n' +
    liftRange(ENDO, 'const ENDO_SECTIONS = [', 'function endoHasObs', 'endoscopy.js') + '\n' +
    'return { FOUNDATIONS_MODULES, INSTRUMENT_MODULES, PRECEPTOR_MODULES, ENDOSCOPY_MODULES };'
  )();
}

// gate_shape vocabulary (CHECK constraint in the migration mirrors this list):
//   knowledge_simulation_observation  3-gate engine (Foundations, Instruments, Preceptor)
//   knowledge                          Knowledge only (Endoscopy chapters; G3 seeded n/a)
//   knowledge_observation              Knowledge + Observation (Endoscopy capstone en-14)
//   leader_confirmed                   no gates, assignment.status carries completion (Scripts)
const GATE_SHAPES = ['knowledge_simulation_observation', 'knowledge', 'knowledge_observation', 'leader_confirmed'];

function registryRows() {
  const c = constants();
  const rows = [];
  c.FOUNDATIONS_MODULES.forEach(m => rows.push({ curriculum: 'foundations', module_id: m.id, title: m.title, sequence: m.num, gate_shape: 'knowledge_simulation_observation' }));
  c.INSTRUMENT_MODULES.forEach(m => rows.push({ curriculum: 'instruments', module_id: m.id, title: m.title, sequence: m.num, gate_shape: 'knowledge_simulation_observation' }));
  // T92: one module, id 'scripts' (SCRIPTS_MODULE_ID in foundations.js), leader-confirmed.
  rows.push({ curriculum: 'scripts', module_id: 'scripts', title: 'Scripts', sequence: 1, gate_shape: 'leader_confirmed' });
  // Chapters carry a Knowledge gate whose bank is pending (ARCHITECTURE §16C); only the
  // capstone has an observation list. Shape follows the content, not the id.
  c.ENDOSCOPY_MODULES.forEach(m => rows.push({ curriculum: 'endoscopy', module_id: m.id, title: m.title, sequence: m.num, gate_shape: (m.observations || []).length ? 'knowledge_observation' : 'knowledge' }));
  c.PRECEPTOR_MODULES.forEach(m => rows.push({ curriculum: 'preceptor', module_id: m.id, title: m.title, sequence: m.seq, gate_shape: 'knowledge_simulation_observation' }));
  return rows;
}

const q = s => "'" + String(s).replace(/'/g, "''") + "'";

function seedSql() {
  const values = registryRows()
    .map(r => `  (${q(r.curriculum)}, ${q(r.module_id)}, ${q(r.title)}, ${r.sequence}, ${q(r.gate_shape)})`)
    .join(',\n');
  return `insert into public.curriculum_modules (curriculum, module_id, title, sequence, gate_shape) values
${values}
on conflict (module_id) do update
  set curriculum = excluded.curriculum,
      title      = excluded.title,
      sequence   = excluded.sequence,
      gate_shape = excluded.gate_shape,
      active     = true;`;
}

module.exports = { registryRows, seedSql, GATE_SHAPES };

if (require.main === module) process.stdout.write(seedSql() + '\n');
