import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Autonomous Anomaly Detector (DAVID Swarm) — Task #59
// ---------------------------------------------------------------------------
// Detects facilities burning an abusive volume of David tokens in a short
// window and, WHEN ARMED, auto-enforces against them (disable / tier-floor).
//
// SAFETY MODEL (read before deploying):
//  * The enforcement killswitch defaults to OFF. With ANOMALY_ENFORCE_ENABLED
//    unset/false the function is exactly its old self — it detects + logs and
//    writes NOTHING. Deploying this file changes no behavior until armed.
//  * Every enforcement is a single reversible column flip on
//    david_facility_access and is recorded in david_audit_logs with the prior
//    state, so a master admin can undo it and see exactly why it happened.
//  * All thresholds / the action / exemptions are env-overridable, so the
//    Task #59 scope answers (thresholds + killswitch scope, still pending from
//    Shawn as of 2026-07-15) become config changes, not code changes.
//
// SCHEDULING NOTE: this project has pg_cron disabled and config.toml defines
// no schedule for this function, so it does NOT run autonomously yet. A trigger
// (external cron hitting the function URL, or a Supabase scheduled function)
// must be added for enforcement to fire on a cadence. See the companion design
// doc: plans/Task59_anomaly-enforce_DESIGN.md.
// ---------------------------------------------------------------------------

// ── Env helpers (all optional; conservative defaults) ──
function envInt(name: string, fallback: number): number {
    const raw = Deno.env.get(name);
    if (raw === undefined || raw === null || raw.trim() === '') return fallback;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
}
function envBool(name: string): boolean {
    return (Deno.env.get(name) || '').trim().toLowerCase() === 'true';
}
function envCsv(name: string): Set<string> {
    return new Set((Deno.env.get(name) || '')
        .split(',').map((s) => s.trim()).filter(Boolean));
}

