// IS_LIVE must be declared first -- referenced throughout before other constants load.
const IS_LIVE = true;
if (typeof window !== 'undefined') window.IS_LIVE = IS_LIVE;

// ── Global State Skeleton ──
// Empty fallback state array to prevent UI views from throwing ReferenceError 
// before they are systematically refactored to use SB methods by the swarm.
var DB = { 
  users:[], facilities:[], staff:[], schedule:[], attendance:[], 
  promotionApprovals:[], queue:[], freeAgents:[], pendingRegs:[], 
  placementReviews:[], systems:[], hospitalSystems:[], 
  psCompletionRequests:[], onboarding:[] 
};
if (typeof window !== 'undefined') window.DB = DB; 

// ── Console safety shim  --  some embed platforms (baknd.io, Simvoly) strip
// certain console methods. This prevents "console.X is not a function" from
// crashing try/catch blocks and producing misleading error messages.
(function(){
  if(typeof console==='undefined') window.console={};
  ['log','info','warn','error','debug','group','groupEnd','time','timeEnd'].forEach(function(m){
    if(typeof console[m]!=='function') console[m]=function(){};
  });
})();

// ============================================================ ICONS
const ICO = {
  check:`<svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5 6.5-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  x:`<svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  plus:`<svg width="14" height="14" viewBox="0 0 18 18" fill="none"><path d="M9 3v12M3 9h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  edit:`<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M11 2l3 3L6 13H3v-3L11 2z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
  dl:`<svg width="13" height="13" viewBox="0 0 18 18" fill="none"><path d="M9 3v8m0 0l-3-3m3 3l3-3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 12v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`,
  record:`<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="13" rx="1" stroke="currentColor" stroke-width="1.4"/><path d="M5 6h6M5 9h4M5 12h5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`,
  view:`<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" stroke-width="1.4"/><circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.3"/></svg>`,
};

// ============================================================ DATA
const BELT_ORDER = ['White','Yellow','Green','Blue','Brown','Black'];
const BELT_CLR = {White:'#cbd5e1',Yellow:'#eab308',Green:'#22c55e',Blue:'#60a5fa',Brown:'#c2772a',Black:'#8b929e'};
const BELT_BG  = {White:'#cbd5e118',Yellow:'#eab30815',Green:'#22c55e12',Blue:'#60a5fa12',Brown:'#c2772a15',Black:'#8b929e12'};
const BELT_CERT= {White:'Certified Operator I',Yellow:'Certified Operator II',Green:'Certified Operator III',Blue:'Certified Operator IV',Brown:'Certified Operator V',Black:'Master Operator'};
const BELT_VAL = {White:1,Yellow:2,Green:3,Blue:4,Brown:5,Black:6};

// ── ASSESSMENT WINDOWS (weeks open / weeks closed per belt transition) ──────
// After earning a belt the staff member has WINDOW_OPEN weeks to apply.
// If they miss it the window closes for WINDOW_CLOSED weeks then reopens.
// Windows get longer at higher belts to prove mastery over time.
const BELT_WINDOWS = {
  White:  {open:2,  closed:2,  label:'2-week window'},
  Yellow: {open:4,  closed:4,  label:'4-week window'},
  Green:  {open:6,  closed:6,  label:'6-week window'},
  Blue:   {open:8,  closed:8,  label:'8-week window'},
  Brown:  {open:12, closed:12, label:'12-week window'},
};
// Points awarded per achievement
const BELT_POINTS = {White:100,Yellow:250,Green:500,Blue:1000,Brown:2000,Black:5000};
const GATE_POINTS  = {pass:50,  fail:-10};
const STAR_POINTS  = 25;

// ── WINDOW ENGINE ─────────────────────────────────────────────────────────────
function getWindowStatus(staff){
  // Returns: {status:'open'|'closed'|'max', opensIn, closesIn, weeksOpen, weeksClosed, pct}
  const belt = staff.belt;
  const bIdx  = beltIdx(belt);
  if(bIdx >= 5) return {status:'max', label:'Black Belt – Maximum Level', pct:100};
  const cfg   = BELT_WINDOWS[belt];
  if(!cfg)     return {status:'open', label:'Window Open', pct:100};
  const allPass = staff.cur.c==='pass' && staff.cur.s==='pass' && staff.cur.o==='pass';
  if(!allPass) return {status:'locked', label:'Complete current belt assessments first', pct:0};
  // Calculate from belt earn date
  const earnDate = new Date(staff.since);
  const now = new Date();
  const daysSince = Math.floor((now - earnDate)/(1000*60*60*24));
  const cycleDays = (cfg.open + cfg.closed) * 7;
  const posInCycle = daysSince % cycleDays;
  const openDays   = cfg.open * 7;
  if(posInCycle < openDays){
    const daysLeft = openDays - posInCycle;
    return {
      status:'open',
      label:`Window open: ${daysLeft}d remaining`,
      daysLeft,
      pct: Math.round(posInCycle/openDays*100),
      cfg
    };
  } else {
    const daysUntilOpen = cycleDays - posInCycle;
    return {
      status:'closed',
      label:`Window closed. Reopens in ${daysUntilOpen}d`,
      daysUntilOpen,
      pct: Math.round((posInCycle-openDays)/(cfg.closed*7)*100),
      cfg
    };
  }
}

// ── POINTS ENGINE ─────────────────────────────────────────────────────────────
// Returns the sum of attendance points for a staff member from DB.attendance.
// DB.attendance is initialised to [] on login and only populated if schedule/attendance
// data has been loaded. Returns 0 safely when the array is empty.
function calcAttendancePoints(staff){
  if(!DB.attendance || !DB.attendance.length) return 0;
  return DB.attendance
    .filter(a => a.staff_id === staff.id || a.staffId === staff.id)
    .reduce((sum, a) => sum + (a.points || 0), 0);
}

