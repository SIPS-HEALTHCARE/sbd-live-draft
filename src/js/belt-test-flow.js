/* ============================================================================
 * belt-test-flow.js — Dynamic Belt Test candidate delivery (Track A4)
 *
 * Loaded AFTER ui-views.js. Reuses that file's assessment plumbing:
 *   showAssessorPinGate(staffId,'belt',cb) · #placement-overlay/#placement-content ·
 *   startAssessmentTimer() (branches on ASSESSMENT_SESSION.type==='belt') ·
 *   hidePlacementOverlay() · scoreSimulationWithAI() · scoreByKeywords().
 * Scoring is delegated to BeltTestEngine (belt-test-engine.js).
 *
 * Candidate path: approved Competency+Simulation gates -> PIN gate -> server
 * generates the test (SB.generateBeltTest) -> PA-style delivery -> submit
 * (MCQs graded locally, 20 sims AI-scored in chunks w/ keyword fallback) ->
 * BeltTestEngine.scoreBeltTest -> persist result (PENDING_REVIEW) -> completion
 * screen. Per spec §11 the candidate NEVER sees the suggested belt.
 * ==========================================================================*/

let BT = JSON.parse(localStorage.getItem('sbd_bt_state') || 'null') || {
  active: false,
  staffId: null,
  targetBelt: null,
  testId: null,
  test: null,        // { target_belt, questions:{knowledge:[],simulation:[]} }
  items: null,       // flattened delivery list
  answers: {},       // { questionId: optionIndex | textString }
  currentQ: 0,
  submitting: false,
  submitted: false
};

function saveBTState(){ try{ localStorage.setItem('sbd_bt_state', JSON.stringify(BT)); }catch(e){} }
function resetBTState(){
  BT = { active:false, staffId:null, targetBelt:null, testId:null, test:null, items:null, answers:{}, currentQ:0, submitting:false, submitted:false };
  saveBTState();
}

// Eligibility: approved Competency AND Simulation for the target belt, and no
// result already pending assessor review for that belt.
function btEligible(staffId, targetBelt){
  if(!targetBelt) return false;
  const hasC = DB.queue.some(q => q.sid===staffId && q.targetBelt===targetBelt && q.type==='Competency' && q.status==='approved');
  const hasS = DB.queue.some(q => q.sid===staffId && q.targetBelt===targetBelt && q.type==='Simulation' && q.status==='approved');
  const pending = (DB.beltTestResults||[]).some(r => r.staffId===staffId && r.targetBelt===targetBelt && r.status==='PENDING_REVIEW');
  return hasC && hasS && !pending;
}

// Entry / resume card for renderSStudy.
function beltTestEntryCard(s, targetBelt){
  if(!s || !targetBelt) return '';
  const resuming = BT.active && BT.staffId===s.id && BT.targetBelt===targetBelt && !BT.submitted;
  if(!resuming && !btEligible(s.id, targetBelt)) return '';
  const label = resuming ? 'Resume Belt Test' : `Begin ${targetBelt} Belt Test`;
  const action = resuming ? `btResume()` : `startBeltTest('${s.id}','${targetBelt}')`;
  const sub = resuming
    ? 'You have a belt test in progress. Continue where you left off.'
    : `Your Competency and Simulation gates for ${targetBelt} Belt are approved. This proctored test requires an assessor PIN to begin.`;
  return `<div style="background:rgba(139,92,246,.08);border:1.5px solid rgba(139,92,246,.4);border-radius:var(--r);padding:14px 16px;margin-bottom:14px">
    <div style="font-size:12.5px;font-weight:800;color:#a78bfa;margin-bottom:5px">&#127894; Dynamic Belt Test Available</div>
    <div style="font-size:12px;color:var(--txt2);margin-bottom:10px;line-height:1.55">${sub}</div>
    <button class="btn btn-sm" style="background:#8b5cf6;color:#fff;border:none" onclick="${action}">${label}</button>
  </div>`;
}

// ── Launch ──────────────────────────────────────────────────────────────────
function startBeltTest(staffId, targetBelt){
  if(!IS_LIVE){ toast('Belt test requires live mode.','err'); return; }
  showAssessorPinGate(staffId, 'belt', function(){ btOnAuthorized(staffId, targetBelt); });
}

