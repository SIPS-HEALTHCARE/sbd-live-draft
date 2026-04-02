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
        
        let staffId, currentFacilityId, reason, notes;
        
        // Handle both object payload and direct arguments from frontend variations
        if (data && data.staffId) {
            staffId = data.staffId;
            currentFacilityId = data.currentFacilityId;
            reason = data.reason;
            notes = data.notes;
        } else {
            throw new Error('Invalid payload format. Expected {staffId, currentFacilityId, ...}');
        }

        if (!staffId) throw new Error('staffId missing');

        // Verify Caller Identity
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');
        
        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !user) throw new Error('Unauthorized');

        const { data: profile } = await supabase.from('sbd_portal_users').select('role, fid').eq('id', user.id).single();
        if (!profile || (profile.role !== 'admin' && profile.role !== 'master')) {
            throw new Error('Only admins can release staff to free agents');
        }

        // Initialize Supabase Admin Client
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Update staff record to unassigned
        const { error: staffError } = await supabaseAdmin
            .from('staff')
            .update({ fid: 'unassigned', facility_id: 'unassigned', is_free_agent: true })
            .eq('id', staffId);

        if (staffError) throw new Error('Failed to update staff record to free agent');

        // Add to free_agents table
        const { error: faError } = await supabaseAdmin.from('free_agents').insert({
            staff_id: staffId,
            origin_facility_id: currentFacilityId || profile.fid || 'unknown',
            reason: reason || 'Released by Admin',
            notes: notes || '',
            released_by: user.id
        });

        if (faError) {
             console.warn("Could not insert into free_agents (might exist or missing schema):", faError);
             // we don't throw because the core operation (staff record update) succeeded.
        }

        return new Response(JSON.stringify({ success: true, message: 'Released to Free Agents' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err: any) {
        console.error('Release Error:', err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
