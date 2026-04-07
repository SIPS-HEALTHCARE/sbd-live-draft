const OB = {
  active: false,
  step: 0,
  steps: [],
  portalPrefix: '',
  tourRunning: false,
  skipReminderTimer: null,
  cameFromGuide: false,
};

// ── Tour Steps Per Role ──
// Each step: { target: CSS selector (within the portal), title, desc, group }
const TOUR_STEPS = {
  admin: [
    { target:'[data-view="a-overview"]', title:'Network Overview', desc:'This is your command center. Right now you are looking at belt distribution across all facilities, compliance rates, and network-wide KPIs. Everything rolls up here so you can spot trends at a glance.', group:'Network' },
    { target:'[data-view="a-leaderboard"]', title:'Facility Leaderboard', desc:'Here you can compare every facility side by side. The rankings show compliance scores, belt progression velocity, and staffing health. Use this to identify which locations need attention.', group:'Network' },
    { target:'[data-view="a-allstaff"]', title:'All Staff', desc:'This is your unified staff directory. Every staff member across the network is listed here. You can filter by facility, belt level, or role, and click any name to see their full profile.', group:'People' },
    { target:'[data-view="a-scoreboard"]', title:'Staff Scoreboard', desc:'You are looking at performance rankings across the network. Points come from assessments, gate completions, and skill development. This helps you identify your top performers.', group:'People' },
    { target:'[data-view="a-facilities"]', title:'Facilities', desc:'Each card represents a facility in the network. Click into any one to see its department stats, belt breakdowns, shift configurations, and compliance status.', group:'Operations' },
    { target:'[data-view="a-registrations"]', title:'Registrations', desc:'New facility access requests appear here. You can review the details, approve to create their portal, or deny with a reason. Pending requests show a badge count in the sidebar.', group:'Operations' },
    { target:'[data-view="a-assessments"]', title:'Assessment Queue', desc:'Pending assessments from all facilities are collected here. You can review each request, see the staff member\'s current belt, and process the assessment.', group:'Development' },
    { target:'[data-view="a-progression"]', title:'Staff Progression', desc:'This view tracks every staff member\'s journey through the belt system. You can see who is ready for promotion, who needs support, and filter by belt level or facility.', group:'Development' },
    { target:'[data-view="a-upload"]', title:'Bulk Upload', desc:'Use this tool to import staff rosters via CSV. Upload a file, map the columns, and add entire teams in one operation. Great for onboarding new facilities.', group:'Tools' },
    { target:'[data-view="a-reports"]', title:'Reports', desc:'Generate and download formatted PDF reports. Choose facility-level or network-level views, then export for leadership reviews or compliance audits.', group:'Tools' },
    { target:'[data-view="a-guide"]', title:'Platform Guide', desc:'This is your always-available guide. Come back here anytime to relaunch this tour, search for features, or check your getting-started checklist.', group:'Support' },
  ],
  hospital: [
    { target:'[data-view="h-dashboard"]', title:'Department Dashboard', desc:'This is your daily overview. You can see staff counts by belt, open assessment requests, upcoming milestones, and shift coverage health all in one place.', group:'Overview' },
    { target:'[data-view="h-staff"]', title:'Staff Directory', desc:'Every staff member in your department is listed here. You can see their belt level, role, gate status, and performance score. Click any row to open their full profile.', group:'People' },
    { target:'[data-view="h-milestones"]', title:'Facility Milestones', desc:'This tracks your facility\'s major achievements. Belt promotions, compliance targets hit, and certification gates completed. Use it to celebrate wins and track progress.', group:'Development' },
    { target:'[data-view="h-posschool"]', title:'Position School', desc:'Here is the structured curriculum for each belt track. You can see what your staff are learning, browse the modules, and track who has enrolled or completed their track.', group:'Development' },
    { target:'[data-view="h-scoreboard"]', title:'Staff Scoreboard', desc:'These are performance rankings for your team. Points come from assessments, attendance, and gate completions. Use this to recognize top performers and identify coaching needs.', group:'Development' },
    { target:'[data-view="h-schedule"]', title:'Schedule', desc:'Build and manage weekly shift schedules from here. You can auto-generate from templates, drag to adjust, and publish for your team to see.', group:'Operations' },
    { target:'[data-view="h-attendance"]', title:'Attendance', desc:'Record daily attendance here. Track who showed up, coverage rates, missed shifts, and overtime patterns. This data feeds into performance scoring.', group:'Operations' },
    { target:'[data-view="h-reports"]', title:'Reports', desc:'Download formatted PDF reports of your department\'s belt status, compliance metrics, and staffing data. Great for leadership updates and audits.', group:'Tools' },
    { target:'[data-view="h-guide"]', title:'Platform Guide', desc:'This is your always-available guide. Come back anytime to relaunch the tour or search for feature descriptions.', group:'Support' },
  ],
  facility_admin: [
    { target:'[data-view="h-dashboard"]', title:'Department Dashboard', desc:'This is your daily overview. Staff counts by belt, open assessment requests, milestones, and shift coverage health all in one place.', group:'Overview' },
    { target:'[data-view="h-staff"]', title:'Staff Directory', desc:'Your full staff roster is here. Belt levels, roles, gate status, and performance data for everyone. Click any name for their complete profile.', group:'People' },
    { target:'[data-view="h-milestones"]', title:'Facility Milestones', desc:'Track belt promotions, compliance targets, and certification gates completed across your facility.', group:'Development' },
    { target:'[data-view="h-posschool"]', title:'Position School', desc:'The structured curriculum for each belt track. Monitor which staff are enrolled and where they are in their training modules.', group:'Development' },
    { target:'[data-view="h-scoreboard"]', title:'Staff Scoreboard', desc:'Performance rankings for your team. Points from assessments, attendance, and gate completions are tallied here.', group:'Development' },
    { target:'[data-view="h-schedule"]', title:'Schedule', desc:'Build and manage weekly shift schedules for your facility from this view.', group:'Operations' },
    { target:'[data-view="h-attendance"]', title:'Attendance', desc:'Record daily attendance and track coverage patterns here. The data feeds into staff performance scores.', group:'Operations' },
    { target:'[data-view="h-reports"]', title:'Reports', desc:'Download formatted reports of your facility\'s belt status, compliance, and performance.', group:'Tools' },
    { target:'[data-view="h-assessments"]', title:'Assessment Queue', desc:'As a Facility Admin, this is where belt assessment requests land. You can review each one, see the staff member\'s readiness, and process the assessment.', group:'Administration' },
    { target:'[data-view="h-progression"]', title:'Staff Progression', desc:'Manage belt advancement from here. See who is eligible for promotion, who needs additional support, and approve or track requests.', group:'Administration' },
    { target:'[data-view="h-guide"]', title:'Platform Guide', desc:'Your always-available guide. Relaunch the tour, explore features, or check your progress anytime.', group:'Support' },
  ],
  staff_member: [
    { target:'[data-view="s-dashboard"]', title:'My Dashboard', desc:'This is your personal command center. You can see your current belt level, the next gates you need to complete, your points total, and your upcoming schedule right here.', group:'Overview' },
    { target:'[data-view="s-belt"]', title:'Belt Progress', desc:'Here you can track your journey through the belt system. Each certification gate is listed with its status. Green means passed, and you can see exactly what comes next.', group:'Development' },
    { target:'[data-view="s-window"]', title:'My Window', desc:'This is a focused view of your current performance window. Your active metrics, scoring factors, and where you stand relative to your goals are all shown here.', group:'Development' },
    { target:'[data-view="s-scoreboard"]', title:'Scoreboard', desc:'See how you rank among your peers. Points come from assessments, attendance, and professional development. This is updated as you progress.', group:'Development' },
    { target:'[data-view="s-posschool"]', title:'Position School', desc:'This is your training hub. Access study materials, scripts, procedures, and knowledge content for your current belt track. Everything you need to prepare for assessments.', group:'Learning' },
    { target:'[data-view="s-report"]', title:'My Report', desc:'Your personal performance report is here. Belt history, gate status, attendance record, and skill summary all in one view. You can download this as a PDF.', group:'Profile' },
    { target:'[data-view="s-oip"]', title:'My Profile', desc:'This is your OIP (Operational Identity Profile). Complete your profile assessment here so your facility can understand your strengths and place you on the right belt track.', group:'Profile' },
    { target:'[data-view="s-schedule"]', title:'My Schedule', desc:'Your assigned shifts and upcoming work schedule are shown here. Check this regularly so you always know when you are expected.', group:'Operations' },
    { target:'[data-view="s-history"]', title:'History & Projection', desc:'See your complete belt history timeline here, including every promotion, assessment, and milestone. Your projected advancement path is also mapped out.', group:'Profile' },
    { target:'[data-view="s-study"]', title:'Study & Practice', desc:'Practice assessments, review approved language scripts, and test your knowledge before your next evaluation. This is where you build confidence and prepare.', group:'Learning' },
    { target:'[data-view="s-guide"]', title:'Platform Guide', desc:'This is your always-available guide. Relaunch this tour, search for features, or check your onboarding checklist anytime from here.', group:'Support' },
  ],
  system_admin: [
    { target:'[data-view="x-dashboard"]', title:'System Dashboard', desc:'This is your system overview. Aggregate belt data, facility health scores, and system-wide trends are shown here. Everything across your hospital system rolls up into this view.', group:'Overview' },
    { target:'[data-view="x-facilities"]', title:'My Facilities', desc:'All facilities under your system are listed here. Click into any one to see belt breakdowns, staff rosters, and compliance data for that location.', group:'Facilities' },
    { target:'[data-view="x-staff"]', title:'All Staff', desc:'Your unified staff directory spans every facility in your system. You can filter, search, and click into any staff member\'s profile from here.', group:'People' },
    { target:'[data-view="x-schedule"]', title:'Schedule & Attendance', desc:'View scheduling and attendance across all your facilities from this screen. Compare coverage rates and identify staffing gaps at a glance.', group:'Operations' },
    { target:'[data-view="x-reports"]', title:'Reports', desc:'System-level reports live here. Belt distribution, compliance trends, and aggregated performance data across all your facilities, ready to export.', group:'Tools' },
    { target:'[data-view="x-guide"]', title:'Platform Guide', desc:'Your always-available guide to the System Admin portal. Relaunch the tour or browse features anytime.', group:'Support' },
  ],
};

