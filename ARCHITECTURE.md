# SBD Belt Intelligence Platform — Architecture Reference

> **Purpose:** Read this document at the start of every AI session to understand the codebase before touching anything.
> **Last updated:** 2026-04-22
> **Rule #1:** If you don't understand how a function connects to other parts of the system, DO NOT edit it.

---

## 1. What This App Is

The **SBD Belt Intelligence Platform** is a production web application for **SIPS Healthcare Solutions** that manages sterile processing department (SPD) technician certifications using a **martial-arts belt system** (White → Yellow → Green → Blue → Brown → Black). It is deployed at **https://belt.sterilebydesign.ai/** via Vercel.

It is NOT a framework project. It is a **vanilla HTML/CSS/JS single-page application** backed by **Supabase** (Postgres + Auth + Edge Functions). There is no build step, no bundler, no React — just raw `<script>` tags loading JS files in order.

---

## 2. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Vanilla HTML/CSS/JS | Single `index.html` entry point |
| Backend | Supabase (PostgreSQL) | Project ID: `mhijaqahbceuahfzezbh` |
| Auth | Supabase Auth (JWT) | Custom claims via `sbd-sync-user-claims` edge function |
| Edge Functions | Deno (Supabase Functions) | 22 functions in `supabase/functions/` (2 orphaned — see §9) |
| AI Chat | DAVID AI | SSE streaming via `david-chat` edge function |
| Deployment | Vercel | Static deploy, `vercel.json` copies files to `public/` |
| CSS | Single `src/css/index.css` | 77KB, dark theme with gold accent (`#c49a20`) |
| Charting | Chart.js 4.4.0 (CDN) | |
| Markdown | marked.js (CDN) | Used in DAVID AI chat rendering |
| Font | Poppins (Google Fonts) | |

---

## 3. File Map & Sizes

### Critical Files (NEVER edit blind — understand connections first)

```
index.html                     (691 lines)   ← Entry point. All portal HTML shells.
src/js/logic.js                (201 lines)   ← Belt system constants, points engine, projection engine.
src/js/utils.js                (177 lines)   ← Helpers: staffOf(), getFac(), getStaff(), fullName(), date fns, Security.
src/js/api-supabase.js         (566 lines)   ← Supabase client: SB_AUTH, SB (CRUD), sbFetch(), data mappers.
src/js/auth-password.js        (172 lines)   ← Password reset, forgot password, strength bar.
src/js/mfa.js                 (~190 lines)   ← T33: admin TOTP MFA (enroll/challenge/verify, raw GoTrue REST). doLogin() gates admin-tier roles on aal2 before hydration.
src/js/ui-views.js          (14,432 lines)   ← ⚠️ MONOLITH. All view rendering, all portal logic. 294 functions.
src/js/settings.js             (239 lines)   ← Account settings UI.
src/js/scripts-module.js       (~330 lines)  ← T92: Scripts as a standalone assignable module (§16B).
src/js/endoscopy.js            (~660 lines)  ← T108/#1073: 14 endoscopy modules, leader-assigned-only (§16C).
src/js/onboarding.js           (312 lines)   ← Onboarding state, tour state, L3 study content helpers.
src/js/auth-init.js          (2,141 lines)   ← L3 study system, tour system, guide views, section walkthroughs.
src/components/DavidChat.js  (1,639 lines)   ← DAVID AI chat component (SSE, session persistence, markdown).
src/components/DavidAdminDashboard.js (520 lines) ← DAVID admin control panel.
src/css/index.css            (77KB)          ← All styles. Dark theme. CSS variables.
src/data/schema.sql          (353 lines)     ← Reference schema (not auto-applied — documentation only).
```

### Legacy File (DO NOT USE as source of truth)

```
SBD_GOD_SOG.html            (18,428 lines)  ← Original monolith. OUTDATED. Only exists for baknd.io embed.
                                                The modular files in src/js/ are the canonical source.
                                                DO NOT copy code from here into src/js/.
```

---

## 4. Script Load Order (CRITICAL)

Scripts load synchronously in `index.html` in this exact order. **Order matters** — later scripts depend on earlier ones:

```
1. logic.js       → Defines: IS_LIVE, DB (global state), BELT_*, ICO, FACILITY_TYPES
2. utils.js       → Defines: Security, toast(), staffOf(), getFac(), getStaff(), fullName(), beltIdx()
3. api-supabase.js → Defines: SB_API_URL, SB_ANON_KEY, sbFetch(), SB_AUTH, SB, mappers, resetDB()
4. auth-password.js → Defines: password reset handlers
5. ui-views.js    → Defines: ST (state), enterPortal(), all render*() functions, all nav functions
6. settings.js    → Defines: renderSettingsView()
7. onboarding.js  → Defines: getOnboardingState(), setOnboardingState(), l3 content helpers
8. auth-init.js   → Defines: L3 study aids, tour system, guide views, section walkthroughs
9. DavidChat.js   → Defines: DAVID AI chat rendering & SSE communication
10. DavidAdminDashboard.js → Defines: DAVID admin panel rendering
```

---

## 5. Global State Objects

### `DB` (defined in `logic.js`)
The global data store. Populated on login from Supabase, used everywhere for rendering.

```js
DB = {
  users: [],              // user_profiles mapped from backend
  facilities: [],         // facilities mapped from backend
  staff: [],              // staff records mapped from backend
  schedule: [],           // shift schedule records
  attendance: [],         // attendance records
  promotionApprovals: [], // pending role promotions
  queue: [],              // assessment queue items
  freeAgents: [],         // released free agent records
  pendingRegs: [],        // pending facility registrations
  placementReviews: [],   // placement assessment reviews
  systems: [],            // hospital systems
  hospitalSystems: [],    // alias for systems
  psCompletionRequests: [],
  onboarding: []
}
```

