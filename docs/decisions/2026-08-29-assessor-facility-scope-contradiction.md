# Assessor facility scope: the spec and the client disagree, and we follow the client

**Date:** 2026-08-29
**Status:** Decided. Recorded so it is not reopened by accident.
**Touches:** T74, the assessor policies scoped per facility in #719

## The contradiction

Two authoritative sources say opposite things about whether an assessor's Gate 3
confirmation may be restricted by the facility they belong to.

**The RLS Addendum v1.1, section 8.6**, which is the role specification and supersedes
section 3 and 4 of both dev specs, says:

> Assessors travel between facilities; G3 confirmation must NOT be restricted by the
> assessor's home facility.

Its role table says the same thing in different words: an assessor has system wide read
and "can confirm Gate 3 observation items for any staff at any facility".

**The client, on 30 July**, asked for the opposite:

> this should be for all role management by facility

## The decision

**The client's instruction stands. Assessor rights are scoped per facility.**

The client owns the product. When the specification and the client disagree about what
the product should do, the client decides. The specification is authoritative about how
the system currently works and about what was originally designed, not about what the
client is allowed to change their mind on.

Work continues on that basis. The per facility scoping already shipped for the assessor
policies stays.

## What this costs, stated plainly so nobody is surprised later

An assessor who travels to a facility they are not scoped to will not be able to confirm
a gate there. That is the exact case section 8.6 was written to prevent.

The trigger to watch for is a report that an assessor cannot confirm a gate at a site they
visited. That is not a bug when it happens. It is this decision working as instructed, and
the fix at that point is to widen that assessor's facility list in Role Management rather
than to change the policies again.

## Current state, so the decision is read against facts

No account has a facility list populated yet, so in practice every assessor still reaches
every facility. The scoping is enforced in the policies and waiting on data. Nothing
changes in observed behaviour until someone assigns facilities in Role Management.

## What would reopen this

Only the client. If the travelling assessor case turns out to matter more to them than the
per facility model, they say so and the policies widen again. Until then this is settled.
