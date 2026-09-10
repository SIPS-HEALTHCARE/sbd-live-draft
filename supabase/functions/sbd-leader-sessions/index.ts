import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// #1180 (board 151, PIN half) — read-only leader view of assessment sittings.
//
// The hospital-side leaders who issue PINs (facility_admin, hospital) had no way to see
// what happened afterwards: sbd_assessment_sessions and sbd_assessment_pins carry only the
// service-role and MFA-gate policies, so the browser cannot read them directly, and
// sbd-admin-sessions admits only master_admin / staff_admin / system_admin. Ruling 9/8:
// leave that function and its three roles alone, add a separate leader-only reader.
//
// Strictly read-only. No PIN values, no session_token, no decide/re-issue path.
// Unlike sbd-admin-sessions (active sittings only) this returns every status: all 125 rows
// in prod today are completed or expired, so an active-only list would show a leader
// nothing after a sitting ends.
//
// No T33 MFA guard here on purpose: MFA_ADMIN_ROLES is the admin tier
// (master_admin/staff_admin/admin/master/sips_admin/system_admin) and neither role this
// function admits is in it. Admitting an admin-tier role here would require the guard.
const LEADER_ROLES = ['facility_admin', 'hospital'];

// Human label for the "module" column. assessment_type is the only module-ish field on the
// row; sizing lives in sbd-assessor-pin (placement = 30 questions, belt = 60).
const MODULE_LABEL: Record<string, string> = { placement: 'Placement', belt: 'Belt' };

const MAX_ROWS = 300;

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

        // ── Authorize: leader role only ──
        const { data: profile } = await admin
            .from('sbd_portal_users')
            .select('id, role, facility_id, assigned_facility_ids')
            .eq('auth_uid', user.id)
            .single();

        if (!profile || !LEADER_ROLES.includes(profile.role)) {
            return new Response(JSON.stringify({ error: 'Unauthorized: facility leader access required.' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // ── Facility scope: the leader's OWN facility, nothing wider ──
        // Same rule sbd-record-assessment applies to facility-bound roles: facility_id, with
        // assigned_facility_ids accepted as well because some rows are provisioned with only
        // that field. An empty scope returns an empty list — it never falls through to "all".
        const scopeFids = [...new Set([
            ...(profile.facility_id ? [profile.facility_id] : []),
            ...(Array.isArray(profile.assigned_facility_ids) ? profile.assigned_facility_ids : []),
        ].filter(Boolean))];

        if (scopeFids.length === 0) {
            return new Response(JSON.stringify({ success: true, sessions: [] }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // ── Fetch sittings for those facilities (every status) ──
        const { data: sessions, error: sessErr } = await admin
            .from('sbd_assessment_sessions')
            .select('id, staff_id, facility_id, assessment_type, status, authorized_at, completed_at, expires_at')
            .in('facility_id', scopeFids)
            .order('authorized_at', { ascending: false })
            .limit(MAX_ROWS);
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
            // An 'active' row whose window has passed reads as expired to the leader; the
            // status sweep that stamps the column runs on its own schedule.
            const status = (s.status === 'active' && new Date(s.expires_at).getTime() <= Date.now())
                ? 'expired' : s.status;
            return {
                session_id: s.id,
                staff_id: s.staff_id,
                staff_name: st ? `${st.first || ''} ${st.last || ''}`.trim() || 'Unknown' : 'Unknown',
                facility_id: s.facility_id,
                assessment_type: s.assessment_type,
                module: MODULE_LABEL[s.assessment_type] || s.assessment_type,
                status,
                started_at: s.authorized_at,
                completed_at: s.completed_at,
                expires_at: s.expires_at,
            };
        });

        return new Response(JSON.stringify({ success: true, sessions: out }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (err: any) {
        console.error('[sbd-leader-sessions] Error:', err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
