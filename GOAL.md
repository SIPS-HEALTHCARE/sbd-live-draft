# Current goal

**Updated:** 2026-08-03

A short standing view of where the platform is heading and what is being worked on right now.
`TASKS.md` is the full ledger and stays the record; this file exists so anyone picking the work
up can see the shape of it in a minute rather than reading 1700 lines.

---

## Where the platform is

Live at `belt.sterilebydesign.ai`. Serving `ui-views.js?v=199`, `foundations.js?v=15`,
`foundations.css?v=3`, `api-supabase.js?v=59`.

The client's stated rollout is 30 leaders in a first phase and 175 technicians in a second,
about 205 accounts. That figure is the 1 July footprint and is already out of date: on 31 July,
after a client demo, he confirmed a new hospital system had been signed and more are coming. A
hospital system is a group of facilities, not a site, so anything sized per seat or per facility
should treat 205 as a floor.

---

## The three lines of work in front of us

**1. Permissions have to become composable, per facility.** This is the biggest theme and the
client has asked for it three separate ways. Assessor rights per facility shipped on 30 July and
are enforced at the database. Still open: the preceptor half of the same work (T74), a SIPS admin
role with approving an assessment and generating a PIN as separate grants (T79), and facility
admin access to their own observer portal (T80). The pattern each time is that a role is meant to
reach something and the door is not there.

**2. Learning content has to look like the curriculum, not like a summary of it.** The client's
words, twice, five weeks apart: *"It should look as close to the doc as possible as far as
formatting"* and *"Legibility in learning."* The presentation layer for Foundations shipped on
3 August. What remains is the structure the content itself does not carry: tables, numbered step
blocks, callouts. Foundations is T88, preceptor is T81. Both are blocked on receiving the source
documents.

**3. Security hardening has to actually hold.** Two attempts in nine days added a narrow rule
while the broad rule underneath stayed, so the narrow rule did nothing. T37 on the observer PIN
is still rolled back and the plaintext PIN is still served over REST. The finding 4 publish gate
was closed on 31 July by dropping the two unscoped policies underneath it. The lesson, now a
standing review step: verify by making a real request as a real role, not by reading the
catalogue.

---

## What is moving right now

Dated for Thursday 6 August: T60, the last of the account request password work; T30, the read
only checklist view for facility leaders; and the preceptor half of T74.

Dated for Tuesday 4 August: T37, the observer PIN hardening, rebuilt narrower after the rollback.

Carrying no date yet, pending scheduling: T78, T79, T80, T83 and the MFA and retention work.

This file does not record who holds what. `TASKS.md` does not either, and that is deliberate:
the ledger tracks the work, not the assignment.

---

## Waiting on the client

Which facilities each assessor covers. Whether observer rights and the practice gate waiver
follow the same per facility rule. Which of the duplicated facility names are real sites. Whether
David spend protection should alert or cut off, and at what number. Whether 25 MB per file is
enough for the documents they plan to upload. And the source curriculum documents, without which
T88 and T81 cannot be matched to anything.

---

## How to pick this up

Read `ARCHITECTURE.md` before touching code, `docs/ENGINEERING_STANDARDS.md` for what is banned
and what Done means, and `docs/DOMAIN_GLOSSARY.md` for what the words mean. Then `TASKS.md`,
which is newest first in its Totals section and states what changed and why.
