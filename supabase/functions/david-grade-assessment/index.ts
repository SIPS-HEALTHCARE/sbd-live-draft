import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// RETIRED (#61). Orphaned duplicate of sbd-score-assessment with zero callers.
// Logic removed and replaced with this inert stub. Delete the function entry from
// the Supabase dashboard when convenient (cosmetic; nothing calls this).
Deno.serve(()=>new Response(JSON.stringify({
    error: "gone",
    message: "david-grade-assessment has been retired (#61) and is no longer available."
  }), {
    status: 410,
    headers: {
      "Content-Type": "application/json"
    }
  }));
