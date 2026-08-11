#!/usr/bin/env node
// scripts/seed-david-kb.mjs — P0.2: seed David's knowledge base (Pinecone `master-docs`).
//
// Decision 3 = "constants canonical": this harvests the authoritative content straight out of
// src/js/ui-views.js (FULL_QUESTION_BANKS, PLACEMENT_QUESTIONS with answer keys + dangerous
// answers, FULL_CURRICULUM_DATA learner guide, PS_CURRICULUM/PS_TRACKS) and upserts it as text
// records that David's existing `search_wiki_graph` tool already queries.
//
// SAFETY: defaults to DRY-RUN (prints what it would upsert; no network). Pushing to prod Pinecone
// is an explicit, user-run action (per CLAUDE.md I never automate prod writes):
//     node scripts/seed-david-kb.mjs                 # dry run: extract + build + print samples
//     PINECONE_API_KEY=xxx PINECONE_INDEX_HOST=https://… node scripts/seed-david-kb.mjs --push
//
// The index host is NOT hard-coded here (T89): it comes from PINECONE_INDEX_HOST, the same secret
// supabase/functions/david-chat reads, so the seeder and the search can never point at different
// indexes again. EMBED_FIELD defaults to 'text', which is the field_map of the canonical
// `sbd-knowledge-ai` index (confirmed in the Pinecone console 2026-08-04).
//
// Directive 9 (copyright): we seed ONLY SBD's own materials (curriculum, question banks, learner
// guide — SBD IP, quotable). No verbatim external-standard (AAMI/JC/etc.) text is introduced here;
// David's answer-time Directive 9 governs how it cites standards.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UI_VIEWS = join(__dirname, '..', 'src', 'js', 'ui-views.js');

// T89: one shared source of truth with supabase/functions/david-chat (PINECONE_INDEX_HOST secret).
const PINECONE_HOST = process.env.PINECONE_INDEX_HOST;
const NAMESPACE = 'master-docs';
const EMBED_FIELD = process.env.EMBED_FIELD || 'text'; // confirmed against the index field_map 2026-08-04
const BATCH = 90;
const PUSH = process.argv.includes('--push');

// ── string-aware literal slicer: returns the {…} or […] literal beginning at openIdx ──
function sliceLiteral(src, openIdx) {
  const open = src[openIdx];
  const close = open === '{' ? '}' : ']';
  let depth = 0, inStr = null, esc = false;
  for (let i = openIdx; i < src.length; i++) {
    const c = src[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === inStr) inStr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) return src.slice(openIdx, i + 1); }
  }
  throw new Error('Unbalanced literal');
}

function extractConst(src, name) {
  const re = new RegExp('(?:const|let|var)\\s+' + name + '\\s*=\\s*');
  const m = re.exec(src);
  if (!m) throw new Error('declaration not found: ' + name);
  let i = m.index + m[0].length;
  while (i < src.length && src[i] !== '{' && src[i] !== '[') i++;
  const lit = sliceLiteral(src, i);
  return (0, eval)('(' + lit + ')'); // pure data literal
}

