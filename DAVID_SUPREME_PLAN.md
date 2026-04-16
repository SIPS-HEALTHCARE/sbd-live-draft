# SPARC Execution Plan: DAVID Supreme Autonomous Level

## 1. Specification
**Objective:** Upgrade the `david-chat` Edge Function from a pure LLM interface to an Autonomous Agent capable of executing tools (specifically, reading/writing to the Supabase Database and interfacing with GitHub) without breaking the existing Frontend UI.
**Constraints:** 
- The existing Frontend UI (`DavidChat.js`) expects a standard text stream. It should NOT receive raw JSON tool-calling blocks. 
- Tool calling must be intercepted and executed on the backend within the Deno Edge Function securely.

## 2. Pseudocode
**Edge Function Modification (`david-chat/index.ts`):**
1. Define a `tools` array conforming to OpenRouter's (Anthropic's) JSON Schema (e.g., `execute_sql`, `read_github_file`).
2. Add `tools` to the initial `fetch` payload to OpenRouter.
3. During the SSE Stream readout, check if the response starts yielding `tool_calls`.
4. If a tool call is detected:
   - Pause streaming to the client.
   - Buffer the full JSON representing the tool call name and arguments.
   - Parse the tool call and execute the local Deno function (e.g., `await supabase.rpc('execute_sql', { query: args.query })` or fetch from GitHub).
   - Append the `tool_result` to the message history.
   - Dispatch a SECOND request to OpenRouter containing the tool result so it can generate a final response.
   - Stream the final conversational response to the Frontend UI.

## 3. Architecture
- **Tool 1 (`execute_database_sql`):** Uses the existing `supabaseServiceKey` to interact directly with SIPS backend.
- **Tool 2 (`read_github_code`):** Uses a GitHub PAT to read `SBD_GOD_SOG.html` or Edge Functions.
- **Stream Interceptor:** A state machine inside the Deno stream loop (`insideToolCall: boolean`) that filters out `<tool_call>` chunks from the user's view.

## 4. Refinement
- Deno Edge Functions have a 10-second timeout to return the *initial* response packet, but the stream can last longer. We must ensure tool execution is fast, or we stream a "Loading Tool..." status back to the frontend to keep the connection alive.
- Security: We must hardcode `execute_database_sql` to ONLY allow SQL execution if the user's role is `master_admin` (which is already verified at line 80).

## 5. Completion
- Overwrite `supabase/functions/david-chat/index.ts`.
- Deploy via `supabase functions deploy david-chat --no-verify-jwt`
- Test live bug fix prompt.
