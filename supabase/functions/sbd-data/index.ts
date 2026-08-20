import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sbd-user-id',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
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
    const userId = req.headers.get('x-sbd-user-id');
    if (!userId) {
      return new Response(JSON.stringify({
        error: 'Authentication required.'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }
    const { data: caller } = await db.from('sbd_portal_users').select('*').eq('id', userId).single();
    if (!caller) {
      return new Response(JSON.stringify({
        error: 'User not found.'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }
    const body = req.method === 'POST' ? await req.json() : {};
    const url = new URL(req.url);
    const query = body.query || url.searchParams.get('q') || '';
    // Helper: get visible facility IDs for this user
    async function getVisibleFacilityIds() {
      if (caller.role === 'master_admin' || caller.role === 'staff_admin') {
        if (caller.role === 'staff_admin' && caller.assigned_facility_ids?.length) {
          return caller.assigned_facility_ids;
        }
        return null; // null = all
      }
      if (caller.role === 'system_admin') {
        const { data: facs } = await db.from('sbd_facilities').select('id').eq('system_id', caller.system_id);
        return facs ? facs.map((f)=>f.id) : [];
      }
      if (caller.role === 'hospital') return caller.facility_id ? [
        caller.facility_id
      ] : [];
      if (caller.role === 'staff_member') return caller.facility_id ? [
        caller.facility_id
      ] : [];
      return [];
    }
    // STAFF LIST
    if (query === 'staff') {
      const facilityId = body.facility_id;
      let q = db.from('sbd_staff').select('*').eq('active', true);
      if (facilityId) q = q.eq('facility_id', facilityId);
      else if (caller.role === 'hospital') q = q.eq('facility_id', caller.facility_id);
      else if (caller.role === 'staff_member') q = q.eq('facility_id', caller.facility_id);
      else if (caller.role === 'system_admin') {
        const { data: facs } = await db.from('sbd_facilities').select('id').eq('system_id', caller.system_id);
        if (facs) q = q.in('facility_id', facs.map((f)=>f.id));
      }
      const { data, error } = await q.order('id');
      if (error) return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 500,
        headers: corsHeaders
      });
      return new Response(JSON.stringify(data), {
        headers: corsHeaders
      });
    }
    // SINGLE STAFF
    if (query === 'staff_detail') {
      const { data, error } = await db.from('sbd_staff').select('*').eq('id', body.staff_id).single();
      if (error) return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 404,
        headers: corsHeaders
      });
      return new Response(JSON.stringify(data), {
        headers: corsHeaders
      });
    }
    // STAFF HISTORY (single staff)
    if (query === 'staff_history') {
      const { data, error } = await db.from('sbd_assessment_history').select('*').eq('staff_id', body.staff_id).order('assessed_at', {
        ascending: false
      });
      if (error) return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 500,
        headers: corsHeaders
      });
      return new Response(JSON.stringify(data), {
        headers: corsHeaders
      });
    }
    // ALL HISTORY (bulk load for all visible staff)
    if (query === 'all_history') {
      const facIds = await getVisibleFacilityIds();
      let q = db.from('sbd_assessment_history').select('staff_id, facility_id, assessment_type, target_belt, result, assessed_at');
      if (facIds !== null) q = q.in('facility_id', facIds);
      const { data, error } = await q.order('assessed_at', {
        ascending: false
      });
      if (error) return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 500,
        headers: corsHeaders
      });
      return new Response(JSON.stringify(data), {
        headers: corsHeaders
      });
    }
    // STAFF POINTS
    if (query === 'staff_points') {
      const { data, error } = await db.rpc('sbd_calc_points', {
        p_staff_id: body.staff_id
      });
      if (error) return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 500,
        headers: corsHeaders
      });
      return new Response(JSON.stringify({
        points: data
      }), {
        headers: corsHeaders
      });
    }
    // FACILITIES
    if (query === 'facilities') {
      let q = db.from('sbd_facilities').select('*').eq('active', true);
      if (caller.role === 'hospital') q = q.eq('id', caller.facility_id);
      else if (caller.role === 'system_admin') q = q.eq('system_id', caller.system_id);
      const { data, error } = await q.order('name');
      if (error) return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 500,
        headers: corsHeaders
      });
      return new Response(JSON.stringify(data), {
        headers: corsHeaders
      });
    }
    // SINGLE FACILITY
    if (query === 'facility_detail') {
      const { data, error } = await db.from('sbd_facilities').select('*, sbd_hospital_systems(name, contact_name)').eq('id', body.facility_id).single();
      if (error) return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 404,
        headers: corsHeaders
      });
      return new Response(JSON.stringify(data), {
        headers: corsHeaders
      });
    }
    // ASSESSMENT QUEUE
    if (query === 'queue') {
      let q = db.from('sbd_assessment_queue').select('*, sbd_staff(first_name, last_name, belt, role, facility_id)').eq('status', 'pending');
      if (body.facility_id) q = q.eq('facility_id', body.facility_id);
      const { data, error } = await q.order('requested_date', {
        ascending: false
      });
      if (error) return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 500,
        headers: corsHeaders
      });
      return new Response(JSON.stringify(data), {
        headers: corsHeaders
      });
    }
    // PENDING REGISTRATIONS
    if (query === 'registrations') {
      if (caller.role !== 'master_admin') {
        return new Response(JSON.stringify({
          error: 'Admin access required.'
        }), {
          status: 403,
          headers: corsHeaders
        });
      }
      const { data, error } = await db.from('sbd_pending_registrations').select('*').order('requested_at', {
        ascending: false
      });
      if (error) return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 500,
        headers: corsHeaders
      });
      return new Response(JSON.stringify(data), {
        headers: corsHeaders
      });
    }
    // FACILITY TRENDS
    if (query === 'trends') {
      let q = db.from('sbd_facility_trends').select('*');
      if (body.facility_id) q = q.eq('facility_id', body.facility_id);
      if (body.year) q = q.eq('year', body.year);
      const { data, error } = await q.order('year').order('month_index');
      if (error) return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 500,
        headers: corsHeaders
      });
      return new Response(JSON.stringify(data), {
        headers: corsHeaders
      });
    }
    // NETWORK STATS
    if (query === 'network_stats') {
      let facilityIds = null;
      if (caller.role === 'system_admin') {
        const { data: facs } = await db.from('sbd_facilities').select('id').eq('system_id', caller.system_id);
        if (facs) facilityIds = facs.map((f)=>f.id);
      } else if (caller.role === 'staff_admin' && caller.assigned_facility_ids?.length) {
        facilityIds = caller.assigned_facility_ids;
      }
      const { data, error } = await db.rpc('sbd_network_stats', {
        p_facility_ids: facilityIds
      });
      if (error) return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 500,
        headers: corsHeaders
      });
      return new Response(JSON.stringify(data), {
        headers: corsHeaders
      });
    }
    // PORTAL USERS (admin only)
    if (query === 'portal_users') {
      if (![
        'master_admin',
        'staff_admin'
      ].includes(caller.role)) {
        return new Response(JSON.stringify({
          error: 'Admin access required.'
        }), {
          status: 403,
          headers: corsHeaders
        });
      }
      const { data, error } = await db.from('sbd_portal_users').select('id, email, role, name, title, initials, facility_id, system_id, staff_id, assigned_facility_ids, active, last_login_at, created_at').order('name');
      if (error) return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 500,
        headers: corsHeaders
      });
      return new Response(JSON.stringify(data), {
        headers: corsHeaders
      });
    }
    // HOSPITAL SYSTEMS
    if (query === 'systems') {
      const { data, error } = await db.from('sbd_hospital_systems').select('*').order('name');
      if (error) return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 500,
        headers: corsHeaders
      });
      return new Response(JSON.stringify(data), {
        headers: corsHeaders
      });
    }
    // ACTIVITY LOG
    if (query === 'activity_log') {
      if (![
        'master_admin',
        'staff_admin'
      ].includes(caller.role)) {
        return new Response(JSON.stringify({
          error: 'Admin access required.'
        }), {
          status: 403,
          headers: corsHeaders
        });
      }
      const { data, error } = await db.from('sbd_activity_log').select('*').order('created_at', {
        ascending: false
      }).limit(body.limit || 50);
      if (error) return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 500,
        headers: corsHeaders
      });
      return new Response(JSON.stringify(data), {
        headers: corsHeaders
      });
    }
    return new Response(JSON.stringify({
      error: 'Unknown query type.',
      available: [
        'staff',
        'staff_detail',
        'staff_history',
        'all_history',
        'staff_points',
        'facilities',
        'facility_detail',
        'queue',
        'registrations',
        'trends',
        'network_stats',
        'portal_users',
        'systems',
        'activity_log'
      ]
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
