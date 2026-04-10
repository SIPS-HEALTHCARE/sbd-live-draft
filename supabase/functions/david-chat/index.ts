import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * DAVID AI Chat Assistant - The Brain
 * Restricted to master_admin only.
 */
serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || '';
        const pineconeApiKey = Deno.env.get('PINECONE_API_KEY') || '';
        const pineconeHost = Deno.env.get('PINECONE_HOST') || ''; // e.g. https://sbd-knowledge-44928mo.svc.aped-4627-b74a.pinecone.io

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { message, history = [], fileData = null } = await req.json();

        // 1. Verify Authentication & Role
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');
        const jwt = authHeader.replace(/^Bearer\s+/i, '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
        
        if (authError || !user) throw new Error('Unauthorized');

        const { data: profile, error: profileErr } = await supabase
            .from('sbd_portal_users')
            .select('role, name, facility_id, system_id')
            .eq('auth_uid', user.id)
            .single();

        if (profileErr || !profile || profile.role !== 'master_admin') {
            throw new Error('Access Restricted: DAVID is currently only available to master_admin accounts.');
        }

        // 2. Fetch User Context (Fact Sheet)
        // We fetch progression, facility stats, etc. to give DAVID "memory" of who he's talking to.
        const { data: staffData } = await supabase
            .from('staff')
            .select('*')
            .eq('id', user.id)
            .single();

        const { data: facilityData } = await supabase
            .from('facilities')
            .select('name, loc, dept')
            .eq('id', profile.facility_id)
            .single();

        const contextSummary = `
User Profile:
- Name: ${profile.name}
- Role: ${profile.role}
- Facility: ${facilityData?.name || 'Unknown'} (${facilityData?.loc || 'N/A'})
- Belt Status: ${staffData?.belt || 'White'}
- Stars: ${staffData?.stars || 0}
        `.trim();

        // 3. RAG: Query Pinecone Knowledge Base
        // First, embed the user's message
        let retrievedKnowledge = "";
        if (openaiApiKey && pineconeApiKey && message) {
            try {
                const embedRes = await fetch('https://api.openai.com/v1/embeddings', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${openaiApiKey}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ input: message, model: 'text-embedding-3-large' })
                });
                const embedData = await embedRes.json();
                const vector = embedData.data[0].embedding;

                const pineconeRes = await fetch(`${pineconeHost}/query`, {
                    method: 'POST',
                    headers: { 'Api-Key': pineconeApiKey, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        vector,
                        topK: 3,
                        includeMetadata: true
                    })
                });
                const pineconeData = await pineconeRes.json();
                retrievedKnowledge = pineconeData.matches
                    ?.map((m: any) => m.metadata?.text || m.metadata?.content || "")
                    .join("\n\n---\n\n") || "";
            } catch (err) {
                console.error("Pinecone/OpenAI Error:", err);
                // Continue without RAG if it fails
            }
        }

        // 4. Generate AI Response
        // Using Claude 3.5 Sonnet as requested/recommended
        const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
        let responseText = "";

        if (anthropicApiKey) {
            const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'x-api-key': anthropicApiKey,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'claude-3-5-sonnet-20241022',
                    max_tokens: 1024,
                    system: `
You are DAVID (Dynamic AI Visual Intelligence Dashboard), a premium AI assistant for the Sterile by Design (SBD) Belt Intelligence Platform.
Your goal is to provide high-level, analyzed answers custom to the user based on their profile and progression.

Current User Context:
${contextSummary}

Retrieved Platform Knowledge:
${retrievedKnowledge}

Guidelines:
- Maintain a professional, executive, yet helpful tone.
- Reference the user's belt status and facility performance when relevant.
- If you don't know something from the retrieved knowledge, rely on your general SBD expertise but be transparent.
- Be concise but thorough.
                    `.trim(),
                    messages: [
                        ...history,
                        { role: 'user', content: message }
                    ]
                })
            });
            const anthropicData = await anthropicRes.json();
            responseText = anthropicData.content[0].text;
        } else {
            responseText = "DAVID's brain (API Key) is not configured correctly. Please contact the administrator.";
        }

        // 5. Store Interaction in Memory
        await supabase.from('assistant_memory').insert({
            user_id: user.id,
            interaction_type: 'chat',
            context_summary: contextSummary,
            raw_interaction: { query: message, response: responseText }
        });

        return new Response(JSON.stringify({ 
            success: true, 
            response: responseText,
            context: contextSummary 
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err: any) {
        console.error('DAVID Error:', err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
