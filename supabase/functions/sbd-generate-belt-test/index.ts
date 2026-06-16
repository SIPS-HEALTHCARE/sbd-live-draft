// ============================================================================
// sbd-generate-belt-test — Dynamic Belt Test generation (Track A4)
//
// POST { staff_id, target_belt }  (caller = the staff member OR an admin/assessor)
//   1. JWT auth (service-role client, same pattern as sbd-assessor-pin)
//   2. Idempotency — return the existing ACTIVE test if one exists
//   3. Queue gate — require APPROVED Competency AND Simulation queue rows
//   4. Seeded sampling (sampler.mjs) — one variant per competency slot
//   5. Persist the skeleton IMMEDIATELY (variant_status:'fallback')
//   6. AI variant pass — rewrite stems/scenarios per-learner-unique; failures
//      keep the skeleton item, so an OpenRouter outage degrades, never blocks
//   7. Return the stored row
//
// The stored row is the real "reload returns the same test" guarantee; the seed
// makes regeneration reproducible.
// ============================================================================
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6';
import { deriveSeed, sampleSkeleton } from './sampler.mjs';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const ADMIN_ROLES = ['master_admin', 'staff_admin', 'system_admin', 'facility_admin', 'admin', 'educator', 'preceptor'];

// bank.json is bundled with the function; read it once at module load.
const bank = await (await fetch(new URL('./bank.json', import.meta.url))).json();

function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const admin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);
        const jwt = authHeader.replace(/^Bearer\s+/i, '');
        const { data: { user }, error: authError } = await admin.auth.getUser(jwt);
        if (authError || !user) return json({ error: 'Unauthorized' }, 401);

        const { staff_id, target_belt } = await req.json();
        if (!staff_id || !target_belt) return json({ error: 'staff_id and target_belt are required' }, 400);
        if (!bank[target_belt]) return json({ error: `No question bank for belt "${target_belt}"` }, 400);

        // ── Caller authorization: the candidate themselves, or an admin/assessor ──
        const { data: caller } = await admin
            .from('sbd_portal_users')
            .select('id, role, staff_id, facility_id, system_id, assigned_facility_ids')
            .eq('auth_uid', user.id)
            .single();
        if (!caller) return json({ error: 'Caller profile not found' }, 403);
        const isSelf = caller.staff_id === staff_id;
        const isAdmin = ADMIN_ROLES.includes(caller.role);

        const { data: staffRow } = await admin.from('staff').select('id, fid').eq('id', staff_id).single();
        if (!staffRow) return json({ error: 'Staff member not found' }, 404);
        const facility_id = staffRow.fid;

        if (!isSelf) {
            if (!isAdmin) return json({ error: 'Not authorized to generate this test' }, 403);
            const assignedFids = Array.isArray(caller.assigned_facility_ids) ? caller.assigned_facility_ids : [];
            if (caller.role === 'staff_admin' && !assignedFids.includes(facility_id)) {
                return json({ error: 'Not authorized for this facility' }, 403);
            }
            if (caller.role === 'facility_admin' && caller.facility_id !== facility_id) {
                return json({ error: 'Not authorized for this facility' }, 403);
            }
            if (caller.role === 'system_admin' && caller.system_id) {
                const { data: facRow } = await admin.from('facilities').select('system_id').eq('id', facility_id).single();
                if (!facRow || facRow.system_id !== caller.system_id) {
                    return json({ error: 'Not authorized for this hospital system' }, 403);
                }
            }
        }

        // ── 2. Idempotency — return existing ACTIVE test ──
        const { data: existing } = await admin
            .from('sbd_belt_tests')
            .select('*')
            .eq('staff_id', staff_id)
            .eq('target_belt', target_belt)
            .eq('status', 'active')
            .maybeSingle();
        if (existing) return json({ test: existing, idempotent: true });

        // ── 3. Queue gate — approved Competency AND Simulation for this belt ──
        const { data: approved } = await admin
            .from('sbd_assessment_queue')
            .select('id, assessment_type')
            .eq('staff_id', staff_id)
            .eq('target_belt', target_belt)
            .eq('status', 'approved')
            .in('assessment_type', ['Competency', 'Simulation']);
        const types = new Set((approved || []).map((r) => r.assessment_type));
        if (!types.has('Competency') || !types.has('Simulation')) {
            return json({
                error: 'Belt test requires an approved Competency AND Simulation request for this belt.',
                code: 'QUEUE_NOT_APPROVED',
            }, 403);
        }
        const queue_ids = (approved || []).map((r) => r.id);

        // ── 4. Seeded sampling ──
        const test_date = new Date().toISOString().slice(0, 10);
        const seed = deriveSeed(staff_id, target_belt, test_date);
        const skeleton = sampleSkeleton(bank, target_belt, seed);

        // Tag every item with variant_status so the audit trail survives.
        skeleton.knowledge.forEach((q: any) => { q.variant_status = 'fallback'; q.skeleton_id = q.id; });
        skeleton.simulation.forEach((q: any) => { q.variant_status = 'fallback'; q.skeleton_id = q.id; });

        // ── 5. Persist the skeleton immediately ──
        const { data: inserted, error: insErr } = await admin
            .from('sbd_belt_tests')
            .insert({
                staff_id, facility_id, queue_ids, target_belt, seed, test_date,
                questions: { knowledge: skeleton.knowledge, simulation: skeleton.simulation },
                variant_status: 'fallback', status: 'active',
            })
            .select('*')
            .single();
        if (insErr || !inserted) {
            // A concurrent request may have won the unique index — return the winner.
            const { data: race } = await admin
                .from('sbd_belt_tests').select('*')
                .eq('staff_id', staff_id).eq('target_belt', target_belt).eq('status', 'active').maybeSingle();
            if (race) return json({ test: race, idempotent: true });
            console.error('belt test insert error', insErr);
            return json({ error: 'Failed to persist belt test' }, 500);
        }

        // ── 6. AI variant pass (best-effort) ──
        const openRouterKey = Deno.env.get('OPENROUTER_API_KEY') || '';
        let variantStatus: 'ai' | 'fallback' | 'mixed' = 'fallback';
        if (openRouterKey) {
            try {
                const kRes = await rewriteVariants(openRouterKey, 'knowledge', skeleton.knowledge);
                const sRes = await rewriteVariants(openRouterKey, 'simulation', skeleton.simulation);
                const anyAi = kRes.changed || sRes.changed;
                const allAi = kRes.allChanged && sRes.allChanged;
                variantStatus = allAi ? 'ai' : anyAi ? 'mixed' : 'fallback';
                if (anyAi) {
                    await admin.from('sbd_belt_tests').update({
                        questions: { knowledge: skeleton.knowledge, simulation: skeleton.simulation },
                        variant_status: variantStatus,
                    }).eq('id', inserted.id);
                    inserted.questions = { knowledge: skeleton.knowledge, simulation: skeleton.simulation };
                    inserted.variant_status = variantStatus;
                }
            } catch (e) {
                console.error('AI variant pass failed; serving skeleton', e);
            }
        }

        return json({ test: inserted, idempotent: false, variant_status: variantStatus });
    } catch (err: any) {
        console.error('generate-belt-test error', err?.message || err);
        return json({ error: err?.message || 'Internal error' }, 500);
    }
});

