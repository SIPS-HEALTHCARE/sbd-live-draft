import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
const BELT_POINTS = {
  'White': 100,
  'Yellow': 250,
  'Green': 500,
  'Blue': 1000,
  'Brown': 2000,
  'Black': 5000
};
const BELT_ORDER = [
  'White',
  'Yellow',
  'Green',
  'Blue',
  'Brown',
  'Black'
];
const GATE_POINTS = {
  pass: 50,
  fail: -10
};
const STAR_POINTS = 25;
const ATTEND_POINTS = {
  present: 10,
  late: 5,
  absent: -15,
  pto: 0,
  excused: 0,
  coverage: 25
};
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, prefer'
};
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    // Verify the user's JWT
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({
        error: 'Unauthorized'
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 401
      });
    }
    const { staff_id } = await req.json();
    if (!staff_id) return new Response(JSON.stringify({
      error: "staff_id is required"
    }), {
      status: 400
    });
    // 1. Get Staff Data
    const { data: staff, error: staffError } = await supabase.from("staff").select("*").eq("id", staff_id).single();
    if (staffError || !staff) throw new Error("Staff not found");
    // 2. Get Assessment History
    const { data: history, error: historyError } = await supabase.from("staff_history").select("*").eq("staff_id", staff_id);
    // 3. Get Attendance
    const { data: attendance, error: attendError } = await supabase.from("attendance").select("*").eq("staff_id", staff_id);
    // CALCULATE POINTS
    let totalPoints = 0;
    // Belt Base Points
    const bIdx = BELT_ORDER.indexOf(staff.current_belt);
    for(let i = 0; i <= bIdx; i++){
      totalPoints += BELT_POINTS[BELT_ORDER[i]] ?? 0;
    }
    // Gate Points from History
    if (history) {
      history.forEach((h)=>{
        if (h.gate_status === 'Pass') totalPoints += GATE_POINTS.pass;
        if (h.gate_status === 'Fail') totalPoints += GATE_POINTS.fail;
        if (h.star_bonus) totalPoints += h.star_bonus * STAR_POINTS;
      });
    }
    // Attendance Points
    if (attendance) {
      attendance.forEach((a)=>{
        if (a.event_type === 'present') totalPoints += ATTEND_POINTS.present;
        if (a.event_type === 'late') totalPoints += ATTEND_POINTS.late;
        if (a.event_type === 'absent') totalPoints += ATTEND_POINTS.absent;
        if (a.event_type === 'coverage') totalPoints += ATTEND_POINTS.present + ATTEND_POINTS.coverage;
      });
    }
    // Position School
    if (staff.is_done_ps) {
      totalPoints += 200;
    } else if (staff.is_enrolled_ps) {
      totalPoints += 50;
    }
    // Update Cache in Staff Table
    await supabase.from("staff").update({
      points: totalPoints
    }).eq("id", staff_id);
    return new Response(JSON.stringify({
      staff_id,
      points: totalPoints
    }), {
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: err.message
    }), {
      status: 500
    });
  }
});
