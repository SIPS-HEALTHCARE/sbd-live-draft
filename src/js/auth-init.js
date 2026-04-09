
// ── Client-Side Fallback Breakdown Generator ──
function l3GenerateLocalBreakdown(title, text){
  // Split into paragraphs and create a structured breakdown
  const chunks = text.split(/(?<=[.!?])\s+(?=[A-Z])/).filter(s=>s.length>20);
  if(chunks.length < 2) return '<p>Review the section content above carefully. Focus on understanding each term and process described, and how they connect to patient safety in the SPD environment.</p>';

  let html = '<p><strong>Key Concepts in This Section:</strong></p>';
  // Take first ~4 meaningful chunks and reframe them
  const selected = chunks.slice(0, Math.min(chunks.length, 6));
  selected.forEach((chunk, i)=>{
    const trimmed = chunk.length > 300 ? chunk.substring(0, 300)+'...' : chunk;
    if(i === 0) html += '<p>'+trimmed+'</p>';
    else html += '<p>'+trimmed+'</p>';
  });
  html += '<p><strong>Study Tip:</strong> Re-read this section and focus on any terms you cannot define from memory. If you can explain the main concept to another technician without looking at the guide, you have mastered it.</p>';
  return html;
}

// ── Client-Side Fallback Synopsis Generator ──
function l3GenerateLocalSynopsis(title, text){
  const cleanTitle = title.replace(/SECTION \d+:|STERILE BY DESIGN/gi,'').trim();
  // Get first 2-3 sentences as the core idea
  const sentences = text.split(/[.!?]+/).map(s=>s.trim()).filter(s=>s.length>15);
  const core = sentences.slice(0, 3).join('. ')+'.';
  const capped = core.length > 400 ? core.substring(0,400)+'...' : core;

  let html = '<p><strong>Core Takeaway'+(cleanTitle?' for '+cleanTitle:'')+':</strong> '+capped+'</p>';
  html += '<p>The key point is to understand not just what is described here, but <strong>why it matters for patient safety</strong>. Every process, term, and protocol in the SBD system exists to prevent harm. If you can connect this section back to that principle, you understand it.</p>';
  return html;
}

// ── Read State Helpers ──
function l3GetReadSections(){
  const u = ST.user;
  if(!u) return {};
  const ob = getOnboardingState(u.id);
  return (ob && ob.readSections) ? ob.readSections : {};
}
function l3GetCheckResults(){
  const u = ST.user;
  if(!u) return {};
  const ob = getOnboardingState(u.id);
  return (ob && ob.checkResults) ? ob.checkResults : {};
}
function l3IsRead(key){ return !!l3GetReadSections()[key]; }
function l3GetReadCount(prefix, total){
  const rs = l3GetReadSections();
  let c = 0;
  for(let i=0; i<total; i++) if(rs[prefix+i]) c++;
  return c;
}

// ══════════════════════════════════════════════════════════════
// MARK SECTION READ + TRIGGER CHECK
// ══════════════════════════════════════════════════════════════
function l3MarkSectionRead(type, id, idx){
  const key = type+'_'+id+'_'+idx;
  const rs = l3GetReadSections();
  if(rs[key]) return;
  rs[key] = new Date().toISOString();
  const u = ST.user;
  if(u) setOnboardingState(u.id, { readSections: rs });

  // Update UI immediately
  l3RefreshNavDots(type, id);
  l3RefreshProgressBar(type, id);
  l3RefreshMarkBtn(type, id, idx);

  // Generate and show comprehension check
  l3TriggerCheck(type, id, idx, false);
}

// ══════════════════════════════════════════════════════════════
// AI-POWERED COMPREHENSION CHECK GENERATOR
// ══════════════════════════════════════════════════════════════
async function l3TriggerCheck(type, id, idx, forceNew){
  const key = type+'_'+id+'_'+idx;
  const contentEl = l3GetContentEl(type, id);
  if(!contentEl) return;

  // Remove any existing check/aid container for this key
  const existingCheck = document.getElementById('l3-zone-'+key);
  if(existingCheck) existingCheck.remove();

  // Already passed and not forcing new? Show summary + aids
  const cr = l3GetCheckResults();
  if(!forceNew && cr[key] && cr[key].passed){
    l3ShowStudyAids(type, id, idx);
    return;
  }

  // Insert loading skeleton
  const zoneId = 'l3-zone-'+key;
  contentEl.insertAdjacentHTML('beforeend', `
    <div id="${zoneId}">
      <div class="l3-check-wrap" id="l3-check-${key}">
        <div class="l3-check-hd">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--gold)"><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="12" r="10"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span class="l3-check-title">Quick Check</span>
          <span style="margin-left:auto;font-size:10px;color:var(--txt3)">Generating...</span>
        </div>
        <div class="l3-check-body">
          <div class="l3-skeleton wide"></div>
          <div class="l3-skeleton med"></div>
          <div class="l3-skeleton block"></div>
          <div class="l3-skeleton block"></div>
          <div class="l3-skeleton block"></div>
          <div class="l3-skeleton block"></div>
        </div>
      </div>
    </div>
  `);
  const zone = document.getElementById(zoneId);
  if(zone) zone.scrollIntoView({behavior:'smooth', block:'center'});

  // Try API-generated check
  const sec = l3GetSectionContent(type, id, idx);
  let checkData = null;

  if(sec.text.length > 50){
    const sysPrompt = 'You are a sterile processing department (SPD) training assessment generator for the Sterile By Design (SBD) belt certification system. Generate a single multiple-choice comprehension question that tests understanding of the provided curriculum section. Respond ONLY with a JSON object, no markdown fences, no preamble. The JSON must have exactly these fields: q (the question string), opts (array of exactly 4 answer strings), correct (integer 0-3 for the correct answer index), explain (string explaining why the correct answer is right, 1-2 sentences).';
    const userPrompt = 'Section Title: "'+sec.title+'"\n\nSection Content:\n'+sec.text+'\n\nGenerate one comprehension question about this specific content. Make it test real understanding, not just word recall. The wrong answers should be plausible but clearly wrong to someone who read carefully.';

    const raw = await l3CallAPI(sysPrompt, userPrompt);
    if(raw){
      try {
        const cleaned = raw.replace(/```json|```/g,'').trim();
        checkData = JSON.parse(cleaned);
        if(!checkData.q || !checkData.opts || checkData.opts.length !== 4 || typeof checkData.correct !== 'number' || !checkData.explain){
          checkData = null;
        }
      } catch(e){ checkData = null; }
    }
  }

  // Fallback to static check if API failed
  if(!checkData && L3_CHECKS[key]){
    checkData = L3_CHECKS[key];
  }

  // Final fallback: generate a local check from section content
  if(!checkData && sec.text.length > 50){
    checkData = l3GenerateLocalCheck(sec.title, sec.text);
  }

  // If still no check data, show study aids only
  if(!checkData){
    const zoneEl = document.getElementById(zoneId);
    if(zoneEl) zoneEl.innerHTML = '';
    l3ShowStudyAids(type, id, idx);
    return;
  }

  // Cache the generated check
  window._l3Cache[key+'_check'] = checkData;

  // Render the check
  l3RenderCheck(type, id, idx, checkData);
}

// ── Render Check UI ──
function l3RenderCheck(type, id, idx, checkData){
  const key = type+'_'+id+'_'+idx;
  const letters = ['A','B','C','D'];
  const optsHTML = checkData.opts.map((o,i)=>`
    <div class="l3-check-opt" onclick="l3AnswerCheck('${type}','${id}',${idx},${i})">
      <span class="l3-check-opt-letter">${letters[i]}.</span>
      <span>${o}</span>
    </div>
  `).join('');

  const checkEl = document.getElementById('l3-check-'+key);
  if(!checkEl) return;
  checkEl.innerHTML = `
    <div class="l3-check-hd">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--gold)"><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="12" r="10"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      <span class="l3-check-title">Quick Check</span>
    </div>
    <div class="l3-check-body">
      <div class="l3-check-q">${checkData.q}</div>
      <div class="l3-check-opts" id="l3-opts-${key}">${optsHTML}</div>
      <div id="l3-result-${key}"></div>
    </div>
  `;
  checkEl.scrollIntoView({behavior:'smooth', block:'center'});
}

// ── Answer Check ──
function l3AnswerCheck(type, id, idx, choiceIdx){
  const key = type+'_'+id+'_'+idx;
  const checkData = window._l3Cache[key+'_check'] || L3_CHECKS[key];
  if(!checkData) return;

  const isCorrect = choiceIdx === checkData.correct;
  const optsEl = document.getElementById('l3-opts-'+key);
  const resultEl = document.getElementById('l3-result-'+key);
  if(!optsEl || !resultEl) return;

  // Disable all options and highlight
  optsEl.querySelectorAll('.l3-check-opt').forEach((el,i)=>{
    el.style.pointerEvents = 'none';
    if(i === checkData.correct) el.classList.add('correct');
    if(i === choiceIdx && !isCorrect) el.classList.add('wrong');
  });

  // Save result
  const cr = l3GetCheckResults();
  cr[key] = { passed:isCorrect, choice:choiceIdx, at:new Date().toISOString() };
  const u = ST.user;
  if(u) setOnboardingState(u.id, { checkResults: cr });

  if(isCorrect){
    resultEl.innerHTML = `<div class="l3-check-result pass">
      <strong>Correct.</strong> ${checkData.explain}
    </div>`;
  } else {
    resultEl.innerHTML = `<div class="l3-check-result fail">
      <strong>Not quite.</strong> ${checkData.explain}
      <div style="margin-top:6px;font-size:11.5px;opacity:.85">Use the study aids below to review this section before moving on.</div>
    </div>`;
  }

  // Refresh nav dots
  setTimeout(()=> l3RefreshNavDots(type, id), 400);

  // Show study aids + new question option + continue button
  const zone = document.getElementById('l3-zone-'+key);
  if(zone){
    // Remove any existing aid area
    const existingAids = zone.querySelector('.l3-aids-area');
    if(existingAids) existingAids.remove();

    zone.insertAdjacentHTML('beforeend', `<div class="l3-aids-area">
      ${l3BuildStudyAidButtons(type, id, idx)}
      <div id="l3-aid-output-${key}"></div>
      <button class="l3-newq-btn" onclick="l3TriggerCheck('${type}','${id}',${idx},true)">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
        Try a Different Question
      </button>
      ${isCorrect ? `<div class="l3-continue-btn" onclick="l3DoAdvance('${type}','${id}',${idx})">
        Continue to Next Section
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </div>` : ''}
    </div>`);
  }
}

// ══════════════════════════════════════════════════════════════
// STUDY AID BUTTONS + AI-POWERED BREAKDOWN / SYNOPSIS
// ══════════════════════════════════════════════════════════════
function l3BuildStudyAidButtons(type, id, idx){
  const key = type+'_'+id+'_'+idx;
  return `<div class="l3-aid-row">
    <div class="l3-aid-btn" id="l3-abtn-detail-${key}" onclick="l3RequestBreakdown('${type}','${id}',${idx})">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
      Detailed Breakdown
    </div>
    <div class="l3-aid-btn" id="l3-abtn-synopsis-${key}" onclick="l3RequestSynopsis('${type}','${id}',${idx})">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
      Quick Synopsis
    </div>
  </div>`;
}

// ── Show Study Aids for already-read sections ──
function l3ShowStudyAids(type, id, idx){
  const key = type+'_'+id+'_'+idx;
  const contentEl = l3GetContentEl(type, id);
  if(!contentEl) return;

  let zone = document.getElementById('l3-zone-'+key);
  if(!zone){
    contentEl.insertAdjacentHTML('beforeend', `<div id="l3-zone-${key}"></div>`);
    zone = document.getElementById('l3-zone-'+key);
  }
  if(!zone) return;

  // Show passed check summary if available
  const cr = l3GetCheckResults();
  const cached = window._l3Cache[key+'_check'] || L3_CHECKS[key];
  let checkSummary = '';
  if(cr[key] && cr[key].passed && cached){
    const letters = ['A','B','C','D'];
    checkSummary = `<div class="l3-check-wrap" id="l3-check-${key}" style="animation:none">
      <div class="l3-check-hd"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--ok)"><path d="M20 6L9 17l-5-5"/></svg><span class="l3-check-title" style="color:var(--ok)">Check Passed</span></div>
      <div class="l3-check-body"><div class="l3-check-q" style="opacity:.7">${cached.q}</div>
      <div class="l3-check-result pass"><strong>${letters[cached.correct]}.</strong> ${cached.opts[cached.correct]}</div></div>
    </div>`;
  }

  zone.innerHTML = `
    ${checkSummary}
    <div class="l3-aids-area">
      ${l3BuildStudyAidButtons(type, id, idx)}
      <div id="l3-aid-output-${key}"></div>
      <button class="l3-newq-btn" onclick="l3TriggerCheck('${type}','${id}',${idx},true)">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
        Try a New Question
      </button>
    </div>
  `;
}