function calcPoints(staff){
  let pts = 0;
  // Belt points for all earned belts up to current
  BELT_ORDER.slice(0, beltIdx(staff.belt)+1).forEach(b => pts += BELT_POINTS[b]);
  // Gate points (current + next partial)
  ['cur','nxt'].forEach(tier => {
    ['c','s','o'].forEach(g => {
      if(staff[tier][g]==='pass') pts += GATE_POINTS.pass;
      if(staff[tier][g]==='fail') pts += GATE_POINTS.fail;
    });
  });
  // Star bonus
  pts += (staff.stars||0) * STAR_POINTS;
  // Attendance points
  pts += calcAttendancePoints(staff);
  // Position school
  if(staff.ps && staff.ps.done) pts += 200;
  else if(staff.ps && staff.ps.enrolled) pts += 50;
  return Math.max(0, pts);
}

// ── PROJECTION ENGINE ─────────────────────────────────────────────────────────
function generateProjection(staff){
  const bIdx = beltIdx(staff.belt);
  const nb   = BELT_ORDER[bIdx+1];
  if(!nb) return {summary:'Staff has reached Black Belt – maximum level achieved.', promotionRecommended:staff.promo, projectedWeeks:0};

  // Gates passed toward next belt
  const nxtPassed = [staff.nxt.c,staff.nxt.s,staff.nxt.o].filter(x=>x==='pass').length;
  const gatesLeft  = 3 - nxtPassed;
  // Estimate based on historical assessment cadence (avg 2-4 weeks per gate from history)
  const historyGates = (staff.history||[]).filter(h=>h.res==='pass').length;
  const daysActive   = daysAt(staff.since);
  const avgWeeksPerGate = historyGates > 0 ? Math.max(2, Math.round(daysActive/7/Math.max(historyGates,1))) : 4;
  const weeksForGates   = gatesLeft * avgWeeksPerGate;
  // Add window wait time
  const win  = getWindowStatus(staff);
  const waitWeeks = win.status==='closed' ? Math.ceil((win.daysUntilOpen||14)/7) : 0;
  const totalWeeks = weeksForGates + waitWeeks;
  // Promotion recommendation logic
  const allCurPassed = staff.cur.c==='pass'&&staff.cur.s==='pass'&&staff.cur.o==='pass';
  const beltScore    = bIdx+1;
  const promoRecommended = beltScore>=3 && allCurPassed && calcTotalPSStars(staff)>=1;
  let summary='';
  if(gatesLeft===0 && win.status==='open'){
    summary=`All ${nb} Belt gates cleared – eligible to apply for ${nb} Belt certification now.`;
  } else if(gatesLeft===0 && win.status==='closed'){
    summary=`All ${nb} Belt gates cleared. Window reopens in ${win.daysUntilOpen||'--'} days.`;
  } else if(win.status==='locked'){
    summary=`Complete all 3 current ${staff.belt} Belt assessments before advancing to ${nb}.`;
  } else {
    summary=`${gatesLeft} gate${gatesLeft>1?'s':''} remaining for ${nb} Belt. Estimated ${totalWeeks} week${totalWeeks!==1?'s':''} to completion.`;
  }
  return {
    summary,
    promotionRecommended: promoRecommended,
    projectedWeeks: totalWeeks,
    waitWeeks,
    weeksForGates,
    gatesLeft,
    nextBelt: nb,
    confidence: historyGates>3?'High':historyGates>1?'Medium':'Low'
  };
}

// ── SYSTEM HELPERS ────────────────────────────────────────────────────────────
function getSystem(sid){  return (DB.systems||[]).find(s=>s.id===sid); }
function systemFacs(sid){ return DB.facilities.filter(f=>f.systemId===sid); }
function systemStaff(sid){ return staffOf(null).filter(s=>{ const f=getFac(s.fid); return f&&f.systemId===sid; }); }
function getFacsByAssessor(uid){ const u=DB.users.find(x=>x.id===uid); return u&&u.assignedFids ? DB.facilities.filter(f=>(u.assignedFids||[]).includes(f.id)) : []; }


// ── Facility Type Definitions ────────────────────────────────────────────
const FACILITY_TYPES = {
  asc:       {label:'ASC',           color:'#7c3aed', bg:'rgba(124,58,237,.1)', abbr:'ASC', desc:'Ambulatory Surgery Center'},
  community: {label:'Community',     color:'#0891b2', bg:'rgba(8,145,178,.1)',  abbr:'COM', desc:'Small Community Hospital'},
  regional:  {label:'Regional',      color:'#16a34a', bg:'rgba(22,163,74,.1)',  abbr:'REG', desc:'Regional Medical Center'},
  academic:  {label:'Academic',      color:'#d97706', bg:'rgba(217,119,6,.1)',  abbr:'ACM', desc:'Academic / Teaching Hospital'},
  system:    {label:'System Campus', color:'#dc2626', bg:'rgba(220,38,38,.1)',  abbr:'SYS', desc:'Health System Campus'},
};

function facTypeBadge(fac) {
  if(!fac||!fac.type) return '';
  const t = FACILITY_TYPES[fac.type]||FACILITY_TYPES.community;
  return '<span style="display:inline-block;padding:1px 7px;border-radius:10px;font-size:9.5px;font-weight:700;background:'+t.bg+';color:'+t.color+';border:1px solid '+t.color+'40;letter-spacing:.04em">'+t.abbr+'</span>';
}

function facTypeLabel(fac) {
  if(!fac||!fac.type) return 'Community';
  return (FACILITY_TYPES[fac.type]||FACILITY_TYPES.community).label;
}

