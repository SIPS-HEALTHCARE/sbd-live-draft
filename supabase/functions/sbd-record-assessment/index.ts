import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }
    
    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        const { staff, type, targetBelt, result, notes, assessorId, timestamp } = await req.json();

        if (!staff || !staff.id) {
            throw new Error('staff data is missing or incomplete');
        }

        // Verify Caller Identity using their Authorization token
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');
        
        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !user) throw new Error('Unauthorized');

        // Check if the user is a valid assessor (admin or master)
        const { data: profile } = await supabase.from('sbd_portal_users').select('role').eq('id', user.id).single();
        if (!profile || (profile.role !== 'admin' && profile.role !== 'master')) {
            throw new Error('Only admins can record assessments');
        }

        const facility_id = staff.facility_id || staff.fid || null;

        // 1. Insert into sbd_assessment_queue
        const { error: aqError } = await supabase.from('sbd_assessment_queue').insert({
            staff_id: staff.id,
            facility_id: facility_id,
            assessor_id: assessorId || user.id,
            target_belt: targetBelt || staff.belt || 'Yellow',
            assessment_type: type || 'Belt Grading',
            status: result === 'pass' ? 'passed' : 'failed',
            notes: notes || '',
            requested_at: timestamp || new Date().toISOString(),
            resolved_at: new Date().toISOString(),
            data: { staff, result }
        });

        if (aqError) {
            console.error('AQ Insert Error:', aqError);
            throw new Error('Failed to record assessment');
        }

        // 2. If Passed, log a pending promotion for the Master Admin to approve
        if (result === 'pass') {
            const { error: promoError } = await supabase.from('sbd_promotions').insert({
                staff_id: staff.id,
                facility_id: facility_id,
                requested_by: assessorId || user.id,
                target_belt: targetBelt || staff.belt || 'Yellow',
                status: 'pending'
            });

            if (promoError) {
                console.warn('Promotion Queue Error:', promoError);
            }
        }

        return new Response(JSON.stringify({ success: true, message: 'Assessment recorded successfully.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err: any) {
        console.error('Assessment Error:', err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
