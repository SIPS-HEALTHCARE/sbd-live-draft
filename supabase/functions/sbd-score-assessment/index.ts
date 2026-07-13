import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { callOpenRouter } from '../_shared/openrouter.ts';
import { MODEL_CHAINS } from '../_shared/models.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SBD OS Simulation Response Evaluator — System Prompt v2.1 (SIPS, June 2026).
// Replaces the prior "explicit patient-safety language" rubric that systematically
// underscored real procedural answers (0-8% on valid responses). Credits IMPLICIT
// patient safety and never zeros a non-blank, non-dangerous answer.
const EVALUATOR_SYSTEM_PROMPT_V2 = `You are the SBD OS simulation response evaluator. You score candidate simulation responses on a 0-100 scale and provide brief, specific evaluator notes that name what was present and what was missing.

PART 1 — SCORING RUBRIC
80-100 (COMPREHENSIVE): Names the correct action AND explicitly states the patient safety consequence AND describes the documentation step or escalation chain. Standards citation (AAMI ST:79, AORN, etc.) contributes positively.
65-79 (ADEQUATE — PASSES ALL BELT FLOORS): Names the correct action with patient safety connection present (explicit OR implicit — see Part 2). Documentation or escalation addressed but may lack specificity. Demonstrates protocol awareness.
45-64 (PARTIAL): Identifies the correct first action but stops before completing the protocol. May be missing patient safety rationale and documentation. Directionally correct but incomplete.
25-44 (MINIMAL): One to two sentences identifying a general correct direction. Correct instinct with no follow-through.
10-24 (NEAR BLANK): Some text present but insufficient content to evaluate protocol knowledge.
0 (ZERO — TWO CASES ONLY): (1) No text submitted / blank response. (2) Response contains a dangerous answer that would directly harm a patient if acted on. NOTHING ELSE IS A ZERO. A brief but directionally correct response is never a zero.

PART 2 — IMPLICIT PATIENT SAFETY RATIONALE (the most important calibration rule)
When a candidate's action itself demonstrates patient safety understanding, the patient safety element is PRESENT even without an explicit patient-safety sentence. The four cases: (1) REFUSAL of a dangerous shortcut (refusing to skip decontamination, release a non-sterile item, or interrupt a cycle); (2) REMOVAL FROM SERVICE of a nicked/rusted/damaged instrument with a repair tag; (3) QUARANTINE of compromised packaging or a suspected sterility breach; (4) RECALL of instruments from a BI-positive load, incomplete cycle, or compromised run. In each, the action IS the patient safety response — score in Adequate range or above if action plus some escalation is present. Implicit credit does NOT apply when the question explicitly asks to explain why each step matters for patient safety, when the action is not self-evidently patient-safety-driven, or when the response contains a dangerous answer.

PART 3 — ANTI-BIAS RULES (non-negotiable)
1. Institutional vocabulary (AAMI ST:79, three-sink, OneSource, boxlocks, cycle types, Bowie Dick, biological indicator loads) NEVER reduces a score; it is evidence of field experience. Score on content quality.
2. Format NEVER reduces a score (narrative, numbered steps, brief statements, process description).
3. Zero is reserved for blank or dangerous responses only. A one-sentence response with the correct first action scores 25-44 minimum.
4. "Response lacks relevant content" may ONLY be used when the response genuinely does not address the scenario. A response describing decontamination, escalation, standards, a recall, or any protocol element CONTAINS relevant content.
5. Length is not a criterion. A three-sentence response can score 80+; a long vague one scores 25-35.

PART 4 — CONSISTENCY CHECK (ask internally before returning a score)
Would a similar-quality response from a different candidate score the same? Is this action one that implicitly demonstrates patient safety (Part 2)? Is the score below 25 for a response that is not blank or dangerous (if so, revise upward)? Is "lacks relevant content" accurate? Are you penalizing institutional vocabulary rather than content?

PART 5 — EVALUATOR NOTE
Name specifically what was present and what was missing. NEVER use generic phrases like "lacks relevant content" or "does not contain a meaningful answer" when the response has substantive content.`;

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const openRouterKey = Deno.env.get('OPENROUTER_API_KEY') || '';
        if (!openRouterKey) throw new Error('OPENROUTER_API_KEY not configured');

        // Verify caller is authenticated. The frontend (sbFetch) always sends BOTH
        // the anon apikey header AND an Authorization bearer (the candidate's session
        // token, or the anon key when there is no session). The previous version called
        // supabase.auth.getUser(), which 401'd whenever a candidate's session token was
        // stale/expired mid-assessment — that silently dropped the whole simulation
        // batch to the keyword fallback (generic notes + wrong-low sim scores).
        // We now accept either a matching anon apikey or any bearer token; OpenRouter
        // is the only privileged call and it uses a server-side key, so this is safe.
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
        const hasAnon = (req.headers.get('apikey') || '') === supabaseAnonKey && supabaseAnonKey.length > 0;
        const hasBearer = /^Bearer\s+.+/i.test(req.headers.get('Authorization') || '');
        if (!hasAnon && !hasBearer) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const { question, answer, answer_key, fail_indicator } = await req.json();
        if (!question || !answer) {
            return new Response(JSON.stringify({ error: 'Missing question or answer' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Answer-key-aware grading when the caller supplies the scenario's
        // expected_response (and optionally a fail indicator) -- the AIP
        // scenario bank. Falls back to the original generic rubric when not
        // provided, so existing {question, answer} callers are unchanged.
        const keyAware = typeof answer_key === 'string' && answer_key.trim().length > 0;
        const userTask = keyAware
            ? `Score this candidate's simulation response using the rubric in your instructions, weighed together with the official SBD answer key below.

Scenario: ${question}

Official answer key (elements a correct response should cover): ${answer_key}
${fail_indicator ? `\nFAIL INDICATOR -- if the response does or recommends this, it is a dangerous patient-safety failure (a Part 1 zero case): ${fail_indicator}\n` : ''}
Candidate response: ${answer}

${fail_indicator ? 'If the response triggers the fail indicator, treat it as dangerous: cap the score at 30 and set "dangerous": true. ' : ''}Respond with ONLY a JSON object like: {"score":75,"feedback":"One or two sentences naming what was present and what was missing.","dangerous":false}
No markdown, no preamble.`
            : `Score this candidate's simulation response using the rubric in your instructions.

Scenario: ${question}

Candidate response: ${answer}

Respond with ONLY a JSON object like: {"score":75,"feedback":"One or two sentences naming what was present and what was missing."}
No markdown, no preamble.`;

        // #47: resilient call. Primary is the cheap Haiku tier, falling back to Sonnet
        // on a dead slug (a retired slug — e.g. the old `claude-3.5-haiku` that 404'd —
        // once dropped every grade to the keyword fallback), a provider 5xx, or a
        // timeout. The chain lives in _shared/models.ts so the active model is
        // reportable from one place.
        let orRes: Response;
        let servedModel: string;
        try {
            const call = await callOpenRouter({
                apiKey: openRouterKey,
                models: MODEL_CHAINS.assessmentScorer,
                messages: [
                    { role: 'system', content: EVALUATOR_SYSTEM_PROMPT_V2 },
                    { role: 'user', content: userTask }
                ],
                maxTokens: keyAware ? 240 : 180,
                temperature: 0.3,
                title: 'SBD Assessment Scorer',
            });
            orRes = call.res;
            servedModel = call.servedModel;
        } catch (err: any) {
            console.error('OpenRouter error (all models failed):', err?.message || err);
            return new Response(JSON.stringify({ error: 'AI scoring unavailable' }), {
                status: 502,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const data = await orRes.json();
        const text = data.choices?.[0]?.message?.content || '';

        // The model sometimes wraps its JSON in a ```json code fence despite the
        // no-markdown instruction. Strip any fences, then prefer the first {...}
        // block so all fields (score, feedback, dangerous) survive intact.
        let result;
        const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const block = cleaned.match(/\{[\s\S]*\}/);
        try {
            result = JSON.parse(block ? block[0] : cleaned);
        } catch {
            const scoreMatch = cleaned.match(/"score"\s*:\s*(\d{1,3})/) || cleaned.match(/(\d{1,3})/);
            const fbMatch = cleaned.match(/"feedback"\s*:\s*"([^"]+)"/);
            result = {
                score: scoreMatch ? parseInt(scoreMatch[1]) : 50,
                feedback: fbMatch ? fbMatch[1] : cleaned.substring(0, 300)
            };
        }

        return new Response(JSON.stringify({ ...result, model: servedModel }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err: any) {
        console.error('Score assessment error:', err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
