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
function fullName(s){ return `${s.first} ${s.last}`; }
function beltIdx(b){ return BELT_ORDER.indexOf(b); }
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
