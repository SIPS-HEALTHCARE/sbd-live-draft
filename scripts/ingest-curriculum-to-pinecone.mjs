#!/usr/bin/env node
/**
 * ingest-curriculum-to-pinecone.mjs
 *
 * Loads the SBD belt curriculum (the learner-guide sections already authored in
 * src/js/ui-views.js) into David OG's Pinecone knowledge base ("master-docs"),
 * so David can coach candidates from the real curriculum (launch milestone M1).
 *
 * WHY THIS EXISTS: the knowledge base is empty. David searches Pinecone
 * `master-docs` via `search_wiki_graph`, but nothing has ever populated it, so
 * he returns empty / thinking-only replies. This is the missing ingestion step.
 *
 * SAFETY: dry-run by default. It prints/saves exactly what WOULD be ingested
 * and does NOT call Pinecone. The live write only happens with --commit, and
 * only if PINECONE_API_KEY is set in the environment.
 *
 *   node scripts/ingest-curriculum-to-pinecone.mjs            # dry run (safe)
 *   node scripts/ingest-curriculum-to-pinecone.mjs --dry      # same, explicit
 *   PINECONE_API_KEY=xxx PINECONE_INDEX_HOST=https://… node scripts/ingest-curriculum-to-pinecone.mjs --commit
 *
 * The index host comes from PINECONE_INDEX_HOST — the same secret
 * supabase/functions/david-chat reads — so ingestion and search cannot drift onto
 * different indexes (T89). Namespace + record shape mirror search_wiki_graph.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const SOURCE_FILE = join(REPO_ROOT, 'src/js/ui-views.js');
const PREVIEW_FILE = join(__dirname, 'curriculum-ingest-preview.json');

// --- Pinecone target: one shared secret with david-chat/index.ts (T89) ---
const PINECONE_HOST = (process.env.PINECONE_INDEX_HOST || '').replace(/\/+$/, '');
const NAMESPACE = 'master-docs';
const UPSERT_URL = `${PINECONE_HOST}/records/namespaces/${NAMESPACE}/upsert`;

// --- tuning ---
const MAX_CHARS = 1500;     // approx chunk size (~400 tokens) for safe embedding
const BATCH_SIZE = 50;      // records per Pinecone upsert call

const COMMIT = process.argv.includes('--commit');

// ---------------------------------------------------------------------------
// 1. Extract every { title:"...", html:"..." } curriculum block from the app.
//    (Same pattern verified to find all 125 belt-guide sections.)
// ---------------------------------------------------------------------------
function extractBlocks(src) {
  const re = /\{title:"((?:[^"\\]|\\.)*)",html:"((?:[^"\\]|\\.)*)"\}/g;
  const blocks = [];
  let m;
  while ((m = re.exec(src)) !== null) {
    blocks.push({ rawTitle: m[1], rawHtml: m[2], index: m.index });
  }
  return blocks;
}

// ---------------------------------------------------------------------------
// 2. HTML -> clean readable text.
// ---------------------------------------------------------------------------
function htmlToText(html) {
  let t = html
    .replace(/\\"/g, '"')          // un-escape JS string quotes
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, ' ')
    .replace(/\\\//g, '/');
  // turn structural tags into separators so tables/lists stay readable
  t = t.replace(/<\/(tr|p|div|li|h[1-6]|table|ul|ol)>/gi, '\n');
  t = t.replace(/<br\s*\/?>/gi, '\n');
  t = t.replace(/<\/t[hd]>\s*<t[hd][^>]*>/gi, ' — '); // cells -> "a — b"
  t = t.replace(/<[^>]+>/g, '');  // strip remaining tags
  // decode the entities actually used in the content
  const ents = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
                 '&#39;': "'", '&apos;': "'", '&nbsp;': ' ', '&mdash;': '—',
                 '&ndash;': '–', '&rsquo;': '’', '&lsquo;': '‘' };
  t = t.replace(/&[a-z#0-9]+;/gi, (e) => ents[e] ?? e);
  // collapse whitespace
  t = t.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  return t;
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

// ---------------------------------------------------------------------------
// 3. Assign a curriculum label to each block. Each guide (6 belts + 6 Position
//    School tracks) opens with a "STERILE BY DESIGN" cover; the label is
//    derived from the group's own section titles so it survives reordering.
// ---------------------------------------------------------------------------
function titleCaseRole(s) {
  const keep = new Set(['QA', 'OR', 'SBD', 'SPD', 'IUSS']);
  return s.split(/(\s|\/)/).map((w) => {
    if (w === '/' || w === ' ' || w === '') return w;
    if (keep.has(w)) return w;
    return w[0] + w.slice(1).toLowerCase();
  }).join('');
}

function deriveLabel(sectionTitles, fallbackIdx) {
  const joined = sectionTitles.join(' | ').toUpperCase();
  // A guide references other belts (e.g. "what changed from WHITE BELT"), so
  // pick the belt mentioned MOST in this group's titles, not just the first.
  const beltCounts = {};
  for (const m of joined.matchAll(/\b(WHITE|YELLOW|GREEN|BLUE|BROWN|BLACK)\s+BELT\b/g)) {
    beltCounts[m[1]] = (beltCounts[m[1]] || 0) + 1;
  }
  const belts = Object.entries(beltCounts).sort((a, b) => b[1] - a[1]);
  if (belts.length) {
    const top = belts[0][0];
    return top[0] + top.slice(1).toLowerCase() + ' Belt';
  }
  const role = joined.match(/THE\s+([A-Z/ ]+?)\s+ROLE IN THE SBD SYSTEM/);
  if (role) return titleCaseRole(role[1].trim().replace(/\s+/g, ' ')) + ' School';
  return `Curriculum ${fallbackIdx + 1}`;
}

function assignLabels(blocks) {
  const groups = [];
  let cur = null;
  for (const b of blocks) {
    const title = htmlToText(b.rawTitle);
    if (/^STERILE BY DESIGN$/i.test(title.trim())) {
      cur = { titles: [], blocks: [] };
      groups.push(cur);
    } else if (cur) {
      cur.titles.push(title);
      cur.blocks.push({ ...b, title });
    }
  }
  const labeled = [];
  groups.forEach((g, i) => {
    const label = deriveLabel(g.titles, i);
    g.blocks.forEach((b) => labeled.push({ ...b, label }));
  });
  return labeled;
}

// ---------------------------------------------------------------------------
// 4. Chunk a section into <=MAX_CHARS pieces at paragraph boundaries, each
//    prefixed with belt + section title for retrieval context.
// ---------------------------------------------------------------------------
function chunkSection({ label, title, text }) {
  if (!text) return [];
  const header = `[SBD Curriculum — ${label} | ${title}]`;
  const paras = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks = [];
  let buf = '';
  for (const p of paras) {
    if ((buf + '\n\n' + p).length > MAX_CHARS && buf) {
      chunks.push(`${header}\n\n${buf}`.trim());
      buf = p;
    } else {
      buf = buf ? `${buf}\n\n${p}` : p;
    }
  }
  if (buf) chunks.push(`${header}\n\n${buf}`.trim());
  return chunks;
}

// ---------------------------------------------------------------------------
// 5. Build the record set.
// ---------------------------------------------------------------------------
function buildRecords(src) {
  const blocks = assignLabels(extractBlocks(src));
  const records = [];
  const seen = new Map();
  for (const b of blocks) {
    const text = htmlToText(b.rawHtml);
    const pieces = chunkSection({ label: b.label, title: b.title, text });
    pieces.forEach((piece, i) => {
      let id = `curric-${slugify(b.label)}-${slugify(b.title)}-${i}`;
      const n = (seen.get(id) || 0) + 1;
      seen.set(id, n);
      if (n > 1) id = `${id}-${n}`;
      records.push({ _id: id, text: piece, label: b.label });
    });
  }
  return records;
}

// ---------------------------------------------------------------------------
// 6. Upsert to Pinecone (only with --commit).
// ---------------------------------------------------------------------------
async function upsertBatch(apiKey, records) {
  // Pinecone integrated-embedding "upsert records" endpoint expects NDJSON:
  // one JSON record per line, Content-Type application/x-ndjson. The index
  // embeds the mapped `text` field server-side (mirrors the search call's
  // { inputs: { text } } shape in david-chat).
  const ndjson = records.map(({ _id, text }) => JSON.stringify({ _id, text })).join('\n');
  const res = await fetch(UPSERT_URL, {
    method: 'POST',
    headers: { 'Api-Key': apiKey, 'Content-Type': 'application/x-ndjson' },
    body: ndjson,
  });
  if (!res.ok) throw new Error(`Pinecone upsert ${res.status}: ${await res.text()}`);
  return res.json().catch(() => ({}));
}

async function main() {
  const src = readFileSync(SOURCE_FILE, 'utf8');
  const records = buildRecords(src);

  // stats
  const byLabel = {};
  for (const r of records) byLabel[r.label] = (byLabel[r.label] || 0) + 1;
  const totalChars = records.reduce((a, r) => a + r.text.length, 0);

  console.log('SBD curriculum -> Pinecone ingestion');
  console.log('------------------------------------');
  console.log(`Records (chunks): ${records.length}`);
  console.log(`Total text chars: ${totalChars.toLocaleString()}`);
  console.log('By curriculum:', byLabel);
  console.log(`Target: ${PINECONE_HOST ? UPSERT_URL : '(PINECONE_INDEX_HOST unset)'}`);

  if (!COMMIT) {
    writeFileSync(PREVIEW_FILE, JSON.stringify(records, null, 2));
    console.log(`\nDRY RUN — nothing written to Pinecone.`);
    console.log(`Full preview saved to: ${PREVIEW_FILE}`);
    console.log(`Re-run with --commit (and PINECONE_API_KEY set) to ingest.`);
    return;
  }

  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    console.error('\n--commit set but PINECONE_API_KEY is missing. Aborting.');
    process.exit(1);
  }
  if (!PINECONE_HOST) {
    console.error('\n--commit set but PINECONE_INDEX_HOST is missing. Aborting.');
    process.exit(1);
  }

  console.log(`\nCOMMIT — upserting ${records.length} records in batches of ${BATCH_SIZE}...`);
  let done = 0;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    await upsertBatch(apiKey, batch);
    done += batch.length;
    console.log(`  upserted ${done}/${records.length}`);
    await new Promise((r) => setTimeout(r, 250));
  }
  console.log('Done. David OG can now coach from the belt curriculum.');
}

main().catch((e) => { console.error(e); process.exit(1); });
