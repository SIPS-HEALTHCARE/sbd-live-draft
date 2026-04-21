# OIS (Operations Intelligence System) v3 Master Feature Reference

**Source of truth for all AI generation.**
Tagline used in the UI: "One System. One Platform. One Source of Truth."

## Platform Overview: OIS and Sterile By Design
OIS stands for Operations Intelligence System. It is the core software platform of Sterile By Design, a sterile processing department (SPD) management suite under SIPS Healthcare Solutions. OIS is a single-platform, single-source-of-truth system that covers the full sterile processing ecosystem, from instrument decontamination all the way through surgery scheduling and case cart delivery.

The platform's core differentiator versus competitors is that OIS does not bolt separate tools together. Instrument tracking, surgery scheduling, case cart readiness, preference cards, loaner workflow, endoscope reprocessing, supply management, and quality forensics all live in one connected workflow.

## Features
- **Dashboard: Operations Command Center:** Single-glance view of the entire facility's SPD and perioperative state.
- **Operations HUB:** Full case-readiness visibility for the perioperative team (sets in storage vs sets required by surgery preference cards).
- **Decontamination Module:** First scan point for dirty sets with cycle logging and double-scan blocking.
- **Assembly Module:** Handled tray-building verification.
- **Sterilization Module:** Enforces Chemical Indicator (CI) capture and expiration dating at point of release.
- **Sterile Storage Module:** Holding inventory showing ready sets, location, and expiration countdowns.
- **Surgery Schedule Module:** Automatically pulls preference cards when a case is scheduled, cascading requirements to sets, supplies, and loaners.
- **Preference Cards Module:** Codifies what surgeons need for procedures.
- **Case Cart Matrix Module:** Real-time readiness and assembly tool.
- **Loaner Management Module:** Vendor tray lifecycle tracking and auto-requesting.
- **Endoscope Processing Module:** Flexible scope reprocessing (Preclean -> Leak Test -> Clean -> HLD -> Store).
- **Supply Master Module:** Facility-wide disposables/consumables inventory.
- **Instrument Set Builder Module:** Definition of what instruments belong to each set.
- **Skill Matrix Module (Belt System):** Tracks staff competency using White -> Yellow -> Orange -> Green -> Blue -> Brown -> Black belt progression.
- **Labor Matrix Module:** Trends procedures processed per month and efficiency percentage.
- **Quality and Forensics Module:** Incident reporting with traceback routing via CI codes.
- **Throughput Tracker Module:** Operational view showing the full scan chain and touch time logs.
- **Audit Trail Module:** Immutable activity log.
- **Notifications Module:** Facility-wide alert and warning system (e.g. VENDOR NOTIFICATION).

## Recommended Terminology
To ensure maximum consistency, ALWAYS use:
- **OTIS** (All Caps)
- **SBD OS** (Sterile By Design OS)
