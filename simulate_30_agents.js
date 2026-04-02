const supabaseUrl = 'https://mhijaqahbceuahfzezbh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oaWphcWFoYmNldWFoZnplemJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MDkwNzksImV4cCI6MjA4OTM4NTA3OX0.GZcvOFxm4uNdTFPnq-rfwHaMVhWbIJWY7QMYToPa7mQ';

async function runSimulation() {
  console.log('🚀 Starting 30-Agent Simulation Test via API...');
  
  // 1. Authenticate with an existing Master Admin account
  console.log('1️⃣  Authenticating as Master Admin (izambrano@sipsconsults.com)...');
  const authRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey },
    body: JSON.stringify({ email: 'izambrano@sipsconsults.com', password: 'Gatorade4!' })
  });

  const authData = await authRes.json();
  if (!authRes.ok) {
    console.error('❌ Authentication failed:', authData);
    process.exit(1);
  }

  const accessToken = authData.access_token;
  console.log(`✅ Successfully logged in as ${authData.user.id}`);

  // 2. Generate 30 distinct agents
  console.log('2️⃣  Generating 30 agent payloads...');
  const belts = ['White', 'Yellow', 'Green', 'Blue', 'Brown', 'Black'];
  const payload = [];
  for (let i = 1; i <= 30; i++) {
    payload.push({
      facilityName: 'Simulation Hospital ' + (Math.floor(Math.random() * 3) + 1),
      first: 'Agent',
      last: 'Test-' + Date.now() + '-' + i,
      role: i % 5 === 0 ? 'master_admin' : 'SPD Tech',
      belt: belts[Math.floor(Math.random() * belts.length)],
      since: new Date().toISOString()
    });
  }

  // 3. Post to the bulk-upload-staff Edge Function
  console.log('3️⃣  Sending bulk upload request to Edge Function...');
  try {
    const fnRes = await fetch(`${supabaseUrl}/functions/v1/bulk-upload-staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ payload })
    });
    
    // Check Content-Type to safely parse JSON or text
    const contentType = fnRes.headers.get('content-type');
    let fnData;
    if (contentType && contentType.includes('application/json')) {
       fnData = await fnRes.json();
    } else {
       const text = await fnRes.text();
       console.error('❌ Expected JSON but got text:', text);
       process.exit(1);
    }

    if (!fnRes.ok) {
      console.error(`❌ Edge Function returned HTTP ${fnRes.status}:`, fnData);
      process.exit(1);
    }

    console.log('✅ Simulation successful!');
    console.log('Server Response:', JSON.stringify(fnData, null, 2));

  } catch (err) {
    console.error('❌ Network error during simulation:', err.message);
  }
}

runSimulation();
