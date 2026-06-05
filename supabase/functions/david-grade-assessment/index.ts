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

    // ── Auth: require a valid session (grading is assessor/admin work) ──
    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    if (!jwt) return json({ error: 'Unauthorized: missing session.' }, 401);
    const { data: { user }, error: authErr } = await supabase.auth.getUser(jwt);
    if (authErr || !user) return json({ error: 'Unauthorized: invalid or expired session.' }, 401);

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

    const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://belt.sterilebydesign.ai',
        'X-Title': 'DAVID Assessment Grading',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        messages: [{ role: 'user', content: gradingPrompt }],
        temperature: 0,
        max_tokens: 8000,
      }),
    });
    if (!orRes.ok) return json({ error: `Grading model error: ${await orRes.text()}` }, 502);
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
        component_answers: { david: { verdict: r.verdict, score: r.score, note: r.note, model: 'anthropic/claude-sonnet-4.5', graded_at: new Date().toISOString() } },
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
