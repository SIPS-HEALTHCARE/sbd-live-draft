import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * DAVID AI Chat Assistant - Powered by OpenRouter (Claude)
 * Restricted to master_admin only.
 * Routes through OpenRouter for reliable model access w/ OpenAI-compatible API.
 */
serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const openRouterKey = Deno.env.get('OPENROUTER_API_KEY') || '';

        if (!openRouterKey) throw new Error('OPENROUTER_API_KEY is not configured in Supabase secrets.');

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { message, history = [], systemPrompt = '' } = await req.json();

        // 1. Verify Authentication & Role
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Unauthorized');
        
        const jwt = authHeader.replace(/^Bearer\s+/i, '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
        
        if (authError || !user) {
            console.error(`[DAVID] Auth failed: ${authError?.message || 'User null'}`);
            throw new Error('Unauthorized');
        }

        const { data: profile, error: profileErr } = await supabase
            .from('sbd_portal_users')
            .select('role, name, facility_id')
            .eq('auth_uid', user.id)
            .single();

        if (profileErr || !profile) {
            console.error(`[DAVID] Profile: ${profileErr?.message || 'Not found'}`);
            throw new Error('Unauthorized: User profile not found.');
        }

        if (profile.role !== 'master_admin') {
            throw new Error('Access Restricted: DAVID is only available to master_admin accounts.');
        }

        console.log(`[DAVID] ${user.email} (${profile.role}) → calling OpenRouter`);

        // 2. Build messages for Claude via OpenRouter
        const messages: Array<{role: string, content: string}> = [];
        
        // Add system prompt if provided
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }

        // Add conversation history
        for (const msg of history) {
            messages.push({ role: msg.role, content: msg.content });
        }

        // Add current user message
        messages.push({ role: 'user', content: message });

        // 3. Call OpenRouter with streaming enabled
        const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openRouterKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://belt.sterilebydesign.ai',
                'X-Title': 'DAVID Intelligence - SBD Belt Platform',
            },
            body: JSON.stringify({
                model: 'anthropic/claude-sonnet-4-20250514',
                messages,
                max_tokens: 4096,
                temperature: 0.7,
                stream: true, // Enable streaming
            }),
        });

        if (!orRes.ok) {
            const errBody = await orRes.text();
            console.error(`[DAVID] OpenRouter ${orRes.status}: ${errBody}`);
            throw new Error(`AI service error (${orRes.status})`);
        }

        // 4. Stream chunks as SSE
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const encoder = new TextEncoder();
        const reader = orRes.body?.getReader();

        let fullContent = '';

        // Process stream in background
        (async () => {
            try {
                if (!reader) {
                    await writer.write(encoder.encode('data: {"error": "Failed to initialize reader"}\n\n'));
                    await writer.close();
                    return;
                }

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = new TextDecoder().decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6).trim();
                            if (data === '[DONE]') continue;
                            
                            try {
                                const json = JSON.parse(data);
                                const content = json.choices?.[0]?.delta?.content || '';
                                if (content) {
                                    fullContent += content;
                                    await writer.write(encoder.encode(`data: ${JSON.stringify({ text: content })}\n\n`));
                                }
                            } catch (e) {
                                // Silent skip for partial JSON
                            }
                        }
                    }
                }

                // Append [DONE] signal
                await writer.write(encoder.encode('data: [DONE]\n\n'));

                // Perform memory logging after stream is done
                supabase.from('assistant_memory').insert({
                    user_id: user.id,
                    interaction_type: 'chat',
                    context_summary: `Facility: ${profile.facility_id || 'Global'}`,
                    raw_interaction: { query: message, response: fullContent }
                }).then(({ error }: { error: any }) => {
                    if (error) console.warn('[DAVID] Memory store skipped:', error.message);
                });

            } catch (err: any) {
                console.error('[DAVID] Stream processing error:', err);
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
        const errorMessage = err.message || 'An unexpected error occurred.';
        const isUnauthorized = errorMessage.includes('Unauthorized') || errorMessage.includes('Restricted');
        
        return new Response(JSON.stringify({ 
            success: false,
            error: errorMessage,
            code: isUnauthorized ? 401 : 400,
            timestamp: new Date().toISOString()
        }), {
            status: isUnauthorized ? 401 : 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
