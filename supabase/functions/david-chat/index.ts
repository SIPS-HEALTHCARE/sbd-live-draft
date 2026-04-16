import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6';

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

        const { data: profile } = await supabase.from('sbd_portal_users')
            .select('*')
            .eq('auth_uid', user.id)
            .single();

        if (!profile || profile.role !== 'master_admin') {
            console.error(`[DAVID] Blocked: ${user.email} is role: ${profile?.role}`);
            throw new Error('Restricted to Master Admin accounts only.');
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
                model: 'anthropic/claude-3.7-sonnet',
                messages,
                max_tokens: 800,
                temperature: 0.7,
                stream: true, // Enable streaming
            }),
        });

        if (!orRes.ok) {
            const errBody = await orRes.text();
            console.error(`[DAVID] OpenRouter ${orRes.status}: ${errBody}`);
            throw new Error(`AI service error (${orRes.status}): ${errBody}`);
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

                const utf8Decoder = new TextDecoder('utf-8');
                let buffer = '';

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
                                const content = json.choices?.[0]?.delta?.content || '';
                                if (content) {
                                    fullContent += content;
                                    await writer.write(encoder.encode(`data: ${JSON.stringify({ text: content })}\n\n`));
                                }
                            } catch (e) {
                                // Mismatched or partial json string, silently ignore for now
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
        console.error('[DAVID] Edge Function Error:', err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
