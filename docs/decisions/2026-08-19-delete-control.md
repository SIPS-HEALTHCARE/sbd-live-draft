# 2026-08-19 — Delete control: audit, gate, and orphan guard on user deletion

Problem:        The delete branch of `sbd-sync-user-claims` permanently deletes a
                person (staff row, portal row, auth user) with no record of WHO
                called it — Supabase auth logs show only `service_role`, and they
                age out in 24h. The branch is open to `facility_manager` /
                `facility_admin` while the harmless deactivate function is
                master_admin-only. 31 tables carry `staff_id` with no FK, so a
                delete silently strands the person's records (7 placement
                reviews + 13 assessment sittings stranded as of the client's
                2026-08-19 report).

Options:        1. Log the caller into `sbd_activity_log` and tighten the gate —
                   smallest diff, but that table's RLS exposes rows to facility
                   leaders and the repo already ruled it out for security signals
                   (see 20260723162412_assessment_pin_attempts.sql).
                2. Dedicated admin-only `sbd_account_audit` table, delete branch
                   restricted to master_admin, delete refused while the person
                   still has placement_reviews / sbd_assessment_sessions rows, and a
                   deactivate-first UI. (Chosen.)
                3. Also add FKs to all 31 staff_id tables — correct long-term, but
                   existing orphans make each `ADD CONSTRAINT` fail without a
                   cleanup decision per table; separate piece of work.

Choice + why:   Option 2. It matches the client's agreed "done when" exactly: a
                delete leaves a row naming who did it (audit insert happens BEFORE
                the deletes and aborts the delete if it fails), a facility manager
                is refused (master_admin-only gate), deleting someone with reviews
                is refused with a message pointing at deactivation, and orphan
                counts cannot grow (delete is impossible while dependent rows
                exist). The UI leads with Deactivate Login (existing
                `sbd-set-account-active` flow, reversible, keeps records) and makes
                permanent delete a second, separately confirmed, master-admin-only
                action.

Blast radius:   `supabase/functions/sbd-sync-user-claims/index.ts` (delete branch
                only — create/update untouched), new migration
                `20260819150000_account_delete_audit.sql`, `ui-views.js`
                `confirmRemoveUser` (+ new `confirmHardDeleteUser`), `index.html`
                cache-bust. Admin "Remove" buttons now open a deactivate-first
                modal; deletes by non-master roles start failing server-side (that
                is the point).

Rollback:       Revert the edge function + frontend; the audit table is additive
                and can stay (or be dropped) harmlessly.
