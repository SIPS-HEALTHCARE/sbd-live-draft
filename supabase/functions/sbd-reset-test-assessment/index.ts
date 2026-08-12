// ============================================================
// sbd-reset-test-assessment
// ============================================================
// Master-admin-only utility. Two capabilities:
//
//   RESET (mode 'execute') — wipes a staff member's placement state:
//     1. UPDATE staff: null belt/since/cur_*/nxt_*/oip, set placement_needed=true
//     2. DELETE FROM placement_reviews WHERE staff_id = <resolved>
//     3. DELETE FROM sbd_assessment_queue WHERE staff_id = <resolved>
//
//   REOPEN (mode 'reopen') — for a timed-out / stuck test: finds the
//     person's most recent INCOMPLETE assessment session and extends its
//     expires_at by 90 minutes so they resume right where they left off
//     (answers intact). No data is wiped. (Turns the Michael fix into a button.)
//
// staff is resolved via sbd_portal_users.auth_uid (NOT .id — that
// path matches 0 rows for users created via sbd-sync-user-claims).
//
// Modes:
//   - 'preview'  → resolves target + returns row counts + any in-progress session. No writes.
//   - 'execute'  → performs the 3 reset writes sequentially.
//   - 'reopen'   → extends the in-progress session (resume). No wipe.
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MASTER_ADMIN_ROLES = ['master_admin'];

