-- T31: close the placement reviews that have no person behind them.
--
-- Two reviews sit in the queue pointing at staff_id values with no staff row and no portal
-- account. Nobody can action them, and they have been there since 8 May and 10 June.
--
--   d389c9b0  staff_id fac79bf1  Boston Children's  pending since 2026-05-08
--   bc9ce4ac  staff_id fc6ad084  Alta Bates (the inactive facility record)  since 2026-06-10
--
-- The client's rule is followed exactly: this keys on the record being gone, never on Free
-- Agent membership. Both were verified individually before writing this, not matched by a
-- pattern: no row in `staff`, and no row in `sbd_portal_users` by either staff_id or
-- auth_uid. A Free Agent with a working account keeps their pending items, because Free
-- Agent membership is not consulted here at all.
--
-- No account is touched. This migration writes to `placement_reviews` and to nothing else,
-- so `kbansil` and Jake are unaffected, as is every other account on the platform.
--
-- Eight orphan reviews exist in total. The six already marked confirmed or adjusted are
-- left exactly as they are: they are not in anybody's queue and rewriting closed history
-- would serve nothing. Only the two that are still pending are closed.
--
-- `closed_no_person` rather than `denied` or `confirmed`, because neither of those is true.
-- Nobody judged this work; the subject stopped existing. The admin screen buckets reviews as
-- pending against everything else, so this value leaves the queue and lands in the reviewed
-- list without needing a UI change.

update public.placement_reviews pr
   set status       = 'closed_no_person',
       review_notes = trim(both E'\n' from coalesce(pr.review_notes,'') || E'\n' ||
                      'Closed 2026-07-27: no staff record and no portal account exists for this staff_id, '
                      || 'so no one can action the review. Closed on the record being gone, not on Free Agent membership.'),
       reviewed_at  = now(),
       updated_at   = now()
 where pr.status = 'pending'
   and not exists (select 1 from public.staff s where s.id = pr.staff_id)
   and not exists (select 1 from public.sbd_portal_users p
                    where p.auth_uid = pr.staff_id
                       or p.staff_id::text = pr.staff_id::text);
