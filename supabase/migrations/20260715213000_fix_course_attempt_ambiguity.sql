create or replace function public.submit_course_attempt(target_course_id uuid, selected_answers jsonb)
returns table (attempt_id uuid, attempt_number integer, final_score numeric, approved boolean)
language plpgsql security definer set search_path = public
as $$
declare
  target_professional_id uuid; existing_attempts integer; next_attempt integer;
  total_questions integer; correct_answers integer; new_attempt_id uuid;
  computed_score numeric; approved_result boolean; selected_count integer;
  valid_selected_count integer; answer_kind text;
begin
  if not public.is_professional_user() then raise exception 'professional_role_required'; end if;
  if not public.is_published_course(target_course_id) then raise exception 'course_not_available'; end if;

  select p.id into target_professional_id from public.professionals p
  where p.user_id = auth.uid() and p.deleted_at is null limit 1;
  if target_professional_id is null then raise exception 'professional_profile_required'; end if;

  select count(*), coalesce(max(ca.attempt_number), 0) + 1
  into existing_attempts, next_attempt
  from public.course_attempts ca
  where ca.course_id = target_course_id and ca.professional_id = target_professional_id;

  if exists (select 1 from public.course_attempts ca
    where ca.course_id = target_course_id and ca.professional_id = target_professional_id and ca.approved is true)
  then raise exception 'course_already_approved'; end if;
  if existing_attempts >= 2 then raise exception 'maximum_course_attempts_reached'; end if;

  select count(*) into total_questions from public.course_quiz_questions q where q.course_id = target_course_id;
  if total_questions <= 0 then raise exception 'course_quiz_unavailable'; end if;
  select jsonb_typeof(selected_answers) into answer_kind;
  if answer_kind is distinct from 'array' then raise exception 'invalid_course_answers'; end if;

  select count(*), count(distinct item->>'questionId') into selected_count, valid_selected_count
  from jsonb_array_elements(selected_answers) item;
  if selected_count <> total_questions or valid_selected_count <> total_questions then raise exception 'all_course_questions_required'; end if;

  select count(*) into valid_selected_count
  from jsonb_array_elements(selected_answers) item
  join public.course_quiz_questions q on q.id = (item->>'questionId')::uuid and q.course_id = target_course_id
  join public.course_quiz_options o on o.id = nullif(item->>'optionId', '')::uuid and o.question_id = q.id;
  if valid_selected_count <> total_questions then raise exception 'invalid_course_answers'; end if;

  if (select count(*) from public.course_quiz_questions q where q.course_id = target_course_id
    and (select count(*) from public.course_quiz_options o where o.question_id = q.id and o.is_correct is true) <> 1) > 0
  then raise exception 'course_quiz_invalid'; end if;

  with expected as (
    select q.id as question_id, o.id as correct_option_id from public.course_quiz_questions q
    join public.course_quiz_options o on o.question_id = q.id and o.is_correct is true where q.course_id = target_course_id
  ), selected as (
    select (item->>'questionId')::uuid as question_id, nullif(item->>'optionId', '')::uuid as selected_option_id
    from jsonb_array_elements(selected_answers) item
  )
  select count(*) filter (where selected.selected_option_id = expected.correct_option_id)
  into correct_answers from expected left join selected on selected.question_id = expected.question_id;

  computed_score := round((coalesce(correct_answers, 0)::numeric / total_questions::numeric) * 100, 2);
  approved_result := computed_score >= public.course_passing_score();

  insert into public.course_attempts (course_id, professional_id, attempt_number, watched_video, final_score, approved)
  values (target_course_id, target_professional_id, next_attempt, true, computed_score, approved_result)
  returning id into new_attempt_id;

  insert into public.course_attempt_answers (attempt_id, question_id, selected_option_id, correct_option_id, is_correct)
  select new_attempt_id, expected.question_id, selected.selected_option_id, expected.correct_option_id,
    selected.selected_option_id = expected.correct_option_id
  from (
    select q.id as question_id, o.id as correct_option_id from public.course_quiz_questions q
    join public.course_quiz_options o on o.question_id = q.id and o.is_correct is true where q.course_id = target_course_id
  ) expected
  left join (
    select (item->>'questionId')::uuid as question_id, nullif(item->>'optionId', '')::uuid as selected_option_id
    from jsonb_array_elements(selected_answers) item
  ) selected on selected.question_id = expected.question_id;

  return query select new_attempt_id, next_attempt, computed_score, approved_result;
end;
$$;

revoke all on function public.submit_course_attempt(uuid, jsonb) from public, anon;
grant execute on function public.submit_course_attempt(uuid, jsonb) to authenticated;
