-- #9 David tier setup (ADDITIVE — separate from the existing capability `tier`).
-- usage_tier = billing/volume tier; questions_allowance = monthly question pool for that tier.
-- Applied to production 2026-06-24 via apply_migration; this file version-controls it.
ALTER TABLE public.david_facility_access
  ADD COLUMN IF NOT EXISTS usage_tier text NOT NULL DEFAULT 'included',
  ADD COLUMN IF NOT EXISTS questions_allowance integer NOT NULL DEFAULT 250;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'david_facility_access_usage_tier_chk'
  ) THEN
    ALTER TABLE public.david_facility_access
      ADD CONSTRAINT david_facility_access_usage_tier_chk
      CHECK (usage_tier IN ('included','starter','standard','power'));
  END IF;
END $$;
