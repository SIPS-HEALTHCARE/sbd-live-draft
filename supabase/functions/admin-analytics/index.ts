// ============================================================
// EDGE FUNCTION: admin-analytics
// Deploy as: admin-analytics
// Securely retrieves WHEALTHY dashboard metrics.
// Requires header: x-admin-password
// Returns { members: [...], events: [...] }
// ============================================================
import { createClient } from "jsr:@supabase/supabase-js@2";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-admin-password",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
};
Deno.serve(async (req)=>{
  if (req.method === "OPTIONS") return new Response("ok", {
    headers: cors
  });
  try {
    const password = req.headers.get("x-admin-password");
    const expectedPassword = Deno.env.get("ADMIN_PASSWORD") || "whealthy-admin-2026";
    if (!password || password !== expectedPassword) {
      return json({
        error: "Unauthorized"
      }, 401);
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
    // Fetch members
    const { data: members, error: memErr } = await supabase.from("approved_members").select("*").order("joined_at", {
      ascending: false
    });
    if (memErr) throw memErr;
    // Fetch events (limit to last 5000 to keep it highly performant)
    const { data: events, error: evtErr } = await supabase.from("page_events").select("session_id,event_type,event_data,device_type,viewport_width,time_on_page,created_at").order("created_at", {
      ascending: false
    }).limit(5000);
    if (evtErr) throw evtErr;
    return json({
      members: members || [],
      events: events || []
    });
  } catch (err) {
    return json({
      error: String(err)
    }, 500);
  }
});
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...cors,
      "Content-Type": "application/json"
    }
  });
}