### `ST` (defined in `ui-views.js`)
UI state tracker. Tracks current portal, active views, selected facility, and user context.

```js
ST = {
  portal: null,           // 'master_admin' | 'staff_admin' | 'hospital' | 'facility_admin' | 'staff_member' | 'system_admin'
  hView: 'h-dashboard',  // current hospital portal view
  aView: 'a-overview',   // current admin portal view
  sView: 's-dashboard',  // current staff portal view
  xView: 'x-dashboard',  // current system admin portal view
  curFid: null,           // currently selected facility ID (admin context)
  hFid: null,             // hospital portal facility ID
  curSystemId: null,      // current hospital system ID (system_admin context)
  aTab: 'all',            // admin filter tab
  facTab: 'staff',        // facility detail tab
  charts: {},             // Chart.js instances (keyed by name, destroyed before recreating)
  user: null,             // current user profile object
  staffId: null            // current staff record ID (staff_member context)
}
```

### `SB_SESSION` (defined in `api-supabase.js`)
The Supabase auth session (access_token, user object). Persisted to `localStorage` as `sbd_session`.

---

## 6. Portal Architecture

The app has **4 portals** (role-based views), each with its own sidebar, navigation, and view containers. The portal shown depends on the user's `role` from `user_profiles`.

| Portal | ID Prefix | Roles | Nav Function | Render Function |
|---|---|---|---|---|
| **Admin** | `a-` | `master_admin`, `staff_admin` | `aNav()` | `renderAView()` |
| **Hospital** | `h-` | `hospital`, `facility_admin` | `hNav()` | `renderHView()` |
| **Staff** | `s-` | `staff_member` | `sNav()` | `renderSView()` |
| **System Admin** | `x-` | `system_admin` | `xNav()` | `renderXView()` |

### Portal Entry Flow
```
User logs in → SB_AUTH.signIn() → load user profile → resetDB() → fetch all data
→ enterPortal(role) → show correct portal div → render default view
```

### View Rendering Pattern
Every view has this pattern:
1. Nav click calls `aNav(el, 'a-viewname', 'Title')` (or `hNav`, `sNav`, `xNav`)
2. Nav function hides all views, shows target div, calls `renderAView('a-viewname')`
3. `renderAView()` is a giant switch that calls the specific render function
4. Render function builds HTML string via template literals and sets `.innerHTML`

---

## 7. Database Tables (Supabase)

