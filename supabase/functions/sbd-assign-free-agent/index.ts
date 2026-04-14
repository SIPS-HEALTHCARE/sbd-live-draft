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

        const data = await req.json();
        
        let staffId, newFacilityId, claimedBy;
        
        if (data && data.staffId && data.facilityId) {
            staffId = data.staffId;
            newFacilityId = data.facilityId;
            claimedBy = data.claimedBy;
        } else if (data && data.freeAgentId && data.newFacilityId) {
            staffId = data.freeAgentId;
            newFacilityId = data.newFacilityId;
            claimedBy = data.claimedBy;
        } else {
            throw new Error('Invalid payload format. Expected staffId and facilityId');
        }

        // Verify Caller Identity
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');
        
        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !user) throw new Error('Unauthorized');

        const { data: profile } = await supabase.from('sbd_portal_users').select('role, fid').eq('id', user.id).single();
        const allowedRoles = ['master_admin', 'staff_admin', 'admin', 'master'];
        if (!profile || !allowedRoles.includes(profile.role)) {
            throw new Error('Only admins can claim free agents');
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Update staff record to new facility
        const { error: staffError } = await supabaseAdmin
            .from('staff')
            .update({ fid: newFacilityId, facility_id: newFacilityId, is_free_agent: false })
            .eq('id', staffId);

        if (staffError) throw new Error('Failed to update staff facility record');

        // Remove from free_agents table (or mark claimed)
        const { error: faError } = await supabaseAdmin
            .from('free_agents')
            .delete()
            .eq('staff_id', staffId);
            
        // We log it in sbd_placement_log if it exists
        await supabaseAdmin.from('placement_reviews').insert({
            staff_id: staffId,
            facility_id: newFacilityId,
            claimed_by: claimedBy || user.id,
            status: 'claimed',
            notes: 'Claimed from Free Agents'
        }).catch(e => console.log('Placement review log skipped:', e.message));

        return new Response(JSON.stringify({ success: true, message: 'Free Agent claimed successfully' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err: any) {
        console.error('Assign Error:', err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