// ── Request Detailed Breakdown ──
async function l3RequestBreakdown(type, id, idx){
  const key = type+'_'+id+'_'+idx;
  const btn = document.getElementById('l3-abtn-detail-'+key);
  const output = document.getElementById('l3-aid-output-'+key);
  if(!output) return;
  if(btn) btn.classList.add('active');

  // Check cache first
  if(window._l3Cache[key+'_breakdown']){
    l3RenderAid(output, 'Detailed Breakdown', window._l3Cache[key+'_breakdown'], '#60a5fa');
    if(btn) btn.classList.remove('active');
    return;
  }

  // Show loading
  output.innerHTML = `<div class="l3-aid-container">
    <div class="l3-aid-hd"><span class="l3-aid-label" style="color:var(--blue)">Generating Breakdown...</span></div>
    <div class="l3-aid-body"><div class="l3-skeleton wide"></div><div class="l3-skeleton med"></div><div class="l3-skeleton wide"></div><div class="l3-skeleton short"></div><div class="l3-skeleton wide"></div><div class="l3-skeleton med"></div></div>
  </div>`;

  const sec = l3GetSectionContent(type, id, idx);
  const sysPrompt = 'You are an expert SPD (Sterile Processing Department) educator creating a detailed teaching breakdown for a curriculum section from the SBD (Sterile By Design) belt certification system. Write in clear, direct language. Use short paragraphs. Bold key terms with <strong> tags. Organize with clear topic transitions. Do not use headers or bullet points. Write 3-5 paragraphs that thoroughly explain every concept in the section. Assume the reader has no prior SPD experience. Wrap output in <p> tags.';
  const userPrompt = 'Section: "'+sec.title+'"\n\nContent:\n'+sec.text+'\n\nProvide a thorough, detailed breakdown of this section that explains every key concept, why it matters for patient safety, and how it connects to the broader SPD operation.';

  const result = await l3CallAPI(sysPrompt, userPrompt);
  if(btn) btn.classList.remove('active');

  if(result){
    window._l3Cache[key+'_breakdown'] = result;
    l3RenderAid(output, 'Detailed Breakdown', result, '#60a5fa');
  } else {
    // Local fallback breakdown
    const localResult = l3GenerateLocalBreakdown(sec.title, sec.text);
    window._l3Cache[key+'_breakdown'] = localResult;
    l3RenderAid(output, 'Detailed Breakdown', localResult, '#60a5fa');
  }
}

// ── Request Quick Synopsis ──
async function l3RequestSynopsis(type, id, idx){
  const key = type+'_'+id+'_'+idx;
  const btn = document.getElementById('l3-abtn-synopsis-'+key);
  const output = document.getElementById('l3-aid-output-'+key);
  if(!output) return;
  if(btn) btn.classList.add('active');

  if(window._l3Cache[key+'_synopsis']){
    l3RenderAid(output, 'Quick Synopsis', window._l3Cache[key+'_synopsis'], '#c49a20');
    if(btn) btn.classList.remove('active');
    return;
  }

  output.innerHTML = `<div class="l3-aid-container">
    <div class="l3-aid-hd"><span class="l3-aid-label" style="color:var(--gold)">Generating Synopsis...</span></div>
    <div class="l3-aid-body"><div class="l3-skeleton wide"></div><div class="l3-skeleton med"></div><div class="l3-skeleton short"></div></div>
  </div>`;

  const sec = l3GetSectionContent(type, id, idx);
  const sysPrompt = 'You are an SPD (Sterile Processing Department) educator creating a concise synopsis of a curriculum section from the SBD (Sterile By Design) belt certification system. Write a tight 2-3 paragraph summary that captures the essential takeaway: what this section teaches, why it matters, and the one thing the reader must remember. Use <strong> tags to bold the single most critical concept. Be direct and clear. Wrap output in <p> tags. No bullet points, no headers.';
  const userPrompt = 'Section: "'+sec.title+'"\n\nContent:\n'+sec.text+'\n\nProvide a short, clear synopsis that ties the main idea together so the reader walks away understanding the core point.';

  const result = await l3CallAPI(sysPrompt, userPrompt);
  if(btn) btn.classList.remove('active');

  if(result){
    window._l3Cache[key+'_synopsis'] = result;
    l3RenderAid(output, 'Quick Synopsis', result, '#c49a20');
  } else {
    // Local fallback synopsis
    const localResult = l3GenerateLocalSynopsis(sec.title, sec.text);
    window._l3Cache[key+'_synopsis'] = localResult;
    l3RenderAid(output, 'Quick Synopsis', localResult, '#c49a20');
  }
}

// ── Render Aid Container ──
function l3RenderAid(outputEl, label, htmlContent, accentColor){
  outputEl.innerHTML = `<div class="l3-aid-container">
    <div class="l3-aid-hd">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${accentColor}" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
      <span class="l3-aid-label" style="color:${accentColor}">${label}</span>
    </div>
    <div class="l3-aid-body">${htmlContent}</div>
  </div>`;
  outputEl.scrollIntoView({behavior:'smooth', block:'nearest'});
}

// ── Get Content Element Helper ──
function l3GetContentEl(type, id){
  if(type === 'belt'){
    // The Study & Practice curriculum viewer content pane
    const studyEl = document.getElementById('s-study');
    if(!studyEl) return null;
    return studyEl.querySelector('.cs-body')?.parentElement || null;
  } else {
    return document.getElementById('ps-content-'+id);
  }
}

// ── Manual Advance (after answering check) ──
function l3DoAdvance(type, id, idx){
  if(type === 'belt'){
    const sections = (FULL_CURRICULUM_DATA && FULL_CURRICULUM_DATA.belts && FULL_CURRICULUM_DATA.belts[id]) || [];
    const rs = l3GetReadSections();
    const prefix = 'belt_'+id+'_';
    for(let i = idx+1; i < sections.length; i++){
      if(!rs[prefix+i]){
        window._studySectionIdx = i;
        renderSStudy();
        return;
      }
    }
    const readCount = l3GetReadCount(prefix, sections.length);
    if(readCount >= sections.length){
      showToast('Belt Learner Guide complete! All sections read.', 'ok');
    }
  } else if(type === 'ps'){
    const data = (window._psCurrData && window._psCurrData[id]) || [];
    const rs = l3GetReadSections();
    const prefix = 'ps_'+id+'_';
    for(let i = idx+1; i < data.length; i++){
      if(!rs[prefix+i]){
        _psCurrNav(id, i);
        return;
      }
    }
  }
}

// ══════════════════════════════════════════════════════════════
// REFRESH + BUILD HELPERS (unchanged pattern, updated for new flow)
// ══════════════════════════════════════════════════════════════
function l3RefreshNavDots(type, id){
  const prefix = type+'_'+id+'_';
  const dots = document.querySelectorAll('.l3-nav-dot[data-prefix="'+prefix+'"]');
  const rs = l3GetReadSections();
  dots.forEach(dot=>{
    const secIdx = dot.getAttribute('data-secidx');
    const key = prefix+secIdx;
    const isActive = dot.classList.contains('active-sec');
    if(rs[key]){
      dot.className = 'l3-nav-dot ' + (isActive ? 'active-read' : 'read');
    }
  });
}

function l3RefreshProgressBar(type, id){
  const bar = document.getElementById('l3-bar-'+type+'-'+id);
  const pct = document.getElementById('l3-pct-'+type+'-'+id);
  if(!bar || !pct) return;
  const total = parseInt(bar.getAttribute('data-total')) || 1;
  const prefix = type+'_'+id+'_';
  const readCount = l3GetReadCount(prefix, total);
  const pctVal = Math.round((readCount/total)*100);
  bar.style.width = pctVal+'%';
  pct.textContent = readCount+'/'+total+' read ('+pctVal+'%)';
}

function l3RefreshMarkBtn(type, id, idx){
  const key = type+'_'+id+'_'+idx;
  const btn = document.getElementById('l3-mark-'+key);
  if(!btn) return;
  if(l3IsRead(key)){
    btn.className = 'l3-section-done completed';
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg> Section Read';
    btn.onclick = null;
  }
}

function l3BuildProgressHeader(type, id, totalSections){
  const prefix = type+'_'+id+'_';
  const readCount = l3GetReadCount(prefix, totalSections);
  const pctVal = totalSections > 0 ? Math.round((readCount/totalSections)*100) : 0;
  return `<div class="l3-progress-hd">
    <span class="l3-progress-label">Reading Progress</span>
    <div class="l3-progress-bar"><div class="l3-progress-fill" id="l3-bar-${type}-${id}" data-total="${totalSections}" style="width:${pctVal}%"></div></div>
    <span class="l3-progress-pct" id="l3-pct-${type}-${id}">${readCount}/${totalSections} read (${pctVal}%)</span>
  </div>`;
}

function l3BuildNavDot(type, id, secIdx, isActiveSec){
  const key = type+'_'+id+'_'+secIdx;
  const isRead = l3IsRead(key);
  const cls = isRead ? (isActiveSec ? 'active-read' : 'read') : 'unread';
  return `<span class="l3-nav-dot ${cls} ${isActiveSec?'active-sec':''}" data-prefix="${type}_${id}_" data-secidx="${secIdx}"></span>`;
}

function l3BuildMarkBtn(type, id, idx){
  const key = type+'_'+id+'_'+idx;
  const isRead = l3IsRead(key);
  if(isRead){
    return `<div class="l3-section-done completed" id="l3-mark-${key}">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg> Section Read
    </div>
    <div id="l3-zone-${key}"></div>
    <img src="" onerror="setTimeout(function(){ l3ShowStudyAids('${type}','${id}',${idx}); },80)" style="display:none">`;
  }
  return `<div class="l3-section-done" id="l3-mark-${key}" onclick="l3MarkSectionRead('${type}','${id}',${idx})">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg> I've Read This Section
  </div>
  <div id="l3-zone-${key}"></div>`;
}

// ── Welcome Overlay ──
function showWelcomeOverlay(){
  const u = ST.user;
  if(!u) return;

  // DEFENSIVE: If onboarding says we are done or skipped, do not show
  const ob = getOnboardingState(u.id);
  if(ob && (ob.tourCompleted || ob.tourSkipped)) {
    console.log('showWelcomeOverlay: Skipping redundant popup (already completed/skipped)');
    return;
  }

  // IMMEDIATELY mark as skipped so it never pops up again
  setOnboardingState(u.id, { tourSkipped: true, tourSkippedAt: new Date().toISOString() });

  const role = getTourRole();
  const roleLabels = {
    admin:'SBD OSBIP Admin Portal', hospital:'SBD OSBIP Department Portal', facility_admin:'SBD OSBIP Facility Admin Portal',
    staff_member:'SBD OSBIP Staff Portal', system_admin:'SBD OSBIP System Admin Portal'
  };
  document.getElementById('welcome-title').textContent = 'Welcome to Sterile By Design OS, ' + (u.name ? u.name.split(' ')[0] : 'there');
  document.getElementById('welcome-role').textContent = roleLabels[role] || 'SBD OSBIP Portal';
  const sub = role === 'staff_member'
    ? 'Your SBD OSBIP portal is ready. Take a quick tour to discover your dashboard, training tools, assessment tracker, and everything you need to grow.'
    : role === 'admin'
    ? 'Your SBD OSBIP admin portal is ready. Take a guided tour to explore facility oversight, staff management, assessments, reporting, and all your admin tools.'
    : role === 'system_admin'
    ? 'Your SBD OSBIP system portal is ready. Walk through your facilities dashboard, staff directory, scheduling tools, and reporting features.'
    : 'Your SBD OSBIP department portal is ready. Walk through staff tracking, belt monitoring, scheduling, assessments, and reporting tools.';
  document.getElementById('welcome-sub').textContent = sub;
  const overlay = document.getElementById('welcome-overlay');
  overlay.classList.add('open');
}

function onboardingStartTour(){
  document.getElementById('welcome-overlay').classList.remove('open');
  setTimeout(()=>{ tourStart(); }, 250);
}

function onboardingSkipTour(){
  const u = ST.user;
  document.getElementById('welcome-overlay').classList.remove('open');
  if(u) setOnboardingState(u.id, { tourSkipped:true, tourSkippedAt:new Date().toISOString() });
  // Show skip reminder banner
  setTimeout(()=>{
    const rem = document.getElementById('skip-reminder');
    rem.classList.add('show');
    OB.skipReminderTimer = setTimeout(()=>{ rem.classList.remove('show'); }, 6000);
  }, 600);
}

function onboardingLaunchTourFromReminder(){
  const rem = document.getElementById('skip-reminder');
  rem.classList.remove('show');
  if(OB.skipReminderTimer) clearTimeout(OB.skipReminderTimer);
  tourStart();
}

// ── Tour Engine ──
function tourStart(fromStep){
  const role = getTourRole();
  const prefix = getPortalPrefix();
  OB.steps = (TOUR_STEPS[role] || []).slice();
  OB.portalPrefix = prefix;
  OB.step = fromStep || 0;
  OB.tourRunning = true;
  if(OB.step >= OB.steps.length) OB.step = 0;
  document.getElementById('tour-overlay').classList.add('active');
  tourRender();
}

