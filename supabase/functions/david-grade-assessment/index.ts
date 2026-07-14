// David OG — open-ended assessment grading (M3)
//
// The AIP engine (aip_submit_quiz) saves candidate answers but marks every
// open-ended item `needs_manual_scoring`. This function does that grading:
// for a given attempt it pulls each question + the candidate's answer + the
// facilitator answer key + fail indicator, asks Claude to grade them, then
// writes the verdict/score back into THIS attempt's records only.
//
// Writes: aip_question_responses (is_correct, partial_score, needs_manual_scoring,
//         component_answers.david = {verdict,note,score}) and aip_assessment_attempts
//         (correct_answers, score_percentage, passed). It never touches questions/answers.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6';

// ─── Inlined from supabase/functions/_shared/models.ts (#47) ─────────────────
// This function is deployed via the Supabase dashboard (copy-paste), which cannot
// resolve the `../_shared` import, so the model slugs + fallback chains live inline
// here. Keep in sync with _shared/models.ts if that file changes.
const MODELS = {
  chatDefault: 'anthropic/claude-sonnet-4.5',
  chatCheap: 'anthropic/claude-haiku-4.5',
  assessmentScorer: 'anthropic/claude-haiku-4.5',
  grader: 'anthropic/claude-sonnet-4.5',
} as const;

// Primary first. Each chain crosses the Haiku/Sonnet tiers so a retired slug or a
// single-tier outage still yields a graded result rather than a 502.
const MODEL_CHAINS = {
  assessmentScorer: [MODELS.assessmentScorer, MODELS.chatDefault], // haiku → sonnet
  grader: [MODELS.grader, MODELS.chatCheap],                       // sonnet → haiku
} as const;
// ─── end inlined models ──────────────────────────────────────────────────────

// ─── Inlined from supabase/functions/_shared/openrouter.ts (#47) ─────────────
// Same reason as above — the resilient OpenRouter caller lives inline for the
// dashboard deploy. Tries the primary model; on a RETRYABLE failure (HTTP 429/5xx,
// network/timeout) it retries with backoff, then falls back to the next model in
// the chain. On a DEAD-SLUG failure (404/400 naming an unknown model) it skips
// straight to the next. On success the Response is returned with its body UNREAD.
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface CallOpenRouterOpts {
  apiKey: string;
  models: readonly string[]; // [primary, ...fallbacks]
  messages: unknown[];
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  referer?: string;
  title?: string;
  timeoutMs?: number; // per-attempt abort (default 30s)
  maxRetriesPerModel?: number; // transient retries before moving to the next model
  extraBody?: Record<string, unknown>; // merged into the request body (e.g. tools, usage)
}

interface CallOpenRouterResult {
  res: Response; // ok response, body unread
  servedModel: string; // the model that answered
  attempts: number; // total network attempts made
}

function isDeadSlug(status: number, body: string): boolean {
  if (status !== 404 && status !== 400) return false;
  return /no endpoints|not a valid model|no allowed providers|model.*not found|is not a valid/i.test(body);
}

