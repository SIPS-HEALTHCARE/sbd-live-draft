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

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } },
              auth: { autoRefreshToken: false, persistSession: false } }
        );

        const { registration_id, facility } = await req.json();

        if (!registration_id) {
            throw new Error('Registration ID missing');
        }

        // Verify Caller Identity
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');
        
        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !user) throw new Error('Unauthorized');

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
        let facilityId = facility;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        const isValidUuid = (id: string) => id && uuidRegex.test(id);

        if (!isValidUuid(facilityId)) {
            console.log("No valid facility UUID provided. Creating a new facility...");
            // Create a new facility based on registration data
            const { data: newFac, error: facCreateError } = await supabaseAdmin.from('facilities').insert({
                name: regData.facility,
                loc: regData.location || 'Unknown',
                dept: regData.department || 'General',
                contact: regData.name,
                email: regData.email,
                system_id: regData.system_id || null,
                active: true
            }).select().single();

            if (facCreateError) {
                console.error("Facility Creation Error:", facCreateError);
                throw new Error('Failed to create facility: ' + facCreateError.message);
            }
            facilityId = newFac.id;
        }

        // CREATE OR FIND USER
        let newUserId = null;
        let authCreated = false;

        // Check if user already exists in auth.users by email
        const { data: { users: existingAuthUsers } } = await supabaseAdmin.auth.admin.listUsers();
        const existingAuthUser = existingAuthUsers.find(u => u.email === regData.email);
        
        let passwordToUse = '';

        if (existingAuthUser) {
            newUserId = existingAuthUser.id;
        } else {
            // Use chosen password if provided, else generate one
            passwordToUse = regData.password || ('Sbd_' + Math.random().toString(36).slice(-8) + '!2025');
            
            const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
                email: regData.email,
                password: passwordToUse,
                email_confirm: true,
                user_metadata: { name: regData.name, role: 'staff_member' }
            });

            if (authCreateError) {
                console.error("Auth Create Error:", authCreateError);
                throw new Error('Failed to create backend auth identity for ' + regData.email);
            }

            newUserId = authData.user.id;
            authCreated = true;
        }

        // 1. Ensure Portal User Profile Exists (CRITICAL for login)
        const { error: profileUpsertError } = await supabaseAdmin.from('sbd_portal_users').upsert({
            auth_uid: newUserId,
            email: regData.email,
            name: regData.name,
            role: 'staff_member', // reverted back to staff_member per user request
            facility_id: facilityId,
            system_id: regData.system_id || null
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

        // 4. Send Custom Welcome Email via Resend
        try {
            const resendApiKey = Deno.env.get('RESEND_API_KEY');
            if (resendApiKey) {
                const emailHtml = authCreated 
                    ? `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #edf2f7; background-color: #0d1117; padding: 30px; border-radius: 8px;">
                            <h2 style="color: #a78bfa;">Welcome to Sterile by Design!</h2>
                            <p>Hi ${firstName},</p>
                            <p>Your registration has been approved. You can now access your Operations Portal.</p>
                            <div style="background-color: rgba(167, 139, 250, 0.1); border: 1px solid rgba(167, 139, 250, 0.3); padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <p style="margin: 0; color: #a8b2d1;"><strong>Login Email:</strong> ${regData.email}</p>
                                <p style="margin: 10px 0 0 0; color: #a8b2d1;"><strong>Temporary Password:</strong> ${passwordToUse}</p>
                            </div>
                            <p>Please log in to your dashboard to complete your Operator Intelligence Profile (OIP).</p>
                            <p style="margin-top: 30px;">
                                <a href="https://belt.sterilebydesign.ai" style="background-color: #c49a20; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Log in to SBD Portal</a>
                            </p>
                        </div>
                    `
                    : `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #edf2f7; background-color: #0d1117; padding: 30px; border-radius: 8px;">
                            <h2 style="color: #a78bfa;">SBD Registration Approved</h2>
                            <p>Hi ${firstName},</p>
                            <p>Your facility registration has been approved! You can now log into the portal using your existing credentials.</p>
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
                } else {
                    console.log("Approval email sent successfully to", regData.email);
                }
            } else {
                console.warn("RESEND_API_KEY is not set. Approval email skipped.");
            }
        } catch (e: any) {
            console.error("Failed to send welcome email:", e.message);
        }


        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Registration approved',
            user_id: newUserId,
            facility_id: facilityId,
            auth_created: authCreated 
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
