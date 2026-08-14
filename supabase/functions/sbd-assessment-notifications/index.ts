// ============================================================================
// 🗑️ RETIRED 2026-08-14 — DO NOT DEPLOY
//
// The deployed copy of this function was deleted from Supabase because it was
// publicly callable: verify_jwt=false at the gateway and no auth check in this
// code, so an anonymous caller could queue fake "assessment approved" emails
// on the service role and probe which staff_ids exist (200 vs 404).
// Ref: Sips Project/AssessmentNotify-Public-2026-08-14/ · ledger card T110.
//
// Nothing calls it: no DB trigger/webhook, no frontend reference. Approval
// emails go through sbd-emails (api-supabase.js notifyPlacementEvent).
//
// The file is kept for reference only. The guard below makes an accidental
// redeploy inert. If this path is ever genuinely needed again, it must ship
// with a shared-secret header check (webhooks cannot carry a user JWT).
// ============================================================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // RETIRED — see header. Refuse all traffic so an accidental redeploy
    // cannot reopen the unauthenticated email-queue hole.
    return new Response(JSON.stringify({ error: 'Gone. This function was retired 2026-08-14.' }), {
        status: 410,
        headers: { 'Content-Type': 'application/json' }
    });

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const payload = await req.json();
        
        // Ensure this is an UPDATE event for a placement review transitioning to 'approved'
        if (payload.type !== 'UPDATE' && payload.type !== 'INSERT') {
            return new Response(JSON.stringify({ message: "Ignored event type." }), { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
                status: 200 
            });
        }

        const record = payload.record;
        const oldRecord = payload.old_record || {};
        
        // We only want to trigger the email when status correctly transitions to 'approved'
        // or if it was inserted as 'approved' (rare but possible)
        if (record.status !== 'approved' || oldRecord.status === 'approved') {
            return new Response(JSON.stringify({ message: "Status is not 'approved' or already was approved." }), { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
                status: 200 
            });
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') || '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
        );

        // Fetch staff profile to get their email and name
        const { data: userData, error: userError } = await supabaseAdmin
            .from('sbd_portal_users')
            .select('email, name')
            .eq('staff_id', record.staff_id)
            .single();

        if (userError || !userData) {
            console.error("Could not find user profile for staff_id:", record.staff_id, userError);
            return new Response(JSON.stringify({ error: "User profile not found." }), { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
                status: 404 
            });
        }

        // Queue assessment approval notification via sbd_email_queue
        // (processed by sbd-send-emails with 3x retry logic)
        const assessmentType = record.type ? record.type : 'Placement';
        const firstName = userData.name ? userData.name.split(' ')[0] : 'Staff Member';

        const { error: queueError } = await supabaseAdmin.from('sbd_email_queue').insert({
            recipient_email: userData.email,
            template: 'assessment_approved',
            subject: `Your ${assessmentType} Assessment has been Approved!`,
            body_data: {
                name: firstName,
                assessment_type: assessmentType,
                staff_id: record.staff_id
            },
            status: 'pending',
            attempts: 0,
            created_at: new Date().toISOString()
        });

        if (queueError) {
            console.error("Email queue insert failed:", queueError);
            return new Response(JSON.stringify({ error: "Failed to queue email." }), { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
                status: 500 
            });
        }

        return new Response(JSON.stringify({ message: "Assessment approval email queued successfully." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (err: any) {
        console.error("Edge function error:", err);
        return new Response(JSON.stringify({ error: err.message || "Internal server error" }), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
            status: 500 
        });
    }
});
