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
        
        // Verify Caller Identity
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');
        
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !currentUser) throw new Error('Unauthorized');

        const isHardcodedAdmin = [
            'jjacobs@sipsconsults.com',
            'izambrano@sipsconsults.com',
            'dpayne@sipsconsults.com'
        ].includes(currentUser.email?.toLowerCase() || '');

        let callerRole = 'user';
        let callerSystemId = null;

        if (isHardcodedAdmin) {
            callerRole = 'master_admin';
        } else {
            const { data: profile } = await supabase.from('sbd_portal_users').select('role, system_id').eq('id', currentUser.id).single();
            if (!profile || !['admin', 'master', 'master_admin', 'system_admin', 'facility_manager'].includes(profile.role)) {
                throw new Error('Unauthorized role for syncing users: ' + (profile ? profile.role : 'none'));
            }
            callerRole = profile.role;
            callerSystemId = profile.system_id;
        }

        // Initialize Supabase Admin Client
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        if (data.action === 'delete' && data.userId) {
            // Check if deleting themselves (not allowed)
            if (data.userId === currentUser.id) {
                throw new Error('Cannot delete your own account');
            }

            // Must be admin/master to delete ANY, or system_admin if they match system
            // In a real app we check hierarchies.
            // 1. Delete from sbd_portal_users (sometimes cascading handles auth, but we should delete auth first)
            await supabaseAdmin.from('sbd_portal_users').delete().eq('id', data.userId);
            
            // 2. Delete Auth User
            const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
            if (delError) console.error("Could not delete from auth:", delError);

            return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const { id, name, email, role, title, initials, assignedFids, fid, sid, systemId, password } = data;
        let finalUserId = id;

        // If ID starts with 'u' it implies it's a locally generated fake-ID from UI creation.
        // E.g., 'u17...' from Date.now()
        if (!finalUserId || finalUserId.startsWith('u')) {
            // It's a new user! Create in Auth.
            const tempPassword = password || ('Sbd_' + Math.random().toString(36).slice(-8) + '!2024');
            const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
                email: email,
                password: tempPassword,
                email_confirm: true,
                user_metadata: { name, role }
            });

            if (authCreateError) {
                throw new Error('Failed to create backend identity: ' + authCreateError.message);
            }
            finalUserId = authData.user.id;
        }

        // Sync to sbd_portal_users
        const portalPayload = {
            id: finalUserId,
            auth_uid: finalUserId,
            name: name,
            email: email,
            role: role,
            title: title || '',
            initials: initials || (name ? name.substring(0, 2).toUpperCase() : ''),
            facility_id: fid || null,
            system_id: systemId || callerSystemId || null, // ensure system alignment
            staff_id: sid || null,
            assigned_facility_ids: Array.isArray(assignedFids) ? assignedFids : (assignedFids ? [assignedFids] : []),
            active: true
        };

        const { error: upsertError } = await supabaseAdmin
            .from('sbd_portal_users')
            .upsert(portalPayload);

        if (upsertError) {
            console.error("sbd_portal_users upsert error:", upsertError);
            throw new Error('Failed to sync profile: ' + upsertError.message);
        }

        // If Staff Member, ensure they exist in 'staff' table
        if (role === 'staff_member') {
            const nameParts = (name || '').split(' ');
            const first = nameParts[0] || 'Unknown';
            const last = nameParts.slice(1).join(' ') || '-';
            
            const { data: existingStaff } = await supabaseAdmin.from('staff').select('id').eq('id', finalUserId).maybeSingle();
            
            const staffPayload: any = {
                id: finalUserId,
                first: first,
                last: last,
                fid: fid || null,
                role: title || 'Staff Member'
            };
            if (!existingStaff) staffPayload.belt = 'White';

            const { error: staffUpsertErr } = await supabaseAdmin.from('staff').upsert(staffPayload, { onConflict: 'id' });
            
            if (staffUpsertErr) {
                console.error("staff upsert error:", staffUpsertErr);
                throw new Error('Failed to sync staff record: ' + staffUpsertErr.message);
            }
        }

        return new Response(JSON.stringify({ success: true, userId: finalUserId }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err: any) {
        console.error('Sync Error:', err);
        const errMsg = err instanceof Error ? err.message : String(err);
        return new Response(JSON.stringify({ error: errMsg || "Unknown sync error" }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
