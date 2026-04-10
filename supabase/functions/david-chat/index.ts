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

        // 3. Call OpenRouter (Claude Sonnet)
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
            }),
        });

        if (!orRes.ok) {
            const errBody = await orRes.text();
            console.error(`[DAVID] OpenRouter ${orRes.status}: ${errBody}`);
            throw new Error(`AI service error (${orRes.status})`);
        }

        const orData = await orRes.json();
        const responseText = orData?.choices?.[0]?.message?.content || '';

        console.log(`[DAVID] Response: ${responseText.length} chars, model: ${orData?.model || 'unknown'}`);

        // 4. Store interaction in memory (non-blocking)
        supabase.from('assistant_memory').insert({
            user_id: user.id,
            interaction_type: 'chat',
            context_summary: `Facility: ${profile.facility_id || 'Global'}`,
            raw_interaction: { query: message, response: responseText }
        }).then(({ error }: { error: any }) => {
            if (error) console.warn('[DAVID] Memory store skipped:', error.message);
        });

        return new Response(JSON.stringify({ 
            success: true, 
            response: responseText,
            model: orData?.model || 'claude-sonnet'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