const stripHtml = (h) => String(h || '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/\s+/g, ' ').trim();

// ── build KB documents ──────────────────────────────────────────────────────────
function buildDocs(src) {
  const docs = [];
  const add = (id, text, meta) => { if (text && text.trim()) docs.push({ id, text: text.trim(), meta }); };

  // 1. Belt practice banks (FULL_QUESTION_BANKS) — one doc per belt × mode.
  try {
    const banks = extractConst(src, 'FULL_QUESTION_BANKS');
    for (const belt of Object.keys(banks)) {
      const b = banks[belt] || {};
      if (Array.isArray(b.knowledge) && b.knowledge.length) {
        const text = `SBD ${belt} Belt — knowledge practice questions and model answers:\n` +
          b.knowledge.map((q, i) => `Q${i + 1} (${q.diff || '—'}): ${q.q}\nA: ${q.a}`).join('\n\n');
        add(`bank:${belt}:knowledge`, text, { type: 'question_bank', belt, mode: 'knowledge' });
      }
      if (Array.isArray(b.simulation) && b.simulation.length) {
        const text = `SBD ${belt} Belt — simulation scenarios and model responses:\n` +
          b.simulation.map((q, i) => `Scenario ${i + 1} (${q.diff || '—'}): ${q.s}\nModel response: ${q.answer}`).join('\n\n');
        add(`bank:${belt}:simulation`, text, { type: 'question_bank', belt, mode: 'simulation' });
      }
    }
  } catch (e) { console.warn('  ! FULL_QUESTION_BANKS:', e.message); }

  // 2. Placement questions (PLACEMENT_QUESTIONS) — KEYED content (correct index + dangerousAnswers).
  try {
    const pq = extractConst(src, 'PLACEMENT_QUESTIONS');
    pq.forEach((q, i) => {
      let text;
      if (q.type === 'knowledge' && Array.isArray(q.options)) {
        const correct = (typeof q.correct === 'number') ? q.options[q.correct] : '(unspecified)';
        const danger = Array.isArray(q.dangerousAnswers) ? q.dangerousAnswers.map(d => q.options[d]).filter(Boolean) : [];
        text = `SBD placement knowledge question: ${q.q}\nOptions: ${q.options.join(' | ')}\nCorrect answer: ${correct}` +
          (danger.length ? `\nDANGEROUS (auto-fail) answers: ${danger.join(' | ')}` : '');
      } else {
        text = `SBD placement scenario: ${q.q || q.s || ''}` +
          (Array.isArray(q.keywords) && q.keywords.length ? `\nKey points expected: ${q.keywords.join(', ')}` : '');
      }
      add(`placement:${q.id || i}`, text, { type: 'placement', q_type: q.type || 'scenario' });
    });
  } catch (e) { console.warn('  ! PLACEMENT_QUESTIONS:', e.message); }

  // 3. Learner guide (FULL_CURRICULUM_DATA) — SBD's own belt-guide content; HTML stripped to text.
  try {
    const cur = extractConst(src, 'FULL_CURRICULUM_DATA');
    const walk = (node, path) => {
      if (!node || typeof node !== 'object') return;
      if (typeof node.title === 'string' && typeof node.html === 'string') {
        add(`guide:${path}`, `SBD Learner Guide — ${node.title}:\n${stripHtml(node.html)}`, { type: 'belt_guide', section: node.title });
      }
      if (Array.isArray(node)) node.forEach((n, i) => walk(n, `${path}.${i}`));
      else for (const k of Object.keys(node)) if (node[k] && typeof node[k] === 'object') walk(node[k], `${path}.${k}`);
    };
    walk(cur, 'root');
  } catch (e) { console.warn('  ! FULL_CURRICULUM_DATA:', e.message); }

  // 4. Position School curriculum (PS_CURRICULUM + PS_TRACKS) — one doc per track.
  try {
    const ps = extractConst(src, 'PS_CURRICULUM');
    let tracks = {};
    try { tracks = extractConst(src, 'PS_TRACKS'); } catch (_) {}
    for (const key of Object.keys(ps)) {
      const t = ps[key] || {};
      const name = (tracks[key] && tracks[key].name) || t.name || `Track ${key}`;
      const text = `SBD Position School — ${name}:\n${JSON.stringify(t)}`;
      add(`pscurr:${key}`, stripHtml(text), { type: 'ps_curriculum', track: key, name });
    }
  } catch (e) { console.warn('  ! PS_CURRICULUM:', e.message); }

  return docs;
}

async function pushBatch(records) {
  const key = process.env.PINECONE_API_KEY;
  if (!key) throw new Error('PINECONE_API_KEY not set — cannot --push.');
  if (!PINECONE_HOST) throw new Error('PINECONE_INDEX_HOST not set — cannot --push.');
  // Integrated-embedding upsert: NDJSON, one record per line; the EMBED_FIELD text is embedded server-side.
  const ndjson = records.map(r => JSON.stringify({ _id: r.id, [EMBED_FIELD]: r.text, ...r.meta })).join('\n');
  const res = await fetch(`${PINECONE_HOST}/records/namespaces/${NAMESPACE}/upsert`, {
    method: 'POST',
    headers: { 'Api-Key': key, 'Content-Type': 'application/x-ndjson' },
    body: ndjson,
  });
  if (!res.ok) throw new Error(`Pinecone upsert ${res.status}: ${await res.text()}`);
}

async function main() {
  const src = readFileSync(UI_VIEWS, 'utf8');
  const docs = buildDocs(src);
  console.log(`\nBuilt ${docs.length} KB documents from ui-views.js:`);
  const byType = {};
  docs.forEach(d => { byType[d.meta.type] = (byType[d.meta.type] || 0) + 1; });
  console.log('  by type:', JSON.stringify(byType));
  console.log('  samples:');
  docs.slice(0, 3).forEach(d => console.log(`   - [${d.id}] ${d.text.slice(0, 120).replace(/\n/g, ' ')}…`));

  if (!PUSH) {
    console.log(`\nDRY RUN — nothing was sent. Verify EMBED_FIELD='${EMBED_FIELD}' matches the index field_map,`);
    console.log(`then run:  PINECONE_API_KEY=*** PINECONE_INDEX_HOST=*** node scripts/seed-david-kb.mjs --push\n`);
    return;
  }
  console.log(`\nPushing to Pinecone ${NAMESPACE} (field '${EMBED_FIELD}') in batches of ${BATCH}…`);
  for (let i = 0; i < docs.length; i += BATCH) {
    await pushBatch(docs.slice(i, i + BATCH));
    console.log(`  upserted ${Math.min(i + BATCH, docs.length)}/${docs.length}`);
  }
  console.log('Done.\n');
}

main().catch(e => { console.error('seed failed:', e.message); process.exit(1); });
