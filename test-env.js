const fs = require('fs');
const content = fs.readFileSync('src/js/api-supabase.js', 'utf8');
const apiUrl = content.match(/const SB_API_URL = '([^']+)'/)[1];
const anonKey = content.match(/const SB_ANON_KEY = '([^']+)'/)[1];

async function run() {
  try {
    const login = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'apikey': anonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'jjacobs@sipsconsults.com', password: 'Gatorade4!' })
    });
    const d = await login.json();
    
    const r = await fetch(`${apiUrl}/functions/v1/sbd-sync-user-claims`, {
      method: "POST",
      headers: { 'apikey': anonKey, 'Authorization': `Bearer ${d.access_token}` },
      body: JSON.stringify({})
    });
    console.log(await r.text());
  } catch(e) {
    console.log("fatal:", e);
  }
}
run();
