require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: facs } = await sb.from('facilities').select('*');
  console.log("Facilities:", facs.map(f => ({ id: f.id, name: f.name })));

  const { data: staff } = await sb.from('staff').select('id, facility_id, first_name, last_name').limit(10);
  console.log("Sample Staff:", staff);
}
run();
