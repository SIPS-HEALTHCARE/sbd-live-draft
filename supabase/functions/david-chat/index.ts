import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6';
import { verifyUserAndFacility } from './auth.ts';

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

        const { message, history = [], systemPrompt = '' } = await req.json();

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
        let tierDirectives = `\n[INTELLIGENCE TIER: ${facilityTier.toUpperCase()}]\n`;
        if (facilityTier === 'supreme') {
            tierDirectives += "You are operating in SUPREME tier. You have unrestricted access to forecasting, charts, and live automation via exec_sql.\n";
        }
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt + '\n' + memoryInjection + '\n' + shadowDirectives + '\n' + tierDirectives + customFacilityDirective });
        }
        for (const msg of history) {
            if (msg && msg.content) messages.push({ role: msg.role, content: msg.content });
        }
        messages.push({ role: 'user', content: message });

        const tools = [
            { type: "function", function: { name: "execute_database_sql", description: "Execute raw SQL against the Supabase database.", parameters: { type: "object", properties: { query: { type: "string", description: "The safe SQL query string to run." } }, required: ["query"] } } },
            { type: "function", function: { name: "search_wiki_graph", description: "Search the SBD curriculum knowledge base. Use heavily for belt/curriculum questions. Returns exact context.", parameters: { type: "object", properties: { query: { type: "string", description: "The semantic search query." } }, required: ["query"] } } }
        ];

        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const encoder = new TextEncoder();

        let fullContent = '';

        async function runAutonomousLoop(messageChain: any[], depth: number = 0) {
            if (depth > 8) return;

            const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${openRouterKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://belt.sterilebydesign.ai',
                    'X-Title': 'DAVID Intelligence - SBD Belt Platform',
                },
                body: JSON.stringify({
                    model: 'anthropic/claude-sonnet-4.5',
                    messages: messageChain,
                    tools: tools,
                    max_tokens: 4000,
                    temperature: 0.7,
                    stream: true,
                }),
            });

            if (!orRes.ok) {
                const errBody = await orRes.text();
                console.error('[DAVID] OpenRouter error:', errBody);
                await writer.write(encoder.encode(`data: ${JSON.stringify({ error: `AI service error: ${errBody}` })}\n\n`));
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
                        await writer.write(encoder.encode(`data: ${JSON.stringify({ text: `\n\n> Running analysis...\n\n` })}\n\n`));
                        toolResult = await executeAdminSql(supabase, parsedArgs.query);
                    } else if (currentToolCallName === 'search_wiki_graph') {
                        await writer.write(encoder.encode(`data: ${JSON.stringify({ text: `\n\n> Searching knowledge base...\n\n` })}\n\n`));
                        const pineconeKey = Deno.env.get('PINECONE_API_KEY');
                        if (!pineconeKey) throw new Error("PINECONE_API_KEY missing.");
                        const r = await fetch('https://sbd-knowledge-ai-44928mo.svc.aped-4627-b74a.pinecone.io/records/namespaces/master-docs/search', {
                            method: 'POST',
                            headers: { 'Api-Key': pineconeKey, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ query: { inputs: { text: parsedArgs.query }, top_k: 5 } })
                        });
                        toolResult = JSON.stringify(await r.json());
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
                    const forced = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${openRouterKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://belt.sterilebydesign.ai', 'X-Title': 'DAVID' },
                        body: JSON.stringify({ model: 'anthropic/claude-sonnet-4.5', messages, max_tokens: 3000, temperature: 0.7, stream: true }),
                    });
                    if (forced.ok && forced.body) {
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
                                } catch (_e) { /* ignore */ }
                            }
                        }
                    } else {
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
