# Implementation Plan: DAVID AI Meta-Memory & Verifiable Citations

## Overview
This plan details the full implementation of two core intelligence upgrades to convert DAVID from a reactive chat wrapper into a highly personalized, trustworthy autonomous assistant.
1. **Persistent Meta-Memory (Global User State):** Allowing DAVID to remember and auto-apply user preferences across all chat sessions.
2. **Verifiable Citations ("Show Your Work"):** Adding an interactive "explainability" UI to build trust by exposing the data behind DAVID's operational claims without cluttering the clean UI.

---

## Phase 1: Persistent Meta-Memory & Personalization

### 1.1 Database Architecture (Supabase)
We will introduce a dedicated table to handle long-term user memory, independent of session chat logs.
*   **Table Name:** `david_user_preferences`
*   **Columns:**
    *   `id` (uuid, primary key)
    *   `user_id` (uuid, foreign key -> auth.users)
    *   `memory_blob` (text or jsonb) - A synthesized text summary of the user's explicit instructions (e.g., "Always use bullet points. Never summarize Facility X.")
    *   `extracted_facts` (jsonb) - Key-value pairs for structural settings (e.g., `{"preferred_format": "bullets", "tone": "executive"}`)
    *   `updated_at` (timestamp)
*   **RLS Policies:** Select/Update restricted to `auth.uid() = user_id`.

### 1.2 Backend (Edge Function: `david-chat`)
*   **Memory Injection:** When a prompt is received, the edge function will make a fast `SELECT` against `david_user_preferences` for the requesting `user_id`.
*   **System Prompt Modification:** We will inject a new block into the personality payload:
    ```text
    [USER PREFERENCES & META-MEMORY]
    You must strictly adhere to the following learned behaviors for this specific user:
    {{memory_blob}}
    ```
*   **Memory Extraction (Self-Updating):** Implement a parallel, lightweight LLM call (or instruction in the main call) that constantly evaluates user input for new explicit preferences (e.g., "From now on, do X"). If a new rule is detected, the Edge function issues an `UPDATE` to the `david_user_preferences` table asynchronously.

### 1.3 Frontend Updates (`DavidChat.js`)
*   **Memory Management UI:** Add a small settings gear icon (⚙️) to the `david-sessions-sidebar`.
*   **Preferences Modal:** Clicking the gear opens a modal showing "What DAVID Remembers About You," pulling from the user preference table. The user can manually delete or edit these rules if DAVID misunderstood a preference.

---

## Phase 2: Verifiable Citations & "Show Your Work"

### 2.1 Backend Prompt Engineering (Shadow Directives Modification)
Currently, DAVID's prompt strictly forbids outputting JSON or SQL. We will ease this restriction with structured output rules.
*   **New Directive:** "When making a statistical claim, calculating a metric, or evaluating trend data, you must provide the raw data subset that validates your claim inside an XML-style `<citation>` block immediately following the claim. Example: `Total elite practitioners dropped by 4%. <citation data='[{"fid": "abc", "change": "-4%"}]'></citation>`."
*   **Hiding Logic:** The raw data must *only* exist inside these XML blocks so the frontend parser can separate it from the conversational text.

### 2.2 Frontend Parsing (`DavidChat.js`)
*   **Regex Update:** We will modify the `addParsedMessage` and SSE stream decoder. Instead of aggressively destroying all JSON blobs (like `.replace(/```json[\s\S]*?```/gi, '')`), we will capture the `<citation data="...">` blocks.
*   **DOM Replacement:** When a `<citation data="{...}">` block is parsed, replace it in the DOM with a sleek, clickable UI badge: 
    `<span class="david-citation-badge" data-payload="...">🔍 View Data</span>`
*   **CSS Styling:** 
    *   `.david-citation-badge`: Small, muted gold badge appended to the end of sentences. Hovering gives it a glow. 
    *   `.david-data-table-container`: A modern, glassmorphic dropdown or modal that formats raw JSON arrays into a highly readable HTML `<table>`.

### 2.3 Interactive Drill-Down Modal
*   **Interaction Logic:** Clicking the `🔍 View Data` badge triggers a new method: `showCitationModal(payload)`.
*   **Dynamic Rendering:** `showCitationModal` parses the JSON payload and dynamically generates a table.
    *   If payload is tabular `[{name: "X", value: 10}]`: Renders a table.
    *   If payload is just math `[{"equation": "10 / 100 = 10%"}]`: Renders a code block.
    *   If payload is a SQL query string: Renders a ````sql ... ```` block.
*   **Exec-Level Aesthetics:** The modal will inherit the black/gold cyberpunk aesthetic from the chat window but focus entirely on data transparency.

---

## Technical Considerations & Risk Mitigation
1.  **Token Bloat (Feature 5):** The `memory_blob` must be kept concise. If it grows too large, it will consume context limits. Solution: If memory exceeds 500 words, trigger an LLM-based summarization task on the memory itself.
2.  **Streaming Integrity (Feature 7):** Parsing XML attributes *while* SSE is actively streaming chunks is computationally difficult (it can cut a chunk off mid-attribute). 
    *   **Solution:** We will hide the raw data block *after* the stream finishes, or use a delayed regex parser that only converts `<citation>` blocks to badges once the `[DONE]` signal is received from the SSE stream, avoiding broken UI frames mid-generation.

---
**Status:** Awaiting your approval. Do not build until requested!
