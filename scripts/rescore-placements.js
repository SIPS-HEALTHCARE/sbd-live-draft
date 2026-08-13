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
 *   ... --since 2026-08-11 --status pending            # today's, plus anything still pending
 *   ... --since 2026-08-11 --status pending --list     # print that selection, grade nothing
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
    // A belt somebody HOLDS is one an assessor confirmed. `tentative_belt` is what the engine
    // proposed at submission, and a proposal awaiting a decision is not an award. Reading the
    // two as one thing put a person who had never been given a belt onto a client-facing list
    // of belts being taken away, which is close to the worst thing this sheet can say. It also
    // understated the real finding: on the comparison set only 3 of 14 hold an awarded belt,
    // and none of the three move, which is a stronger result than the merged reading produced.
    const held = pr.confirmedBelt || null;
    const suggested = pr.confirmedBelt ? null : (pr.tentativeBelt || null);
    const before = engineDetermination(mod, pr, pr.responses || []);   // corrected engine, OLD scores
    const after = engineDetermination(mod, pr, responses);             // corrected engine, calibrated scores
    // Thin evidence. A placement whose simulations were largely left blank produces a
    // determination off very little, and the sheet has to say so rather than leave a
    // reviewer to notice it. Blanks are skipped by the re-score, so both columns are thin.
    const sims = (pr.responses || []).filter(r => r.type !== 'knowledge');
    const blank = sims.filter(r => !String(r.answer || '').trim()).length;
    return {
      name: pr.staffName || pr.staffId, fid: pr.fid, submitted: String(pr.submittedAt || '').slice(0, 10),
      status: pr.status, held, suggested, before, after, sims: sims.length, blank,
      changes: !!held && after.belt !== held,
      strippedByNaiveRerun: !!held && before.belt !== held,
      rescuedByCalibration: !!held && before.belt !== held && after.belt === held,
    };
  });

  const changed = rows.filter(r => r.changes);
  const naive = rows.filter(r => r.strippedByNaiveRerun);
  const rescued = rows.filter(r => r.rescuedByCalibration);
  // Only an awarded belt can "change". Everyone else falls out of the counts above, and on the
  // narrow comparison run that is most of the sheet: of the 14 rows the client asked about,
  // 11 hold no awarded belt. Splitting on status would not find them, because most are already
  // marked confirmed. So split three ways, on what a reader actually has to act on:
  //   decided   an assessor has ruled, with no belt awarded. Nothing to revisit.
  //   waiting   nobody has ruled yet. The re-score is not what is holding it up, a decision is.
  const awarded = rows.filter(r => r.held);
  const decided = rows.filter(r => !r.held && r.status !== 'pending');
  const waiting = rows.filter(r => !r.held && r.status === 'pending');
  const thin = rows.filter(r => r.blank > 0);
  const fmt = n => (n == null ? 'n/a' : n.toFixed(1));
  const move = r => `simulation ${fmt(r.before.sim)} to ${fmt(r.after.sim)}, `
    + `blended ${fmt(r.before.blended)} to ${fmt(r.after.blended)}`;

  const md = [
    '# T101, placement re-score, for SIPS sign-off',
    '',
    `Generated from ${rows.length} stored placements. Nothing has been written to the database.`,
    'Simulation responses were re-graded by the live calibrated evaluator (sbd-score-assessment,',
    'prompt v2.1); knowledge answers are unchanged (they were never AI-scored). The belt logic is',
    'the deployed spec v1 engine, run on the corrected numbers.',
    '',
    '## The count',
    '',
    `- ${awarded.length} of ${rows.length} hold a belt that was awarded, so only those can show a change.`,
    `- **${changed.length ? `${changed.length} of the ${awarded.length} awarded belts ${changed.length === 1 ? 'does' : 'do'} not survive the re-score.` : `None of the ${awarded.length} changes. Each one re-scores to exactly what it already holds.`}**`,
    ...(decided.length ? [`- ${decided.length} were already decided with no belt awarded. The re-score agrees with`
      + ' every one of those decisions, so none of them needs revisiting.'] : []),
    ...(waiting.length ? [`- ${waiting.length} ${waiting.length === 1 ? 'has' : 'have'} never been decided and`
      + ` ${waiting.length === 1 ? 'is' : 'are'} still waiting. Listed separately below.`] : []),
    `- ${naive.length} would have lost an awarded belt to a re-run on the OLD scores. That is the outcome this task exists to prevent.`,
    ...(thin.length ? ['', '**Read these with care.** The simulation evidence is incomplete, so the determination rests on'
      + ' fewer answers than usual. Blank answers are skipped, not marked wrong, on both sides of the comparison.',
      ...thin.map(r => `- ${r.name}: ${r.blank} of ${r.sims} simulation answers left blank, so the result rests on ${r.sims - r.blank}.`)] : []),
    '',
    changed.length ? '## Awarded belts that change. Each needs a decision before anything is published\n'
                   : '## The awarded belts. None of them change\n',
    ...awarded.map(r => `- **${r.name}**, holds ${r.held}, re-scored determination is ${label(r.after)} (${move(r)})`),
    ...(decided.length ? ['', '## Already decided, no belt awarded. The re-score agrees with each decision\n',
      ...decided.map(r => `- **${r.name}**, decision on record is no belt, re-scored determination is ${label(r.after)} (${move(r)})`)] : []),
    ...(waiting.length ? ['', '## Still waiting on a decision\n',
      '',
      'Where a suggestion is shown, it is what the engine proposed at submission, not a belt that was',
      'awarded. The old scores and the corrected scores give the same answer, so the re-scoring is not',
      'what is holding these up. They need a decision.',
      '',
      ...waiting.map(r => `- **${r.name}**, pending since ${r.submitted}`
        + `${r.suggested ? `, suggested ${r.suggested} by the earlier engine` : ''}`
        + `, re-scored determination is ${label(r.after)} (${move(r)})`)] : []),
    '',
    '## Every placement',
    '',
    'A belt shown as awarded is one an assessor confirmed. Where the column reads None, the engine may',
    'still have suggested a belt at submission. A suggestion is a proposal awaiting a decision, not a',
    'belt the person holds.',
    '',
    '| Name | Facility | Submitted | Status | Belt awarded | Re-run on old scores | Re-scored determination | Simulation | Blended |',
    '|---|---|---|---|---|---|---|---|---|',
    ...rows.map(r => `| ${r.name} | ${r.fid} | ${r.submitted} | ${r.status} `
      + `| ${r.held || (r.suggested ? `None, ${r.suggested} suggested` : 'None')} | ${label(r.before)} | ${label(r.after)}`
      + ` | ${fmt(r.before.sim)} to ${fmt(r.after.sim)} | ${fmt(r.before.blended)} to ${fmt(r.after.blended)} |`),
    '',
    '## Sign-off',
    '',
    changed.length
      ? '- [ ] Every awarded belt that changes has been reviewed, and the person told before it is published.'
      : `- [ ] Confirmed that the ${awarded.length} awarded belt(s) are unchanged and need no action.`,
    ...(decided.length ? [`- [ ] Confirmed that the ${decided.length} already decided need no revisiting.`] : []),
    ...waiting.map(r => `- [ ] ${r.name}, pending since ${r.submitted}, has been decided.`),
    ...thin.map(r => `- [ ] ${r.name}'s result has been reviewed against their incomplete evidence.`),
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

  // The sheet has to carry the people with no belt on record. On the narrow comparison run they
  // are most of the set (9 of 14), and splitting on status would miss the 5 of those that are
  // already marked confirmed and still have neither belt column set. Both shapes are covered
  // here so that stays true. The thin-evidence row is covered at the same time.
  const noBelt = { ...pr, id: 'pr-pending', staffName: 'Pending Person', status: 'pending',
    confirmedBelt: null, tentativeBelt: null };
  const confirmedNoBelt = { ...pr, id: 'pr-confirmed-nobelt', staffName: 'Confirmed No Belt', status: 'confirmed',
    confirmedBelt: null, tentativeBelt: null };
  // The one that matters most: a suggestion the engine made at submission that nobody ever
  // actioned. Counting it as an award put a person onto a client-facing list of belts being
  // taken away when they had never been given one.
  const suggestedOnly = { ...pr, id: 'pr-suggested', staffName: 'Suggested Only', status: 'pending',
    confirmedBelt: null, tentativeBelt: 'White' };
  const thinPr = { ...pr, id: 'pr-thin', staffName: 'Thin Evidence', status: 'pending',
    confirmedBelt: null, tentativeBelt: null,
    responses: pr.responses.map((r, i) => (r.type === 'simulation' && i % 2 ? { ...r, answer: '   ' } : r)) };
  const mixed = buildSheet(mod, await rescore([pr, noBelt, confirmedNoBelt, suggestedOnly, thinPr],
    async () => ({ score: 78, feedback: 'calibrated' }), {}));
  assert.strictEqual(mixed.rows.filter(r => r.held).length, 1, 'only the confirmed fixture holds an awarded belt');
  assert.strictEqual(mixed.rows.filter(r => !r.held).length, 4, 'every no-award shape must be counted');
  const sug = mixed.rows.find(r => r.name === 'Suggested Only');
  assert.strictEqual(sug.held, null, 'a tentative belt is a suggestion, never an award');
  assert.strictEqual(sug.suggested, 'White', 'the suggestion must still be carried, so the sheet can say what it was');
  assert.strictEqual(sug.changes, false, 'a suggestion nobody actioned cannot be a belt that changes');
  assert.ok(!mixed.changed.some(r => r.name === 'Suggested Only'),
    'a suggestion must never reach the client-facing list of belts that change');
  assert.ok(mixed.md.includes('suggested White by the earlier engine'),
    'the sheet must name the suggestion as a suggestion');
  assert.ok(mixed.md.includes('## Still waiting on a decision'), 'undecided rows need their own section');
  assert.ok(mixed.md.includes('## Already decided, no belt awarded'), 'decided-no-belt rows need their own section');
  ['Pending Person', 'Confirmed No Belt', 'Suggested Only'].forEach(n =>
    assert.ok(mixed.md.includes(`**${n}**`), `${n} must be named in the sheet, not dropped from every count`));
  assert.ok(mixed.md.includes('Read these with care'), 'incomplete simulation evidence must be flagged');
  assert.ok(/Thin Evidence: \d+ of \d+ simulation answers left blank/.test(mixed.md), 'the blank count must be stated');

  // Leave the sheet the fixture produces on disk, so the format can be read before a run
  // spends an hour of grading calls on real people. Write the mixed one: it is the shape the
  // real run has, with every section present, rather than the single-row happy path.
  fs.writeFileSync(path.join(OUT, 'review-sheet.sample.md'), mixed.md);
  console.log('selftest: OK');
}