function tourRender(){
  const s = OB.steps[OB.step];
  if(!s){ tourFinish(); return; }
  const total = OB.steps.length;
  const pct = ((OB.step + 1) / total * 100).toFixed(0);

  // Update tooltip content
  document.getElementById('tour-step-badge').textContent = s.group + ' \u00B7 Step ' + (OB.step+1) + ' of ' + total;
  document.getElementById('tour-title').textContent = s.title;
  document.getElementById('tour-desc').textContent = s.desc;
  document.getElementById('tour-progress-fill').style.width = pct + '%';
  document.getElementById('tour-btn-back').style.display = OB.step > 0 ? 'inline-flex' : 'none';
  document.getElementById('tour-btn-next').textContent = OB.step === total - 1 ? 'Finish' : 'Next';

  // Dots
  let dots = '';
  for(let i=0;i<total;i++){
    const cls = i===OB.step ? 'tour-dot active' : i<OB.step ? 'tour-dot done' : 'tour-dot';
    dots += '<div class="'+cls+'"></div>';
  }
  document.getElementById('tour-dots').innerHTML = dots;

  // Find target element
  const prefix = OB.portalPrefix;
  const portalEl = document.getElementById(prefix+'-portal');
  if(!portalEl) return;

  const isMobile = window.innerWidth < 900;
  const isNavTarget = s.target.includes('data-view');
  const targetEl = portalEl.querySelector(s.target);

  // ── CLICK INTO THE TAB so the user sees the actual content ──
  if(isNavTarget && targetEl){
    // Temporarily hide tour overlay so the click can go through without interference
    const overlay = document.getElementById('tour-overlay');
    overlay.style.pointerEvents = 'none';

    // Programmatically click the nav item to navigate into that view
    targetEl.click();

    // Re-enable overlay pointer events after the nav fires
    setTimeout(()=>{ overlay.style.pointerEvents = ''; }, 50);
  }

  // Wait for the view to render, then position spotlight and tooltip
  const renderDelay = isNavTarget ? 300 : 100;

  setTimeout(()=>{
    // On mobile, open sidebar so the highlighted nav item is visible
    if(isNavTarget && isMobile){
      const sidebar = document.getElementById(prefix+'-sidebar');
      const sbOverlay = document.getElementById(prefix+'-overlay');
      if(sidebar) sidebar.classList.add('open');
      if(sbOverlay) sbOverlay.classList.add('open');
    }

    // Re-query target (it may have changed active state after click)
    const freshTarget = portalEl.querySelector(s.target);
    if(freshTarget){
      freshTarget.scrollIntoView({ behavior:'smooth', block:'center' });
      setTimeout(()=> tourPositionSpotlight(freshTarget), 150);
    } else {
      document.getElementById('tour-spotlight').style.display = 'none';
      tourPositionTooltipCenter();
    }
  }, renderDelay);

  // Save progress
  if(ST.user) setOnboardingState(ST.user.id, { lastTourStep: OB.step });
}

function tourPositionSpotlight(el){
  const rect = el.getBoundingClientRect();
  const pad = 6;
  const spot = document.getElementById('tour-spotlight');
  spot.style.display = 'block';
  spot.style.top = (rect.top - pad) + 'px';
  spot.style.left = (rect.left - pad) + 'px';
  spot.style.width = (rect.width + pad*2) + 'px';
  spot.style.height = (rect.height + pad*2) + 'px';

  // Position tooltip
  const tip = document.getElementById('tour-tooltip');
  const tipW = Math.min(360, window.innerWidth - 40);
  const tipH = tip.offsetHeight || 200;

  let tipTop, tipLeft;
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;

  if(spaceBelow > tipH + 20){
    tipTop = rect.bottom + 14;
  } else if(spaceAbove > tipH + 20){
    tipTop = rect.top - tipH - 14;
  } else {
    tipTop = Math.max(20, (window.innerHeight - tipH) / 2);
  }

  tipLeft = Math.max(16, Math.min(rect.left, window.innerWidth - tipW - 16));
  tip.style.top = tipTop + 'px';
  tip.style.left = tipLeft + 'px';
}

function tourPositionTooltipCenter(){
  const tip = document.getElementById('tour-tooltip');
  tip.style.top = '50%';
  tip.style.left = '50%';
  tip.style.transform = 'translate(-50%,-50%)';
  setTimeout(()=>{ tip.style.transform = ''; }, 400);
}

function tourNext(){
  if(OB.step < OB.steps.length - 1){
    OB.step++;
    tourRender();
  } else {
    tourFinish();
  }
}

function tourPrev(){
  if(OB.step > 0){
    OB.step--;
    tourRender();
  }
}

function tourSkip(){
  OB.tourRunning = false;
  document.getElementById('tour-overlay').classList.remove('active');
  // Close mobile sidebar if open
  const prefix = OB.portalPrefix;
  closeSidebar(prefix);
}

function tourFinish(){
  OB.tourRunning = false;
  document.getElementById('tour-overlay').classList.remove('active');
  const prefix = OB.portalPrefix;
  closeSidebar(prefix);

  if(ST.user){
    setOnboardingState(ST.user.id, { tourCompleted:true, tourCompletedAt:new Date().toISOString(), lastTourStep:OB.steps.length });
  }

  // Show post-tour modal
  setTimeout(()=> showPostTourPrompt(), 350);
}

// ── Post-Tour Prompt ──
function showPostTourPrompt(){
  const role = getTourRole();
  const prefix = getPortalPrefix();
  let html = '<div class="posttour-modal">';
  html += '<div class="posttour-icon"><svg viewBox="0 0 24 24" fill="none" width="28" height="28"><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/></svg></div>';
  html += '<div class="posttour-title">Tour Complete!</div>';

  if(role === 'staff_member'){
    const ob = getOnboardingState(ST.user?.id);
    if(ob && !ob.profileAssessmentPrompted){
      html += '<div class="posttour-desc">Great work. Your next step is to complete your Profile Assessment. This helps your facility understand your strengths and place you on the right belt track.</div>';
      html += '<div class="posttour-actions">';
      html += '<button class="btn btn-gold" onclick="closeModal();postTourGoTo(\'s-oip\',\'My Profile\')">Complete My Profile</button>';
      html += '<button class="btn btn-ghost" onclick="closeModal();postTourGoTo(\'s-study\',\'Study &amp; Practice\')">Start Practicing</button>';
      html += '<button class="btn btn-ghost btn-sm" onclick="closeModal()">Maybe Later</button>';
      html += '</div>';
      if(ST.user) setOnboardingState(ST.user.id, { profileAssessmentPrompted:true });
    } else {
      html += '<div class="posttour-desc">You are all set. Explore the platform at your own pace. You can relaunch this tour anytime from the Platform Guide tab.</div>';
      html += '<div class="posttour-actions"><button class="btn btn-gold" onclick="closeModal()">Got It</button></div>';
    }
  } else {
    html += '<div class="posttour-desc">You are ready to go. Here are some good first steps to take in your portal.</div>';
    html += '<div class="posttour-actions">';
    if(role === 'admin'){
      html += '<button class="btn btn-gold" onclick="closeModal();postTourGoTo(\'a-overview\',\'Network Overview\')">View Network Dashboard</button>';
      html += '<button class="btn btn-ghost" onclick="closeModal();postTourGoTo(\'a-registrations\',\'Registrations\')">Check Registrations</button>';
    } else if(role === 'hospital' || role === 'facility_admin'){
      html += '<button class="btn btn-gold" onclick="closeModal();postTourGoTo(\'h-dashboard\',\'Department Dashboard\')">View Dashboard</button>';
      html += '<button class="btn btn-ghost" onclick="closeModal();postTourGoTo(\'h-staff\',\'Staff Directory\')">Review Staff</button>';
    } else {
      html += '<button class="btn btn-gold" onclick="closeModal();postTourGoTo(\'x-dashboard\',\'System Overview\')">View System Dashboard</button>';
    }
    html += '<button class="btn btn-ghost btn-sm" onclick="closeModal()">Close</button>';
    html += '</div>';
  }
  html += '</div>';
  openModal('Tour Complete', html, 'modal-sm');
}

function postTourGoTo(view, title){
  const prefix = getPortalPrefix();
  const navFn = { h:hNav, a:aNav, s:sNav, x:xNav }[prefix];
  const portalEl = document.getElementById(prefix+'-portal');
  if(!portalEl || !navFn) return;
  const navEl = portalEl.querySelector('.nav-item[data-view="'+view+'"]');
  if(navEl) navFn(navEl, view, title);
}

// ── Attention Notification System ──
function checkAttentionItems(prefix){
  const bar = document.getElementById(prefix+'-attn-bar');
  if(!bar) return;
  const u = ST.user;
  if(!u) return;

  const ob = getOnboardingState(u.id);
  const dismissed = ob ? (ob.attentionDismissals || {}) : {};
  const today = new Date().toISOString().slice(0,10);

  let items = [];

  if(prefix === 'a'){
    // Admin attention items
    const pendingRegs = DB.pendingRegs.filter(r=>r.status==='pending').length;
    if(pendingRegs > 0) items.push({ id:'a-pending-regs', text:pendingRegs+' pending registration'+(pendingRegs>1?'s':'')+' need'+(pendingRegs===1?'s':'')+' review.', action:'Review', view:'a-registrations', title:'Registrations' });
    const pendingPromos = (DB.promotionApprovals||[]).filter(p=>p.status==='pending').length;
    if(pendingPromos > 0) items.push({ id:'a-pending-promos', text:pendingPromos+' promotion approval'+(pendingPromos>1?'s':'')+' waiting.', action:'Review', view:'a-promoqueue', title:'Promotion Approvals' });
    const pendingQueue = (DB.queue||[]).filter(q=>q.status==='pending').length;
    if(pendingQueue > 0) items.push({ id:'a-pending-queue', text:pendingQueue+' assessment'+(pendingQueue>1?'s':'')+' in the queue.', action:'Review', view:'a-assessments', title:'Assessment Queue' });
  }

  if(prefix === 'h'){
    const fid = ST.hFid;
    const facStaff = DB.staff.filter(s=>s.fid===fid);
    const isFAdmin = isFacilityAdmin();
    if(isFAdmin){
      const pendingQueue = (DB.queue||[]).filter(q=>q.status==='pending' && q.fid===fid).length;
      if(pendingQueue > 0) items.push({ id:'h-pending-assess', text:pendingQueue+' staff assessment'+(pendingQueue>1?'s':'')+' pending review.', action:'Review', view:'h-assessments', title:'Assessment Queue' });
    }
    const whiteCount = facStaff.filter(s=>s.belt==='White').length;
    if(whiteCount > 3) items.push({ id:'h-white-count', text:whiteCount+' staff still at White belt. Consider scheduling assessments.', action:'View Staff', view:'h-staff', title:'Staff Directory' });
  }

  if(prefix === 's'){
    const sid = ST.staffId;
    const s = getStaff(sid);
    if(s){
      // Check if profile/OIP needs attention
      const hasNullGates = s.cur && (!s.cur.c && !s.cur.s && !s.cur.o);
      if(hasNullGates && s.belt==='White') items.push({ id:'s-complete-profile', text:'Complete your profile assessment to begin your belt journey.', action:'Go to Profile', view:'s-oip', title:'My Profile' });
      // Check if enrolled in Position School
      if(s.ps && !s.ps.enrolled && !s.ps.done) items.push({ id:'s-enroll-ps', text:'You are not yet enrolled in Position School. Check available tracks.', action:'View Tracks', view:'s-posschool', title:'Position School' });
    }
  }

  if(prefix === 'x'){
    // System admin: check if any facility has low compliance
    const sysFacs = DB.facilities.filter(f=>f.systemId===ST.curSystemId && f.active!==false);
    const lowComp = sysFacs.filter(f=>{
      const staff = DB.staff.filter(s=>s.fid===f.id);
      const wPct = staff.length ? (staff.filter(s=>s.belt==='White').length/staff.length*100) : 0;
      return wPct > 50 && staff.length > 2;
    });
    if(lowComp.length > 0) items.push({ id:'x-low-comp', text:lowComp.length+' facilit'+(lowComp.length>1?'ies':'y')+' with over 50% White belt staff.', action:'View Facilities', view:'x-facilities', title:'Facilities' });
  }

  // Filter out dismissed items for today
  items = items.filter(item => dismissed[item.id] !== today);

  if(items.length > 0){
    const item = items[0];
    document.getElementById(prefix+'-attn-text').textContent = item.text;
    const actionBtn = document.getElementById(prefix+'-attn-action');
    actionBtn.textContent = item.action;
    actionBtn.setAttribute('onclick', "attnGoTo('"+prefix+"','"+item.view+"','"+item.title+"')");
    bar.classList.add('show');
    bar.dataset.itemId = item.id;

    // Add pulsing dots to nav items with attention
    items.forEach(it=>{
      const portalEl = document.getElementById(prefix+'-portal');
      if(!portalEl) return;
      const navEl = portalEl.querySelector('.nav-item[data-view="'+it.view+'"]');
      if(navEl && !navEl.querySelector('.attn-dot')){
        navEl.style.position = 'relative';
        const dot = document.createElement('span');
        dot.className = 'attn-dot';
        navEl.appendChild(dot);
      }
    });
  } else {
    bar.classList.remove('show');
  }
}

