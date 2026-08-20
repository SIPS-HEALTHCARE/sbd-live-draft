import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const { query } = await req.json();
    // 1. Authenticate Request via Supabase JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized Access - Session Invalid');
    // FETCH USER ROLE FOR SECURITY CLEARANCE (RBAC)
    const { data: profile } = await supabaseClient.from('staff_profiles').select('role').eq('id', user.id).single();
    // Check if user is highly cleared
    const isSuperAdmin = profile && profile.role === 'master_admin';
    // 2. Embed Query via Gemini
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) throw new Error('Missing Supabase Secret: GEMINI_API_KEY');
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: {
          parts: [
            {
              text: query
            }
          ]
        }
      })
    });
    if (!geminiRes.ok) throw new Error('Gemini Embedding Engine Error');
    const geminiData = await geminiRes.json();
    const vector = geminiData.embedding.values;
    // 3. Query Pinecone with STRICT Role-Based Filters
    const PINECONE_API_KEY = Deno.env.get('PINECONE_API_KEY');
    const PINECONE_INDEX_URL = Deno.env.get('PINECONE_INDEX_URL');
    if (!PINECONE_API_KEY || !PINECONE_INDEX_URL) throw new Error('Missing Pinecone configuration');
    // PINECONE SHIELD: If the user is NOT a master_admin, the database will physically filter out 
    // any document chunks tagged with access_level: 'super_admin' (like the SIPS Master Memory Document).
    const pineconeFilter = isSuperAdmin ? {} : {
      "access_level": {
        "$ne": "super_admin"
      }
    };
    const pcRes = await fetch(`https://${PINECONE_INDEX_URL}/query`, {
      method: 'POST',
      headers: {
        'Api-Key': PINECONE_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        vector: vector,
        topK: 4,
        includeMetadata: true,
        filter: pineconeFilter
      })
    });
    if (!pcRes.ok) throw new Error('Pinecone Database Verification Error');
    const pcData = await pcRes.json();
    const contextText = (pcData.matches || []).map((m)=>m.metadata.text).join('\n\n--- NEXT MANUAL SOURCE ---\n\n');
    // 4. Generate AI Answer using Gemini 1.5 Flash Free Tier
    const geminiChatRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: "You are 'David', the AI SBD Belt Intelligence Assistant. You strictly assist sterile processing technicians. You must construct your answer using ONLY the Pinecone Manual Excerpts below. If the excerpts do not directly answer the question, firmly state you do not have that knowledge."
            }
          ]
        },
        contents: [
          {
            parts: [
              {
                text: `Context Manual Excerpts from Pinecone Vector Similarity:\n${contextText}\n\nTechnician Question: ${query}`
              }
            ]
          }
        ]
      })
    });
    if (!geminiChatRes.ok) throw new Error('Gemini AI Generation Failure');
    const geminiChatData = await geminiChatRes.json();
    return new Response(JSON.stringify({
      answer: geminiChatData.candidates[0].content.parts[0].text,
      sources: pcData.matches.map((m)=>m.metadata)
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
