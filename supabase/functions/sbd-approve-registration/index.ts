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

        const { data: profile } = await supabase.from('sbd_portal_users').select('role').eq('id', user.id).single();
        if (!profile || (profile.role !== 'admin' && profile.role !== 'master')) {
            throw new Error('Only admins can approve registrations');
        }

        const adminId = user.id;

        // Fetch registration details
        const { data: regData, error: regError } = await supabase
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

        // Initialize Supabase Admin Client to bypass RLS and create auth users
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // CREATE OR FIND USER
        let newUserId = null;
        let authCreated = false;

        // Check if user already exists in portal_users (by email if possible)
        const { data: existingUser } = await supabaseAdmin.from('sbd_portal_users').select('id').eq('email', regData.email).maybeSingle();
        
        if (existingUser) {
            newUserId = existingUser.id;
        } else {
            // Generate a secure temp password
            const tempPassword = 'Sbd_' + Math.random().toString(36).slice(-8) + '!2024';
            
            const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
                email: regData.email,
                password: tempPassword,
                email_confirm: true,
                user_metadata: { name: regData.name, role: 'staff_member' }
            });

            if (authCreateError) {
                console.error("Auth Create Error:", authCreateError);
                throw new Error('Failed to create backend auth identity for ' + regData.email);
            }

            newUserId = authData.user.id;
            authCreated = true;

            // Wait briefly to allow async trigger to create the portal_user if they have one.
            await new Promise(r => setTimeout(r, 1000));
        }

        // Assign Staff record
        const { error: staffError } = await supabaseAdmin.from('staff').insert({
            id: newUserId,
            name: regData.name,
            email: regData.email,
            fid: facility || regData.facility || 'unassigned',
            facility_id: facility || regData.facility || 'unassigned',
            belt_level: 'White',
            joined_at: new Date().toISOString()
        });

        if (staffError) {
            console.error("Staff Insert Error:", staffError);
            // It might already exist if we retry
        }

        // Update registration status
        await supabaseAdmin.from('registrations').update({
            status: 'approved',
            reviewed_at: new Date().toISOString(),
            reviewed_by: adminId
        }).eq('id', registration_id);


        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Registration approved',
            user_id: newUserId,
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