function dismissAttn(prefix){
  const bar = document.getElementById(prefix+'-attn-bar');
  if(!bar) return;
  const itemId = bar.dataset.itemId;
  bar.classList.remove('show');
  if(itemId && ST.user){
    const ob = getOnboardingState(ST.user.id) || {};
    const dismissals = ob.attentionDismissals || {};
    dismissals[itemId] = new Date().toISOString().slice(0,10);
    setOnboardingState(ST.user.id, { attentionDismissals: dismissals });
  }
}

function attnGoTo(prefix, view, title){
  dismissAttn(prefix);
  const navFn = { h:hNav, a:aNav, s:sNav, x:xNav }[prefix];
  const portalEl = document.getElementById(prefix+'-portal');
  if(!portalEl || !navFn) return;
  const navEl = portalEl.querySelector('.nav-item[data-view="'+view+'"]');
  if(navEl) navFn(navEl, view, title);
}

// ── Guide View Renderer ──
function renderGuideView(prefix){
  const el = document.getElementById(prefix+'-guide');
  if(!el) return;
  const role = getTourRole();
  const steps = TOUR_STEPS[role] || [];
  const u = ST.user;
  const ob = u ? getOnboardingState(u.id) : null;

  // Group steps by category
  const groups = {};
  steps.forEach(s=>{
    if(!groups[s.group]) groups[s.group] = [];
    groups[s.group].push(s);
  });

  // Build checklist items
  const tourDone = ob && ob.tourCompleted;
  const profileDone = role==='staff_member' ? (()=>{ const s=getStaff(ST.staffId); return s && s.cur && (s.cur.c||s.cur.s||s.cur.o); })() : true;
  const psDone = role==='staff_member' ? (()=>{ const s=getStaff(ST.staffId); return s && s.ps && (s.ps.enrolled||s.ps.done); })() : true;

  let html = '<div class="guide-header">';
  html += '<div class="guide-header-title">Platform Guide</div>';
  html += '<div class="guide-header-sub">Explore every feature in your portal or relaunch the guided tour.</div>';
  html += '</div>';

  // Relaunch tour button
  html += '<button class="guide-relaunch" onclick="tourStart(0)">';
  html += '<svg viewBox="0 0 18 18" fill="none" width="16" height="16"><polygon points="6,3 15,9 6,15" fill="currentColor"/></svg>';
  html += tourDone ? 'Relaunch Guided Tour' : 'Start Guided Tour';
  html += '</button>';

  // Layer 2: Onboarding Sequence (replaces simple checklist)
  html += renderOnboardingSequence(prefix);

  // Section Guides area
  html += '<div class="guide-checklist" style="margin-bottom:20px">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:6px">';
  html += '<div class="guide-checklist-title" style="margin:0">Section Guides</div>';
  html += '<button class="swt-later" style="font-size:10.5px" onclick="replayAllSectionWalkthroughs()">Reset All Guides</button>';
  html += '</div>';
  html += '<div style="font-size:12px;color:var(--txt3);margin-bottom:12px;line-height:1.55">Each section has a built-in walkthrough that appears the first time you visit it. These guides explain what you are looking at and what to do. Click any section below to replay its guide.</div>';
  
  // List every section walkthrough available for this role
  const seenList = (ob && ob.seenSections) ? ob.seenSections : [];
  steps.forEach(step=>{
    const viewId = step.target.match(/data-view="([^"]+)"/)?.[1] || '';
    if(!viewId || viewId === prefix+'-guide') return;
    const wt = SECTION_WALKTHROUGHS[viewId];
    if(!wt) return;
    const isSeen = seenList.includes(viewId);
    html += '<div class="checklist-item">';
    html += '<div class="checklist-check '+(isSeen?'checklist-done':'checklist-pending')+'">'+(isSeen?'&#10003;':'&#9679;')+'</div>';
    html += '<div class="checklist-text" style="'+(isSeen?'':'font-weight:600')+'">'+step.title+'</div>';
    html += '<span class="checklist-action" onclick="replaySingleSWT(\''+viewId+'\',\''+prefix+'\')">'+(isSeen?'Replay':'View')+'</span>';
    html += '</div>';
  });
  html += '</div>';

  // ── Layer 3: Curriculum Reading Progress ──
  if(prefix === 's'){
    const s = getStaff(ST.staffId);
    const rs = l3GetReadSections();
    const cr = l3GetCheckResults();
    const curBelt = s ? s.belt : 'White';
    // Belt curriculum progress
    const beltSections = (FULL_CURRICULUM_DATA && FULL_CURRICULUM_DATA.belts && FULL_CURRICULUM_DATA.belts[curBelt]) || [];
    const beltTotal = beltSections.length;
    const beltRead = l3GetReadCount('belt_'+curBelt+'_', beltTotal);
    const beltPct = beltTotal > 0 ? Math.round((beltRead/beltTotal)*100) : 0;
    // Count checks for this belt
    let beltChecksTotal = 0, beltChecksPassed = 0;
    for(let i=0; i<beltTotal; i++){
      const ck = 'belt_'+curBelt+'_'+i;
      if(L3_CHECKS[ck]){ beltChecksTotal++; if(cr[ck] && cr[ck].passed) beltChecksPassed++; }
    }

    html += '<div class="guide-checklist" style="margin-bottom:20px">';
    html += '<div class="guide-checklist-title">Curriculum Reading Progress</div>';
    html += '<div style="font-size:12px;color:var(--txt3);margin-bottom:14px;line-height:1.55">Track how much of your belt learner guide you have read and how many comprehension checks you have passed.</div>';

    // Belt progress card
    html += '<div style="background:var(--s1);border:1px solid var(--bdr);border-radius:var(--rs);padding:14px 16px;margin-bottom:10px">';
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:6px">';
    html += '<div style="font-size:12.5px;font-weight:700;color:var(--txt)">' + curBelt + ' Belt Learner Guide</div>';
    html += '<div style="font-size:11px;font-weight:600;color:var(--gold)">' + beltRead + '/' + beltTotal + ' sections</div>';
    html += '</div>';
    html += '<div class="l3-progress-bar" style="margin-bottom:6px"><div class="l3-progress-fill" style="width:'+beltPct+'%"></div></div>';
    html += '<div style="display:flex;justify-content:space-between;font-size:10.5px;color:var(--txt3)">';
    html += '<span>' + beltPct + '% read</span>';
    if(beltChecksTotal > 0) html += '<span>' + beltChecksPassed + '/' + beltChecksTotal + ' checks passed</span>';
    html += '</div>';
    html += '<button class="btn btn-ghost btn-sm" style="margin-top:10px;width:100%;justify-content:center" onclick="sNav(\'s-study\')">Open Study & Practice</button>';
    html += '</div>';

    // PS track progress (if enrolled)
    if(s && s.ps && s.ps.enrolled && s.ps.track){
      const trackMap = {'QA School':'01','OR Liaison School':'02A','Educator/Preceptor School':'02B','Lead Tech School':'03','Lead Technician Track':'03','Supervisor School':'04','Supervisor Track':'04','HFL Foundation':'05','Manager School':'06','Director Track':'06'};
      const tid = trackMap[s.ps.track] || '';
      if(tid){
        const psData = (FULL_CURRICULUM_DATA && FULL_CURRICULUM_DATA.ps && FULL_CURRICULUM_DATA.ps[tid]) || [];
        const psTotal = psData.length;
        const psRead = l3GetReadCount('ps_'+tid+'_', psTotal);
        const psPct = psTotal > 0 ? Math.round((psRead/psTotal)*100) : 0;
        if(psTotal > 0){
          html += '<div style="background:var(--s1);border:1px solid var(--bdr);border-radius:var(--rs);padding:14px 16px;margin-bottom:10px">';
          html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:6px">';
          html += '<div style="font-size:12.5px;font-weight:700;color:var(--txt)">Position School: ' + s.ps.track + '</div>';
          html += '<div style="font-size:11px;font-weight:600;color:var(--blue)">' + psRead + '/' + psTotal + ' sections</div>';
          html += '</div>';
          html += '<div class="l3-progress-bar" style="margin-bottom:6px"><div class="l3-progress-fill" style="width:'+psPct+'%;background:var(--blue)"></div></div>';
          html += '<div style="font-size:10.5px;color:var(--txt3)">' + psPct + '% read</div>';
          html += '<button class="btn btn-ghost btn-sm" style="margin-top:10px;width:100%;justify-content:center" onclick="sNav(\'s-posschool\')">Open Position School</button>';
          html += '</div>';
        }
      }
    }
    html += '</div>';
  }

  // Search
  html += '<div class="guide-search-wrap">';
  html += '<span class="guide-search-ico"><svg viewBox="0 0 18 18" fill="none" width="14" height="14"><circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.4"/><path d="M12 12l4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></span>';
  html += '<input class="guide-search" type="text" placeholder="Search features..." oninput="filterGuideCards(this.value,\''+prefix+'\')">';
  html += '</div>';

  // Feature cards grouped
  const icoColors = { Overview:'#60a5fa', Network:'#60a5fa', People:'#a78bfa', Development:'#22c55e', Operations:'#f59e0b', Tools:'#c49a20', Learning:'#a78bfa', Profile:'#60a5fa', Facilities:'#60a5fa', Administration:'#ef4444', Support:'#64748b' };

  Object.keys(groups).forEach(group=>{
    html += '<div class="guide-section-label">'+group+'</div>';
    html += '<div class="guide-card-grid">';
    groups[group].forEach(step=>{
      const viewId = step.target.match(/data-view="([^"]+)"/)?.[1] || '';
      const icoClr = icoColors[group] || '#c49a20';
      html += '<div class="guide-card" data-guide-title="'+step.title.toLowerCase()+'" data-guide-desc="'+step.desc.toLowerCase()+'">';
      html += '<div class="guide-card-icon" style="background:'+icoClr+'15;border:1px solid '+icoClr+'30"><svg viewBox="0 0 18 18" fill="none" width="18" height="18"><circle cx="9" cy="9" r="6" stroke="'+icoClr+'" stroke-width="1.3" opacity=".8"/><circle cx="9" cy="9" r="2" fill="'+icoClr+'" opacity=".5"/></svg></div>';
      html += '<div class="guide-card-title">'+step.title+'</div>';
      html += '<div class="guide-card-desc">'+step.desc+'</div>';
      if(viewId && viewId !== prefix+'-guide'){
        const navTitle = step.title;
        html += '<span class="guide-showme" onclick="postTourGoTo(\''+viewId+'\',\''+navTitle.replace(/'/g,"\\'")+'\')">Show Me <svg viewBox="0 0 12 12" fill="none" width="11" height="11"><path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
      }
      html += '</div>';
    });
    html += '</div>';
  });

  el.innerHTML = html;
}

function filterGuideCards(query, prefix){
  const el = document.getElementById(prefix+'-guide');
  if(!el) return;
  const q = query.toLowerCase().trim();
  el.querySelectorAll('.guide-card').forEach(card=>{
    const t = (card.dataset.guideTitle||'') + ' ' + (card.dataset.guideDesc||'');
    card.style.display = (!q || t.includes(q)) ? '' : 'none';
  });
}

// ══════════════════════════════════════════════════════════════════
// SECTION WALKTHROUGHS (Layer 1: In-Context Teaching)
// Collapsible teaching cards that appear the first time a user visits a view.
// ══════════════════════════════════════════════════════════════════