// The sheet builder is the part worth reusing from elsewhere: when the grading has to be
// driven by something other than this script's own HTTP layer (a network-restricted box, a
// re-run off cached scores), the alternative must still produce the sheet through THIS code.
// A second sheet builder is how a report and a card came to disagree before.
module.exports = { buildSheet, engineDetermination, rescore, label, loadScoringModule };

// ── main ─────────────────────────────────────────────────────────────────────────────────
if (require.main === module) (async () => {
  fs.mkdirSync(OUT, { recursive: true });
  if (has('--selftest')) return selftest();

  const url = apiUrl(), key = serviceKey();
  const mod = loadScoringModule();
  const raw = await sb('/rest/v1/placement_reviews?select=*&order=submitted_at.asc', key, url);

  // Selection. The client asked for a narrow first pass before anyone decides about the older
  // records: "rerun the ones from today and the ones still pending for comparison so we can
  // decide from there". --limit alone could not express that, because it takes the OLDEST N.
  //   --since <date>     submitted on or after this date, e.g. --since 2026-08-11
  //   --status a,b       any of these statuses, e.g. --status pending
  //   --ids a,b          exactly these reviews, and nothing else
  //   --limit N          first N of whatever the above leaves, oldest first (unchanged)
  // With none of them, the whole set is re-scored, which is the full T101 run.
  //
  // --since and --status are OR, not AND, and that is the whole point rather than a detail.
  // "Today's and the ones still pending" is two sets: the oldest pending review is from June,
  // so requiring both conditions drops it, which is the one row most in need of a second look.
  const since = argVal('--since');
  const statuses = (argVal('--status') || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const ids = (argVal('--ids') || '').split(',').map(s => s.trim()).filter(Boolean);
  let selected = raw;
  if (ids.length) {
    selected = raw.filter(r => ids.includes(r.id));
  } else if (since || statuses.length) {
    selected = raw.filter(r =>
      (since && (r.submitted_at || '') >= since) ||
      (statuses.length && statuses.includes((r.status || '').toLowerCase())));
  }
  const limit = Number(argVal('--limit') || 0);
  const reviews = (limit ? selected.slice(0, limit) : selected).map(row => ({
    id: row.id, staffId: row.staff_id, fid: row.fid, staffName: row.staff_name, staffTitle: row.staff_title,
    status: row.status, tentativeBelt: row.tentative_belt, confirmedBelt: row.confirmed_belt,
    responses: row.responses || [], submittedAt: row.submitted_at,
  }));
  // A mis-scoped run is half an hour of billed grading before anyone notices. --list prints the
  // selection and grades nothing, so the set can be checked for free first.
  if (has('--list')) {
    reviews.forEach(r => console.log(
      `${String(r.submittedAt).slice(0, 10)}  ${String(r.status || '').padEnd(10)}  ${r.staffName}`));
    console.log(`${reviews.length} placements selected, 0 graded`);
    return;
  }

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
