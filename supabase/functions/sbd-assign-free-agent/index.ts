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

        // Admin client (bypasses RLS) -- also used to resolve the caller's role.
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Resolve caller role -- mirrors sbd-release-to-free-agent. The prior version
        // looked up sbd_portal_users by `id = auth uid`, but the auth UID lives in the
        // `auth_uid` column, so it never matched and every assignment was rejected with
        // "Only admins can claim free agents". Try auth_uid, then email, then auth
        // metadata, then the known SIPS master-admin emails.
        const allowedRoles = ['master_admin', 'staff_admin', 'admin', 'master'];
        let callerRole: string | null = null;

        const { data: profileByAuth } = await supabaseAdmin
            .from('sbd_portal_users').select('role').eq('auth_uid', user.id).single();
        if (profileByAuth && allowedRoles.includes(profileByAuth.role)) callerRole = profileByAuth.role;

        if (!callerRole && user.email) {
            const { data: profileByEmail } = await supabaseAdmin
                .from('sbd_portal_users').select('role').eq('email', user.email).single();
            if (profileByEmail && allowedRoles.includes(profileByEmail.role)) callerRole = profileByEmail.role;
        }

        if (!callerRole) {
            // app_metadata only — user_metadata is self-writable, self-promote hole
            const metaRole = user.app_metadata?.role;
            if (metaRole && allowedRoles.includes(metaRole)) callerRole = metaRole;
        }

        if (!callerRole && user.email) {
            const sipsAdminEmails = ['jjacobs@sipsconsults.com', 'izambrano@sipsconsults.com', 'dpayne@sipsconsults.com'];
            if (sipsAdminEmails.includes(user.email.toLowerCase())) callerRole = 'master_admin';
        }

        if (!callerRole) {
            throw new Error('Only admins can claim free agents');
        }

        // ── T33 admin MFA guard ─────────────────────────────────────────────────
        // Admin-tier JWTs must be aal2 (password + verified TOTP). Mirrors
        // public.sbd_mfa_satisfied() (migration 20260812130000); inlined because the
        // deploy pipeline cannot resolve ../_shared imports (#47).
        // scripts/verify-t33-security-tail.js asserts every copy agrees.
        const MFA_ADMIN_ROLES = ['master_admin', 'staff_admin', 'admin', 'master', 'sips_admin', 'system_admin'];
        const jwtAal = (t: string): string => {
            try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).aal || 'aal1'; }
            catch (_e) { return 'aal1'; }
        };
        const mfaDenied = (role: string | null | undefined, t: string): boolean =>
            MFA_ADMIN_ROLES.includes(String(role || '')) && jwtAal(t) !== 'aal2';
        if (mfaDenied(callerRole, authHeader.replace('Bearer ', ''))) {
            throw new Error('MFA required: administrator sessions must complete two-factor verification.');
        }

        // Re-attach the released staff row to the new facility.
        // The live `staff` table is keyed on `fid` ONLY -- it has no `facility_id`
        // or `is_free_agent` column. Writing those caused PostgREST 42703 and the
        // whole update was rejected, so the member vanished from every facility.
        const { error: staffError } = await supabaseAdmin
            .from('staff')
            .update({ fid: newFacilityId })
            .eq('id', staffId);

        if (staffError) {
            console.error('Assign staff update error:', JSON.stringify(staffError));
            throw new Error('Failed to update staff facility record: ' + staffError.message);
        }

        // Remove the free-agent record (canonical table = free_agents, uuid staff_id).
        const { error: faError } = await supabaseAdmin
            .from('free_agents')
            .delete()
            .eq('staff_id', staffId);
        if (faError) {
            console.warn('Could not delete free_agents row (non-fatal):', JSON.stringify(faError));
        }

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
