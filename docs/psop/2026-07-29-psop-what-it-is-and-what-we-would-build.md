# Precision SOP Generator: what it is, what we would build, and what that gets us

Date: 2026-07-29
Status: **documentation only.** No code has been written and none should be until this is agreed.
Sources are listed in section 1 so every claim below can be checked rather than taken on trust.

---

## Why this document exists before any code

The client asked how PSOP is coming and whether it is simpler or as complicated as the belt
platform. The honest answer at the time was that the planning held up but the interface had not
been read properly. This is that read.

It is written in one deliberate order: **what exists, then what we would build, then what that is
actually for.** The third part is the one that usually gets skipped, and it is the one that decides
whether the first two were worth doing.

---

## 1. Sources

Everything here comes from these and nothing else. No part of it is inferred from the belt platform.

| Source | What it is |
|---|---|
| `SIPSPrecisionSOPGeneratorv2.html` | The application itself. 461 KB, 3,968 lines, single file. Read in full for structure, dependencies, storage and gating. |
| `DAVID_AI_SOP_App_Spec.docx` | The functional and access specification for connecting DAVID. Read in full. |
| `https://sipshealthcare.com/psop` | The live demo. **Not verified from here.** The environment's network policy refuses that host, so nothing in this document rests on the deployed page. Anything below describing behaviour comes from reading the source. |

**One gap to close before build:** somebody who can reach the demo needs to confirm the deployed
page matches this file. If the live one is newer, this document describes the wrong thing.

---

## 2. What the application is today

### 2.1 Shape

It is a **React 18 single-page application delivered as one HTML file**. Not a static form, not a
template filler. There is a real component tree in there.

| | |
|---|---|
| Framework | React 18, loaded as UMD builds from a CDN |
| JSX compilation | **In the browser, at page load, via `babel-standalone`** |
| Backend | **None.** Zero `fetch` calls and no database client of any kind |
| Storage | `localStorage` only, behind a small namespaced polyfill wrapper |
| File size | 461 KB in one file |

### 2.2 What it is built from

Components: `App`, `AdminPanel`, `LoginGate`, `Header`, `Page`, `Progress`, `Badge`, `Btn`,
`DCard`, `DInput`, `GuideBubble`.

Content and rule tables held as constants in the file: `SOP_LIBRARY`, `SECTIONS`, `GAP_CATS`,
`GAP_CITATIONS`, `AUDIT_DOMAINS`, `DOC_TYPES`, `FIELD_GUIDE`, `GUIDE_SECTIONS`, `GUIDE_TIPS`,
`LIB_CATS`, `META_FIELDS`, `META_LABELS`, `SCORE_OPTIONS`, `CHAIN`, `STAMP`, `DEMO_DATA`.

That constant list is the useful part. It says the scoring rules, the citation mapping, the gap
categories and the audit domains are **already encoded**, not to be invented.

### 2.3 The model it enforces

Every SOP step is graded against a fixed set of elements: **WHO, WHAT, WHERE, HOW, WITH, RESULT,
TIME.** The app pattern-matches each one and shows the elements it found as green tags, leaving
the missing ones visible. `RESULT` is deliberately defined as binary and observable, so a step
either passes or does not.

That is the whole product in one sentence: **it makes a vague procedure specific enough to be
audited.**

### 2.4 What it can already do

Read from the code rather than assumed:

- Score a document and show which elements are missing, by category, with citations
- Convert an uploaded document: **`.docx` via `mammoth`, PDF via `pdf.js`**, both parsed in browser
- Guided authoring, with a field guide, section guides and contextual tips
- A library of pre-built SOPs, categorised
- Audit domains and a scoring option set
- QR code generation, via `qrcodejs`
- Export and print, 34 separate call sites for printing, blob creation or download
- An admin panel behind a PIN gate

### 2.5 What it does not have

- **No database and no server.** Nothing is saved anywhere but the browser it was typed in.
- **No accounts.** A PIN gate, not authentication.
- **No AI.**
- **No multi-facility anything.** No concept of which facility or which user a document belongs to.

---

## 3. Three things found while reading it, which change the build

### 3.1 The admin code is in the file, and a button fills it in

The admin gate is a PIN, and the source contains a control that calls the fill action with the
admin code as a literal argument. So the code is not merely readable in source, **the interface
offers to enter it for you.**

That is already tracked as T49. It escalates it: this is not a credential buried in a comment, it
is a working bypass.

**Consequences for us.** The file does not go into a repository until that is removed. Nobody
should treat the current PIN as access control. And if the deployed demo carries the same build,
the admin panel is open to anyone who opens the page, which needs checking today rather than at
build time.

### 3.2 It compiles itself in the browser on every load

`babel-standalone` is a development tool. Shipping it means every visitor downloads a compiler and
recompiles the entire application before seeing anything.

It works, which is why it has not been noticed. It is also the single biggest thing standing
between this and something that feels like a product on a hospital laptop. Any real build step
removes it, and that alone is likely the largest measurable improvement available.

### 3.3 Seven CDN dependencies, and the app dies without the internet

React, React DOM, Babel, pdf.js, its worker, Mammoth and QRCode all load from a public CDN.

This matters more than usual here, because the DAVID specification makes an explicit promise:
with the AI off, the app must work **"with no AI and no internet dependency."** As built, it has a
hard internet dependency before DAVID is even considered. Whoever wrote that line was describing an
intention, not the current state.