const SECTION_WALKTHROUGHS = {
  // ── Staff Member Portal ──
  's-dashboard': {
    label: 'Your Home Base',
    title: 'Understanding Your Dashboard',
    text: 'This is the first thing you see every time you log in. It gives you a snapshot of where you stand right now.',
    tips: [
      { text: '<strong>Belt Level</strong> shows your current certification. Each belt unlocks new responsibilities and earning potential.' },
      { text: '<strong>Gates</strong> are the three milestones you need to pass for your next promotion: Competency, Safety, and Operational.' },
      { text: '<strong>Points</strong> accumulate from attendance, assessments, and professional development. Higher points rank you on the scoreboard.' },
      { text: '<strong>What to do:</strong> Check this page at the start of every shift. If any gate is incomplete, that is your next priority.' },
    ]
  },
  's-belt': {
    label: 'Your Belt Journey',
    title: 'Reading Your Belt Progress',
    text: 'Each row represents a certification gate you need to pass on the way to your next belt. This is your roadmap.',
    tips: [
      { text: '<strong>Green checkmarks</strong> mean that gate is passed. You have demonstrated competency and it is locked in.' },
      { text: '<strong>Empty circles</strong> are gates you have not attempted yet. Talk to your supervisor about scheduling these.' },
      { text: '<strong>Your next gate</strong> is always the first incomplete one. Focus there, not on gates further ahead.' },
      { text: '<strong>What to do:</strong> Identify your next open gate, then go to Study & Practice to prepare for it.' },
    ]
  },
  's-window': {
    label: 'Performance Snapshot',
    title: 'Your Active Window',
    text: 'The performance window shows your metrics for the current evaluation period. This is what your supervisors use to assess your readiness.',
    tips: [
      { text: '<strong>Window scores</strong> reflect your recent performance, not lifetime totals. Consistency matters here.' },
      { text: '<strong>What to do:</strong> Review your window before any scheduled assessment so you know where you stand.' },
    ]
  },
  's-scoreboard': {
    label: 'Team Rankings',
    title: 'How the Scoreboard Works',
    text: 'The scoreboard ranks you against your peers at the same facility. Points come from multiple sources.',
    tips: [
      { text: '<strong>Assessment points</strong> are earned when you pass belt gates. These carry the most weight.' },
      { text: '<strong>Attendance points</strong> reward showing up consistently and covering shifts when needed.' },
      { text: '<strong>What to do:</strong> Focus on your own progression. The scoreboard updates as you complete gates and maintain attendance.' },
    ]
  },
  's-posschool': {
    label: 'Training Curriculum',
    title: 'How Position School Works',
    text: 'Position School is your structured training program. Each belt track has specific modules covering the knowledge and skills you need.',
    tips: [
      { text: '<strong>Tracks</strong> are organized by the role you are training for: Technician, Supervisor, Manager, or Director.' },
      { text: '<strong>Modules</strong> contain approved language scripts, procedures, and knowledge content. Read them carefully.' },
      { text: '<strong>Scripts</strong> show you the exact language to use in real situations. Green text is approved. Red text is what to avoid.' },
      { text: '<strong>What to do:</strong> If you are not enrolled yet, review the available tracks and speak to your supervisor about getting started.' },
    ]
  },
  's-report': {
    label: 'Your Record',
    title: 'Your Personal Report',
    text: 'This is your full performance record in one view. Belt history, gate status, attendance, and skill summary.',
    tips: [
      { text: '<strong>Download</strong> this report as a PDF. It is useful for performance reviews and transfer documentation.' },
      { text: '<strong>What to do:</strong> Review this before any annual evaluation or if you are applying for a belt promotion.' },
    ]
  },
  's-oip': {
    label: 'Profile Assessment',
    title: 'Your Operational Identity Profile',
    text: 'Your OIP captures your behavioral tendencies, work style, and strengths. It helps your facility place you in the right role.',
    tips: [
      { text: '<strong>Complete the assessment</strong> by answering honestly. There are no wrong answers. It measures fit, not skill.' },
      { text: '<strong>Your results</strong> inform how your leadership coaches you and what communication style works best for you.' },
      { text: '<strong>What to do:</strong> If your profile shows incomplete, take the assessment now. It takes about 5 minutes.' },
    ]
  },
  's-schedule': {
    label: 'Your Shifts',
    title: 'Your Schedule',
    text: 'Your assigned shifts and upcoming work schedule are shown here. Your department manager publishes these weekly.',
    tips: [
      { text: '<strong>Check this regularly</strong> so you always know when you are expected. Shift changes appear here first.' },
      { text: '<strong>What to do:</strong> If you see a conflict, contact your supervisor as early as possible.' },
    ]
  },
  's-history': {
    label: 'Your Timeline',
    title: 'History and Projection',
    text: 'This shows your complete belt journey, past and future. Every promotion, assessment, and milestone is recorded.',
    tips: [
      { text: '<strong>The timeline</strong> shows when you earned each belt, how long you spent at each level, and key events.' },
      { text: '<strong>Projections</strong> estimate when you could reach your next belt based on your current pace.' },
      { text: '<strong>What to do:</strong> Use this to visualize your growth and stay motivated toward your next milestone.' },
    ]
  },
  's-study': {
    label: 'Preparation Hub',
    title: 'Study and Practice',
    text: 'This is where you prepare for assessments. Practice quizzes, approved language review, and knowledge drills.',
    tips: [
      { text: '<strong>Practice quizzes</strong> simulate the real assessment format. Use them to build confidence.' },
      { text: '<strong>Approved language</strong> scripts show exactly what to say in critical situations. Memorize the green text.' },
      { text: '<strong>Difficulty levels</strong> range from introductory to advanced. Start easy and work your way up.' },
      { text: '<strong>What to do:</strong> Before any scheduled assessment, complete at least 2 to 3 practice rounds at the matching difficulty.' },
    ]
  },

  // ── Hospital / Facility Admin Portal ──
  'h-dashboard': {
    label: 'Department Overview',
    title: 'Reading Your Dashboard',
    text: 'This is your daily command center. Everything you need to manage your department at a glance.',
    tips: [
      { text: '<strong>Belt distribution cards</strong> show how many staff are at each level. Healthy departments have a pyramid shape with fewer White belts over time.' },
      { text: '<strong>Assessment requests</strong> badge shows pending reviews. If this number is high, staff are waiting on you.' },
      { text: '<strong>Compliance indicators</strong> track whether your facility is meeting certification standards.' },
      { text: '<strong>What to do:</strong> Check this page at the start of every day. Address any red indicators or pending items first.' },
    ]
  },
  'h-staff': {
    label: 'Your Team',
    title: 'Managing Your Staff Directory',
    text: 'Every staff member in your department is listed here with their current belt, role, and performance data.',
    tips: [
      { text: '<strong>Click any row</strong> to open that staff member\'s full profile with belt history, gate status, and attendance record.' },
      { text: '<strong>Belt badges</strong> are color-coded. White is entry level, Yellow through Black represent increasing certification.' },
      { text: '<strong>Filter and search</strong> to quickly find staff by name, belt, or role.' },
      { text: '<strong>What to do:</strong> Review staff who have been at the same belt for a long time. They may need coaching or assessment scheduling.' },
    ]
  },
  'h-milestones': {
    label: 'Achievement Tracking',
    title: 'Facility Milestones',
    text: 'Milestones mark your facility\'s major achievements. Belt promotions, compliance targets, and certification gates completed.',
    tips: [
      { text: '<strong>Track progress</strong> toward department-wide goals. Use milestones in team meetings to celebrate wins.' },
      { text: '<strong>What to do:</strong> Set monthly or quarterly targets and use this view to measure against them.' },
    ]
  },
  'h-posschool': {
    label: 'Staff Training',
    title: 'Position School Overview',
    text: 'This shows the structured curriculum for each belt track. Monitor which staff are enrolled and where they are in training.',
    tips: [
      { text: '<strong>Track enrollment</strong> to make sure every staff member on a belt path is in the right Position School track.' },
      { text: '<strong>Module content</strong> is what your staff are studying. Review it so you can reinforce the material on the floor.' },
      { text: '<strong>What to do:</strong> If any staff are not enrolled, start the conversation about their development path.' },
    ]
  },
  'h-scoreboard': {
    label: 'Performance Rankings',
    title: 'Staff Scoreboard',
    text: 'Rankings show who is leading in performance points. This identifies your top performers and those who may need support.',
    tips: [
      { text: '<strong>Points combine</strong> assessment results, attendance, and professional development activity.' },
      { text: '<strong>What to do:</strong> Recognize top scorers. Coach staff in the lower ranks on what actions would improve their standing.' },
    ]
  },
  'h-schedule': {
    label: 'Shift Planning',
    title: 'Building and Managing Schedules',
    text: 'Create and publish weekly shift schedules for your department from this view.',
    tips: [
      { text: '<strong>Auto-generate</strong> uses your shift templates to build a starting schedule. Adjust from there.' },
      { text: '<strong>Coverage indicators</strong> show whether each shift has adequate staffing.' },
      { text: '<strong>What to do:</strong> Publish next week\'s schedule at least 3 days in advance so your team can plan.' },
    ]
  },
  'h-attendance': {
    label: 'Daily Records',
    title: 'Recording Attendance',
    text: 'Record daily attendance here. This data feeds directly into staff performance scores and compliance metrics.',
    tips: [
      { text: '<strong>Mark each status</strong> accurately: present, absent, late, or covering another shift.' },
      { text: '<strong>Coverage tracking</strong> shows your department\'s reliability rate over time.' },
      { text: '<strong>What to do:</strong> Record attendance the same day. Late entries create gaps in reporting.' },
    ]
  },
  'h-reports': {
    label: 'Compliance Reporting',
    title: 'Generating Reports',
    text: 'Download formatted PDF reports of your department\'s belt status, compliance, and staffing metrics.',
    tips: [
      { text: '<strong>PDF reports</strong> are formatted for leadership presentations and audit documentation.' },
      { text: '<strong>What to do:</strong> Generate a report before any compliance review or quarterly meeting with leadership.' },
    ]
  },
  'h-assessments': {
    label: 'Assessment Management',
    title: 'Processing the Assessment Queue',
    text: 'As a Facility Admin, belt assessment requests from your staff land here for review and processing.',
    tips: [
      { text: '<strong>Each request</strong> shows the staff member, their current belt, the target belt, and the assessment type.' },
      { text: '<strong>Review carefully</strong> before approving. Verify the staff member has completed prerequisite training.' },
      { text: '<strong>What to do:</strong> Process pending assessments promptly. Staff waiting too long lose momentum.' },
    ]
  },
  'h-progression': {
    label: 'Belt Advancement',
    title: 'Managing Staff Progression',
    text: 'See who is eligible for promotion, who needs support, and manage advancement requests for your facility.',
    tips: [
      { text: '<strong>Eligible staff</strong> have all gates passed for their current belt. They are ready for promotion.' },
      { text: '<strong>At-risk staff</strong> have stalled in progression. Consider coaching or rescheduling assessments.' },
      { text: '<strong>What to do:</strong> Review this weekly. Identify who to advance and who needs a development plan.' },
    ]
  },

  // ── Admin Portal (SIPS) ──
  'a-overview': {
    label: 'Network Command Center',
    title: 'Understanding Network Overview',
    text: 'Everything across the entire network rolls up here. Belt distribution, facility health, compliance, and KPIs.',
    tips: [
      { text: '<strong>Network stats</strong> aggregate data from all facilities. Use this to spot system-wide trends.' },
      { text: '<strong>Facility health cards</strong> give a quick status for each location. Red means action needed.' },
      { text: '<strong>What to do:</strong> Review this daily. Prioritize any facility showing declining metrics.' },
    ]
  },
  'a-leaderboard': {
    label: 'Facility Comparison',
    title: 'Reading the Facility Leaderboard',
    text: 'Facilities ranked by compliance scores, belt progression speed, and staffing metrics. Use this for accountability.',
    tips: [
      { text: '<strong>Rankings update</strong> as staff progress and assessments complete. The leaderboard is dynamic.' },
      { text: '<strong>What to do:</strong> Compare top and bottom facilities. Share best practices from leaders to those lagging.' },
    ]
  },
  'a-allstaff': {
    label: 'Network Staff Directory',
    title: 'Navigating All Staff',
    text: 'Every staff member across every facility in one searchable view. Filter, sort, and drill into any profile.',
    tips: [
      { text: '<strong>Filter by facility, belt, or role</strong> to quickly narrow down who you are looking for.' },
      { text: '<strong>Click any name</strong> to see their full profile, belt history, and performance data.' },
      { text: '<strong>What to do:</strong> Use this when reviewing transfer candidates, staffing gaps, or network-wide skill distribution.' },
    ]
  },
  'a-scoreboard': {
    label: 'Network Performance',
    title: 'Network-Wide Scoreboard',
    text: 'Performance rankings across all facilities. See who your top performers are network-wide.',
    tips: [
      { text: '<strong>What to do:</strong> Identify standout staff for recognition, mentoring roles, or leadership development.' },
    ]
  },
  'a-facilities': {
    label: 'Facility Management',
    title: 'Managing Facilities',
    text: 'Each card is a facility in your network. Click into any one for a full breakdown of their operations.',
    tips: [
      { text: '<strong>Facility detail</strong> shows belt distribution, staff roster, shift config, assessment queue, and compliance data.' },
      { text: '<strong>Deactivation controls</strong> are here for facilities that need to be suspended or removed.' },
      { text: '<strong>What to do:</strong> Review each facility regularly. Prioritize those with high White belt ratios or low compliance.' },
    ]
  },
  'a-registrations': {
    label: 'New Facility Requests',
    title: 'Processing Registrations',
    text: 'When a new facility requests access, their application appears here. You approve or deny.',
    tips: [
      { text: '<strong>Approving</strong> creates their portal, sets up their department, and sends login credentials.' },
      { text: '<strong>Denying</strong> sends a rejection notice. Always include a reason so they can reapply if appropriate.' },
      { text: '<strong>What to do:</strong> Process pending registrations within 1 to 2 business days to maintain trust.' },
    ]
  },
  'a-assessments': {
    label: 'Assessment Oversight',
    title: 'Network Assessment Queue',
    text: 'Pending assessments from all facilities are collected here. You have visibility across the entire network.',
    tips: [
      { text: '<strong>Filter by facility</strong> to focus on one location at a time.' },
      { text: '<strong>What to do:</strong> Ensure no assessments sit pending for more than a week. Follow up with facility contacts if they stall.' },
    ]
  },
  'a-progression': {
    label: 'Belt Oversight',
    title: 'Network Staff Progression',
    text: 'Track belt advancement across every facility. See who is moving up, who is stalled, and where the gaps are.',
    tips: [
      { text: '<strong>What to do:</strong> Use this to identify system-wide training gaps or facilities where progression has stopped.' },
    ]
  },
  'a-upload': {
    label: 'Bulk Operations',
    title: 'Using Bulk Upload',
    text: 'Import staff rosters via CSV file. Upload, map columns, validate, and add entire teams in one operation.',
    tips: [
      { text: '<strong>CSV format</strong> requires columns: first name, last name, role, belt level, and email.' },
      { text: '<strong>Validation</strong> checks each row. Invalid entries are flagged with details so you can fix and retry.' },
      { text: '<strong>What to do:</strong> Use this when onboarding a new facility or doing a quarterly roster refresh.' },
    ]
  },
  'a-reports': {
    label: 'Network Reporting',
    title: 'Generating Network Reports',
    text: 'Create facility-level or network-level PDF reports. These are formatted for leadership and compliance audiences.',
    tips: [
      { text: '<strong>What to do:</strong> Generate network reports monthly. Generate facility reports before site visits or reviews.' },
    ]
  },
  'a-promoqueue': {
    label: 'Promotion Oversight',
    title: 'Reviewing Promotion Approvals',
    text: 'Belt promotion requests that require admin approval are queued here. Review evidence and approve or return.',
    tips: [
      { text: '<strong>What to do:</strong> Do not let promotion approvals sit for more than 48 hours. Staff are waiting on these decisions.' },
    ]
  },
  'a-freeagents': {
    label: 'Staff Transfers',
    title: 'Free Agent Registry',
    text: 'Staff who have been released from a facility but remain in the network are listed here. They can be assigned to a new location.',
    tips: [
      { text: '<strong>What to do:</strong> Review free agents weekly. Match them to facilities with staffing gaps.' },
    ]
  },
  'a-adminusers': {
    label: 'User Management',
    title: 'Managing Admin Users',
    text: 'Control who has admin access to the platform. Add, modify, or remove admin users and set their access levels.',
    tips: [
      { text: '<strong>Access levels</strong> determine which facilities and features each admin can see and manage.' },
      { text: '<strong>What to do:</strong> Audit admin users quarterly. Remove access for anyone who has changed roles.' },
    ]
  },

  // ── System Admin Portal ──
  'x-dashboard': {
    label: 'System Overview',
    title: 'Your System Dashboard',
    text: 'This aggregates data across all facilities in your hospital system. Belt totals, compliance rates, and health scores.',
    tips: [
      { text: '<strong>System-wide metrics</strong> combine every facility under your umbrella. Look for outliers.' },
      { text: '<strong>What to do:</strong> Check this weekly. Investigate any facility that deviates significantly from system averages.' },
    ]
  },
  'x-facilities': {
    label: 'Your Facilities',
    title: 'Navigating Your Facilities',
    text: 'Every facility in your hospital system is listed here. Click into any one for detailed belt and staffing data.',
    tips: [
      { text: '<strong>What to do:</strong> Prioritize facilities with high White belt ratios or declining compliance for deeper review.' },
    ]
  },
  'x-staff': {
    label: 'System Staff Directory',
    title: 'All Staff Across Your System',
    text: 'A unified directory spanning every facility in your hospital system. Filter by location, belt, or role.',
    tips: [
      { text: '<strong>What to do:</strong> Use this to compare staffing levels and skill distribution across your facilities.' },
    ]
  },
  'x-schedule': {
    label: 'System Scheduling',
    title: 'Schedule and Attendance',
    text: 'View scheduling and attendance data across all your facilities. Compare coverage rates at a glance.',
    tips: [
      { text: '<strong>What to do:</strong> Identify facilities with coverage gaps and coordinate with their managers to resolve.' },
    ]
  },
  'x-reports': {
    label: 'System Reports',
    title: 'System-Level Reporting',
    text: 'Generate aggregated reports across your entire hospital system. Belt distribution, compliance trends, and performance data.',
    tips: [
      { text: '<strong>What to do:</strong> Run system reports before board meetings or compliance audits. Export to PDF for distribution.' },
    ]
  },
};

