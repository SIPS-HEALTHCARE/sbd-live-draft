import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    // Rollback tracking (function scope so the catch can undo a partial provision).
    // Board item 141: the rollback is atomic over EVERYTHING this call creates or
    // flips, not just the auth user and facility. The 18 August incident was a throw
    // after the user-visible steps had run: the catch deleted the auth user but left
    // the registration approved and the email queued, so a person held a working
    // welcome email with no account behind it. Every step below records what it did
    // so the catch can walk it back in reverse order, and the function can only end
    // in one of two states: fully approved, or exactly as it was before the call.
    let supabaseAdmin: any = null;
    let createdAuthUserId: string | null = null;
    let createdFacilityId: string | null = null;
    let createdPortalRow = false;          // upsert INSERTED (only possible when authCreated)
    let createdStaffRow = false;           // upsert INSERTED (only possible when authCreated)
    let registrationApproved = false;      // status flipped pending -> approved
    let queuedEmailId: string | number | null = null;
    let registrationIdForRollback: string | null = null;
    let httpStatus = 400;                  // #1122: 429 when a re-issue is inside its cooldown

    // #1122 (board 155): one re-issue per registration per 10 minutes, measured from the
    // last successful re-issue's audit row. Ten minutes matches the stranded alert's grace.
    const REISSUE_COOLDOWN_MS = 10 * 60 * 1000;
    // Roles a re-issue may hand out. Registration-facing roles only: a self-typed
    // requested_role is anon-writable, and SIPS-internal roles never come from that form.
    const REISSUE_ROLES = ['staff_member', 'hospital', 'facility_admin', 'system_admin'];

    try {
        supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Auth verification uses the admin client with getUser() to validate the JWT
        // (removed anon-key client — supabaseAdmin handles everything)

        const { registration_id, facility_name, assign_system_id, assign_role, action } = await req.json();

        if (!registration_id) {
            throw new Error('Registration ID missing');
        }

        // Verify Caller Identity
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');
        const jwt = authHeader.replace(/^Bearer\s+/i, '');
        
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt);
        if (authError || !user) throw new Error('Unauthorized: Invalid or expired session');

        // Verify Caller Identity (Allow master_admin, staff_admin, system_admin)
        const { data: profile, error: profileErr } = await supabaseAdmin.from('sbd_portal_users').select('role').eq('auth_uid', user.id).single();
        const allowedRoles = ['master_admin', 'staff_admin', 'system_admin', 'admin', 'master'];
        if (profileErr || !profile || !allowedRoles.includes(profile.role)) {
            throw new Error(`Unauthorized role (${profile?.role || 'none'}). Only admins can approve registrations.`);
        }

        // ── T33 admin MFA guard ─────────────────────────────────────────────────
        // Admin-tier JWTs must be aal2 (password + verified TOTP). Mirrors
        // public.sbd_mfa_satisfied() (migration 20260904120000); inlined because the
        // deploy pipeline cannot resolve ../_shared imports (#47).
        // scripts/verify-t33-security-tail.js asserts every copy agrees.
        const MFA_ADMIN_ROLES = ['master_admin', 'staff_admin', 'admin', 'master', 'sips_admin', 'system_admin'];
        const jwtAal = (t: string): string => {
            try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).aal || 'aal1'; }
            catch (_e) { return 'aal1'; }
        };
        const mfaDenied = (role: string | null | undefined, t: string): boolean =>
            MFA_ADMIN_ROLES.includes(String(role || '')) && jwtAal(t) !== 'aal2';
        if (mfaDenied(profile.role, jwt)) {
            throw new Error('MFA required: administrator sessions must complete two-factor verification.');
        }

        const adminId = user.id;

        // Fetch registration details
        const { data: regData, error: regError } = await supabaseAdmin
            .from('registrations')
            .select('*')
            .eq('id', registration_id)
            .single();

        if (regError || !regData) {
            throw new Error('Registration not found');
        }

        // Shared by the approve path and the #1122 re-issue path: ONE place builds the link.
        // Returns the URL, or null when GoTrue gave nothing back (logged, caller decides).
        async function buildSetPasswordLink(email: string): Promise<string | null> {
            const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
                type: 'recovery',
                email
            });
            // NEVER put GoTrue's action_link in an email. It is a /auth/v1/verify URL and GoTrue
            // consumes the token on the FIRST GET, by anyone. Hospital mailboxes run link
            // scanners that GET every URL in a message within seconds of delivery, so the token
            // is spent before the person clicks and they land on a bare sign-in page.
            //
            // Measured on 17 August rather than assumed. Milena Eremenko's link was issued at
            // 19:33:35 and consumed at 19:33:45, ten seconds later, by an agent that was not her
            // browser; a Microsoft scanner range then made a HEAD on the same path at 19:33:55;
            // every attempt of hers after that returned "One-time token not found". The same
            // shape appears for every nemours.org approval that night, and the workaround people
            // found by themselves, re-registering on a personal address, is where the duplicate
            // staff records in T114 come from.
            //
            // So the email carries the HASHED token on our own origin. Opening that URL renders
            // a form and nothing else. The token is redeemed by a POST when the person presses
            // the button, which a scanner never does.
            const hashedToken = linkData?.properties?.hashed_token || null;
            const link = hashedToken
                ? `https://belt.sterilebydesign.ai/?set_password=1&token_hash=${encodeURIComponent(hashedToken)}`
                : null;
            if (linkError || !link) {
                console.error('Set-password link generation failed:', linkError?.message || 'no hashed_token returned');
            }
            return link;
        }

        // ── #1122 (board 155): re-issue the approval link for ONE stranded registration ──
        // A row that reads approved with no auth.users behind it (the 18 August shape, or an
        // account deleted after approval) needs a human click per row. This is that click:
        // it re-runs the account + link step for this one email and nothing else. No facility
        // is created, no staff row, no belt. Master admin only. The person's role and facility
        // were never stored on the registration (the approve modal chose them), so the caller
        // passes them again and the same rules as the approve modal apply.
        if (action === 'reissue_link') {
            if (!['master_admin', 'admin'].includes(profile.role)) {
                throw new Error('Only a master admin can re-issue an approval link.');
            }
            if (regData.status !== 'approved') {
                throw new Error(`Registration is ${regData.status}, not approved — use Approve instead.`);
            }
            const accountRole = REISSUE_ROLES.includes(assign_role) ? assign_role : null;
            if (!accountRole) throw new Error('Pick a portal role for this account.');
            const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!uuidRe.test(String(facility_name || ''))) throw new Error('Pick an existing facility for this account.');
            const { data: fac } = await supabaseAdmin.from('facilities').select('id').eq('id', facility_name).maybeSingle();
            if (!fac) throw new Error('That facility no longer exists.');

            // Rate limit: the audit row of the last SUCCESSFUL re-issue is the clock.
            const since = new Date(Date.now() - REISSUE_COOLDOWN_MS).toISOString();
            const { data: recent, error: recentErr } = await supabaseAdmin.from('sbd_account_audit')
                .select('created_at')
                .eq('action', 'registration_link_reissued')
                .eq('detail->>registration_id', registration_id)
                .gte('created_at', since)
                .order('created_at', { ascending: false })
                .limit(1);
            if (recentErr) throw new Error('Could not read the re-issue history: ' + recentErr.message);
            if (recent && recent.length) {
                const waitMin = Math.max(1, Math.ceil((new Date(recent[0].created_at).getTime() + REISSUE_COOLDOWN_MS - Date.now()) / 60000));
                httpStatus = 429;
                throw new Error(`A link was re-issued for this registration less than 10 minutes ago. Try again in ${waitMin} min.`);
            }

            // Account. createUser is also the "does an account exist" check: GoTrue refuses a
            // duplicate email, and a row WITH an account is not stranded — Forgot Password is
            // the right tool there, not an admin-triggered recovery link.
            const { data: authUser, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
                email: regData.email,
                password: 'Aa1!' + crypto.randomUUID(),
                email_confirm: true,
                user_metadata: { name: regData.name, role: accountRole }
            });
            if (authCreateError || !authUser?.user) {
                const dup = authCreateError?.code === 'email_exists' || /already|exists|registered/i.test(authCreateError?.message || '');
                throw new Error(dup
                    ? 'An account already exists for this email, so there is nothing to re-issue. The person can use Forgot Password on the sign-in screen.'
                    : `Failed to create auth user: ${authCreateError?.message || 'Unknown error'}`);
            }
            createdAuthUserId = authUser.user.id;

            // Portal row. A row can survive here only with a null auth_uid (auth_uid cascades on
            // delete), so an existing one gets re-pointed and a missing one is inserted.
            const parts = (regData.name || '').trim().split(' ');
            const initials = parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : (parts[0] || 'XX').substring(0, 2).toUpperCase();
            const { data: existingRow } = await supabaseAdmin.from('sbd_portal_users').select('id').ilike('email', regData.email).maybeSingle();
            const portalWrite = existingRow
                ? supabaseAdmin.from('sbd_portal_users').update({ auth_uid: createdAuthUserId, active: true }).eq('id', existingRow.id)
                : supabaseAdmin.from('sbd_portal_users').insert({
                    auth_uid: createdAuthUserId, email: regData.email, name: regData.name || regData.email,
                    role: accountRole, initials, facility_id: fac.id, active: true
                });
            const { error: portalErr } = await portalWrite;
            if (portalErr) throw new Error('Failed to create user profile: ' + portalErr.message);
            createdPortalRow = !existingRow;

            // Link. Fatal here, unlike the approve path: the link IS the deliverable.
            const link = await buildSetPasswordLink(regData.email);
            if (!link) throw new Error('GoTrue returned no recovery token; nothing was sent.');

            // One email, through the same queue and template as approval.
            const { data: queuedRow, error: queueError } = await supabaseAdmin.from('sbd_email_queue').insert({
                recipient_email: regData.email,
                template: 'registration_approved',
                subject: 'Welcome to Sterile by Design - Account Approved',
                body_data: {
                    contact_name: regData.name, name: parts[0] || '', facility_name: regData.facility || '',
                    set_password_link: link, auth_created: true, role: accountRole, login_email: regData.email,
                    reissued: true
                },
                status: 'pending', attempts: 0, created_at: new Date().toISOString()
            }).select('id').single();
            if (queueError) throw new Error('Could not queue the email: ' + queueError.message);
            queuedEmailId = queuedRow?.id ?? null;

            // One audit row: who re-issued, for whom, when. Written LAST so it only ever
            // records a re-issue that fully happened; it is also the rate-limit clock above.
            const { error: auditErr } = await supabaseAdmin.from('sbd_account_audit').insert({
                action: 'registration_link_reissued',
                actor_auth_uid: adminId,
                actor_email: user.email || null,
                actor_role: profile.role,
                target_auth_uid: createdAuthUserId,
                target_email: regData.email,
                target_name: regData.name || null,
                target_role: accountRole,
                detail: { registration_id, facility_id: fac.id, email_queue_id: queuedEmailId }
            });
            if (auditErr) throw new Error('Re-issue aborted: could not write the audit record (' + auditErr.message + ')');

            return new Response(JSON.stringify({
                success: true, message: 'Approval link re-issued', user_id: createdAuthUserId, reissued_at: new Date().toISOString()
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (regData.status !== 'pending') {
            throw new Error(`Registration is already ${regData.status}`);
        }
        registrationIdForRollback = registration_id;

        // --- FACILITY HANDLING ---
        let facilityId = facility_name;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        const isValidUuid = (id: string) => id && uuidRegex.test(id);

        if (!isValidUuid(facilityId)) {
            console.log("No valid facility UUID provided. Creating a new facility...");
            // Create a new facility based on registration data
            const customFacName = typeof facility_name === 'string' && facility_name.trim() !== '' ? facility_name : regData.facility;
            const { data: newFac, error: facCreateError } = await supabaseAdmin.from('facilities').insert({
                name: customFacName,
                loc: regData.location || 'Unknown',
                dept: regData.department || 'General',
                contact: regData.name,
                email: regData.email,
                system_id: assign_system_id || regData.system_id || null,
                active: true
            }).select('id').single();

            if (facCreateError || !newFac) {
                console.error("Facility Creation Error:", facCreateError);
                throw new Error('Failed to create facility');
            }
            facilityId = newFac.id;
            createdFacilityId = newFac.id;
        }

        // CREATE OR FIND USER
        let newUserId = null;
        let authCreated = false;
        let setPasswordLink: string | null = null;

        // T113/T60: no password travels through registration any more. The auth user is
        // created with a random throwaway credential nobody ever sees, and the welcome
        // email carries a set-password (recovery) link instead. A `password` value still
        // present on an old pending row is deliberately ignored.
        const authPassword = 'Aa1!' + crypto.randomUUID();

        // Check if user already exists by querying sbd_portal_users
        const { data: existingProfile } = await supabaseAdmin.from('sbd_portal_users').select('auth_uid').eq('email', regData.email).maybeSingle();

        // Define user true role based on assign_role passed from frontend. Fallback to requested_role, or 'staff_member'
        const accountRole = assign_role || regData.requested_role || 'staff_member';

        if (existingProfile && existingProfile.auth_uid) {
            console.log("User already exists in Supabase Auth (via portal):", existingProfile.auth_uid);
            newUserId = existingProfile.auth_uid;
        } else {
            console.log("Creating user in Supabase Auth...");
            const { data: authUser, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
                email: regData.email,
                password: authPassword,
                email_confirm: true,
                user_metadata: {
                    name: regData.name,
                    role: accountRole
                }
            });

            if (authCreateError || !authUser.user) {
                console.error("Auth User Creation Error:", authCreateError);
                throw new Error(`Failed to create auth user: ${authCreateError?.message || 'Unknown error'}`);
            }
            newUserId = authUser.user.id;
            authCreated = true;
            createdAuthUserId = authUser.user.id;

            // Set-password link for the welcome email. Non-fatal on failure: the account
            // is fine, and the person can use Forgot Password on the sign-in screen — the
            // email template says so when no link is present.
            setPasswordLink = await buildSetPasswordLink(regData.email);
        }

        console.log("Upserting portal user profile for:", newUserId);
        const nameParts0 = (regData.name || '').trim().split(' ');
        const initials = nameParts0.length > 1
            ? (nameParts0[0][0] + nameParts0[nameParts0.length - 1][0]).toUpperCase()
            : (nameParts0[0] || 'XX').substring(0, 2).toUpperCase();

        const { error: profileUpsertError } = await supabaseAdmin.from('sbd_portal_users').upsert({
            auth_uid: newUserId,
            email: regData.email,
            name: regData.name,
            role: accountRole,
            initials: initials,
            facility_id: facilityId,
            system_id: assign_system_id || regData.system_id || null,
            active: true
        }, { onConflict: 'auth_uid' });

        if (profileUpsertError) {
            console.error("Profile Upsert Error:", profileUpsertError);
            throw new Error('Failed to create user profile: ' + profileUpsertError.message);
        }
        // A brand-new auth uid cannot collide with an existing portal row, so this
        // upsert inserted; on the existing-user path it may have UPDATED a real row,
        // which a rollback must never delete.
        if (authCreated) createdPortalRow = true;

        // 2. Assign Staff record (for legacy compatibility and staff views)
        const nameParts = (regData.name || '').trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

        // Mirror of positionToAccess in src/js/ui-views.js:14834 — kept in the
        // same shape so the two stay easy to sync. The default staff position
        // for each portal access role is the first key that maps to it.
        const positionToAccess: Record<string, string> = {
            'SPD Technician I':'staff_member',  
            'SPD Technician II':'staff_member',
            'SPD Technician III':'staff_member',
            'Lead Technician':'hospital',       
            'Shift Supervisor':'hospital',
            'Department Supervisor':'facility_admin',
            'SPD Manager':'facility_admin',
            'Director of Sterile Processing':'facility_admin'
        };
        const accessToPosition: Record<string, string> = {};
        for (const [position, access] of Object.entries(positionToAccess)) {
            if (!accessToPosition[access]) accessToPosition[access] = position;
        }
        const staffPosition = accessToPosition[accountRole] || 'SPD Technician I';

        const { error: staffError } = await supabaseAdmin.from('staff').upsert({
            id: newUserId,
            first: firstName,
            last: lastName,
            fid: facilityId,
            role: staffPosition,
            // #718: nobody is assessed by having their registration approved. The row starts
            // unassessed and enters the placement queue instead of being certified White.
            belt: 'None',
            since: null,
            placement_needed: true
        }, { onConflict: 'id' });

        if (staffError) {
            // Non-fatal, as the original behavior: the auth user + profile are the account,
            // and a missing staff row is recoverable. We do not roll back a good account over it.
            // (Throwing here would hit the catch and delete the just-created auth user +
            // facility — the opposite of the intended narrow-to-orphan-path rollback.)
            console.error("Staff Insert Error:", staffError);
        } else if (authCreated) {
            createdStaffRow = true;
        }

        // 3. Update registration status. This used to run unchecked, so a failed update
        // returned success with the registration still pending — an admin re-approving it
        // would then hit the existing-user path and double-provision. Now it throws, and
        // the catch walks back everything created above, leaving the row cleanly pending.
        const { error: regUpdateError } = await supabaseAdmin.from('registrations').update({
            status: 'approved',
            reviewed_at: new Date().toISOString(),
            reviewed_by: adminId
        }).eq('id', registration_id);
        if (regUpdateError) {
            throw new Error('Failed to mark registration approved: ' + regUpdateError.message);
        }
        registrationApproved = true;

        let emailError = null;

        // 4. Queue Welcome Email via sbd_email_queue (processed by sbd-send-emails with retry logic)
        try {
            const { data: queuedRow, error: queueError } = await supabaseAdmin.from('sbd_email_queue').insert({
                recipient_email: regData.email,
                template: 'registration_approved',
                subject: authCreated
                    ? 'Welcome to Sterile by Design - Account Approved'
                    : 'SBD Registration Approved',
                body_data: {
                    contact_name: regData.name,
                    name: firstName,
                    facility_name: regData.facility || '',
                    set_password_link: setPasswordLink,
                    auth_created: authCreated,
                    role: accountRole,
                    login_email: regData.email
                },
                status: 'pending',
                attempts: 0,
                created_at: new Date().toISOString()
            }).select('id').single();

            if (queueError) {
                console.error("Email queue insert failed:", queueError);
                emailError = queueError.message;
            } else {
                queuedEmailId = queuedRow?.id ?? null;
                console.log("Approval email queued for:", regData.email);
            }
        } catch (e: any) {
            console.error("Failed to queue welcome email:", e.message);
            emailError = e.message;
        }


        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Registration approved',
            user_id: newUserId,
            facility_id: facilityId,
            auth_created: authCreated,
            email_error: emailError
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err: any) {
        console.error('Approve Error:', err.message);
        // Board item 141: walk back everything this call did, in reverse order of
        // creation, so a partial failure can never leave the 18 August shape behind
        // (an approved registration and a queued welcome email with no account).
        // Each step is try/caught on its own: one failed cleanup must not stop the rest.
        if (supabaseAdmin && queuedEmailId !== null) {
            try {
                await supabaseAdmin.from('sbd_email_queue').delete()
                    .eq('id', queuedEmailId).eq('status', 'pending');
                console.log('Rolled back queued welcome email', queuedEmailId);
            } catch (e: any) { console.error('Rollback (queued email) failed:', e?.message); }
        }
        if (supabaseAdmin && registrationApproved && registrationIdForRollback) {
            try {
                await supabaseAdmin.from('registrations').update({
                    status: 'pending', reviewed_at: null, reviewed_by: null
                }).eq('id', registrationIdForRollback);
                console.log('Rolled back registration to pending', registrationIdForRollback);
            } catch (e: any) { console.error('Rollback (registration) failed:', e?.message); }
        }
        if (supabaseAdmin && createdStaffRow && createdAuthUserId) {
            try { await supabaseAdmin.from('staff').delete().eq('id', createdAuthUserId); console.log('Rolled back created staff row', createdAuthUserId); }
            catch (e: any) { console.error('Rollback (staff) failed:', e?.message); }
        }
        if (supabaseAdmin && createdPortalRow && createdAuthUserId) {
            try { await supabaseAdmin.from('sbd_portal_users').delete().eq('auth_uid', createdAuthUserId); console.log('Rolled back created portal row', createdAuthUserId); }
            catch (e: any) { console.error('Rollback (portal) failed:', e?.message); }
        }
        if (supabaseAdmin && createdAuthUserId) {
            try { await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId); console.log('Rolled back orphaned auth user', createdAuthUserId); }
            catch (e: any) { console.error('Rollback (auth user) failed:', e?.message); }
        }
        if (supabaseAdmin && createdFacilityId) {
            try { await supabaseAdmin.from('facilities').delete().eq('id', createdFacilityId); console.log('Rolled back created facility', createdFacilityId); }
            catch (e: any) { console.error('Rollback (facility) failed:', e?.message); }
        }
        return new Response(JSON.stringify({ error: err.message }), {
            status: httpStatus,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
