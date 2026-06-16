import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

        const { staff, type, targetBelt, result, notes, assessorId, timestamp } = await req.json();

        if (!staff || !staff.id) {
            throw new Error('staff data is missing or incomplete');
        }

        // Verify Caller Identity using their Authorization token
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');
        const jwt = authHeader.replace(/^Bearer\s+/i, '');
        
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt);
        if (authError || !user) throw new Error('Unauthorized: Invalid or expired session');

        // Check if the user is a valid assessor
        const { data: profile } = await supabaseAdmin.from('sbd_portal_users').select('role, facility_id, assigned_facility_ids').eq('auth_uid', user.id).single();
        const allowedRoles = ['master_admin', 'staff_admin', 'system_admin', 'admin', 'master', 'educator', 'preceptor', 'facility_admin'];
        if (!profile || !allowedRoles.includes(profile.role)) {
            throw new Error(`Unauthorized role (${profile?.role || 'none'}). Cannot record assessments.`);
        }

        // Resolve the staff member's facility from the DATABASE, never from the client
        // payload — a forged staff.fid would otherwise defeat the scope check (ASS-F2).
        const { data: staffRow, error: staffFetchError } = await supabaseAdmin.from('staff').select('id, fid').eq('id', staff.id).single();
        if (staffFetchError || !staffRow) throw new Error('Staff record not found.');
        const facility_id = staffRow.fid || null;

        // Enforce facility scope (ASS-F2). master/system admins are network-wide;
        // staff_admin (assessor) is limited to assigned_facility_ids when set (same rule
        // as sbd-assessor-pin); facility-bound roles must match the staff's facility.
        const unscopedRoles = ['master_admin', 'system_admin', 'admin', 'master'];
        if (!unscopedRoles.includes(profile.role)) {
            if (profile.role === 'staff_admin') {
                const assessorFids = profile.assigned_facility_ids || [];
                if (assessorFids.length > 0 && !assessorFids.includes(facility_id)) {
                    const err: any = new Error('Facility scope violation: you are not assigned to this staff member\'s facility.');
                    err.status = 403;
                    throw err;
                }
            } else {
                // facility_admin, educator, preceptor — locked to their own facility.
                // Accept assigned_facility_ids membership as a fallback: some existing
                // rows are provisioned with only that field (it's what sbd-assessor-pin trusts).
                const ownFacility = profile.facility_id === facility_id;
                const assignedFacility = (profile.assigned_facility_ids || []).includes(facility_id);
                if (!ownFacility && !assignedFacility) {
                    const err: any = new Error('Facility scope violation: you can only record assessments for your own facility.');
                    err.status = 403;
                    throw err;
                }
            }
        }

        // 1. Insert into sbd_assessment_queue
        const { error: aqError } = await supabaseAdmin.from('sbd_assessment_queue').insert({
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
            const { error: promoError } = await supabaseAdmin.from('sbd_promotions').insert({
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

        // 3. Update the Staff record to persist the new gates (cur/nxt) and history!
        // We receive the mapped staff object from mapStaffToBackend()
        const { error: staffUpdateError } = await supabaseAdmin.from('staff').update({
            history: staff.history || null,
            cur_comp: staff.cur_comp || null,
            cur_sim: staff.cur_sim || null,
            cur_obs: staff.cur_obs || null,
            nxt_comp: staff.nxt_comp || null,
            nxt_sim: staff.nxt_sim || null,
            nxt_obs: staff.nxt_obs || null,
            updated_at: new Date().toISOString()
        }).eq('id', staff.id);

        if (staffUpdateError) {
            console.error('Staff Update Error:', staffUpdateError);
            throw new Error('Failed to update staff profile with assessment results');
        }

        return new Response(JSON.stringify({ success: true, message: 'Assessment recorded successfully.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err: any) {
        console.error('Assessment Error:', err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            status: err.status || 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
