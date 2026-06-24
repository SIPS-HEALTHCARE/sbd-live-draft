// ============================================================
// sbd-force-submit-placement  (#18 / #35)
// ============================================================
// Master-admin-only. Force-submits a candidate's IN-PROGRESS or timed-out
// placement assessment AS-IS, scoring exactly like the candidate's screen does:
//   - knowledge: answer === correct -> 100 else 0 (blank -> 0)
//   - simulation (answered): AI grader (sbd-score-assessment); keyword fallback
//   - simulation (blank): 0
//   - dangerous knowledge answer (wrong + in dangerousAnswers) blocks the belt
// Then writes the placement_reviews row (status 'pending'), marks the staff
// placement_needed=false, and completes the session. The assessor confirms the
// belt the normal way. No retake, no new PIN.
//
// This is the headless server-side twin of paPersistSubmission() in ui-views.js.
// Built for Michael Chambers (Ignacio: "submit as-is, blanks score zero, no
// retake"); reusable as the timeout auto-submit (#18).
//
// Modes: 'preview' (score + return, NO writes) | 'execute' (score + persist).
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Belt thresholds + suggestion (verbatim from ui-views.js) ────────────────
const SBD_BELT_THRESHOLDS = [
  { belt: 'Black',  blended: 90, k: 92, sim: 87 },
  { belt: 'Brown',  blended: 87, k: 91, sim: 84 },
  { belt: 'Blue',   blended: 85, k: 89, sim: 82 },
  { belt: 'Green',  blended: 81, k: 86, sim: 78 },
  { belt: 'Yellow', blended: 78, k: 83, sim: 75 },
  { belt: 'White',  blended: 75, k: 80, sim: 72 },
];
function sbdSuggestBelt(kOverall: number, kL1: number, simOverall: number, blended: number, hasDangerousKAnswer: boolean) {
  if (hasDangerousKAnswer) return 'No Belt';
  for (const t of SBD_BELT_THRESHOLDS) {
    if (blended >= t.blended && kOverall >= t.k) {
      return simOverall >= t.sim ? t.belt + ' Belt' : t.belt + ' Belt Conditional';
    }
  }
  if (kOverall >= 80 && kL1 >= 80) return 'White Belt Conditional';
  return 'No Belt';
}

