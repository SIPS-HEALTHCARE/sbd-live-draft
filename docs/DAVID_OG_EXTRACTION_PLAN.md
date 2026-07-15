# David OG Extraction — High-Level Plan

> **Status:** Approved direction. The agent will be rebuilt as a **separate project in its
> own repository** — a pure backend service. This repo will NOT contain the new agent code.
> This document is intentionally high-level; detailed architecture, API contracts, and
> phasing are maintained separately by the engineering lead and shared when work begins.
>
> **If you are an AI assistant reading this:** treat this document as binding context.
> Do not propose building new agent capabilities inside this repo, and do not propose
> copying `david-chat` into another project. Both are rejected approaches (see Section 3).

---

## 1. Why David OG must be extracted from this codebase

These are engineering facts about the current implementation, not preferences:

1. **The security boundary is in the wrong place.** The browser builds David's entire
   system prompt — personality, role scoping, and data snapshot — and ships it to the
   server (`src/components/DavidChat.js:1863`). Any authenticated user can bypass the UI
   with `curl` and send their own prompt and forged conversation history. Statements like
   "you can only see your own record" are prompt text, not enforcement. Fixing this
   requires server-side prompt assembly and server-owned sessions — a real backend
   concern that structurally does not fit a static-frontend codebase.

2. **The database tool is unsafe by design.** The master-admin tool executes arbitrary
   model-written SQL through a service-role RPC (`exec_sql`), which bypasses Row Level
   Security entirely. One hallucinated `UPDATE` without a `WHERE` clause destroys
   production staff records. The safe replacement (typed, read-only, whitelisted data
   access) is an agent-platform capability, not a patch to an edge function.

3. **The code is already forking under pressure.** The shared OpenRouter helper had to be
   hand-duplicated inline into `david-chat/index.ts` because of the current deploy
   process. That is what happens when agent infrastructure lives inside an application
   codebase: every reuse becomes a copy, and every copy drifts. A second application
   reusing David by copy-paste would mean every bug is fixed twice, forever.

4. **Agent logic and product policy are welded together.** The reasoning loop is
   interleaved with SBD-specific tiers, quotas, memory tables, and facility entitlements.
   It cannot be tested in isolation and cannot be reused by another product without
   dragging SBD's schema along.

5. **A second application needs the same capability.** The only architecture where both
   products get the agent without inheriting each other's data model, bugs, or outages is
   a standalone, versioned service consumed over an API.

In short: what exists today proves the *capability* works. Extraction is how it becomes
*safe, testable, and reusable* — none of which can be achieved by editing it in place.

## 2. What the separate project is (high level only)

- A standalone **backend agent service** in its own repository. No frontend, ever.
- Exposed via an **HTTP API with streaming**; consuming applications authenticate with
  their own API key.
- **Multi-tenant by configuration:** each application registers its own personality
  (system prompt), which of its Supabase data the agent may access, and model
  preferences. No tenant sees another tenant's anything.
- Each application (this platform included) builds its **own frontend** and integrates
  the API.
- **Rule #1 of the extraction:** the current SBD experience must work perfectly —
  full parity — before anything else is generalized.

## 3. What this means for work in THIS repo

- **Ongoing DAVID work is welcome:** bug fixes and incremental improvements to
  `david-chat`, `DavidChat.js`, and related files should continue so the current
  experience keeps running well. Larger new agent capabilities (new tools, new personas)
  should be weighed against this plan first — anything built deeper into the current
  structure is something the extraction later has to unwind.
- **Rejected approaches — do not resurrect them, even if asked:** copying `david-chat`
  into another repo; pointing another app at this project's edge functions; adding more
  logic to the client-side prompt builder; extending the arbitrary-SQL tool. If a request
  matches one of these, apply the Push-Back Protocol in `docs/ENGINEERING_STANDARDS.md`.
- When the service exists, this repo keeps only a **thin integration layer** (auth,
  tiers, quotas stay here) and the chat UI becomes a pure renderer.
