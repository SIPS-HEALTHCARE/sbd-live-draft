-- 20260710223724_recover_partial_timeouts.sql
-- Safety-net hardening: sbd_recover_placements now also finalizes TIMED-OUT PARTIAL
-- placements, not just fully-answered ones. This closes the gap where a candidate whose
-- browser is closed at the exact expiry second (so the client-side timeout auto-submit
-- never fires) ends up with no placement_review at all - the session is invisible.
--
-- Two changes vs the prior version:
--   1. Removed the "fully-answered" gate. A session past expiry cannot be resumed, so it is
--      finalized as-is, unanswered scores zero - mirroring the on-screen client timeout
--      contract ("if time runs out, the test is submitted as-is and anything unanswered
--      scores zero"). A guard requires at least one answered question so a completely
--      untouched expired session is never turned into a review.
--   2. Blank simulations score 0 with NO grader call (the grader rejects an empty answer).
--      Answered simulations still go through the SAME real grader; any grader failure on an
--      answered sim skips the whole session and retries next run (never persists fallback notes).
--
-- Signature unchanged (p_limit integer DEFAULT 5); the pg_cron job `select
-- public.sbd_recover_placements();` keeps working. CREATE OR REPLACE, additive, no data change.

CREATE OR REPLACE FUNCTION public.sbd_recover_placements(p_limit integer DEFAULT 5)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  c_url   text := 'https://mhijaqahbceuahfzezbh.supabase.co/functions/v1/sbd-score-assessment';
  c_anon  text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oaWphcWFoYmNldWFoZnplemJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MDkwNzksImV4cCI6MjA4OTM4NTA3OX0.GZcvOFxm4uNdTFPnq-rfwHaMVhWbIJWY7QMYToPa7mQ';
  v_sess record;
  v_q jsonb;
  v_ans text;
  v_status int;
  v_content text;
  v_sim jsonb;
  v_ok boolean;
  v_responses jsonb;
  v_levels jsonb;
  v_kraw numeric; v_kl1 numeric; v_sraw numeric; v_blended int; v_kov int; v_danger boolean;
  v_belt text;
  v_name text; v_title text;
  v_ins int;
  v_recovered jsonb := '[]'::jsonb;
  v_skipped jsonb := '[]'::jsonb;
  v_scanned int := 0;
begin
  perform http_set_curlopt('CURLOPT_TIMEOUT_MS','25000');

  for v_sess in
    select s.id, s.staff_id, s.progress
    from sbd_assessment_sessions s
    where s.assessment_type = 'placement'
      and s.expires_at < now() - interval '15 minutes'
      and s.expires_at > now() - interval '30 days'
      and jsonb_array_length(coalesce(s.progress->'shuffledQuestions','[]'::jsonb)) > 0
      and s.staff_id is not null
      -- at least one answered question (never finalize a completely untouched expired session)
      and (select count(*) from jsonb_object_keys(coalesce(s.progress->'answers','{}'::jsonb))) > 0
      and not exists (select 1 from placement_reviews pr where pr.staff_id = s.staff_id)
    order by s.expires_at desc
    limit p_limit
  loop
    v_scanned := v_scanned + 1;

    -- Grade every simulation via the SAME grader. Blank answer -> score 0 with no grader
    -- call (grader rejects an empty answer), exactly like the client timeout. ANY grader
    -- failure on an ANSWERED sim -> skip this session (retried next run); never persist
    -- with fallback/generic notes.
    v_sim := '{}'::jsonb;
    v_ok := true;
    for v_q in
      select q from jsonb_array_elements(v_sess.progress->'shuffledQuestions') q
      where (q->>'type') = 'simulation'
    loop
      v_ans := coalesce(v_sess.progress->'answers'->>(v_q->>'id'), '');
      if length(trim(v_ans)) = 0 then
        v_sim := v_sim || jsonb_build_object(v_q->>'id',
          jsonb_build_object('score', 0, 'feedback', 'No answer submitted (time expired).'));
        continue;
      end if;
      begin
        select (r).status, (r).content into v_status, v_content
        from (select http((
          'POST', c_url,
          array[http_header('apikey', c_anon), http_header('Authorization', 'Bearer ' || c_anon)],
          'application/json',
          json_build_object('question', v_q->>'q', 'answer', v_ans)::text
        )::http_request) r) t;
      exception when others then
        v_ok := false; exit;
      end;
      if v_status <> 200 or v_content is null or (v_content::jsonb->>'score') is null then
        v_ok := false; exit;
      end if;
      v_sim := v_sim || jsonb_build_object(v_q->>'id',
        jsonb_build_object('score', (v_content::jsonb->>'score')::int, 'feedback', v_content::jsonb->>'feedback'));
    end loop;

    if not v_ok then
      v_skipped := v_skipped || jsonb_build_object('session_id', v_sess.id, 'reason', 'grader_unavailable');
      continue;
    end if;

    -- Build responses (knowledge first then simulations) + aggregates, same as paPersistSubmission.
    with built as (
      select e.ord, (q->>'type') typ, (q->>'level')::int lvl, q->>'id' qid, q,
             v_sess.progress->'answers'->>(q->>'id') ans
      from jsonb_array_elements(v_sess.progress->'shuffledQuestions') with ordinality e(q, ord)
    ),
    scored as (
      select ord, typ, lvl,
        case when typ='knowledge' then (case when ans = q->>'correct' then 100 else 0 end)
             else (v_sim->qid->>'score')::int end sc,
        case when typ='knowledge'
             then coalesce((q->'dangerousAnswers') @> to_jsonb(case when ans ~ '^[0-9]+$' then ans::int else -1 end)
                           and ans <> q->>'correct', false)
             else false end dng,
        case when typ='knowledge' then jsonb_build_object(
            'qId', qid, 'type', 'knowledge', 'level', lvl, 'question', q->>'q',
            'answer', case when ans ~ '^[0-9]+$' then (q->'options')->>(ans::int) else 'No answer' end,
            'correctAnswer', (q->'options')->>((q->>'correct')::int),
            'correct', (ans = q->>'correct'),
            'score', case when ans = q->>'correct' then 100 else 0 end,
            'isDangerous', coalesce((q->'dangerousAnswers') @> to_jsonb(case when ans ~ '^[0-9]+$' then ans::int else -1 end)
                                    and ans <> q->>'correct', false))
          else jsonb_build_object(
            'qId', qid, 'type', 'simulation', 'level', lvl, 'question', q->>'q',
            'answer', coalesce(ans, ''),
            'aiScore', (v_sim->qid->>'score')::int,
            'aiFeedback', v_sim->qid->>'feedback') end robj
      from built
    )
    select
      jsonb_agg(robj order by (case when typ='knowledge' then 0 else 1 end), ord),
      avg(sc) filter (where typ='knowledge'),
      avg(sc) filter (where typ='knowledge' and lvl=1),
      avg(sc) filter (where typ='simulation'),
      bool_or(dng),
      (select jsonb_object_agg(l, s) from (select lvl l, round(avg(sc)) s from scored group by lvl) z)
    into v_responses, v_kraw, v_kl1, v_sraw, v_danger, v_levels
    from scored;

    v_kov := round(coalesce(v_kraw, 0));
    v_blended := round(coalesce(v_kraw,0) * 0.6 + coalesce(v_sraw,0) * 0.4);

    -- Belt seed (clean belt word; report recomputes the full outcome from responses).
    v_belt := case
      when v_danger then 'White'
      when v_blended >= 90 and v_kov >= 92 then 'Black'
      when v_blended >= 87 and v_kov >= 91 then 'Brown'
      when v_blended >= 85 and v_kov >= 89 then 'Blue'
      when v_blended >= 81 and v_kov >= 86 then 'Green'
      when v_blended >= 78 and v_kov >= 83 then 'Yellow'
      else 'White' end;

    select trim(coalesce(st.first,'') || ' ' || coalesce(st.last,'')), coalesce(st.role,'')
      into v_name, v_title
      from staff st where st.id = v_sess.staff_id;

    -- Insert (dedupe re-checked at insert time).
    insert into placement_reviews
      (staff_id, fid, status, tentative_belt, responses, level_scores, submitted_at, staff_name, staff_title, session_id, created_at)
    select v_sess.staff_id, st.fid, 'pending', v_belt, v_responses, v_levels, now(),
           coalesce(nullif(v_name,''),'Unknown'), v_title, v_sess.id, now()
    from staff st
    where st.id = v_sess.staff_id
      and not exists (select 1 from placement_reviews pr where pr.staff_id = v_sess.staff_id);
    get diagnostics v_ins = row_count;

    if v_ins > 0 then
      update staff set placement_needed = false where id = v_sess.staff_id;
      update sbd_assessment_sessions set status = 'completed', completed_at = now() where id = v_sess.id;
      insert into sbd_placement_recovery_log (session_id, staff_id, staff_name, tentative_belt, n_knowledge, n_sim, detail)
      values (v_sess.id, v_sess.staff_id, coalesce(nullif(v_name,''),'Unknown'), v_belt,
        (select count(*) from jsonb_array_elements(v_sess.progress->'shuffledQuestions') q where (q->>'type')='knowledge'),
        (select count(*) from jsonb_array_elements(v_sess.progress->'shuffledQuestions') q where (q->>'type')='simulation'),
        jsonb_build_object('source','sbd_recover_placements'));

      -- Notify admins exactly like a normal completion (best-effort; never breaks recovery).
      begin
        perform http((
          'POST', 'https://mhijaqahbceuahfzezbh.supabase.co/functions/v1/sbd-emails',
          array[http_header('apikey', c_anon), http_header('Authorization', 'Bearer ' || c_anon)],
          'application/json',
          json_build_object('type','placement_completed','data', json_build_object(
            'staff_name', coalesce(nullif(v_name,''),'Unknown'),
            'belt', v_belt,
            'result', 'System recommendation: ' || v_belt || ' Belt; pending master admin review (auto-recovered)',
            'timestamp', to_char(now() at time zone 'utc','YYYY-MM-DD"T"HH24:MI:SS"Z"')
          ))::text
        )::http_request);
      exception when others then null;
      end;

      v_recovered := v_recovered || jsonb_build_object('session_id', v_sess.id, 'staff_name', coalesce(nullif(v_name,''),'Unknown'), 'tentative_belt', v_belt);
    end if;
  end loop;

  return jsonb_build_object('ok', true, 'scanned', v_scanned, 'recovered_count', jsonb_array_length(v_recovered), 'recovered', v_recovered, 'skipped', v_skipped);
end;
$function$;
