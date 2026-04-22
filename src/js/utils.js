const Security = {
  sanitize(str){
    const d = document.createElement('div');
    d.textContent = String(str||'');
    return d.innerHTML;
  },
  isEmail(str){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str); },
  isSafeId(str){ return /^[a-zA-Z0-9_-]+$/.test(str); },
  _rl:{},
  rateLimit(key, max=5, ms=60000){
    const now = Date.now();
    if(!this._rl[key]) this._rl[key]=[];
    this._rl[key] = this._rl[key].filter(t => now-t < ms);
    if(this._rl[key].length >= max) return false;
    this._rl[key].push(now);
    return true;
  }
};

function toast(msg,type='info'){
  const t = document.getElementById('toast');
  if(!t) return;
  t.textContent = msg;
  if(type==='err'){
    t.style.background = 'var(--err-bg)';
    t.style.color = 'var(--err)';
    t.style.borderColor = 'var(--err-bd)';
  } else {
    t.style.background = 'var(--s1)';
    t.style.color = 'var(--txt)';
    t.style.borderColor = 'var(--gold)';
  }
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 3000);
}

function todayStr(){ return new Date().toISOString().slice(0,10); }
function dateLabel(d){ const dt=new Date(d+'T12:00:00'); return dt.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}); }
function dateShort(d){ const dt=new Date(d+'T12:00:00'); return dt.toLocaleDateString('en-US',{month:'short',day:'numeric'}); }
function add30Days(fromStr, n){
  const dates=[];
  const d=new Date(fromStr+'T12:00:00');
  for(let i=0;i<(n||30);i++){
    dates.push(new Date(d).toISOString().slice(0,10));
    d.setDate(d.getDate()+1);
  }

  return dates;
}
function fmtTime(t){
  if(!t) return '';
  const [h,m]=t.split(':').map(Number);
  const ap=h<12?'AM':'PM'; const h12=h===0?12:h>12?h-12:h;
  return h12+':'+(m<10?'0'+m:m)+' '+ap;
}

function staffOf(fid){ return fid ? DB.staff.filter(s=>s.fid===fid) : DB.staff; }
function getFac(id){ return DB.facilities.find(f=>f.id===id); }
function getStaff(id){ return DB.staff.find(s=>s.id===id); }
function fullName(s){ 
  const f = (s.first && s.first !== 'undefined') ? s.first.trim() : '';
  const l = (s.last && s.last !== 'undefined') ? s.last.trim() : '';
  return `${f} ${l}`.trim() || 'Unknown'; 
}
function userInitials(s){ 
  const f = (s.first && s.first !== 'undefined') ? s.first.trim() : '';
  const l = (s.last && s.last !== 'undefined') ? s.last.trim() : '';
  return ((f[0]||'') + (l[0]||'')).toUpperCase() || '?';
}function beltIdx(b){ return BELT_ORDER.indexOf(b); }
function nextBelt(b){ const i=beltIdx(b); return i<5?BELT_ORDER[i+1]:null; }
function daysAt(since){ return Math.round((new Date()-new Date(since))/(1000*60*60*24)); }
function gatesStatus(g){ const vals=Object.values(g||{}); const p=vals.filter(x=>x==='pass').length; const f=vals.filter(x=>x==='fail').length; return {p,f,rem:3-p}; }

function facStats(fid){
  const st=staffOf(fid);
  const n=st.length;
  if(!n)return{n:0,greenPct:0,avgBelt:0,aboveGreen:0,avgPoints:0,totalPoints:0};
  const aboveGreen=st.filter(s=>beltIdx(s.belt)>=2).length;
  const avgBelt=st.reduce((a,s)=>a+BELT_VAL[s.belt],0)/n;
  const totalPoints=st.reduce((a,s)=>a+(s.pts||0),0);
  return{
    n,
    greenPct:Math.round(aboveGreen/n*100),
    avgBelt:avgBelt.toFixed(2),
    aboveGreen,
    avgPoints:Math.round(totalPoints/n),
    totalPoints
  };
}