// Enforcement actions. Each is one reversible UPDATE on david_facility_access.
type EnforceAction = 'disable' | 'tier_floor';
function resolveAction(): EnforceAction {
    const raw = (Deno.env.get('ANOMALY_ENFORCE_ACTION') || 'disable').trim().toLowerCase();
    return raw === 'tier_floor' ? 'tier_floor' : 'disable';
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

        // Service Role Key — autonomous background task; bypasses RLS.
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // ── Config (env-overridable) ──
        const TOKEN_THRESHOLD = envInt('ANOMALY_TOKEN_THRESHOLD', 50000); // tokens per window
        const WINDOW_MINUTES  = envInt('ANOMALY_WINDOW_MINUTES', 60);
        const ENFORCE_ENABLED = envBool('ANOMALY_ENFORCE_ENABLED');       // KILLSWITCH — default OFF
        const ENFORCE_ACTION  = resolveAction();                          // 'disable' | 'tier_floor'
        const EXEMPT          = envCsv('ANOMALY_ENFORCE_EXEMPT');          // facility_ids never enforced

        // 1. Fetch recent usage logs within the window.
        const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
        const { data: usageLogs, error: logError } = await supabase
            .from('david_usage_logs')
            .select('facility_id, user_id, prompt_tokens, completion_tokens, created_at')
            .gte('created_at', windowStart);

        if (logError) throw logError;

        // 2. Aggregate token burn by facility.
        const facilityBurn: Record<string, number> = {};
        for (const log of usageLogs || []) {
            if (!log.facility_id) continue;
            const totalTokens = (log.prompt_tokens || 0) + (log.completion_tokens || 0);
            facilityBurn[log.facility_id] = (facilityBurn[log.facility_id] || 0) + totalTokens;
        }

        // 3. Detect anomalies and, if armed, enforce.
        const anomaliesDetected: Array<{ facilityId: string; totalTokens: number }> = [];
        const enforced: Array<{ facilityId: string; totalTokens: number; action: EnforceAction }> = [];
        const skipped:  Array<{ facilityId: string; reason: string }> = [];

        for (const [facilityId, totalTokens] of Object.entries(facilityBurn)) {
            if (totalTokens <= TOKEN_THRESHOLD) continue;

            anomaliesDetected.push({ facilityId, totalTokens });
            console.warn(`[DAVID SWARM] 🚨 ANOMALY: facility ${facilityId} burned ${totalTokens} tokens in ${WINDOW_MINUTES}m (threshold ${TOKEN_THRESHOLD}).`);

            // Killswitch OFF → dry-run: detect + log only, write nothing.
            if (!ENFORCE_ENABLED) { skipped.push({ facilityId, reason: 'enforce_disabled_dry_run' }); continue; }

            // Never enforce against exempt facilities (e.g. SIPS-internal).
            if (EXEMPT.has(facilityId)) { skipped.push({ facilityId, reason: 'exempt' }); continue; }

            // Pull the current access row for idempotency + audit-of-prior-state.
            const { data: acc, error: accErr } = await supabase
                .from('david_facility_access')
                .select('is_active, tier, usage_tier, max_monthly_tokens')
                .eq('facility_id', facilityId)
                .maybeSingle();

            if (accErr) { console.error(`[DAVID SWARM] access read failed for ${facilityId}:`, accErr.message); skipped.push({ facilityId, reason: 'access_read_failed' }); continue; }
            if (!acc)   { skipped.push({ facilityId, reason: 'no_access_row' }); continue; }

            // Idempotency: don't re-enforce an already-enforced facility.
            if (ENFORCE_ACTION === 'disable' && acc.is_active === false) { skipped.push({ facilityId, reason: 'already_disabled' }); continue; }
            if (ENFORCE_ACTION === 'tier_floor' && acc.usage_tier === 'included') { skipped.push({ facilityId, reason: 'already_tier_floor' }); continue; }

            // Build the enforcement patch (single reversible column flip).
            const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
            if (ENFORCE_ACTION === 'disable')    patch.is_active  = false;
            if (ENFORCE_ACTION === 'tier_floor') patch.usage_tier = 'included';

            const { error: upErr } = await supabase
                .from('david_facility_access')
                .update(patch)
                .eq('facility_id', facilityId);

            if (upErr) { console.error(`[DAVID SWARM] enforce update failed for ${facilityId}:`, upErr.message); skipped.push({ facilityId, reason: 'update_failed' }); continue; }

            // Audit — records prior state so a master admin can review + reverse.
            const { error: auditErr } = await supabase.from('david_audit_logs').insert({
                facility_id: facilityId,
                actor_id: null, // autonomous swarm action
                action: 'anomaly_auto_enforce',
                target_id: facilityId,
                details: {
                    enforce_action: ENFORCE_ACTION,
                    observed_tokens: totalTokens,
                    threshold: TOKEN_THRESHOLD,
                    window_minutes: WINDOW_MINUTES,
                    prior_is_active: acc.is_active,
                    prior_usage_tier: acc.usage_tier,
                },
            });
            if (auditErr) console.error(`[DAVID SWARM] audit insert failed for ${facilityId}:`, auditErr.message);

            enforced.push({ facilityId, totalTokens, action: ENFORCE_ACTION });
            console.warn(`[DAVID SWARM] ✅ ENFORCED (${ENFORCE_ACTION}) on facility ${facilityId}.`);
        }

        return new Response(JSON.stringify({
            status: 'SWARM_SCAN_COMPLETE',
            enforce_enabled: ENFORCE_ENABLED,
            enforce_action: ENFORCE_ACTION,
            threshold: TOKEN_THRESHOLD,
            window_minutes: WINDOW_MINUTES,
            scanned_records: usageLogs?.length || 0,
            anomalies_detected: anomaliesDetected,
            enforced,
            skipped,
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (err: any) {
        console.error('[DAVID SWARM] Anomaly Detector Failed:', err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
