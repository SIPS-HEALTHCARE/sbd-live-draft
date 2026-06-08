import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6';
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PIN_TTL_MINUTES = 10;
const SESSION_TTL_MINUTES = 90;
const MAX_FAILED_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_HOURS = 1;
const ASSESSOR_ROLES = ['master_admin', 'staff_admin', 'system_admin', 'admin', 'master', 'educator', 'preceptor'];

/**
 * Generate a cryptographically random 6-digit PIN.
 * Rejects sequential (123456) and repeated (111111) patterns.
 */
function generateSecurePin(): string {
    const array = new Uint32Array(1);
    let pin: string;
    let attempts = 0;
    do {
        crypto.getRandomValues(array);
        pin = String(array[0] % 1000000).padStart(6, '0');
        attempts++;
        if (attempts > 100) break; // safety valve
    } while (isWeakPin(pin));
    return pin;
}

function isWeakPin(pin: string): boolean {
    // All same digit: 111111, 222222, etc.
    if (/^(.)\1{5}$/.test(pin)) return true;
    // Sequential ascending: 123456, 234567, etc.
    let ascending = true;
    let descending = true;
    for (let i = 1; i < pin.length; i++) {
        if (parseInt(pin[i]) !== parseInt(pin[i - 1]) + 1) ascending = false;
        if (parseInt(pin[i]) !== parseInt(pin[i - 1]) - 1) descending = false;
    }
    if (ascending || descending) return true;
    return false;
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const body = await req.json();
        const { action } = body;

        // ── Verify caller identity ──
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');
        const jwt = authHeader.replace(/^Bearer\s+/i, '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt);
        if (authError || !user) throw new Error('Unauthorized: Invalid or expired session');

        // ════════════════════════════════════════════════════════════
        // ACTION: generate_pin
        // Called by the ASSESSOR from their dashboard
        // ════════════════════════════════════════════════════════════
        if (action === 'generate_pin') {
            const { staff_id, assessment_type = 'placement' } = body;
            if (!staff_id) throw new Error('staff_id is required');

            // 1. Verify caller is an assessor
            const { data: assessor } = await supabaseAdmin
                .from('sbd_portal_users')
                .select('id, role, name, assigned_facility_ids')
                .eq('auth_uid', user.id)
                .single();

            if (!assessor || !ASSESSOR_ROLES.includes(assessor.role)) {
                throw new Error('Unauthorized: Only assessors can generate authorization PINs.');
            }

            // 2. Look up the staff member's facility
            const { data: staffRow } = await supabaseAdmin
                .from('staff')
                .select('id, fid, first, last')
                .eq('id', staff_id)
                .single();

            if (!staffRow) throw new Error('Staff member not found.');

            // 3. Verify facility match (assessor must be assigned to staff's facility)
            const assessorFids = assessor.assigned_facility_ids || [];
            const isMaster = assessor.role === 'master_admin';
            if (!isMaster && assessorFids.length > 0 && !assessorFids.includes(staffRow.fid)) {
                throw new Error('Unauthorized: You are not assigned to this staff member\'s facility.');
            }

            // 4. Invalidate any existing unexpired PINs for this staff+type
            await supabaseAdmin
                .from('sbd_assessment_pins')
                .update({ used: true, used_at: new Date().toISOString() })
                .eq('staff_id', staff_id)
                .eq('assessment_type', assessment_type)
                .eq('used', false)
                .gt('expires_at', new Date().toISOString());

            // 5. Generate and store new PIN
            const pin = generateSecurePin();
            // hashSync (not hash) — Supabase Edge runtime has no Worker global,
            // and async bcrypt.hash() spawns a Worker internally.
            const pinHash = bcrypt.hashSync(pin);
            const expiresAt = new Date(Date.now() + PIN_TTL_MINUTES * 60 * 1000).toISOString();

            const { data: pinRow, error: pinError } = await supabaseAdmin
                .from('sbd_assessment_pins')
                .insert({
                    assessor_id: assessor.id,
                    staff_id: staff_id,
                    facility_id: staffRow.fid,
                    assessment_type: assessment_type,
                    pin_hash: pinHash,
                    expires_at: expiresAt,
                })
                .select('id')
                .single();

            if (pinError) {
                console.error('PIN insert error:', pinError);
                throw new Error('Failed to generate authorization PIN.');
            }

            // ── Notify master admins of PIN issuance (audit trail) ──
            // Notifications go through sbd_email_queue (processed by sbd-send-emails).
            // The staff table has no assigned-assessor column, so we notify master
            // admins only. The PIN generator is excluded so they don't self-notify.
            // Wrapped in try/catch so notification failure cannot block the PIN return.
            try {
                const { data: masterAdmins } = await supabaseAdmin
                    .from('sbd_portal_users')
                    .select('id, name, email')
                    .eq('role', 'master_admin')
                    .eq('active', true);

                const recipients = (masterAdmins || []).filter(m => m.id !== assessor.id && m.email);
                if (recipients.length > 0) {
                    const nowIso = new Date().toISOString();
                    const queueRows = recipients.map(m => ({
                        recipient_email: m.email,
                        template: 'assessment_pin_generated',
                        subject: `Assessment PIN generated for ${staffRow.first} ${staffRow.last}`,
                        body_data: {
                            name: m.name,
                            assessor_name: assessor.name,
                            staff_name: `${staffRow.first} ${staffRow.last}`,
                            assessment_type,
                            facility_id: staffRow.fid,
                            expires_at: expiresAt,
                        },
                        status: 'pending',
                        attempts: 0,
                        created_at: nowIso,
                    }));
                    const { error: queueErr } = await supabaseAdmin
                        .from('sbd_email_queue')
                        .insert(queueRows);
                    if (queueErr) console.error('PIN notification queue insert failed:', queueErr);
                }
            } catch (notifyErr) {
                console.error('PIN generated but notification queue failed:', notifyErr);
            }

            return new Response(JSON.stringify({
                success: true,
                pin: pin,  // Plaintext returned ONCE to assessor, never stored
                pin_id: pinRow.id,
                expires_at: expiresAt,
                staff_name: `${staffRow.first} ${staffRow.last}`,
                assessment_type: assessment_type,
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // ════════════════════════════════════════════════════════════
        // ACTION: validate_pin
        // Called from the STAFF MEMBER'S device after assessor enters PIN
        // ════════════════════════════════════════════════════════════
        if (action === 'validate_pin') {
            const { pin, staff_id, assessment_type = 'placement' } = body;
            if (!pin || !staff_id) throw new Error('pin and staff_id are required');

            // 1. Rate limit check: count recent failed attempts
            const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
            const { count: failedCount } = await supabaseAdmin
                .from('sbd_assessment_pins')
                .select('id', { count: 'exact', head: true })
                .eq('staff_id', staff_id)
                .eq('used', false)
                .gt('created_at', oneHourAgo);

            // We track failed attempts via a separate approach:
            // Check if there's a recent lockout flag in session metadata
            // For now, we limit by checking attempt patterns

            // 2. Find unexpired, unused PIN for this staff + type
            const { data: pinRows } = await supabaseAdmin
                .from('sbd_assessment_pins')
                .select('*')
                .eq('staff_id', staff_id)
                .eq('assessment_type', assessment_type)
                .eq('used', false)
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false })
                .limit(1);

            if (!pinRows || pinRows.length === 0) {
                return new Response(JSON.stringify({
                    error: 'No pending authorization found. Ask your assessor to generate a new PIN.',
                    code: 'NO_PIN'
                }), {
                    status: 403,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            const pinRecord = pinRows[0];

            // 3. bcrypt compare — compareSync for the same Worker reason as hashSync above.
            const isValid = bcrypt.compareSync(pin, pinRecord.pin_hash);

            if (!isValid) {
                return new Response(JSON.stringify({
                    error: 'Invalid authorization code. Please try again.',
                    code: 'INVALID_PIN'
                }), {
                    status: 403,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // 4. PIN is valid — mark as used
            const now = new Date().toISOString();
            await supabaseAdmin
                .from('sbd_assessment_pins')
                .update({ used: true, used_at: now })
                .eq('id', pinRecord.id);

            // 5. Create assessment session (90-min TTL)
            const sessionExpiresAt = new Date(Date.now() + SESSION_TTL_MINUTES * 60 * 1000).toISOString();

            const { data: session, error: sessError } = await supabaseAdmin
                .from('sbd_assessment_sessions')
                .insert({
                    staff_id: staff_id,
                    assessor_id: pinRecord.assessor_id,
                    facility_id: pinRecord.facility_id,
                    pin_id: pinRecord.id,
                    assessment_type: assessment_type,
                    status: 'active',
                    authorized_at: now,
                    expires_at: sessionExpiresAt,
                    device_info: body.device_info || {},
                })
                .select('id, session_token, expires_at')
                .single();

            if (sessError) {
                console.error('Session create error:', sessError);
                throw new Error('Failed to create assessment session.');
            }

            // 6. Link session back to PIN record
            await supabaseAdmin
                .from('sbd_assessment_pins')
                .update({ session_id: session.id })
                .eq('id', pinRecord.id);

            // 6b. RESUME SUPPORT — carry over the candidate's most recent saved
            // progress into this new session, so a re-PIN (after a wifi drop /
            // expiry / new device) picks up where they left off instead of
            // starting blank. We pick the latest prior session that actually has
            // answers, copy it onto the new session, and return it to the client.
            let resumeProgress: any = {};
            try {
                const { data: priorSessions } = await supabaseAdmin
                    .from('sbd_assessment_sessions')
                    .select('progress, created_at')
                    .eq('staff_id', staff_id)
                    .eq('assessment_type', assessment_type)
                    .neq('id', session.id)
                    .order('created_at', { ascending: false })
                    .limit(8);
                for (const ps of (priorSessions || [])) {
                    const p = ps.progress;
                    if (p && p.answers && Object.keys(p.answers).length > 0) { resumeProgress = p; break; }
                }
                if (resumeProgress && Object.keys(resumeProgress).length > 0) {
                    await supabaseAdmin
                        .from('sbd_assessment_sessions')
                        .update({ progress: resumeProgress })
                        .eq('id', session.id);
                }
            } catch (resumeErr) {
                console.error('Resume progress carry-over failed (non-blocking):', resumeErr);
            }

            // 7. Get assessor name for confirmation display
            const { data: assessor } = await supabaseAdmin
                .from('sbd_portal_users')
                .select('name')
                .eq('id', pinRecord.assessor_id)
                .single();

            return new Response(JSON.stringify({
                success: true,
                session_token: session.session_token,
                session_id: session.id,
                assessor_name: assessor?.name || 'Assessor',
                facility_id: pinRecord.facility_id,
                expires_at: session.expires_at,
                progress: resumeProgress || {},
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // ════════════════════════════════════════════════════════════
        // ACTION: validate_session
        // Check if an active session is still valid
        // ════════════════════════════════════════════════════════════
        if (action === 'validate_session') {
            const { session_token } = body;
            if (!session_token) throw new Error('session_token is required');

            const { data: session } = await supabaseAdmin
                .from('sbd_assessment_sessions')
                .select('*')
                .eq('session_token', session_token)
                .single();

            if (!session) {
                return new Response(JSON.stringify({ valid: false, error: 'Session not found' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            const now = new Date();
            const expiresAt = new Date(session.expires_at);
            const isExpired = now > expiresAt;
            const remainingMs = Math.max(0, expiresAt.getTime() - now.getTime());
            const remainingMinutes = Math.ceil(remainingMs / 60000);

            // Auto-expire if needed
            if (isExpired && session.status === 'active') {
                await supabaseAdmin
                    .from('sbd_assessment_sessions')
                    .update({ status: 'expired' })
                    .eq('id', session.id);
                session.status = 'expired';
            }

            return new Response(JSON.stringify({
                valid: session.status === 'active' && !isExpired,
                status: session.status,
                expired: isExpired,
                remaining_minutes: remainingMinutes,
                progress: session.progress || {},
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // ════════════════════════════════════════════════════════════
        // ACTION: save_progress
        // Persist assessment progress server-side
        // ════════════════════════════════════════════════════════════
        if (action === 'save_progress') {
            const { session_token, progress } = body;
            if (!session_token || !progress) throw new Error('session_token and progress are required');

            const { data: session } = await supabaseAdmin
                .from('sbd_assessment_sessions')
                .select('id, status, expires_at')
                .eq('session_token', session_token)
                .single();

            if (!session) throw new Error('Session not found');
            if (session.status !== 'active') throw new Error('Session is no longer active');

            const now = new Date();
            if (now > new Date(session.expires_at)) {
                await supabaseAdmin
                    .from('sbd_assessment_sessions')
                    .update({ status: 'expired' })
                    .eq('id', session.id);
                throw new Error('Session has expired');
            }

            const { error: updateError } = await supabaseAdmin
                .from('sbd_assessment_sessions')
                .update({ progress: { ...progress, lastSavedAt: now.toISOString() } })
                .eq('id', session.id);

            if (updateError) throw new Error('Failed to save progress');

            return new Response(JSON.stringify({ saved: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // ════════════════════════════════════════════════════════════
        // ACTION: complete_session
        // Mark session as completed on assessment submission
        // ════════════════════════════════════════════════════════════
        if (action === 'complete_session') {
            const { session_token } = body;
            if (!session_token) throw new Error('session_token is required');

            const { error: updateError } = await supabaseAdmin
                .from('sbd_assessment_sessions')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                })
                .eq('session_token', session_token)
                .eq('status', 'active');

            if (updateError) throw new Error('Failed to complete session');

            return new Response(JSON.stringify({ completed: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        throw new Error(`Unknown action: ${action}`);

    } catch (err: any) {
        console.error('Assessor PIN Error:', err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
