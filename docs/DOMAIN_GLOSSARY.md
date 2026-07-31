# SBD Domain Glossary

**What this is.** The shared vocabulary of the belt platform: what the product calls things,
what the numbers mean, and which words are correct where. It exists because this language
currently lives only in screenshots and in the client's messages, which means every new person
re-derives it and every naming bug is caught by the client instead of by us.

**What this is not.** Not a task list, not an architecture document. `ARCHITECTURE.md` maps the
code. `TASKS.md` tracks the work. This file only fixes the meaning of words.

**Basis.** Compiled 2026-07-31 from the client's own reports and screenshots between 1 July and
31 July 2026, cross-checked against the live production UI and the repository. Every entry below
was observed, not inferred. Where something is still unconfirmed it says so.

---

## 1. SBD and SPD are not the same word

This single distinction accounts for a recurring class of copy defects, so it goes first.

- **SBD** is the brand: **Sterile by Design**. Correct in product names. `SBD Foundations`,
  `SBD Instruments`, the SBD belt programme, "years in the SBD program".
- **SPD** is the department: **Sterile Processing Department**. Correct whenever the subject is
  a person's profession, experience or job. `SPD Technician I`, "Years in SPD", `SPD Background`,
  "the correct workflow direction in SPD".

**The test:** if the label describes *our programme*, it is SBD. If it describes *their job*, it
is SPD. A label whose body says "Years in SPD" cannot have a heading that says "SBD".

---

## 2. Belts, gates and windows

**The belt ladder**, in order: **White, Yellow, Green, Blue, Brown, Black.**

A belt may be issued **Conditional**, which is a full belt with an open condition attached. A
conditional belt is still held and still counted; it is advancement to the *next* belt that is
held back until the condition clears.

**Gates.** Progression to the next belt is counted in gates, displayed as `0/3 gates`. The
starting state before any gate is passed is **Baseline**. Gates are referred to in the
conversation as G1, G2 and G3, and a failure is referenced in the format `G2 fail 2026-07-01`.

**Assessment windows.** A staff member's window to sit an assessment opens and closes on a cycle
tied to their belt. The cycles in use are **2w, 4w, 6w, 8w and 12w**, each expressed as an open
span and a closed span, for example "2w open / 2w closed".

**Opening a window early** is a timing override only. It does not shorten the belt length, and it
is restricted to SIPS assessors and master admins (ruled 2026-07-16).

---

## 3. SBD Foundations: the seven modules

Foundations content is organised into seven modules, and they are always referred to by number
and name together:

1. Foundations
2. Decontamination
3. Inspection & Identification
4. Assembly & Tray Building
5. Packaging & Wrapping
6. Sterilization
7. Storage & Distribution

**Assignment reasons.** When Foundations work is assigned to a staff member, it carries a reason.
The one in use is **Remediation (targeted retraining)**, with an optional free-text trigger event
recording *why*, in the format `G2 fail 2026-07-01` or `incident #123`.

---

## 4. Roles, and what each one can see

Five roles appear in production. The authoritative specification is the SBD RLS Addendum; this
section records only what the interface actually presents, which is what the client refers to
when reporting.

- **Master admin.** Whole network. The only role that may edit an observation record
  (ruled 2026-07-23).
- **Staff admin** and **system admin.** Administrative scope without the network-wide reach.
- **Facility admin.** One facility. Sees that facility's staff, progression and schedule.
- **Assessor.** A capability rather than a base role. Grants the assessment queue and PIN
  generation. **As of 2026-07-30 this is being scoped per facility**, replacing the earlier
  system-wide grant.
- **Observer** and **preceptor.** Granted per staff member. Preceptor state on a profile reads
  `Default (belt-based)` until explicitly granted, and carries Grant / Revoke / Reset.

**Free Agent** is not a facility. It is the holding row for staff who belong to no facility yet.

---

## 5. The two navigations

The admin portal and the facility portal are different products to the person using them, and the
client reports against the names below.

