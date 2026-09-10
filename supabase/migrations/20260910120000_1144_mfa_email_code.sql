-- ── #1144 · Emailed code as a second factor for admins (Iggie ruling 9/3, T33 follow-up) ──
--
-- sbd_mfa_satisfied() (20260904120000) passes an admin only on an aal2 JWT, and
-- GoTrue mints aal2 only for its own factors (TOTP, phone). Admins on hospital
-- floors often have no phone in hand, so an emailed code must open the same door.
--
--   1. sbd_mfa_email_codes — one row per (auth_uid, session_id). The pending code
--      and the verified state share the row. Only sbd-mfa-email (service role)
--      writes it; RLS on with zero policies, same posture as sbd_observer_pins.
--   2. sbd_mfa_satisfied() gains an exists() on that table, bound to auth.uid()
--      and the JWT session_id, inside the verified window. The three hardcoded
--      SIPS emails are dropped from the admin test (those accounts hold real
--      sbd_portal_users roles; sbd_is_admin() keeps its own list untouched).
--
-- Deploy order: sbd-send-emails + sbd-mfa-email functions FIRST, this migration
-- after. TOTP users are unchanged: the aal2 leg is still the first test.
-- Design note: docs/decisions/2026-09-10-1144-email-mfa-second-factor.md
-- Read-back: supabase/verify/t33_mfa_gate_check.sql (§1–§4b, §4b excludes this table)

-- ── 1 · The table ──────────────────────────────────────────────────────────────
create table if not exists public.sbd_mfa_email_codes (
  auth_uid         uuid        not null references auth.users(id) on delete cascade,
  session_id       uuid        not null,            -- JWT session_id claim; refresh keeps it
  code_hash        text,                            -- bcrypt of the 6-digit code; null once used/voided
  code_expires_at  timestamptz,
  failed_attempts  integer     not null default 0,
  sent_at          timestamptz,                     -- resend cooldown anchor
  locked_until     timestamptz,                     -- 5 wrong codes → 15 min, read per auth_uid
  verified_at      timestamptz,
  verified_until   timestamptz,                     -- the predicate reads only this
  created_at       timestamptz not null default now(),
  -- The composite PK IS the index on both columns the predicate binds to.
  primary key (auth_uid, session_id)
);

comment on table public.sbd_mfa_email_codes is
  '#1144: emailed second factor for admin-tier sign-in. One row per auth session '
  '(JWT session_id). Only the sbd-mfa-email edge function (service role) writes it; '
  'sbd_mfa_satisfied() reads verified_until as its second door. RLS on, no policies: '
  'never expose to authenticated.';

alter table public.sbd_mfa_email_codes enable row level security;

revoke all on table public.sbd_mfa_email_codes from public;
revoke all on table public.sbd_mfa_email_codes from anon;
revoke all on table public.sbd_mfa_email_codes from authenticated;
grant all on table public.sbd_mfa_email_codes to service_role;

-- ── 2 · The predicate, v2 ──────────────────────────────────────────────────────
-- Same signature, same grants (create or replace keeps the ACL). Still STABLE:
-- now() is fixed for the statement, so the planner may still evaluate it once
-- per statement rather than per row. Still SECURITY DEFINER so the zero-policy
-- table above is readable from inside an RLS check (no recursion: this table
-- carries no sbd_mfa_gate policy — see the §4b exclusion in the read-back).
-- session_id is compared as text: a definer function must not raise on a
-- non-uuid claim, and per-user rows are few so the auth_uid prefix carries the
-- index lookup.
-- The admin-tier role list exists in four places that must agree: here,
-- src/js/mfa.js (MFA.ADMIN_ROLES), and the MFA_ADMIN_ROLES block inlined in each
-- role-gated edge function. scripts/verify-t33-security-tail.js asserts it.
create or replace function public.sbd_mfa_satisfied()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2'
    or exists (
      select 1 from public.sbd_mfa_email_codes c
      where c.auth_uid = auth.uid()
        and c.session_id::text = auth.jwt()->>'session_id'
        and c.verified_until > now()
    )
    or not (
      coalesce(auth.jwt()->'app_metadata'->>'role', '')
        in ('master_admin','staff_admin','admin','master','sips_admin','system_admin')
      or exists (
        select 1 from public.sbd_portal_users u
        where (u.auth_uid = auth.uid()
               or u.id = auth.uid()
               or lower(u.email) = lower(coalesce(auth.jwt()->>'email','')))
          and u.role in ('master_admin','staff_admin','admin','master','sips_admin','system_admin')
      )
    );
$$;

comment on function public.sbd_mfa_satisfied() is
  'T33 + #1144: true for non-admin-tier callers, for aal2 JWTs, or for an aal1 admin '
  'whose current session (JWT session_id) has an unexpired verified row in '
  'sbd_mfa_email_codes. STABLE (now() is statement-fixed), SECURITY DEFINER so the '
  'zero-policy table is readable inside RLS. Used by every sbd_mfa_gate policy and '
  'by sbd_is_admin().';

-- ── Post-apply check (read-only) ───────────────────────────────────────────────
-- select prosrc like '%sbd_mfa_email_codes%' as has_email_leg,
--        prosrc like '%sipsconsults%'        as still_has_allowlist  -- expect f
--   from pg_proc where proname = 'sbd_mfa_satisfied';
-- Full read-back: supabase/verify/t33_mfa_gate_check.sql
