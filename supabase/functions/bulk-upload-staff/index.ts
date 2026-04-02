import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, prefer',
}

serve(async (req) => {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error("Missing authorization header")
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authErr } = await supabaseClient.auth.getUser()
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', detail: authErr?.message }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Require specific roles for bulk imports
    const { data: profile } = await supabaseClient.from('sbd_portal_users').select('role').eq('auth_uid', user.id).single()
    const role = profile?.role || 'staff_member';
    if (!['master_admin', 'system_admin', 'staff_admin', 'hospital'].includes(role)) {
       return new Response(JSON.stringify({ error: 'Forbidden', detail: 'Role insufficient for bulk imports.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 2. Parse Payload
    const res = await req.json()
    const items = res.payload || []

    if (!Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: 'Bad Request', detail: 'Empty or invalid payload array.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 3. Resolve Facilities
    const { data: facilitiesMap, error: facErr } = await supabaseAdmin.from('facilities').select('id, name')
    if (facErr) throw facErr;

    const facLookup = new Map<string, string>();
    facilitiesMap?.forEach(f => facLookup.set(f.name.toLowerCase(), f.id))

    const newFacilitiesToCreate = new Set<string>();
    items.forEach((item: any) => {
      const facName = String(item.facilityName || 'Unknown Facility').trim()
      if (!facLookup.has(facName.toLowerCase())) {
        newFacilitiesToCreate.add(facName)
      }
    })

    // 4. Create missing facilities
    if (newFacilitiesToCreate.size > 0) {
      const inserts = Array.from(newFacilitiesToCreate).map(name => ({
        name: name,
        loc: 'Pending Region',
        dept: 'Sterile Processing',
        contact: 'Admin',
        email: `contact_${Date.now()}_${Math.floor(Math.random()*1000)}@${name.replace(/\s+/g,'').toLowerCase()}.local`
      }))

      const { data: insertedFacs, error: insertErr } = await supabaseAdmin.from('facilities').insert(inserts).select('id, name')
      if (insertErr) throw insertErr;

      insertedFacs?.forEach(f => {
         facLookup.set(f.name.toLowerCase(), f.id)
      })
    }

    // 5. Build Staff Operations
    const validBelts = ['White','Yellow','Green','Blue','Brown','Black']
    
    const recordsToInsert: any[] = [];
    const errors: Array<{ row: number, name: string, reason: string }> = [];

    items.forEach((item: any, idx: number) => {
      try {
        const facName = String(item.facilityName || 'Unknown Facility').trim()
        const fid = facLookup.get(facName.toLowerCase())
        if (!fid) throw new Error(`Could not resolve or create facility: ${facName}`)

        const beltRaw = String(item.belt || 'White').trim()
        const beltTitle = beltRaw.charAt(0).toUpperCase() + beltRaw.slice(1).toLowerCase()
        if (!validBelts.includes(beltTitle)) throw new Error(`Invalid belt: ${beltTitle}`)

        const first = String(item.first || '').trim()
        const last = String(item.last || '').trim()
        if (!first || !last) throw new Error("First and Last name required.")

        const dateSince = item.since ? String(item.since).trim() : null;

        recordsToInsert.push({
          fid: fid,
          first: first,
          last: last,
          role: String(item.role || 'SPD Tech').trim(),
          belt: beltTitle,
          since: dateSince ? new Date(dateSince).toISOString().split('T')[0] : null
        })
      } catch (err: any) {
        errors.push({ row: idx + 1, name: `${item.first || ''} ${item.last || ''}`, reason: err.message })
      }
    });

    // 6. Execute Bulk Insert
    let successCount = 0;
    if (recordsToInsert.length > 0) {
      const { data: inserted, error: staffInsertErr } = await supabaseAdmin.from('staff').insert(recordsToInsert).select('id')
      if (staffInsertErr) {
        return new Response(JSON.stringify({ 
          successCount: 0, 
          failureCount: items.length, 
          errors: [{ row: 0, name: 'Batch Insert', reason: staffInsertErr.message }] 
        }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      successCount = inserted?.length || 0;
    }

    return new Response(JSON.stringify({ 
      successCount,
      failureCount: errors.length,
      errors
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
