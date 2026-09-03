import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// T37 (S12) — master-admin observer-PIN management. The PIN lives in
// public.sbd_observer_pins, which has RLS on and no policies, so no browser can reach it
// under any query; this function is the only read path and it is master-admin only.
//
// Why this is a separate function from sbd-observation-unlock rather than another action
// on it: that one is assessor-facing (anyone who may conduct an observation calls it),
// this one is master-admin only. One mistake in action routing across that boundary is
// privilege escalation, so the boundary is a deployment boundary.
//
// One action, get_or_create: return the EXISTING PIN if there is one, otherwise generate,
// store and return a new one. A second call never rotates the PIN — it is reused for every
// observation, which is the established product behaviour. There is deliberately no
// separate read action: the interface has exactly one button ("Show PIN" once set,
// "Generate PIN" before that) and one code path is one thing to keep correct.
//
// Generation is server-side and not merely moved for tidiness: a PIN minted in a browser
// cannot be checked for uniqueness against PINs the browser is not allowed to see, and two
// observers sharing a PIN makes the observer identity unresolvable at unlock time.

const PIN_LENGTH = 4;
const MAX_PIN_ATTEMPTS = 25;

function randomPin(): string {
    // 4 digits, leading digit non-zero so the PIN is never displayed short.
    const n = 1000 + Math.floor(Math.random() * 9000);
    return String(n).padStart(PIN_LENGTH, '0');
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const admin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const body = await req.json();
        const staffId = body.staff_id;
        if (body.action && body.action !== 'get_or_create') {
            throw new Error("the only supported action is 'get_or_create'");
        }
        if (!staffId) throw new Error('staff_id is required');

        // ── Verify caller identity ──
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');
        const jwt = authHeader.replace(/^Bearer\s+/i, '');
        const { data: { user }, error: authError } = await admin.auth.getUser(jwt);
        if (authError || !user) throw new Error('Unauthorized: Invalid or expired session');

        // ── Authorize: master admin only ──
        // Mirrors the interface gate in generateObserverPin (ui-views.js). Deliberately
        // NOT the admin-role list used elsewhere: a facility leader reading every observer
        // PIN at their facility is the exposure T37 opened with.
        const { data: caller } = await admin
            .from('sbd_portal_users')
            .select('id, role')
            .eq('auth_uid', user.id)
            .single();

        if (!caller || caller.role !== 'master_admin') {
            return new Response(JSON.stringify({
                error: 'Unauthorized: only a master admin can view or generate observer PINs.',
                code: 'NOT_MASTER_ADMIN',
            }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // ── T33 admin MFA guard ─────────────────────────────────────────────────
        // Admin-tier JWTs must be aal2 (password + verified TOTP). Mirrors
        // public.sbd_mfa_satisfied() (migration 20260812130000); inlined because the
        // deploy pipeline cannot resolve ../_shared imports (#47).
        // scripts/verify-t33-security-tail.js asserts every copy agrees.
        const MFA_ADMIN_ROLES = ['master_admin', 'staff_admin', 'admin', 'master', 'sips_admin', 'system_admin'];
        const jwtAal = (t: string): string => {
            try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).aal || 'aal1'; }
            catch (_e) { return 'aal1'; }
        };
        const mfaDenied = (role: string | null | undefined, t: string): boolean =>
            MFA_ADMIN_ROLES.includes(String(role || '')) && jwtAal(t) !== 'aal2';
        if (mfaDenied(caller.role, jwt)) {
            return new Response(JSON.stringify({
                error: 'MFA required: administrator sessions must complete two-factor verification.',
                code: 'MFA_REQUIRED',
            }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // ── The target must be a real staff member ──
        const { data: target } = await admin
            .from('staff')
            .select('id, first, last, observer, observer_pin_set')
            .eq('id', staffId)
            .maybeSingle();
        if (!target) throw new Error('Staff member not found.');

        const { data: existing } = await admin
            .from('sbd_observer_pins')
            .select('pin')
            .eq('staff_id', staffId)
            .maybeSingle();

        if (existing) {
            // Self-heal the flag. It can only be wrong if a previous flag write failed
            // after the PIN was stored, and without this the roster would say "No PIN yet"
            // forever for someone who has one.
            if (!target.observer_pin_set) {
                await admin.from('staff').update({ observer_pin_set: true }).eq('id', staffId);
            }
            return new Response(JSON.stringify({ success: true, pin: existing.pin, created: false }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // ── First PIN for this observer ──
        // Checked after the existing-PIN read so that revoking observer access does not
        // strand a PIN the master admin can no longer look up.
        if (!target.observer) {
            return new Response(JSON.stringify({
                error: 'Grant observer access first, then generate a PIN.',
                code: 'NOT_AN_OBSERVER',
            }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Unique across observers — the unlock function resolves the observer BY PIN, so a
        // collision would make two people indistinguishable. The unique index on
        // sbd_observer_pins.pin is the real guarantee; this loop is what turns the
        // constraint into a retry instead of a user-visible failure.
        let pin: string | null = null;
        for (let i = 0; i < MAX_PIN_ATTEMPTS; i++) {
            const candidate = randomPin();
            const { error: insertError } = await admin
                .from('sbd_observer_pins')
                .insert({ staff_id: staffId, pin: candidate, created_by: caller.id });
            if (!insertError) { pin = candidate; break; }
            // 23505 = unique_violation. On the pin index, retry with a different PIN; on
            // the staff_id primary key another request won the race, so read theirs back.
            if (insertError.code !== '23505') throw insertError;
            const { data: raced } = await admin
                .from('sbd_observer_pins')
                .select('pin')
                .eq('staff_id', staffId)
                .maybeSingle();
            if (raced) {
                return new Response(JSON.stringify({ success: true, pin: raced.pin, created: false }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }
        }

        if (!pin) throw new Error('Could not allocate a unique observer PIN. Try again.');

        // The flag the interface reads. Best-effort: the PIN itself is stored, and
        // sbd-observer-pin `get` is the source of truth, so a failure here costs a stale
        // pill until the next write, not a lost PIN.
        const { error: flagError } = await admin
            .from('staff')
            .update({ observer_pin_set: true })
            .eq('id', staffId);
        if (flagError) console.error('observer_pin_set flag write failed:', flagError.message);

        return new Response(JSON.stringify({ success: true, pin, created: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (err: any) {
        console.error('Observer PIN Error:', err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
