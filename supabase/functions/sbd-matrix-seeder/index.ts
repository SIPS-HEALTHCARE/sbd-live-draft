import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
  { idx: 6, email: 'agent06_sysadmin_rogue@test-sbd.com', role: 'system_admin', system: TEST_SYSTEM_1_ID, facility: null },

  // --- Tier 3: Facility Operations Layer ---
  { idx: 7, email: 'agent07_manager_o1@test-sbd.com', role: 'hospital', system: TEST_SYSTEM_1_ID, facility: TEST_FACILITY_O1 },
  { idx: 8, email: 'agent08_manager_o2@test-sbd.com', role: 'hospital', system: TEST_SYSTEM_1_ID, facility: TEST_FACILITY_O2 },
  { idx: 9, email: 'agent09_manager_o3@test-sbd.com', role: 'hospital', system: TEST_SYSTEM_1_ID, facility: TEST_FACILITY_O3 },
  { idx: 10, email: 'agent10_manager_t1@test-sbd.com', role: 'hospital', system: TEST_SYSTEM_2_ID, facility: TEST_FACILITY_T1 },
  { idx: 11, email: 'agent11_manager_t2@test-sbd.com', role: 'hospital', system: TEST_SYSTEM_2_ID, facility: TEST_FACILITY_T2 },
  { idx: 12, email: 'agent12_manager_ind@test-sbd.com', role: 'hospital', system: null, facility: TEST_FACILITY_IND },
  { idx: 13, email: 'agent13_manager_multi@test-sbd.com', role: 'hospital', system: TEST_SYSTEM_1_ID, facility: TEST_FACILITY_O1, extra_facilities: [TEST_FACILITY_O2] },
  { idx: 14, email: 'agent14_manager_suspended@test-sbd.com', role: 'hospital', system: TEST_SYSTEM_2_ID, facility: TEST_FACILITY_T1, suspend: true },

  // --- Tier 4: Ground Staff ---
  { idx: 15, email: 'agent15_staff_o1@test-sbd.com', role: 'staff_member', system: TEST_SYSTEM_1_ID, facility: TEST_FACILITY_O1 },
  { idx: 16, email: 'agent16_staff_o1@test-sbd.com', role: 'staff_member', system: TEST_SYSTEM_1_ID, facility: TEST_FACILITY_O1 },
  { idx: 17, email: 'agent17_staff_o1@test-sbd.com', role: 'staff_member', system: TEST_SYSTEM_1_ID, facility: TEST_FACILITY_O1 },
  { idx: 18, email: 'agent18_staff_o2@test-sbd.com', role: 'staff_member', system: TEST_SYSTEM_1_ID, facility: TEST_FACILITY_O2 },
  { idx: 19, email: 'agent19_staff_o2@test-sbd.com', role: 'staff_member', system: TEST_SYSTEM_1_ID, facility: TEST_FACILITY_O2 },
  { idx: 20, email: 'agent20_staff_o3@test-sbd.com', role: 'staff_member', system: TEST_SYSTEM_1_ID, facility: TEST_FACILITY_O3 },
  { idx: 21, email: 'agent21_staff_o3@test-sbd.com', role: 'staff_member', system: TEST_SYSTEM_1_ID, facility: TEST_FACILITY_O3 },
  { idx: 22, email: 'agent22_staff_multi@test-sbd.com', role: 'staff_member', system: TEST_SYSTEM_1_ID, facility: TEST_FACILITY_O1, extra_facilities: [TEST_FACILITY_O2] },

  { idx: 23, email: 'agent23_staff_t1@test-sbd.com', role: 'staff_member', system: TEST_SYSTEM_2_ID, facility: TEST_FACILITY_T1 },
  { idx: 24, email: 'agent24_staff_t1@test-sbd.com', role: 'staff_member', system: TEST_SYSTEM_2_ID, facility: TEST_FACILITY_T1 },
  { idx: 25, email: 'agent25_staff_t2@test-sbd.com', role: 'staff_member', system: TEST_SYSTEM_2_ID, facility: TEST_FACILITY_T2 },
  { idx: 26, email: 'agent26_staff_t2@test-sbd.com', role: 'staff_member', system: TEST_SYSTEM_2_ID, facility: TEST_FACILITY_T2 },

  { idx: 27, email: 'agent27_staff_ind@test-sbd.com', role: 'staff_member', system: null, facility: TEST_FACILITY_IND },
  { idx: 28, email: 'agent28_staff_ind@test-sbd.com', role: 'staff_member', system: null, facility: TEST_FACILITY_IND },

  { idx: 29, email: 'agent29_rogue_staff@test-sbd.com', role: 'staff_member', system: null, facility: null },
  { idx: 30, email: 'agent30_orphaned_staff@test-sbd.com', role: 'staff_member', system: TEST_SYSTEM_1_ID, facility: 'invalid-facility-deleted' }
];

