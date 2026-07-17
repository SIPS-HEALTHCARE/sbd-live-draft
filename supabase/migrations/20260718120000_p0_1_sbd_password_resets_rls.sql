-- P0-1 (2026-07-18) · sbd_password_resets — reset tokens were world-readable.
-- Finding: an ALL=true policy for PUBLIC meant anyone holding the anon key could read
-- password-reset tokens. This table has NO reader anywhere in the repo — the live reset
-- flow uses Supabase Auth (SB_AUTH.requestPasswordReset -> GoTrue / auth.users), not this
-- custom table. Locking it to the service role is therefore safe: any legitimate consumer
-- must authenticate with the service key.
--
-- Fix: enable RLS, drop every existing policy (names unknown from the repo, so drop them
-- all by introspection), revoke all grants from anon/authenticated/PUBLIC, grant to
-- service_role (which bypasses RLS). No authenticated policy is created — by design.
begin;

alter table public.sbd_password_resets enable row level security;

do $$
declare pol record;
begin
  for pol in select policyname from pg_policies
             where schemaname = 'public' and tablename = 'sbd_password_resets'
  loop
    execute format('drop policy if exists %I on public.sbd_password_resets', pol.policyname);
  end loop;
end $$;

revoke all on public.sbd_password_resets from anon, authenticated;
revoke all on public.sbd_password_resets from public;
grant all on public.sbd_password_resets to service_role;

commit;

-- Rollback (restores the insecure open state — do NOT run except to deliberately revert):
--   create policy sbd_password_resets_all_all on public.sbd_password_resets
--     for all using (true) with check (true);
--   grant all on public.sbd_password_resets to anon, authenticated;
