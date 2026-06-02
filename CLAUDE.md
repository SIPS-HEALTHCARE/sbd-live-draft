# Antigravity/SBD Live Repository Rules

## START EVERY SESSION HERE
**Read `ARCHITECTURE.md` before touching any code.** It maps every file, every function, every database table, and every known hazard in this codebase. If you skip it, you will break things.

## DISCOVERY FIRST — run before starting ANY task
Before writing or changing anything, do a discovery pass and report what you found **before** editing. This codebase names the same thing inconsistently and contains parallel/duplicate implementations (e.g. `assign-free-agent` vs `sbd-assign-free-agent`), so building blind creates duplicates or fixes the wrong place.
1. **Search by behavior, not just name** — grep for feature keywords, visible UI strings, DB columns, and edge-function names, not only the obvious function name.
2. **Map callers AND callees** of any function before touching it.
3. **Check the whole stack** for the feature: the `src/js/` frontend, the matching Supabase edge function in `supabase/functions/`, AND the DB table/columns — the real logic is often server-side, not where it appears in the UI.
4. **Fix or extend what already exists. NEVER add a parallel** element/function/dropdown/endpoint when an existing one should be corrected (no-breakings principle).
5. **Before deploying an edge function**, diff the live version against the repo so you don't overwrite drift.

## CRITICAL DIRECTIVE: PRODUCTION DATA & "FAKE" ACCOUNTS
1. **NEVER inject demo data, mock logic, or fake test accounts** into the live Supabase production database. 
2. **NEVER test live site URL (`https://belt.sterilebydesign.ai/`) with automation/subagents** that can manipulate data, change roles, or execute writes.
3. If creating test accounts is absolutely necessary for debugging, it must be done **strictly locally**, against a local database or mock context, and NEVER connected to the production Supabase instance.
4. **DO NOT** use default profiles (e.g., Alex Rivera, Hui Clark, etc.) outside of explicit non-live UI staging files. Never migrate or sync functions that call `saveDemoData()` or load dummy variables into the live modular `.js` files or `index.html`.
5. The User strictly forbade this: "You added fake records, demo accounts and I NEVER EVER told you to... Commit this to memory because you almost fucked up everything."

## DEVELOPMENT GUIDELINES
- Always verify that the Vercel production deployment (`index.html` + `src/js/` modular files) does NOT inherit inline scripts or demo arrays from `SBD_GOD_SOG.html`.
- For UI fixes on the live platform (e.g., dropdowns, modals), edit the `.js` files in `/src/js/` and verify they rely on the true Supabase context.

## DATA SAFETY RULES
- **Never PATCH a staff record** without spreading all existing fields. A partial write will erase `oip`, `history`, `ps_tracks`, and assessment gate data.
- **Never clear `localStorage` keys** matching `sbd_*` without verifying their purpose in `ARCHITECTURE.md` Section 14.
- **Always use** the `mapStaffToBackend()` / `mapStaffFromBackend()` functions (in `api-supabase.js`) when reading/writing staff data. Never write raw column names directly.

## EDIT SAFETY
- Before editing `ui-views.js`: **grep for the function name** to understand callers AND callees. The file has 14K+ lines and 294 functions with no module boundaries.
- After editing any `src/js/*.js` file: **bump the `?v=` cache-bust number** on the corresponding `<script>` tag in `index.html`.
- `SBD_GOD_SOG.html` is a legacy monolith. It is NOT the production source. Do not copy from it.