// ── Role-to-portal prefix mapping ──
function getPortalPrefix(){
  const u=ST.user;
  if(!u) return 'h';
  if(ST.portal==='staff_member') return 's';
  if(ST.portal==='system_admin') return 'x';
  if(ST.portal==='admin') return 'a';
  return 'h';
}

function getTourRole(){
  const u=ST.user;
  if(!u) return 'hospital';
  if(u.role==='staff_member') return 'staff_member';
  if(u.role==='system_admin') return 'system_admin';
  if(u.role==='facility_admin') return 'facility_admin';
  if(u.role==='master_admin'||u.role==='staff_admin') return 'admin';
  return 'hospital';
}

// ── Onboarding Data Helpers ──
function getOnboardingState(userId){
  if(!userId) return null;
  // 1. Check in-memory DB
  let state = DB.onboarding.find(o=>o.userId===userId);
  if(state) return state;

  // 2. Fallback to LocalStorage
  const local = localStorage.getItem('sbd_onboarding_' + userId);
  if(local) {
    try {
      const parsed = JSON.parse(local);
      // Hydrate DB so it's available for next call
      DB.onboarding.push(parsed);
      return parsed;
    } catch(e) { console.warn('Onboarding local load failed', e); }
  }
  return null;
}

function setOnboardingState(userId, updates){
  if(!userId) return;
  let ob = DB.onboarding.find(o=>o.userId===userId);
  if(!ob){
    ob = { userId, tourCompleted:false, tourSkipped:false, lastTourStep:0, profileAssessmentPrompted:false, placementAssessmentPrompted:false, attentionDismissals:{}, seenSections:[], collapsedSections:[], completedSteps:[], readSections:{}, checkResults:{}, createdAt:new Date().toISOString() };
    DB.onboarding.push(ob);
  }
  Object.assign(ob, updates, { updatedAt:new Date().toISOString() });
  
  // 1. SAVE TO LOCALSTORAGE (Immediate Fallback)
  localStorage.setItem('sbd_onboarding_' + userId, JSON.stringify(ob));

  // 2. SYNC TO BACKEND (Background, ignore 403)
  if(IS_LIVE){ 
    SB.upsertUserOnboarding(mapOnboardingToBackend(ob)).catch(e=>{
      if(!e.message.includes('403')) console.warn('Onboarding sync:',e.message); 
    }); 
  }
}

