-- Courses / internal training module for Portal Encaixe.
-- Admin manages courses and quizzes. Professionals can read published content
-- and submit at most two attempts. Companies cannot access quiz/course internals.

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) >= 3),
  description text not null check (char_length(trim(description)) >= 10),
  category text not null check (char_length(trim(category)) >= 2),
  workload_hours integer not null default 1 check (workload_hours > 0),
  skill_tags text[] not null default '{}',
  video_url text not null check (char_length(trim(video_url)) >= 8),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  archived_at timestamptz
);

create table if not exists public.course_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  prompt text not null check (char_length(trim(prompt)) >= 5),
  position integer not null default 1 check (position > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.course_quiz_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.course_quiz_questions(id) on delete cascade,
  option_text text not null check (char_length(trim(option_text)) >= 1),
  is_correct boolean not null default false,
  position integer not null default 1 check (position > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.course_attempts (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete restrict,
  professional_id uuid not null references public.professionals(id) on delete cascade,
  attempt_number integer not null check (attempt_number in (1, 2)),
  watched_video boolean not null default false,
  final_score numeric(5,2) not null default 0 check (final_score >= 0 and final_score <= 100),
  approved boolean not null default false,
  completed_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  unique (course_id, professional_id, attempt_number)
);

create table if not exists public.course_attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.course_attempts(id) on delete cascade,
  question_id uuid not null references public.course_quiz_questions(id) on delete restrict,
  selected_option_id uuid references public.course_quiz_options(id) on delete set null,
  correct_option_id uuid references public.course_quiz_options(id) on delete set null,
  is_correct boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  unique (attempt_id, question_id)
);

create table if not exists public.professional_certifications (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete restrict,
  professional_id uuid not null references public.professionals(id) on delete cascade,
  attempt_id uuid references public.course_attempts(id) on delete set null,
  approved_at timestamptz not null default timezone('utc', now()),
  score numeric(5,2) not null check (score >= 0 and score <= 100),
  created_at timestamptz not null default timezone('utc', now()),
  unique (course_id, professional_id)
);

alter table public.compatibility_scores
  add column if not exists certification_bonus_score numeric(5,2) not null default 0;

create index if not exists courses_status_idx on public.courses (status, updated_at desc);
create index if not exists course_questions_course_idx on public.course_quiz_questions (course_id, position);
create index if not exists course_options_question_idx on public.course_quiz_options (question_id, position);
create index if not exists course_attempts_professional_idx on public.course_attempts (professional_id, course_id, attempt_number);
create index if not exists course_attempt_answers_attempt_idx on public.course_attempt_answers (attempt_id);
create index if not exists professional_certifications_professional_idx on public.professional_certifications (professional_id, approved_at desc);
create unique index if not exists course_questions_unique_position_idx
  on public.course_quiz_questions (course_id, position);
create unique index if not exists course_options_unique_position_idx
  on public.course_quiz_options (question_id, position);
create unique index if not exists course_options_one_correct_idx
  on public.course_quiz_options (question_id)
  where is_correct is true;

alter table public.courses enable row level security;
alter table public.course_quiz_questions enable row level security;
alter table public.course_quiz_options enable row level security;
alter table public.course_attempts enable row level security;
alter table public.course_attempt_answers enable row level security;
alter table public.professional_certifications enable row level security;

-- Data API privileges are explicit because new Supabase projects no longer
-- expose tables automatically. RLS below remains the row-level authority.
revoke all on table public.courses from anon;
revoke all on table public.course_quiz_questions from anon;
revoke all on table public.course_quiz_options from anon;
revoke all on table public.course_attempts from anon;
revoke all on table public.course_attempt_answers from anon;
revoke all on table public.professional_certifications from anon;
revoke all on table public.courses from authenticated;
revoke all on table public.course_quiz_questions from authenticated;
revoke all on table public.course_quiz_options from authenticated;
revoke all on table public.course_attempts from authenticated;
revoke all on table public.course_attempt_answers from authenticated;
revoke all on table public.professional_certifications from authenticated;

grant select, insert, update, delete on table public.courses to authenticated;
grant select, insert, update, delete on table public.course_quiz_questions to authenticated;
grant select, insert, update, delete on table public.course_quiz_options to authenticated;
grant select on table public.course_attempts to authenticated;
grant select on table public.course_attempt_answers to authenticated;
grant select on table public.professional_certifications to authenticated;

grant select, insert, update, delete on table public.courses to service_role;
grant select, insert, update, delete on table public.course_quiz_questions to service_role;
grant select, insert, update, delete on table public.course_quiz_options to service_role;
grant select, insert, update, delete on table public.course_attempts to service_role;
grant select, insert, update, delete on table public.course_attempt_answers to service_role;
grant select, insert, update, delete on table public.professional_certifications to service_role;

create or replace function public.course_passing_score()
returns numeric
language sql
stable
set search_path = ''
as $$
  select 70::numeric;
$$;

create or replace function public.course_certification_bonus_per_match()
returns numeric
language sql
stable
set search_path = ''
as $$
  select 20::numeric;
$$;

create or replace function public.course_certification_bonus_cap()
returns numeric
language sql
stable
set search_path = ''
as $$
  select 30::numeric;
$$;

create or replace function public.user_owns_professional(target_professional_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.professionals p
    where p.id = target_professional_id
      and p.user_id = auth.uid()
      and p.deleted_at is null
  );
$$;

create or replace function public.is_professional_user()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'professional'
  );