async function btOnAuthorized(staffId, targetBelt){
  _btOpenOverlay();
  document.getElementById('placement-content').innerHTML = _btLoading('Preparing your unique belt test…');
  try {
    const res = await SB.generateBeltTest(staffId, targetBelt);
    const row = res && res.test ? res.test : res;
    if(!row || !row.questions) throw new Error(res && res.error ? res.error : 'Test generation failed.');
    BT.active = true;
    BT.staffId = staffId;
    BT.targetBelt = targetBelt;
    BT.testId = row.id;
    BT.test = { target_belt: row.target_belt, questions: row.questions };
    BT.items = _btFlatten(row.questions);
    BT.answers = {};
    BT.currentQ = 1;
    BT.submitting = false;
    BT.submitted = false;
    saveBTState();
    renderBTScreen();
    startAssessmentTimer();
  } catch(e){
    document.getElementById('placement-content').innerHTML = `
      <div style="text-align:center;padding:48px 20px">
        <div style="font-size:18px;font-weight:800;color:#fca5a5;margin-bottom:10px">Could not start belt test</div>
        <div style="font-size:13px;color:#94a3b8;margin-bottom:24px;line-height:1.6">${(e.message||'Please ask your assessor to verify your Competency and Simulation gates are approved, then try again.')}</div>
        <button class="btn btn-ghost" onclick="hidePlacementOverlay()">Close</button>
      </div>`;
  }
}

function btResume(){
  if(!BT.active || !BT.test){ toast('No belt test in progress.','err'); return; }
  if(!ASSESSMENT_SESSION || ASSESSMENT_SESSION.type!=='belt'){
    // Session is in-memory only; after a reload it is gone -> re-authorize.
    showAssessorPinGate(BT.staffId, 'belt', function(){ _btOpenOverlay(); renderBTScreen(); startAssessmentTimer(); });
    return;
  }
  _btOpenOverlay(); renderBTScreen(); startAssessmentTimer();
}

function _btOpenOverlay(){
  const overlay = document.getElementById('placement-overlay');
  overlay.classList.remove('hidden');
  overlay.style.display = 'flex';
  document.body.classList.add('placement-active');
  if(!document.getElementById('pa-timer')){
    const tb = document.createElement('div');
    tb.id = 'pa-timer';
    tb.style.cssText = "position:fixed;top:12px;right:12px;z-index:10000;background:rgba(139,92,246,.15);border:1.5px solid rgba(139,92,246,.5);padding:8px 14px;border-radius:10px;font-family:monospace;font-size:14px;font-weight:700;color:#f1f5f9";
    tb.textContent = 'Time remaining: --:--';
    overlay.appendChild(tb);
  }
}

// Flatten {knowledge:[40], simulation:[20]} into one ordered delivery list.
function _btFlatten(questions){
  const k = (questions.knowledge||[]).map(q => ({ id:q.id, type:'knowledge', q:q.q, options:q.options, level:q.level, slot:q.slot }));
  const s = (questions.simulation||[]).map(q => ({ id:q.id, type:'simulation', q:q.scenario, rubric:q.rubric||[], level:q.level, slot:q.slot }));
  return k.concat(s);
}

function _btLoading(msg){
  return `<div style="text-align:center;padding:60px 0">
    <div style="width:56px;height:56px;border:3px solid rgba(139,92,246,.2);border-top:3px solid #8b5cf6;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 24px"></div>
    <div style="font-size:16px;font-weight:700;color:#f1f5f9;margin-bottom:8px">${msg}</div>
    <div style="font-size:13px;color:#64748b">This takes just a moment.</div>
  </div>`;
}

