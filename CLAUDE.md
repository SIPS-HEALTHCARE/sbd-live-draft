# Antigravity/SBD Live Repository Rules

## CRITICAL DIRECTIVE: PRODUCTION DATA & "FAKE" ACCOUNTS
1. **NEVER inject demo data, mock logic, or fake test accounts** into the live Supabase production database. 
2. **NEVER test live site URL (`https://belt.sterilebydesign.ai/`) with automation/subagents** that can manipulate data, change roles, or execute writes.
3. If creating test accounts is absolutely necessary for debugging, it must be done **strictly locally**, against a local database or mock context, and NEVER connected to the production Supabase instance.
4. **DO NOT** use default profiles (e.g., Alex Rivera, Hui Clark, etc.) outside of explicit non-live UI staging files. Never migrate or sync functions that call `saveDemoData()` or load dummy variables into the live modular `.js` files or `index.html`.
5. The User strictly forbade this: "You added fake records, demo accounts and I NEVER EVER told you to... Commit this to memory because you almost fucked up everything."

## DEVELOPMENT GUIDELINES
- Always verify that the Vercel production deployment (`index.html` + `src/js/` modular files) does NOT inherit inline scripts or demo arrays from `SBD_GOD_SOG.html`.
- For UI fixes on the live platform (e.g., dropdowns, modals), edit the `.js` files in `/src/js/` and verify they rely on the true Supabase context.
