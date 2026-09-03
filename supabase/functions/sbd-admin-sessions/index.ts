import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// #21 admin in-progress assessment tracker.
// Service-role READ gated on admin role. Reasons this is a function and not a
// direct REST read: the sbd_assessment_sessions table's admin SELECT policy is
// unverified, and reading via service role guarantees the tracker works without
// touching any RLS policy (no schema/policy change → no Shawn's-go needed).
// Strictly read-only — never writes candidate data.

// Mirrors renderAView's Network Portal guard (ui-views.js).
const ADMIN_ROLES = ['master_admin', 'staff_admin', 'system_admin'];

// Total items per assessment type, for the "X of Y" progress readout. Sourced
// from sbd-assessor-pin's session sizing (placement = 30 questions, belt = 60).
const TOTAL_QUESTIONS: Record<string, number> = { placement: 30, belt: 60 };

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const admin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // ── Verify caller ──
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');
        const jwt = authHeader.replace(/^Bearer\s+/i, '');
        const { data: { user }, error: authError } = await admin.auth.getUser(jwt);
        if (authError || !user) throw new Error('Unauthorized: Invalid or expired session');

        // ── Authorize: admin role + capture facility scope ──
        const { data: profile } = await admin
            .from('sbd_portal_users')
            .select('id, role, assigned_facility_ids, facility_id, system_id')
            .eq('auth_uid', user.id)
            .single();

        if (!profile || !ADMIN_ROLES.includes(profile.role)) {
            return new Response(JSON.stringify({ error: 'Unauthorized: admin access required.' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // ── T33 admin MFA guard ─────────────────────────────────────────────────
        // Admin-tier JWTs must be aal2 (password + verified TOTP). Mirrors
        // public.sbd_mfa_satisfied() (migration 20260904120000); inlined because the
        // deploy pipeline cannot resolve ../_shared imports (#47).
        // scripts/verify-t33-security-tail.js asserts every copy agrees.
        const MFA_ADMIN_ROLES = ['master_admin', 'staff_admin', 'admin', 'master', 'sips_admin', 'system_admin'];
        const jwtAal = (t: string): string => {
            try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).aal || 'aal1'; }
            catch (_e) { return 'aal1'; }
        };
        const mfaDenied = (role: string | null | undefined, t: string): boolean =>
            MFA_ADMIN_ROLES.includes(String(role || '')) && jwtAal(t) !== 'aal2';
        if (mfaDenied(profile.role, jwt)) {
            return new Response(JSON.stringify({ error: 'MFA required: administrator sessions must complete two-factor verification.', code: 'MFA_REQUIRED' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // ── Facility scope (mirrors ARCHITECTURE §7 RLS model) ──
        // master_admin: all facilities (scopeFids = null → no filter).
        // system_admin: every facility in their system.
        // staff_admin / other: their assigned_facility_ids (or single facility_id).
        const isMaster = profile.role === 'master_admin';
        let scopeFids: string[] | null = null;
        if (!isMaster) {
            if (profile.role === 'system_admin' && profile.system_id) {
                const { data: sysFacs } = await admin
                    .from('facilities')
                    .select('id')
                    .eq('system_id', profile.system_id);
                scopeFids = (sysFacs || []).map((f: any) => f.id);
            } else {
                scopeFids = profile.assigned_facility_ids
                    || (profile.facility_id ? [profile.facility_id] : []);
            }
            // No facilities in scope → nothing to show (and skip the query entirely).
            if (!scopeFids || scopeFids.length === 0) {
                return new Response(JSON.stringify({ success: true, sessions: [] }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }
        }

        // ── Fetch active, unexpired sessions ──
        const nowIso = new Date().toISOString();
        let query = admin
            .from('sbd_assessment_sessions')
            .select('id, staff_id, facility_id, assessment_type, status, expires_at, progress, authorized_at')
            .eq('status', 'active')
            .gt('expires_at', nowIso)
            .order('expires_at', { ascending: true });
        if (scopeFids) query = query.in('facility_id', scopeFids);

        const { data: sessions, error: sessErr } = await query;
        if (sessErr) throw sessErr;

        // ── Enrich with staff names ──
        const staffIds = [...new Set((sessions || []).map((s: any) => s.staff_id).filter(Boolean))];
        const staffMap: Record<string, any> = {};
        if (staffIds.length > 0) {
            const { data: staffRows } = await admin
                .from('staff')
                .select('id, first, last')
                .in('id', staffIds);
            (staffRows || []).forEach((r: any) => { staffMap[r.id] = r; });
        }

        const out = (sessions || []).map((s: any) => {
            const st = staffMap[s.staff_id];
            const answered = (s.progress && s.progress.answers)
                ? Object.keys(s.progress.answers).length : 0;
            const total = TOTAL_QUESTIONS[s.assessment_type] ?? null;
            const remainingMs = Math.max(0, new Date(s.expires_at).getTime() - Date.now());
            return {
                session_id: s.id,
                staff_name: st ? `${st.first || ''} ${st.last || ''}`.trim() || 'Unknown' : 'Unknown',
                facility_id: s.facility_id,
                assessment_type: s.assessment_type,
                answered,
                total,
                remaining_minutes: Math.ceil(remainingMs / 60000),
                expires_at: s.expires_at,
                status: s.status,
            };
        });

        return new Response(JSON.stringify({ success: true, sessions: out }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (err: any) {
        console.error('[sbd-admin-sessions] Error:', err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
