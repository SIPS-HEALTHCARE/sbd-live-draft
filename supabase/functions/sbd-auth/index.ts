import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sbd-session, x-sbd-user-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const db = createClient(supabaseUrl, serviceKey);
    const body = await req.json();
    const { action } = body;
    // ── LOGIN ──
    if (action === 'login') {
      const { email, password } = body;
      if (!email || !password) {
        return new Response(JSON.stringify({
          error: 'Email and password are required.'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
      const { data: user, error: userErr } = await db.from('sbd_portal_users').select('*, sbd_facilities(name, active, system_id)').eq('email', email.toLowerCase().trim()).eq('active', true).single();
      if (userErr || !user) {
        return new Response(JSON.stringify({
          error: 'Invalid email or password.'
        }), {
          status: 401,
          headers: corsHeaders
        });
      }
      if (user.password_hash && user.password_hash !== password) {
        return new Response(JSON.stringify({
          error: 'Invalid email or password.'
        }), {
          status: 401,
          headers: corsHeaders
        });
      }
      if (user.facility_id && user.sbd_facilities && !user.sbd_facilities.active) {
        return new Response(JSON.stringify({
          error: 'Portal access suspended. Your facility account has been deactivated.'
        }), {
          status: 403,
          headers: corsHeaders
        });
      }
      const sessionToken = crypto.randomUUID();
      await db.from('sbd_portal_users').update({
        last_login_at: new Date().toISOString()
      }).eq('id', user.id);
      await db.from('sbd_activity_log').insert({
        user_id: user.id,
        action: 'login',
        target_type: 'portal_user',
        target_id: user.id,
        details: {
          email: user.email,
          role: user.role
        }
      });
      const portalMap = {
        master_admin: 'admin',
        staff_admin: 'admin',
        hospital: 'hospital',
        system_admin: 'system_admin',
        staff_member: 'staff_member'
      };
      return new Response(JSON.stringify({
        success: true,
        session_token: sessionToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          title: user.title,
          initials: user.initials,
          facility_id: user.facility_id,
          system_id: user.system_id,
          staff_id: user.staff_id,
          assigned_facility_ids: user.assigned_facility_ids
        },
        portal: portalMap[user.role] || 'hospital',
        facility: user.sbd_facilities || null
      }), {
        status: 200,
        headers: corsHeaders
      });
    }
    // ── VALIDATE SESSION ──
    if (action === 'validate') {
      const { session_token } = body;
      if (!session_token) {
        return new Response(JSON.stringify({
          error: 'No session token provided.'
        }), {
          status: 401,
          headers: corsHeaders
        });
      }
      return new Response(JSON.stringify({
        valid: true
      }), {
        status: 200,
        headers: corsHeaders
      });
    }
    // ── REGISTER ──
    if (action === 'register') {
      const { facility_name, location, department, contact_name, contact_email, contact_password } = body;
      if (!facility_name || !location || !department || !contact_name || !contact_email) {
        return new Response(JSON.stringify({
          error: 'All required fields must be filled.'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
      const { data: existing } = await db.from('sbd_portal_users').select('id').eq('email', contact_email.toLowerCase().trim()).maybeSingle();
      if (existing) {
        return new Response(JSON.stringify({
          error: 'An account with this email already exists.'
        }), {
          status: 409,
          headers: corsHeaders
        });
      }
      const { data: existingReg } = await db.from('sbd_pending_registrations').select('id').eq('contact_email', contact_email.toLowerCase().trim()).eq('status', 'pending').maybeSingle();
      if (existingReg) {
        return new Response(JSON.stringify({
          error: 'A registration with this email is already pending review.'
        }), {
          status: 409,
          headers: corsHeaders
        });
      }
      const { error: insertErr } = await db.from('sbd_pending_registrations').insert({
        facility_name,
        location,
        department,
        contact_name,
        contact_email: contact_email.toLowerCase().trim(),
        password_hash: contact_password || null
      });
      if (insertErr) {
        return new Response(JSON.stringify({
          error: 'Registration failed. Please try again.'
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
      // DB triggers automatically queue confirmation email to applicant + notification to admins
      return new Response(JSON.stringify({
        success: true,
        message: 'Registration submitted for review.'
      }), {
        status: 201,
        headers: corsHeaders
      });
    }
    // ── FORGOT PASSWORD (request reset) ──
    if (action === 'forgot_password') {
      const { email } = body;
      if (!email) {
        return new Response(JSON.stringify({
          error: 'Email is required.'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
      const { data: user } = await db.from('sbd_portal_users').select('id, email, name').eq('email', email.toLowerCase().trim()).eq('active', true).maybeSingle();
      // Always return success to prevent email enumeration
      const successMsg = 'If an account exists with that email, a password reset link has been sent.';
      if (!user) {
        return new Response(JSON.stringify({
          success: true,
          message: successMsg
        }), {
          status: 200,
          headers: corsHeaders
        });
      }
      // Invalidate any existing unused tokens for this user
      await db.from('sbd_password_resets').update({
        used: true
      }).eq('user_id', user.id).eq('used', false);
      // Create reset token (DB trigger auto-queues the email)
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour
      await db.from('sbd_password_resets').insert({
        user_id: user.id,
        token,
        expires_at: expiresAt
      });
      await db.from('sbd_activity_log').insert({
        user_id: user.id,
        action: 'password_reset_request',
        target_type: 'portal_user',
        target_id: user.id,
        details: {
          email: user.email
        }
      });
      return new Response(JSON.stringify({
        success: true,
        message: successMsg
      }), {
        status: 200,
        headers: corsHeaders
      });
    }
    // ── RESET PASSWORD (apply with token) ──
    if (action === 'reset_password') {
      const { token, new_password } = body;
      if (!token || !new_password) {
        return new Response(JSON.stringify({
          error: 'Reset token and new password are required.'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
      if (new_password.length < 6) {
        return new Response(JSON.stringify({
          error: 'Password must be at least 6 characters.'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
      // Find valid, unused, unexpired token
      const { data: reset } = await db.from('sbd_password_resets').select('id, user_id, expires_at').eq('token', token).eq('used', false).maybeSingle();
      if (!reset) {
        return new Response(JSON.stringify({
          error: 'Invalid or expired reset link.'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
      if (new Date(reset.expires_at) < new Date()) {
        await db.from('sbd_password_resets').update({
          used: true
        }).eq('id', reset.id);
        return new Response(JSON.stringify({
          error: 'This reset link has expired. Please request a new one.'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
      // Update password and mark token as used
      await db.from('sbd_portal_users').update({
        password_hash: new_password
      }).eq('id', reset.user_id);
      await db.from('sbd_password_resets').update({
        used: true
      }).eq('id', reset.id);
      await db.from('sbd_activity_log').insert({
        user_id: reset.user_id,
        action: 'password_reset',
        target_type: 'portal_user',
        target_id: reset.user_id,
        details: {
          method: 'token'
        }
      });
      return new Response(JSON.stringify({
        success: true,
        message: 'Password updated successfully. You can now sign in.'
      }), {
        status: 200,
        headers: corsHeaders
      });
    }
    // ── CHANGE PASSWORD (authenticated) ──
    if (action === 'change_password') {
      const { current_password, new_password, user_id } = body;
      if (!current_password || !new_password || !user_id) {
        return new Response(JSON.stringify({
          error: 'Current password, new password, and user ID are required.'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
      const { data: user } = await db.from('sbd_portal_users').select('id, password_hash').eq('id', user_id).single();
      if (!user || user.password_hash !== current_password) {
        return new Response(JSON.stringify({
          error: 'Current password is incorrect.'
        }), {
          status: 401,
          headers: corsHeaders
        });
      }
      if (new_password.length < 6) {
        return new Response(JSON.stringify({
          error: 'New password must be at least 6 characters.'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
      await db.from('sbd_portal_users').update({
        password_hash: new_password
      }).eq('id', user_id);
      await db.from('sbd_activity_log').insert({
        user_id,
        action: 'password_change',
        target_type: 'portal_user',
        target_id: user_id,
        details: {
          changed_by: 'user'
        }
      });
      return new Response(JSON.stringify({
        success: true,
        message: 'Password changed successfully.'
      }), {
        status: 200,
        headers: corsHeaders
      });
    }
    return new Response(JSON.stringify({
      error: 'Invalid action. Supported: login, validate, register, forgot_password, reset_password, change_password'
    }), {
      status: 400,
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