// ── Section Walkthrough Engine ──
// ══════════════════════════════════════════════════════════════════
// LAYER 2: ROLE-BASED ONBOARDING SEQUENCES
// Ordered step-by-step workflows per role with live completion detection.
// ══════════════════════════════════════════════════════════════════

function hasCompletedStep(stepId){
  const u = ST.user;
  if(!u) return false;
  const ob = getOnboardingState(u.id);
  return ob && ob.completedSteps && ob.completedSteps.includes(stepId);
}

function markStepCompleted(stepId){
  const u = ST.user;
  if(!u) return;
  const ob = getOnboardingState(u.id) || {};
  const steps = ob.completedSteps || [];
  if(!steps.includes(stepId)){
    steps.push(stepId);
    setOnboardingState(u.id, { completedSteps: steps });
  }
}

// Sequence definitions per role. Each step has:
//   id: unique key
//   title: display name
//   desc: what to do and why
//   check: function returning true if this step is complete (live detection)
//   view: the view to navigate to
//   viewTitle: topbar title when navigated
function getOnboardingSequence(role){
  const u = ST.user;
  const prefix = getPortalPrefix();
  const ob = u ? getOnboardingState(u.id) : {};
  const seen = (ob && ob.seenSections) || [];
  const tourDone = ob && ob.tourCompleted;

  if(role === 'staff_member'){
    const s = getStaff(ST.staffId);
    const hasGates = s && s.cur && (s.cur.c || s.cur.s || s.cur.o);
    const psEnrolled = s && s.ps && (s.ps.enrolled || s.ps.done);
    const needsPlacement = s && s.placementNeeded;
    const placementDone = !needsPlacement || (DB.placementReviews && DB.placementReviews.some(pr=>pr.staffId===ST.staffId));
    const steps = [
      { id:'s-tour', title:'Complete the Platform Tour', desc:'Walk through every section of your portal so you know where everything lives and what each tool does.', check:()=>!!tourDone, view:'s-guide', viewTitle:'Platform Guide' },
      { id:'s-profile', title:'Complete Your Profile Assessment', desc:'Take your OIP assessment so your facility understands your strengths and can place you on the right belt track. This takes about 5 minutes.', check:()=>!!hasGates, view:'s-oip', viewTitle:'My Profile' },
    ];
    // Only show placement step if the staff member has not yet been placed on an earned belt
    if(needsPlacement || !placementDone){
      steps.push({ id:'s-placement', title:'Take Your Placement Assessment', desc:'New to the system? Complete your placement assessment so your assessor can determine your starting belt level based on your existing experience and knowledge.', check:()=>!!placementDone, view:'s-dashboard', viewTitle:'My Dashboard' });
    }
    steps.push(
      { id:'s-belt-review', title:'Review Your Belt Progress', desc:'Open your belt map and see where you stand. Identify which gates are complete and which one comes next.', check:()=>seen.includes('s-belt'), view:'s-belt', viewTitle:'Belt Progress' },
      { id:'s-ps-enroll', title:'Enroll in Position School', desc:'Check available training tracks and speak to your supervisor about getting started. Position School is your structured path to the next belt.', check:()=>!!psEnrolled, view:'s-posschool', viewTitle:'Position School' },
      { id:'s-practice', title:'Complete a Practice Quiz', desc:'Go to Study and Practice and complete at least one practice round. This builds confidence before your real assessment.', check:()=>hasCompletedStep('s-practice'), view:'s-study', viewTitle:'Study & Practice' },
      { id:'s-schedule-check', title:'Check Your Schedule', desc:'Review your upcoming shifts so you always know when you are expected. Make this a daily habit.', check:()=>seen.includes('s-schedule'), view:'s-schedule', viewTitle:'My Schedule' },
      { id:'s-report-view', title:'View Your Personal Report', desc:'Open your report to see your full performance record. Belt history, gate status, attendance, and skill summary all in one view.', check:()=>seen.includes('s-report'), view:'s-report', viewTitle:'My Report' },
    );
    return steps;
  }

  if(role === 'hospital' || role === 'facility_admin'){
    const fid = ST.hFid;
    const facStaff = DB.staff.filter(st=>st.fid===fid);
    const hasSchedule = DB.schedule.some(sc=>sc.fid===fid);
    const hasAttendance = DB.attendance.some(a=>a.fid===fid);
    const isFAdmin = role === 'facility_admin';
    const steps = [
      { id:'h-tour', title:'Complete the Platform Tour', desc:'Walk through every section of your department portal so you know where each management tool lives.', check:()=>!!tourDone, view:'h-guide', viewTitle:'Platform Guide' },
      { id:'h-staff-review', title:'Review Your Staff Directory', desc:'Open the staff list and get familiar with your team. Check belt levels, roles, and identify anyone who may need attention.', check:()=>seen.includes('h-staff'), view:'h-staff', viewTitle:'Staff Directory' },
      { id:'h-dashboard-review', title:'Review Your Dashboard', desc:'Study your department overview. Understand the belt distribution, pending items, and compliance indicators.', check:()=>seen.includes('h-dashboard'), view:'h-dashboard', viewTitle:'Department Dashboard' },
      { id:'h-schedule-build', title:'Build or Review the Weekly Schedule', desc:'Create your first schedule or review the current one. Proper staffing coverage is the foundation of department operations.', check:()=>!!hasSchedule, view:'h-schedule', viewTitle:'Schedule' },
      { id:'h-attendance-record', title:'Record Attendance', desc:'Mark today\'s attendance for your team. Attendance data feeds directly into performance scoring and compliance metrics.', check:()=>!!hasAttendance, view:'h-attendance', viewTitle:'Attendance' },
      { id:'h-milestones-review', title:'Review Facility Milestones', desc:'Check what your facility has achieved and identify the next targets for your team.', check:()=>seen.includes('h-milestones'), view:'h-milestones', viewTitle:'Facility Milestones' },
      { id:'h-first-report', title:'Download Your First Report', desc:'Generate a PDF report of your department. Use it for your next leadership update or keep it as a baseline snapshot.', check:()=>hasCompletedStep('h-first-report'), view:'h-reports', viewTitle:'Reports' },
    ];
    if(isFAdmin){
      steps.push({ id:'h-assess-review', title:'Review the Assessment Queue', desc:'Check if any staff have pending assessment requests. Processing these promptly keeps your team moving forward.', check:()=>seen.includes('h-assessments'), view:'h-assessments', viewTitle:'Assessment Queue' });
      steps.push({ id:'h-progression-review', title:'Review Staff Progression', desc:'See who is eligible for promotion and who may be stalled. Use this to plan your development conversations.', check:()=>seen.includes('h-progression'), view:'h-progression', viewTitle:'Staff Progression' });
    }
    return steps;
  }

  if(role === 'admin'){
    return [
      { id:'a-tour', title:'Complete the Platform Tour', desc:'Walk through every admin tool so you know the full scope of what is available to you.', check:()=>!!tourDone, view:'a-guide', viewTitle:'Platform Guide' },
      { id:'a-overview-review', title:'Review Network Overview', desc:'Study the network dashboard. Understand belt distribution, facility health scores, and compliance across all locations.', check:()=>seen.includes('a-overview'), view:'a-overview', viewTitle:'Network Overview' },
      { id:'a-regs-check', title:'Check Pending Registrations', desc:'See if any new facilities are waiting for access approval. Process these within 1 to 2 business days.', check:()=>seen.includes('a-registrations'), view:'a-registrations', viewTitle:'Registrations' },
      { id:'a-facility-drill', title:'Drill Into a Facility', desc:'Open any facility to see its full detail: belt breakdown, staff roster, shift config, and compliance data.', check:()=>seen.includes('a-facilities'), view:'a-facilities', viewTitle:'Facilities' },
      { id:'a-assess-review', title:'Review the Assessment Queue', desc:'Check for pending assessments across all facilities. Ensure nothing is sitting unprocessed.', check:()=>seen.includes('a-assessments'), view:'a-assessments', viewTitle:'Assessment Queue' },
      { id:'a-progression-review', title:'Review Staff Progression', desc:'See who is ready for promotion network-wide and who needs support.', check:()=>seen.includes('a-progression'), view:'a-progression', viewTitle:'Staff Progression' },
      { id:'a-leaderboard-review', title:'Review the Facility Leaderboard', desc:'Compare facilities by compliance, belt velocity, and staffing. Use this for accountability conversations.', check:()=>seen.includes('a-leaderboard'), view:'a-leaderboard', viewTitle:'Facility Leaderboard' },
      { id:'a-first-report', title:'Generate a Network Report', desc:'Download a network-level PDF report. Great for leadership reviews and compliance documentation.', check:()=>hasCompletedStep('a-first-report'), view:'a-reports', viewTitle:'Reports' },
    ];
  }

  if(role === 'system_admin'){
    return [
      { id:'x-tour', title:'Complete the Platform Tour', desc:'Walk through your system admin portal to understand every tool available to you.', check:()=>!!tourDone, view:'x-guide', viewTitle:'Platform Guide' },
      { id:'x-dashboard-review', title:'Review System Dashboard', desc:'Study the aggregated data across all your facilities. Look for outliers and trends.', check:()=>seen.includes('x-dashboard'), view:'x-dashboard', viewTitle:'System Overview' },
      { id:'x-facilities-review', title:'Check Your Facilities', desc:'Review every facility under your system. Prioritize any showing low compliance or high White belt ratios.', check:()=>seen.includes('x-facilities'), view:'x-facilities', viewTitle:'Facilities' },
      { id:'x-staff-review', title:'Review All Staff', desc:'Browse the unified staff directory across your system. Understand skill distribution and staffing levels.', check:()=>seen.includes('x-staff'), view:'x-staff', viewTitle:'All Staff' },
      { id:'x-schedule-review', title:'Check Schedule and Attendance', desc:'View scheduling and attendance across facilities. Identify coverage gaps.', check:()=>seen.includes('x-schedule'), view:'x-schedule', viewTitle:'Schedule & Attendance' },
      { id:'x-first-report', title:'Generate a System Report', desc:'Download your first system-level PDF report. Use it as a baseline for tracking improvement.', check:()=>hasCompletedStep('x-first-report'), view:'x-reports', viewTitle:'Reports' },
    ];
  }

  return [];
}