---

## 4. What connecting DAVID adds

From the specification, which is clear and does not need reinterpreting.

**The governing rule, in the spec's own words:** DAVID drafts, the app's existing scoring engine
grades that draft, and nothing reaches the user unless it passes. *"The AI proposes, the standard
disposes."* He never writes to a saved document, never changes a score, never blocks a user. Every
suggestion arrives as editable text a human must accept, so the human stays the author of record.

That rule is worth protecting, because it is what keeps this defensible in front of a surveyor.

**Capabilities, grouped as the spec groups them:**

- *Writing:* draft steps from plain language into the full element format; rewrite vague terms like
  "clean thoroughly" into measurable ones; fill an empty decision tree or escalation pathway from
  what the rest of the document already says; generate a complete first draft from a topic line.
- *Evaluation:* explain gaps in plain English rather than returning a bare score; narrate the
  strengths and gaps of an uploaded document on conversion; map a section to the correct citation,
  which closes a gap the app has today.
- *Standards:* answer standards questions in context without leaving the app; flag where the SOP
  and the standard disagree, citing both; identify which standard applies to a given device class.

**Three switches gate all of it:**

1. **Master switch, admin only.** Global on and off. Off means the app behaves exactly as it does
   now. This is the cost and safety control, and it lets the app ship dark.
2. **Role line, user versus admin.** Users get the in-the-moment assists. Admins additionally get
   the switches, feature toggles, usage and cost visibility, and the cross-document features, which
   stay admin-side both for cost and because they hit context limits.
3. **Per-facility switch, admin only.** DAVID on for one facility and off for another, so a pilot
   site can run it while everyone else stays on the plain app.

**The one open decision the spec itself names:** should regular users get DAVID's drafting from day
one in a live facility, or does drafting start admin-only until SIPS has proven it. Everything else
in the gating design holds either way.

---

## 5. The build, in phases

Ordered so that each phase is useful on its own and nothing is built twice.

### Phase 0: make it a project. No features.

Take the single file apart into a real source tree with a build step. This deletes the in-browser
compiler, lets the dependencies be bundled instead of fetched, and makes everything after it
reviewable. **Remove the embedded admin code and the demo data in the same pass.**

*Why first:* every later phase is harder inside a 3,968 line file that recompiles itself, and the
credential cannot wait behind feature work.

### Phase 1: give it a memory.

A database, and documents that belong to a facility and a person. This is the phase that turns it
from a tool someone uses into a system that holds work.

*The decision that gates this phase is not technical.* See section 7.

### Phase 2: real accounts, replacing the PIN.

Users, roles and the admin and user split the DAVID specification already assumes. The spec's
gating design cannot be implemented on top of a shared PIN, so this comes before DAVID rather
than after.

### Phase 3: connect DAVID, dark.

Wire the brain with the master switch off. Prove the draft-then-grade discipline holds, that a
draft is always editable text, and that with the switch off the app is byte-for-byte the app it was.

### Phase 4: light it up, per facility.

The per-facility switch, then a pilot at one site, then wider.

**Metering, already answered by the client:** usage on the SOP tool is calculated separately so it
can be seen per platform, and tracking by facility across both is acceptable. The belt platform's
usage logging already carries a source column, so this is an extension of something working, not a
new mechanism.

---

## 6. What this actually gets us

The part worth being honest about.

**For the facility.** An SOP that survives a survey. The value is not that a document gets written
faster, it is that the written procedure is specific enough that a technician can follow it and an
auditor can verify it. "Clean thoroughly" fails both tests. The element model exists to make that
failure visible before a surveyor finds it.

**For SIPS.** A second product on the same brain. The standards knowledge is already built and paid
for. This is a second surface on it, which is a much better position than a second product needing
a second knowledge base.

**Where the two platforms meet, and this is the real prize.** The belt platform knows who is
competent at what. The SOP tool knows what the procedure requires. Joined, an SOP can be written
against the competencies the facility actually has, and a competency gap becomes visible as a
procedure that nobody on the roster is currently qualified to perform. Neither product can say that
alone.

**What it does not get us,** so it is not oversold: it does not write correct SOPs on its own, and
the spec is deliberate about that. It drafts, the scoring engine grades, a human accepts. Anyone
expecting to press a button and receive a compliant document will be disappointed, and the design
is right to disappoint them.

---

## 7. Open decisions, and who owns each

| # | Decision | Owner |
|---|---|---|
| 1 | One Supabase project or two. The client raised this himself and never got an answer. Shared facilities and users argue for one; separate means the SOP tool cannot see a person's facility without a second copy of that data and a synchronisation problem nobody has costed. Tracked as T50a. | Us to recommend, client to confirm |
| 2 | Does drafting reach regular users on day one, or stay admin-only until proven. The spec names this as its single open decision. | Client |
| 3 | Does the deployed demo match this file, and is the admin code live on it. | Anyone who can open the page |
| 4 | Is the current PIN gate meant to be access control at all, or a placeholder. | Client |

---

## 8. Honest limits of this document

- The live demo was **not** reached from here. The network policy refuses that host. Everything
  above is read from the source file.
- The `.docx` and PDF conversion paths were **identified but not exercised.** No document was run
  through them.
- No estimate is attached to any phase. Estimating before the source tree exists would be guessing,
  and phase 0 is what makes the rest estimable.
- Nothing here has been agreed with the client. It is a proposal to argue with.
