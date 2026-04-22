import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    // Use regular client for auth verification
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Verify User Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', details: authError }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. We use the service_role key to perform administrative database operations
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    // 3. Verify Master Admin role
    const { data: profile } = await adminSupabase
      .from('sbd_portal_users')
      .select('id, role')
      .eq('auth_uid', user.id)
      .single();

    if (!profile || profile.role !== 'master_admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Master Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse the payload action
    const { action, payload } = await req.json();

    if (action === 'TOGGLE_FACILITY') {
      const { facilityId, isActive } = payload;
      console.log(`[DAVID_ADMIN_API] TOGGLE_FACILITY: ${facilityId} → ${isActive}`);

      // Check if row exists first
      const { data: existing } = await adminSupabase
        .from('david_facility_access')
        .select('*')
        .eq('facility_id', facilityId)
        .maybeSingle();

      let data, error;
      if (existing) {
        // Update only is_active, preserve tier and other fields
        ({ data, error } = await adminSupabase
          .from('david_facility_access')
          .update({ is_active: isActive, updated_at: new Date().toISOString() })
          .eq('facility_id', facilityId)
          .select()
          .single());
      } else {
        // Insert new row with safe defaults
        ({ data, error } = await adminSupabase
          .from('david_facility_access')
          .insert({ facility_id: facilityId, is_active: isActive, tier: 'base', updated_at: new Date().toISOString() })
          .select()
          .single());
      }

      if (error) {
        console.error('[DAVID_ADMIN_API] TOGGLE error:', JSON.stringify(error));
        throw error;
      }

      console.log('[DAVID_ADMIN_API] TOGGLE success:', JSON.stringify(data));
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'UPDATE_TIER') {
      const { facilityId, tier } = payload;
      console.log(`[DAVID_ADMIN_API] UPDATE_TIER: ${facilityId} → ${tier}`);

      // Check if row exists first
      const { data: existing } = await adminSupabase
        .from('david_facility_access')
        .select('*')
        .eq('facility_id', facilityId)
        .maybeSingle();

      let data, error;
      if (existing) {
        // Update only tier, preserve is_active and other fields
        ({ data, error } = await adminSupabase
          .from('david_facility_access')
          .update({ tier: tier, updated_at: new Date().toISOString() })
          .eq('facility_id', facilityId)
          .select()
          .single());
      } else {
        // Insert new row with safe defaults
        ({ data, error } = await adminSupabase
          .from('david_facility_access')
          .insert({ facility_id: facilityId, is_active: false, tier: tier, updated_at: new Date().toISOString() })
          .select()
          .single());
      }

      if (error) {
        console.error('[DAVID_ADMIN_API] TIER error:', JSON.stringify(error));
        throw error;
      }

      console.log('[DAVID_ADMIN_API] TIER success:', JSON.stringify(data));
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'GET_METRICS') {
      const { data: analytics, error: aErr } = await adminSupabase
        .from('david_analytics_summary')
        .select('*');
      if (aErr) throw aErr;

      const { data: access, error: accErr } = await adminSupabase
        .from('david_facility_access')
        .select('*');
      if (accErr) throw accErr;

      return new Response(JSON.stringify({ success: true, data: { analytics, access } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'GET_FACILITY_USERS') {
      const { facilityId } = payload;
      console.log(`[DAVID_ADMIN_API] GET_FACILITY_USERS: ${facilityId}`);

      // Get all portal users assigned to this facility
      const { data: users, error: uErr } = await adminSupabase
        .from('sbd_portal_users')
        .select('id, name, email, role, title')
        .or(`facility_id.eq.${facilityId},assigned_facility_ids.cs.{${facilityId}}`)
        .order('name');
      if (uErr) throw uErr;

      // Get their DAVID access status
      const { data: userAccess, error: uaErr } = await adminSupabase
        .from('david_user_access')
        .select('*')
        .eq('facility_id', facilityId);
      if (uaErr) throw uaErr;

      const accessMap: Record<string, any> = {};
      (userAccess || []).forEach((ua: any) => { accessMap[ua.user_id] = ua; });

      const result = (users || []).map((u: any) => ({
        ...u,
        david_active: accessMap[u.id]?.is_active || false,
        david_granted_at: accessMap[u.id]?.granted_at || null,
      }));

      return new Response(JSON.stringify({ success: true, data: result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'TOGGLE_USER_ACCESS') {
      const { userId, facilityId, isActive } = payload;
      console.log(`[DAVID_ADMIN_API] TOGGLE_USER_ACCESS: user=${userId} fac=${facilityId} → ${isActive}`);

      const { data: existing } = await adminSupabase
        .from('david_user_access')
        .select('*')
        .eq('user_id', userId)
        .eq('facility_id', facilityId)
        .maybeSingle();

      let data, error;
      if (existing) {
        ({ data, error } = await adminSupabase
          .from('david_user_access')
          .update({ is_active: isActive, updated_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('facility_id', facilityId)
          .select()
          .single());
      } else {
        ({ data, error } = await adminSupabase
          .from('david_user_access')
          .insert({
            user_id: userId,
            facility_id: facilityId,
            is_active: isActive,
            granted_by: profile.id,
            granted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single());
      }

      if (error) {
        console.error('[DAVID_ADMIN_API] USER_ACCESS error:', JSON.stringify(error));
        throw error;
      }

      console.log('[DAVID_ADMIN_API] USER_ACCESS success:', JSON.stringify(data));
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action provided.');

  } catch (error: any) {
    console.error('[DAVID_ADMIN_API] Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
