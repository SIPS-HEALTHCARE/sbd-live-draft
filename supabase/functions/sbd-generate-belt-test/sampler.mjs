/* ============================================================================
 * sampler.mjs — deterministic seeded sampler for the Dynamic Belt Test (A4)
 *
 * Dependency-free. Imported by BOTH the Deno edge function (index.ts) and the
 * Node acceptance harness (scripts/verify-belt-test-generation.js), so it must
 * stay pure ESM with zero imports.
 *
 * Determinism contract: deriveSeed(staffId, belt, dateISO) -> uint32 seed.
 * sampleSkeleton(bank, belt, seed) returns the SAME 40 knowledge + 20 sim items
 * (same ids, same option order) for the same inputs, every time. This is what
 * makes "reload returns the same test" safe even before the row is persisted,
 * and lets a regeneration reproduce a test byte-for-byte from its stored seed.
 *
 * Coverage contract: each belt level defines exactly 8 knowledge slots + 4
 * simulation slots. The sampler picks EXACTLY ONE variant per slot, so every
 * generation covers the identical competency set ("same competencies covered"
 * acceptance criterion) while varying which authored variant is delivered.
 * ==========================================================================*/

const LEVELS = [1, 2, 3, 4, 5];
export const KNOWLEDGE_SLOTS_PER_LEVEL = 8;
export const SIM_SLOTS_PER_LEVEL = 4;

/* ---- PRNG: fnv1a32 hash -> mulberry32 stream ---------------------------- */

export function fnv1a32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    // 32-bit FNV prime multiply via shifts (keeps it in uint32 range).
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function deriveSeed(staffId, belt, dateISO) {
  return fnv1a32([String(staffId), String(belt), String(dateISO)].join('|'));
}

// Fisher-Yates using a supplied rng() in [0,1). Returns a new array.
function seededShuffle(arr, rng) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = out[i]; out[i] = out[j]; out[j] = t;
  }
  return out;
}

function pickOne(variants, rng) {
  return variants[Math.floor(rng() * variants.length)];
}

// Group an array of bank items by their `slot` field, preserving order.
function bySlot(items) {
  const map = new Map();
  (items || []).forEach((it) => {
    if (!map.has(it.slot)) map.set(it.slot, []);
    map.get(it.slot).push(it);
  });
  return map;
}

/* ---- Knowledge option shuffling ---------------------------------------- */
// Shuffles MCQ options with the seeded rng and REMAPS `correct` to the new
// index of the originally-correct option. Strips answer metadata is the
// caller's job; the skeleton keeps `correct` for server-side scoring.
function shuffleOptions(item, rng) {
  const idx = item.options.map((_, i) => i);
  const order = seededShuffle(idx, rng);
  const options = order.map((i) => item.options[i]);
  const correct = order.indexOf(item.correct);
  return Object.assign({}, item, { options, correct });
}

/* ---- Main sampler ------------------------------------------------------- */
// bank: { [belt]: { knowledge:[...items], simulation:[...items] } }
// Each item: { id, level, slot, ... }. Knowledge items also { options, correct }.
// Returns { knowledge:[40], simulation:[20], skeletonIds, meta }.
export function sampleSkeleton(bank, belt, seed) {
  const beltBank = bank[belt];
  if (!beltBank) throw new Error(`No bank content for belt "${belt}"`);
  const rng = mulberry32(seed);

  const knowledge = [];
  const simulation = [];

  // Deterministic per-level, per-slot selection. Slot identity is the design
  // contract for coverage; we sort slot keys so iteration order never depends
  // on object insertion quirks across runtimes.
  LEVELS.forEach((L) => {
    const kSlots = bySlot((beltBank.knowledge || []).filter((q) => Number(q.level) === L));
    const sSlots = bySlot((beltBank.simulation || []).filter((q) => Number(q.level) === L));

    Array.from(kSlots.keys()).sort().forEach((slot) => {
      const chosen = pickOne(kSlots.get(slot), rng);
      knowledge.push(shuffleOptions(Object.assign({ skeleton_slot: slot }, chosen), rng));
    });
    Array.from(sSlots.keys()).sort().forEach((slot) => {
      const chosen = pickOne(sSlots.get(slot), rng);
      simulation.push(Object.assign({ skeleton_slot: slot }, chosen));
    });
  });

  // Seeded shuffle of delivery order (keeps levels interleaved unpredictably).
  const kOrdered = seededShuffle(knowledge, rng);
  const sOrdered = seededShuffle(simulation, rng);

  return {
    knowledge: kOrdered,
    simulation: sOrdered,
    skeletonIds: {
      knowledge: kOrdered.map((q) => q.id),
      simulation: sOrdered.map((q) => q.id)
    },
    meta: {
      belt,
      seed,
      knowledge_count: kOrdered.length,
      simulation_count: sOrdered.length
    }
  };
}

// Validate that a belt's bank is structurally complete: every level has exactly
// the required slot count, each slot has >= 1 variant. Returns { ok, errors }.
export function validateBankShape(bank, belt) {
  const errors = [];
  const beltBank = bank[belt];
  if (!beltBank) return { ok: false, errors: [`missing belt "${belt}"`] };
  LEVELS.forEach((L) => {
    const kSlots = bySlot((beltBank.knowledge || []).filter((q) => Number(q.level) === L));
    const sSlots = bySlot((beltBank.simulation || []).filter((q) => Number(q.level) === L));
    if (kSlots.size !== KNOWLEDGE_SLOTS_PER_LEVEL) {
      errors.push(`${belt} L${L}: ${kSlots.size} knowledge slots, expected ${KNOWLEDGE_SLOTS_PER_LEVEL}`);
    }
    if (sSlots.size !== SIM_SLOTS_PER_LEVEL) {
      errors.push(`${belt} L${L}: ${sSlots.size} simulation slots, expected ${SIM_SLOTS_PER_LEVEL}`);
    }
    kSlots.forEach((variants, slot) => {
      if (variants.length < 1) errors.push(`${belt} L${L} slot ${slot}: no variants`);
      variants.forEach((v) => {
        if (!Array.isArray(v.options) || v.options.length !== 4) {
          errors.push(`${belt} ${v.id}: must have exactly 4 options`);
        }
        if (typeof v.correct !== 'number' || v.correct < 0 || v.correct > 3) {
          errors.push(`${belt} ${v.id}: invalid correct index`);
        }
      });
    });
  });
  return { ok: errors.length === 0, errors };
}