function renderOnboardingSequence(prefix){
  const role = getTourRole();
  const steps = getOnboardingSequence(role);
  if(!steps.length) return '';

  let completedCount = 0;
  let firstIncomplete = -1;
  steps.forEach((s,i)=>{
    if(s.check()){ completedCount++; }
    else if(firstIncomplete === -1){ firstIncomplete = i; }
  });

  const allDone = completedCount === steps.length;
  const pct = Math.round(completedCount / steps.length * 100);

  let html = '<div class="ob-seq">';
  html += '<div class="ob-seq-hd">';
  html += '<div class="ob-seq-title">Your First Week Onboarding</div>';
  html += '<div class="ob-seq-sub">Complete these steps in order to get fully set up. The platform tracks your progress automatically.</div>';
  html += '</div>';

  // Progress bar
  html += '<div class="ob-seq-progress">';
  html += '<div class="ob-seq-bar"><div class="ob-seq-bar-fill" style="width:'+pct+'%"></div></div>';
  html += '<div class="ob-seq-pct">'+completedCount+' of '+steps.length+'</div>';
  html += '</div>';

  if(allDone){
    html += '<div class="ob-seq-complete">';
    html += '<div class="ob-seq-complete-ico">&#10003;</div>';
    html += '<div class="ob-seq-complete-text">Onboarding Complete</div>';
    html += '<div class="ob-seq-complete-sub">You have finished all onboarding steps. You are ready to use the platform at full capacity.</div>';
    html += '</div>';
  } else {
    html += '<div class="ob-seq-list">';
    steps.forEach((s, i)=>{
      const done = s.check();
      const isActive = (i === firstIncomplete);
      const isLocked = (!done && i > firstIncomplete);
      const numCls = done ? 'done' : isActive ? 'active' : 'locked';
      const numContent = done ? '&#10003;' : (i+1);

      html += '<div class="ob-step">';
      html += '<div class="ob-step-num '+numCls+'">'+numContent+'</div>';
      html += '<div class="ob-step-body">';
      html += '<div class="ob-step-title'+(done?' done':'')+'">'+s.title+'</div>';
      if(!done) html += '<div class="ob-step-desc">'+s.desc+'</div>';
      html += '</div>';

      if(done){
        html += '<div class="ob-step-action"><span class="ob-step-done-badge">Done</span></div>';
      } else if(isActive){
        html += '<div class="ob-step-action"><button class="ob-step-go" onclick="obSeqGo(\''+s.view+'\',\''+s.viewTitle.replace(/'/g,"\\'")+'\',\''+prefix+'\')">Start</button></div>';
      }
      html += '</div>';
    });
    html += '</div>';
  }
  html += '</div>';
  return html;
}

function obSeqGo(view, title, prefix){
  const navFn = { h:hNav, a:aNav, s:sNav, x:xNav }[prefix];
  const portalEl = document.getElementById(prefix+'-portal');
  if(!portalEl || !navFn) return;
  const navEl = portalEl.querySelector('.nav-item[data-view="'+view+'"]');
  if(navEl) navFn(navEl, view, title);
}

// ── Hooks to auto-mark manual steps ──
// Hook into report downloads
const _origDownloadFacReportV2 = typeof downloadFacilityReportV2 === 'function' ? downloadFacilityReportV2 : null;
if(_origDownloadFacReportV2){
  downloadFacilityReportV2 = function(fid){
    _origDownloadFacReportV2(fid);
    const role = getTourRole();
    if(role === 'hospital' || role === 'facility_admin') markStepCompleted('h-first-report');
  };
}
const _origDownloadSysReportV2 = typeof downloadSystemReportV2 === 'function' ? downloadSystemReportV2 : null;
if(_origDownloadSysReportV2){
  downloadSystemReportV2 = function(){
    _origDownloadSysReportV2();
    markStepCompleted('x-first-report');
  };
}
const _origDownloadNetworkReport = typeof downloadNetworkReport === 'function' ? downloadNetworkReport : null;
if(_origDownloadNetworkReport){
  downloadNetworkReport = function(){
    _origDownloadNetworkReport();
    markStepCompleted('a-first-report');
  };
}

// ── End Layer 2 Engine ──

function hasSectionBeenSeen(viewId){
  const u = ST.user;
  if(!u) return true;
  const ob = getOnboardingState(u.id);
  return ob && ob.seenSections && ob.seenSections.includes(viewId);
}

function markSectionSeen(viewId){
  const u = ST.user;
  if(!u) return;
  const ob = getOnboardingState(u.id) || {};
  const seen = ob.seenSections || [];
  if(!seen.includes(viewId)){
    seen.push(viewId);
    setOnboardingState(u.id, { seenSections: seen });
  }
}

function resetSectionSeen(viewId){
  const u = ST.user;
  if(!u) return;
  const ob = getOnboardingState(u.id);
  if(ob && ob.seenSections){
    ob.seenSections = ob.seenSections.filter(s=>s!==viewId);
    setOnboardingState(u.id, { seenSections: ob.seenSections });
  }
}

function injectSectionWalkthrough(viewId){
  // Skip if tour is running (don't stack UI)
  if(OB.tourRunning) return;

  const wt = SECTION_WALKTHROUGHS[viewId];
  if(!wt) return;

  const el = document.getElementById(viewId);
  if(!el) return;

  // Remove any existing walkthrough in this view
  const existing = el.querySelector('.swt-card');
  if(existing) existing.remove();

  // Check if already seen (and not a replay)
  const seen = hasSectionBeenSeen(viewId);
  if(seen) return;

  // Check if this section was previously collapsed by the user
  const u = ST.user;
  const ob = u ? getOnboardingState(u.id) : null;
  const collapsedList = (ob && ob.collapsedSections) ? ob.collapsedSections : [];
  const startCollapsed = collapsedList.includes(viewId);

  // Check if user arrived from the Guide view
  const showBack = OB.cameFromGuide === true;
  OB.cameFromGuide = false; // consume the flag

  // Build the card HTML
  const tipIco = '<svg viewBox="0 0 12 12" fill="none" width="12" height="12"><path d="M6 1l1.5 3 3.3.5-2.4 2.3.6 3.2L6 8.5 3 10l.6-3.2L1.2 4.5l3.3-.5z" fill="currentColor"/></svg>';
  let tipsHtml = '';
  wt.tips.forEach(tip=>{
    tipsHtml += '<div class="swt-tip"><span class="swt-tip-icon">'+tipIco+'</span><span>'+tip.text+'</span></div>';
  });

  const prefix = getPortalPrefix();
  const backBtn = showBack
    ? '<button class="swt-later" onclick="swtBackToGuide(\''+prefix+'\')" style="display:inline-flex;align-items:center;gap:4px"><svg viewBox="0 0 12 12" fill="none" width="11" height="11"><path d="M8 2L4 6l4 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>Back to Guide</button>'
    : '';

  const html = '<div class="swt-card'+(startCollapsed?' collapsed':'')+'" id="swt-'+viewId+'">'
    + '<div class="swt-header" onclick="toggleSWT(\''+viewId+'\')">'
    + '<div class="swt-icon"><svg viewBox="0 0 20 20" fill="none" width="18" height="18"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.4"/><path d="M10 6v5M10 13v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></div>'
    + '<div class="swt-header-text"><div class="swt-label">'+wt.label+'</div><div class="swt-title">'+wt.title+'</div></div>'
    + '<div class="swt-toggle"><svg viewBox="0 0 12 12" fill="none" width="14" height="14"><path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'
    + '</div>'
    + '<div class="swt-body">'
    + '<div class="swt-text">'+wt.text+'</div>'
    + '<div class="swt-tips">'+tipsHtml+'</div>'
    + '<div class="swt-footer">'
    + '<button class="swt-dismiss" onclick="dismissSWT(\''+viewId+'\')">Got It</button>'
    + '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">'
    + backBtn
    + '<button class="swt-later" onclick="collapseSWT(\''+viewId+'\')">Minimize</button>'
    + '</div>'
    + '</div>'
    + '</div>'
    + '</div>';

  el.insertAdjacentHTML('afterbegin', html);
}

function toggleSWT(viewId){
  const card = document.getElementById('swt-'+viewId);
  if(!card) return;
  card.classList.toggle('collapsed');
  // Persist the collapse/expand state
  _persistCollapseState(viewId, card.classList.contains('collapsed'));
}

function collapseSWT(viewId){
  const card = document.getElementById('swt-'+viewId);
  if(!card) return;
  card.classList.add('collapsed');
  _persistCollapseState(viewId, true);
}

function _persistCollapseState(viewId, isCollapsed){
  const u = ST.user;
  if(!u) return;
  const ob = getOnboardingState(u.id) || {};
  let collapsed = ob.collapsedSections || [];
  if(isCollapsed && !collapsed.includes(viewId)){
    collapsed.push(viewId);
  } else if(!isCollapsed){
    collapsed = collapsed.filter(s=>s!==viewId);
  }
  setOnboardingState(u.id, { collapsedSections: collapsed });
}

function dismissSWT(viewId){
  const card = document.getElementById('swt-'+viewId);
  if(card){
    card.style.opacity = '0';
    card.style.transform = 'translateY(-10px)';
    card.style.transition = 'opacity .25s, transform .25s';
    setTimeout(()=>card.remove(), 260);
  }
  markSectionSeen(viewId);
  // Also clear from collapsed list since it's fully dismissed
  const u = ST.user;
  if(u){
    const ob = getOnboardingState(u.id) || {};
    let collapsed = ob.collapsedSections || [];
    collapsed = collapsed.filter(s=>s!==viewId);
    setOnboardingState(u.id, { collapsedSections: collapsed });
  }
}

function swtBackToGuide(prefix){
  const navFn = { h:hNav, a:aNav, s:sNav, x:xNav }[prefix];
  const portalEl = document.getElementById(prefix+'-portal');
  if(!portalEl || !navFn) return;
  const navEl = portalEl.querySelector('.nav-item[data-view="'+prefix+'-guide"]');
  if(navEl) navFn(navEl, prefix+'-guide', 'Platform Guide');
}

function replayAllSectionWalkthroughs(){
  const u = ST.user;
  if(!u) return;
  setOnboardingState(u.id, { seenSections: [], collapsedSections: [] });
  toast('Section guides have been reset. Navigate to any tab to see them again.', 'ok');
}

function replaySingleSWT(viewId, prefix){
  resetSectionSeen(viewId);
  // Clear collapse state for this section too
  const u = ST.user;
  if(u){
    const ob = getOnboardingState(u.id) || {};
    let collapsed = ob.collapsedSections || [];
    collapsed = collapsed.filter(s=>s!==viewId);
    setOnboardingState(u.id, { collapsedSections: collapsed });
  }
  // Set flag so the walkthrough shows a back button
  OB.cameFromGuide = true;
  // Navigate to that view to trigger the walkthrough
  const navFn = { h:hNav, a:aNav, s:sNav, x:xNav }[prefix];
  const portalEl = document.getElementById(prefix+'-portal');
  if(!portalEl || !navFn) return;
  const titleMap = {};
  const steps = TOUR_STEPS[getTourRole()] || [];
  steps.forEach(s=>{
    const m = s.target.match(/data-view="([^"]+)"/);
    if(m) titleMap[m[1]] = s.title;
  });
  const navEl = portalEl.querySelector('.nav-item[data-view="'+viewId+'"]');
  if(navEl) navFn(navEl, viewId, titleMap[viewId] || viewId);
}

