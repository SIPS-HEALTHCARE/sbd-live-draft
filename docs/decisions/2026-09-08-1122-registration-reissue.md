# 2026-09-08: Registration re-issue control (#1122, Shawn board 155)

Problem:        31 registrations read approved with no auth.users row behind them
                (checked 2026-09-08: 0 of the 31 have a portal row either). The
                board-142 alert covers only the last 7 days, and the app had no way
                to act on one row: the screen loaded `status=eq.pending` only, so
                approved rows never reached it. Each one needs a human click.

Options:        1. A `reissue_link` action on sbd-approve-registration (same auth,
                   MFA guard, link builder and rollback as approval).
                2. A new edge function. Duplicates the MFA guard and the link code,
                   and gives generateLink a second caller (T115 relies on one).
                3. Flip the row back to pending and approve again. Re-runs facility
                   creation and the staff upsert, exactly what 155 rules out.

Choice + why:   Option 1. The stranded rows have no account at all, so "a fresh
                link" alone cannot work (GoTrue needs a user to issue a recovery
                token). The branch creates the auth user and portal row, builds the
                link through the one shared builder, queues one registration_approved
                email, and writes one sbd_account_audit row
                (`registration_link_reissued`). That audit row is also the rate-limit
                clock: a second click inside 10 minutes gets 429. Role and facility
                were never stored on the registration, so the master admin picks them
                again in the modal; the server accepts registration-facing roles only
                and an existing facility uuid only. Master admin only.
                Listing comes from a SECURITY DEFINER RPC `sbd_stranded_registrations()`
                that reuses the 142 predicate without the window and inlines the
                master-admin + aal2 checks (definer bypasses sbd_mfa_gate).

Not done:       No staff row. 155 says "no belt or staff change", so a staff_member
                re-issue signs in to "Profile not found" until a staff row exists.
                The one-line addition is the approve path's staff upsert; add it only
                if the client asks.

Blast radius:   supabase/functions/sbd-approve-registration (new branch, link builder
                extracted; approve path unchanged in behaviour), migration
                20260908120000 (one new function, no table change), api-supabase.js
                (+2 SB methods), auth-init.js (non-blocking load), ui-views.js
                (renderARegistrations card + 2 functions), index.html cache-busts.
                Writes: auth.users, sbd_portal_users, sbd_email_queue,
                sbd_account_audit. Reads: registrations, facilities.

Rollback:       Redeploy the previous sbd-approve-registration; `drop function
                public.sbd_stranded_registrations()`; revert the four frontend files.
                Accounts created by a re-issue are ordinary accounts and stay.

Deploy order:   Migration, then `supabase functions deploy sbd-approve-registration`,
                then frontend (merge to main). The frontend degrades cleanly if either
                lands late: the RPC 404s into an empty card, the action is ignored by
                the old function ("Registration is already approved").

Verification:   node scripts/verify-1122-registration-reissue.js, plus the existing
                verify-approval-hardening.js / verify-set-password-link.js /
                verify-t33-security-tail.js stay green.
