const { createClient } = require('@supabase/supabase-js');

// Configuration
// Make sure to replace these with your SEPARATE TESTING DATABASE URL and SERVICE ROLE KEY
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_TEST_DB_URL';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_TEST_SERVICE_ROLE_KEY';

if (SUPABASE_URL === 'YOUR_TEST_DB_URL' || SUPABASE_SERVICE_ROLE_KEY === 'YOUR_TEST_SERVICE_ROLE_KEY') {
  console.error('[!] Error: Please set your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the script or environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const DEFAULT_PASSWORD = 'SBDTestLive25!';

// ==========================================
// 1. Core Top-Level IDs
// ==========================================
const TEST_SYSTEM_1_ID = '00000000-0000-0000-0000-000000000010'; // Omega Health
const TEST_SYSTEM_2_ID = '00000000-0000-0000-0000-000000000020'; // Titan Care

const TEST_FACILITY_O1 = '11111111-1111-1111-1111-111111111111'; // Omega Hospital 1
const TEST_FACILITY_O2 = '22222222-2222-2222-2222-222222222222'; // Omega Hospital 2
const TEST_FACILITY_O3 = '33333333-3333-3333-3333-333333333333'; // Omega Clinic

const TEST_FACILITY_T1 = '44444444-4444-4444-4444-444444444444'; // Titan Hospital
const TEST_FACILITY_T2 = '55555555-5555-5555-5555-555555555555'; // Titan SurgiCenter

const TEST_FACILITY_IND = '66666666-6666-6666-6666-666666666666'; // Independent Facility

// ==========================================
// 2. The 30 Agent Matrix Blueprint
// ==========================================
const agents = [
  // --- Tier 1: Master Control Realm ---
  { idx: 1, email: 'agent01_master@test-sbd.com', role: 'master_admin', system: null, facility: null },
  { idx: 2, email: 'agent02_master@test-sbd.com', role: 'master_admin', system: null, facility: null },

  // --- Tier 2: Hospital System Layer ---
  { idx: 3, email: 'agent03_sysadmin_omega@test-sbd.com', role: 'system_admin', system: TEST_SYSTEM_1_ID, facility: null },
  { idx: 4, email: 'agent04_sysadmin_titan@test-sbd.com', role: 'system_admin', system: TEST_SYSTEM_2_ID, facility: null },
  { idx: 5, email: 'agent05_sysadmin_asst@test-sbd.com', role: 'system_admin', system: TEST_SYSTEM_1_ID, facility: null },
  { idx: 6, email: 'agent06_sysadmin_rogue@test-sbd.com', role: 'system_admin', system: TEST_SYSTEM_1_ID, facility: null }, // Valid Omega, tries Titan later

  // --- Tier 3: Facility Operations Layer ---
  { idx: 7, email: 'agent07_manager_o1@test-sbd.com', role: 'manager', system: TEST_SYSTEM_1_ID, facility: TEST_FACILITY_O1 },
  { idx: 8, email: 'agent08_manager_o2@test-sbd.com', role: 'manager', system: TEST_SYSTEM_1_ID, facility: TEST_FACILITY_O2 },
  { idx: 9, email: 'agent09_manager_o3@test-sbd.com', role: 'manager', system: TEST_SYSTEM_1_ID, facility: TEST_FACILITY_O3 },
  { idx: 10, email: 'agent10_manager_t1@test-sbd.com', role: 'manager', system: TEST_SYSTEM_2_ID, facility: TEST_FACILITY_T1 },
  { idx: 11, email: 'agent11_manager_t2@test-sbd.com', role: 'manager', system: TEST_SYSTEM_2_ID, facility: TEST_FACILITY_T2 },
  { idx: 12, email: 'agent12_manager_ind@test-sbd.com', role: 'manager', system: null, facility: TEST_FACILITY_IND },
  { idx: 13, email: 'agent13_manager_multi@test-sbd.com', role: 'manager', system: TEST_SYSTEM_1_ID, facility: TEST_FACILITY_O1, extra_facilities: [TEST_FACILITY_O2] },
  { idx: 14, email: 'agent14_manager_suspended@test-sbd.com', role: 'manager', system: TEST_SYSTEM_2_ID, facility: TEST_FACILITY_T1, suspend: true },

  // --- Tier 4: Ground Staff ---
  // Omega Health Techs
  { idx: 15, email: 'agent15_staff_o1@test-sbd.com', role: 'staff', system: TEST_SYSTEM_1_ID, facility: TEST_FACILITY_O1 },
  { idx: 16, email: 'agent16_staff_o1@test-sbd.com', role: 'staff', system: TEST_SYSTEM_1_ID, facility: TEST_FACILITY_O1 },
  { idx: 17, email: 'agent17_staff_o1@test-sbd.com', role: 'staff', system: TEST_SYSTEM_1_ID, facility: TEST_FACILITY_O1 },
  { idx: 18, email: 'agent18_staff_o2@test-sbd.com', role: 'staff', system: TEST_SYSTEM_1_ID, facility: TEST_FACILITY_O2 },
  { idx: 19, email: 'agent19_staff_o2@test-sbd.com', role: 'staff', system: TEST_SYSTEM_1_ID, facility: TEST_FACILITY_O2 },
  { idx: 20, email: 'agent20_staff_o3@test-sbd.com', role: 'staff', system: TEST_SYSTEM_1_ID, facility: TEST_FACILITY_O3 },
  { idx: 21, email: 'agent21_staff_o3@test-sbd.com', role: 'staff', system: TEST_SYSTEM_1_ID, facility: TEST_FACILITY_O3 },
  { idx: 22, email: 'agent22_staff_multi@test-sbd.com', role: 'staff', system: TEST_SYSTEM_1_ID, facility: TEST_FACILITY_O1, extra_facilities: [TEST_FACILITY_O2] },

  // Titan Care Techs
  { idx: 23, email: 'agent23_staff_t1@test-sbd.com', role: 'staff', system: TEST_SYSTEM_2_ID, facility: TEST_FACILITY_T1 },
  { idx: 24, email: 'agent24_staff_t1@test-sbd.com', role: 'staff', system: TEST_SYSTEM_2_ID, facility: TEST_FACILITY_T1 },
  { idx: 25, email: 'agent25_staff_t2@test-sbd.com', role: 'staff', system: TEST_SYSTEM_2_ID, facility: TEST_FACILITY_T2 },
  { idx: 26, email: 'agent26_staff_t2@test-sbd.com', role: 'staff', system: TEST_SYSTEM_2_ID, facility: TEST_FACILITY_T2 },

  // Independent Techs
  { idx: 27, email: 'agent27_staff_ind@test-sbd.com', role: 'staff', system: null, facility: TEST_FACILITY_IND },
  { idx: 28, email: 'agent28_staff_ind@test-sbd.com', role: 'staff', system: null, facility: TEST_FACILITY_IND },

  // Rogues
  { idx: 29, email: 'agent29_rogue_staff@test-sbd.com', role: 'staff', system: null, facility: null },
  { idx: 30, email: 'agent30_orphaned_staff@test-sbd.com', role: 'staff', system: TEST_SYSTEM_1_ID, facility: 'invalid-facility-deleted-uuid' }
];

async function seedData() {
  console.log('🚀 Starting SBD 30-Agent Matrix Seeder...');

  // 1. Create Systems
  console.log('Building Hospital Systems...');
  const systems = [
    { id: TEST_SYSTEM_1_ID, name: 'SBD MATRIX TEST: Omega Health' },
    { id: TEST_SYSTEM_2_ID, name: 'SBD MATRIX TEST: Titan Care' }
  ];
  await supabase.from('hospital_systems').upsert(systems);

  // 2. Create Facilities
  console.log('Building Facilities...');
  const facilities = [
    { id: TEST_FACILITY_O1, system_id: TEST_SYSTEM_1_ID, facility_name: 'Omega Test Hospital 1', location: 'Matrix City', settings: {} },
    { id: TEST_FACILITY_O2, system_id: TEST_SYSTEM_1_ID, facility_name: 'Omega Test Hospital 2', location: 'Matrix City', settings: {} },
    { id: TEST_FACILITY_O3, system_id: TEST_SYSTEM_1_ID, facility_name: 'Omega Clinic', location: 'Matrix Suburbs', settings: {} },
    { id: TEST_FACILITY_T1, system_id: TEST_SYSTEM_2_ID, facility_name: 'Titan Test Hospital', location: 'Edge Ward', settings: {} },
    { id: TEST_FACILITY_T2, system_id: TEST_SYSTEM_2_ID, facility_name: 'Titan SurgiCenter', location: 'Edge Ward', settings: {} },
    { id: TEST_FACILITY_IND, system_id: null, facility_name: 'Independent Test Facility', location: 'Nowhere', settings: {} }
  ];
  await supabase.from('facilities').upsert(facilities);

  // 3. Create 30 Accounts
  console.log('Building 30 Agents...');
  for (let agent of agents) {
    console.log(`Processing Agent ${agent.idx}/30: ${agent.email}`);
    
    // Auth Identity
    const { data: user, error: authErr } = await supabase.auth.admin.createUser({
      email: agent.email,
      password: DEFAULT_PASSWORD,
      email_confirm: true
    });

    let userId = null;
    if (authErr) {
      if (authErr.message.includes('already exists')) {
        console.log(` > Auth exists, fetching...`);
        // Just query sbd_portal_users to find existing
        const { data: exist } = await supabase.from('sbd_portal_users').select('id').eq('email', agent.email).single();
        userId = exist ? exist.id : null;
      } else {
        console.error(` > Failed auth: ${authErr.message}`);
        continue;
      }
    } else {
      userId = user.user.id;
    }

    if (!userId) continue;

    const accessArr = agent.facility ? [agent.facility] : [];
    if (agent.extra_facilities) {
      accessArr.push(...agent.extra_facilities);
    }

    // Upsert Portal User
    const portalData = {
      id: userId,
      email: agent.email,
      first: `Agent`,
      last: `#${agent.idx}`,
      role: agent.role,
      title: agent.role === 'manager' ? 'Testing Manager' : 'Testing Staff',
      system_id: agent.system,
      facility_id: agent.facility,
      facility_access: accessArr,
      approval_status: agent.suspend ? 'suspended' : 'approved'
    };

    const { error: upsertErr } = await supabase.from('sbd_portal_users').upsert(portalData);
    if (upsertErr) {
      console.error(` > Failed saving profile: ${upsertErr.message}`);
    } else {
      console.log(` > ✅ Agent generated successfully`);
    }

    // Mock Ground-up Mock Data (Staff records, shifts)
    if (agent.role === 'staff' && agent.facility && !agent.suspend) {
       const staffProfileData = {
           facility_id: agent.facility,
           first_name: `Agent`,
           last_name: `#${agent.idx}`,
           user_id: userId,
           schedule_assigned: true
       };
       await supabase.from('staff').upsert(staffProfileData);
    }
  }

  console.log('🎉 Matrix Seeder completed completely.');
}

seedData();
