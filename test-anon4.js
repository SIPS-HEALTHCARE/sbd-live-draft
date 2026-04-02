const fs = require('fs');
const content = fs.readFileSync('src/js/api-supabase.js', 'utf8');
const apiUrl = content.match(/const SB_API_URL = '([^']+)'/)[1];
const anonKey = content.match(/const SB_ANON_KEY = '([^']+)'/)[1];

async function run() {
  const login = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'izambrano@sipsconsults.com', password: 'Gatorade4!' })
  });
  const tokenData = await login.json();
  const token = tokenData.access_token;
  
  if (!token) return console.error('Login failed', tokenData);

  const rFac = await fetch(`${apiUrl}/rest/v1/facilities`, { 
    headers: { 'apikey': anonKey, 'Authorization': `Bearer ${token}` } 
  });
  const facs = await rFac.json();

  const rSt = await fetch(`${apiUrl}/rest/v1/staff`, { 
    headers: { 'apikey': anonKey, 'Authorization': `Bearer ${token}` } 
  });
  const staffs = await rSt.json();

  console.log('Facilities count:', facs.length);
  console.log('Staff count:', staffs.length);
}
run();
