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
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        const data = await req.json();
        
        let staffId, fromFacId, fromFacName, reason, notes;

        // Handle both object payload and direct arguments from frontend variations
        if (data && data.staffId) {
            staffId     = data.staffId;
            fromFacId   = data.fromFacId || data.currentFacilityId || null;
            fromFacName = data.fromFacName || null;
            reason      = data.reason;
            notes       = data.notes;
        } else {
            throw new Error('Invalid payload format. Expected {staffId, ...}');
        }

        if (!staffId) throw new Error('staffId missing');

        // Verify Caller Identity
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');
        
        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !user) throw new Error('Unauthorized');

        // Initialize Supabase Admin Client (bypasses RLS)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Resolve caller role — multiple fallback strategies because master admins
        // are hardcoded in the frontend and may not exist in sbd_portal_users
        const allowedRoles = ['master_admin', 'staff_admin', 'admin', 'master'];
        let callerRole: string | null = null;
        let callerFid: string | null = null;

        // 1) Try sbd_portal_users by auth UID
        const { data: profileById } = await supabaseAdmin.from('sbd_portal_users').select('role, fid').eq('id', user.id).single();
        if (profileById && allowedRoles.includes(profileById.role)) {
            callerRole = profileById.role;
            callerFid = profileById.fid;
        }

        // 2) Try sbd_portal_users by email
        if (!callerRole && user.email) {
            const { data: profileByEmail } = await supabaseAdmin.from('sbd_portal_users').select('role, fid').eq('email', user.email).single();
            if (profileByEmail && allowedRoles.includes(profileByEmail.role)) {
                callerRole = profileByEmail.role;
                callerFid = profileByEmail.fid;
            }
        }

        // 3) Check Supabase auth user metadata (set by sbd-sync-user-claims)
        if (!callerRole) {
            const metaRole = user.app_metadata?.role || user.user_metadata?.role;
            if (metaRole && allowedRoles.includes(metaRole)) {
                callerRole = metaRole;
            }
        }

        // 4) Known SIPS master admin emails (hardcoded fallback)
        if (!callerRole && user.email) {
            const sipsAdminEmails = ['jjacobs@sipsconsults.com', 'izambrano@sipsconsults.com', 'dpayne@sipsconsults.com'];
            if (sipsAdminEmails.includes(user.email.toLowerCase())) {
                callerRole = 'master_admin';
            }
        }

        console.log('Release auth — user:', user.id, 'email:', user.email, 'resolvedRole:', callerRole);
        if (!callerRole) {
            throw new Error('Only admins can release staff to free agents');
        }

        // Snapshot the staff row BEFORE we null its facility, so the registry card has data.
        const { data: staffRow, error: readErr } = await supabaseAdmin
            .from('staff')
            .select('first, last, role, belt, since, stars, oip, fid')
            .eq('id', staffId)
            .single();
        if (readErr || !staffRow) {
            throw new Error('Staff record not found for release: ' + (readErr?.message || 'no row'));
        }

        // Detach from facility (fid is the only facility key on staff).
        const { error: staffError } = await supabaseAdmin
            .from('staff')
            .update({ fid: null })
            .eq('id', staffId);

        if (staffError) {
            console.error('Release staff update error:', JSON.stringify(staffError));
            throw new Error('Failed to release staff: ' + staffError.message);
        }

        // Persist to the canonical free_agents table with columns that actually exist.
        const { error: faError } = await supabaseAdmin.from('free_agents').insert({
            staff_id:       staffId,
            first:          staffRow.first,
            last:           staffRow.last,
            role:           staffRow.role,
            belt:           staffRow.belt,
            since:          staffRow.since,
            stars:          staffRow.stars,
            from_fac_id:    fromFacId || staffRow.fid,
            from_fac_name:  fromFacName,
            release_reason: reason || 'Released by Admin',
            release_notes:  notes || '',
            oip:            staffRow.oip,
            released_at:    new Date().toISOString()
        });

        if (faError) {
            // Roll back the detach so the member isn't left orphaned (fid=null, not in pool).
            await supabaseAdmin.from('staff').update({ fid: staffRow.fid }).eq('id', staffId);
            console.error('free_agents insert failed, rolled back detach:', JSON.stringify(faError));
            throw new Error('Failed to add to free agents: ' + faError.message);
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