function isFirstLogin(userId){
  const ob = getOnboardingState(userId);
  return !ob || (!ob.tourCompleted && !ob.tourSkipped);
}

// ── SB Client Methods for Onboarding ──
SB.getUserOnboarding = function(userId){ return sbFetch('/rest/v1/user_onboarding?user_id=eq.'+userId+'&select=*'); };
SB.upsertUserOnboarding = function(data){ return sbFetch('/rest/v1/user_onboarding?on_conflict=user_id', { method:'POST', prefer:'resolution=merge-duplicates', body:data }); };

// ── Onboarding Mappers ──
function mapOnboardingFromBackend(row){
  if(!row) return null;
  // Handle single object or array return
  if(Array.isArray(row)) row = row[0];
  if(!row) return null;
  return {
    userId: row.user_id,
    tourCompleted: row.tour_completed,
    tourCompletedAt: row.tour_completed_at,
    tourSkipped: row.tour_skipped,
    tourSkippedAt: row.tour_skipped_at,
    lastTourStep: row.last_tour_step || 0,
    profileAssessmentPrompted: row.profile_assessment_prompted,
    placementAssessmentPrompted: row.placement_assessment_prompted,
    attentionDismissals: row.attention_dismissals || {},
    seenSections: row.seen_sections || [],
    collapsedSections: row.collapsed_sections || [],
    completedSteps: row.completed_steps || [],
    readSections: row.read_sections || {},
    checkResults: row.check_results || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOnboardingToBackend(ob){
  return {
    user_id: ob.userId,
    role: ST.user ? ST.user.role : 'hospital',
    tour_completed: ob.tourCompleted || false,
    tour_completed_at: ob.tourCompletedAt || null,
    tour_skipped: ob.tourSkipped || false,
    tour_skipped_at: ob.tourSkippedAt || null,
    last_tour_step: ob.lastTourStep || 0,
    profile_assessment_prompted: ob.profileAssessmentPrompted || false,
    placement_assessment_prompted: ob.placementAssessmentPrompted || false,
    attention_dismissals: ob.attentionDismissals || {},
    seen_sections: ob.seenSections || [],
    collapsed_sections: ob.collapsedSections || [],
    completed_steps: ob.completedSteps || [],
    read_sections: ob.readSections || {},
    check_results: ob.checkResults || {},
  };
}

// ══════════════════════════════════════════════════════════════════
// LAYER 3: MODULE-LEVEL READING PROGRESS + COMPREHENSION CHECKS
// ══════════════════════════════════════════════════════════════════

// ── Comprehension Checks: Static Fallback Bank ──
// Used as instant fallbacks if API is unavailable. Keyed as "belt_<Belt>_<idx>" or "ps_<tid>_<idx>"
const L3_CHECKS = {
  'belt_White_1': { q:'Why does the SBD Belt System exist?', opts:['To rank employees by seniority','To replace operator development left to chance with structured progression','To track attendance and shift coverage','To satisfy regulatory audit requirements'], correct:1, explain:'The belt system replaces the historical model where new techs were given brief orientations and left to figure it out, which caused inconsistent sterile fields and patient safety events.' },
  'belt_White_2': { q:'At White Belt, what happens when you receive a question you cannot answer?', opts:['Give your best guess to be helpful','Tell the caller to call back later','Use Script 1: acknowledge, document, route to the Lead','Ask a coworker to handle it'], correct:2, explain:'White Belt scope is zero improvisation. Every unknown question gets acknowledged, documented, and routed to the Lead. You never guess.' },
  'belt_White_5': { q:'What must you do if OR staff pushes back against your scripted response?', opts:['Adapt your language to match their tone','Repeat the approved script exactly as written','Apologize and try to help directly','Hang up and call the Lead'], correct:1, explain:'Pushback does not change your script. You repeat the approved language. The script protects you and the patient. The Lead handles escalation.' },
  'belt_White_7': { q:'When must documentation occur?', opts:['At the end of your shift when you have time','Within 30 minutes of the event','At the time of the event, not afterward','Before the next shift starts'], correct:2, explain:'Documentation happens at the time of the event. Delayed documentation is inaccurate documentation. Never complete logs from memory at end of shift.' },
  'belt_Yellow_1': { q:'What is the most significant change from White Belt to Yellow Belt?', opts:['You get a raise','You can now leave early','You gain single-area ownership with area-specific scripts','You supervise White Belts'], correct:2, explain:'Yellow Belt grants single-area mastery with 9 new area-specific scripts. You own execution in your assigned area and report upward when anomalies occur.' },
  'belt_Yellow_3': { q:'What is a "wet pack" in sterilization?', opts:['A tray that was sterilized with too much wrapping','A sterilized package that contains visible moisture after the cycle','A pre-soaked instrument set ready for assembly','A tray stored in a humid environment'], correct:1, explain:'A wet pack is a sterilized package with residual moisture. It compromises sterile integrity because moisture can wick bacteria through wrapping. Wet packs are never released.' },
  'belt_Green_1': { q:'What is the primary authority expansion at Green Belt?', opts:['You can override the Lead Tech','You gain cross-area verification and coaching responsibility','You can work unsupervised in any department','You set your own schedule'], correct:1, explain:'Green Belt adds multi-area proficiency, Universal Protocol communication, and the responsibility to coach lower belts.' },
  'belt_Green_2': { q:'What is the Universal Communication Protocol at Green Belt?', opts:['A phone system for all hospital departments','A standardized four-step communication framework for every interaction','A script memorization requirement','An email template for incident reports'], correct:1, explain:'The Universal Communication Protocol is a structured four-step framework that standardizes how Green Belts communicate in every professional interaction across all areas.' },
  'belt_Blue_1': { q:'What does the Blue Belt role own that no lower belt does?', opts:['Personal time-off approval','All Lead-side communication with OR, vendors, and external contacts','The department budget','Hiring decisions'], correct:1, explain:'Blue Belt is the leadership entry point. Lead Techs own all communication that flows between SPD and external contacts.' },
  'belt_Blue_5': { q:'When OR calls about a delayed tray, what is the correct Lead response?', opts:['"We are working on it"','"Not our fault"','State specific tray, current status, and committed delivery time','Transfer them to the Supervisor'], correct:2, explain:'The Lead gives facts and a committed timeline: tray name, current status, delivery time. Vague reassurances and blame are forbidden language.' },
  'belt_Brown_1': { q:'What authority level distinguishes Brown Belt from Blue Belt?', opts:['Brown Belt can fire employees','Brown Belt owns operational engineering and executive escalation','Brown Belt handles scheduling exclusively','Brown Belt is Blue Belt with more shifts'], correct:1, explain:'Brown Belt moves from floor leadership into systems-level thinking: root-cause analysis, operational engineering, and executive escalation.' },
  'belt_Brown_2': { q:'What is the SBD 5-Why model used for?', opts:['Evaluating employee attitude','Conducting root-cause analysis on defects and failures','Planning vacation schedules','Designing new instrument trays'], correct:1, explain:'The 5-Why model is a structured root-cause analysis method. You ask "why" iteratively until you reach the systemic cause.' },
  'belt_Black_2': { q:'What are the Five Black Belt Responsibilities?', opts:['Hiring, firing, budgeting, scheduling, compliance','Owns, teaches, audits, evolves, and certifies the entire SBD system','Running the cafeteria, laundry, and SPD','Delegating all work to Brown Belts'], correct:1, explain:'Black Belt mastery means you own the system, teach it, audit it, evolve it, and certify others within it.' },
  'belt_Black_5': { q:'What standard must a Black Belt Educator meet before teaching a belt level?', opts:['Read the curriculum once','Demonstrate every script from memory at that belt standard','Have at least 5 years experience','Be approved by hospital administration'], correct:1, explain:'A Black Belt teaching any belt level must demonstrate every script from memory at that belt standard.' },
};

// ── L3 Transient State ──
if(!window._l3Cache) window._l3Cache = {}; // caches generated checks/breakdowns/synopses

// ── HTML Strip Helper ──
function l3Strip(html){
  const d = document.createElement('div');
  d.innerHTML = html;
  return (d.textContent || d.innerText || '').replace(/\s+/g,' ').trim();
}

// ── Get Section Content ──
function l3GetSectionContent(type, id, idx){
  let sections = [];
  if(type === 'belt'){
    sections = (FULL_CURRICULUM_DATA && FULL_CURRICULUM_DATA.belts && FULL_CURRICULUM_DATA.belts[id]) || [];
  } else {
    sections = (window._psCurrData && window._psCurrData[id]) || [];
  }
  const sec = sections[idx];
  if(!sec) return { title:'', text:'' };
  return { title: sec.title, text: l3Strip(sec.html).substring(0, 3500) };
}

// ── API Caller ──
async function l3CallAPI(systemPrompt, userContent){
  try {
    const fetchPromise = fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({
        model:'claude-sonnet-4-20250514',
        max_tokens:1000,
        system: systemPrompt,
        messages:[{ role:'user', content: userContent }]
      })
    });
    const timeoutPromise = new Promise(function(_,reject){
      setTimeout(function(){ reject(new Error('timeout')); }, 6000);
    });
    const resp = await Promise.race([fetchPromise, timeoutPromise]);
    if(!resp.ok) throw new Error('API '+resp.status);
    const data = await resp.json();
    return (data.content||[]).map(function(b){ return b.text||''; }).join('');
  } catch(e){
    console.warn('L3 API:', e.message||'unavailable');
    return null;
  }
}