**Master admin**

| Group | Items |
|---|---|
| Network | Network Overview, Leaderboard |
| Facility Management | All Staff, Staff Scoreboard, All Facilities, Hospital Systems, Registrations |
| Operations | Placement Reviews, Observations, Observation Reviews, Assessment Queue, Staff Progression, SBD Foundations |

**Facility admin**

| Group | Items |
|---|---|
| Overview | Dashboard |
| People | Staff Directory |
| Development | Milestones, Position School, Preceptor Certification, SBD Foundations, SBD Instruments, Scoreboard, Schedule, Attendance |

---

## 6. The staff action bar

The row of actions on a staff profile is the real permission surface, and it is the thing the
client means when he asks to "break apart" a permission:

`Record Assessment` · `Open Window Early` · `Promote` · `Report` · `SPD Background` ·
`Override Belt` · `Waive Practice Gate` · `Make Observer` · `Release`

plus the preceptor controls `Grant` / `Revoke` / `Reset`.

---

## 7. Patient Safety Provision

When a candidate gives a dangerous answer, the belt is **not** blocked. Ruled 2026-07-28 and built
the same day.

The belt is issued on the scores, conditional, with the date. A provision is opened on the account
recording the question, the answer given and the date raised. It states that a supervisor must
observe correct practice and sign it off, and that written re-study alone does not clear it. The
belt already held is unaffected; advancement to the next belt is on hold until the provision is
cleared.

Clearing is a SIPS admin action, and the record of who cleared it and when is intended to be
retained.

---

## 8. Metering

Two different meters, decided 2026-07-23 and visible in the Command Center.

- **Facilities are metered in questions.** The plan displays as `SIPS PLAN INCLUDED · 250`.
- **The master admin side is metered in tokens**, against a per-facility ceiling of **500,000**.
- **Usage is split per platform**, `Belt app` and `SOP tool` counted separately, each shown for
  `THIS MONTH` and `TO DATE`.
- Facility tiers observed: **BASE** and **PREMIUM**. Facility status is **ACTIVE** or **LOCKED**.

For scale reference, on 2026-07-08 the largest genuine figure on that page was **7,601 tokens**
against the 500,000 ceiling. Any later reading in the millions or billions is a display defect,
not growth.

---

## 9. Programme scale

The client's stated rollout, 2026-07-01:

- **Phase one: 30 leaders**, inclusive of educators, supervisors, managers and directors.
- **Phase two: 175 technicians.**

Roughly **205 accounts at full load**. Capacity, spend caps and seat decisions should be sized
against this rather than against current test volumes.

**That figure is already out of date, and by the client's own account it is about to grow.** On
2026-07-31, straight after a client demo, he wrote: *"Demo went good… they are blown away... We
just locked in a new hospital system… so we are going into more hospitals…"*

A hospital system is a group of facilities, not a single site, so this is a step change rather
than an increment. The 30 and 175 above describe the footprint as it was on 1 July. Treat 205 as
the floor for sizing work, never the ceiling, and re-ask him for the numbers before committing to
anything with a per-seat or per-facility cost.

---

## 10. Facilities

Observed in production: **Alta Bates**, **Mount Sinai**, **Boston Children's**, **Qa Test
Facility**, **Test Hospital Facility**, and the **Free Agent** holding row. Staff email domains
also place **Tufts Medicine** in the programme.

**Open:** two pairs in the live facility list share a display name. Which entries are real sites
has not been confirmed by the client, and the duplicates are why any facility picker must
disambiguate by location rather than by name alone.

---

## 11. Environments

- `belt.sterilebydesign.ai` is production.
- `meet.sterilebydesign.ai` is the self-hosted meeting room used for calls.

Production is a static build with no bundler. After editing any `src/js/*.js` file the `?v=`
cache-bust number on the corresponding `<script>` tag in `index.html` must be bumped, or the
change will not reach a returning browser. Merged is not live: the deployment still has to build.
