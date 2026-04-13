import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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

        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        if (!resendApiKey) {
            console.error("RESEND_API_KEY missing");
            return new Response(JSON.stringify({ error: "Missing email API key." }), { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
                status: 500 
            });
        }

        const assessmentType = record.type ? record.type : 'Placement';
        const firstName = userData.name ? userData.name.split(' ')[0] : 'Staff Member';

        const emailHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #edf2f7; background-color: #0d1117; padding: 30px; border-radius: 8px;">
                <h2 style="color: #a78bfa;">Great News!</h2>
                <p>Hi ${firstName},</p>
                <p>Your <strong>${assessmentType} Assessment</strong> has been reviewed and <strong>Approved</strong> by your leadership team.</p>
                <p>Your new status and progress are now reflected on your portal dashboard. Keep up the excellent work!</p>
                <p style="margin-top: 30px;">
                    <a href="https://belt.sterilebydesign.ai" style="background-color: #c49a20; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Log in to SBD Portal</a>
                </p>
                <p style="margin-top: 30px; font-size: 12px; color: #64748b;">
                    Sterile by Design &bull; SIPS Healthcare Solutions
                </p>
            </div>
        `;

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Sterile by Design <noreply@belt.sterilebydesign.ai>',
                to: userData.email,
                subject: `Your ${assessmentType} Assessment has been Approved!`,
                html: emailHtml
            })
        });

        if (!res.ok) {
            const errBody = await res.text();
            console.error("Resend API Error:", errBody);
            return new Response(JSON.stringify({ error: "Failed to send email." }), { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
                status: 500 
            });
        }

        return new Response(JSON.stringify({ message: "Assessment approval email sent successfully." }), {
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