// ── Delivery screen (modeled on renderPAScreen) ──────────────────────────────
function renderBTScreen(){
  if(BT.submitted){ renderBTComplete(); return; }
  const items = BT.items || [];
  const totalQ = items.length;
  const q = items[BT.currentQ - 1];
  if(!q) return;
  const pct = Math.round((BT.currentQ / totalQ) * 100);
  const isLast = BT.currentQ === totalQ;
  const savedAns = BT.answers[q.id];
  let qHtml = '';
  if(q.type === 'knowledge'){
    qHtml = `<div style="margin-bottom:20px">${q.options.map((opt,i)=>`
      <label style="display:flex;align-items:flex-start;gap:12px;padding:12px 14px;border-radius:8px;cursor:pointer;border:1.5px solid ${savedAns===i?'#a78bfa':'rgba(255,255,255,.07)'};background:${savedAns===i?'rgba(139,92,246,.12)':'rgba(255,255,255,.03)'};margin-bottom:8px;transition:.12s" onclick="btSelectKnowledge('${q.id}',${i})">
        <div style="width:18px;height:18px;border-radius:50%;border:2px solid ${savedAns===i?'#a78bfa':'#475569'};background:${savedAns===i?'#8b5cf6':'transparent'};flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center">${savedAns===i?'<div style="width:8px;height:8px;border-radius:50%;background:#fff"></div>':''}</div>
        <span style="font-size:13.5px;color:#e2e8f0;line-height:1.5">${opt}</span>
      </label>`).join('')}</div>`;
  } else {
    const charCount = (savedAns||'').length, minChars = 80;
    qHtml = `<div style="margin-bottom:20px">
      <div style="font-size:11px;color:#64748b;margin-bottom:8px;font-style:italic">Describe your approach in your own words. Be specific.</div>
      <textarea id="bt-sim-input" style="width:100%;min-height:140px;background:#0e1328;border:1.5px solid rgba(139,92,246,.3);border-radius:8px;padding:12px 14px;color:#e2e8f0;font-size:13.5px;line-height:1.6;resize:vertical;font-family:'Poppins',sans-serif;box-sizing:border-box" placeholder="Type your response here..." oninput="btSimInput('${q.id}',this.value)">${savedAns||''}</textarea>
      <div style="margin-top:6px"><div id="bt-sim-hint" style="font-size:11px;color:${charCount<minChars?'#f59e0b':'#22c55e'}">${charCount<minChars?`Minimum ${minChars} characters (${charCount}/${minChars})`:'Response recorded'}</div></div>
    </div>`;
  }
  const canContinue = q.type==='knowledge' ? savedAns!==undefined : (savedAns||'').length >= 80;
  document.getElementById('placement-content').innerHTML = `
    <div style="margin-bottom:28px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
        <div style="font-size:11px;font-weight:700;color:#8b5cf6;letter-spacing:.06em">${BT.targetBelt.toUpperCase()} BELT TEST</div>
        <div style="flex:1;height:4px;background:rgba(139,92,246,.15);border-radius:2px"><div style="height:4px;background:linear-gradient(90deg,#8b5cf6,#a78bfa);border-radius:2px;width:${pct}%;transition:width .3s"></div></div>
        <div style="font-size:11px;color:#64748b;font-weight:600">Q${BT.currentQ} / ${totalQ}</div>
      </div>
      <div style="font-size:11.5px;font-weight:600;color:#64748b;margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em">${q.type==='knowledge'?'Knowledge Check':'Situational Response'}</div>
      <div style="font-size:16px;font-weight:600;color:#f1f5f9;line-height:1.55;margin-bottom:22px">${q.q}</div>
      ${qHtml}
    </div>
    <div style="display:flex;gap:12px;justify-content:space-between;align-items:center;flex-wrap:wrap">
      <button onclick="btPrev()" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:12px 22px;font-size:13px;font-weight:600;color:#94a3b8;cursor:pointer;font-family:'Poppins',sans-serif;visibility:${BT.currentQ<=1?'hidden':'visible'}">Back</button>
      <button onclick="btNext()" id="bt-next-btn" style="background:${canContinue?'#8b5cf6':'rgba(139,92,246,.3)'};border:none;border-radius:8px;padding:12px 28px;font-size:13px;font-weight:700;color:${canContinue?'#fff':'rgba(255,255,255,.4)'};cursor:${canContinue?'pointer':'not-allowed'};font-family:'Poppins',sans-serif;transition:.15s">${isLast?'Submit Belt Test':'Next Question'}</button>
    </div>`;
}

function btSelectKnowledge(qId, idx){ BT.answers[qId] = idx; saveBTState(); renderBTScreen(); }
function btSimInput(qId, val){
  BT.answers[qId] = val; saveBTState();
  const minChars = 80;
  const hint = document.getElementById('bt-sim-hint');
  const btn = document.getElementById('bt-next-btn');
  if(hint){ hint.textContent = val.length<minChars?`Minimum ${minChars} characters (${val.length}/${minChars})`:'Response recorded'; hint.style.color = val.length<minChars?'#f59e0b':'#22c55e'; }
  if(btn){ const ok = val.length>=minChars; btn.style.background=ok?'#8b5cf6':'rgba(139,92,246,.3)'; btn.style.color=ok?'#fff':'rgba(255,255,255,.4)'; btn.style.cursor=ok?'pointer':'not-allowed'; }
}
function btNext(){
  const items = BT.items || [];
  const q = items[BT.currentQ - 1];
  const ans = BT.answers[q.id];
  if(q.type==='knowledge' && ans===undefined) return;
  if(q.type==='simulation' && (!ans || ans.length < 80)) return;
  if(BT.currentQ >= items.length){ submitBeltTest(); }
  else { BT.currentQ++; saveBTState(); renderBTScreen(); }
}
function btPrev(){ if(BT.currentQ<=1) return; BT.currentQ--; saveBTState(); renderBTScreen(); }

