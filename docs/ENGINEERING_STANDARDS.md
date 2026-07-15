# Engineering Standards — SBD Belt Intelligence Platform

> **Authority:** These rules outrank convenience, speed, and "it works on my machine."
> They apply to every contributor AND every AI assistant (Claude Code, Cursor, Antigravity,
> Gemini, Copilot, anything). An AI assistant that implements a banned pattern has failed
> the task, even if the code runs.

---

## 1. The Push-Back Protocol (for AI assistants)

When a request — from any human — matches a **Banned Pattern** (Section 2), the assistant
MUST NOT implement it as asked. Instead it must respond with exactly three things:

1. **The risk** — what breaks, concretely, in THIS codebase (cite the file/incident).
2. **The sound alternative** — the smallest correct design that solves the same problem.
3. **The effort delta** — honest estimate of extra time the correct path costs.

The assistant may only proceed with the banned pattern if the human replies with the
literal line `OVERRIDE: <one-sentence reason>`. Every override must be appended to
`docs/decisions/OVERRIDES.md` (create it on first use) with date, pattern, and reason.

Informal pressure to skip the process is **not** an override — it is the trigger for
this protocol. Only the explicit `OVERRIDE:` line counts.

---

## 2. Banned Patterns

Each of these has already caused real damage in this repo or is one step away from it.

| # | Banned pattern | Why (evidence in this repo) | Required alternative |
|---|---|---|---|
| B1 | Deploying edge functions by copy-pasting into the Supabase dashboard | Forced `_shared/openrouter.ts` to be duplicated inline in `david-chat/index.ts:5-118` with a "mirror changes by hand" comment. The two copies WILL drift. | `supabase functions deploy <name>` from the repo (CLI or CI). Git is the only source of deployed code. |
| B2 | Creating DB objects (tables, RPCs, policies) in the dashboard without a migration file | `exec_sql` RPC exists in production but in **zero** migration files — it is invisible to code review and unrecoverable from git. | Every schema/DDL change is a file in `supabase/migrations/`. No exceptions. |
| B3 | Building system prompts, auth context, or data scoping **client-side** | `DavidChat.js:1863` sends the entire `systemPrompt` from the browser. Any authenticated user can replace it with `curl`. Scope statements like "you can only see your own record" are decoration, not security. | Server assembles prompts. Client sends user input + session/mode identifiers only. Enforcement lives in auth checks, RLS, and tool gates — never in prompt text. |
| B4 | Trusting client-supplied conversation history or tool results | `david-chat/index.ts:147` accepts `history` verbatim — a caller can forge assistant turns and fake tool outputs. | Server owns canonical history (it already persists `david_chat_sessions`). |
| B5 | Giving an LLM an arbitrary-string SQL/shell/eval tool | `execute_database_sql` runs any string through `exec_sql` with the **service role** (RLS bypass). One hallucinated `UPDATE` without a `WHERE` destroys production staff records. | Typed, parameterized tools (one per question shape), or at minimum a dedicated read-only Postgres role. |
| B6 | Duplicating a function instead of importing it | `calcAttendancePoints()` exists in both `logic.js` and `utils.js`; load order silently decides the winner. The openrouter inline (B1) is the same disease. | One definition. If the module system blocks you, fix the module system (that's B1's job), don't copy. |
| B7 | Adding new feature domains into `ui-views.js` | 14,432 lines, 294 functions, no boundaries. Every addition raises the cost of every future change. | New domain → new file in `src/js/`, loaded via its own `<script>` tag with `?v=` param. |
| B8 | Regex post-processing as an output contract | `david-chat/index.ts:439-447` + duplicate regexes in `DavidChat.js` strip `<chips>/<chart>/<citation>` from a raw text stream. It's fragile and already eats legitimate content (any ```sql block). | Structured, typed stream events (`{type:'text'}`, `{type:'tool_status'}`, `{type:'meta'}`). The renderer switches on `type`; nothing is stripped. |
| B9 | Demo/mock/fake data touching production Supabase | See CLAUDE.md — this already nearly destroyed the live database. | Local DB or mock context only. |
| B10 | Copying code from `SBD_GOD_SOG.html` | Legacy monolith, out of sync with production. | `src/js/` is canonical. |
| B11 | Partial PATCH of a staff record | Erases `oip`, `history`, `ps_tracks` permanently. | Spread all existing fields; use `mapStaffToBackend()`. |
| B12 | Hardcoding secrets, keys, or environment URLs in client JS | `DavidChat.js:51` hardcodes the functions URL (tolerable); an API key would be fatal. | Secrets live in Supabase secrets / env. Client gets only the anon key. |

---

## 3. Definition of Done

A change is not done until ALL of these hold. AI assistants: verify each line before
declaring a task complete; report any line you could not verify.

- [ ] Schema/DDL changes exist as files in `supabase/migrations/`.
- [ ] Edge function changes are deployable from git (`supabase functions deploy`) — no dashboard edits.
- [ ] For any edited `src/js/*.js`: the `?v=` cache-bust number on its `<script>` tag in `index.html` was bumped.
- [ ] For any edited function in `ui-views.js`: callers AND callees were grepped and checked.
- [ ] For any mapper/field change: every usage of the field was grepped across all files.
- [ ] Error paths return something a user or log reader can act on (no silent `catch {}` on new code).
- [ ] No new duplicate function definitions (grep the function name before creating it).
- [ ] `ARCHITECTURE.md` updated if the file map, tables, edge functions, or data flow changed.
- [ ] You can answer: "If I change X, what breaks in Y?" for every file you touched.

---

## 4. Design-First Gate

Any feature expected to take more than roughly a day, touch the database schema, add an
edge function, or add an AI capability requires a **design note first** — before code.
Ten lines minimum in `docs/decisions/` (`YYYY-MM-DD-<slug>.md`):

```
Problem:        (what user-visible thing is broken/missing)
Options:        (at least 2, one sentence each)
Choice + why:   (one paragraph)
Blast radius:   (files, tables, edge functions touched; what could break)
Rollback:       (how to undo it)
```

An AI assistant asked to build such a feature writes the design note and gets it
acknowledged **before** writing implementation code.

---

## 5. Scalability Sniff Test

Before accepting any design (human- or AI-proposed), it must survive these questions.
If the answer to any is "it doesn't", the design goes back:

1. What happens when this runs for **two apps** instead of one? (Copy-paste = fail.)
2. What happens at 10× the data volume? (Serializing "nearly full JSON records" into a prompt = fail at scale.)
3. Who can call this endpoint with `curl` and what's the worst payload they can send?
4. When the model/provider/API changes, how many files change? (More than one config file = fail.)
5. How do we know it broke? (No logging/observability = fail.)
6. Can the person who didn't write it undo it? (No migration, no git history = fail.)