const isRetryableStatus = (s: number) => s === 429 || (s >= 500 && s <= 599);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callOpenRouter(opts: CallOpenRouterOpts): Promise<CallOpenRouterResult> {
  const {
    apiKey,
    models,
    messages,
    maxTokens,
    temperature,
    stream = false,
    referer = 'https://belt.sterilebydesign.ai',
    title = 'SBD',
    timeoutMs = 30000,
    maxRetriesPerModel = 2,
    extraBody,
  } = opts;

  if (!apiKey) throw new Error('callOpenRouter: OPENROUTER_API_KEY missing');
  if (!models || models.length === 0) throw new Error('callOpenRouter: no models provided');

  let attempts = 0;
  let lastError = 'no attempt made';

  for (const model of models) {
    for (let retry = 0; retry <= maxRetriesPerModel; retry++) {
      attempts++;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(OPENROUTER_URL, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': referer,
            'X-Title': title,
          },
          body: JSON.stringify({
            model,
            messages,
            ...(maxTokens != null ? { max_tokens: maxTokens } : {}),
            ...(temperature != null ? { temperature } : {}),
            ...(stream ? { stream: true } : {}),
            ...(extraBody || {}),
          }),
        });
        clearTimeout(timer);

        if (res.ok) return { res, servedModel: model, attempts };

        const body = await res.text();
        lastError = `model=${model} status=${res.status} ${body.slice(0, 300)}`;
        console.error('[openrouter]', lastError);

        if (isDeadSlug(res.status, body)) break; // permanent → next model
        if (isRetryableStatus(res.status) && retry < maxRetriesPerModel) {
          await sleep(300 * (retry + 1));
          continue; // transient → retry same model
        }
        break; // non-retryable (e.g. 401/403) → next model
      } catch (err) {
        clearTimeout(timer);
        lastError = `model=${model} network/timeout: ${err instanceof Error ? err.message : String(err)}`;
        console.error('[openrouter]', lastError);
        if (retry < maxRetriesPerModel) {
          await sleep(300 * (retry + 1));
          continue; // transient network → retry same model
        }
        break; // exhausted retries → next model
      }
    }
  }

  throw new Error(`OpenRouter failed for all models [${models.join(', ')}]. Last error: ${lastError}`);
}
// ─── end inlined openrouter ──────────────────────────────────────────────────

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY') || '';
    if (!openRouterKey) throw new Error('OPENROUTER_API_KEY is not configured.');

    const supabase = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

    // ── Auth: require a valid session (grading is assessor/admin work). ──
    // Two accepted callers: (1) a logged-in user session (production — an assessor/
    // admin in the app), or (2) the service-role key, which is never exposed to
    // clients (backend / server-to-server / controlled testing).
    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    if (!jwt) return json({ error: 'Unauthorized: missing token.' }, 401);
    if (jwt !== serviceKey) {
      const { data: { user }, error: authErr } = await supabase.auth.getUser(jwt);
      if (authErr || !user) return json({ error: 'Unauthorized: invalid or expired session.' }, 401);
    }

    const { attempt_id, dry_run = false } = await req.json();
    if (!attempt_id) return json({ error: 'attempt_id is required.' }, 400);

    // ── Load the attempt + its level threshold ──
    const { data: attempt } = await supabase
      .from('aip_assessment_attempts')
      .select('id, level_id, total_questions')
      .eq('id', attempt_id).single();
    if (!attempt) return json({ error: 'Attempt not found.' }, 404);

    const { data: level } = await supabase
      .from('aip_levels').select('code, passing_threshold').eq('id', attempt.level_id).single();
    const passingThreshold = level?.passing_threshold ?? 80;

    // ── Load this attempt's responses ──
    const { data: responses } = await supabase
      .from('aip_question_responses')
      .select('id, question_id, candidate_answer')
      .eq('attempt_id', attempt_id);
    if (!responses || responses.length === 0) return json({ error: 'No responses on this attempt.' }, 400);

    // ── Load the questions + answer keys for those responses ──
    const qIds = responses.map(r => r.question_id);
    const { data: questions } = await supabase
      .from('aip_questions').select('id, question_text, part').in('id', qIds);
    const { data: answers } = await supabase
      .from('aip_answers').select('question_id, answer_text, answer_component').in('question_id', qIds);

    const qMap: Record<string, any> = {};
    (questions || []).forEach(q => { qMap[q.id] = q; });
    const keyMap: Record<string, { expected: string[]; fail: string[] }> = {};
    (answers || []).forEach(a => {
      const k = keyMap[a.question_id] || (keyMap[a.question_id] = { expected: [], fail: [] });
      if (a.answer_component === 'fail_indicator') k.fail.push(a.answer_text);
      else if (a.answer_component !== 'explanation') k.expected.push(a.answer_text); // full_answer / expected_response
    });

    // ── Build the grading payload ──
    const items = responses.map((r, i) => ({
      i,
      response_id: r.id,
      question: qMap[r.question_id]?.question_text || '',
      candidate_answer: (r.candidate_answer || '').trim(),
      answer_key: (keyMap[r.question_id]?.expected || []).join(' | '),
      fail_indicator: (keyMap[r.question_id]?.fail || []).join(' | '),
    }));

    const gradingPrompt =
