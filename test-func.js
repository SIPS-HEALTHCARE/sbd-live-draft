const https = require('https');
const fs = require('fs');
const content = fs.readFileSync('src/js/api-supabase.js', 'utf8');
const apiUrl = content.match(/const SB_API_URL = '([^']+)'/)[1];
const anonKey = content.match(/const SB_ANON_KEY = '([^']+)'/)[1];

async function run() {
  try {
    const r = await fetch(`${apiUrl}/functions/v1/sbd-sync-user-claims`, {
      method: "OPTIONS",
      headers: { 'apikey': anonKey }
    });
    console.log("CORS headers for sbd-sync-user-claims:", Object.fromEntries(r.headers.entries()));
  } catch(e) {
    console.log("fatal:", e);
  }
}
run();
