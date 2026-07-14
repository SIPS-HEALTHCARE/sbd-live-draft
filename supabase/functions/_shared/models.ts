// Single source of truth for the OpenRouter model slugs each edge function uses,
// plus the fallback chains #47 wires in.
//
// Why this file exists: a retired slug (`anthropic/claude-3.5-haiku`) once returned
// 404 and silently dropped every simulation grade to the keyword fallback. Keeping
// the slugs in one place makes "which model is active" answerable from the admin API
// (the Command Center indicator) and lets a dead primary fall through to a live model
// instead of failing the request outright.

export const MODELS = {
  chatDefault: 'anthropic/claude-sonnet-4.5',
  chatCheap: 'anthropic/claude-haiku-4.5',
  assessmentScorer: 'anthropic/claude-haiku-4.5',
  grader: 'anthropic/claude-sonnet-4.5',
} as const;

// Primary first. Each chain crosses the Haiku/Sonnet tiers so a retired slug or a
// single-tier outage still yields a graded result rather than a 502.
export const MODEL_CHAINS = {
  assessmentScorer: [MODELS.assessmentScorer, MODELS.chatDefault], // haiku → sonnet
  grader: [MODELS.grader, MODELS.chatCheap],                       // sonnet → haiku
} as const;
