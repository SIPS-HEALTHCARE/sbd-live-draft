// Pending-review reminders.
//
// Client ruling (2026-07-24): every pending review chases the admins twice a day
// until it is approved or denied. Scope is all three review queues:
//   placement_reviews.status      = 'pending'
//   sbd_assessment_queue.status   = 'pending'   (belt gate requests)
//   preceptor_access.state        = 'requested' (preceptor school applications)
//
// The "until approved or denied" part needs no state tracking: each run simply
// re-reads what is still pending, so an item stops being chased the moment its
// status changes. Recipients are every active master admin with an email.
//
// Driven by pg_cron twice a day. Mail goes through sbd_email_queue, which is
// service-role only, so this has to run server side rather than in the browser.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function daysOld(iso: string | null): number {
  if (!iso) return 0;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. What is still waiting on a decision.
    const [placements, gates, preceptors] = await Promise.all([
      supabase.from('placement_reviews').select('id, staff_id, created_at').eq('status', 'pending'),
      supabase.from('sbd_assessment_queue').select('id, staff_id, requested_at').eq('status', 'pending'),
      supabase.from('preceptor_access').select('id, staff_id, requested_at').eq('state', 'requested'),
    ]);

    const placementRows = placements.data ?? [];
    const gateRows = gates.data ?? [];
    const preceptorRows = preceptors.data ?? [];
    const total = placementRows.length + gateRows.length + preceptorRows.length;

    // Nothing outstanding means nothing to chase. Staying silent on a clear queue
    // is what keeps the twice-daily cadence from becoming noise.
    if (total === 0) {
      return new Response(JSON.stringify({ sent: 0, message: 'No pending reviews.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Who gets told.
    const { data: admins } = await supabase
      .from('sbd_portal_users')
      .select('name, email, active, role')
      .in('role', ['master_admin', 'admin']);

    const recipients = (admins ?? []).filter((a) => a.email && a.active !== false);
    if (recipients.length === 0) {
      console.warn('[review-reminders] pending reviews exist but no admin recipients were found');
      return new Response(JSON.stringify({ sent: 0, pending: total, message: 'No recipients.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Oldest item per queue, so the mail conveys urgency rather than just a count.
    const oldest = (rows: any[], field: string) =>
      rows.reduce((max, r) => Math.max(max, daysOld(r[field])), 0);

    const summary = {
      placement_reviews: placementRows.length,
      belt_gate_requests: gateRows.length,
      preceptor_applications: preceptorRows.length,
      total,
      oldest_days: Math.max(
        oldest(placementRows, 'created_at'),
        oldest(gateRows, 'requested_at'),
        oldest(preceptorRows, 'requested_at')
      ),
    };

    const parts: string[] = [];
    if (summary.placement_reviews) parts.push(`${summary.placement_reviews} placement review${summary.placement_reviews === 1 ? '' : 's'}`);
    if (summary.belt_gate_requests) parts.push(`${summary.belt_gate_requests} belt gate request${summary.belt_gate_requests === 1 ? '' : 's'}`);
    if (summary.preceptor_applications) parts.push(`${summary.preceptor_applications} preceptor application${summary.preceptor_applications === 1 ? '' : 's'}`);

    const subject = `${total} review${total === 1 ? '' : 's'} waiting for approval`;

    const rows = recipients.map((r) => ({
      recipient_email: r.email,
      recipient_name: r.name,
      template: 'pending_review_reminder',
      subject,
      body_data: {
        name: r.name,
        summary_line: parts.join(', '),
        ...summary,
      },
      status: 'pending',
      attempts: 0,
    }));

    const { error: queueError } = await supabase.from('sbd_email_queue').insert(rows);
    if (queueError) throw queueError;

    return new Response(JSON.stringify({ sent: rows.length, pending: summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[review-reminders] failed:', err?.message ?? err);
    return new Response(JSON.stringify({ error: err?.message ?? String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