// ── Keyword fallback scorer (verbatim from ui-views.js) ─────────────────────
const COMMON = new Set([
  'the','and','for','are','but','not','you','all','can','had','her','was','one','our','out',
  'has','his','how','its','may','new','now','old','see','way','who','did','get','let','say',
  'she','too','use','with','this','that','have','from','they','been','call','come','each',
  'make','like','long','look','many','over','such','take','than','them','then','what','when',
  'will','more','some','time','very','your','just','know','also','back','been','work','first',
  'even','give','most','find','here','thing','after','year','about','would','there','their',
  'which','could','other','into','than','only','come','made','before','should','through',
  'where','much','must','need','does','right','still','because','every','between','never',
  'sterile','instrument','patient','safety','clean','decontamination','assembly','sterilization',
  'procedure','protocol','process','tray','wrap','load','cycle','indicator','biological',
  'chemical','mechanical','monitor','rinse','wash','dry','inspect','verify','document',
  'supervisor','notify','report','escalate','stop','hold','release','contamination','exposure',
  'breach','failure','recall','count','sheet','case','cart','scope','flexible','rigid',
  'manual','automated','ultrasonic','washer','autoclave','steam','pressure','temperature',
  'prevac','gravity','immediate','recall','event','related','packaging','storage','handling',
  'transport','distribution','staff','technician','department','hospital','surgical','operating',
  'room','area','zone','station','sink','table','counter','shelf','certification','training',
  'competency','assessment','evaluation','standard','compliance','regulation','policy',
  'documentation','log','record','tracking','quality','control','assurance','improvement',
  'corrective','action','root','cause','analysis','risk','hazard','personal','protective',
  'equipment','gloves','gown','mask','shield','eye','face','hand','hygiene','disinfection',
  'antiseptic','detergent','enzymatic','neutral','water','solution','concentration','dilution',
  'contact','time','soak','flush','purge','filter','biofilm','residual','organic','inorganic',
  'check','ensure','confirm','follow','perform','complete','maintain','prepare','apply',
  'remove','replace','repair','return','send','place','open','close','lock','seal',
  'label','tag','mark','identify','sort','separate','prioritize','organize','schedule',
  'coordinate','communicate','inform','alert','warn','caution','danger','emergency',
  'critical','urgent','priority','immediate','delayed','routine','special','custom',
  'preference','card','physician','surgeon','nurse','team','lead','tech','manager',
  'would','should','could','must','need','will','shall','might','before','after',
  'during','while','until','because','since','therefore','however','also','then',
  'first','second','next','finally','always','never','immediately','properly','correctly',
  'carefully','thoroughly','completely','appropriate','required','necessary','important',
  'essential','specific','correct','proper','safe','unsafe','acceptable','unacceptable',
  'double','signature','verification','visual','physical','functional','packaging',
  'integrity','compromise','damage','defect','corrosion','stain','pit','crack','chip',
  'bend','misalign','loose','tight','sharp','dull','missing','broken','worn','expired'
]);
function assessResponseQuality(answer: string): number {
  if (!answer || answer.trim().length < 10) return 0;
  const text = answer.trim();
  const words = text.match(/[a-zA-Z]{2,}/g) || [];
  if (words.length < 5) return 0;
  const realWords = words.filter((w) => {
    const wl = w.toLowerCase();
    if (wl.length <= 2) return true;
    if (COMMON.has(wl)) return true;
    const vowels = (wl.match(/[aeiou]/g) || []).length;
    const ratio = vowels / wl.length;
    return ratio >= 0.15 && ratio <= 0.8 && wl.length <= 20;
  });
  const realWordRatio = realWords.length / words.length;
  const deduped = text.replace(/(.)\1{2,}/g, '$1');
  if (deduped.length < text.length * 0.5) return 0;
  const alphaChars = (text.match(/[a-zA-Z]/g) || []).length;
  if (alphaChars / text.length < 0.6) return 0;
  const hasStructure = /[.!?,;:]/.test(text) || /\b(and|but|or|because|then|when|if|should|would|must|need|after|before)\b/i.test(text);
  if (realWordRatio < 0.3) return 0;
  if (realWordRatio < 0.5) return 0.15;
  if (realWordRatio < 0.7) return 0.4;
  if (!hasStructure) return 0.5;
  if (words.length < 10) return 0.6;
  return Math.min(1, 0.7 + realWordRatio * 0.3);
}
function scoreByKeywords(answer: string, keywords: string[]): number {
  if (!answer || !keywords || !keywords.length) return 0;
  const qualityScore = assessResponseQuality(answer);
  if (qualityScore === 0) return 0;
  const lc = answer.toLowerCase();
  const matched = keywords.filter((k) => lc.includes(String(k).toLowerCase())).length;
  const ratio = matched / keywords.length;
  const rawScore = Math.round(ratio * 100);
  return Math.round(rawScore * qualityScore);
}
function generateFallbackFeedback(_answer: string, _keywords: string[], score: number): string {
  if (score === 0) return 'Response does not contain a meaningful answer. Please provide a genuine response using complete sentences.';
  if (score < 20) return 'Response lacks relevant content. Address the specific situation described in the question.';
  if (score >= 80) return 'Response demonstrates solid understanding of core procedures and safety protocols.';
  if (score >= 60) return 'Response covers key concepts but could expand on safety documentation and escalation steps.';
  return 'Response would benefit from more specific detail about safety protocols, documentation, and escalation procedures.';
}

