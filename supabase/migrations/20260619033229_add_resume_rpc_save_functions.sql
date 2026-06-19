drop function if exists public.add_professional_resume_item(text, jsonb);

create or replace function public.add_professional_language(language_name_input text, proficiency_input text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare current_professional_id uuid; created_id uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select id into current_professional_id from public.professionals where user_id = auth.uid() limit 1;
  if current_professional_id is null then raise exception 'professional_not_found'; end if;
  insert into public.professional_languages (professional_id, language_name, proficiency)
  values (current_professional_id, nullif(language_name_input, ''), nullif(proficiency_input, ''))
  returning id into created_id;
  return created_id;
end;
$$;

create or replace function public.add_professional_education(level_input education_level, institution_input text, course_name_input text, completed_at_input date default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare current_professional_id uuid; created_id uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select id into current_professional_id from public.professionals where user_id = auth.uid() limit 1;
  if current_professional_id is null then raise exception 'professional_not_found'; end if;
  insert into public.professional_educations (professional_id, level, institution, course_name, completed_at)
  values (current_professional_id, nullif(level_input::text, '')::education_level, nullif(institution_input, ''), nullif(course_name_input, ''), completed_at_input)
  returning id into created_id;
  return created_id;
end;
$$;

create or replace function public.add_professional_course(name_input text, institution_input text default null, workload_hours_input integer default null, completed_at_input date default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare current_professional_id uuid; created_id uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select id into current_professional_id from public.professionals where user_id = auth.uid() limit 1;
  if current_professional_id is null then raise exception 'professional_not_found'; end if;
  insert into public.professional_courses (professional_id, name, institution, workload_hours, completed_at)
  values (current_professional_id, nullif(name_input, ''), nullif(institution_input, ''), workload_hours_input, completed_at_input)
  returning id into created_id;
  return created_id;
end;
$$;

create or replace function public.add_professional_skill(name_input text, skill_type_input text, proficiency_input integer default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare current_professional_id uuid; created_id uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select id into current_professional_id from public.professionals where user_id = auth.uid() limit 1;
  if current_professional_id is null then raise exception 'professional_not_found'; end if;
  insert into public.professional_skills (professional_id, name, skill_type, proficiency)
  values (current_professional_id, nullif(name_input, ''), nullif(skill_type_input, ''), proficiency_input)
  returning id into created_id;
  return created_id;
end;
$$;

create or replace function public.add_professional_experience(company_name_input text, role_title_input text, started_at_input date, ended_at_input date default null, is_current_input boolean default false, description_input text default '')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare current_professional_id uuid; created_id uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select id into current_professional_id from public.professionals where user_id = auth.uid() limit 1;
  if current_professional_id is null then raise exception 'professional_not_found'; end if;
  insert into public.professional_experiences (professional_id, company_name, role_title, started_at, ended_at, is_current, description)
  values (current_professional_id, nullif(company_name_input, ''), nullif(role_title_input, ''), started_at_input, ended_at_input, coalesce(is_current_input, false), nullif(description_input, ''))
  returning id into created_id;
  return created_id;
end;
$$;

revoke all on function public.add_professional_language(text, text) from public;
revoke all on function public.add_professional_language(text, text) from anon;
revoke all on function public.add_professional_education(education_level, text, text, date) from public;
revoke all on function public.add_professional_course(text, text, integer, date) from public;
revoke all on function public.add_professional_skill(text, text, integer) from public;
revoke all on function public.add_professional_experience(text, text, date, date, boolean, text) from public;
revoke all on function public.add_professional_education(education_level, text, text, date) from anon;
revoke all on function public.add_professional_course(text, text, integer, date) from anon;
revoke all on function public.add_professional_skill(text, text, integer) from anon;
revoke all on function public.add_professional_experience(text, text, date, date, boolean, text) from anon;

grant execute on function public.add_professional_language(text, text) to authenticated;
grant execute on function public.add_professional_education(education_level, text, text, date) to authenticated;
grant execute on function public.add_professional_course(text, text, integer, date) to authenticated;
grant execute on function public.add_professional_skill(text, text, integer) to authenticated;
grant execute on function public.add_professional_experience(text, text, date, date, boolean, text) to authenticated;

create or replace function public.update_professional_resume_profile(desired_role_input text, summary_input text, education_level_input education_level, available_in_days_input integer)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare current_professional_id uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  update public.professionals
     set desired_role = nullif(desired_role_input, ''),
         summary = coalesce(summary_input, ''),
         education_level = education_level_input,
         available_in_days = greatest(coalesce(available_in_days_input, 0), 0)
   where user_id = auth.uid()
   returning id into current_professional_id;
  if current_professional_id is null then raise exception 'professional_not_found'; end if;
  return current_professional_id;
end;
$$;

revoke all on function public.update_professional_resume_profile(text, text, education_level, integer) from public;
revoke all on function public.update_professional_resume_profile(text, text, education_level, integer) from anon;
grant execute on function public.update_professional_resume_profile(text, text, education_level, integer) to authenticated;
