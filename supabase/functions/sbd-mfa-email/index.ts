// ── sbd-mfa-email · #1144 emailed code as a second factor for admin-tier sign-in ──
//
// T33 gates admin-tier reads on an aal2 JWT. This function is the ONE surface an
// admin may reach at aal1: it lets them prove a second factor by email and writes
// the verified row that public.sbd_mfa_satisfied() reads as its second door.
// It never returns data from a gated table.
//
//   status      → { verified, expires_at, email }   (is this session already verified?)
//   send_code   → queues a 6-digit code to the caller's auth email via sbd_email_queue
//   verify_code → checks the code, writes verified_until on the row
//
// Design note: docs/decisions/2026-09-10-1144-email-mfa-second-factor.md
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6';
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CODE_TTL_MINUTES = 10;           // same as the assessor PIN
const VERIFIED_HOURS = 12;             // bound to the JWT session_id; a new sign-in re-challenges
const RESEND_COOLDOWN_SECONDS = 60;    // per session
// #60 pattern (sbd-assessor-pin validate_pin): 5 failures → 15 min lock. The lock is
// per account (all sessions) so a password holder cannot reset it by signing in again.
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

// Admin-tier list — the canonical copy is public.sbd_mfa_satisfied() (migration
// 20260910120000); mirrored in src/js/mfa.js and the 15 guarded functions.
// scripts/verify-t33-security-tail.js asserts every copy agrees. This function is
// the deliberate EXEMPTION from the aal2 guard: it must be reachable at aal1.
const MFA_ADMIN_ROLES = ['master_admin', 'staff_admin', 'admin', 'master', 'sips_admin', 'system_admin'];

function jwtPayload(t: string): Record<string, unknown> {
    try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); }
    catch (_e) { return {}; }
}

/** Same generator as sbd-assessor-pin: 6 digits, no repeated or sequential runs. */
function generateCode(): string {
    const array = new Uint32Array(1);
    let code = '';
    for (let i = 0; i < 100; i++) {
        crypto.getRandomValues(array);
        code = String(array[0] % 1000000).padStart(6, '0');
        if (!isWeak(code)) break;
    }
    return code;
}
function isWeak(code: string): boolean {
    if (/^(.)\1{5}$/.test(code)) return true;
    let asc = true, desc = true;
    for (let i = 1; i < code.length; i++) {
        if (parseInt(code[i]) !== parseInt(code[i - 1]) + 1) asc = false;
        if (parseInt(code[i]) !== parseInt(code[i - 1]) - 1) desc = false;
    }
    return asc || desc;
}

