import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, prefer'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    // Verify the user's JWT
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({
        error: 'Unauthorized'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 401
      });
    }
    // Role-based access control (RBAC)
    const role = user.user_metadata?.role || '';
    const isMasterAdmin = role === 'master_admin' || role === 'sips_master_admin';
    const isSipsAdmin = role === 'sips_admin' || role === 'staff_admin';
    const isSystemAdmin = role === 'system_admin';
    const isHospital = role === 'hospital';
    if (!isMasterAdmin && !isSipsAdmin && !isSystemAdmin && !isHospital) {
      return new Response(JSON.stringify({
        error: 'Forbidden: Admin access required'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 403
      });
    }
    const payload = await req.json();
    // ── ACTION: delete user ──
    if (payload.action === 'delete') {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(payload.userId);
      if (error) throw error;
      return new Response(JSON.stringify({
        success: true
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      });
    }
    // ── ACTION: create_facility (atomic: facility + auth user + portal user) ──
    if (payload.action === 'create_facility') {
      const { facility, portalUser } = payload;
      // 1. Insert facility
      const { data: facRows, error: facErr } = await supabaseAdmin.from('sbd_facilities').insert(facility).select();
      if (facErr) throw facErr;
      const savedFacility = facRows[0];
      let savedPortalUser = null;
      if (portalUser && portalUser.email && portalUser.password) {
        // 2. Create auth user
        const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
          email: portalUser.email,
          password: portalUser.password,
          email_confirm: true,
          user_metadata: {
            role: 'hospital'
          }
        });
        // If user already exists, don't fail the whole operation
        const authUid = authData?.user?.id ?? null;
        // 3. Insert portal user record
        const { data: puRows, error: puErr } = await supabaseAdmin.from('sbd_portal_users').insert({
          auth_uid: authUid,
          email: portalUser.email,
          role: 'hospital',
          name: portalUser.name,
          title: portalUser.title || 'Dept. Manager',
          initials: portalUser.initials,
          facility_id: savedFacility.id,
          active: true
        }).select();
        if (puErr) console.error('Portal user insert error (non-fatal):', puErr.message);
        savedPortalUser = puRows?.[0] ?? null;
      }
      return new Response(JSON.stringify({
        success: true,
        facility: savedFacility,
        portalUser: savedPortalUser
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      });
    }
    // ── ACTION: create auth user only (legacy path) ──
    if (!payload.email) {
      throw new Error('Missing required field: email');
    }
    let newUser, createAuthError;
    if (payload.isInvite) {
      const resp = await supabaseAdmin.auth.admin.inviteUserByEmail(payload.email, {
        data: {
          role: payload.level || payload.role || 'staff_member'
        },
        redirectTo: `${Deno.env.get('SUPABASE_URL')?.replace('https://', 'https://belt.sterilebydesign.ai') || 'https://belt.sterilebydesign.ai'}/`
      });
      newUser = resp.data;
      createAuthError = resp.error;
    } else {
      if (!payload.password) throw new Error('Missing password for direct creation');
      const resp = await supabaseAdmin.auth.admin.createUser({
        email: payload.email,
        password: payload.password,
        email_confirm: true,
        user_metadata: {
          role: payload.level || payload.role || 'staff_member'
        }
      });
      newUser = resp.data;
      createAuthError = resp.error;
    }
    if (createAuthError) {
      if (createAuthError.message.includes('User already registered')) {
        return new Response(JSON.stringify({
          success: true,
          msg: 'User exists'
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 200
        });
      }
      throw createAuthError;
    }
    return new Response(JSON.stringify({
      success: true,
      user: newUser.user
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({
      error: msg
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 400
    });
  }
});