| Table | Purpose | Key Foreign Keys |
|---|---|---|
| `facilities` | Hospital/facility records | `system_id` → `hospital_systems` |
| `user_profiles` / `sbd_portal_users` | Portal user accounts | `id` → `auth.users`, `fid` → `facilities` |
| `staff` | Technician belt records | `fid` → `facilities` |
| `assessment_history` | Past assessment results | `staff_id` → `staff`, `fid` → `facilities` |
| `assessment_queue` | Pending assessment requests | `staff_id` → `staff`, `fid` → `facilities` |
| `schedule` / `sbd_schedule` | Shift scheduling | `fid` → `facilities` |
| `attendance` / `sbd_attendance` | Attendance tracking | `staff_id` → `staff`, `fid` → `facilities` |
| `promotion_approvals` / `sbd_promotions` | Role change requests | `staff_id` → `staff` |
| `registrations` | New facility registration requests | — |
| `placement_reviews` | Placement assessment reviews | `staff_id` → `staff`, `fid` → `facilities` |
| `hospital_systems` | Multi-facility groupings | — |
| `sbd_free_agents` | Released/unassigned staff | — |
| `david_chat_sessions` | DAVID AI conversation history | `user_id` → `auth.users` |
| `david_facility_access` | Per-facility DAVID AI access control | `facility_id` → `facilities` |
| `david_usage_logs` | AI usage metering (tokens + ground-truth cost). **`source` col (#14):** `'chat'` = David chat, `'assessment'` = grading. Chat readers filter `source='chat'`. | `facility_id` → `facilities`, `user_id` → `auth.users` |
| `sbd_facility_trends` | Analytics trend data | `facility_id` → `facilities` |
| `sbd_report_audit_log` | Report download audit trail | — |
| `sbd_account_audit` | Account-deletion ledger: who deleted whom (written BEFORE the delete by `sbd-sync-user-claims`; the delete aborts if this insert fails). Admin-read-only, append-only to clients. | — |
| `sbd_onboarding_state` | Tour/walkthrough completion state | — |
| `foundations_assignments` / `foundations_progress` | Foundations curriculum: one assignment + one 3-gate progress row per staff+module. RLS via `sbd_fi_leader_scope`. See §16A. (T92 briefly stored the Scripts assignment here as `module_id='scripts'`; migration `20260820120000` moved those rows to `script_assignments` — see §16B.) | `staff_id` → `staff`, `facility_id` → `facilities` |
| `instrument_assignments` / `instrument_progress` | Instruments curriculum (mirror of Foundations, same 3-gate engine). RLS via `sbd_fi_leader_scope`. See §16A. | `staff_id` → `staff`, `facility_id` → `facilities` |
| `script_assignments` | T92a: Scripts module assignment — fourth assignment table, same shape/RLS rule set as the other three, no progress table (no gates). One row per staff (module_id always `'scripts'` today). See §16B. | `staff_id` → `staff`, `facility_id` → `facilities` |

### Row Level Security (RLS)
Every table uses RLS. Access is controlled via JWT claims:
- `master_admin` → full access to everything
- `staff_admin` → access limited to `assigned_fids` (array of facility UUIDs)
- `hospital` / `facility_admin` → scoped to their `facility_id`
- `system_admin` → scoped to facilities in their `system_id`
- `staff_member` → scoped to their own `staff_id`
- `sips_admin` → **matches no role branch anywhere.** Reach comes only from `capabilities` (§8A).

**T33 MFA gate (migration `20260904120000`):** admin-tier roles (`master_admin`,
`staff_admin`, `admin`, `master`, `sips_admin`, `system_admin`) additionally need an
**aal2** JWT (password + verified TOTP) — a `RESTRICTIVE` `sbd_mfa_gate` policy on every
belt-platform table returns nothing to a password-only admin session. `sbd_portal_users`
keeps an own-row SELECT exception so login can learn the role before the challenge. The
same predicate is inlined in every role-gated edge function; the admin-tier list exists in
4 places asserted identical by `node scripts/verify-t33-security-tail.js`.

---

## 8. User Roles

| Role | Portal | Capabilities |
|---|---|---|
| `master_admin` | Admin (a-) | Everything. DAVID AI. Command Center. User management. |
| `staff_admin` | Admin (a-) | Subset of facilities (via `assigned_fids`). Assessments, staff management. |
| `hospital` | Hospital (h-) | Single facility dashboard, staff directory, milestones, reports. |
| `facility_admin` | Hospital (h-) | Same as hospital + assessment queue + staff progression + the observation consoles (read-only unless also granted `assessor`). |
| `system_admin` | System (x-) | Multi-facility view for a hospital system. |
| `staff_member` | Staff (s-) | Personal dashboard, belt progress, OIP, study materials. |
| `sips_admin` | Admin (a-) | **Nothing by role (T79).** Starts empty; reaches only what Role Management grants. See §8A. |

### 8A. Stackable grants (#73, T74/T77, T79)

`sbd_portal_users.capabilities` (jsonb) carries **role-independent** grants, set only by a master
admin through `sbd_set_user_capabilities` (SECURITY DEFINER, guarded by the T53 privilege trigger)
and edited in Role Management (`renderARoleMgmt`, `ui-views.js`).

| Key | Grants | Server gate |
|---|---|---|
| `assessor` (+ `assessor_facilities`) | Assessor reach: observations, F&I, queue reads | `sbd_is_assessor()` / `sbd_is_assessor(uuid)` |
| `educator_facilities` | Educator/leader access at named facilities | `sbd_leads_facility_of(uuid)` |
| `issue_pin` (+ `issue_pin_facilities`) | **T79:** generate an assessment PIN (proctor) | `sbd_can_issue_pin(uuid)`; `sbd-assessor-pin` `generate_pin` |
| `approve_assessment` (+ `approve_assessment_facilities`) | **T79:** approve/deny an assessment request **and** record its outcome | `sbd_can_approve_assessment(uuid)`; `aq_select`/`aq_update`; `sbd-record-assessment` |

**Convention for every facility list:** absent or empty means **system wide**. Revoking a grant
drops its list with it, so a re-grant cannot inherit a scope nobody chose.
**#1107 (T79b):** the card keeps `issue_pin` + its list equal to the `assessor` grant on every edit,
but only while they were already equal before it — a PIN scope set on purpose to something else, or
an edit of the PIN grant itself, is left alone (`_rmMirrorAssessorOntoPin`).

**T79 reads are shared, writes are not.** `staff_select` admits *either* grant (a grant that can
write but not read is half-shipped — RLS returns fewer rows silently and the candidate list just
looks empty). `aq_update`, `sbd-assessor-pin` and `sbd-record-assessment` admit exactly one each.

> **⚠️ T79 independence invariant.** `issue_pin` and `approve_assessment` must never be ORed
> together in a **write** gate — that silently restores the bundle the client asked to break.
> `node scripts/verify-t79-assessment-grants.js` asserts this by reading the shipped SQL
> and edge-function code; `supabase/verify/t79_assessment_grants_check.sql` asserts it against a
> live database. The reason a fresh `sips_admin` reaches nothing is that the string appears in
> **zero** policies and **zero** server allow-lists — not because buttons are hidden.
>
> The pre-T79 role allow-lists are kept as an OR branch, so `staff_admin` / `educator` /
> `preceptor` still hold both permissions. Narrowing them is a separate, sequenced task.
> Design note: `docs/decisions/2026-08-12-t79-sips-admin-role-and-split-assessment-grants.md`.

---

## 9. Edge Functions (Supabase)

Located in `supabase/functions/`. Each is a Deno serverless function.

| Function | Purpose | Called By |
|---|---|---|
| `david-chat` | DAVID AI chat (SSE streaming via Anthropic API) | `DavidChat.js` |
| `david-admin-api` | DAVID admin dashboard API (facility access, tiers). `GET_METRICS` reads `david_usage_logs`/`david_analytics_summary` scoped to `source='chat'` (#14). | `DavidAdminDashboard.js` |
| `david-anomaly-detector` | Background chat-abuse burn detector (#59). Reads `david_usage_logs` where `source='chat'` (#14); enforcement gated by `ANOMALY_ENFORCE_ENABLED` (default OFF). | Scheduled/background |
| `sbd-score-assessment` | AI simulation-response grader (OpenRouter). Logs a `source='assessment'` row in `david_usage_logs` for cost tracking (#14) — never touches the chat question allowance. | `scoreSimulationWithAI()` (ui-views.js, belt-test-flow.js) |
| `sbd-approve-registration` | Approve new facility registration (creates auth user + facility + profile) | `renderARegistrations()` |
| `sbd-record-assessment` | Record assessment result (atomic: updates staff + creates history + audit) | `submitAssessment()` |
| `sbd-sync-user-claims` | Sync user profile data to JWT custom claims | User management flows |
| `sbd-release-to-free-agent` | Release a staff member to the free agent pool | `releaseToFreeAgent()` |
| `sbd-assign-free-agent` | Assign a free agent to a new facility | `executeFreeAgentAssign()` |
| `bulk-upload-staff` | CSV bulk staff import | `processBulkUpload()` |
| `sbd-emails` / `sbd-send-emails` | Email notifications | Various triggers |
| `sbd-assessment-notifications` | 🗑️ **RETIRED (2026-08-14)** — was deployed with `verify_jwt=false` and no auth check in code, so anyone could queue fake "assessment approved" emails and probe staff ids (200 vs 404). No caller existed: no DB trigger/webhook, no frontend reference (approval mail goes through `sbd-emails`). Kept in repo as an inert reference: the handler now returns 410 unconditionally, so an accidental redeploy cannot reopen the hole. Run `supabase functions delete sbd-assessment-notifications` to undeploy the live copy. | Zero callers — retired |
| `david-grade-assessment` | 🗑️ **RETIRED (#61)** — was an orphaned AIP open-ended grader duplicating `sbd-score-assessment`. Removed from repo; delete the deployed function from the Supabase dashboard to fully undeploy. | Zero callers — retired |
| `sbd-matrix-seeder` | 🗑️ **RETIRED (#61)** — was a policy hazard that seeded fake auth users/facilities (`test-sbd.com`, hardcoded password) and remained deployed with `verify_jwt=false`. Removed from repo + local `scripts/seed-30-agents.js`. **Deployed function must still be deleted from the Supabase dashboard to fully undeploy.** | Zero callers — retired |

---

## 10. The Belt System

### Belt Progression
```
White → Yellow → Green → Blue → Brown → Black
```

### Three Gate Types Per Belt
Each belt level requires passing 3 assessment gates:
- **C** (Competency) — Written/knowledge test
- **S** (Simulation) — Hands-on simulation
- **O** (Observation) — Observed performance

Stored on the `staff` record as:
```
cur_comp, cur_sim, cur_obs  → current belt gates
nxt_comp, nxt_sim, nxt_obs  → next belt gates
```

Mapped to frontend as:
```js
staff.cur = { c: 'pass'|'fail'|null, s: '...', o: '...' }
staff.nxt = { c: 'pass'|'fail'|null, s: '...', o: '...' }
```

### Assessment Windows
After earning a belt, staff have a timed window to apply for the next:
- White: 2 weeks open / 2 weeks closed
- Yellow: 4/4, Green: 6/6, Blue: 8/8, Brown: 12/12

**Manual override (added 2026-07-16):** `master_admin` / `staff_admin` (SIPS assessor) can open a
staffer's window early via the "Open Window Early" button on the admin staffer profile
(`renderHProfile`, admin context). Stored in `staff.window_override` (jsonb, nullable):
`{until, by, byName, at, reason}`. `getWindowStatus()` honors it **only after** the current-belt
gate-lock passes and **only while** `until` is in the future, then reverts to the normal
since-based cadence. Timing-only — it never skips gates and never touches `staff.since`.
See `docs/decisions/2026-07-16-manual-window-override.md`.

### Points System
```
Belt earned:    White=100, Yellow=250, Green=500, Blue=1000, Brown=2000, Black=5000
Gate passed:    +50 pts
Gate failed:    -10 pts
Star bonus:     +25 pts per star
PS complete:    +200 pts (enrolled = +50)
Attendance:     present=+10, late=+5, absent=-15, coverage=+25
```

### Placement Assessment
New hires take a placement assessment to determine starting belt. This is a multi-step quiz in `showPlacementAssessment()` that:
1. Shows intro screen
2. Asks knowledge + simulation questions
3. Scores responses (AI-assisted or keyword-based fallback)
4. Creates a `placement_review` for admin approval
5. Admin reviews and confirms or adjusts the recommended belt

### Dynamic Belt Test (Track A4) — per-gate (added 2026-07-17)

The proctored belt test for the two **written** gates. **Observation is separate**
(`ovsUnlock`, a distinct two-PIN handshake — not part of this system).

**Files:** candidate delivery `belt-test-flow.js`; scoring engine `belt-test-engine.js`
(spec-governed, dual-exported for the Node harness `scripts/verify-belt-test-generation.js`);
generation edge fn `supabase/functions/sbd-generate-belt-test`; tables `sbd_belt_tests`
(generated test) + `sbd_belt_test_results` (persisted `AssessmentResult`, never recomputed on
read) + `sbd_belt_bank` (answer key, service-role only). Mappers `mapBeltTestResult{To,From}Backend`.

**Per-gate model (`2026-07-17-belt-test-per-gate-ph2a-implementation-design.md`).** Each written
component populates, delivers, and scores on its **own** approved gate:

| `component` | Gate (`sbd_assessment_queue.type`) | Staff gate | Bank half |
|---|---|---|---|
| `'knowledge'` | `Competency` (`s.cur/nxt.c`) | Knowledge (40 MCQ) | `questions.knowledge` |
| `'simulation'` | `Simulation` (`s.cur/nxt.s`) | Situational (20 scenarios) | `questions.simulation` |
| `'combined'` | both (legacy single-pass) | — | both |

- **PIN:** single-use assessor **`'belt'`** PIN (same pattern as placement); the component is
  set by which card the candidate starts, NOT the PIN — so `sbd-assessor-pin` is unchanged.
- **Candidate:** `btComponentEligible()` gates each card; `startBeltTest(staffId,belt,component)`
  → PIN → `SB.generateBeltTest(staffId,belt,component)` (server samples only that half; test row
  carries `component`; unique index is `(staff_id,target_belt,component) WHERE status='active'`)
  → deliver → `submitBeltTest()` scores that half via `scoreComponentKnowledge` /
  `scoreComponentSimulation` → one `sbd_belt_test_results` row per component (`component`,
  per-gate `outcome` PASS/REMEDIATION, and a private `component_detail` reconstruction blob).
- **Scoring:** each gate reports its own **pass/fail** at the target belt; the **combined belt
  recommendation** (blended 0.60·K + 0.40·S → suggested belt) is **deferred** until BOTH
  components exist and is computed assessor-side by `combineComponents(kDetail,sDetail,belt)` —
  byte-identical to the legacy single-pass `scoreBeltTest` (asserted by the harness).
- **Assessor** (`renderBeltTestReviewSection`, `renderBeltPinAuthBlock` in `ui-views.js`):
  reviews each gate on its own row (score, pass/fail, conditions, the combined recommendation
  once both are in, and an **assessor notes** field → `sbd_belt_test_results.notes`); `Accept`
  (`acceptBeltTestGate`) records ONLY that gate via the atomic `recordAssessment` path — never a
  partial staff PATCH. Legacy `combined` rows keep `acceptBeltTestCombined`.
- **Migration:** `20260717140000_belt_tests_per_component.sql` (adds `component`/`notes` to both
  tables + `component_detail` to results, amends the unique index). Applied by the user.

---

## 11. DAVID AI System

DAVID is an AI assistant integrated into the admin portal.

### Architecture
- **Frontend:** `src/components/DavidChat.js` — renders chat UI, handles SSE streaming
- **Backend:** `supabase/functions/david-chat/` — Anthropic Claude API integration
- **Admin Panel:** `src/components/DavidAdminDashboard.js` — per-facility access toggles, tier management
- **Admin API:** `supabase/functions/david-admin-api/` — CRUD for facility access

### Session Persistence
- Chat sessions stored in `david_chat_sessions` table
- Messages stored as JSONB array in the session record
- Sessions restored on page load via `loadChatSessions()`

### Access Control
- Only visible to `master_admin` (specifically `izambrano@sipsconsults.com`)
- Facility access controlled via `david_facility_access` table
- Intelligence tiers: basic, enhanced, premium, enterprise

### Brand Enforcement
- System prompt includes "Shadow Directive" for SBD-exclusive recommendations
- Frontend regex strips raw SQL, JSON, and tool-log leakage from responses
- Competitor blacklist: `src/data/sips_competitor_blacklist.json`

---

## 12. Data Flow: Login → Portal

```
1. User enters email/password
2. doLogin() → SB_AUTH.signIn(email, password)
3. On success: SB_SESSION set, stored in localStorage
3a. T33: if role is admin-tier → MFA.ensureAal2() (TOTP enroll or challenge; the
    verified session replaces SB_SESSION at aal2) — BEFORE hydration, because the
    sbd_mfa_gate RLS policies return nothing to an aal1 admin
4. Fetch user profile: SB.getUserProfile(userId)
5. Map profile: mapUserFromBackend()
6. Set ST.user = mapped profile
7. Fetch all data in parallel:
   - SB.getFacilities()     → DB.facilities
   - SB.getAllStaff()        → DB.staff
   - SB.getPendingAssessments() → DB.queue
   - SB.getPendingRegistrations() → DB.pendingRegs
   - SB.getHospitalSystems() → DB.systems
   - SB.getFreeAgents()      → DB.freeAgents
   - SB.getPromotionApprovals() → DB.promotionApprovals
   - SB.getPlacementReviews() → DB.placementReviews
8. All data mapped from backend format to frontend format
9. enterPortal(role) → shows correct portal UI
10. Default view rendered
```

---

## 13. Data Mapping Layer

`api-supabase.js` contains bidirectional mappers between Supabase snake_case and frontend camelCase:

| Function | Direction |
|---|---|
| `mapStaffFromBackend(row)` | DB → Frontend (e.g., `cur_comp` → `staff.cur.c`) |
| `mapStaffToBackend(staff)` | Frontend → DB |
| `mapFacilityFromBackend(row)` | DB → Frontend (e.g., `system_id` → `fac.systemId`) |
| `mapFacilityToBackend(fac)` | Frontend → DB |
| `mapUserFromBackend(row)` | DB → Frontend |
| `mapQueueFromBackend(row)` / `mapQueueToBackend(item)` | Both directions |
| `mapPlacementReviewFromBackend(row)` / `...ToBackend(pr)` | Both directions |
| `mapHospitalSystemFromBackend(row)` / `...ToBackend(sys)` | Both directions |
| `mapScheduleFromBackend(row)` / `...ToBackend(sch)` | Both directions |
| `mapAttendanceFromBackend(row)` / `...ToBackend(att)` | Both directions |
| `mapFreeAgentFromBackend(row)` | DB → Frontend |
| `mapPromotionApprovalFromBackend(row)` / `...ToBackend(ap)` | Both directions |

> **⚠️ CRITICAL:** If you change a field name in a mapper, you MUST grep every usage of that field across all files. The frontend references these mapped names, not the DB column names.

---

## 14. Onboarding & Study System

### Tour System (`auth-init.js` + `onboarding.js`)
- First-login detection via `isFirstLogin(userId)`
- Guided tour with spotlight overlay (`tourStart()`, `tourRender()`, `tourNext()`)
- Section walkthroughs per view (`injectSectionWalkthrough()`)
- State persisted to `localStorage` AND `sbd_onboarding_state` table

### L3 Study System (`auth-init.js`)
- Study guide with sections that can be marked as "read"
- AI-powered comprehension checks after reading each section
- Study aids: breakdowns, synopses, flashcard-style content
- State stored via `getOnboardingState()` / `setOnboardingState()`
- **localStorage keys pattern:** `sbd_swt_dismissed_{userId}_{viewId}`

> **⚠️ DO NOT** reset `localStorage` keys related to onboarding without understanding the dismissal pattern. Previous sessions broke assessment memory by clearing these.

---

## 15. OIP (Operator Intelligence Profile)

The OIP is a 30-question psychometric profile that maps technician aptitudes across multiple dimensions (e.g., procedural accuracy, critical thinking, mentorship). 

- Questions defined in `ui-views.js` around line ~1950
- Scores computed by `scoreOIP(answers)` 
- Compatibility with roles via `oipCompatibility(oipScores, targetRole)`
- Stored as JSONB in `staff.oip` column
- OIP quiz rendered in `#oip-quiz-overlay` (defined in `index.html`)

> **⚠️ OIP data persists in the `staff` table.** Resetting or overwriting the `oip` field will destroy completed assessment data permanently.

---

## 16. Position School (PS)

Position School is a training/certification track system.

- Track definitions in `ui-views.js` via `seedPSTracks()`
- Per-staff tracking via `staff.ps_tracks` (JSONB column)
- Functions: `ensurePSTracks()`, `getTrackStatus()`, `beginPSTrack()`, `completePSTrack()`
- Completion requests stored in `DB.psCompletionRequests`

---

## 16A. Foundations & Instruments (F&I)

Two parallel curriculum systems that share **one 3-gate engine** (mirrors of each other).

- **Files:** `src/js/foundations.js` (owns the shared engine), `src/js/instruments.js` (mirror; reuses foundations' gate helpers `fndGatePasses` / `FND_PASSES_REQUIRED`). Loaded before `ui-views.js`.
- **Modules:** `FOUNDATIONS_MODULES` / `INSTRUMENT_MODULES` (content + MCQ/simulation banks + observation checklist).
- **Tables:** `foundations_assignments`/`foundations_progress`, `instrument_assignments`/`instrument_progress` — one assignment + one progress row per (staff, module).
- **In-memory:** `DB.foundationsAssignments`/`DB.foundationsProgress`, `DB.instrumentAssignments`/`DB.instrumentProgress` (hydrated at login in `auth-init.js`). Accessors: `getFoundationsAssignments()`/`getInstrumentAssignments()`, `getModuleGates()`/`getInstModuleGates()`, `isModuleComplete()`.
- **3-gate model:** G1 Knowledge + G2 Simulation each need **3 passing attempts (≥80%)** (`FND_PASSES_REQUIRED=3`, best score kept); G3 Observation is a leader-confirmed checklist that unlocks only after 3+3 K/S passes. A module is `complete` at 3 K + 3 S + G3 pass. **"In Progress" is derived** (assigned & not complete) — never stored.
- **RLS:** `sbd_fi_leader_scope(target_staff)` (migration `20260702130000`): master_admin/SIPS-email → all; `staff_admin` (Assessor) → `assigned_facility_ids` (empty = all); `facility_admin`/`hospital` → own facility. ⚠️ **`system_admin` is NOT in this helper** (those users get zero F&I rows) and all live `staff_admin` are facility-scoped — so multi-facility/network reports viewed by those roles under-populate F&I. Network/system F&I must use a **server-side scoped fetch**, not the in-memory arrays (open Ph.2c risk — see `docs/decisions/2026-07-17-ph2-development-plan.md` §2).
- **#55 (`20260707120000`):** blocks `staff_admin`/staff from INSERT/UPDATE on the two *assignment* tables at the RLS layer. Do not re-open it (see the Preceptor decision doc).
- **Reporting (Ph.2b):** pure read helpers `fiModuleSummary()` / `fiDomainSummaryForStaff()` / `fndSummaryForStaff()` / `fiSummaryForStaff()` / `fiFacilityRollup()` (foundations.js) + `instSummaryForStaff()` (instruments.js). Rendered by `fiStaffSectionHTML`/`fiStaffSectionPDF` + `fiFacilitySectionHTML`/`fiFacilitySectionPDF` (ui-views.js), wired into `renderSReport`/`downloadStaffReport` (personal), `renderHReports`/`downloadFacilityReportV2` (facility), and an F&I completion card in `renderHDashboard`. Completion date shown is **derived/approximate** (no `completed_at` column yet — Ph.3a).

---

## 16B. Scripts as a standalone assignable module (T92)

The communication scripts have **two surfaces over one copy of the content**.

- **Where the scripts live (unchanged):** sections inside `FULL_CURRICULUM_DATA.belts[belt]`
  (`ui-views.js` ~8199). They keep rendering inside the belt content — Study & Practice →
  Full Curriculum, and its Scripts tab. **Nothing was moved.**
- **File:** `src/js/scripts-module.js`. `scriptSectionsForBelt(belt)` is the single definition
  of "which curriculum sections are the scripts" (title matches `/script|approved
  language|forbidden language/i`); the Study & Practice Scripts tab calls it too, so there is
  one definition, not two.
- **Storage (T92a, migration `20260820120000`):** its own `script_assignments` table —
  the fourth assignment table, same shape as foundations/instruments/preceptor, hydrated
  into `DB.scriptAssignments` (auth-init.js). Same RLS rule set (leaders write via
  `sbd_fi_can_manage_assignments`, assessors blocked, DELETE master_admin only, reads
  own-or-leader). **No progress table** — this module has no gates. Per the client's
  2026-08-13 brief: assigned deliberately, one person at a time, not bundled inside
  another track — which retired T92's original `foundations_assignments`
  `module_id='scripts'` piggyback (the migration moved those rows over).
- **Guard left behind:** `getFoundationsAssignments()` (foundations.js) still filters
  `module_id='scripts'` out, so a stale/pre-migration row can never turn the Foundations
  "N/10" convention into N/11.
- **Staff surface:** nav item `s-nav-scripts` + view `s-scripts`, hidden by default and
  revealed by `applyScriptsNavGate(staffId)` in `enterPortal` (safe there: `initAppData()`
  is awaited before `enterPortal`, and it is the only entry point). `renderSScripts()`
  re-checks the assignment itself. A leader's assignment appears after the staffer's next
  login, same as Foundations.
- **Leader surface (#1073, 2026-09-01):** its own side-panel tab — `renderHScripts()`,
  rendering into `h-scripts` (facility portal) or `a-scripts` (network portal). It used to
  be one column inside the Foundations Training table; the client asked not to enter
  Foundations to assign it, so that column is gone. `scriptsCellHTML()` still owns the
  per-person controls, now rendered inside this tab's table. Assign/Mark done are
  leaders-only (assessors are refused client-side *and* by RLS); Unassign is master_admin
  only, matching `hUnassignFnd`.
- **Completion is leader-confirmed**, carried by `assignment.status`
  (`assigned` ⇄ `completed`). Scripts are spoken language with no question bank.
- **Verify:** `node scripts/verify-scripts-module.js`.
  Design note: `docs/decisions/2026-08-06-t92-scripts-standalone-module.md`.

---

## 16C. Endoscopy modules — leader-assigned-only (T108, restructured by #1073)

Endoscope reprocessing training. Unlike Foundations/Instruments, this is **not** a belt
requirement and **not** a facility-wide rollout — a leader assigns it to one named person, and
nobody else at that person's belt level ever sees it. No belt trigger, no onboarding "All 10"
bundle.

- **File:** `src/js/endoscopy.js`. `ENDOSCOPY_MODULES` is **never** merged into
  `FOUNDATIONS_MODULES` and never iterated by `assignAllModules()` — that separation is the
  whole mechanism the client asked for.
- **14 modules (#1073, 2026-09-01):** `en-01`…`en-13` are the thirteen chapters of the
  Self-Study Manual, one module each; `en-14` is **Review & Competency Verification**, the
  capstone the Preceptor Guide's own module 13 defines. The manual has thirteen chapters, not
  fourteen — the fourteenth module is the capstone, not an invented chapter. Content lives in
  five top-level constants (`ENDO_SECTIONS`, `ENDO_SECTION_CONTENT`, `ENDO_FINAL_QUESTIONS`,
  `ENDO_COMPETENCY_ITEMS`, `ENDO_WRITTEN_ANSWERS`) and `ENDOSCOPY_MODULES` is **derived** from
  them — one copy of the content, fourteen views over it.
- **Storage: rides `foundations_assignments`/`foundations_progress`** with `module_id` in
  `en-01`…`en-14` (no migration — the column is free text with no CHECK/FK,
  `UNIQUE(staff_id,module_id)` and RLS already correct). `getFoundationsAssignments()`
  (foundations.js) filters the `en-` prefix out (`ENDO_MODULE_PREFIX`), so this can never turn
  the Foundations "N/10" convention into N/11.
- **Content source:** `docs/curriculum/endoscopy/SIPS_Endoscopy_Module1_Reprocessing.docx` →
  `scripts/endoscopy-from-docx.py` writes the `ENDO_SECTIONS`/`ENDO_SECTION_CONTENT` arrays
  (13 chapters + Quick Reference as entry 14). The document has no Word heading styles, so
  this is a separate converter from `foundations-from-docx.py`, importing its shared
  table/callout renderers rather than copying them (Standards B6).
- **Gate model, per module type:**
  - **Chapters `en-01`…`en-13`** — Knowledge only. `questions: []` today: **no per-chapter
    bank exists in either source document** (the manual's 49 KNOWLEDGE CHECK items are
    self-attestation and unscorable; the Preceptor Guide's 24 `ASK:` prompts are oral, 0–2 per
    chapter, and chapter 9 has none). The client is writing them. Drop a bank into
    `ENDO_CHAPTER_QUESTIONS[i]` and that chapter's gate turns on with no other change. Until
    then the gate renders a "questions being finalised" panel with no Submit button, and the
    module cannot complete. **No observation list** — competency verification is one hands-on
    sit-down over the whole workflow, so `_endoNewProgress()` seeds `g3` as an explicit
    `na:true` pass and completion reduces to Knowledge alone. That survives the write because
    `sbd_fi_progress_guard` resets `g3` on INSERT only for a **non-leader** actor, and this is
    leader-assign-only.
  - **Capstone `en-14`** — **G1 Knowledge:** the manual's 18-item Final Assessment, 14
    auto-scored (8 True/False + 6 fill-in-the-blank). **Pass requires all 14 correct**, not a
    percentage: a fixed 8-item T/F bank at "7 of 8" is guessable in ~28 attempts on average
    given unlimited free retakes. **G2 Simulation:** no scenario bank exists; forced to a
    not-applicable pass by the server for every `en-%` row since #720. **G3 Observation:** the
    Preceptor Guide's 28 competency items in 5 groups, plus a 6th group "Written Answers" (the
    4 short-answer questions that can't be auto-marked; the leader-facing view shows the
    answer-key text as a hint, the staff-facing view never does). Unlocks on G1 alone
    (`endoObsReady`).
- **`endoHasQuiz()` / `endoHasObs()`** are the single test for which gates a module has. Every
  renderer and the seed branch on these, never on the module id, so behaviour follows content.
- **#720 (`20260901120000`):** `sbd_fi_progress_guard` force-passes `g2` for
  `module_id like 'en-%'`, so `complete` reduces to `g1 && g3`. The `en-%` key means
  `en-02`…`en-14` were covered the day they were added — no new migration for #1073.
- **Staff surface:** nav item `s-nav-endoscopy` + view `s-endoscopy`, hidden by default and
  revealed by `applyEndoscopyNavGate(staffId)` in `enterPortal`, same pattern as
  `s-nav-scripts`. Lists every assigned module.
- **Leader surface (#1073):** its own side-panel tab — `renderHEndoscopy()`, rendering into
  `h-endoscopy` or `a-endoscopy`. It used to be one column in the Foundations Training table;
  the client asked not to enter Foundations to assign it, so `endoscopyCellHTML()` is gone.
  `hAssignEndoscopyModal` lists all 14 with the reading-only ones marked. Assign/Unassign
  follow the same role rules as every other F&I module (`endoCanAssign()`).
- **Verify:** `node scripts/verify-endoscopy-module.js` (79 assertions).
  Design notes: `docs/decisions/2026-08-28-t108-endoscopy-build.md`,
  `docs/decisions/2026-09-01-1073-scripts-endoscopy-tabs.md`.

---

## 17. Deployment

### Vercel Configuration (`vercel.json`)
```json
{
  "buildCommand": "mkdir -p public && cp -r index.html src SBD_GOD_SOG.html *.png public/ || true",
  "installCommand": "echo 'No install'",
  "outputDirectory": "public",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- No build step. Files are copied as-is.
- All routes rewrite to `index.html` (SPA routing via `history.pushState`)
- Cache headers disabled for `index.html` and `SBD_GOD_SOG.html`
- Production URL: `https://belt.sterilebydesign.ai/`

### Cache Busting
JS files use `?v=N` query params (e.g., `ui-views.js?v=40`). **Bump version after edits** or users will see stale code.

---

## 18. Known Hazards & Gotchas

### 🔴 The `ui-views.js` Problem
- 14,432 lines, 294 functions, ALL in one file
- No AI model can hold this entire file in context
- **Editing rule:** Always `grep -n` for a function name before editing. Always check what calls it and what it calls.
- Functions at line 100 can depend on functions at line 13,000. There is no module boundary.

### 🔴 Duplicate Function Definitions
- `calcAttendancePoints()` is defined in BOTH `logic.js` (line 102) and `utils.js` (line 165). The `utils.js` version loads later and wins.
- `todayStr()`, `dateLabel()`, `dateShort()`, `add30Days()`, `fmtTime()` are also duplicated between `logic.js`/`utils.js`.

### 🔴 `SBD_GOD_SOG.html` vs `index.html` + `src/js/`
- `SBD_GOD_SOG.html` is an 18K-line legacy monolith. It is NOT the production source.
- `index.html` + `src/js/*.js` is the production source.
- They are NOT in sync. Never copy from one to the other without understanding both.

### 🔴 Assessment Data Persistence
- Staff assessment gates (`cur_comp`, `cur_sim`, etc.) are on the `staff` table
- Assessment history is in `assessment_history` table
- OIP scores are in `staff.oip` (JSONB)
- Placement results are in `placement_reviews` table
- **If you PATCH a staff record**, always spread existing fields. Never overwrite with a partial object.

### 🔴 Facility Filter Bug History
- Admin views filter staff by `ST.curFid`
- The global helper `applyAdminFilter()` handles this
- Previous bugs: string vs UUID comparison failures, filter dropdown not updating `ST.curFid`

### 🔴 `IS_LIVE` Flag
- `logic.js` line 2: `const IS_LIVE = true;`
- When `true`, all data operations go to production Supabase
- Some legacy code paths check `IS_LIVE` to decide between local arrays and API calls
- **DO NOT set to `false`** in production — it will break everything

---

## 19. ABSOLUTE RULES FOR AI SESSIONS

1. **Read this document first.** Before touching any file.
2. **Never inject demo/fake data** into the production Supabase database.
3. **Never test the live URL** with automation that can write data.
4. **Before editing `ui-views.js`:** grep for the function name, understand its callers AND callees.
5. **Before editing any mapper:** grep for every field name it produces across ALL files.
6. **Bump the `?v=` number** on any `<script>` tag in `index.html` after editing that file.
7. **Never overwrite** `staff.oip`, `staff.history`, `staff.ps_tracks` with partial data.
8. **Never clear** `localStorage` keys matching `sbd_*` without understanding their purpose.
9. **Always use** `mapStaffToBackend()` when writing staff data back to Supabase.
10. **Test your mental model** before editing: "If I change X, what will break in Y?"

---

## 20. Quick Reference: Where Is...?

| Feature | File | Approx. Lines |
|---|---|---|
| Login / Registration | `ui-views.js` | 18–165 |
| Portal entry & routing | `ui-views.js` | 260–415 |
| Admin nav items & visibility | `ui-views.js` | 350–402 |
| Staff dashboard | `ui-views.js` | 469–500 |
| Hospital dashboard | `ui-views.js` | 545–580 |
| Admin dashboard | `ui-views.js` | 582–616 |
| Facility detail view | `ui-views.js` | 9569–9926 |
| Placement assessment | `ui-views.js` | 1234–1700 |
| OIP quiz | `ui-views.js` | 1950–2070 |
| Assessment queue | `ui-views.js` | 10103–10535 |
| Observation consoles (one pair, three mounts: `ovsMount` = `a`/`s`/`h`) | `ui-views.js` | 3450+, 3955+ |
| Staff progression | `ui-views.js` | 10217–10505 |
| Registration approvals | `ui-views.js` | 11141–11430 |
| Free agents | `ui-views.js` | 11958–12366 |
| Admin users management | `ui-views.js` | 12366–12930 |
| Hospital systems | `ui-views.js` | 13295–14360 |
| Reports | `ui-views.js` | 10564–10810 |
| Bulk upload | `ui-views.js` | 10536–10565, 13220–13295 |
| Role change inline | `ui-views.js` | 14378+ |
| Points calculation | `logic.js` | 98–128 |
| Window status (+ manual override) | `logic.js` | 60–120 |
| Projection engine | `logic.js` | 130–172 |
| DAVID AI chat | `DavidChat.js` | Full file |
| DAVID admin panel | `DavidAdminDashboard.js` | Full file |
| Password reset | `auth-password.js` | Full file |
| Tour & walkthroughs | `auth-init.js` | 510–1920 |
| Study system (L3) | `auth-init.js` | 1–510 |
| Guide view | `auth-init.js` | 889–1428 |
| Settings | `settings.js` | Full file |
| Onboarding state | `onboarding.js` | Full file |
| Supabase CRUD | `api-supabase.js` | 110–191 |
| Data mappers | `api-supabase.js` | 199–566 |
| All DB schema | `src/data/schema.sql` | Full file |
