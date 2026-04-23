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

        // Auth verification uses the admin client with getUser() to validate the JWT
        // (removed anon-key client — supabaseAdmin handles everything)

        const { registration_id, facility_name, assign_system_id, assign_role } = await req.json();

        if (!registration_id) {
            throw new Error('Registration ID missing');
        }

        // Verify Caller Identity
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');
        const jwt = authHeader.replace(/^Bearer\s+/i, '');
        
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt);
        if (authError || !user) throw new Error('Unauthorized: Invalid or expired session');

        // Verify Caller Identity (Allow master_admin, staff_admin, system_admin)
        const { data: profile, error: profileErr } = await supabaseAdmin.from('sbd_portal_users').select('role').eq('auth_uid', user.id).single();
        const allowedRoles = ['master_admin', 'staff_admin', 'system_admin', 'admin', 'master'];
        if (profileErr || !profile || !allowedRoles.includes(profile.role)) {
            throw new Error(`Unauthorized role (${profile?.role || 'none'}). Only admins can approve registrations.`);
        }

        const adminId = user.id;

        // Fetch registration details
        const { data: regData, error: regError } = await supabaseAdmin
            .from('registrations')
            .select('*')
            .eq('id', registration_id)
            .single();

        if (regError || !regData) {
            throw new Error('Registration not found');
        }

        if (regData.status !== 'pending') {
            throw new Error(`Registration is already ${regData.status}`);
        }

        // --- FACILITY HANDLING ---
        let facilityId = facility_name;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        const isValidUuid = (id: string) => id && uuidRegex.test(id);

        if (!isValidUuid(facilityId)) {
            console.log("No valid facility UUID provided. Creating a new facility...");
            // Create a new facility based on registration data
            const customFacName = typeof facility_name === 'string' && facility_name.trim() !== '' ? facility_name : regData.facility;
            const { data: newFac, error: facCreateError } = await supabaseAdmin.from('facilities').insert({
                name: customFacName,
                loc: regData.location || 'Unknown',
                dept: regData.department || 'General',
                contact: regData.name,
                email: regData.email,
                system_id: assign_system_id || regData.system_id || null,
                active: true
            }).select('id').single();

            if (facCreateError || !newFac) {
                console.error("Facility Creation Error:", facCreateError);
                throw new Error('Failed to create facility');
            }
            facilityId = newFac.id;
        }

        // CREATE OR FIND USER
        let newUserId = null;
        let authCreated = false;
        let authPassword = regData.password || 'TemporarySBD@123';
        
        // Check if user already exists by querying sbd_portal_users
        const { data: existingProfile } = await supabaseAdmin.from('sbd_portal_users').select('auth_uid').eq('email', regData.email).maybeSingle();

        // Define user true role based on assign_role passed from frontend. Fallback to requested_role, or 'staff_member'
        const accountRole = assign_role || regData.requested_role || 'staff_member';

        if (existingProfile && existingProfile.auth_uid) {
            console.log("User already exists in Supabase Auth (via portal):", existingProfile.auth_uid);
            newUserId = existingProfile.auth_uid;
        } else {
            console.log("Creating user in Supabase Auth...");
            const { data: authUser, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
                email: regData.email,
                password: authPassword,
                email_confirm: true,
                user_metadata: {
                    name: regData.name,
                    role: accountRole
                }
            });

            if (authCreateError || !authUser.user) {
                console.error("Auth User Creation Error:", authCreateError);
                throw new Error(`Failed to create auth user: ${authCreateError?.message || 'Unknown error'}`);
            }
            newUserId = authUser.user.id;
            authCreated = true;
        }

        console.log("Upserting portal user profile for:", newUserId);
        const nameParts0 = (regData.name || '').trim().split(' ');
        const initials = nameParts0.length > 1
            ? (nameParts0[0][0] + nameParts0[nameParts0.length - 1][0]).toUpperCase()
            : (nameParts0[0] || 'XX').substring(0, 2).toUpperCase();

        const { error: profileUpsertError } = await supabaseAdmin.from('sbd_portal_users').upsert({
            auth_uid: newUserId,
            email: regData.email,
            name: regData.name,
            role: accountRole,
            initials: initials,
            facility_id: facilityId,
            system_id: assign_system_id || regData.system_id || null,
            active: true
        }, { onConflict: 'auth_uid' });

        if (profileUpsertError) {
            console.error("Profile Upsert Error:", profileUpsertError);
            throw new Error('Failed to create user profile: ' + profileUpsertError.message);
        }

        // 2. Assign Staff record (for legacy compatibility and staff views)
        const nameParts = (regData.name || '').trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        
        const { error: staffError } = await supabaseAdmin.from('staff').upsert({
            id: newUserId,
            first: firstName,
            last: lastName,
            fid: facilityId,
            role: 'manager', // department manager role
            belt: 'White',
            since: new Date().toISOString().split('T')[0]
        }, { onConflict: 'id' });

        if (staffError) {
            console.error("Staff Insert Error:", staffError);
        }

        // 3. Update registration status
        await supabaseAdmin.from('registrations').update({
            status: 'approved',
            reviewed_at: new Date().toISOString(),
            reviewed_by: adminId
        }).eq('id', registration_id);

        let emailError = null;

        // 4. Queue Welcome Email via sbd_email_queue (processed by sbd-send-emails with retry logic)
        try {
            const { error: queueError } = await supabaseAdmin.from('sbd_email_queue').insert({
                recipient_email: regData.email,
                template: 'registration_approved',
                subject: authCreated
                    ? 'Welcome to Sterile by Design - Account Approved'
                    : 'SBD Registration Approved',
                body_data: {
                    contact_name: regData.name,
                    name: firstName,
                    facility_name: regData.facility || '',
                    temp_password: authCreated ? authPassword : null,
                    auth_created: authCreated,
                    role: accountRole,
                    login_email: regData.email
                },
                status: 'pending',
                attempts: 0,
                created_at: new Date().toISOString()
            });

            if (queueError) {
                console.error("Email queue insert failed:", queueError);
                emailError = queueError.message;
            } else {
                console.log("Approval email queued for:", regData.email);
            }
        } catch (e: any) {
            console.error("Failed to queue welcome email:", e.message);
            emailError = e.message;
        }


        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Registration approved',
            user_id: newUserId,
            facility_id: facilityId,
            auth_created: authCreated,
            email_error: emailError
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err: any) {
        console.error('Approve Error:', err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
