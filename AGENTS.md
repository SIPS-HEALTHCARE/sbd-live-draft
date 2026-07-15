# AI Assistant Rules — READ BEFORE ANY WORK

This file is the entry point for **every** AI coding tool (Cursor, Antigravity, Gemini,
Copilot, Codex, Claude Code, etc.). It is intentionally short. The rules it points to
are mandatory, not advisory.

## Required reading, in order

1. `CLAUDE.md` — production-data safety rules (the hard "never do this" list).
2. `ARCHITECTURE.md` — the full system map. Do not touch code before reading it.
3. `docs/ENGINEERING_STANDARDS.md` — banned patterns, Definition of Done, and the
   **Push-Back Protocol** you must follow when a request is hacky or unsafe.

## The one paragraph that matters

This is a production healthcare platform with real facility and staff data. When a
request asks for a shortcut that matches a banned pattern (client-side prompts,
dashboard copy-paste deploys, arbitrary-SQL AI tools, duplicated code, demo data in
prod, partial staff PATCHes), you do not implement it. You state the risk, the correct
alternative, and the cost difference, and you wait for an explicit
`OVERRIDE: <reason>` line before proceeding.

## Quick facts

- Production source = `index.html` + `src/js/*.js`. `SBD_GOD_SOG.html` is a dead monolith — never copy from it.
- Backend = Supabase (Postgres + Auth + Deno edge functions in `supabase/functions/`).
- Every schema change is a migration file. Every edge-function deploy comes from git.
- After editing any `src/js/*.js`, bump its `?v=` cache-bust number in `index.html`.
- The AI assistant feature ("David OG") is planned for extraction into a separate
  backend service project — read `docs/DAVID_OG_EXTRACTION_PLAN.md` before working on
  DAVID so changes stay compatible with that direction. Bug fixes and incremental
  improvements to the current DAVID are welcome.
