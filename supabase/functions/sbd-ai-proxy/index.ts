// RETIRED 2026-08-26 (#748): deleted from the Supabase deployment, kept here as backup only.
// Do NOT redeploy. Legacy weak-auth function from the #749 audit; only traffic in its lifetime
// logs was our own audit curl probes — no real caller exists.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, prefer'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized');
    const body = await req.json();
    const action = body.action || "DavidChat";
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || '';
    // 1. Authenticate user remotely
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Invalid token');
    // Fetch user role for RBAC
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    const userRole = profile?.role || user.user_metadata?.role || 'staff_member';
    // ── MODE 1: SECURE RAG PIPELINE (DAVID) ──
    if (action === "DavidChat") {
      const { prompt } = body;
      const embedRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'models/gemini-embedding-001',
          content: {
            parts: [
              {
                text: prompt
              }
            ]
          }
        })
      });
      const embedData = await embedRes.json();
      const queryVector = embedData.embedding?.values;
      if (!queryVector) throw new Error("Failed to generate embedding");
      const PINECONE_API_KEY = Deno.env.get('PINECONE_API_KEY') || '';
      const PINECONE_INDEX_URL = Deno.env.get('PINECONE_INDEX_URL') || '';
      const pineconeFilter = userRole === 'master_admin' ? undefined : {
        access_level: {
          "$ne": "master_admin_only"
        }
      };
      const pcRes = await fetch(`${PINECONE_INDEX_URL}/query`, {
        method: 'POST',
        headers: {
          'Api-Key': PINECONE_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vector: queryVector,
          topK: 5,
          includeMetadata: true,
          filter: pineconeFilter
        })
      });
      const pcData = await pcRes.json();
      const matches = pcData.matches || [];
      const contextText = matches.map((m)=>m.metadata?.text || '').join('\n\n');
      const finalPrompt = `You are David, the elite Sterile Processing AI assistant for the SBD Belt Intelligence platform.
Answer the user's question expertly using the retrieved knowledge context below. Do not mention that you are analyzing context, just incorporate it into your voice. 

Context:
${contextText}

User Question: ${prompt}`;
      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: finalPrompt
                }
              ]
            }
          ]
        })
      });
      const geminiData = await geminiRes.json();
      const answer = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "I was unable to process an answer.";
      return new Response(JSON.stringify({
        answer,
        contextUsed: matches.length > 0
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      });
    }
    // ── MODE 2: SIMULATION SCORING ──
    if (action === "ScorePA") {
      const { question, answer } = body;
      const finalPrompt = `You are evaluating a sterile processing department (SPD) technician candidate's response to a situational question. Score the response 0-100 based on:
- Understanding of patient safety principles (40%)
- Knowledge of correct SPD procedures (30%)  
- Professional judgment and escalation awareness (30%)

Question: ${question}
Candidate response: ${answer}

Respond with ONLY a JSON object like: {"score":75,"feedback":"One sentence of specific constructive feedback."}
No markdown, no preamble.`;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: finalPrompt
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{"score":40,"feedback":"Error during analysis"}';
      return new Response(text, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      });
    }
    // ── MODE 3: QUIZ GENERATOR ──
    if (action === "GenerateQuiz") {
      const { systemPrompt, userContent } = body;
      const finalPrompt = `${systemPrompt}\n\nTask details/context:\n${userContent}`;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: finalPrompt
                }
              ]
            }
          ]
        })
      });
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      // Return a simulated Anthropic object to strictly adhere to legacy frontend parser
      return new Response(JSON.stringify({
        content: [
          {
            text
          }
        ]
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      });
    }
    throw new Error(`Unknown action requested: ${action}`);
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 400
    });
  }
});