serve(async (req) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const logArray: string[] = [];
    const log = (msg: string) => { console.log(msg); logArray.push(msg); };

    log('🚀 Starting SBD 30-Agent Matrix Seeder...');

    log('Building Hospital Systems...');
    const systems = [
      { id: TEST_SYSTEM_1_ID, name: 'SBD MATRIX TEST: Omega Health' },
      { id: TEST_SYSTEM_2_ID, name: 'SBD MATRIX TEST: Titan Care' }
    ];
    await supabaseClient.from('hospital_systems').upsert(systems);

    log('Building Facilities...');
    const facilities = [
      { id: TEST_FACILITY_O1, system_id: TEST_SYSTEM_1_ID, name: 'Omega Test Hospital 1', loc: 'Matrix City', dept: 'Main', type: 'Hospital', contact: 'agent', email: 'fac1@test-sbd.com' },
      { id: TEST_FACILITY_O2, system_id: TEST_SYSTEM_1_ID, name: 'Omega Test Hospital 2', loc: 'Matrix City', dept: 'Surgical', type: 'SurgiCenter', contact: 'agent', email: 'fac2@test-sbd.com' },
      { id: TEST_FACILITY_O3, system_id: TEST_SYSTEM_1_ID, name: 'Omega Clinic', loc: 'Matrix Suburbs', dept: 'Outpatient', type: 'Clinic', contact: 'agent', email: 'fac3@test-sbd.com' },
      { id: TEST_FACILITY_T1, system_id: TEST_SYSTEM_2_ID, name: 'Titan Test Hospital', loc: 'Edge Ward', dept: 'Main', type: 'Hospital', contact: 'agent', email: 'fac4@test-sbd.com' },
      { id: TEST_FACILITY_T2, system_id: TEST_SYSTEM_2_ID, name: 'Titan SurgiCenter', loc: 'Edge Ward', dept: 'Orthopedics', type: 'SurgiCenter', contact: 'agent', email: 'fac5@test-sbd.com' },
      { id: TEST_FACILITY_IND, system_id: null, name: 'Independent Test Facility', loc: 'Nowhere', dept: 'General', type: 'Hospital', contact: 'agent', email: 'fac6@test-sbd.com' }
    ];
    const { error: facErr } = await supabaseClient.from('facilities').upsert(facilities);
    if (facErr) log('Error inserting facilities: ' + facErr.message);

    log('Building 30 Agents...');
    for (const agent of agents) {
      log(`Processing Agent ${agent.idx}/30: ${agent.email}`);
      
      const { data: user, error: authErr } = await supabaseClient.auth.admin.createUser({
        email: agent.email,
        password: DEFAULT_PASSWORD,
        email_confirm: true
      });

      let userId = null;
      if (authErr) {
          if (authErr.message.includes('registered') || authErr.message.includes('exists')) {
              log(` > Auth exists, fetching ID for ${agent.email}...`);
              const { data: users } = await supabaseClient.auth.admin.listUsers();
              const existingUser = users?.users?.find(u => u.email === agent.email);
              userId = existingUser ? existingUser.id : null;
              if (!userId) log(` > Could not find existing Auth ID for ${agent.email}`);
          } else {
              log(` > Auth failure: ${authErr.message}`);
          }
      } else if (user?.user) {
          userId = user.user.id;
      }

      if (!userId) {
          log(` > Failed to fetch/create Auth ID for ${agent.email}`);
          continue;
      }

      const accessArr = agent.facility && agent.facility !== 'invalid-facility-deleted' ? [agent.facility] : [];
      if (agent.extra_facilities) {
        accessArr.push(...agent.extra_facilities);
      }

      const portalData = {
        id: userId,
        auth_uid: userId,
        email: agent.email,
        name: `Agent #${agent.idx}`,
        initials: `A${agent.idx}`,
        role: agent.role,
        title: agent.role === 'hospital' ? 'Testing Manager' : 'Testing Staff',
        system_id: agent.system,
        facility_id: agent.facility !== 'invalid-facility-deleted' ? agent.facility : null,
        assigned_facility_ids: accessArr,
        active: !agent.suspend
      };

      const { error: upsertErr } = await supabaseClient.from('sbd_portal_users').upsert(portalData);
      if (upsertErr) {
        log(` > Failed saving profile: ${upsertErr.message}`);
      } else {
        log(` > ✅ Agent generated successfully`);
      }

      if (agent.role === 'staff_member' && agent.facility !== 'invalid-facility-deleted' && agent.facility !== null && !agent.suspend) {
         const staffProfileData = {
             facility_id: agent.facility,
             first_name: `Agent`,
             last_name: `#${agent.idx}`,
             user_id: userId,
             schedule_assigned: true
         };
         await supabaseClient.from('staff').upsert(staffProfileData, { onConflict: 'user_id' });
      }
    }

    log('🎉 Matrix Seeder completed completely.');

    return new Response(JSON.stringify({ 
      success: true, 
      message: '30-Agent Matrix Seeded Successfully!',
      logs: logArray 
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
});
