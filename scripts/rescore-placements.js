#!/usr/bin/env node
/**
 * T101 — re-score the historical placements with the CALIBRATED evaluator, then re-apply
 * the belt logic to the corrected numbers.
 *
 * Why this exists: running the corrected belt engine over the STORED numbers strips White
 * belts off people whose simulations were graded by the old evaluator — the one the scoring
 * specification records as marking real responses 30-40 points low. That is our scoring
 * fault, not their answers. So the responses are re-scored first (sbd-score-assessment,
 * evaluator prompt v2.1), and only then is the belt logic re-applied.
 *
 * READ-ONLY. This script writes NOTHING to the database. It produces the sheet SIPS signs
 * off on: who moves, by how much, and against what. Nobody's belt changes until that is
 * reviewed (T101: "reviewed by SIPS before anything is published").
 *
 *   SB_SERVICE_KEY=<service role key> node scripts/rescore-placements.js
 *   node scripts/rescore-placements.js --selftest      # no key, no network
 *   node scripts/rescore-placements.js --limit 3       # cheap trial over 3 placements
 *
 * Env: SB_SERVICE_KEY (required)   RESCORE_PACE_MS (default 6500 — see the rate limit note)
 *
 * Outputs into scripts/rescore-out/ (gitignored — it holds real staff names):
 *   review-sheet.md    the SIPS sign-off sheet, with the affected count and the names
 *   rescored.json      every re-scored review, so applying it later needs no second LLM run
 *   scores-cache.json  per-response cache; a re-run never pays for the same grade twice
 */
'use strict';
const fs = require('fs');
const path = require('path');
const loadScoringModule = require('../tools/verify/scoring-module');

const REPO = path.resolve(__dirname, '..');
const OUT = path.join(REPO, 'scripts', 'rescore-out');
const CACHE_FILE = path.join(OUT, 'scores-cache.json');

const argv = process.argv.slice(2);
const has = f => argv.includes(f);
const argVal = f => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : null; };

// The scorer is rate limited per client IP (sbd-score-assessment: 60/min, 600/hour) and it
// fails CLOSED with a 429. ~20 simulation responses per placement over ~49 placements is
// ~1,000 grades, so the run is paced to sit under the hourly window rather than sprint into
// a wall. A 429 is still handled below; this just avoids provoking it.
const PACE_MS = Number(process.env.RESCORE_PACE_MS || 6500);
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── config ───────────────────────────────────────────────────────────────────────────────
// Same source of truth get_db.js uses: the URL lives in the client bundle, the key never does.
function apiUrl() {
  const src = fs.readFileSync(path.join(REPO, 'src/js/api-supabase.js'), 'utf8');
  return src.match(/const SB_API_URL = '([^']+)'/)[1];
}
function serviceKey() {
  const k = process.env.SB_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!k) throw new Error('SB_SERVICE_KEY not set. Placement responses are not anon-readable.');
  return k;
}

async function sb(pathname, key, url, init) {
  const res = await fetch(url + pathname, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(init || {}).headers },
  });
  if (!res.ok) throw Object.assign(new Error(`${res.status} ${await res.text()}`), { status: res.status });
  return res.json();
}

// ── the calibrated evaluator ─────────────────────────────────────────────────────────────
// The live deployed sbd-score-assessment, unchanged and uncopied: a second implementation of
// the rubric here would be a third scoring standard, which is the whole problem this fixes.
function makeScorer(url, key) {
  let first = true;
  return async function score(question, answer) {
    if (!first) await sleep(PACE_MS);
    first = false;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const r = await sb('/functions/v1/sbd-score-assessment', key, url, {
          method: 'POST', body: JSON.stringify({ question, answer }),
        });
        if (typeof r.score !== 'number') throw new Error('scorer returned no score: ' + JSON.stringify(r).slice(0, 200));
        return { score: r.score, feedback: r.feedback || '', model: r.model || null };
      } catch (e) {
        // 429 = the per-IP window. Anything else transient gets the same backoff and then gives up.
        if (attempt === 4) throw e;
        await sleep(e.status === 429 ? 60000 : 3000 * (attempt + 1));
      }
    }
  };
}

// ── belt determination ───────────────────────────────────────────────────────────────────
// What the ENGINE says from the scores alone. rptComputeModel takes a stored confirmed or
// tentative belt as the belt the report is about, so both are stripped here — otherwise this
// would just read back the belt we are trying to check.
function engineDetermination(mod, pr, responses) {
  const m = mod.rptComputeModel({ ...pr, confirmedBelt: null, tentativeBelt: null, status: 'pending', responses });
  return { belt: m.beltAwarded, outcome: m.outcome, blended: m.blended, k: m.kOverall, sim: m.simOverall };
}
const label = d => d.belt ? `${d.belt}${d.outcome === 'CONDITIONAL' ? ' (conditional)' : ''}`
  : d.outcome === 'KNOWLEDGE_FOUNDATION' ? 'Knowledge Foundation' : 'No Belt';