const isBlank = (v: any) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

    const body = await req.json().catch(() => ({}));
    const email = (body.email || '').toString().trim().toLowerCase();
    const mode = (body.mode || 'preview').toString();
    if (!email) return json({ error: 'email is required' }, 400);
    if (mode !== 'preview' && mode !== 'execute') return json({ error: `Invalid mode "${mode}". Use "preview" or "execute".` }, 400);

    // ── Auth: caller must be master_admin ──
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    const { data: { user }, error: authErr } = await admin.auth.getUser(jwt);
    if (authErr || !user) return json({ error: 'Unauthorized: invalid or expired session' }, 401);
    const { data: caller } = await admin.from('sbd_portal_users').select('role, email').eq('auth_uid', user.id).single();
    if (!caller || caller.role !== 'master_admin') return json({ error: `Unauthorized role (${caller?.role || 'none'}). Master admin only.` }, 403);

    // ── Resolve target + staff (staff.id == portal_users.auth_uid) ──
    const { data: target } = await admin.from('sbd_portal_users').select('id, auth_uid, email, name, role').ilike('email', email).maybeSingle();
    if (!target) return json({ error: `No portal user found for email "${email}"` }, 404);
    const { data: staff } = await admin.from('staff').select('id, first, last, fid, belt, placement_needed').eq('id', target.auth_uid).maybeSingle();
    if (!staff) return json({ error: `No staff record linked to "${target.email}" via auth_uid (${target.auth_uid}).` }, 404);

    // ── Guard: don't double-submit if a review already exists ──
    const { data: existingReviews } = await admin.from('placement_reviews').select('id, status, submitted_at, tentative_belt').eq('staff_id', staff.id).order('submitted_at', { ascending: false });
    if (existingReviews && existingReviews.length > 0 && mode === 'execute') {
      return json({ error: 'A placement review already exists for this candidate. Refusing to double-submit.', existing: existingReviews }, 409);
    }

    // ── Latest in-progress placement session ──
    const { data: ses } = await admin.from('sbd_assessment_sessions')
      .select('id, status, assessment_type, progress, expires_at, completed_at, created_at')
      .eq('staff_id', staff.id).is('completed_at', null).neq('status', 'completed')
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (!ses) return json({ error: 'No in-progress assessment session found for this candidate.' }, 404);

    const progress = ses.progress || {};
    const questions: any[] = Array.isArray(progress.shuffledQuestions) ? progress.shuffledQuestions : [];
    const answers: Record<string, any> = progress.answers || {};
    if (!questions.length) return json({ error: 'Session has no questions to score.' }, 422);

    // ── Score, mirroring paPersistSubmission ──
    const responses: any[] = [];
    const levelScores: Record<number, { weight: number; score: number }[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    const sim: { q: any; ans: any }[] = [];
    let blankCount = 0;

    for (const q of questions) {
      const lvl = Number(q.level) || 1;
      const ans = answers[q.id];
      if (isBlank(ans)) blankCount++;
      if (q.type === 'knowledge') {
        const correct = ans === q.correct; // strict, same as client
        const score = correct ? 100 : 0;
        const opts = Array.isArray(q.options) ? q.options : [];
        responses.push({
          qId: q.id, level: lvl, type: 'knowledge', question: q.q,
          answer: (ans !== undefined && opts[ans] !== undefined) ? opts[ans] : 'No answer',
          correctAnswer: opts[q.correct] !== undefined ? opts[q.correct] : '—',
          correct, score,
          isDangerous: Array.isArray(q.dangerousAnswers) && q.dangerousAnswers.includes(ans),
        });
        if (!levelScores[lvl]) levelScores[lvl] = [];
        levelScores[lvl].push({ weight: 1, score });
      } else {
        sim.push({ q, ans });
      }
    }

    // Simulation: blank -> 0; answered -> AI grader (keyword fallback on failure).
    for (const { q, ans } of sim) {
      const lvl = Number(q.level) || 1;
      let aiScore: number;
      let aiFeedback: string;
      if (isBlank(ans)) {
        aiScore = 0;
        aiFeedback = '';
      } else {
        const kw = Array.isArray(q.keywords) ? q.keywords : [];
        const fallbackScore = scoreByKeywords(String(ans || ''), kw);
        const fallbackFb = generateFallbackFeedback(String(ans || ''), kw, fallbackScore);
        aiScore = fallbackScore;
        aiFeedback = fallbackFb;
        try {
          const reqBody: any = { question: q.q, answer: String(ans) };
          if (q.answerKey) reqBody.answer_key = q.answerKey;
          if (q.failIndicator) reqBody.fail_indicator = q.failIndicator;
          const r = await fetch(`${supabaseUrl}/functions/v1/sbd-score-assessment`, {
            method: 'POST',
            headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
            body: JSON.stringify(reqBody),
          });
          if (r.ok) {
            const v = await r.json();
            if (v && v.score !== undefined) {
              aiScore = v.score;
              aiFeedback = v.feedback || fallbackFb;
            }
          }
        } catch (_) { /* keep keyword fallback */ }
      }
      responses.push({ qId: q.id, level: lvl, type: 'simulation', question: q.q, answer: String(ans || ''), aiScore, aiFeedback });
      if (!levelScores[lvl]) levelScores[lvl] = [];
      levelScores[lvl].push({ weight: 1, score: aiScore });
    }

    // Aggregate, exactly as the client.
    const kResp = responses.filter((r) => r.type === 'knowledge');
    const simResp = responses.filter((r) => r.type === 'simulation');
    const kOverall = Math.round(avg(kResp.map((r) => r.score)));
    const kL1 = Math.round(avg(kResp.filter((r) => r.level === 1).map((r) => r.score)));
    const simOverall = Math.round(avg(simResp.map((r) => r.aiScore)));
    const blended = Math.round(kOverall * 0.6 + simOverall * 0.4);
    const hasDangerousKAnswer = kResp.some((r) => r.isDangerous && !r.correct);
    const suggestion = sbdSuggestBelt(kOverall, kL1, simOverall, blended, hasDangerousKAnswer);
    const suggestedBelt = (suggestion.match(/White|Yellow|Green|Blue|Brown|Black/) || ['White'])[0];

    const levelScorePcts: Record<number, number> = {};
    for (let lvl = 1; lvl <= 5; lvl++) {
      const items = levelScores[lvl];
      if (!items || !items.length) continue;
      const total = items.reduce((acc, x) => acc + x.weight * x.score, 0);
      const maxTotal = items.reduce((acc, x) => acc + x.weight * 100, 0);
      levelScorePcts[lvl] = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;
    }

    const staffName = `${staff.first || ''} ${staff.last || ''}`.trim() || (target.name || 'Unknown');
    const summary = {
      candidate: staffName,
      session_id: ses.id,
      total_questions: questions.length,
      answered: questions.length - blankCount,
      blank_scored_zero: blankCount,
      knowledge_overall: kOverall,
      knowledge_l1: kL1,
      simulation_overall: simOverall,
      blended,
      dangerous_block: hasDangerousKAnswer,
      engine_determination: suggestion,
      tentative_belt: suggestedBelt,
      level_scores: levelScorePcts,
    };

    if (mode === 'preview') {
      return json({ success: true, mode: 'preview', caller: caller.email, summary });
    }

    // ── EXECUTE: write review, clear placement flag, complete session ──
    const prBody = {
      staff_id: staff.id,
      fid: staff.fid,
      status: 'pending',
      tentative_belt: suggestedBelt,
      responses,
      level_scores: levelScorePcts,
      submitted_at: new Date().toISOString(),
      staff_name: staffName,
      staff_title: target.role || '',
      session_id: ses.id,
    };
    const { data: inserted, error: insErr } = await admin.from('placement_reviews').insert(prBody).select('id').single();
    if (insErr) return json({ error: `placement_reviews insert failed: ${insErr.message}` }, 500);

    await admin.from('staff').update({ placement_needed: false, updated_at: new Date().toISOString() }).eq('id', staff.id);
    await admin.from('sbd_assessment_sessions').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', ses.id).is('completed_at', null);

    return json({ success: true, mode: 'execute', caller: caller.email, placement_review_id: inserted.id, summary });
  } catch (err: any) {
    console.error('[force-submit-placement] error:', err);
    return json({ error: err.message || 'Unknown error' }, 500);
  }

  function json(obj: any, status = 200) {
    return new Response(JSON.stringify(obj), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
