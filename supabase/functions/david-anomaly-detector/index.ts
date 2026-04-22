import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Autonomous Anomaly Detector (DAVID Swarm)
// This function acts as a background processor to analyze usage metrics, flag anomalies, and potentially throttle abused facilities.
serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

        // We use the Service Role Key since this is an autonomous background task
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Define our anomaly threshold (e.g. 50,000 tokens in one burst or high cost)
        const TOKEN_THRESHOLD = 50000;
        
        // 1. Fetch recent usage logs (last 1 hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { data: usageLogs, error: logError } = await supabase
            .from('david_usage_logs')
            .select('facility_id, user_id, prompt_tokens, completion_tokens, created_at')
            .gte('created_at', oneHourAgo);

        if (logError) throw logError;

        // 2. Aggregate token burn by facility
        const facilityBurn: Record<string, number> = {};
        for (const log of usageLogs || []) {
            const totalTokens = (log.prompt_tokens || 0) + (log.completion_tokens || 0);
            if (!facilityBurn[log.facility_id]) {
                facilityBurn[log.facility_id] = 0;
            }
            facilityBurn[log.facility_id] += totalTokens;
        }

        // 3. Detect Anomalies and Execute Action
        const anomaliesDetected = [];
        for (const [facilityId, totalTokens] of Object.entries(facilityBurn)) {
            if (totalTokens > TOKEN_THRESHOLD) {
                // ANOMALY DETECTED!
                anomaliesDetected.push({ facilityId, totalTokens });
                
                console.warn(`[DAVID SWARM] 🚨 ANOMALY: Facility ${facilityId} burned ${totalTokens} tokens in 1hr. Triggering shadow protocol.`);

                // Optionally, we could auto-throttle them here by disabling their tier, but for now we log.
                // We will add an audit log to a system table if it exists. (Using the existing `david_facility_access` to leave a note or just standard logging).
            }
        }

        return new Response(JSON.stringify({ 
            status: 'SWARM_SCAN_COMPLETE', 
            scanned_records: usageLogs?.length || 0,
            anomalies_detected: anomaliesDetected 
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