// ── the run ──────────────────────────────────────────────────────────────────────────────
async function rescore(reviews, score, cache) {
  const out = [];
  for (const pr of reviews) {
    // An AIP scenario was graded against its own answer key. We hold only the question text
    // here, so re-scoring one would silently grade it under a different rubric. Refuse rather
    // than quietly produce a number nobody can explain.
    const aip = (pr.responses || []).filter(r => String(r.qId || '').startsWith('aip-'));
    if (aip.length) throw new Error(`${pr.staffName}: ${aip.length} AIP scenario response(s) — these need their answer key, not a generic re-score.`);

    const responses = [];
    for (const r of pr.responses || []) {
      if (r.type === 'knowledge') { responses.push({ ...r }); continue; }
      const blank = !String(r.answer || '').trim();
      if (blank) { responses.push({ ...r, _rescore: 'skipped-blank' }); continue; }
      const ck = `${pr.id}:${r.qId}`;
      if (!cache[ck]) {
        cache[ck] = await score(r.question, r.answer);
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
        process.stderr.write(`  ${pr.staffName} ${r.qId}: ${r.aiScore} -> ${cache[ck].score}\n`);
      }
      responses.push({ ...r, aiScore: cache[ck].score, aiFeedback: cache[ck].feedback, _priorAiScore: r.aiScore, _rescore: 'calibrated' });
    }
    out.push({ pr, responses });
  }
  return out;
}

function buildSheet(mod, rescored) {
  const rows = rescored.map(({ pr, responses }) => {
    const held = pr.confirmedBelt || pr.tentativeBelt || null;
    const before = engineDetermination(mod, pr, pr.responses || []);   // corrected engine, OLD scores
    const after = engineDetermination(mod, pr, responses);             // corrected engine, calibrated scores
    return {
      name: pr.staffName || pr.staffId, fid: pr.fid, submitted: String(pr.submittedAt || '').slice(0, 10),
      status: pr.status, held, before, after,
      changes: !!held && after.belt !== held,
      strippedByNaiveRerun: !!held && before.belt !== held,
      rescuedByCalibration: !!held && before.belt !== held && after.belt === held,
    };
  });

  const changed = rows.filter(r => r.changes);
  const naive = rows.filter(r => r.strippedByNaiveRerun);
  const rescued = rows.filter(r => r.rescuedByCalibration);
  const fmt = n => (n == null ? '—' : n.toFixed(1));

  const md = [
    '# T101 — historical placement re-score, for SIPS sign-off',
    '',
    `Generated from ${rows.length} stored placements. Nothing has been written to the database.`,
    'Simulation responses were re-graded by the live calibrated evaluator (sbd-score-assessment,',
    'prompt v2.1); knowledge answers are unchanged (they were never AI-scored). The belt logic is',
    'the deployed spec v1 engine, run on the corrected numbers.',
    '',
    '## The count',
    '',
    `- **${changed.length} ${changed.length === 1 ? 'person holds' : 'people hold'} a belt that the re-scored determination does not reproduce.**${changed.length ? ' Named below.' : ''}`,
    `- ${naive.length} would have lost a belt to a re-run on the OLD scores — the outcome this task exists to prevent.`,
    `- ${rescued.length} of those ${rescued.length === 1 ? 'is' : 'are'} restored by re-scoring alone; those answers were always good enough.`,
    '',
    changed.length ? '## Belts that change — each needs the client\'s decision before anything is published\n' : '## No belt changes. Nothing to publish.\n',
    ...changed.map(r => `- **${r.name}** — holds ${r.held}, re-scored determination is ${label(r.after)} `
      + `(simulation ${fmt(r.before.sim)} → ${fmt(r.after.sim)}, blended ${fmt(r.before.blended)} → ${fmt(r.after.blended)})`),
    '',
    '## Every placement',
    '',
    '| Name | Facility | Submitted | Status | Holds | Re-run on old scores | Re-scored determination | Sim | Blended |',
    '|---|---|---|---|---|---|---|---|---|',
    ...rows.map(r => `| ${r.name} | ${r.fid} | ${r.submitted} | ${r.status} | ${r.held || '—'} | ${label(r.before)} | ${label(r.after)}`
      + ` | ${fmt(r.before.sim)} → ${fmt(r.after.sim)} | ${fmt(r.before.blended)} → ${fmt(r.after.blended)} |`),
    '',
    '## Sign-off',
    '',
    '- [ ] Iggie has reviewed the belts that change, above.',
    '- [ ] Every person whose belt changes has been told by the client before it is published.',
    '',
  ].join('\n');
  return { md, rows, changed };
}

