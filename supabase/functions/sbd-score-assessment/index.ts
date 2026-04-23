import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const openRouterKey = Deno.env.get('OPENROUTER_API_KEY') || '';
        if (!openRouterKey) throw new Error('OPENROUTER_API_KEY not configured');

        // Verify caller is authenticated
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
        const authHeader = req.headers.get('Authorization') || '';
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        });
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const { question, answer } = await req.json();
        if (!question || !answer) {
            return new Response(JSON.stringify({ error: 'Missing question or answer' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openRouterKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://belt.sterilebydesign.ai',
                'X-Title': 'SBD Assessment Scorer',
            },
            body: JSON.stringify({
                model: 'anthropic/claude-3.5-haiku',
                messages: [{
                    role: 'user',
                    content: `You are evaluating a sterile processing department (SPD) technician candidate's response to a situational question. Score the response 0-100 based on:
- Understanding of patient safety principles (40%)
- Knowledge of correct SPD procedures (30%)  
- Professional judgment and escalation awareness (30%)

Question: ${question}

Candidate response: ${answer}

Respond with ONLY a JSON object like: {"score":75,"feedback":"One sentence of specific constructive feedback."}
No markdown, no preamble.`
                }],
                max_tokens: 150,
                temperature: 0.3,
            }),
        });

        if (!orRes.ok) {
            const errBody = await orRes.text();
            console.error('OpenRouter error:', errBody);
            return new Response(JSON.stringify({ error: 'AI scoring unavailable' }), {
                status: 502,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const data = await orRes.json();
        const text = data.choices?.[0]?.message?.content || '';
        
        // Parse the JSON response from the model
        let result;
        try {
            result = JSON.parse(text.trim());
        } catch {
            // If AI didn't return valid JSON, extract score with regex
            const scoreMatch = text.match(/(\d{1,3})/);
            result = {
                score: scoreMatch ? parseInt(scoreMatch[1]) : 50,
                feedback: text.substring(0, 200)
            };
        }

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err: any) {
        console.error('Score assessment error:', err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