// ── Hook Into enterPortal ──
// We patch enterPortal to check onboarding state after portal renders
const _origEnterPortal = enterPortal;
enterPortal = function(type){
  _origEnterPortal(type);
  // After portal renders, check onboarding + attention
  setTimeout(()=>{
    const u = ST.user;
    if(!u) return;
    const prefix = getPortalPrefix();

    // First-login check
    if(isFirstLogin(u.id)){
      setTimeout(()=> showWelcomeOverlay(), 400);
    }

    // Attention check (runs every portal entry)
    checkAttentionItems(prefix);
  }, 200);
};

// ── Recalc spotlight on resize ──
window.addEventListener('resize', ()=>{
  if(OB.tourRunning && OB.steps[OB.step]){
    const prefix = OB.portalPrefix;
    const portalEl = document.getElementById(prefix+'-portal');
    if(!portalEl) return;
    const s = OB.steps[OB.step];
    const targetEl = portalEl.querySelector(s.target);
    if(targetEl) tourPositionSpotlight(targetEl);
  }
});

// ============================================================ INIT
// ── Mobile table label injector ──
// After any view renders, tag each <td> with its column header text
// so the CSS stacked layout shows proper labels
function labelMobileTables(root){
  if(!root) root = document;
  root.querySelectorAll('table.tbl').forEach(tbl=>{
    const headers = [...tbl.querySelectorAll('thead th')].map(th=>th.textContent.trim());
    if(!headers.length) return;
    tbl.querySelectorAll('tbody tr').forEach(tr=>{
      [...tr.querySelectorAll('td')].forEach((td,i)=>{
        if(headers[i]) td.setAttribute('data-label', headers[i]);
      });
    });
    // Add mob-stack class so CSS targets it
    tbl.classList.add('mob-stack');
  });
}

// Patch renderHView and renderAView to label tables and inject section walkthroughs after render
const _origRenderHView = renderHView;
renderHView = function(view){
  _origRenderHView(view);
  setTimeout(()=>{
    labelMobileTables(document.getElementById(view));
    injectSectionWalkthrough(view);
  }, 120);
};
const _origRenderAView = renderAView;
renderAView = function(view){
  _origRenderAView(view);
  setTimeout(()=>{
    labelMobileTables(document.getElementById(view));
    injectSectionWalkthrough(view);
  }, 120);
};
// Patch renderSView and renderXView for section walkthroughs
const _origRenderSViewPost = renderSView;
renderSView = function(view){
  _origRenderSViewPost(view);
  setTimeout(()=>{
    labelMobileTables(document.getElementById(view));
    injectSectionWalkthrough(view);
  }, 120);
};
const _origRenderXViewPost = renderXView;
renderXView = function(view){
  _origRenderXViewPost(view);
  setTimeout(()=>{
    labelMobileTables(document.getElementById(view));
    injectSectionWalkthrough(view);
  }, 120);
};// --- Tour Draggable Tooltip ---
function initTourDrag() {
  const tip = document.getElementById('tour-tooltip');
  if (!tip) return;
  let isDragging = false;
  let startX, startY, initialLeft, initialTop;

  tip.addEventListener('mousedown', (e) => {
    // Don't drag if clicking interactive elements
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.tour-dot')) return;
    
    isDragging = true;
    const rect = tip.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;
    startX = e.clientX;
    startY = e.clientY;
    
    // Temporarily turn off CSS transitions so dragging is immediate
    tip.style.transition = 'none';
    // Clear any transform so we rely purely on top/left offsets
    tip.style.transform = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault(); // Prevent text selection while dragging
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    tip.style.left = (initialLeft + dx) + 'px';
    tip.style.top = (initialTop + dy) + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      tip.style.transition = ''; 
      tip.style.transform = '';
    }
  });
}

window.onload = function(){
  initTourDrag();
  const sel = document.getElementById('fac-switcher-sel');
  if(sel) sel.innerHTML = DB.facilities.map(f=>`<option value="${f.id}">${f.name}</option>`).join('');

  // Init swipe-to-close for all four portals
  ['h','a','s','x'].forEach(p => initSwipeClose(p));

  document.addEventListener('keydown', e => {
    if(e.key === 'Escape'){
      ['h','a','s','x'].forEach(p => closeSidebar(p));
      closeModal();
    }
  });

  const overlay = document.getElementById('modal-overlay');
  if(overlay) overlay.addEventListener('touchmove', e => e.preventDefault(), {passive:false});

  // Note: Session restoration is handled exclusively by restoreSessionOnLoad on DOMContentLoaded to avoid duplicate race conditions.

  // Set up inactivity auto-logout (2 minutes)
  let inactivityTimer;
  const resetInactivityTimer = () => {
    clearTimeout(inactivityTimer);
    // Only auto-logout if we have an active session
    if (localStorage.getItem('sbd_session') && typeof logout === 'function') {
      inactivityTimer = setTimeout(() => {
        console.log('User inactive for 2 minutes. Auto-logging out.');
        logout();
      }, 120000); // 2 minutes
    }
  };

  window.addEventListener('mousemove', resetInactivityTimer);
  window.addEventListener('keydown', resetInactivityTimer);
  window.addEventListener('scroll', resetInactivityTimer);
  window.addEventListener('click', resetInactivityTimer);
  resetInactivityTimer();

  console.log('SBD Platform initialized in Live Mode.');
};

async function initAppData(){
  window.SBD_INITIALIZING = true;
  console.log('SBD Platform: Multi-table data hydration started...');
  try {
    const [facs, staff, systems, users, reviews, queue, registrations, freeAgents, promotions, onboarding] = await Promise.race([
      Promise.all([
        SB.getFacilities().catch(e=>{ console.error('facs load err', e); return []; }),
        SB.getAllStaff().catch(e=>{ console.error('staff load err', e); return []; }),
        SB.getHospitalSystems().catch(e=>{ console.error('systems load err', e); return []; }),
        SB.getAllAdminProfiles().catch(e=>{ console.error('users load err', e); return []; }),
        SB.getPlacementReviews().catch(e=>{ console.error('reviews load err', e); return []; }),
        SB.getPendingAssessments().catch(e=>{ console.error('queue load err', e); return []; }),
        SB.getPendingRegistrations().catch(e=>{ console.error('regs load err', e); return []; }),
        SB.getFreeAgents().catch(e=>{ console.error('fa load err', e); return []; }),
        SB.getPromotionApprovals().catch(e=>{ console.error('promos load err', e); return []; }),
        (ST.user ? SB.getUserOnboarding(ST.user.id) : Promise.resolve([])).catch(e=>{ console.error('onboarding load err', e); return []; })
      ]),
      new Promise((_,rej)=>setTimeout(()=>rej(new Error('Initial data load timeout')), 20000))
    ]);

    // Hydrate Global DB (Merge Logic for Hospital Systems to prevent optimistic data erasure)
    if (!window.DB) window.DB = { hospitalSystems: [], facilities: [], staff: [], systems: [] };
    if(typeof mapFacilityFromBackend === 'function') window.DB.facilities = (facs||[]).map(mapFacilityFromBackend); else window.DB.facilities = facs||[];
    if(typeof mapStaffFromBackend === 'function') window.DB.staff = (staff||[]).map(mapStaffFromBackend); else window.DB.staff = staff||[];
    const currentSystems = window.DB.hospitalSystems || [];
    const memoryOptimistic = currentSystems.filter(s => s.id && String(s.id).startsWith('sys-'));
    const storageOptimistic = JSON.parse(localStorage.getItem('sbd_optimistic_systems') || '[]');
    
    // Union of optimistic sources
    const allOptimistic = [...memoryOptimistic];
    storageOptimistic.forEach(so => {
      if(!allOptimistic.some(mo => mo.name === so.name)) allOptimistic.push(so);
    });
    
    let backendMapped = [];
    if(typeof mapHospitalSystemFromBackend === 'function') {
      backendMapped = (systems||[]).map(mapHospitalSystemFromBackend);
    } else {
      backendMapped = (systems||[]);
    }
    
    // Merge: use backend data as source of truth, but preserve optimistic ones not yet in backend
    const finalSystems = [...backendMapped];
    const syncedNames = [];
    
    allOptimistic.forEach(os => {
      // If no backend system has the same name, keep the optimistic one
      if (!backendMapped.some(bs => bs.name === os.name)) {
        finalSystems.push(os);
      } else {
        syncedNames.push(os.name);
      }
    });

    // Cleanup localStorage for items now in backend
    if(syncedNames.length > 0) {
      const remainingOptimistic = storageOptimistic.filter(so => !syncedNames.includes(so.name));
      localStorage.setItem('sbd_optimistic_systems', JSON.stringify(remainingOptimistic));
      console.log('initAppData: Cleared synchronized systems from localStorage:', syncedNames);
    }
    
    window.DB.hospitalSystems = finalSystems;
    window.DB.systems = finalSystems; // Transition sync

    // --- PENDING LINKS HYDRATION ---
    const pendingLinks = JSON.parse(localStorage.getItem('sbd_pending_links') || '[]');
    if (pendingLinks.length > 0) {
      console.log(`initAppData: Hydrating ${pendingLinks.length} pending links from localStorage.`);
      pendingLinks.forEach(link => {
        const fac = window.DB.facilities.find(f => f.id === link.facId);
        const sys = window.DB.hospitalSystems.find(s => s.id === link.tempSysId || s.name === link.systemName);
        if (fac && sys) {
          fac.systemId = sys.id;
          if (!sys.facilityIds) sys.facilityIds = [];
          if (!sys.facilityIds.includes(link.facId)) sys.facilityIds.push(link.facId);
        }
      });
    }

    // Active Resolver Recovery: If we have optimistic systems, restart their hunt
    finalSystems.forEach(s => {
      if (s.id && String(s.id).startsWith('sys-')) {
        if (typeof resolveSystemUUID === 'function') {
          console.log(`initAppData: Restarting resolver for ${s.name} (${s.id})`);
          resolveSystemUUID(s.id, s.name);
        }
      }
    });
    if(typeof mapUserFromBackend === 'function') window.DB.users = (users||[]).map(mapUserFromBackend); else window.DB.users = users||[];
    if(typeof mapPlacementReviewFromBackend === 'function') window.DB.placementReviews = (reviews||[]).map(mapPlacementReviewFromBackend); else window.DB.placementReviews = reviews||[];
    if(typeof mapQueueFromBackend === 'function') window.DB.queue = (queue||[]).map(mapQueueFromBackend); else window.DB.queue = queue||[];
    window.DB.pendingRegs = registrations||[];
    if(typeof mapFreeAgentFromBackend === 'function') window.DB.freeAgents = (freeAgents||[]).map(mapFreeAgentFromBackend); else window.DB.freeAgents = freeAgents||[];
    if(typeof mapPromotionApprovalFromBackend === 'function') window.DB.promotionApprovals = (promotions||[]).map(mapPromotionApprovalFromBackend); else window.DB.promotionApprovals = promotions||[];
    if(typeof mapOnboardingFromBackend === 'function') window.DB.onboarding = (onboarding||[]).map(mapOnboardingFromBackend); else window.DB.onboarding = onboarding||[];

    console.log(`SBD Platform: Hydrated ${window.DB.facilities.length} facs, ${window.DB.staff.length} staff, ${window.DB.hospitalSystems.length} systems, ${window.DB.users.length} users.`);
    if(window.DB.staff.length === 0) console.warn('SBD DIAG: staff array is EMPTY after hydration. Raw staff value:', staff);
    if(window.DB.facilities.length === 0) console.warn('SBD DIAG: facilities array is EMPTY after hydration. Raw facs value:', facs);
    
    // Refresh UI components
    const sel = document.getElementById('fac-switcher-sel');
    if(sel) sel.innerHTML = DB.facilities.map(f=>`<option value="${f.id}">${f.name}</option>`).join('');
    
    // Trigger view refreshes if active
    if(typeof window.refreshDashboard === 'function') window.refreshDashboard();
    if(typeof window.renderAOverview === 'function' && ST.portal === 'admin') window.renderAOverview();
    if(typeof window.renderXDashboard === 'function' && ST.portal === 'system_admin') window.renderXDashboard();
    
    window.SBD_INITIALIZING = false;
  } catch(e) {
    window.SBD_INITIALIZING = false;
    console.error('SBD Platform: Data hydration failed:', e.message);
    if(typeof showToast === 'function') showToast('Failed to load application data. Please refresh.', 'err');
  }
}

async function restoreSessionOnLoad(){
  console.log('SBD Platform: Checking for active session...');
  if(typeof SB_AUTH === 'undefined') return;
  const session = SB_AUTH.restoreSession();
  if(session){
    console.log('SBD Platform: Active session found. Restoring portal...');
    if(typeof doLogin === 'function'){
      try {
        await doLogin(session);
      } catch(e){
        console.error('Session restoration failed:', e);
        if(typeof logout === 'function') logout();
      }
    }
  } else {
    console.log('SBD Platform: No active session. Waiting for login.');
  }
}

// Auto-run on script load
if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', restoreSessionOnLoad);
} else {
    restoreSessionOnLoad();
}

