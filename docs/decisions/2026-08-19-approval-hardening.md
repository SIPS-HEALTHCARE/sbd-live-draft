# 2026-08-19: Approval hardening (board items 141, 142, 143)

Context:        The 18 August incident's remaining halves. 140 named the throw
                (emailError out of scope in deployed v41); the scanner-proof link
                shipped the same night. What stayed open: a partial approval could
                still end user-visible (141), the stranded approved-with-no-account
                state was invisible to every screen (142), and the approval area
                carried dead code that cost real diagnosis time twice (143).

Decision 141:   The approve function records every side effect it performs
                (portal row, staff row, registration flip, queued email) and its
                catch walks all of them back in reverse order. The registration
                status update, previously unchecked, now throws on failure. The
                function ends in exactly one of two states: fully approved, or
                untouched. Rollback steps are individually try/caught so one
                failed cleanup cannot strand the rest.

Decision 142:   A pg_cron SQL function (sbd_check_stranded_registrations, hourly
                at :30) queues one admin_alert email per stranded registration to
                every active master_admin, deduped on registration id, with a
                10-minute grace for in-flight approvals and a 7-day scan window
                so the 24 known pre-fix strays stay out of the signal. Same
                pattern as the recovery job: SQL on cron, delivery through the
                existing sbd_email_queue pipeline. Known first catch:
                cortney.jumper@nemours.org (2026-08-18), a genuinely stranded row.

Decision 143:   Three drops, table kept. trg_password_reset_created and its
                function (the 118-email path; nothing in the app consumes those
                tokens), trg_registrations_null_password and its function (exact
                duplicate of sbd_registrations_clear_password, which stays), and
                sbd_on_registration_approved() (bound to nothing since the night
                it was written). sbd_password_resets keeps its rows as history
                with a RETIRED comment.

Rejected:       Alerting from inside the approve function (only sees its own
                path; the Delete User button and hand edits also strand rows).
                Dropping sbd_password_resets outright (its rows are the only
                record of the 118-email event). Removing the password_reset
                email template (harmless without the trigger; removal can ride
                the next sbd-send-emails change).

Deploy order:   Migrations 20260819234000 + 20260819234500, then edge functions
                sbd-approve-registration and sbd-send-emails, both from the repo.
                Frontend untouched, no cache-bust needed.

Verification:   node scripts/verify-approval-hardening.js (static assertions on
                all four files), plus scripts/verify-set-password-link.js still
                green over the edited approve function.
