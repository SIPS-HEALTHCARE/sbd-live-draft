import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Supabase execute SQL wrapper (Admin only)
async function executeAdminSql(supabaseAdmin: any, query: string) {
    try {
        console.log(`[DAVID SUPREME] Executing SQL: ${query}`);
        // Requires a Postgres function named 'exec_sql' granting exec access:
        // We will pass the query text. If exec_sql doesn't exist, we will gracefully return an error.
        const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql_query: query });
        if (error) throw error;
        return JSON.stringify({ success: true, data: data || "Command executed successfully" });
    } catch (e: any) {
        return JSON.stringify({ success: false, error: e.message || 'SQL execution failed' });
    }
}

/**
 * DAVID AI Chat Assistant - Supreme Autonomous Level
 * Powered by OpenRouter (Claude 3.7 Sonnet) with Tool Execution
 */
serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const openRouterKey = Deno.env.get('OPENROUTER_API_KEY') || '';

        if (!openRouterKey) throw new Error('OPENROUTER_API_KEY is not configured in Supabase secrets.');

        const { message, history = [], systemPrompt = '' } = await req.json();

        // 1. Verify Authentication & Role
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Unauthorized: Missing Auth Header');

        const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        });
        
        const { error: pgError } = await supabaseUserClient.from('sbd_portal_users').select('auth_uid').limit(1);
        if (pgError) throw new Error(`Invalid Session Signature: ${pgError.message || pgError.code}`);

        const jwt = authHeader.replace(/^Bearer\s+/i, '');
        let userId = '';
        let userEmail = 'ES256_User';
        
        try {
            const base64Url = jwt.split('.')[1];
            let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            while (base64.length % 4) base64 += '=';
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const payload = JSON.parse(jsonPayload);
            userId = payload.sub;
            userEmail = payload.email || 'ES256_Auth_User';
        } catch (e) {
            throw new Error(`Unauthorized (Token Extraction Failed): ${e.message}`);
        }

        if (!userId) throw new Error('Unauthorized: UUID extraction failed.');

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data: profile } = await supabase.from('sbd_portal_users')
            .select('*')
            .eq('auth_uid', userId)
            .single();

        if (!profile || profile.role !== 'master_admin') {
            console.error(`[DAVID] Blocked: User is role: ${profile?.role}`);
            throw new Error('Restricted to Master Admin accounts only.');
        }

        console.log(`[DAVID SUPREME] ${userEmail} (${profile.role}) → initiating autonomous loop`);

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
                    .map(m => `User: "${m.raw_interaction.query}"\nYour Past Decision: "${m.raw_interaction.response.substring(0, 250)}..."`)
                    .join('\n\n');
                
                if (recentMemories) {
                    memoryInjection = `\nRETAINED SWARM MEMORIES:\n${recentMemories}\nExtract meta-insights from these past interactions.`;
                }
            }
        } catch (e) {
            console.error('[DAVID] Memory load failed:', e);
        }

        // 2. Build initial messages
        const messages: Array<any> = [];
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt + '\n' + memoryInjection });
        }
        for (const msg of history) {
            messages.push({ role: msg.role, content: msg.content });
        }
        messages.push({ role: 'user', content: message });

        // Standard tool definition for Anthropic via OpenRouter
        const tools = [
            {
                type: "function",
                function: {
                    name: "execute_database_sql",
                    description: "Execute raw SQL against the Supabase database. Use this to audit logs, diagnose failures, or repair schemas.",
                    parameters: {
                        type: "object",
                        properties: {
                            query: {
                                type: "string",
                                description: "The safe SQL query string to run."
                            }
                        },
                        required: ["query"]
                    }
                }
            }
        ];

        // 3. Prepare the Server-Sent Events stream immediately to avoid timeouts
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const encoder = new TextEncoder();

        let fullContent = '';

        // Internal recursive async loop
        async function runAutonomousLoop(messageChain: any[], depth: number = 0) {
            if (depth > 4) {
                await writer.write(encoder.encode(`data: ${JSON.stringify({ text: "\n\n[DAVID] Auto-halted tool execution to prevent recursion lock." })}\n\n`));
                return;
            }

            const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${openRouterKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://belt.sterilebydesign.ai',
                    'X-Title': 'DAVID Intelligence - SBD Belt Platform',
                },
                body: JSON.stringify({
                    model: 'anthropic/claude-3.7-sonnet',
                    messages: messageChain,
                    tools: tools,
                    max_tokens: 8000,
                    temperature: 0.7,
                    stream: true,
                }),
            });

            if (!orRes.ok) {
                const errBody = await orRes.text();
                await writer.write(encoder.encode(`data: ${JSON.stringify({ error: `AI service error: ${errBody}` })}\n\n`));
                return;
            }

            const reader = orRes.body?.getReader();
            if (!reader) return;

            const utf8Decoder = new TextDecoder('utf-8');
            let buffer = '';
            
            // Tool call buffering
            let currentToolCallId = '';
            let currentToolCallName = '';
            let currentToolCallArgs = '';
            let isUsingTool = false;

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
                            
                            // Handle standard text content
                            if (delta?.content && typeof delta.content === 'string') {
                                fullContent += delta.content;
                                await writer.write(encoder.encode(`data: ${JSON.stringify({ text: delta.content })}\n\n`));
                            }
                            
                            // Handle tool calls streaming
                            if (delta?.tool_calls) {
                                isUsingTool = true;
                                for (const toolChunk of delta.tool_calls) {
                                    if (toolChunk.id) currentToolCallId = toolChunk.id;
                                    if (toolChunk.function?.name) currentToolCallName = toolChunk.function.name;
                                    if (toolChunk.function?.arguments) currentToolCallArgs += toolChunk.function.arguments;
                                }
                            }
                        } catch (e) {
                            // Ignored partial json
                        }
                    }
                }
            }

            // Stream iteration finished. Did he use a tool?
            if (isUsingTool && currentToolCallName) {
                // Let user know he's executing
                await writer.write(encoder.encode(`data: ${JSON.stringify({ text: `\n\n<thinking>Executing internal protocol: ${currentToolCallName}...</thinking>\n\n` })}\n\n`));
                
                // Track assistant action
                messageChain.push({
                    role: "assistant",
                    content: null,
                    tool_calls: [{
                        id: currentToolCallId,
                        type: "function",
                        function: {
                            name: currentToolCallName,
                            arguments: currentToolCallArgs
                        }
                    }]
                });

                let toolResult = "";
                try {
                    const parsedArgs = JSON.parse(currentToolCallArgs);
                    if (currentToolCallName === 'execute_database_sql') {
                        toolResult = await executeAdminSql(supabase, parsedArgs.query);
                    } else {
                        toolResult = JSON.stringify({ error: 'Unknown tool requested.' });
                    }
                } catch (err: any) {
                    toolResult = JSON.stringify({ error: err.message });
                }

                messageChain.push({
                    role: "tool",
                    tool_call_id: currentToolCallId,
                    name: currentToolCallName,
                    content: toolResult
                });

                // Loop back around with the tool result injected into the conversation
                await runAutonomousLoop(messageChain, depth + 1);
            }
        }

        // Kick off loop asynchronously so the Response can be returned instantly
        (async () => {
            try {
                await runAutonomousLoop(messages);
                
                // End the stream cleanly
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
            headers: { 
                ...corsHeaders, 
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            }
        });

    } catch (err: any) {
        console.error('[DAVID] Edge Function Initialization Error:', err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
