import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Key is stored as a Supabase secret — never hardcoded
const RESEND_KEY = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

function renderTemplate(template: string, data: Record<string, unknown>): { subject: string; html: string } {
  const name = (data.contact_name || data.name || 'there') as string;
  const facility = (data.facility_name || '') as string;
  const loginEmail = (data.login_email || '') as string;
  const tempPassword = (data.temp_password || '') as string;
  const authCreated = data.auth_created as boolean;
  const base = `<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0c1a;color:#dde3f0;padding:0;border-radius:12px;overflow:hidden"><div style="background:linear-gradient(135deg,#c49a20,#7a5c0d);padding:24px 32px;text-align:center"><div style="font-size:22px;font-weight:800;color:#000;letter-spacing:0.05em">SIPS</div><div style="font-size:10px;color:#000;letter-spacing:0.15em;text-transform:uppercase;margin-top:2px">Belt Intelligence Platform</div></div><div style="padding:32px">__BODY__</div><div style="padding:20px 32px;border-top:1px solid #1a1e30;text-align:center;font-size:11px;color:#64748b">SIPS Healthcare Solutions &bull; Sterile By Design<br>This is an automated message. Please do not reply directly.</div></div>`;

  const templates: Record<string, { subject: string; body: string }> = {
    registration_received: {
      subject: 'SIPS Belt Intelligence Portal: Registration Received',
      body: `<div style="font-size:16px;font-weight:700;color:#dde3f0;margin-bottom:16px">Registration Received</div><p style="color:#94a3b8;line-height:1.7;margin:0 0 16px">Hello ${name},</p><p style="color:#94a3b8;line-height:1.7;margin:0 0 16px">Thank you for registering <strong style="color:#dde3f0">${facility}</strong> with the SIPS Belt Intelligence Platform. Your application has been received and is now under review.</p><div style="background:#131829;border:1px solid #1a1e30;border-radius:8px;padding:16px;margin:20px 0"><div style="font-size:13px;font-weight:600;color:#c49a20;margin-bottom:8px">What happens next:</div><div style="font-size:13px;color:#94a3b8;line-height:1.7">Our team will review your registration and verify your facility details. You will receive an email once your account has been activated. This typically takes 1 to 2 business days.</div></div><p style="color:#94a3b8;line-height:1.7;margin:0">Questions? Contact us at <a href="mailto:info@sipshealthcare.com" style="color:#c49a20;text-decoration:none">info@sipshealthcare.com</a>.</p>`,
    },
    registration_approved: {
      subject: 'Your SIPS Belt Intelligence Portal is Ready',
      body: `<div style="font-size:16px;font-weight:700;color:#22c55e;margin-bottom:16px">Account Approved</div><p style="color:#94a3b8;line-height:1.7;margin:0 0 16px">Hello ${name},</p><p style="color:#94a3b8;line-height:1.7;margin:0 0 16px">Great news! Your registration${facility ? ' for <strong style="color:#dde3f0">' + facility + '</strong>' : ''} has been approved. Your Belt Intelligence Portal is now active.</p>${tempPassword ? '<div style="background:#0e382c;border:1px solid #166534;border-radius:8px;padding:16px;margin:20px 0"><div style="font-size:14px;font-weight:700;color:#22c55e;margin-bottom:12px">Your Login Credentials</div><table style="width:100%;border-collapse:collapse"><tr><td style="padding:6px 0;color:#64748b;font-size:12px;width:120px">Email</td><td style="padding:6px 0;color:#dde3f0;font-size:13px;font-weight:600">' + loginEmail + '</td></tr><tr><td style="padding:6px 0;color:#64748b;font-size:12px">Temporary Password</td><td style="padding:6px 0;color:#c49a20;font-size:13px;font-weight:600;font-family:monospace">' + tempPassword + '</td></tr></table><div style="font-size:11px;color:#64748b;margin-top:8px">Please change your password after your first login.</div></div>' : '<div style="background:#0e382c;border:1px solid #166534;border-radius:8px;padding:16px;margin:20px 0;text-align:center"><div style="font-size:14px;font-weight:700;color:#22c55e;margin-bottom:8px">Your Portal is Live</div><div style="font-size:13px;color:#94a3b8">Sign in with the email and password you provided during registration.</div></div>'}<a href="https://belt.sterilebydesign.ai" style="display:inline-block;background:linear-gradient(135deg,#c49a20,#7a5c0d);color:#000;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;margin-top:8px">Sign In to Your Portal</a><p style="color:#94a3b8;line-height:1.7;margin:16px 0 0">Welcome to the SIPS network.</p>`,
    },
    registration_denied: {
      subject: 'SIPS Belt Intelligence Portal: Registration Update',
      body: `<div style="font-size:16px;font-weight:700;color:#dde3f0;margin-bottom:16px">Registration Update</div><p style="color:#94a3b8;line-height:1.7;margin:0 0 16px">Hello ${name},</p><p style="color:#94a3b8;line-height:1.7;margin:0 0 16px">After reviewing your registration for <strong style="color:#dde3f0">${facility}</strong>, we are unable to activate your account at this time.</p><p style="color:#94a3b8;line-height:1.7;margin:0">Contact us at <a href="mailto:info@sipshealthcare.com" style="color:#c49a20;text-decoration:none">info@sipshealthcare.com</a> for more information.</p>`,
    },
    password_reset: {
      subject: 'SIPS Belt Intelligence Portal: Password Reset',
      body: `<div style="font-size:16px;font-weight:700;color:#dde3f0;margin-bottom:16px">Password Reset Request</div><p style="color:#94a3b8;line-height:1.7;margin:0 0 16px">Hello ${name},</p><p style="color:#94a3b8;line-height:1.7;margin:0 0 16px">We received a request to reset your password.</p><div style="background:#131829;border:1px solid #1a1e30;border-radius:8px;padding:16px;margin:20px 0;text-align:center"><div style="font-size:13px;color:#94a3b8;margin-bottom:12px">Your temporary reset token:</div><div style="font-size:18px;font-weight:700;color:#c49a20;letter-spacing:0.1em;font-family:monospace;background:#07091c;padding:12px;border-radius:6px;border:1px solid #362d1d">${data.reset_token || ''}</div><div style="font-size:11px;color:#64748b;margin-top:8px">This token expires in 1 hour.</div></div><p style="color:#94a3b8;line-height:1.7;margin:0">If you did not request this, you can safely ignore this email.</p>`,
    },
    admin_new_registration: {
      subject: `New Facility Registration: ${facility}`,
      body: `<div style="font-size:16px;font-weight:700;color:#c49a20;margin-bottom:16px">New Registration Pending Review</div><p style="color:#94a3b8;line-height:1.7;margin:0 0 16px">Hello ${(data.admin_name || 'Admin') as string},</p><p style="color:#94a3b8;line-height:1.7;margin:0 0 16px">A new facility registration request has been submitted:</p><div style="background:#131829;border:1px solid #1a1e30;border-radius:8px;padding:16px;margin:20px 0"><table style="width:100%;border-collapse:collapse"><tr><td style="padding:6px 0;color:#64748b;font-size:12px;width:100px">Facility</td><td style="padding:6px 0;color:#dde3f0;font-size:13px;font-weight:600">${facility}</td></tr><tr><td style="padding:6px 0;color:#64748b;font-size:12px">Contact</td><td style="padding:6px 0;color:#dde3f0;font-size:13px">${(data.contact_name || '') as string}</td></tr><tr><td style="padding:6px 0;color:#64748b;font-size:12px">Email</td><td style="padding:6px 0;color:#c49a20;font-size:13px">${(data.contact_email || '') as string}</td></tr><tr><td style="padding:6px 0;color:#64748b;font-size:12px">Location</td><td style="padding:6px 0;color:#dde3f0;font-size:13px">${(data.location || '') as string}</td></tr><tr><td style="padding:6px 0;color:#64748b;font-size:12px">Department</td><td style="padding:6px 0;color:#dde3f0;font-size:13px">${(data.department || '') as string}</td></tr></table></div><p style="color:#94a3b8;line-height:1.7;margin:0">Log in to the admin portal to review this request.</p>`,
    },
  };

  const tpl = templates[template] || { subject: 'SIPS Notification', body: `<p style="color:#94a3b8">${JSON.stringify(data)}</p>` };
  return { subject: tpl.subject, html: base.replace('__BODY__', tpl.body) };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Guard: fail loudly if secret is missing
  if (!RESEND_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY secret is not configured in Supabase.' }), { status: 500, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const db = createClient(supabaseUrl, serviceKey);

    const { data: pending, error: fetchErr } = await db
      .from('sbd_email_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', 3)
      .order('created_at', { ascending: true })
      .limit(10);

    if (fetchErr) return new Response(JSON.stringify({ error: fetchErr.message }), { status: 500, headers: corsHeaders });
    if (!pending || pending.length === 0) return new Response(JSON.stringify({ processed: 0, message: 'No pending emails.' }), { headers: corsHeaders });

    const results: Array<{ id: string; to: string; template: string; status: string; resend_id?: string; error?: string }> = [];

    for (const email of pending) {
      const { subject, html } = renderTemplate(email.template, email.body_data || {});

      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'SIPS Belt Intelligence <noreply@belt.sterilebydesign.ai>',
            to: [email.recipient_email],
            subject: email.subject || subject,
            html,
          }),
        });
        const resData = await res.json();

        if (res.ok) {
          await db.from('sbd_email_queue').update({ status: 'sent', sent_at: new Date().toISOString(), attempts: (email.attempts || 0) + 1 }).eq('id', email.id);
          results.push({ id: email.id, to: email.recipient_email, template: email.template, status: 'sent', resend_id: resData.id });
        } else {
          const newAttempts = (email.attempts || 0) + 1;
          await db.from('sbd_email_queue').update({ status: newAttempts >= 3 ? 'failed' : 'pending', attempts: newAttempts, last_error: resData.message || JSON.stringify(resData) }).eq('id', email.id);
          results.push({ id: email.id, to: email.recipient_email, template: email.template, status: 'error', error: resData.message });
        }
      } catch (err) {
        const newAttempts = (email.attempts || 0) + 1;
        await db.from('sbd_email_queue').update({ status: newAttempts >= 3 ? 'failed' : 'pending', attempts: newAttempts, last_error: String(err) }).eq('id', email.id);
        results.push({ id: email.id, to: email.recipient_email, template: email.template, status: 'error', error: String(err) });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, sent: results.filter(r => r.status === 'sent').length, failed: results.filter(r => r.status === 'error').length, results }), { headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error.', detail: String(err) }), { status: 500, headers: corsHeaders });
  }
});
