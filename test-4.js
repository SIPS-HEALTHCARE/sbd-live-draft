const fs = require('fs');
const content = fs.readFileSync('src/js/api-supabase.js', 'utf8');
const apiUrl = content.match(/const SB_API_URL = '([^']+)'/)[1];
const anonKey = content.match(/const SB_ANON_KEY = '([^']+)'/)[1];

async function run() {
  const login = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'jjacobs@sipsconsults.com', password: 'Gatorade4!' })
  });
  const data = await login.json();
  const res = await fetch(`${apiUrl}/rest/v1/sbd_portal_users`, {
    headers: { 'apikey': anonKey, 'Authorization': `Bearer ${data.access_token}` }
  });
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Result Length:", text.length);
  if (text.length > 50) {
    console.log("Start:", text.substring(0, 100));
  }
}
run();
