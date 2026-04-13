import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// SIPS Master Admins
const ADMIN_EMAILS = [
  "jjacobs@sipsconsults.com",
  "izambrano@sipsconsults.com",
  "dpayne@sipsconsults.com",
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, prefer",
};

// ----------------------------------------------------------------------------
// WEBHOOK HANDLER — Enqueues emails via sbd_email_queue
// All actual sending is handled by sbd-send-emails (cron processor with retries)
// ----------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET");
    if (WEBHOOK_SECRET) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { headers: corsHeaders, status: 403 });
      }
    }

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
      for (const adminEmail of ADMIN_EMAILS) {
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
