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
    if (!d.access_token) return console.log("login fail", d);

    const r = await fetch(`${apiUrl}/rest/v1/sbd_portal_users`, {
      headers: { 'apikey': anonKey, 'Authorization': `Bearer ${d.access_token}` }
    });
    console.log(r.status, await r.text());
  } catch(e){
    console.log("fatal:", e);
  }
}
run();
