// sbd-log-activity — P1 batched activity ingestion.
// Verifies the caller's JWT, resolves their identity from sbd_portal_users, and inserts the
// batch with the SERVICE ROLE, stamping user_id/staff_id/facility_id SERVER-SIDE. The client
// only sends { events: [{ event_type, event_meta, ts }] } — it cannot spoof another identity
// or write columns it shouldn't. Best-effort: malformed events are skipped, not fatal.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_EVENTS = 200;            // per-request cap (abuse guard)
const ALLOWED = new Set([
    'login', 'logout', 'session_start', 'session_end', 'heartbeat',
    'view', 'practice_start', 'practice_complete', 'assessment_request', 'david_query',
]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const supabase = createClient(supabaseUrl, serviceKey);

        const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
        if (!jwt) return json({ error: 'Unauthorized' }, 401);

        const { data: { user }, error: authErr } = await supabase.auth.getUser(jwt);
        if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

        // Resolve identity server-side (never trust the client for these). The auth UID
        // lives in the auth_uid column, not id.
        const { data: profile } = await supabase
            .from('sbd_portal_users')
            .select('id, role, facility_id, staff_id')
            .eq('auth_uid', user.id)
            .single();

        const payload = await req.json().catch(() => ({}));
        const events = Array.isArray(payload?.events) ? payload.events.slice(0, MAX_EVENTS) : [];
        if (!events.length) return json({ inserted: 0 }, 200);

        // sbd_activity_log.staff_id and facility_id are uuid columns. sbd_portal_users.staff_id
        // is a legacy INTEGER (never compatible) and facility_id is TEXT (may be a non-uuid code),
        // so coerce both safely: staff.id == the auth uid for staff members (sbd-sync-user-claims),
        // so use user.id for them to keep rows readable under the staff_id = auth.uid() RLS scope;
        // null otherwise. facility_id only passes through when it is a real uuid.
        const staffId = profile?.role === 'staff_member' ? user.id : null;
        const rawFid = profile?.facility_id;
        const facilityId = (typeof rawFid === 'string' && UUID_RE.test(rawFid)) ? rawFid : null;

        const rows = events
            .filter((e: any) => e && ALLOWED.has(String(e.event_type)))
            .map((e: any) => ({
                user_id: profile?.id || null,
                staff_id: staffId,
                facility_id: facilityId,
                // `action` is a legacy NOT NULL column; mirror event_type so inserts are accepted.
                action: String(e.event_type),
                event_type: String(e.event_type),
                event_meta: (e.event_meta && typeof e.event_meta === 'object') ? e.event_meta : {},
                created_at: typeof e.ts === 'string' ? e.ts : new Date().toISOString(),
            }));

        if (!rows.length) return json({ inserted: 0 }, 200);

        const { error: insErr } = await supabase.from('sbd_activity_log').insert(rows);
        if (insErr) throw insErr;

        return json({ inserted: rows.length }, 200);
    } catch (err: any) {
        console.error('[sbd-log-activity] error:', err?.message);
        return json({ error: err?.message || 'failed' }, 400);
    }
});

function json(body: unknown, status: number) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}
