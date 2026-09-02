// RETIRED 2026-09-02 (#748 / T119 follow-up): deleted from the Supabase deployment, kept here as backup only.
// Do NOT redeploy. Unauthenticated 302 to a public storage copy of the whole app
// (bucket "Belt Intelligence System", index.html, 845 KB, last modified 2026-03-20) that predates
// five months of work. Source was never in the repo before this backup.
// Decision doc: docs/decisions/2026-08-20-t119-retire-orphan-edge-functions.md
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': '*' },
    });
  }

  const baseUrl = Deno.env.get('SUPABASE_URL')!;
  const target = `${baseUrl}/storage/v1/object/public/Belt%20Intelligence%20System/index.html`;

  return new Response(null, {
    status: 302,
    headers: {
      'Location': target,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store',
    },
  });
});