// Summarise an in-progress assessment session for the UI (how far they got).
function sessionSummary(s: any) {
  if (!s) return null;
  const prog = s.progress || {};
  const total = Array.isArray(prog.shuffledQuestions) ? prog.shuffledQuestions.length : null;
  const answered = prog.answers ? Object.keys(prog.answers).length : 0;
  return {
    id: s.id,
    status: s.status,
    assessment_type: s.assessment_type,
    answered,
    total_questions: total,
    current_q: (prog.currentQ ?? null),
    expires_at: s.expires_at,
    expired: s.expires_at ? (new Date(s.expires_at).getTime() < Date.now()) : null
  };
}

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

    const body = await req.json().catch(() => ({}));
    const email = (body.email || '').toString().trim().toLowerCase();
    const mode = (body.mode || 'preview').toString();
    if (!email) {
      return new Response(JSON.stringify({ error: 'email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    if (mode !== 'preview' && mode !== 'execute' && mode !== 'reopen') {
      return new Response(JSON.stringify({ error: `Invalid mode "${mode}". Use "preview", "execute", or "reopen".` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid or expired session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: callerProfile } = await supabaseAdmin
      .from('sbd_portal_users')
      .select('role, email, name')
      .eq('auth_uid', user.id)
      .single();
    if (!callerProfile || !MASTER_ADMIN_ROLES.includes(callerProfile.role)) {
      return new Response(JSON.stringify({
        error: `Unauthorized role (${callerProfile?.role || 'none'}). Only master_admin can reset test assessments.`
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
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
      return new Response(JSON.stringify({
        error: 'MFA required: administrator sessions must complete two-factor verification.'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: target, error: targetErr } = await supabaseAdmin
      .from('sbd_portal_users')
      .select('id, auth_uid, email, name, role')
      .ilike('email', email)
      .maybeSingle();
    if (targetErr) {
      return new Response(JSON.stringify({ error: `Lookup failed: ${targetErr.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    if (!target) {
      return new Response(JSON.stringify({ error: `No portal user found for email "${email}"` }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: staff } = await supabaseAdmin
      .from('staff')
      .select('id, first, last, belt, placement_needed, fid')
      .eq('id', target.auth_uid)
      .maybeSingle();
    if (!staff) {
      return new Response(JSON.stringify({
        error: `Portal user "${target.email}" exists but no staff record is linked via auth_uid (${target.auth_uid}). Nothing to reset.`,
        portal_user: target
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Most recent INCOMPLETE assessment session (drives the Reopen action + preview hint).
    const { data: openSession } = await supabaseAdmin
      .from('sbd_assessment_sessions')
      .select('id, status, assessment_type, progress, expires_at, created_at, completed_at')
      .eq('staff_id', staff.id)
      .is('completed_at', null)
      .neq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // ── REOPEN mode: extend the in-progress session so they resume. No wipe. ──
    if (mode === 'reopen') {
      if (!openSession) {
        return new Response(JSON.stringify({
          success: false,
          error: `No in-progress assessment session found for ${`${staff.first || ''} ${staff.last || ''}`.trim() || 'this staff member'}. Nothing to reopen.`
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      const newExpiry = new Date(Date.now() + 90 * 60 * 1000).toISOString();
      const { error: reErr } = await supabaseAdmin
        .from('sbd_assessment_sessions')
        .update({ expires_at: newExpiry })
        .eq('id', openSession.id)
        .is('completed_at', null);
      if (reErr) {
        console.error('[reset-test-assessment] Reopen failed:', reErr);
        return new Response(JSON.stringify({ error: `Reopen failed: ${reErr.message}` }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({
        success: true,
        mode: 'reopen',
        caller: { email: callerProfile.email, role: callerProfile.role },
        target_staff: { id: staff.id, name: `${staff.first || ''} ${staff.last || ''}`.trim() || '(unnamed)' },
        session: { ...sessionSummary(openSession), expires_at: newExpiry, expired: false },
        reopened_at: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { count: prCount } = await supabaseAdmin
      .from('placement_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('staff_id', staff.id);
    const { count: aqCount } = await supabaseAdmin
      .from('sbd_assessment_queue')
      .select('*', { count: 'exact', head: true })
      .eq('staff_id', staff.id);

    if (mode === 'preview') {
      return new Response(JSON.stringify({
        success: true,
        mode: 'preview',
        caller: { email: callerProfile.email, role: callerProfile.role },
        target_portal_user: target,
        target_staff: staff,
        placement_reviews_count: prCount || 0,
        assessment_queue_count: aqCount || 0,
        in_progress_session: sessionSummary(openSession)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { error: e1 } = await supabaseAdmin
      .from('staff')
      .update({
        placement_needed: true,
        belt: null,
        since: null,
        cur_comp: null, cur_sim: null, cur_obs: null,
        nxt_comp: null, nxt_sim: null, nxt_obs: null,
        oip: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', staff.id);
    if (e1) {
      console.error('[reset-test-assessment] Step 1 (staff UPDATE) failed:', e1);
      return new Response(JSON.stringify({
        error: `Step 1 (staff UPDATE) failed: ${e1.message}`,
        step_failed: 1,
        partial_state: false
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { error: e2 } = await supabaseAdmin
      .from('placement_reviews')
      .delete()
      .eq('staff_id', staff.id);
    if (e2) {
      console.error('[reset-test-assessment] Step 2 (placement_reviews DELETE) failed:', e2);
      return new Response(JSON.stringify({
        error: `Step 2 (placement_reviews DELETE) failed: ${e2.message}. Staff row already reset; rerun to complete deletes.`,
        step_failed: 2,
        partial_state: true
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { error: e3 } = await supabaseAdmin
      .from('sbd_assessment_queue')
      .delete()
      .eq('staff_id', staff.id);
    if (e3) {
      console.error('[reset-test-assessment] Step 3 (sbd_assessment_queue DELETE) failed:', e3);
      return new Response(JSON.stringify({
        error: `Step 3 (sbd_assessment_queue DELETE) failed: ${e3.message}. Staff row and placement_reviews already cleared; rerun to complete queue deletes.`,
        step_failed: 3,
        partial_state: true
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      mode: 'execute',
      caller: { email: callerProfile.email, role: callerProfile.role },
      target_staff: {
        id: staff.id,
        name: `${staff.first || ''} ${staff.last || ''}`.trim() || '(unnamed)',
        previous_belt: staff.belt
      },
      placement_reviews_deleted: prCount || 0,
      assessment_queue_deleted: aqCount || 0,
      executed_at: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('[reset-test-assessment] Uncaught error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
