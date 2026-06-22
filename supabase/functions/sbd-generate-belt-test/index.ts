// ============================================================================
// sbd-generate-belt-test — Dynamic Belt Test generation (Track A4)
//
// POST { staff_id, target_belt }
//   1. JWT auth (service-role client, same pattern as sbd-assessor-pin)
//   2. Idempotency — return the existing ACTIVE test if one exists
//   3. Queue gate — require APPROVED Competency AND Simulation queue rows
//   4. Seeded sampling — one variant per competency slot, MCQ options shuffled
//   5. Persist the skeleton (variant_status:'fallback') and return the stored row
//
// ⚠️ SOURCE-OF-TRUTH NOTE — this file mirrors the SELF-CONTAINED version that is
// actually DEPLOYED to Supabase:
//   • The question bank is loaded from the `sbd_belt_bank` DB table (id=1), NOT a
//     bundled bank.json. (The repo's bank.json + sampler.mjs remain as the bank
//     source-of-truth + the acceptance harness's inputs — see
//     scripts/verify-belt-test-generation.js — but the live function does not import
//     them; the sampler is inlined below so the function has zero local imports.)
//   • There is NO AI variant-rewrite pass. Every item is served verbatim from the
//     bank (only MCQ options are seed-shuffled), so variant_status is always
//     'fallback'. Per-learner question uniqueness therefore relies on per-slot
//     variant count in the bank, not an AI layer (see Dr. Jake overlap flag).
//
// The stored row is the "reload returns the same test" guarantee; the seed
// (deriveSeed(staff_id, belt, test_date)) makes regeneration reproducible.
// ============================================================================
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LEVELS = [1, 2, 3, 4, 5];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ── Seeded determinism (inlined from sampler.mjs) ───────────────────────────
function fnv1a32(str: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function deriveSeed(staffId: string, belt: string, dateISO: string) {
  return fnv1a32([String(staffId), String(belt), String(dateISO)].join('|'));
}

function seededShuffle(arr: any[], rng: () => number) {
  const o = arr.slice();
  for (let i = o.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = o[i];
    o[i] = o[j];
    o[j] = t;
  }
  return o;
}

function pickOne(v: any[], rng: () => number) {
  return v[Math.floor(rng() * v.length)];
}

function bySlot(items: any[]) {
  const m = new Map<string, any[]>();
  (items || []).forEach((it) => {
    if (!m.has(it.slot)) m.set(it.slot, []);
    m.get(it.slot)!.push(it);
  });
  return m;
}

// Shuffle MCQ option order and re-point `correct` to its new index. Sim items
// (no .options) pass through untouched.
function shuffleOptions(item: any, rng: () => number) {
  if (!Array.isArray(item.options)) return item;

  const idx = item.options.map((_: any, i: number) => i);
  const order = seededShuffle(idx, rng);
  const options = order.map((i: number) => item.options[i]);
  const correct = order.indexOf(item.correct);

  return Object.assign({}, item, { options, correct });
}

function sampleSkeleton(bank: any, belt: string, seed: number) {
  const beltBank = bank[belt];
  if (!beltBank) throw new Error('No bank content for belt ' + belt);

  const rng = mulberry32(seed);
  const knowledge: any[] = [];
  const simulation: any[] = [];

  LEVELS.forEach((L) => {
    const kSlots = bySlot((beltBank.knowledge || []).filter((q: any) => Number(q.level) === L));
    const sSlots = bySlot((beltBank.simulation || []).filter((q: any) => Number(q.level) === L));

    Array.from(kSlots.keys()).sort().forEach((slot) => {
      const c = pickOne(kSlots.get(slot)!, rng);
      knowledge.push(shuffleOptions(Object.assign({ skeleton_slot: slot }, c), rng));
    });

    Array.from(sSlots.keys()).sort().forEach((slot) => {
      const c = pickOne(sSlots.get(slot)!, rng);
      simulation.push(Object.assign({ skeleton_slot: slot }, c));
    });
  });

  return {
    knowledge: seededShuffle(knowledge, rng),
    simulation: seededShuffle(simulation, rng),
  };
}

// ── Bank loader — single-row JSONB in sbd_belt_bank (service-role only) ──────
let _bank: any = null;

async function loadBank(admin: any) {
  if (_bank) return _bank;

  const { data, error } = await admin
    .from('sbd_belt_bank')
    .select('data')
    .eq('id', 1)
    .single();

  if (error || !data?.data) {
    throw new Error('Belt bank not loaded - run the sbd_belt_bank INSERT SQL.');
  }

  _bank = data.data;
  return _bank;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);

    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    const { data: { user }, error: authError } = await admin.auth.getUser(jwt);

    if (authError || !user) return json({ error: 'Unauthorized' }, 401);

    const { staff_id, target_belt } = await req.json();

    if (!staff_id || !target_belt) {
      return json({ error: 'staff_id and target_belt are required' }, 400);
    }

    const bank = await loadBank(admin);

    if (!bank[target_belt]) {
      return json({ error: 'No question bank for belt ' + target_belt }, 400);
    }

    const { data: staffRow } = await admin
      .from('staff')
      .select('id, fid')
      .eq('id', staff_id)
      .single();

    if (!staffRow) return json({ error: 'Staff member not found' }, 404);

    const facility_id = staffRow.fid;

    // ── 2. Idempotency — return existing ACTIVE test ──
    const { data: existing } = await admin
      .from('sbd_belt_tests')
      .select('*')
      .eq('staff_id', staff_id)
      .eq('target_belt', target_belt)
      .eq('status', 'active')
      .maybeSingle();

    if (existing) return json({ test: existing, idempotent: true });

    // ── 3. Queue gate — approved Competency AND Simulation for this belt ──
    const { data: approved } = await admin
      .from('sbd_assessment_queue')
      .select('id, assessment_type')
      .eq('staff_id', staff_id)
      .eq('target_belt', target_belt)
      .eq('status', 'approved')
      .in('assessment_type', ['Competency', 'Simulation']);

    const types = new Set((approved || []).map((r: any) => r.assessment_type));

    if (!types.has('Competency') || !types.has('Simulation')) {
      return json({
        error: 'Belt test requires an approved Competency AND Simulation request for this belt.',
        code: 'QUEUE_NOT_APPROVED',
        found: Array.from(types),
      }, 403);
    }

    const queue_ids = (approved || []).map((r: any) => r.id);

    // ── 4. Seeded sampling ──
    const test_date = new Date().toISOString().slice(0, 10);
    const seed = deriveSeed(staff_id, target_belt, test_date);
    const skeleton = sampleSkeleton(bank, target_belt, seed);

    // Tag every item with variant_status so the audit trail survives.
    skeleton.knowledge.forEach((q: any) => {
      q.variant_status = 'fallback';
      q.skeleton_id = q.id;
    });

    skeleton.simulation.forEach((q: any) => {
      q.variant_status = 'fallback';
      q.skeleton_id = q.id;
    });

    // ── 5. Persist the skeleton ──
    const { data: inserted, error: insErr } = await admin
      .from('sbd_belt_tests')
      .insert({
        staff_id,
        facility_id,
        queue_ids,
        target_belt,
        seed,
        test_date,
        questions: {
          knowledge: skeleton.knowledge,
          simulation: skeleton.simulation,
        },
        variant_status: 'fallback',
        status: 'active',
      })
      .select('*')
      .single();

    if (insErr || !inserted) {
      // A concurrent request may have won the unique index — return the winner.
      const { data: race } = await admin
        .from('sbd_belt_tests')
        .select('*')
        .eq('staff_id', staff_id)
        .eq('target_belt', target_belt)
        .eq('status', 'active')
        .maybeSingle();

      if (race) return json({ test: race, idempotent: true });

      console.error('belt test insert error', insErr);
      return json({ error: 'Failed to persist belt test' }, 500);
    }

    return json({
      test: inserted,
      idempotent: false,
      variant_status: 'fallback',
    });
  } catch (err: any) {
    console.error('generate-belt-test error', err?.message || err);
    return json({ error: err?.message || 'Internal error' }, 500);
  }
});