// ── self-check ───────────────────────────────────────────────────────────────────────────
// One runnable check: the failure this whole task is about (a good candidate stripped of a
// White belt by old evaluator numbers) must come back White once re-scored, without the
// stored record being touched.
async function selftest() {
  const assert = require('assert');
  const mod = loadScoringModule();
  // A real White-belt shape: knowledge 33/40 (82.5%), simulations graded 35 by the old
  // evaluator. Blended reads 63.2 — Knowledge Foundation, no belt — on those numbers.
  const responses = [];
  const correctPerLevel = [7, 7, 7, 6, 6];
  for (let l = 1; l <= 5; l++) {
    for (let i = 0; i < 8; i++) responses.push({ qId: `k${l}-${i}`, level: l, type: 'knowledge', correct: i < correctPerLevel[l - 1], question: 'q', answer: 'a' });
    for (let i = 0; i < 4; i++) responses.push({ qId: `s${l}-${i}`, level: l, type: 'simulation', question: 'scenario', answer: 'a real answer', aiScore: 35 });
  }
  const pr = { id: 'pr-test', staffName: 'Test Candidate', fid: 'test-a', status: 'confirmed',
    confirmedBelt: 'White', tentativeBelt: 'White', submittedAt: '2026-05-01T00:00:00Z', responses };

  assert.strictEqual(engineDetermination(mod, pr, pr.responses).belt, null,
    'old evaluator numbers must fail the corrected engine — otherwise this task has no premise');

  const cache = {};
  const rescored = await rescore([pr], async () => ({ score: 78, feedback: 'calibrated' }), cache);
  const sheet = buildSheet(mod, rescored);

  assert.strictEqual(sheet.rows[0].after.belt, 'White', 're-scored candidate must hold White again');
  assert.strictEqual(sheet.rows[0].strippedByNaiveRerun, true, 'the naive re-run must be reported as stripping it');
  assert.strictEqual(sheet.rows[0].rescuedByCalibration, true, 're-scoring must be reported as restoring it');
  assert.strictEqual(sheet.changed.length, 0, 'a restored belt is not a change and must not go on the client list');
  const simIdx = pr.responses.findIndex(r => r.type === 'simulation');
  assert.strictEqual(pr.responses[simIdx].aiScore, 35, 'the stored record must not be mutated');
  assert.strictEqual(rescored[0].responses[simIdx]._priorAiScore, 35, 'the original score must survive on the re-scored copy');

  // A blank answer is left alone: the evaluator rejects an empty body, and inventing a score
  // for it would be exactly the kind of quiet number this task is cleaning up after.
  const blankPr = { ...pr, id: 'pr-blank', responses: [{ qId: 's1-0', level: 1, type: 'simulation', question: 'q', answer: '  ', aiScore: 0 }] };
  const blank = await rescore([blankPr], async () => { throw new Error('must not be called for a blank answer'); }, {});
  assert.strictEqual(blank[0].responses[0]._rescore, 'skipped-blank');

  // Second pass over a warm cache must not call the scorer again.
  await rescore([pr], async () => { throw new Error('cache miss — a re-run would pay twice'); }, cache);

  // Leave the sheet the fixture produces on disk, so the format can be read before a run
  // spends an hour of grading calls on real people.
  fs.writeFileSync(path.join(OUT, 'review-sheet.sample.md'), sheet.md);
  console.log('selftest: OK');
}

// ── main ─────────────────────────────────────────────────────────────────────────────────
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  if (has('--selftest')) return selftest();

  const url = apiUrl(), key = serviceKey();
  const mod = loadScoringModule();
  const raw = await sb('/rest/v1/placement_reviews?select=*&order=submitted_at.asc', key, url);
  const limit = Number(argVal('--limit') || 0);
  const reviews = (limit ? raw.slice(0, limit) : raw).map(row => ({
    id: row.id, staffId: row.staff_id, fid: row.fid, staffName: row.staff_name, staffTitle: row.staff_title,
    status: row.status, tentativeBelt: row.tentative_belt, confirmedBelt: row.confirmed_belt,
    responses: row.responses || [], submittedAt: row.submitted_at,
  }));
  console.error(`${reviews.length} placements, pacing ${PACE_MS}ms between grades`);

  const cache = fs.existsSync(CACHE_FILE) ? JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) : {};
  const rescored = await rescore(reviews, makeScorer(url, key), cache);
  const { md, rows, changed } = buildSheet(mod, rescored);

  fs.writeFileSync(path.join(OUT, 'review-sheet.md'), md);
  fs.writeFileSync(path.join(OUT, 'rescored.json'), JSON.stringify(rescored, null, 2));
  console.log(`\n${rows.length} placements re-scored. ${changed.length} belt(s) change:`);
  changed.forEach(r => console.log(`  ${r.name}: ${r.held} -> ${label(r.after)}`));
  console.log(`\nSheet: ${path.relative(REPO, path.join(OUT, 'review-sheet.md'))}`);
})().catch(e => { console.error(e.message); process.exit(1); });