function togglePasswordVisibility(inputId, iconEl) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  if (inp.type === 'password') {
    inp.type = 'text';
    iconEl.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
  } else {
    inp.type = 'password';
    iconEl.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
  }
}
// ============================================================ SCHEDULE & ATTENDANCE MODULE

// ── Constants
// ── Default shifts (overridable per facility via DB.facilityShifts)
const SHIFT_DEF_DEFAULT = {
  AM:  {id:'AM',  label:'AM',  name:'Morning',   start:'06:00', end:'14:00', icon:'🌅', color:'#f97316', bg:'rgba(249,115,22,.1)',  bd:'rgba(249,115,22,.3)'},
  PM:  {id:'PM',  label:'PM',  name:'Afternoon', start:'14:00', end:'22:00', icon:'☀️', color:'#eab308', bg:'rgba(234,179,8,.1)',   bd:'rgba(234,179,8,.3)'},
  NOC: {id:'NOC', label:'NOC', name:'Night',      start:'22:00', end:'06:00', icon:'🌙', color:'#818cf8', bg:'rgba(129,140,248,.1)', bd:'rgba(129,140,248,.3)'},
};
if(!DB.facilityShifts) DB.facilityShifts = {}; // keyed by fid, value = {shiftId: shiftDef}

// Get shifts for a facility  --  falls back to defaults
function getFacilityShifts(fid){
  const custom = DB.facilityShifts[fid];
  if(custom && Object.keys(custom).length>0) return custom;
  return SHIFT_DEF_DEFAULT;
}
// Backward compat
const SHIFT_DEF = SHIFT_DEF_DEFAULT;

// fmtTime() — defined above (line ~50). Not re-declared here.
const ATTEND_POINTS = { present:10, late:5, absent:-15, pto:0, excused:0, coverage:25 };
const ATTEND_LABELS = { present:'Present', late:'Late', absent:'Absent', pto:'PTO', excused:'Excused', coverage:'Coverage' };
const ATTEND_COLORS = { present:'#22c55e', late:'#f59e0b', absent:'#ef4444', pto:'#a78bfa', excused:'#22d3ee', coverage:'#60a5fa' };

// ── Storage on DB
if(!DB.schedule) DB.schedule = [];
if(!DB.attendance) DB.attendance = [];
if(!DB.psCompletionRequests) DB.psCompletionRequests = [];
if(!DB.schNextId) DB.schNextId = 1;
if(!DB.attNextId) DB.attNextId = 1;

// ── Helpers (todayStr, dateLabel, dateShort, add30Days defined above — not re-declared)
function getSchedule(fid,date,shift){
  return DB.schedule.find(s=>s.fid===fid&&s.date===date&&s.shift===shift)||null;
}
function getAttendance(fid,date,shift,staffId){
  return DB.attendance.find(a=>a.fid===fid&&a.date===date&&a.shift===shift&&a.staffId===staffId)||null;
}
function getSchedulesForFid(fid, startDate, endDate){
  return DB.schedule.filter(s=>s.fid===fid&&s.date>=startDate&&s.date<=endDate);
}
function getStaffSchedule(staffId, startDate, endDate){
  return DB.schedule.filter(s=>s.assignedStaff.includes(staffId)&&s.date>=startDate&&s.date<=endDate);
}
function calcAttendancePoints(staff){
  let pts=0;
  (DB.attendance||[]).filter(a=>a.staffId===staff.id).forEach(a=>{
    if(a.status==='present')  pts += ATTEND_POINTS.present;
    if(a.status==='late')     pts += ATTEND_POINTS.late;
    if(a.status==='absent')   pts += ATTEND_POINTS.absent;
    if(a.status==='coverage') pts += ATTEND_POINTS.present + ATTEND_POINTS.coverage;
    // pto and excused = 0 points (no penalty, no gain)
  });
  return pts;
}

