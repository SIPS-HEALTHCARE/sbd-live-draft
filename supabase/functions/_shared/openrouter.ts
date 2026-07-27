// Resilient OpenRouter caller shared by the edge functions that hit the provider
// directly (sbd-score-assessment, david-grade-assessment [orphaned — see its header], and
// — later — david-chat).
//
// Tries the primary model; on a RETRYABLE failure — HTTP 429/5xx, a network/timeout
// error — it retries the same model with backoff, then falls back to the next model
// in the chain. On a DEAD-SLUG failure (404/400 naming an unknown model) it skips
// straight to the next model without wasting retries — that is the exact failure the
// retired Haiku slug hit. Returns which model actually answered so callers can record
// or surface it (#47 active-model indicator).
//
// On success the Response is returned with its body UNREAD, so the caller can .json()
// or stream it. Error bodies are consumed internally to decide retry vs fall-through.

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface CallOpenRouterOpts {
  apiKey: string;
  models: readonly string[]; // [primary, ...fallbacks]
  messages: unknown[];
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  referer?: string;
  title?: string;
  timeoutMs?: number; // per-attempt abort (default 30s)
  maxRetriesPerModel?: number; // transient retries before moving to the next model
  extraBody?: Record<string, unknown>; // merged into the request body (e.g. tools, usage)
}

export interface CallOpenRouterResult {
  res: Response; // ok response, body unread
  servedModel: string; // the model that answered
  attempts: number; // total network attempts made
}

// A 404/400 naming a bad slug is permanent for that model — never retry it, fall
// straight to the next one.
function isDeadSlug(status: number, body: string): boolean {
  if (status !== 404 && status !== 400) return false;
  return /no endpoints|not a valid model|no allowed providers|model.*not found|is not a valid/i.test(body);
}

const isRetryableStatus = (s: number) => s === 429 || (s >= 500 && s <= 599);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function callOpenRouter(opts: CallOpenRouterOpts): Promise<CallOpenRouterResult> {
  const {
    apiKey,
    models,
    messages,
    maxTokens,
    temperature,
    stream = false,
    referer = 'https://belt.sterilebydesign.ai',
    title = 'SBD',
    timeoutMs = 30000,
    maxRetriesPerModel = 2,
    extraBody,
  } = opts;

  if (!apiKey) throw new Error('callOpenRouter: OPENROUTER_API_KEY missing');
  if (!models || models.length === 0) throw new Error('callOpenRouter: no models provided');

  let attempts = 0;
  let lastError = 'no attempt made';

  for (const model of models) {
    for (let retry = 0; retry <= maxRetriesPerModel; retry++) {
      attempts++;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(OPENROUTER_URL, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': referer,
            'X-Title': title,
          },
          body: JSON.stringify({
            model,
            messages,
            ...(maxTokens != null ? { max_tokens: maxTokens } : {}),
            ...(temperature != null ? { temperature } : {}),
            ...(stream ? { stream: true } : {}),
            ...(extraBody || {}),
          }),
        });
        clearTimeout(timer);

        if (res.ok) return { res, servedModel: model, attempts };

        const body = await res.text();
        lastError = `model=${model} status=${res.status} ${body.slice(0, 300)}`;
        console.error('[openrouter]', lastError);

        if (isDeadSlug(res.status, body)) break; // permanent → next model
        if (isRetryableStatus(res.status) && retry < maxRetriesPerModel) {
          await sleep(300 * (retry + 1));
          continue; // transient → retry same model
        }
        break; // non-retryable (e.g. 401/403) → next model
      } catch (err) {
        clearTimeout(timer);
        lastError = `model=${model} network/timeout: ${err instanceof Error ? err.message : String(err)}`;
        console.error('[openrouter]', lastError);
        if (retry < maxRetriesPerModel) {
          await sleep(300 * (retry + 1));
          continue; // transient network → retry same model
        }
        break; // exhausted retries → next model
      }
    }
  }

  throw new Error(`OpenRouter failed for all models [${models.join(', ')}]. Last error: ${lastError}`);
}
