const fs = require('fs');
const content = fs.readFileSync('src/js/api-supabase.js', 'utf8');
const apiUrl = content.match(/const SB_API_URL = '([^']+)'/)[1];
const anonKey = content.match(/const SB_ANON_KEY = '([^']+)'/)[1];

async function run() {
  const authRes = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': anonKey },
    body: JSON.stringify({ email: 'izambrano@sipsconsults.com', password: 'Gatorade4!' })
  });

  const authData = await authRes.json();
  const accessToken = authData.access_token;
  console.log("Logged in. Access Token prefix length:", accessToken.length);

  const rFac = await fetch(`${apiUrl}/rest/v1/facilities`, { 
    headers: { 'apikey': anonKey, 'Authorization': `Bearer ${accessToken}` } 
  });
  const facs = await rFac.json();

  const rSt = await fetch(`${apiUrl}/rest/v1/staff`, { 
    headers: { 'apikey': anonKey, 'Authorization': `Bearer ${accessToken}` } 
  });
  const staffs = await rSt.json();

  console.log('Facilities count from API:', facs.length);
  console.log('Staff count from API:', staffs.length);
}
run();
