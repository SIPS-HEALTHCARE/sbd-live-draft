const fs = require('fs');
const URL = 'https://mhijaqahbceuahfzezbh.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oaWphcWFoYmNldWFoZnplemJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MDkwNzksImV4cCI6MjA4OTM4NTA3OX0.GZcvOFxm4uNdTFPnq-rfwHaMVhWbIJWY7QMYToPa7mQ';
async function run() {
  const res = await fetch(`${URL}/rest/v1/staff?select=id,first,last,role`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }
  });
  const data = await res.json();
  fs.writeFileSync('out.json', JSON.stringify(data, null, 2));
}
run();
