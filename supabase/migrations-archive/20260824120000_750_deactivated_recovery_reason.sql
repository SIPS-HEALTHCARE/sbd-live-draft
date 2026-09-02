-- 20260824120000_750_deactivated_recovery_reason.sql
-- #750 (19 Aug update): a sitting can end a THIRD way — the account is deactivated mid-session
-- (Nikkia Warfield: banned 21:47:27 on 14 Aug, 53 minutes still on her clock). The recovery
-- reason now knows it: 'deactivated' — detected exactly the way the ticket checks it
-- (auth.users.banned_until set, and the ban's updated_at falling inside the session window) —
-- and it wins over timer/abandoned, because last-save timing says nothing about a candidate
-- who was locked out. Whether a deactivated sitting should be scored AT ALL is still with the
-- client; per Sriman's 22 Aug note this migration only detects and labels. Everything else in
-- the function is byte-identical to 20260819130000.

comment on column public.placement_reviews.recovery is
  'Present only on reviews built by sbd_recover_placements: {source, reason: timer|abandoned|deactivated|unknown, last_saved_at, expires_at, minutes_left, suggestion}. NULL on candidate-submitted reviews.';

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
  v_kraw numeric; v_kl1 numeric; v_sraw numeric; v_blended numeric; v_danger boolean;
  v_last_saved timestamptz;
  v_minutes_left numeric;
  v_deactivated boolean;
  v_reason text;
  v_blank_fb text;
  v_suggestion text;
  v_belt text;
  v_name text; v_title text;
  v_ins int;
  v_recovered jsonb := '[]'::jsonb;
  v_skipped jsonb := '[]'::jsonb;
  v_scanned int := 0;
begin
  perform http_set_curlopt('CURLOPT_TIMEOUT_MS','25000');

  for v_sess in
    select s.id, s.staff_id, s.progress, s.authorized_at, s.expires_at
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

    -- Why is this row being built? lastSavedAt is stamped by the save-progress endpoint
    -- (sbd-assessor-pin). Within 3 minutes of expiry = the timer took the sitting; earlier =
    -- the candidate stopped and never came back. The 3-minute line is the same measure T112
    -- used to separate the seven genuine cut-offs from the two abandonments. Never guess:
    -- no lastSavedAt reads 'unknown', not 'timer'.
    -- EXCEPT: an account deactivated inside the session window (#750, 19 Aug update) ended
    -- the sitting no matter what the clock said — 'deactivated' overrides both. Detection is
    -- the ticket's own check: banned_until set, ban stamped between authorized_at and
    -- expires_at. If a later profile write moves updated_at past the window we fall back to
    -- timer/abandoned — a weaker label, never a wrong score.
    begin
      v_last_saved := nullif(v_sess.progress->>'lastSavedAt','')::timestamptz;
    exception when others then
      v_last_saved := null;
    end;
    v_minutes_left := extract(epoch from (v_sess.expires_at - v_last_saved)) / 60.0;
    select exists (
      select 1 from auth.users u
      where u.id = v_sess.staff_id
        and u.banned_until is not null
        and u.updated_at between v_sess.authorized_at and v_sess.expires_at
    ) into v_deactivated;
    v_reason := case
      when v_deactivated then 'deactivated'
      when v_last_saved is null then 'unknown'
      when v_minutes_left <= 3 then 'timer'
      else 'abandoned' end;
    v_blank_fb := case v_reason
      when 'timer'       then 'No answer submitted (time expired).'
      when 'abandoned'   then 'No answer submitted (assessment left unfinished).'
      when 'deactivated' then 'No answer submitted (account deactivated during the assessment).'
      else                    'No answer submitted.' end;

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
          jsonb_build_object('score', 0, 'feedback', v_blank_fb));
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
    -- A blank is recorded identically for BOTH types: answer 'No answer', correct false, score 0.
    -- isDangerous mirrors the client (answer is on the question's dangerousAnswers list); the
    -- suggestion consumes it as isDangerous AND NOT correct, same as sbdSuggestBelt's callers.
    with built as (
      select e.ord, (q->>'type') typ, (q->>'level')::int lvl, q->>'id' qid, q,
             v_sess.progress->'answers'->>(q->>'id') ans
      from jsonb_array_elements(v_sess.progress->'shuffledQuestions') with ordinality e(q, ord)
    ),
    scored as (
      select ord, typ, lvl,
        case when typ='knowledge' then (case when coalesce(ans = q->>'correct', false) then 100 else 0 end)
             else (v_sim->qid->>'score')::int end sc,
        case when typ='knowledge'
             then coalesce(case when ans ~ '^[0-9]+$' then (q->'dangerousAnswers') @> to_jsonb(ans::int) end, false)
                  and not coalesce(ans = q->>'correct', false)
             else false end dng,
        case when typ='knowledge' then jsonb_build_object(
            'qId', qid, 'type', 'knowledge', 'level', lvl, 'question', q->>'q',
            'answer', coalesce(case when ans ~ '^[0-9]+$' then (q->'options')->>(ans::int) end, 'No answer'),
            'correctAnswer', (q->'options')->>((q->>'correct')::int),
            'correct', coalesce(ans = q->>'correct', false),
            'score', case when coalesce(ans = q->>'correct', false) then 100 else 0 end,
            'isDangerous', coalesce(case when ans ~ '^[0-9]+$' then (q->'dangerousAnswers') @> to_jsonb(ans::int) end, false))
          else jsonb_build_object(
            'qId', qid, 'type', 'simulation', 'level', lvl, 'question', q->>'q',
            'answer', case when length(trim(coalesce(ans,''))) = 0 then 'No answer' else ans end,
            'aiScore', (v_sim->qid->>'score')::int,
            'aiFeedback', v_sim->qid->>'feedback')
            || case when length(trim(coalesce(ans,''))) = 0 then jsonb_build_object('correct', false) else '{}'::jsonb end
          end robj
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

    -- Suggestion engine, verbatim from sbdSuggestBelt() (ui-views.js) at FULL precision —
    -- spec §7.6 says rounding happens only at display, never before a threshold comparison.
    -- Thresholds MUST MATCH BELT_TEST_CONFIG (belt-test-engine.js, spec §9) — see 20260819130000.
    v_kraw := coalesce(v_kraw, 0);
    v_kl1 := coalesce(v_kl1, 0);
    v_sraw := coalesce(v_sraw, 0);
    v_blended := v_kraw * 0.6 + v_sraw * 0.4;
    v_suggestion := case
      when v_blended >= 90 and v_kraw >= 92 then case when v_sraw >= 87 then 'Black Belt'  else 'Black Belt Conditional'  end
      when v_blended >= 87 and v_kraw >= 91 then case when v_sraw >= 84 then 'Brown Belt'  else 'Brown Belt Conditional'  end
      when v_blended >= 85 and v_kraw >= 89 then case when v_sraw >= 82 then 'Blue Belt'   else 'Blue Belt Conditional'   end
      when v_blended >= 81 and v_kraw >= 86 then case when v_sraw >= 78 then 'Green Belt'  else 'Green Belt Conditional'  end
      when v_blended >= 78 and v_kraw >= 83 then case when v_sraw >= 75 then 'Yellow Belt' else 'Yellow Belt Conditional' end
      when v_blended >= 75 and v_kraw >= 80 then case when v_sraw >= 72 then 'White Belt'  else 'White Belt Conditional'  end
      -- Knowledge Foundation (spec §8.6): not a belt; a dangerous answer defers it (§14.6).
      when v_kraw >= 80 and v_kl1 >= 80 then case when coalesce(v_danger,false) then 'Knowledge Foundation Deferred' else 'Knowledge Foundation' end
      else 'No Belt' end;
    -- Belt WORD or NULL, exactly like the client's _beltWord: a placeholder must never be
    -- printed as a decision, so 'No Belt' / 'Knowledge Foundation' store NULL here.
    v_belt := substring(v_suggestion from 'White|Yellow|Green|Blue|Brown|Black');

    select trim(coalesce(st.first,'') || ' ' || coalesce(st.last,'')), coalesce(st.role,'')
      into v_name, v_title
      from staff st where st.id = v_sess.staff_id;

    -- Insert (dedupe re-checked at insert time).
    insert into placement_reviews
      (staff_id, fid, status, tentative_belt, responses, level_scores, submitted_at, staff_name, staff_title, session_id, created_at, recovery)
    select v_sess.staff_id, st.fid, 'pending', v_belt, v_responses, v_levels, now(),
           coalesce(nullif(v_name,''),'Unknown'), v_title, v_sess.id, now(),
           jsonb_build_object(
             'source', 'sbd_recover_placements',
             'reason', v_reason,
             'last_saved_at', v_last_saved,
             'expires_at', v_sess.expires_at,
             'minutes_left', case when v_minutes_left is null then null else round(v_minutes_left) end,
             'suggestion', v_suggestion)
    from staff st
    where st.id = v_sess.staff_id
      and not exists (select 1 from placement_reviews pr where pr.staff_id = v_sess.staff_id);
    get diagnostics v_ins = row_count;

    if v_ins > 0 then
      update staff set placement_needed = false where id = v_sess.staff_id;
      update sbd_assessment_sessions set status = 'completed', completed_at = now() where id = v_sess.id;
      insert into sbd_placement_recovery_log (session_id, staff_id, staff_name, tentative_belt, n_knowledge, n_sim, detail)
      values (v_sess.id, v_sess.staff_id, coalesce(nullif(v_name,''),'Unknown'), v_suggestion,
        (select count(*) from jsonb_array_elements(v_sess.progress->'shuffledQuestions') q where (q->>'type')='knowledge'),
        (select count(*) from jsonb_array_elements(v_sess.progress->'shuffledQuestions') q where (q->>'type')='simulation'),
        jsonb_build_object('source','sbd_recover_placements','reason',v_reason,'minutes_left',
          case when v_minutes_left is null then null else round(v_minutes_left) end));

      -- Notify admins exactly like a normal completion (best-effort; never breaks recovery).
      begin
        perform http((
          'POST', 'https://mhijaqahbceuahfzezbh.supabase.co/functions/v1/sbd-emails',
          array[http_header('apikey', c_anon), http_header('Authorization', 'Bearer ' || c_anon)],
          'application/json',
          json_build_object('type','placement_completed','data', json_build_object(
            'staff_name', coalesce(nullif(v_name,''),'Unknown'),
            'belt', coalesce(v_belt, ''),
            'result', 'System recommendation: ' || v_suggestion || '; pending master admin review (auto-recovered: ' || v_reason || ')',
            'timestamp', to_char(now() at time zone 'utc','YYYY-MM-DD"T"HH24:MI:SS"Z"')
          ))::text
        )::http_request);
      exception when others then null;
      end;

      v_recovered := v_recovered || jsonb_build_object('session_id', v_sess.id, 'staff_name', coalesce(nullif(v_name,''),'Unknown'), 'suggestion', v_suggestion, 'reason', v_reason);
    end if;
  end loop;

  return jsonb_build_object('ok', true, 'scanned', v_scanned, 'recovered_count', jsonb_array_length(v_recovered), 'recovered', v_recovered, 'skipped', v_skipped);
end;
$function$;
