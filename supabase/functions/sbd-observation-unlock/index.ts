import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// T37 (S12) — server-side two-PIN observation unlock. Was: ovsUnlock() in
// ui-views.js compared both PINs in the browser against DB.staff, and
// observation_pin was shipped to every role that can read a staff row. This
// function is the template's sibling to sbd-assessor-pin's validate_pin —
// same rate-limit shape (#60), same sbd_assessment_pin_attempts ledger, scoped
// to assessment_type='observation'.
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MINUTES = 10;
const LOCKOUT_DURATION_MINUTES = 15;
const WRITE_ROLES = ['master_admin', 'admin', 'assessor'];

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const body = await req.json();
        const { observation_id, observer_pin, candidate_pin } = body;
        if (!observation_id || !observer_pin || !candidate_pin) {
            throw new Error('observation_id, observer_pin, and candidate_pin are required');
        }

        // ── Verify caller identity ──
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');
        const jwt = authHeader.replace(/^Bearer\s+/i, '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt);
        if (authError || !user) throw new Error('Unauthorized: Invalid or expired session');

        // ── Verify caller may conduct/record observations at all ──
        // Mirrors the frontend's _canWriteObs(): master_admin/admin/assessor role,
        // or the assessor capability grant (#73).
        const { data: caller } = await supabaseAdmin
            .from('sbd_portal_users')
            .select('id, role, capabilities')
            .eq('auth_uid', user.id)
            .single();

        const callerCanWrite = !!caller && (
            WRITE_ROLES.includes(caller.role) ||
            (caller.capabilities && caller.capabilities.assessor === true)
        );
        if (!callerCanWrite) {
            throw new Error('Unauthorized: Recording observations is limited to master admins and granted assessors.');
        }

        // ── Load the observation ──
        const { data: observation } = await supabaseAdmin
            .from('observations')
            .select('id, staff_id, fid, handshake, status')
            .eq('id', observation_id)
            .single();
        if (!observation) throw new Error('Observation not found.');

        // ── Rate limit / lockout (#60 pattern) — keyed on the candidate being
        // observed, so brute-forcing one candidate's PINs can't spend an
        // unrelated candidate's attempt budget. Only FAILED entries count.
        const lookbackMs = (LOCKOUT_WINDOW_MINUTES + LOCKOUT_DURATION_MINUTES) * 60 * 1000;
        const lookbackIso = new Date(Date.now() - lookbackMs).toISOString();
        const { data: recentFails } = await supabaseAdmin
            .from('sbd_assessment_pin_attempts')
            .select('created_at')
            .eq('staff_id', observation.staff_id)
            .eq('assessment_type', 'observation')
            .eq('outcome', 'failed')
            .gt('created_at', lookbackIso)
            .order('created_at', { ascending: false });

        if (recentFails && recentFails.length >= MAX_FAILED_ATTEMPTS) {
            const lastFailMs = new Date(recentFails[0].created_at).getTime();
            const windowMs = LOCKOUT_WINDOW_MINUTES * 60 * 1000;
            const inWindow = recentFails.filter(
                (r: any) => lastFailMs - new Date(r.created_at).getTime() <= windowMs
            ).length;
            const lockExpiresMs = lastFailMs + LOCKOUT_DURATION_MINUTES * 60 * 1000;
            if (inWindow >= MAX_FAILED_ATTEMPTS && Date.now() < lockExpiresMs) {
                const retryMinutes = Math.ceil((lockExpiresMs - Date.now()) / 60000);
                await supabaseAdmin
                    .from('sbd_assessment_pin_attempts')
                    .insert({ staff_id: observation.staff_id, facility_id: observation.fid, assessment_type: 'observation', outcome: 'locked_out' });
                return new Response(JSON.stringify({
                    error: `Too many incorrect attempts. Try again in ${retryMinutes} minute${retryMinutes === 1 ? '' : 's'}.`,
                    code: 'RATE_LIMITED',
                    retry_after_minutes: retryMinutes,
                }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
        }

        // ── Resolve the observer by PIN (service role — bypasses the column
        // privilege that now hides observation_pin from ordinary clients) ──
        const { data: observer } = await supabaseAdmin
            .from('staff')
            .select('id, first, last')
            .eq('observer', true)
            .eq('observation_pin', String(observer_pin).trim())
            .maybeSingle();

        if (!observer) {
            await supabaseAdmin
                .from('sbd_assessment_pin_attempts')
                .insert({ staff_id: observation.staff_id, facility_id: observation.fid, assessment_type: 'observation', outcome: 'failed' });
            return new Response(JSON.stringify({
                error: 'Observer PIN not recognized. Only an authorized observer with a PIN can begin.',
                code: 'INVALID_OBSERVER_PIN'
            }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (String(observer.id) === String(observation.staff_id)) {
            return new Response(JSON.stringify({
                error: 'A candidate cannot observe their own assessment. A different authorized observer must score it.',
                code: 'SELF_OBSERVATION'
            }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const candidatePinOnFile = observation.handshake && observation.handshake.candidate_pin;
        if (!candidatePinOnFile || String(candidatePinOnFile) !== String(candidate_pin).trim()) {
            await supabaseAdmin
                .from('sbd_assessment_pin_attempts')
                .insert({ staff_id: observation.staff_id, facility_id: observation.fid, assessment_type: 'observation', outcome: 'failed' });
            return new Response(JSON.stringify({
                error: 'Candidate PIN does not match this observation.',
                code: 'INVALID_CANDIDATE_PIN'
            }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({
            success: true,
            observer_id: observer.id,
            observer_name: `${observer.first} ${observer.last}`,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (err: any) {
        console.error('Observation Unlock Error:', err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
