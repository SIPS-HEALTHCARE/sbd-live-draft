// ============================================================
// sbd-reset-test-assessment
// ============================================================
// Master-admin-only utility. Resets a staff member's placement
// assessment state by:
//   1. UPDATE staff: null belt/since/cur_*/nxt_*/oip, set placement_needed=true
//   2. DELETE FROM placement_reviews WHERE staff_id = <resolved>
//   3. DELETE FROM sbd_assessment_queue WHERE staff_id = <resolved>
//
// staff is resolved via sbd_portal_users.auth_uid (NOT .id — that
// path matches 0 rows for users created via sbd-sync-user-claims).
//
// Modes:
//   - 'preview'  → resolves target + returns row counts. No writes.
//   - 'execute'  → performs all 3 writes sequentially.
//
// See spec doc:
//   /Users/depreshawn/Downloads/Work/SIPS_Report_2026-04-27/specs/reset-test-assessment-utility.md
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MASTER_ADMIN_ROLES = ['master_admin'];

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

    // ── Parse body ──
    const body = await req.json().catch(() => ({}));
    const email = (body.email || '').toString().trim().toLowerCase();
    const mode = (body.mode || 'preview').toString();
    if (!email) {
      return new Response(JSON.stringify({ error: 'email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    if (mode !== 'preview' && mode !== 'execute') {
      return new Response(JSON.stringify({ error: `Invalid mode "${mode}". Use "preview" or "execute".` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ── Verify caller JWT ──
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

    // ── Verify caller is master_admin ──
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

    // ── Resolve target portal user ──
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

    // ── Resolve target staff record via auth_uid (the correct join) ──
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

    // ── Count rows that would be / were deleted ──
    const { count: prCount } = await supabaseAdmin
      .from('placement_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('staff_id', staff.id);
    const { count: aqCount } = await supabaseAdmin
      .from('sbd_assessment_queue')
      .select('*', { count: 'exact', head: true })
      .eq('staff_id', staff.id);

    // ── Preview mode: return resolved info, no writes ──
    if (mode === 'preview') {
      return new Response(JSON.stringify({
        success: true,
        mode: 'preview',
        caller: { email: callerProfile.email, role: callerProfile.role },
        target_portal_user: target,
        target_staff: staff,
        placement_reviews_count: prCount || 0,
        assessment_queue_count: aqCount || 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ── Execute mode: three sequential writes ──

    // Step 1: UPDATE staff
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

    // Step 2: DELETE placement_reviews
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

    // Step 3: DELETE sbd_assessment_queue
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

    // ── Success ──
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