$$;

create or replace function public.is_published_course(target_course_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.courses c
    where c.id = target_course_id
      and c.status = 'published'
  );
$$;

revoke all on function public.course_passing_score() from public, anon;
revoke all on function public.course_certification_bonus_per_match() from public, anon;
revoke all on function public.course_certification_bonus_cap() from public, anon;
revoke all on function public.user_owns_professional(uuid) from public, anon;
revoke all on function public.is_professional_user() from public, anon;
revoke all on function public.is_published_course(uuid) from public, anon;
grant execute on function public.course_passing_score() to authenticated;
grant execute on function public.course_certification_bonus_per_match() to authenticated;
grant execute on function public.course_certification_bonus_cap() to authenticated;
grant execute on function public.user_owns_professional(uuid) to authenticated;
grant execute on function public.is_professional_user() to authenticated;
grant execute on function public.is_published_course(uuid) to authenticated;

drop policy if exists "courses admin manage" on public.courses;
drop policy if exists "courses professional published read" on public.courses;
drop policy if exists "courses authorized read" on public.courses;
drop policy if exists "courses admin insert" on public.courses;
drop policy if exists "courses admin update" on public.courses;
drop policy if exists "courses admin delete" on public.courses;
create policy "courses authorized read" on public.courses
for select to authenticated
using (
  public.is_admin()
  or (status = 'published' and public.is_professional_user())
);
create policy "courses admin insert" on public.courses
for insert to authenticated with check (public.is_admin());
create policy "courses admin update" on public.courses
for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "courses admin delete" on public.courses
for delete to authenticated using (public.is_admin());

drop policy if exists "course questions admin manage" on public.course_quiz_questions;
drop policy if exists "course questions professional published read" on public.course_quiz_questions;
drop policy if exists "course questions authorized read" on public.course_quiz_questions;
drop policy if exists "course questions admin insert" on public.course_quiz_questions;
drop policy if exists "course questions admin update" on public.course_quiz_questions;
drop policy if exists "course questions admin delete" on public.course_quiz_questions;
create policy "course questions authorized read" on public.course_quiz_questions
for select to authenticated
using (
  public.is_admin()
  or (public.is_professional_user() and public.is_published_course(course_id))
);
create policy "course questions admin insert" on public.course_quiz_questions
for insert to authenticated with check (public.is_admin());
create policy "course questions admin update" on public.course_quiz_questions
for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "course questions admin delete" on public.course_quiz_questions
for delete to authenticated using (public.is_admin());

drop policy if exists "course options admin manage" on public.course_quiz_options;
drop policy if exists "course options professional published read" on public.course_quiz_options;
create policy "course options admin manage" on public.course_quiz_options
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "course attempts admin read" on public.course_attempts;
drop policy if exists "course attempts professional own read" on public.course_attempts;
drop policy if exists "course attempts professional own insert" on public.course_attempts;
drop policy if exists "course attempts authorized read" on public.course_attempts;
create policy "course attempts authorized read" on public.course_attempts
for select to authenticated
using (
  public.is_admin()
  or public.user_owns_professional(professional_id)
);

drop policy if exists "course answers admin read" on public.course_attempt_answers;
drop policy if exists "course answers professional own read" on public.course_attempt_answers;
drop policy if exists "course answers professional own insert" on public.course_attempt_answers;
drop policy if exists "course answers authorized read" on public.course_attempt_answers;
create policy "course answers authorized read" on public.course_attempt_answers
for select to authenticated
using (
  public.is_admin()
  or exists (
      select 1
      from public.course_attempts ca
      where ca.id = attempt_id
        and public.user_owns_professional(ca.professional_id)
    )
);

