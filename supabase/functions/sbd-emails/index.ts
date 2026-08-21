import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6';

// Safety fallback; live placement notifications also query sbd_portal_users for
// every current master_admin profile.
const FALLBACK_ADMIN_EMAILS = [
  "jjacobs@sipsconsults.com",
  "izambrano@sipsconsults.com",
  "dpayne@sipsconsults.com",
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, prefer",
};

async function getMasterAdminEmails(supabaseAdmin: any): Promise<string[]> {
  const emails = new Set(FALLBACK_ADMIN_EMAILS);
  const { data, error } = await supabaseAdmin
    .from('sbd_portal_users')
    .select('email')
    .eq('role', 'master_admin');
  if (error) {
    console.error('Failed to load master admin emails; using fallback list:', error.message);
  }
  (data || []).forEach((row: { email?: string }) => {
    if (row.email && row.email.includes('@')) emails.add(row.email);
  });
  return Array.from(emails);
}

// ----------------------------------------------------------------------------
// WEBHOOK HANDLER — Enqueues emails via sbd_email_queue
// All actual sending is handled by sbd-send-emails (cron processor with retries)
// ----------------------------------------------------------------------------

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

    let payload;
    try {
      payload = await req.json();
    } catch(e) {
      throw new Error("Invalid JSON payload");
    }

    const emailsQueued: string[] = [];

    // ── Placement assessment events (direct frontend calls, authenticated via user JWT) ──
    if (payload.type === 'placement_started' || payload.type === 'placement_completed') {
      const authHeader = req.headers.get("Authorization") || '';
      const jwt = authHeader.replace(/^Bearer\s+/i, '');
      if (!jwt) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { headers: corsHeaders, status: 403 });
      }
      const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(jwt);
      if (authErr || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { headers: corsHeaders, status: 403 });
      }

      const d = payload.data || {};
      const template = payload.type; // 'placement_started' | 'placement_completed'
      const bodyData = {
        staff_name:  d.staff_name  || '—',
        staff_role:  d.staff_role  || '—',
        facility:    d.facility    || '—',
        belt:        d.belt        || '—',
        result:      d.result      || d.assessment_result || '',
        timestamp:   d.timestamp   || new Date().toISOString(),
      };

      const adminEmails = await getMasterAdminEmails(supabaseAdmin);
      for (const adminEmail of adminEmails) {
        await supabaseAdmin.from('sbd_email_queue').insert({
          recipient_email: adminEmail,
          template,
          body_data: bodyData,
          status: 'pending',
          attempts: 0,
          created_at: new Date().toISOString()
        });
        emailsQueued.push(`${template} → ${adminEmail}`);
      }

      return new Response(JSON.stringify({ success: true, emailType: template, queued: emailsQueued }), { headers: corsHeaders });
    }

    // ── Registration denied (admin action from the frontend, authenticated via user JWT) ──
    // Moved server-side 2026-07-18 (P0-2): the browser previously inserted directly into
    // sbd_email_queue, which is exactly the injection vector closed by
    // 20260718120100_p0_2_sbd_email_queue_rls.sql (table is now service-role-only). The
    // enqueue happens here under the service role, gated by a JWT + admin check.
    if (payload.type === 'registration_denied') {
      const authHeader = req.headers.get("Authorization") || '';
      const jwt = authHeader.replace(/^Bearer\s+/i, '');
      if (!jwt) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { headers: corsHeaders, status: 403 });
      }
      const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(jwt);
      if (authErr || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { headers: corsHeaders, status: 403 });
      }
      // Authorize: caller must be an admin (SIPS fallback list, or a master_admin/staff_admin/
      // admin row in sbd_portal_users). Matches sbd_is_admin()'s intent.
      const callerEmail = (user.email || '').toLowerCase();
      const adminEmails = (await getMasterAdminEmails(supabaseAdmin)).map(e => e.toLowerCase());
      const { data: portalRows } = await supabaseAdmin
        .from('sbd_portal_users')
        .select('role')
        .ilike('email', callerEmail);
      const isAdmin =
        adminEmails.includes(callerEmail) ||
        (portalRows || []).some((r: { role?: string }) =>
          ['master_admin', 'staff_admin', 'admin'].includes(r.role || ''));
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { headers: corsHeaders, status: 403 });
      }

      const d = payload.data || {};
      const recipient = d.recipient_email || d.email;
      if (recipient) {
        await supabaseAdmin.from('sbd_email_queue').insert({
          recipient_email: recipient,
          template: 'registration_denied',
          body_data: {
            contact_name: d.contact_name || d.applicant_name || 'Applicant',
            facility_name: d.facility_name || 'your facility',
          },
          status: 'pending',
          attempts: 0,
          created_at: new Date().toISOString(),
        });
        emailsQueued.push(`registration_denied → ${recipient}`);
      }
      return new Response(JSON.stringify({ success: true, emailType: 'registration_denied', queued: emailsQueued }), { headers: corsHeaders });
    }

    // ── Webhook events (DB triggers) — WEBHOOK_SECRET is MANDATORY, fail closed ──
    // The DB webhook must send `Authorization: Bearer <WEBHOOK_SECRET>`. If the secret
    // is unset, we refuse rather than run the branch open: an unset env must never turn
    // this into an anon-callable email queuer (the 18 Jul finding).
    const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET");
    const authHeader = req.headers.get("Authorization");
    if (!WEBHOOK_SECRET || authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { headers: corsHeaders, status: 403 });
    }

    // 1. New Facility Registration Request → queue emails
    if (payload.type === 'INSERT' && payload.table === 'registrations') {
      const record = payload.record;
      const applicantEmail = record.email;
      const applicantName = record.contact || record.name || 'SBD User';
      const facilityName = record.facilityName || record.facility_name || record.facility || '';

      // Queue: Applicant confirmation
      if (applicantEmail) {
        await supabaseAdmin.from('sbd_email_queue').insert({
          recipient_email: applicantEmail,
          template: 'registration_received',
          body_data: {
            contact_name: applicantName,
            name: applicantName,
            facility_name: facilityName
          },
          status: 'pending',
          attempts: 0,
          created_at: new Date().toISOString()
        });
        emailsQueued.push(`registration_received → ${applicantEmail}`);
      }

      // Queue: Admin alerts (one per admin)
      const adminEmails = await getMasterAdminEmails(supabaseAdmin);
      for (const adminEmail of adminEmails) {
        await supabaseAdmin.from('sbd_email_queue').insert({
          recipient_email: adminEmail,
          template: 'admin_new_registration',
          body_data: {
            admin_name: 'Admin',
            facility_name: facilityName,
            contact_name: applicantName,
            contact_email: applicantEmail,
            location: record.location || record.loc || '',
            department: record.department || ''
          },
          status: 'pending',
          attempts: 0,
          created_at: new Date().toISOString()
        });
        emailsQueued.push(`admin_new_registration → ${adminEmail}`);
      }

      return new Response(JSON.stringify({ success: true, emailType: 'registration_alerts', queued: emailsQueued }), { headers: corsHeaders });
    }

    // Unhandled payload
    return new Response(JSON.stringify({ success: true, ignored: true, reason: 'unmatched trigger' }), { headers: corsHeaders });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return new Response(JSON.stringify({ error: error.message }), { headers: corsHeaders, status: 500 });
  }
});