// ── Client-Side Fallback Check Generator ──
// Generates a comprehension check from section text without API
function l3GenerateLocalCheck(title, text){
  // Extract key sentences that contain definitions or important facts
  const sentences = text.split(/[.!?]+/).map(s=>s.trim()).filter(s=>s.length>30 && s.length<250);
  if(sentences.length < 2) return null;

  // Pick a random factual sentence to build a question from
  const pick = sentences[Math.floor(Math.random()*Math.min(sentences.length, 12))];

  // Extract a key phrase (first noun-heavy clause)
  const words = pick.split(/\s+/);
  if(words.length < 6) return null;

  // Build a "What does this section teach about X?" question
  const topicWords = title.replace(/SECTION \d+:|STERILE BY DESIGN/gi,'').trim();
  const q = topicWords.length > 5
    ? 'Based on this section about '+topicWords+', which of the following is accurate?'
    : 'Which of the following accurately reflects the content of this section?';

  // The correct answer is a paraphrase of the picked sentence
  const correctOpt = pick.length > 120 ? pick.substring(0, 120)+'...' : pick;

  // Generate plausible wrong answers by modifying key elements
  const wrongTemplates = [
    'This is optional and only applies to facilities that choose to implement it.',
    'This responsibility belongs to the department director, not frontline staff.',
    'This requirement was removed in the most recent update to the standard.',
    'This only applies during emergency situations, not during routine operations.',
    'This is handled automatically by the tracking system and requires no manual action.',
    'Staff at all belt levels have equal authority in this area.',
    'This is a recommendation rather than a requirement in the SBD system.',
    'This falls outside the scope of the current belt level being discussed.'
  ];

  // Shuffle and pick 3 wrong answers
  const shuffled = wrongTemplates.sort(()=>Math.random()-0.5);
  const opts = [correctOpt, shuffled[0], shuffled[1], shuffled[2]];

  // Shuffle all options and track correct index
  const indices = [0,1,2,3].sort(()=>Math.random()-0.5);
  const shuffledOpts = indices.map(i=>opts[i]);
  const correctIdx = indices.indexOf(0);

  return {
    q: q,
    opts: shuffledOpts,
    correct: correctIdx,
    explain: 'The correct answer reflects the actual content of this section. The other options introduce inaccuracies that contradict what the section teaches.'
  };
}
