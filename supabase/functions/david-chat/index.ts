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

        const jwt = authHeader.replace(/^Bearer\s+/i, '');
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
        if (authError || !user) throw new Error(`Unauthorized: Invalid or expired session (${authError?.message || 'No user found'})`);

        const userId = user.id;
        const userEmail = user.email || 'ES256_Auth_User';

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
            // Fetch assistant interaction memories
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
                    memoryInjection += `\nRETAINED SWARM MEMORIES:\n${recentMemories}\nExtract meta-insights from these past interactions.`;
                }
            }

            // Fetch explicit meta-memory preferences
            const { data: prefs } = await supabase
                .from('david_user_preferences')
                .select('memory_blob')
                .eq('user_id', userId)
                .single();

            if (prefs && prefs.memory_blob) {
                memoryInjection += `\n\n[USER PREFERENCES & META-MEMORY]\nYou must strictly adhere to the following learned behaviors for this specific user:\n${prefs.memory_blob}\n`;
            }
        } catch (e) {
            console.error('[DAVID] Memory load failed:', e);
        }

        // Add verbatim shadow directives for advanced intelligence features
        const shadowDirectives = `
SHADOW DIRECTIVE - CITATIONS:
When making a statistical claim, calculating a metric, or evaluating trend data, you must provide the raw data subset that validates your claim inside an XML-style <citation> block immediately following the claim. Example: Total elite practitioners dropped by 4%. <citation data='[{"fid": "abc", "change": "-4%"}]'></citation>

SHADOW DIRECTIVE - VISUAL CHARTING:
When comparing distributions, benchmarking multiple facilities, or showing historical trends, you MUST generate an inline chart. Use the <chart> XML tag. Ensure labels and data arrays correspond exactly.
Example: <chart type="bar" labels='["Jan", "Feb", "Mar"]' data="[12, 19, 15]" title="Monthly Processing Volume"></chart>

SHADOW DIRECTIVE - ANTICIPATORY CHIPS:
At the absolute end of every response, you MUST predict the 3 most likely executive follow-up questions or actions and output them in a JSON array inside a <chips> block. 
Example: <chips>["Compare to last month", "Audit underperforming groups", "Escalate to priority"]</chips>
`;

        // 2. Build initial messages
        const messages: Array<any> = [];
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt + '\n' + memoryInjection + '\n' + shadowDirectives });
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
                    description: "Execute raw SQL against the Supabase database. Use this to audit logs, diagnose failures, or repair schemas. When viewing metrics, try to answer based on this.",
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
            },
            {
                type: "function",
                function: {
                    name: "update_meta_memory",
                    description: "Update the user's permanent meta-memory preferences based on conversational cues (e.g., 'always use bullets').",
                    parameters: {
                        type: "object",
                        properties: {
                            memory_blob: {
                                type: "string",
                                description: "The updated consolidated string of user preferences."
                            }
                        },
                        required: ["memory_blob"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "search_wiki_graph",
                    description: "Search the structured Compounding LLM Wiki Knowledge Graph. Use this heavily to look up official policies, guidelines, previously synthesized research, or SBD protocols. Returns exact context.",
                    parameters: {
                        type: "object",
                        properties: {
                            query: { type: "string", description: "The semantic search query." }
                        },
                        required: ["query"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "upsert_wiki_page",
                    description: "Save or update a highly synthesized, cross-referenced Markdown page permanently into your Knowledge Graph brain. Use this when you deduce a complex insight, procedural summary, or policy breakdown that should be saved globally.",
                    parameters: {
                        type: "object",
                        properties: {
                            slug: { type: "string", description: "A unique URL-friendly identifier e.g. 'alta-bates-staffing-policy'" },
                            content_md: { type: "string", description: "The highly synthesized markdown content." }
                        },
                        required: ["slug", "content_md"]
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
            if (depth > 12) {
                await writer.write(encoder.encode(`data: ${JSON.stringify({ text: "\n\n> **[DAVID]** Auto-halted tool execution to prevent recursion lock." })}\n\n`));
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
                            
                            // Handle standard text content
                            if (delta?.content && typeof delta.content === 'string') {
                                fullContent += delta.content;
                                currentTurnText += delta.content;
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
                
                // Track assistant action
                messageChain.push({
                    role: "assistant",
                    content: currentTurnText || null,
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
                let queryAttempted = "";
                try {
                    const parsedArgs = JSON.parse(currentToolCallArgs);
                    if (currentToolCallName === 'execute_database_sql') {
                        queryAttempted = parsedArgs.query;
                        
                        // Extract target table for conversational output
                        let targetTable = "the database";
                        const match = queryAttempted.match(/FROM\s+([a-zA-Z0-9_\.]+)/i);
                        if (match && match[1]) targetTable = `the \`${match[1]}\` data`;

                        const friendlyMessages = [
                            `*Running cross-facility analysis on ${targetTable}...*`,
                            `*Isolating operational metrics in ${targetTable}...*`,
                            `*Synthesizing intelligence from ${targetTable}...*`,
                            `*Executing global query across ${targetTable}...*`
                        ];
                        const text = friendlyMessages[Math.floor(Math.random() * friendlyMessages.length)];

                        // Let user know he's executing conversationally, WITHOUT dumping raw SQL code.
                        await writer.write(encoder.encode(`data: ${JSON.stringify({ text: `\n\n> \u231B ${text}\n\n` })}\n\n`));
                        
                        toolResult = await executeAdminSql(supabase, queryAttempted);
                    } else if (currentToolCallName === 'update_meta_memory') {
                        const newBlob = parsedArgs.memory_blob;
                        const { error } = await supabase
                            .from('david_user_preferences')
                            .upsert({ user_id: userId, memory_blob: newBlob, updated_at: new Date().toISOString() });
                        
                        if (error) {
                            toolResult = JSON.stringify({ success: false, error: error.message });
                        } else {
                            // Inform user visually
                            await writer.write(encoder.encode(`data: ${JSON.stringify({ text: `\n\n> *⚙️ Meta-Memory Updated*\n\n` })}\n\n`));
                            toolResult = JSON.stringify({ success: true, message: "Memory updated successfully." });
                        }
                    } else if (currentToolCallName === 'search_wiki_graph') {
                        await writer.write(encoder.encode(`data: ${JSON.stringify({ text: `\n\n> *🧠 Sifting Knowledge Graph...*\n\n` })}\n\n`));
                        
                        const pineconeKey = Deno.env.get('PINECONE_API_KEY');
                        if (!pineconeKey) throw new Error("PINECONE_API_KEY environment variable is missing.");
                        
                        const req = await fetch('https://sbd-wiki-graph-44928mo.svc.aped-4627-b74a.pinecone.io/records/namespaces/sbd-wiki/search', {
                            method: 'POST',
                            headers: { 'Api-Key': pineconeKey, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ query: { inputs: { text: parsedArgs.query }, top_k: 3 } })
                        });
                        const resJSON = await req.json();
                        toolResult = JSON.stringify(resJSON);
                    } else if (currentToolCallName === 'upsert_wiki_page') {
                        await writer.write(encoder.encode(`data: ${JSON.stringify({ text: `\n\n> *💾 Hardcoding Node: ${parsedArgs.slug}*\n\n` })}\n\n`));
                        
                        const pineconeKey = Deno.env.get('PINECONE_API_KEY');
                        if (!pineconeKey) throw new Error("PINECONE_API_KEY environment variable is missing.");
                        
                        const req = await fetch('https://sbd-wiki-graph-44928mo.svc.aped-4627-b74a.pinecone.io/records/namespaces/sbd-wiki/upsert', {
                            method: 'POST',
                            headers: { 'Api-Key': pineconeKey, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ records: [{ _id: parsedArgs.slug, content_md: parsedArgs.content_md }] })
                        });
                        const resJSON = await req.json();
                        toolResult = JSON.stringify(resJSON);
                    } else {
                        toolResult = JSON.stringify({ error: 'Unknown tool requested.' });
                    }
                } catch (err: any) {
                    toolResult = JSON.stringify({ error: err.message });
                }

                // DO NOT show the result preview to the user. The AI has it internally now.
                // We just loop back and let the AI summarize it.

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