// Rewrite stems/scenarios in chunks. MUTATES items in place (q.q / q.scenario).
// MCQ options + correct index are NEVER touched, so correctness can't break.
// Returns { changed, allChanged } so the caller can set variant_status.
async function rewriteVariants(key: string, kind: 'knowledge' | 'simulation', items: any[]) {
    const CHUNK = 8;
    let changedCount = 0;
    for (let i = 0; i < items.length; i += CHUNK) {
        const chunk = items.slice(i, i + CHUNK);
        const payload = chunk.map((it, idx) => ({
            i: idx,
            text: kind === 'knowledge' ? it.q : it.scenario,
        }));
        const instruction = kind === 'knowledge'
            ? 'Paraphrase each multiple-choice QUESTION STEM so it reads differently but tests the exact same concept and remains answerable by the SAME options (which you are NOT given and must NOT change). Do not add or remove specifics that would alter the correct answer.'
            : 'Paraphrase each situational SCENARIO prompt so it reads differently but presents the same situation and calls for the same correct judgment. Keep it concise.';
        const prompt = `You are rewriting sterile-processing assessment items for per-candidate uniqueness. ${instruction}
Return ONLY a JSON array of objects {"i":<index>,"text":"<rewritten>"} with one entry per input. No markdown, no commentary.

Input:
${JSON.stringify(payload)}`;
        try {
            const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://belt.sterilebydesign.ai',
                    'X-Title': 'SBD Belt Test Generator',
                },
                body: JSON.stringify({
                    model: 'anthropic/claude-3.5-haiku',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 1200,
                    temperature: 0.7,
                }),
            });
            if (!orRes.ok) { console.error('OpenRouter', kind, await orRes.text()); continue; }
            const data = await orRes.json();
            let text = (data.choices?.[0]?.message?.content || '').trim();
            const m = text.match(/\[[\s\S]*\]/);
            if (m) text = m[0];
            const arr = JSON.parse(text);
            if (!Array.isArray(arr)) continue;
            for (const entry of arr) {
                const idx = Number(entry.i);
                const rewritten = String(entry.text || '').trim();
                // Per-item validation: non-empty, reasonable length. Else keep skeleton.
                if (!chunk[idx] || rewritten.length < 12 || rewritten.length > 1200) continue;
                if (kind === 'knowledge') chunk[idx].q = rewritten; else chunk[idx].scenario = rewritten;
                chunk[idx].variant_status = 'ai';
                changedCount++;
            }
        } catch (e) {
            console.error('variant chunk failed', e);
        }
    }
    return { changed: changedCount > 0, allChanged: changedCount === items.length };
}