// ── Submit + score ───────────────────────────────────────────────────────────
async function submitBeltTest(){
  if(BT.submitting) return;
  BT.submitting = true; saveBTState();
  document.getElementById('placement-content').innerHTML = _btLoading('Scoring your responses…');

  // MCQ answers (id -> selected index) and sim items for AI scoring.
  const mcqAnswers = {};
  const simItems = [];
  (BT.items||[]).forEach(it => {
    if(it.type==='knowledge'){ if(BT.answers[it.id]!==undefined) mcqAnswers[it.id] = BT.answers[it.id]; }
    else simItems.push(it);
  });

  let simScores;
  try { simScores = await _btScoreSims(simItems, BT.answers); }
  catch(e){ simScores = {}; simItems.forEach(q => { simScores[q.id] = scoreByKeywords(BT.answers[q.id]||'', q.rubric||[]); }); }

  const result = BeltTestEngine.scoreBeltTest(BT.test, mcqAnswers, simScores);
  const s = getStaff(BT.staffId);
  const submittedAt = new Date().toISOString();

  try {
    await SB.insertBeltTestResult(mapBeltTestResultToBackend(result, {
      testId: BT.testId, staffId: BT.staffId, fid: s ? s.fid : null,
      targetBelt: BT.targetBelt, submittedAt
    }));
    await SB.markBeltTestSubmitted(BT.testId).catch(()=>{});
    if(ASSESSMENT_SESSION.token){
      SB.completeAssessmentSession(ASSESSMENT_SESSION.token).catch(()=>{});
      if(typeof stopAssessmentKeepAlive === 'function') stopAssessmentKeepAlive();
      ASSESSMENT_SESSION = { token:null, sessionId:null, assessorName:null, facilityId:null, expiresAt:null, type:null };
    }
    // Keep a local mirror so the entry card hides immediately (PENDING_REVIEW).
    if(!DB.beltTestResults) DB.beltTestResults = [];
    DB.beltTestResults.push({ staffId: BT.staffId, fid: s?s.fid:null, targetBelt: BT.targetBelt, status:'PENDING_REVIEW', submittedAt });
    BT.submitted = true; BT.submitting = false; BT.active = false; saveBTState();
    renderBTComplete();
  } catch(e){
    BT.submitting = false; saveBTState();
    if(typeof handleSyncError==='function') handleSyncError(e, 'Belt test submit');
    alert('Your responses are saved on this device, but submission failed (session may have expired). Ask your assessor for a new PIN to resubmit.');
  }
}

async function _btScoreSims(simItems, answers){
  const scores = {};
  const CHUNK = 5;
  for(let i=0; i<simItems.length; i+=CHUNK){
    const chunk = simItems.slice(i, i+CHUNK);
    const settled = await Promise.allSettled(chunk.map(q => scoreSimulationWithAI(q.q, answers[q.id]||'')));
    chunk.forEach((q,j) => {
      const r = settled[j];
      const kw = scoreByKeywords(answers[q.id]||'', q.rubric||[]);
      scores[q.id] = (r.status==='fulfilled' && r.value && r.value.score!=null) ? r.value.score : kw;
    });
  }
  return scores;
}

// Completion screen — candidate does NOT see the suggested belt (spec §11).
function renderBTComplete(){
  document.getElementById('placement-content').innerHTML = `
    <div style="text-align:center;padding:20px 0 32px">
      <div style="width:72px;height:72px;background:rgba(34,197,94,.12);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:32px">&#10003;</div>
      <div style="font-size:24px;font-weight:800;color:#f1f5f9;margin-bottom:10px">Belt Test Submitted</div>
      <div style="font-size:14px;color:#94a3b8;line-height:1.65;max-width:480px;margin:0 auto 28px">
        Your responses have been submitted for assessor review. A certified SIPS assessor will evaluate your results and confirm your belt outcome. You'll be notified on your dashboard once the review is complete.
      </div>
      <button onclick="btGoToDashboard()" style="background:#8b5cf6;border:none;border-radius:10px;padding:14px 36px;font-size:14px;font-weight:700;color:#fff;cursor:pointer;font-family:'Poppins',sans-serif">Go to My Dashboard</button>
    </div>`;
}

function btGoToDashboard(){
  hidePlacementOverlay();
  resetBTState();
  if(typeof sNav==='function'){
    const nav = document.querySelector('#s-portal .nav-item[data-view="s-dashboard"]');
    if(nav) sNav(nav, 's-dashboard', 'My Dashboard');
  }
}

if (typeof window !== 'undefined') {
  Object.assign(window, {
    BT, startBeltTest, btResume, btEligible, beltTestEntryCard,
    renderBTScreen, btSelectKnowledge, btSimInput, btNext, btPrev,
    submitBeltTest, renderBTComplete, btGoToDashboard
  });
}
