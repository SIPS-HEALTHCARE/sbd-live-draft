import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sbd-session, x-sbd-user-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};
function parseCSV(csv) {
  const lines = csv.trim().split('\n').map((l)=>l.trim()).filter((l)=>l.length > 0);
  if (lines.length < 2) return {
    headers: [],
    rows: []
  };
  const headers = lines[0].split(',').map((h)=>h.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'));
  const rows = lines.slice(1).map((line)=>{
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const char of line){
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  });
  return {
    headers,
    rows
  };
}
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
    // Validate caller role
    const userId = req.headers.get('x-sbd-user-id');
    if (!userId) {
      return new Response(JSON.stringify({
        error: 'Authentication required.'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }
    const { data: caller } = await db.from('sbd_portal_users').select('id, role, name, assigned_facility_ids').eq('id', userId).single();
    if (!caller || ![
      'master_admin',
      'staff_admin'
    ].includes(caller.role)) {
      return new Response(JSON.stringify({
        error: 'Only SIPS admins can bulk upload staff.'
      }), {
        status: 403,
        headers: corsHeaders
      });
    }
    const body = await req.json();
    const { csv_data, facility_id } = body;
    if (!csv_data || !facility_id) {
      return new Response(JSON.stringify({
        error: 'CSV data and facility_id are required.'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    // Verify facility exists
    const { data: facility } = await db.from('sbd_facilities').select('id, name').eq('id', facility_id).single();
    if (!facility) {
      return new Response(JSON.stringify({
        error: 'Facility not found.'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }
    // For staff_admin, verify they have access to this facility
    if (caller.role === 'staff_admin' && caller.assigned_facility_ids && !caller.assigned_facility_ids.includes(facility_id)) {
      return new Response(JSON.stringify({
        error: 'You are not assigned to this facility.'
      }), {
        status: 403,
        headers: corsHeaders
      });
    }
    // Parse CSV
    const { headers, rows } = parseCSV(csv_data);
    if (rows.length === 0) {
      return new Response(JSON.stringify({
        error: 'No data rows found in CSV.'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    // Map columns
    const firstIdx = headers.indexOf('first_name') !== -1 ? headers.indexOf('first_name') : headers.indexOf('first');
    const lastIdx = headers.indexOf('last_name') !== -1 ? headers.indexOf('last_name') : headers.indexOf('last');
    const roleIdx = headers.indexOf('role') !== -1 ? headers.indexOf('role') : headers.indexOf('title');
    const beltIdx = headers.indexOf('belt');
    if (firstIdx === -1 || lastIdx === -1 || roleIdx === -1) {
      return new Response(JSON.stringify({
        error: 'CSV must include columns: first_name (or first), last_name (or last), role (or title). Optional: belt.',
        found_headers: headers
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    // Build staff records
    const staffRecords = rows.map((row, i)=>({
        facility_id,
        first_name: row[firstIdx] || '',
        last_name: row[lastIdx] || '',
        role: row[roleIdx] || 'SPD Technician I',
        belt: beltIdx !== -1 && row[beltIdx] ? row[beltIdx] : 'White',
        belt_since: new Date().toISOString().split('T')[0],
        stars: 0,
        ps_enrolled: false,
        ps_done: false,
        ps_track: '',
        ps_module: '',
        promo_recommended: false
      })).filter((s)=>s.first_name && s.last_name);
    if (staffRecords.length === 0) {
      return new Response(JSON.stringify({
        error: 'No valid staff records found after parsing.'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    // Use bulk insert RPC
    const { data: result, error: rpcErr } = await db.rpc('sbd_bulk_insert_staff', {
      p_staff: JSON.stringify(staffRecords)
    });
    if (rpcErr) {
      return new Response(JSON.stringify({
        error: 'Bulk insert failed.',
        detail: rpcErr.message
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
    // Log activity
    await db.from('sbd_activity_log').insert({
      user_id: caller.id,
      action: 'bulk_upload',
      target_type: 'facility',
      target_id: facility_id,
      details: {
        facility_name: facility.name,
        records_submitted: staffRecords.length,
        result,
        uploaded_by: caller.name
      }
    });
    return new Response(JSON.stringify({
      success: true,
      facility_id,
      facility_name: facility.name,
      submitted: staffRecords.length,
      result
    }), {
      status: 200,
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
