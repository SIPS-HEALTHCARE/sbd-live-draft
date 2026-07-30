import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6';
import { verifyUserAndFacility } from './auth.ts';

// ─── Inlined from supabase/functions/_shared/openrouter.ts (#47) ─────────────
// This function is deployed via the Supabase dashboard (copy-paste), which cannot
// resolve the `../_shared` import, so the resilient OpenRouter caller lives inline
// here. If _shared/openrouter.ts ever changes, mirror the change into this block.
//
// Tries the primary model; on a RETRYABLE failure (HTTP 429/5xx, network/timeout)
// it retries the same model with backoff, then falls back to the next model in the
// chain. On a DEAD-SLUG failure (404/400 naming an unknown model) it skips straight
// to the next model. On success the Response is returned with its body UNREAD.
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface CallOpenRouterOpts {
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

interface CallOpenRouterResult {
  res: Response; // ok response, body unread
  servedModel: string; // the model that answered
  attempts: number; // total network attempts made
}

function isDeadSlug(status: number, body: string): boolean {
  if (status !== 404 && status !== 400) return false;
  return /no endpoints|not a valid model|no allowed providers|model.*not found|is not a valid/i.test(body);
}

const isRetryableStatus = (s: number) => s === 429 || (s >= 500 && s <= 599);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callOpenRouter(opts: CallOpenRouterOpts): Promise<CallOpenRouterResult> {
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
// ─── end inlined openrouter ──────────────────────────────────────────────────

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function executeAdminSql(supabaseAdmin: any, query: string) {
    try {
        const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql_query: query });
        if (error) throw error;
        return JSON.stringify({ success: true, data: data || "Command executed successfully" });
    } catch (e: any) {
        return JSON.stringify({ success: false, error: e.message || 'SQL execution failed' });
    }
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const openRouterKey = Deno.env.get('OPENROUTER_API_KEY') || '';

        if (!openRouterKey) throw new Error('OPENROUTER_API_KEY is not configured in Supabase secrets.');

        const { message, history = [], systemPrompt = '', model = '' } = await req.json();

        // M.3 — per-mode model routing. The client sends a `model` hint (cheaper model for
        // low-stakes modes like Knowledge/Study); validate it against an allowlist and fall back
        // to the default, so an unknown/bad hint can never break a request.
        const DEFAULT_MODEL = 'anthropic/claude-sonnet-4.5';
        const ALLOWED_MODELS = new Set([
            'anthropic/claude-sonnet-4.5',
            'anthropic/claude-haiku-4.5',
        ]);
        const chosenModel = (typeof model === 'string' && ALLOWED_MODELS.has(model)) ? model : DEFAULT_MODEL;
        // #47: model fallback chain for every engine call. A routed (cheaper) model
        // that dies falls to Sonnet; transient 5xx/timeouts on either are retried by
        // the shared helper. Supersedes the old one-shot recursive self-heal.
        const modelChain = chosenModel === DEFAULT_MODEL ? [DEFAULT_MODEL] : [chosenModel, DEFAULT_MODEL];

        const authHeader = req.headers.get('Authorization') || '';
        let authResult;
        try {
            authResult = await verifyUserAndFacility(supabaseUrl, supabaseServiceKey, authHeader);
        } catch (e: any) {
            return new Response(JSON.stringify({
                error: e.message || 'DAVID Intelligence is currently locked for this facility.',
                action: 'ACTION_UPSELL'
            }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
        const { userId, userEmail, profile, facilityTier, customFacilityDirective, supabase } = authResult;

        let memoryInjection = "";
        try {
            const { data: memories } = await supabase
                .from('assistant_memory')
                .select('raw_interaction, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(8);
            if (memories && memories.length > 0) {
                const recentMemories = memories.reverse()
                    .filter(m => m.raw_interaction && m.raw_interaction.query)
                    .map(m => `User: "${m.raw_interaction.query}"\nYour Past Decision: "${(m.raw_interaction.response || '').substring(0, 250)}..."`)
                    .join('\n\n');
                if (recentMemories) {
                    memoryInjection += `\nRETAINED SWARM MEMORIES:\n${recentMemories}\n`;
                }
            }
            const { data: prefs } = await supabase
                .from('david_user_preferences')
                .select('memory_blob')
                .eq('user_id', userId)
                .single();
            if (prefs && prefs.memory_blob) {
                memoryInjection += `\n\n[USER PREFERENCES & META-MEMORY]\n${prefs.memory_blob}\n`;
            }
        } catch (e) {
            console.error('[DAVID] Memory load failed:', e);
        }

        const shadowDirectives = `
SHADOW DIRECTIVE - CITATIONS:
When making a statistical claim, provide the raw data subset inside an XML-style <citation> block. Example: dropped by 4%. <citation data='[{"fid": "abc"}]'></citation>

SHADOW DIRECTIVE - VISUAL CHARTING:
When comparing distributions, generate an inline <chart> XML tag. Example: <chart type="bar" labels='["Jan"]' data="[12]" title="Volume"></chart>

SHADOW DIRECTIVE - ANTICIPATORY CHIPS:
At the absolute end of every response, output 3 likely follow-ups in a <chips> block. Example: <chips>["Compare to last month"]</chips>
`;

        const messages: Array<any> = [];

        // ── M.0 HARD TOOL GATING (server-enforced — never trust the model to self-limit) ──
        // Raw SQL is restricted to the master_admin ROLE only (Decision 4 v1). This MUST be
        // role-based, not tier-based: facilityTier 'supreme' is operator-assignable to a
        // facility (auth.ts:43), so gating SQL on tier would let a facility escalate to full
        // RLS-bypassing DB access. Knowledge-base search is read-only over curriculum, so it
        // is allowed for premium+ tiers and master. Base tier gets no tools.
        const isMaster = profile?.role === 'master_admin';
        const canSql = isMaster;
        const canWiki = isMaster || facilityTier === 'premium' || facilityTier === 'supreme';

        let tierDirectives = `\n[INTELLIGENCE TIER: ${facilityTier.toUpperCase()}]\n`;
        if (isMaster) {
            tierDirectives += "You are operating with master administrator privileges: full forecasting, charting, live database access via exec_sql, and knowledge base retrieval.\n";
        } else if (canWiki) {
            tierDirectives += "You have forecasting, charting, and knowledge base retrieval. You do NOT have direct database access — never claim to run SQL or query the database directly.\n";
        }
        if (systemPrompt) {
            // #16 prompt caching. Split the system message into two content blocks:
            //   block 1 = the large, STABLE instrument/KB context (systemPrompt) with an ephemeral
            //             cache breakpoint — everything up to and including this block is cached.
            //   block 2 = the per-request DYNAMIC directives (memory, shadow, tier, facility), left
            //             UNcached so they never bust the cached prefix.
            // The win: within one request the autonomous loop makes several model calls that reuse
            // this exact system prefix (cache hit on calls 2..N), and across turns in a session the
            // prefix is unchanged. OpenRouter passes cache_control through to Anthropic; below the
            // model's minimum cacheable length it is simply ignored (no error), so this is safe even
            // for short prompts. Cost is still the provider's ground-truth `cost` (already discounted).
            const dynamicDirectives = '\n' + memoryInjection + '\n' + shadowDirectives + '\n' + tierDirectives + customFacilityDirective;
            messages.push({
                role: 'system',
                content: [
                    { type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } },
                    { type: 'text', text: dynamicDirectives },
                ],
            });
        }
        for (const msg of history) {
            if (msg && msg.content) messages.push({ role: msg.role, content: msg.content });
        }
        messages.push({ role: 'user', content: message });

        // Built conditionally per the M.0 capability flags above. Only the tools the caller is
        // actually authorized for are offered to the model (and re-checked at dispatch below).
        const SQL_TOOL = { type: "function", function: { name: "execute_database_sql", description: "Execute raw SQL against the Supabase database.", parameters: { type: "object", properties: { query: { type: "string", description: "The safe SQL query string to run." } }, required: ["query"] } } };
        const WIKI_TOOL = { type: "function", function: { name: "search_wiki_graph", description: "Search the SBD curriculum knowledge base. Use heavily for belt/curriculum questions. Returns exact context.", parameters: { type: "object", properties: { query: { type: "string", description: "The semantic search query." } }, required: ["query"] } } };
        const tools: Array<any> = [];
        if (canSql) tools.push(SQL_TOOL);
        if (canWiki) tools.push(WIKI_TOOL);

        // ── Gap 2 throttle (§7.2) — question-count + token metering pre-flight ──────
        // Guarded to real facility traffic: master/global sessions and facilities with no
        // access row are never metered (david_get_quota returns null → skip). FAIL-OPEN:
        // any quota-read error allows the request — a metering bug must never deny a paying
        // facility. The role class comes from the portal profile: line staff vs everyone else.
        // Team-Tasks-2026-07-29 enforce-monthly-token-cap: extends this same pre-flight to
        // also enforce max_monthly_tokens, so a facility is capped by whichever limit it
        // reaches first. evaluateQuota() is the shared math (10% reserve, staff paused at
        // 100%, manager/admin may draw the reserve, 75/90% soft notice); each cap still makes
        // its own allow/deny call so a token-cap failure can never change the question path's
        // response, and vice versa.
        const facilityId = profile?.facility_id;
        const throttleRole = (profile?.role === 'staff_member') ? 'staff' : 'manager';
        let drawingReserve = false;
        let softNotice: { state: string; percent: number } | null = null;

        function evaluateQuota(consumed: number, allowance: number, role: string) {
            const reserve = Math.round(allowance * 0.10);
            const pct = allowance > 0 ? (consumed / allowance) * 100 : 0;
            let allow = true;
            let usingReserve = false;
            if (pct >= 100) {                                  // AT_LIMIT
                if (role === 'staff') {
                    allow = false;                             // staff paused at 100%
                } else if (consumed < allowance + reserve) {
                    allow = true; usingReserve = true;         // manager/admin draws reserve
                } else {
                    allow = false;                             // reserve exhausted → all paused
                }
            }
            return { allow, usingReserve, pct };
        }

        if (!isMaster && facilityId) {
            try {
                const { data: q } = await supabase.rpc('david_get_quota', { p_facility_id: facilityId });
                if (q) {
                    // Question-count cap — behaviour byte-for-byte unchanged from before this task.
                    const questionCheck = evaluateQuota(q.questions_consumed || 0, q.questions_allowance || 0, throttleRole);
                    if (!questionCheck.allow) {
                        return new Response(JSON.stringify({
                            error: 'Monthly question limit reached for this facility.',
                            action: 'ACTION_QUOTA_EXHAUSTED',
                            state: 'AT_LIMIT',
                            role: throttleRole,
                            percent: Math.round(questionCheck.pct),
                        }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
                    }
                    drawingReserve = questionCheck.usingReserve;
                    if (questionCheck.pct >= 90) softNotice = { state: 'UPGRADE', percent: Math.round(questionCheck.pct) };
                    else if (questionCheck.pct >= 75) softNotice = { state: 'NOTICE', percent: Math.round(questionCheck.pct) };

                    // Token cap — same shape, distinct `action` so the UI can tell the two cases apart.
                    const tokenCheck = evaluateQuota(q.tokens_consumed || 0, q.max_monthly_tokens || 0, throttleRole);
                    if (!tokenCheck.allow) {
                        return new Response(JSON.stringify({
                            error: 'Monthly token limit reached for this facility.',
                            action: 'ACTION_TOKEN_QUOTA_EXHAUSTED',
                            state: 'AT_LIMIT',
                            role: throttleRole,
                            percent: Math.round(tokenCheck.pct),
                        }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
                    }
                    if (tokenCheck.pct >= 90) {
                        if (!softNotice || tokenCheck.pct > softNotice.percent) softNotice = { state: 'UPGRADE', percent: Math.round(tokenCheck.pct) };
                    } else if (tokenCheck.pct >= 75) {
                        if (!softNotice || tokenCheck.pct > softNotice.percent) softNotice = { state: 'NOTICE', percent: Math.round(tokenCheck.pct) };
                    }
                }
            } catch (e: any) {
                console.warn('[DAVID] Quota pre-flight failed (fail-open):', e?.message);
            }
        }

        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const encoder = new TextEncoder();

        let fullContent = '';

        // ── Usage metering (additive) ──────────────────────────────────────────────
        // Accumulate real token counts + the provider's reported generation cost across
        // every engine call in this request (the autonomous loop can make several), then
        // log one usage row after the answer completes. Fire-and-forget: it never blocks
        // the stream or changes the answer the user sees.
        let usagePromptTokens = 0;
        let usageCompletionTokens = 0;
        let usageCost = 0;
        // #16: cache token split (subset of prompt tokens). Provider field names vary — read the
        // OpenRouter-normalized prompt_tokens_details first, fall back to Anthropic-native names.
        let usageCachedTokens = 0;
        let usageCacheCreationTokens = 0;

        async function runAutonomousLoop(messageChain: any[], depth: number = 0) {
            if (depth > 8) return;

            // #47: resilient engine call. The shared helper walks modelChain
            // (routed model → Sonnet), retries transient 5xx/timeouts with backoff,
            // and skips a dead slug — replacing the prior one-shot recursive self-heal.
            let orRes: Response;
            try {
                const call = await callOpenRouter({
                    apiKey: openRouterKey,
                    models: modelChain,
                    messages: messageChain,
                    maxTokens: 4000,
                    temperature: 0.7,
                    stream: true,
                    title: 'DAVID Intelligence - SBD Belt Platform',
                    // Omit `tools` entirely when the caller has none (base tier) — an empty
                    // tools array is rejected by some providers. `usage` asks the provider
                    // for token accounting + real generation cost in the final chunk.
                    extraBody: { ...(tools.length > 0 ? { tools } : {}), usage: { include: true } },
                });
                orRes = call.res;
            } catch (err: any) {
                console.error('[DAVID] OpenRouter error (all models failed):', err?.message || err);
                await writer.write(encoder.encode(`data: ${JSON.stringify({ error: 'AI service error' })}\n\n`));
                return;
            }

            const reader = orRes.body?.getReader();
            if (!reader) return;
            const utf8Decoder = new TextDecoder('utf-8');
            let buffer = '';
            let currentToolCallId = '';
            let currentToolCallName = '';
            let currentToolCallArgs = '';
            let isUsingTool = false;
            let currentTurnText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += utf8Decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6).trim();
                        if (data === '[DONE]') continue;
                        try {
                            const json = JSON.parse(data);
                            const delta = json.choices?.[0]?.delta;
                            if (delta?.content && typeof delta.content === 'string') {
                                fullContent += delta.content;
                                currentTurnText += delta.content;
                                await writer.write(encoder.encode(`data: ${JSON.stringify({ text: delta.content })}\n\n`));
                            }
                            if (delta?.tool_calls) {
                                isUsingTool = true;
                                for (const toolChunk of delta.tool_calls) {
                                    if (toolChunk.id) currentToolCallId = toolChunk.id;
                                    if (toolChunk.function?.name) currentToolCallName = toolChunk.function.name;
                                    if (toolChunk.function?.arguments) currentToolCallArgs += toolChunk.function.arguments;
                                }
                            }
                            // Final chunk carries usage accounting (token counts + real cost).
                            if (json.usage) {
                                usagePromptTokens += json.usage.prompt_tokens || 0;
                                usageCompletionTokens += json.usage.completion_tokens || 0;
                                if (typeof json.usage.cost === 'number') usageCost += json.usage.cost;
                                usageCachedTokens += json.usage.prompt_tokens_details?.cached_tokens ?? json.usage.cache_read_input_tokens ?? 0;
                                usageCacheCreationTokens += json.usage.prompt_tokens_details?.cache_write_tokens ?? json.usage.cache_creation_input_tokens ?? 0;
                            }
                        } catch (e) { /* partial */ }
                    }
                }
            }

            if (isUsingTool && currentToolCallName) {
                messageChain.push({ role: "assistant", content: currentTurnText || null, tool_calls: [{ id: currentToolCallId, type: "function", function: { name: currentToolCallName, arguments: currentToolCallArgs } }] });
                let toolResult = "";
                try {
                    const parsedArgs = JSON.parse(currentToolCallArgs);
                    if (currentToolCallName === 'execute_database_sql') {
                        // Defense in depth: this tool is not offered to non-master callers, but
                        // reject server-side too in case the model fabricates the call.
                        if (!canSql) {
                            console.warn(`[DAVID] Blocked unauthorized execute_database_sql (role=${profile?.role}, tier=${facilityTier})`);
                            toolResult = JSON.stringify({ error: 'Unauthorized: direct database access is restricted to master administrators.' });
                        } else {
                            await writer.write(encoder.encode(`data: ${JSON.stringify({ text: `\n\n> Running analysis...\n\n` })}\n\n`));
                            toolResult = await executeAdminSql(supabase, parsedArgs.query);
                        }
                    } else if (currentToolCallName === 'search_wiki_graph') {
                        if (!canWiki) {
                            console.warn(`[DAVID] Blocked unauthorized search_wiki_graph (role=${profile?.role}, tier=${facilityTier})`);
                            toolResult = JSON.stringify({ error: 'Unauthorized: knowledge base search is not enabled for this tier.' });
                        } else {
                            await writer.write(encoder.encode(`data: ${JSON.stringify({ text: `\n\n> Searching knowledge base...\n\n` })}\n\n`));
                            const pineconeKey = Deno.env.get('PINECONE_API_KEY');
                            if (!pineconeKey) throw new Error("PINECONE_API_KEY missing.");
                            const r = await fetch('https://sbd-knowledge-ai-8al9o1g.svc.aped-4627-b74a.pinecone.io/records/namespaces/master-docs/search', {
                                method: 'POST',
                                headers: { 'Api-Key': pineconeKey, 'Content-Type': 'application/json' },
                                body: JSON.stringify({ query: { inputs: { text: parsedArgs.query }, top_k: 5 } })
                            });
                            toolResult = JSON.stringify(await r.json());
                        }
                    } else {
                        toolResult = JSON.stringify({ error: 'Unknown tool requested.' });
                    }
                } catch (err: any) {
                    toolResult = JSON.stringify({ error: err.message });
                }
                messageChain.push({ role: "tool", tool_call_id: currentToolCallId, name: currentToolCallName, content: toolResult });
                await runAutonomousLoop(messageChain, depth + 1);
            }
        }

        (async () => {
            try {
                // Gap 2 — non-blocking heads-up banner at 75% (NOTICE) / 90% (UPGRADE).
                // Streamed as a meta line so the UI can render it without altering the answer.
                if (softNotice) {
                    await writer.write(encoder.encode(`data: ${JSON.stringify({ meta: { quota: softNotice } })}\n\n`));
                }

                await runAutonomousLoop(messages);

                const visibleAnswer = fullContent
                    .replace(/(<|&lt;)thinking(>|&gt;)[\s\S]*?(<\/|&lt;\/)thinking(>|&gt;|$)/gi, '')
                    .replace(/<chips>[\s\S]*?(?:<\/chips>|$)/gi, '')
                    .replace(/<citation[\s\S]*?<\/citation>/gi, '')
                    .replace(/<chart[\s\S]*?<\/chart>/gi, '')
                    .replace(/```sql[\s\S]*?```/gi, '')
                    .replace(/```json[\s\S]*?```/gi, '')
                    .replace(/>\s*[*_][^\n]*[*_]/g, '')
                    .trim();

                if (!visibleAnswer) {
                    messages.push({ role: 'system', content: 'Your previous turn produced no visible answer. Respond NOW with your full answer in plain conversational text only. Do NOT use <thinking>, <chips>, <chart>, or <citation>. Do NOT call tools. Coach from any knowledge base results you already have.' });
                    // #47: same resilient path for the forced-completion recovery.
                    let forced: Response | null = null;
                    try {
                        const fcall = await callOpenRouter({
                            apiKey: openRouterKey,
                            models: [DEFAULT_MODEL],
                            messages,
                            maxTokens: 3000,
                            temperature: 0.7,
                            stream: true,
                            title: 'DAVID',
                            extraBody: { usage: { include: true } },
                        });
                        forced = fcall.res;
                    } catch (err: any) {
                        console.error('[DAVID] Forced completion failed:', err?.message || err);
                    }
                    if (forced && forced.ok && forced.body) {
                        const fReader = forced.body.getReader();
                        const fDecoder = new TextDecoder('utf-8');
                        let fBuffer = '';
                        while (true) {
                            const { done, value } = await fReader.read();
                            if (done) break;
                            fBuffer += fDecoder.decode(value, { stream: true });
                            const fLines = fBuffer.split('\n');
                            fBuffer = fLines.pop() || '';
                            for (const fLine of fLines) {
                                if (!fLine.startsWith('data: ')) continue;
                                const fData = fLine.slice(6).trim();
                                if (fData === '[DONE]') continue;
                                try {
                                    const fJson = JSON.parse(fData);
                                    const fText = fJson.choices?.[0]?.delta?.content;
                                    if (fText && typeof fText === 'string') {
                                        fullContent += fText;
                                        await writer.write(encoder.encode(`data: ${JSON.stringify({ text: fText })}\n\n`));
                                    }
                                    if (fJson.usage) {
                                        usagePromptTokens += fJson.usage.prompt_tokens || 0;
                                        usageCompletionTokens += fJson.usage.completion_tokens || 0;
                                        if (typeof fJson.usage.cost === 'number') usageCost += fJson.usage.cost;
                                        usageCachedTokens += fJson.usage.prompt_tokens_details?.cached_tokens ?? fJson.usage.cache_read_input_tokens ?? 0;
                                        usageCacheCreationTokens += fJson.usage.prompt_tokens_details?.cache_write_tokens ?? fJson.usage.cache_creation_input_tokens ?? 0;
                                    }
                                } catch (_e) { /* ignore */ }
                            }
                        }
                    } else if (forced) {
                        console.error('[DAVID] Forced completion failed:', forced.status);
                    }
                }

                await writer.write(encoder.encode('data: [DONE]\n\n'));

                supabase.from('assistant_memory').insert({
                    user_id: profile.auth_uid,
                    interaction_type: 'chat',
                    context_summary: `Facility: ${profile.facility_id || 'Global'} [SUPREME MODE]`,
                    raw_interaction: { query: message, response: fullContent }
                }).then(({ error }: { error: any }) => {
                    if (error) console.warn('[DAVID] Memory store skipped:', error.message);
                });

                // ── Usage metering (additive, restores logging + fixes cost & facility) ──
                // Logging stopped on 2026-06-15; this restores it correctly. cost is the
                // provider's ground-truth generation cost (not the old (prompt+completion)*$15/M
                // formula that overstated input ~5x). facility_id is the caller's real facility;
                // SIPS-internal master sessions (no facility) log as master-admin-global.
                // Fire-and-forget — a logging failure never affects the user's answer.
                supabase.from('david_usage_logs').insert({
                    facility_id: profile?.facility_id || 'master-admin-global',
                    user_id: userId,
                    prompt_tokens: usagePromptTokens,
                    completion_tokens: usageCompletionTokens,
                    cost: usageCost,
                    // #16: cache split behind the same cost. 0 when the provider reports no cache
                    // activity (prefix below the model's minimum, or a cold cache).
                    cached_tokens: usageCachedTokens,
                    cache_creation_tokens: usageCacheCreationTokens
                }).then(({ error }: { error: any }) => {
                    if (error) console.warn('[DAVID] Usage log skipped:', error.message);
                });

                // ── Gap 2 — count one completed chat request against the facility's monthly
                // question allowance (§6 Fix 2). Fires exactly once per user request here,
                // AFTER the full autonomous loop (incl. any tool round-trips and the forced-
                // completion retry) — never once per internal model call. Skipped for master/
                // global sessions and facilities with no access row. Fire-and-forget.
                if (!isMaster && facilityId) {
                    supabase.rpc('david_consume_question', {
                        p_facility_id: facilityId,
                        p_is_reserve: drawingReserve,
                        p_tokens: usagePromptTokens + usageCompletionTokens,
                    })
                        .then(({ error }: { error: any }) => {
                            if (error) console.warn('[DAVID] Question count skipped:', error.message);
                        });
                }

            } catch (err: any) {
                console.error('[DAVID] Run Loop error:', err);
                await writer.write(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
            } finally {
                await writer.close();
            }
        })();

        return new Response(readable, {
            headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' }
        });

    } catch (err: any) {
        console.error('[DAVID] Edge Function Initialization Error:', err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
