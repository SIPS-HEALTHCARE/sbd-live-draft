import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Deactivate / reactivate a portal account.
//   active=false -> ban the auth user (their password stops working) and flip
//                   sbd_portal_users.active to false. No data is deleted.
//   active=true  -> lift the ban and flip active back to true.
// The staff record and every assessment/history row stay untouched, so a
// deactivated person keeps their full record and can be brought back any time.
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

        const { auth_uid, active, reason } = await req.json();

        if (!auth_uid) throw new Error('auth_uid is required');
        if (typeof active !== 'boolean') throw new Error('active (boolean) is required');

        // Verify caller identity — only a master_admin may deactivate accounts.
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');
        const jwt = authHeader.replace(/^Bearer\s+/i, '');

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt);
        if (authError || !user) throw new Error('Unauthorized: Invalid or expired session');

        const { data: callerProfile, error: callerErr } = await supabaseAdmin
            .from('sbd_portal_users').select('role').eq('auth_uid', user.id).single();
        if (callerErr || !callerProfile || callerProfile.role !== 'master_admin') {
            throw new Error('Unauthorized: only a master admin can deactivate or reactivate accounts.');
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
        if (mfaDenied(callerProfile.role, jwt)) {
            throw new Error('MFA required: administrator sessions must complete two-factor verification.');
        }

        // A master admin cannot deactivate their own account (locks themselves out).
        if (auth_uid === user.id) {
            throw new Error('You cannot deactivate your own account.');
        }

        // Load the target account.
        const { data: target, error: targetErr } = await supabaseAdmin
            .from('sbd_portal_users').select('id, auth_uid, email, role, name, active, protected')
            .eq('auth_uid', auth_uid).single();
        if (targetErr || !target) throw new Error('Account not found.');

        // Protected SIPS master accounts can never be deactivated.
        const protectedEmail = /jjacobs|izambrano|dpayne/i.test(target.email || '');
        if (target.protected || protectedEmail) {
            throw new Error('This is a protected system account and cannot be deactivated.');
        }

        // Record WHO switched the account and WHY before acting — same rule as the
        // delete in sbd-sync-user-claims: if the audit row cannot be written, the
        // switch does not happen. (#890 — console.log alone ages out in ~24h.)
        const { error: auditErr } = await supabaseAdmin.from('sbd_account_audit').insert({
            action: active ? 'account_reactivated' : 'account_deactivated',
            actor_auth_uid: user.id,
            actor_email: user.email || null,
            actor_role: callerProfile.role,
            target_auth_uid: target.auth_uid,
            target_portal_id: String(target.id),
            target_email: target.email || null,
            target_name: target.name || null,
            target_role: target.role || null,
            detail: reason ? { reason } : null
        });
        if (auditErr) {
            throw new Error('Aborted: could not write the audit record (' + auditErr.message + ')');
        }

        if (active === false) {
            // Ban the auth user so their credentials stop working (~100 years).
            const { error: banErr } = await supabaseAdmin.auth.admin.updateUserById(auth_uid, {
                ban_duration: '876600h'
            });
            if (banErr) throw new Error('Failed to lock login: ' + banErr.message);

            // Flip the portal flag. Data is preserved — only this boolean changes.
            const { error: flagErr } = await supabaseAdmin
                .from('sbd_portal_users')
                .update({ active: false })
                .eq('auth_uid', auth_uid);
            if (flagErr) throw new Error('Login locked, but failed to update profile flag: ' + flagErr.message);
        } else {
            // Lift the ban and re-enable the account.
            const { error: unbanErr } = await supabaseAdmin.auth.admin.updateUserById(auth_uid, {
                ban_duration: 'none'
            });
            if (unbanErr) throw new Error('Failed to unlock login: ' + unbanErr.message);

            const { error: flagErr } = await supabaseAdmin
                .from('sbd_portal_users')
                .update({ active: true })
                .eq('auth_uid', auth_uid);
            if (flagErr) throw new Error('Login unlocked, but failed to update profile flag: ' + flagErr.message);
        }

        // Best-effort: mirror the flag onto the linked staff record if that
        // column exists. Never fatal — the portal account is the source of truth
        // for login, and a missing/likeless staff column must not fail the call.
        try {
            await supabaseAdmin.from('staff').update({ active: active }).eq('id', auth_uid);
        } catch (_e) { /* staff.active may not exist; ignore */ }

        console.log(`Account ${auth_uid} set active=${active} by ${user.id}${reason ? ' — ' + reason : ''}`);

        return new Response(JSON.stringify({
            success: true,
            auth_uid,
            active,
            email: target.email
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (err: any) {
        console.error('Set-account-active error:', err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
