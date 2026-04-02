const supabaseUrl = 'https://mhijaqahbceuahfzezbh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oaWphcWFoYmNldWFoZnplemJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MDkwNzksImV4cCI6MjA4OTM4NTA3OX0.GZcvOFxm4uNdTFPnq-rfwHaMVhWbIJWY7QMYToPa7mQ';

const credentials = [
  { email: 'jjacobs@sipsconsults.com', password: '11GodsGrace!' },
  { email: 'izambrano@sipsconsults.com', password: 'Gatorade4!' },
  { email: 'dpayne@sipsconsults.com', password: 'Jackpot15!' }
];

async function checkLogin() {
  for (const cred of credentials) {
     console.log(`\nTrying ${cred.email}...`);
     try {
       const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'apikey': supabaseKey
         },
         body: JSON.stringify({ email: cred.email, password: cred.password })
       });
       
       const data = await res.json();
       if (!res.ok) {
          console.error(`  -> Failed: HTTP ${res.status} - ${data.error_description || data.msg || JSON.stringify(data)}`);
       } else {
          console.log(`  -> SUCCESS! Logged in as ${data.user.id}`);
       }
     } catch(e) {
       console.error(`  -> Network error: ${e.message}`);
     }
  }
}

checkLogin();
