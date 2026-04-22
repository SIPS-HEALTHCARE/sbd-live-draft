# DAVID AI: Advanced Intelligence Upgrades
**Objective**: Graduate DAVID from a reactive SQL query engine to a proactive, multimedia, context-aware C-Level Autonomous Agent.
**Features Approved**: 1 (Proactive alerts), 2 (Async Background Tasks), 4 (Pinecone Vector RAG), 5 (UI Charting), 6 (Predictive Action Chips).

## Phase 1: Interactive Flow & UI (Items 5 & 6)
**Goal**: Instantly boost the perceived intelligence and usability of DAVID on the frontend.
*   **Predictive Chips (Item 6):** Update the `david-chat` Edge Function to append `<chips>["Compare Q1", "Generate Report"]</chips>` to the end of responses. Update `DavidChat.js` to parse these and render clickable pill-buttons.
*   **Visual Charting (Item 5):** Include Recharts or Chart.js via CDN in the dashboard. Update `DavidChat.js` to intercept `<chart type="bar" data="...">` from the LLM and render an embedded canvas/SVG chart exactly like the citation tables.

## Phase 2: Unstructured Knowledge / RAG (Item 4)
**Goal**: Give DAVID the ability to read SIPS/SBD policies and manuals.
*   **Vector Database:** Initialize Pinecone index (`sips-knowledge-base`).
*   **Tool Creation:** Add `search_knowledge_base(query)` tool to OpenRouter tools payload in `david-chat`.
*   **Implementation:** Connect the Pinecone MCP/SDK inside `david-chat` so DAVID can seamlessly query unstructured documentation alongside his SQL database.

## Phase 3: Proactive Execution & Async Work (Items 1 & 2)
**Goal**: Allow DAVID to run massive operations without HTTP timeout limits and let him speak first.
*   **Async Task Queue (Item 2):** Create a new Supabase Edge Function `david-background-worker`. When the user asks for a massive report, DAVID calls `delegate_task(instructions)`. The conversation returns immediately ("I'm working on it..."), while the background worker processes it and inserts the final result back into the chat stream via Supabase Realtime (WebSockets).
*   **Proactive Alerts (Item 1):** Schedule a daily cron job (via Supabase pg_cron) that invokes an anomaly-detection Edge Function. If metrics fall outside standard deviations, the function autonomously injects a message into `david_chat_sessions` and triggers a real-time notification to the Master Admin.

---
**Status:** Awaiting Master Admin GO code to begin **Phase 1**.