function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const db = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } },
        );

        const { action, code } = await req.json();

        // ── Caller identity (aal1 is fine here — that is the whole point) ──
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);
        const jwt = authHeader.replace(/^Bearer\s+/i, '');
        const { data: { user }, error: authError } = await db.auth.getUser(jwt);
        if (authError || !user) return json({ error: 'Unauthorized: invalid or expired session' }, 401);

        const sessionId = String(jwtPayload(jwt).session_id || '');
        if (!/^[0-9a-f-]{36}$/i.test(sessionId)) return json({ error: 'Session id missing from token' }, 400);

        // Only admin-tier accounts have anything to gain here; everyone else is
        // told nothing is required. Active accounts only.
        const { data: profile } = await db
            .from('sbd_portal_users')
            .select('id, role, name, active')
            .or(`auth_uid.eq.${user.id},id.eq.${user.id}`)
            .limit(1)
            .maybeSingle();
        if (!profile || profile.active === false || !MFA_ADMIN_ROLES.includes(String(profile.role || ''))) {
            return json({ error: 'Email verification is only available to administrator accounts.' }, 403);
        }
        if (!user.email) return json({ error: 'This account has no email address on file.' }, 400);

        const nowMs = Date.now();
        const nowIso = new Date(nowMs).toISOString();

        // Account-wide lock: newest locked_until across every session of this user.
        const { data: lockRows } = await db
            .from('sbd_mfa_email_codes')
            .select('locked_until')
            .eq('auth_uid', user.id)
            .gt('locked_until', nowIso)
            .order('locked_until', { ascending: false })
            .limit(1);
        const lockedUntilMs = lockRows && lockRows.length ? new Date(lockRows[0].locked_until).getTime() : 0;
        const lockedResponse = () => {
            const retryMinutes = Math.ceil((lockedUntilMs - Date.now()) / 60000);
            return json({
                error: `Too many incorrect codes. Try again in ${retryMinutes} minute${retryMinutes === 1 ? '' : 's'}.`,
                code: 'RATE_LIMITED',
                retry_after_minutes: retryMinutes,
            }, 429);
        };

        const { data: row } = await db
            .from('sbd_mfa_email_codes')
            .select('*')
            .eq('auth_uid', user.id)
            .eq('session_id', sessionId)
            .maybeSingle();
        const verified = !!(row && row.verified_until && new Date(row.verified_until).getTime() > nowMs);

        // ════════════════════════════════════════════════════════════
        if (action === 'status') {
            return json({ verified, expires_at: verified ? row.verified_until : null, email: user.email });
        }

        // ════════════════════════════════════════════════════════════
        if (action === 'send_code') {
            if (verified) return json({ already_verified: true, expires_at: row.verified_until });
            if (lockedUntilMs > nowMs) return lockedResponse();
            if (row && row.sent_at && nowMs - new Date(row.sent_at).getTime() < RESEND_COOLDOWN_SECONDS * 1000) {
                const wait = Math.ceil((RESEND_COOLDOWN_SECONDS * 1000 - (nowMs - new Date(row.sent_at).getTime())) / 1000);
                return json({ error: `A code was just sent. You can request another in ${wait}s.`, code: 'COOLDOWN', retry_after_seconds: wait }, 429);
            }

            // ponytail: no row sweep — one row per admin session is a few thousand
            // rows a year; add a pg_cron delete on verified_until/locked_until < now()-7d
            // if the table is ever worth trimming.
            const plain = generateCode();
            // hashSync (not hash): the Edge runtime has no Worker global — same reason as sbd-assessor-pin.
            const codeHash = bcrypt.hashSync(plain);
            const codeExpiresAt = new Date(nowMs + CODE_TTL_MINUTES * 60 * 1000).toISOString();

            const { error: upErr } = await db.from('sbd_mfa_email_codes').upsert({
                auth_uid: user.id,
                session_id: sessionId,
                code_hash: codeHash,
                code_expires_at: codeExpiresAt,
                failed_attempts: 0,
                sent_at: nowIso,
            }, { onConflict: 'auth_uid,session_id' });
            if (upErr) { console.error('mfa code upsert failed:', upErr); return json({ error: 'Could not create a code. Try again.' }, 500); }

            // The queued row IS the email body: sbd-send-emails retries re-send this
            // exact row, so a retry can never carry a different code.
            const { error: qErr } = await db.from('sbd_email_queue').insert({
                recipient_email: user.email,
                recipient_name: profile.name || null,
                template: 'mfa_email_code',
                subject: 'Your SBD sign-in code',
                body_data: { name: profile.name || 'there', code: plain, expires_minutes: CODE_TTL_MINUTES },
                status: 'pending',
                attempts: 0,
                created_at: nowIso,
            });
            if (qErr) {
                console.error('mfa code queue insert failed:', qErr);
                // Void the code we cannot deliver so it is not a dangling secret.
                await db.from('sbd_mfa_email_codes').update({ code_hash: null, code_expires_at: null }).eq('auth_uid', user.id).eq('session_id', sessionId);
                return json({ error: 'Could not queue the email. Try again.' }, 500);
            }

            return json({ sent: true, email: user.email, expires_at: codeExpiresAt, resend_after_seconds: RESEND_COOLDOWN_SECONDS });
        }

        // ════════════════════════════════════════════════════════════
        if (action === 'verify_code') {
            if (verified) return json({ verified: true, expires_at: row.verified_until });
            if (lockedUntilMs > nowMs) return lockedResponse();
            if (!/^\d{6}$/.test(String(code || ''))) return json({ error: 'Enter the 6-digit code.', code: 'INVALID_FORMAT' }, 400);
            if (!row || !row.code_hash || !row.code_expires_at || new Date(row.code_expires_at).getTime() < nowMs) {
                return json({ error: 'That code has expired. Request a new one.', code: 'NO_CODE' }, 400);
            }

            if (!bcrypt.compareSync(String(code), row.code_hash)) {
                const fails = (row.failed_attempts || 0) + 1;
                const patch: Record<string, unknown> = { failed_attempts: fails };
                if (fails >= MAX_FAILED_ATTEMPTS) {
                    // Void the code and lock the account; the next send_code is refused until the lock lifts.
                    patch.code_hash = null;
                    patch.code_expires_at = null;
                    patch.locked_until = new Date(nowMs + LOCKOUT_DURATION_MINUTES * 60 * 1000).toISOString();
                }
                const { error: fErr } = await db.from('sbd_mfa_email_codes').update(patch).eq('auth_uid', user.id).eq('session_id', sessionId);
                if (fErr) console.error('mfa failed-attempt write failed:', fErr);
                if (fails >= MAX_FAILED_ATTEMPTS) {
                    return json({ error: `Too many incorrect codes. Try again in ${LOCKOUT_DURATION_MINUTES} minutes.`, code: 'RATE_LIMITED', retry_after_minutes: LOCKOUT_DURATION_MINUTES }, 429);
                }
                return json({ error: 'That code did not match. Check the email and try again.', code: 'INVALID_CODE', attempts_left: MAX_FAILED_ATTEMPTS - fails }, 403);
            }

            const verifiedUntil = new Date(nowMs + VERIFIED_HOURS * 3600 * 1000).toISOString();
            const { error: vErr } = await db.from('sbd_mfa_email_codes').update({
                code_hash: null,
                code_expires_at: null,
                failed_attempts: 0,
                verified_at: nowIso,
                verified_until: verifiedUntil,
            }).eq('auth_uid', user.id).eq('session_id', sessionId);
            if (vErr) { console.error('mfa verified write failed:', vErr); return json({ error: 'Could not record the verification. Try again.' }, 500); }

            return json({ verified: true, expires_at: verifiedUntil });
        }

        return json({ error: `Unknown action: ${action}` }, 400);
    } catch (err: any) {
        console.error('sbd-mfa-email error:', err.message);
        return json({ error: err.message || 'Internal error' }, 400);
    }
});