drop policy if exists "certifications admin read" on public.professional_certifications;
drop policy if exists "certifications professional own read" on public.professional_certifications;
drop policy if exists "certifications company presented read" on public.professional_certifications;
drop policy if exists "certifications authorized read" on public.professional_certifications;
create policy "certifications authorized read" on public.professional_certifications
for select to authenticated
using (
  public.is_admin()
  or public.user_owns_professional(professional_id)
  or public.company_can_read_professional(professional_id)
);

create or replace function public.validate_course_attempt_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_attempts integer;
  expected_attempt integer;
begin
  if new.watched_video is not true then
    raise exception 'video_required_before_quiz';
  end if;

  select count(*), coalesce(max(attempt_number), 0) + 1
  into existing_attempts, expected_attempt
  from public.course_attempts
  where course_id = new.course_id
    and professional_id = new.professional_id;

  if existing_attempts >= 2 then
    raise exception 'maximum_course_attempts_reached';
  end if;

  if new.attempt_number <> expected_attempt then
    raise exception 'invalid_attempt_number';
  end if;

  return new;
end;
$$;

revoke all on function public.validate_course_attempt_limit() from public, anon, authenticated;

drop trigger if exists validate_course_attempt_limit_trigger on public.course_attempts;
create trigger validate_course_attempt_limit_trigger
before insert on public.course_attempts
for each row execute function public.validate_course_attempt_limit();

create or replace function public.create_professional_certification_from_attempt()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.approved is true then
    insert into public.professional_certifications (course_id, professional_id, attempt_id, score, approved_at)
    values (new.course_id, new.professional_id, new.id, new.final_score, coalesce(new.completed_at, timezone('utc', now())))
    on conflict (course_id, professional_id)
    do update set
      attempt_id = excluded.attempt_id,
      score = greatest(public.professional_certifications.score, excluded.score),
      approved_at = least(public.professional_certifications.approved_at, excluded.approved_at);
  end if;

  return new;
end;
$$;

revoke all on function public.create_professional_certification_from_attempt() from public, anon, authenticated;

drop trigger if exists create_professional_certification_from_attempt_trigger on public.course_attempts;
create trigger create_professional_certification_from_attempt_trigger
after insert on public.course_attempts
for each row execute function public.create_professional_certification_from_attempt();

create or replace function public.get_published_course_quiz(target_course_id uuid)
returns table (
  question_id uuid,
  question_prompt text,
  question_position integer,
  option_id uuid,
  option_text text,
  option_position integer
)
language sql
security definer
set search_path = public
stable
as $$
  select
    q.id as question_id,
    q.prompt as question_prompt,
    q.position as question_position,
    o.id as option_id,
    o.option_text,
    o.position as option_position
  from public.course_quiz_questions q
  join public.course_quiz_options o on o.question_id = q.id
  where q.course_id = target_course_id
    and public.is_professional_user()
    and public.is_published_course(target_course_id)
  order by q.position, o.position;
$$;

