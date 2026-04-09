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
        
        // Check if user already exists in auth.users by email
        const { data: { users: existingAuthUsers } } = await supabaseAdmin.auth.admin.listUsers();
        const existingAuthUser = existingAuthUsers.find(u => u.email === regData.email);

        // Define user true role based on assign_role passed from frontend. Fallback to requested_role, or 'staff_member'
        const accountRole = assign_role || regData.requested_role || 'staff_member';

        if (existingAuthUser) {
            console.log("User already exists in Supabase Auth:", existingAuthUser.id);
            newUserId = existingAuthUser.id;
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
        const { error: profileUpsertError } = await supabaseAdmin.from('sbd_portal_users').upsert({
            auth_uid: newUserId,
            staff_id: newUserId, // Maps staff ID properly to auth_uid
            email: regData.email,
            name: regData.name,
            role: accountRole, // Granular role enforcement
            facility_id: facilityId,
            system_id: assign_system_id || regData.system_id || null
        }, { onConflict: 'auth_uid' });

        if (profileUpsertError) {
            console.error("Profile Upsert Error:", profileUpsertError);
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

        // 4. Send Custom Welcome Email via Resend
        try {
            const resendApiKey = Deno.env.get('RESEND_API_KEY');
            if (resendApiKey) {
                // Adjust text based on role assigned
                const instructions = (accountRole === 'hospital' || accountRole === 'facility_admin')
                    ? 'Please log in to access your Facility Administrative Dashboard.'
                    : (accountRole === 'system_admin')
                        ? 'Please log in to access your Hospital System Executive Dashboard.'
                        : 'Please log in to your dashboard to complete your Operator Intelligence Profile (OIP).';
                
                const emailHtml = authCreated 
                    ? `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #edf2f7; background-color: #0d1117; padding: 30px; border-radius: 8px;">
                            <h2 style="color: #a78bfa;">Welcome to Sterile by Design!</h2>
                            <p>Hi ${firstName},</p>
                            <p>Your registration has been approved. You can now access your Operations Portal.</p>
                            <div style="background-color: rgba(167, 139, 250, 0.1); border: 1px solid rgba(167, 139, 250, 0.3); padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <p style="margin: 0; color: #a8b2d1;"><strong>Login Email:</strong> ${regData.email}</p>
                                <p style="margin: 10px 0 0 0; color: #a8b2d1;"><strong>Temporary Password:</strong> ${authPassword}</p>
                            </div>
                            <p>${instructions}</p>
                            <p style="margin-top: 30px;">
                                <a href="https://belt.sterilebydesign.ai" style="background-color: #c49a20; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Log in to SBD Portal</a>
                            </p>
                        </div>
                    `
                    : `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #edf2f7; background-color: #0d1117; padding: 30px; border-radius: 8px;">
                            <h2 style="color: #a78bfa;">SBD Registration Approved</h2>
                            <p>Hi ${firstName},</p>
                            <p>Your portal registration has been approved! You can now log into the portal using your existing credentials.</p>
                            <p>${instructions}</p>
                            <p style="margin-top: 30px;">
                                <a href="https://belt.sterilebydesign.ai" style="background-color: #c49a20; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Access Dashboard</a>
                            </p>
                        </div>
                    `;

                const resendRes = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${resendApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'SBD Team <noreply@sterilebydesign.ai>',
                        to: regData.email,
                        subject: authCreated ? 'Welcome to Sterile by Design - Account Approved' : 'SBD Registration Approved',
                        html: emailHtml
                    })
                });

                if (!resendRes.ok) {
                    const errText = await resendRes.text();
                    console.error("Resend API failed:", errText);
                    emailError = errText;
                } else {
                    console.log("Approval email sent successfully to", regData.email);
                }
            } else {
                console.warn("RESEND_API_KEY is not set. Approval email skipped.");
                emailError = "RESEND_API_KEY is not set.";
            }
        } catch (e: any) {
            console.error("Failed to send welcome email:", e.message);
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
