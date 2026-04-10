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
        // Initialize Supabase Admin Client (service role - full access)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const data = await req.json();
        
        // Verify Caller Identity via the Authorization header
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');
        const jwt = authHeader.replace(/^Bearer\s+/i, '');

        // Use admin client to verify the JWT and get the caller's identity
        const { data: { user: currentUser }, error: authError } = await supabaseAdmin.auth.getUser(jwt);
        if (authError || !currentUser) throw new Error('Unauthorized: Invalid or expired session');

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
            const { data: profile } = await supabaseAdmin.from('sbd_portal_users').select('role, system_id').eq('auth_uid', currentUser.id).single();
            if (!profile || !['admin', 'master', 'master_admin', 'staff_admin', 'system_admin', 'facility_manager', 'facility_admin'].includes(profile.role)) {
                throw new Error('Unauthorized role for syncing users: ' + (profile ? profile.role : 'none'));
            }
            callerRole = profile.role;
            callerSystemId = profile.system_id;
        }

        // ── DELETE USER ACTION ──
        if (data.action === 'delete' && data.userId) {
            // data.userId = sbd_portal_users.id (the PK)
            
            // Look up the full profile to get the auth_uid
            const { data: targetProfile, error: profileErr } = await supabaseAdmin
                .from('sbd_portal_users')
                .select('id, auth_uid, name, email, role, protected')
                .eq('id', data.userId)
                .single();

            if (profileErr || !targetProfile) {
                // Also try by auth_uid in case the client sent that
                const { data: altProfile, error: altErr } = await supabaseAdmin
                    .from('sbd_portal_users')
                    .select('id, auth_uid, name, email, role, protected')
                    .eq('auth_uid', data.userId)
                    .single();
                
                if (altErr || !altProfile) {
                    throw new Error('User profile not found for deletion');
                }
                // Use the alt profile
                Object.assign(targetProfile || {}, altProfile);
            }

            const profile = targetProfile!;

            // Protected accounts cannot be removed
            if (profile.protected) {
                throw new Error(`${profile.name} is a protected account and cannot be removed`);
            }

            // Cannot delete yourself
            if (profile.auth_uid === currentUser.id) {
                throw new Error('Cannot delete your own account');
            }

            const authUidToDelete = profile.auth_uid;
            const portalIdToDelete = profile.id;

            console.log(`Deleting user: ${profile.name} (portal_id=${portalIdToDelete}, auth_uid=${authUidToDelete})`);

            // 1. Delete from staff table (cleanup linked staff record)
            const { error: staffDelErr } = await supabaseAdmin.from('staff').delete().eq('id', authUidToDelete);
            if (staffDelErr) console.error("Staff cleanup error:", staffDelErr);
            else console.log("Staff record deleted for:", authUidToDelete);

            // 2. Delete from sbd_portal_users
            const { error: portalDelErr } = await supabaseAdmin.from('sbd_portal_users').delete().eq('id', portalIdToDelete);
            if (portalDelErr) console.error("Portal profile delete error:", portalDelErr);
            else console.log("Portal profile deleted:", portalIdToDelete);
            
            // 3. Delete from Supabase Auth (using the correct auth_uid)
            const { error: authDelErr } = await supabaseAdmin.auth.admin.deleteUser(authUidToDelete);
            if (authDelErr) console.error("Auth user delete error:", authDelErr);
            else console.log("Auth user deleted:", authUidToDelete);

            return new Response(JSON.stringify({ 
                success: true,
                deleted: {
                    portal_id: portalIdToDelete,
                    auth_uid: authUidToDelete,
                    name: profile.name,
                    email: profile.email
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // ── CREATE / UPDATE USER ACTION ──
        const { id, userId, name, email, role, title, initials, assignedFids, fid, facilityId, sid, systemId, password, action } = data;
        let finalUserId = id || userId;
        let authUid = finalUserId;
        let isUpdate = action === 'update';

        // If ID starts with 'u' it implies it's a locally generated fake-ID from UI creation.
        if (!isUpdate && (!finalUserId || finalUserId.startsWith('u'))) {
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
            authUid = authData.user.id;
        } else if (isUpdate) {
            // For updates, the finalUserId passed from the frontend is usually the sbd_portal_users.id.
            // We need to fetch the existing user's auth_uid to avoid foreign key violations.
            const { data: existingProfile } = await supabaseAdmin.from('sbd_portal_users').select('id, auth_uid').eq('id', finalUserId).single();
            if (existingProfile) {
                authUid = existingProfile.auth_uid;
            } else {
                // Try to find by auth_uid just in case
                const { data: existingAlt } = await supabaseAdmin.from('sbd_portal_users').select('id, auth_uid').eq('auth_uid', finalUserId).single();
                if (existingAlt) {
                    finalUserId = existingAlt.id;
                    authUid = existingAlt.auth_uid;
                }
            }
        }

        // Sync to sbd_portal_users
        const portalPayload = {
            id: finalUserId,
            auth_uid: authUid,
            name: name,
            email: email,
            role: role,
            title: title || '',
            initials: initials || (name ? name.substring(0, 2).toUpperCase() : ''),
            facility_id: fid || facilityId || null,
            system_id: systemId || callerSystemId || null,
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
