const fs = require('fs');
const content = fs.readFileSync('src/js/api-supabase.js', 'utf8');
const apiUrlMatch = content.match(/const SB_API_URL = '([^']+)'/);
const anonKeyMatch = content.match(/const SB_ANON_KEY = '([^']+)'/);
const apiUrl = apiUrlMatch[1];
const anonKey = anonKeyMatch[1];

async function run() {
  // 1. login 
  const loginRes = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'jjacobs@sipsconsults.com', password: 'SBDUser2024!' })
  });
  const loginData = await loginRes.json();
  const token = loginData.access_token;
  console.log("Logged in. Token prefix:", token ? token.substring(0, 10) : "failed");

  // 2. Fetch users
  const usersRes = await fetch(`${apiUrl}/rest/v1/sbd_portal_users?select=*&order=name.asc`, {
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${token}`
    }
  });
  console.log("Users status:", usersRes.status, usersRes.statusText);
  const text = await usersRes.text();
  console.log("Users response:", text.substring(0, 200));
}
run().catch(console.error);