`You are David OG, an SBD certified assessment grader. Grade each candidate answer against the answer key.
Rules:
- Accept correct MEANING even if worded differently or briefer; do not require exact wording.
- If the candidate's answer matches the fail_indicator (the wrong action), it is "incorrect".
- Blank/empty answers are "incorrect".
- "partial" = the core idea is right but a required element is missing.
Return ONLY a JSON array, one object per item, no prose:
[{"i":0,"verdict":"correct|partial|incorrect","score":1|0.5|0,"note":"one concise sentence why"}]

ITEMS:
${JSON.stringify(items.map(({ i, question, candidate_answer, answer_key, fail_indicator }) => ({ i, question, candidate_answer, answer_key, fail_indicator })), null, 1)}`;

    // #47: resilient call. Sonnet primary, Haiku fallback on a dead slug, provider
    // 5xx, or timeout — a retired grader slug no longer 502s the whole batch. Chain
    // defined at the top of this file (inlined from _shared/models.ts).
    let orRes: Response;
    let servedModel: string = MODEL_CHAINS.grader[0];
    try {
      const call = await callOpenRouter({
        apiKey: openRouterKey,
        models: MODEL_CHAINS.grader,
        messages: [{ role: 'user', content: gradingPrompt }],
        temperature: 0,
        maxTokens: 8000,
        title: 'DAVID Assessment Grading',
      });
      orRes = call.res;
      servedModel = call.servedModel;
    } catch (err: any) {
      return json({ error: `Grading model error: ${err?.message || err}` }, 502);
    }
    const orJson = await orRes.json();
    const raw = orJson.choices?.[0]?.message?.content || '';
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return json({ error: 'Grader did not return parseable JSON.', raw }, 502);
    const grades: Array<{ i: number; verdict: string; score: number; note: string }> = JSON.parse(match[0]);

    // ── Tally ──
    let scoreSum = 0;
    const byIndex: Record<number, any> = {};
    grades.forEach(g => { byIndex[g.i] = g; scoreSum += Number(g.score) || 0; });
    const total = items.length;
    const pct = Math.round((scoreSum / total) * 1000) / 10; // one decimal
    const passed = pct >= passingThreshold;
    const correctCount = grades.filter(g => Number(g.score) >= 1).length;

    const results = items.map(it => {
      const g = byIndex[it.i] || { verdict: 'incorrect', score: 0, note: 'No grade returned.' };
      return { response_id: it.response_id, question: it.question, candidate_answer: it.candidate_answer,
               verdict: g.verdict, score: Number(g.score) || 0, note: g.note };
    });

    // ── dry_run: return grades WITHOUT writing anything ──
    if (dry_run) {
      return json({ dry_run: true, level: level?.code, total, score_percentage: pct, passing_threshold: passingThreshold, passed, results });
    }

    // ── Write grades back (this attempt's records only) ──
    for (const r of results) {
      await supabase.from('aip_question_responses').update({
        is_correct: r.score >= 1,
        partial_score: r.score,
        needs_manual_scoring: false,
        component_answers: { david: { verdict: r.verdict, score: r.score, note: r.note, model: servedModel, graded_at: new Date().toISOString() } },
      }).eq('id', r.response_id);
    }
    await supabase.from('aip_assessment_attempts').update({
      correct_answers: correctCount,
      score_percentage: pct,
      passed,
    }).eq('id', attempt_id);

    return json({ attempt_id, level: level?.code, total, correct: correctCount, score_percentage: pct, passing_threshold: passingThreshold, passed, results });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