create or replace function public.submit_course_attempt(target_course_id uuid, selected_answers jsonb)
returns table (
  attempt_id uuid,
  attempt_number integer,
  final_score numeric,
  approved boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_professional_id uuid;
  existing_attempts integer;
  next_attempt integer;
  total_questions integer;
  correct_answers integer;
  new_attempt_id uuid;
  computed_score numeric;
  approved_result boolean;
  selected_count integer;
  valid_selected_count integer;
  answer_kind text;
begin
  if not public.is_professional_user() then
    raise exception 'professional_role_required';
  end if;

  if not public.is_published_course(target_course_id) then
    raise exception 'course_not_available';
  end if;

  select p.id
  into target_professional_id
  from public.professionals p
  where p.user_id = auth.uid()
    and p.deleted_at is null
  limit 1;

  if target_professional_id is null then
    raise exception 'professional_profile_required';
  end if;

  select count(*), coalesce(max(attempt_number), 0) + 1
  into existing_attempts, next_attempt
  from public.course_attempts
  where course_id = target_course_id
    and professional_id = target_professional_id;

  if exists (
    select 1
    from public.course_attempts
    where course_id = target_course_id
      and professional_id = target_professional_id
      and approved is true
  ) then
    raise exception 'course_already_approved';
  end if;

  if existing_attempts >= 2 then
    raise exception 'maximum_course_attempts_reached';
  end if;

  select count(*)
  into total_questions
  from public.course_quiz_questions
  where course_id = target_course_id;

  if total_questions <= 0 then
    raise exception 'course_quiz_unavailable';
  end if;

  select jsonb_typeof(selected_answers) into answer_kind;
  if answer_kind is distinct from 'array' then
    raise exception 'invalid_course_answers';
  end if;

  select count(*), count(distinct item->>'questionId')
  into selected_count, valid_selected_count
  from jsonb_array_elements(selected_answers) item;

  if selected_count <> total_questions or valid_selected_count <> total_questions then
    raise exception 'all_course_questions_required';
  end if;

  select count(*)
  into valid_selected_count
  from jsonb_array_elements(selected_answers) item
  join public.course_quiz_questions q
    on q.id = (item->>'questionId')::uuid
   and q.course_id = target_course_id
  join public.course_quiz_options o
    on o.id = nullif(item->>'optionId', '')::uuid
   and o.question_id = q.id;

  if valid_selected_count <> total_questions then
    raise exception 'invalid_course_answers';
  end if;

  if (
    select count(*)
    from public.course_quiz_questions q
    where q.course_id = target_course_id
      and (
        select count(*)
        from public.course_quiz_options o
        where o.question_id = q.id
          and o.is_correct is true
      ) <> 1
  ) > 0 then
    raise exception 'course_quiz_invalid';
  end if;

  with expected as (
    select q.id as question_id, o.id as correct_option_id
    from public.course_quiz_questions q
    join public.course_quiz_options o on o.question_id = q.id and o.is_correct is true
    where q.course_id = target_course_id
  ),
  selected as (
    select
      (item->>'questionId')::uuid as question_id,
      nullif(item->>'optionId', '')::uuid as selected_option_id
    from jsonb_array_elements(selected_answers) item
  )
  select count(*) filter (where selected.selected_option_id = expected.correct_option_id)
  into correct_answers
  from expected
  left join selected on selected.question_id = expected.question_id;

  computed_score := round((coalesce(correct_answers, 0)::numeric / total_questions::numeric) * 100, 2);
  approved_result := computed_score >= public.course_passing_score();

  insert into public.course_attempts (
    course_id,
    professional_id,
    attempt_number,
    watched_video,
    final_score,
    approved
  )
  values (
    target_course_id,
    target_professional_id,
    next_attempt,
    true,
    computed_score,
    approved_result
  )
  returning id into new_attempt_id;

  insert into public.course_attempt_answers (
    attempt_id,
    question_id,
    selected_option_id,
    correct_option_id,
    is_correct
  )
  select
    new_attempt_id,
    expected.question_id,
    selected.selected_option_id,
    expected.correct_option_id,
    selected.selected_option_id = expected.correct_option_id
  from (
    select q.id as question_id, o.id as correct_option_id
    from public.course_quiz_questions q
    join public.course_quiz_options o on o.question_id = q.id and o.is_correct is true
    where q.course_id = target_course_id
  ) expected
  left join (
    select
      (item->>'questionId')::uuid as question_id,
      nullif(item->>'optionId', '')::uuid as selected_option_id
    from jsonb_array_elements(selected_answers) item
  ) selected on selected.question_id = expected.question_id;

  return query select new_attempt_id, next_attempt, computed_score, approved_result;
end;
$$;

revoke all on function public.get_published_course_quiz(uuid) from public, anon;
revoke all on function public.submit_course_attempt(uuid, jsonb) from public, anon;
grant execute on function public.get_published_course_quiz(uuid) to authenticated;
grant execute on function public.submit_course_attempt(uuid, jsonb) to authenticated;

create or replace function public.recalculate_scores_after_professional_certification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  demand_record record;
begin
  for demand_record in
    select id from public.demands where status in ('active', 'screening') and deleted_at is null
  loop
    perform public.recalculate_compatibility_for_demand(demand_record.id);
  end loop;

  return coalesce(new, old);
end;
$$;

revoke all on function public.recalculate_scores_after_professional_certification() from public, anon, authenticated;

drop trigger if exists recalculate_scores_after_professional_certification_trigger on public.professional_certifications;
create trigger recalculate_scores_after_professional_certification_trigger
after insert or update or delete on public.professional_certifications
for each row execute function public.recalculate_scores_after_professional_certification();

create or replace function public.recalculate_compatibility_for_demand(target_demand_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  demand_record public.demands%rowtype;
  professional_record public.professionals%rowtype;
  education_score numeric;
  experience_score numeric;
  courses_score numeric;
  technical_score numeric;
  location_score numeric;
  availability_score numeric;
  certification_bonus_score numeric;
  total_score numeric;
  experience_months integer;
begin
  select * into demand_record from public.demands where id = target_demand_id and deleted_at is null;
  if demand_record.id is null then
    return;
  end if;

  for professional_record in select * from public.professionals where status = 'approved' and deleted_at is null loop
    select coalesce(sum(public.months_between(started_at, ended_at)), 0)
    into experience_months
    from public.professional_experiences
    where professional_id = professional_record.id;

    education_score := case
      when professional_record.education_level = demand_record.education_minimum then 60
      when array_position(enum_range(null::education_level), professional_record.education_level) > array_position(enum_range(null::education_level), demand_record.education_minimum) then 100
      else 0
    end;

    experience_score := case
      when demand_record.minimum_experience_months = 0 then 100
      else least(100, (experience_months::numeric / demand_record.minimum_experience_months::numeric) * 100)
    end;

    select case when array_length(demand_record.required_courses || demand_record.required_certifications, 1) is null then 100 else
      (
        count(*) filter (
          where lower(requirement) in (
            select lower(name) from public.professional_courses where professional_id = professional_record.id
            union
            select lower(name) from public.professional_certificates where professional_id = professional_record.id
            union
            select lower(c.title) from public.professional_certifications pc join public.courses c on c.id = pc.course_id where pc.professional_id = professional_record.id
          )
        )::numeric / array_length(demand_record.required_courses || demand_record.required_certifications, 1)::numeric
      ) * 100 end
    into courses_score
    from unnest(demand_record.required_courses || demand_record.required_certifications) as requirement;

    select case when array_length(demand_record.technical_skills, 1) is null then 100 else
      (
        count(*) filter (
          where lower(skill) in (
            select lower(name) from public.professional_skills
            where professional_id = professional_record.id and skill_type = 'technical'
          )
        )::numeric / array_length(demand_record.technical_skills, 1)::numeric
      ) * 100 end
    into technical_score
    from unnest(demand_record.technical_skills) as skill;

    select least(
      public.course_certification_bonus_cap(),
      count(distinct pc.course_id)::numeric * public.course_certification_bonus_per_match()
    )
    into certification_bonus_score
    from public.professional_certifications pc
    join public.courses c on c.id = pc.course_id
    where pc.professional_id = professional_record.id
      and exists (
        select 1
        from unnest(c.skill_tags) course_tag
        where lower(course_tag) in (
          select lower(demand_tag)
          from unnest(demand_record.technical_skills || demand_record.required_courses || demand_record.required_certifications) demand_tag
        )
      );

    location_score := case
      when lower(demand_record.city) = lower(professional_record.city) then 100
      when lower(demand_record.state) = lower(professional_record.state) then 60
      when demand_record.modality = 'remoto' then 80
      else 0
    end;

    availability_score := case
      when professional_record.available_in_days = 0 then 100
      else greatest(0, 100 - ((professional_record.available_in_days::numeric / 60) * 100))
    end;

    total_score := least(
      100,
      round((education_score * 0.20) + (experience_score * 0.25) + (courses_score * 0.20) + (technical_score * 0.20) + (location_score * 0.10) + (availability_score * 0.05), 2)
      + coalesce(certification_bonus_score, 0)
    );

    insert into public.compatibility_scores (
      demand_id, professional_id, education_score, experience_score, courses_score, technical_score, location_score, availability_score, certification_bonus_score, total_score, calculated_at
    )
    values (
      demand_record.id, professional_record.id, education_score, experience_score, courses_score, technical_score, location_score, availability_score, coalesce(certification_bonus_score, 0), total_score, timezone('utc', now())
    )
    on conflict (demand_id, professional_id)
    do update set
      education_score = excluded.education_score,
      experience_score = excluded.experience_score,
      courses_score = excluded.courses_score,
      technical_score = excluded.technical_score,
      location_score = excluded.location_score,
      availability_score = excluded.availability_score,
      certification_bonus_score = excluded.certification_bonus_score,
      total_score = excluded.total_score,
      calculated_at = excluded.calculated_at;
  end loop;
end;
$$;

revoke all on function public.recalculate_compatibility_for_demand(uuid) from public, anon, authenticated;
grant execute on function public.recalculate_compatibility_for_demand(uuid) to service_role;

create trigger courses_updated_at before update on public.courses for each row execute function public.set_updated_at();
create trigger course_quiz_questions_updated_at before update on public.course_quiz_questions for each row execute function public.set_updated_at();
create trigger course_quiz_options_updated_at before update on public.course_quiz_options for each row execute function public.set_updated_at();
