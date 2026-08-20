import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
// Observation lifecycle notifications (OVS Gate 3), v2 with kinds:
//   result   -> approval: leadership + candidate (default)
//   queued   -> submission: leadership second-verification request (assessor excluded)
//   returned -> return: the observing assessor only
//   overdue  -> remediation past due: leadership
// Sends via Resend using the same secret and branded shell as sbd-send-emails.
const RESEND_KEY = Deno.env.get('RESEND_API_KEY');
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};
function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function shell(body) {
  return `<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0c1a;color:#dde3f0;padding:0;border-radius:12px;overflow:hidden"><div style="background:linear-gradient(135deg,#c49a20,#7a5c0d);padding:24px 32px;text-align:center"><div style="font-size:22px;font-weight:800;color:#000;letter-spacing:0.05em">SIPS</div><div style="font-size:10px;color:#000;letter-spacing:0.15em;text-transform:uppercase;margin-top:2px">Belt Intelligence Platform</div></div><div style="padding:32px">${body}</div><div style="padding:20px 32px;border-top:1px solid #1a1e30;text-align:center;font-size:11px;color:#64748b">SIPS Healthcare Solutions &bull; Sterile By Design<br>This is an automated message. Please do not reply directly.</div></div>`;
}
function outcomeBlock(p) {
  if (p.outcome === 'advance') return {
    color: '#22c55e',
    label: 'ADVANCE'
  };
  if (p.outcome === 'conditional') return {
    color: '#f59e0b',
    label: 'CONDITIONAL ADVANCE'
  };
  return {
    color: '#ef4444',
    label: 'DO NOT ADVANCE'
  };
}
function resultEmail(p, recipientName) {
  const oc = outcomeBlock(p);
  const urgent = !!p.stopWork;
  const subject = urgent ? `URGENT: Stop-Work executed during ${p.staffName}'s ${p.targetBelt} Belt observation` : `Observation verified: ${p.staffName} | ${p.targetBelt} Belt | ${oc.label}`;
  const reasons = (p.outcomeReasons || []).map((r)=>`<div style="font-size:12.5px;color:#94a3b8;line-height:1.6;margin-bottom:6px">&bull; ${esc(r)}</div>`).join('');
  const stopBlock = urgent ? `<div style="background:#3b0d0d;border:1px solid #7f1d1d;border-radius:8px;padding:16px;margin:20px 0"><div style="font-size:13px;font-weight:800;color:#fca5a5;margin-bottom:6px">STOP-WORK EXECUTED</div><div style="font-size:12.5px;color:#fca5a5;line-height:1.6">Reason: ${esc(p.stopWork?.reason || 'patient safety')}. The task was halted and the item flagged. Review and quality follow-up required.</div></div>` : '';
  const remBlock = p.remediation ? `<div style="background:#131829;border:1px solid #1a1e30;border-radius:8px;padding:16px;margin:20px 0"><div style="font-size:13px;font-weight:700;color:#c49a20;margin-bottom:8px">Remediation Opened</div><div style="font-size:12.5px;color:#94a3b8;line-height:1.7">${p.remediation.itemCount} item${p.remediation.itemCount === 1 ? '' : 's'} flagged &bull; Scope: ${esc(p.remediation.scope.replace(/_/g, ' '))}${p.remediation.dueAt ? ' &bull; Due ' + esc(String(p.remediation.dueAt).slice(0, 10)) : ''}. The loop closes only when the re-observation is completed, submitted, and verified.</div></div>` : '';
  const body = `<div style="font-size:16px;font-weight:700;color:${oc.color};margin-bottom:16px">${urgent ? 'Urgent Observation Notice' : 'Observation Verified'}</div><p style="color:#94a3b8;line-height:1.7;margin:0 0 16px">Hello ${esc(recipientName)},</p><p style="color:#94a3b8;line-height:1.7;margin:0 0 16px">${esc(p.assessorName)}'s ${esc(p.targetBelt)} Belt ${p.context === 'placement' ? 'placement ' : ''}observation for <strong style="color:#dde3f0">${esc(p.staffName)}</strong> has completed second verification.</p><div style="background:#131829;border:1px solid #1a1e30;border-radius:8px;padding:16px;margin:20px 0;text-align:center"><div style="font-size:18px;font-weight:900;color:${oc.color};letter-spacing:0.05em">${oc.label}</div>${p.totalPoints !== null && p.totalPoints !== undefined ? `<div style="font-size:12px;color:#64748b;margin-top:6px">Evidence: ${p.totalPoints} pts</div>` : ''}</div>${stopBlock}${reasons ? `<div style="margin:16px 0">${reasons}</div>` : ''}${remBlock}<p style="color:#94a3b8;line-height:1.7;margin:16px 0 0">The full item-level record is locked in the portal.</p>`;
  return {
    subject,
    html: shell(body)
  };
}
function queuedEmail(p, recipientName) {
  const subject = `Second verification needed: ${p.staffName} | ${p.targetBelt} Belt observation`;
  const body = `<div style="font-size:16px;font-weight:700;color:#a78bfa;margin-bottom:16px">Awaiting Second Verification</div><p style="color:#94a3b8;line-height:1.7;margin:0 0 16px">Hello ${esc(recipientName)},</p><p style="color:#94a3b8;line-height:1.7;margin:0 0 16px">${esc(p.assessorName)} submitted a ${esc(p.targetBelt)} Belt ${p.context === 'placement' ? 'placement ' : ''}observation for <strong style="color:#dde3f0">${esc(p.staffName)}</strong>. The gate does not move until a second verifier approves the record.</p><div style="background:#131829;border:1px solid #1a1e30;border-radius:8px;padding:16px;margin:20px 0;text-align:center"><div style="font-size:13px;color:#94a3b8">Open the Observations queue in the portal to approve or return it.</div></div><a href="https://belt.sterilebydesign.ai" style="display:inline-block;background:linear-gradient(135deg,#c49a20,#7a5c0d);color:#000;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;margin-top:8px">Open Review Queue</a>`;
  return {
    subject,
    html: shell(body)
  };
}
function returnedEmail(p) {
  const subject = `Observation returned: ${p.staffName} | ${p.targetBelt} Belt`;
  const body = `<div style="font-size:16px;font-weight:700;color:#f59e0b;margin-bottom:16px">Observation Returned for Correction</div><p style="color:#94a3b8;line-height:1.7;margin:0 0 16px">Hello ${esc(p.assessorName)},</p><p style="color:#94a3b8;line-height:1.7;margin:0 0 16px">${esc(p.returnedBy || 'A reviewer')} returned your ${esc(p.targetBelt)} Belt observation for <strong style="color:#dde3f0">${esc(p.staffName)}</strong>.</p><div style="background:#2b2010;border:1px solid #92400e;border-radius:8px;padding:16px;margin:20px 0"><div style="font-size:13px;font-weight:700;color:#fcd34d;margin-bottom:6px">Reason</div><div style="font-size:12.5px;color:#fcd34d;line-height:1.6">${esc(p.returnReason || '')}</div></div><p style="color:#94a3b8;line-height:1.7;margin:0 0 16px">The record is reopened as a draft. Correct the scoring and resubmit for second verification.</p><a href="https://belt.sterilebydesign.ai" style="display:inline-block;background:linear-gradient(135deg,#c49a20,#7a5c0d);color:#000;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;margin-top:8px">Open the Draft</a>`;
  return {
    subject,
    html: shell(body)
  };
}
function overdueEmail(p, recipientName) {
  const subject = `Overdue remediation: ${p.staffName} | ${p.targetBelt} Belt`;
  const body = `<div style="font-size:16px;font-weight:700;color:#ef4444;margin-bottom:16px">Remediation Past Due</div><p style="color:#94a3b8;line-height:1.7;margin:0 0 16px">Hello ${esc(recipientName)},</p><p style="color:#94a3b8;line-height:1.7;margin:0 0 16px"><strong style="color:#dde3f0">${esc(p.staffName)}</strong>'s ${esc(p.targetBelt)} Belt remediation passed its due date${p.dueAt ? ' (' + esc(String(p.dueAt).slice(0, 10)) + ')' : ''} without a completed re-observation. New observations for this candidate are locked until the loop closes.</p><div style="background:#131829;border:1px solid #1a1e30;border-radius:8px;padding:16px;margin:20px 0;text-align:center"><div style="font-size:13px;color:#94a3b8">Schedule the re-observation from the Open Remediations list in the portal.</div></div>`;
  return {
    subject,
    html: shell(body)
  };
}
async function sendEmail(to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'SIPS Belt Intelligence <noreply@belt.sterilebydesign.ai>',
      to: [
        to
      ],
      subject,
      html
    })
  });
  const data = await res.json();
  return {
    ok: res.ok,
    detail: res.ok ? data.id : data.message || JSON.stringify(data)
  };
}
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: corsHeaders
  });
  if (!RESEND_KEY) return new Response(JSON.stringify({
    error: 'RESEND_API_KEY secret is not configured.'
  }), {
    status: 500,
    headers: corsHeaders
  });
  try {
    const p = await req.json();
    if (!p || !p.staffName || !p.targetBelt) {
      return new Response(JSON.stringify({
        error: 'Missing required observation fields.'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    const kind = p.kind || 'result';
    const db = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
    const results = [];
    const seen = new Set();
    // Returned: the observing assessor only
    if (kind === 'returned') {
      if (p.assessorEmail) {
        const { subject, html } = returnedEmail(p);
        const r = await sendEmail(p.assessorEmail, subject, html);
        results.push({
          to: p.assessorEmail,
          role: 'assessor',
          status: r.ok ? 'sent' : 'error',
          detail: r.detail
        });
      }
      return new Response(JSON.stringify({
        kind,
        sent: results.filter((r)=>r.status === 'sent').length,
        failed: results.filter((r)=>r.status === 'error').length,
        results
      }), {
        headers: corsHeaders
      });
    }
    // Leadership recipients: master admins + profiles scoped to the facility
    const { data: profiles } = await db.from('user_profiles').select('email, name, role, fid, assigned_fids').eq('active', true);
    const leadership = (profiles || []).filter((u)=>{
      if (!u.email) return false;
      if (kind === 'queued' && p.assessorEmail && String(u.email).toLowerCase() === String(p.assessorEmail).toLowerCase()) return false;
      if (u.role === 'master_admin') return true;
      if (!p.fid) return false;
      if (u.fid && String(u.fid) === String(p.fid)) return true;
      if (Array.isArray(u.assigned_fids) && u.assigned_fids.map(String).includes(String(p.fid))) return true;
      return false;
    });
    for (const u of leadership){
      const addr = String(u.email).toLowerCase();
      if (seen.has(addr)) continue;
      seen.add(addr);
      const { subject, html } = kind === 'queued' ? queuedEmail(p, u.name || 'there') : kind === 'overdue' ? overdueEmail(p, u.name || 'there') : resultEmail(p, u.name || 'there');
      const r = await sendEmail(u.email, subject, html);
      results.push({
        to: u.email,
        role: 'leadership',
        status: r.ok ? 'sent' : 'error',
        detail: r.detail
      });
    }
    // Candidate recipient on verified results only
    if (kind === 'result' && p.staffId) {
      const { data: portalUser } = await db.from('sbd_portal_users').select('email, name').eq('staff_id', p.staffId).maybeSingle();
      if (portalUser && portalUser.email && !seen.has(String(portalUser.email).toLowerCase())) {
        const oc = outcomeBlock(p);
        const msg = p.outcome === 'advance' ? 'You met the standard at every required checkpoint. Your observation gate is complete and verified.' : p.outcome === 'conditional' ? 'You met every Mandatory standard. A documented remediation plan covers the remaining items, and your development continues from there with a follow-up verification.' : 'The standard was not met at one or more required checkpoints. Your facilitator will review the remediation plan with you, and a full re-observation will be scheduled when you are ready.';
        const body = `<div style="font-size:16px;font-weight:700;color:${oc.color};margin-bottom:16px">Observation Result</div><p style="color:#94a3b8;line-height:1.7;margin:0 0 16px">Hi ${esc(p.staffName.split(' ')[0])},</p><p style="color:#94a3b8;line-height:1.7;margin:0 0 16px">Your ${esc(p.targetBelt)} Belt observation has been completed and verified.</p><div style="background:#131829;border:1px solid #1a1e30;border-radius:8px;padding:16px;margin:20px 0;text-align:center"><div style="font-size:18px;font-weight:900;color:${oc.color};letter-spacing:0.05em">${oc.label}</div></div><p style="color:#94a3b8;line-height:1.7;margin:0 0 16px">${msg}</p><a href="https://belt.sterilebydesign.ai" style="display:inline-block;background:linear-gradient(135deg,#c49a20,#7a5c0d);color:#000;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;margin-top:8px">View Your Dashboard</a>`;
        const r = await sendEmail(portalUser.email, `Your ${p.targetBelt} Belt observation result`, shell(body));
        results.push({
          to: portalUser.email,
          role: 'candidate',
          status: r.ok ? 'sent' : 'error',
          detail: r.detail
        });
      }
    }
    return new Response(JSON.stringify({
      kind,
      sent: results.filter((r)=>r.status === 'sent').length,
      failed: results.filter((r)=>r.status === 'error').length,
      results
    }), {
      headers: corsHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: 'Internal server error.',
      detail: String(err)
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
