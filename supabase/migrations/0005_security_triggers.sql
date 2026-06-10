create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  );

  insert into public.user_roles (user_id, role)
  values (new.id, coalesce((new.raw_user_meta_data->>'role')::user_role, 'professional'));

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.log_process_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status then
    insert into public.process_history (process_id, changed_by, previous_status, new_status, note)
    values (new.id, auth.uid(), case when tg_op = 'INSERT' then null else old.status end, new.status, null);
  end if;
  return new;
end;
$$;

create trigger screening_process_history_insert
after insert on public.screening_processes
for each row execute function public.log_process_status();

create trigger screening_process_history_update
after update of status on public.screening_processes
for each row execute function public.log_process_status();

create or replace function public.invalidate_resume_cache()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.resume_versions
  set invalidated_at = timezone('utc', now())
  where resume_id in (
    select id from public.resumes where professional_id = coalesce(new.professional_id, old.professional_id, new.id, old.id)
  )
  and invalidated_at is null;
  return coalesce(new, old);
end;
$$;

create or replace function public.months_between(start_date date, end_date date)
returns integer
language sql
immutable
as $$
  select greatest(0, ((date_part('year', age(coalesce(end_date, current_date), start_date)) * 12) + date_part('month', age(coalesce(end_date, current_date), start_date)))::integer);
$$;

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

    total_score := round((education_score * 0.20) + (experience_score * 0.25) + (courses_score * 0.20) + (technical_score * 0.20) + (location_score * 0.10) + (availability_score * 0.05), 2);

    insert into public.compatibility_scores (
      demand_id, professional_id, education_score, experience_score, courses_score, technical_score, location_score, availability_score, total_score, calculated_at
    )
    values (
      demand_record.id, professional_record.id, education_score, experience_score, courses_score, technical_score, location_score, availability_score, total_score, timezone('utc', now())
    )
    on conflict (demand_id, professional_id)
    do update set
      education_score = excluded.education_score,
      experience_score = excluded.experience_score,
      courses_score = excluded.courses_score,
      technical_score = excluded.technical_score,
      location_score = excluded.location_score,
      availability_score = excluded.availability_score,
      total_score = excluded.total_score,
      calculated_at = excluded.calculated_at;
  end loop;
end;
$$;

create or replace function public.recalculate_scores_after_demand_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recalculate_compatibility_for_demand(new.id);
  return new;
end;
$$;

create trigger demands_recalculate_scores
after insert or update on public.demands
for each row execute function public.recalculate_scores_after_demand_change();

create or replace function public.recalculate_scores_after_professional_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  demand_id uuid;
begin
  for demand_id in select id from public.demands where status in ('active', 'screening') and deleted_at is null loop
    perform public.recalculate_compatibility_for_demand(demand_id);
  end loop;
  return coalesce(new, old);
end;
$$;

create trigger professionals_recalculate_scores
after insert or update on public.professionals
for each row execute function public.recalculate_scores_after_professional_change();

create trigger professional_courses_resume_invalidation
after insert or update or delete on public.professional_courses
for each row execute function public.invalidate_resume_cache();

create trigger professional_certificates_resume_invalidation
after insert or update or delete on public.professional_certificates
for each row execute function public.invalidate_resume_cache();

create trigger professional_experiences_resume_invalidation
after insert or update or delete on public.professional_experiences
for each row execute function public.invalidate_resume_cache();

create trigger professionals_resume_invalidation
after update on public.professionals
for each row execute function public.invalidate_resume_cache();

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger companies_updated_at before update on public.companies for each row execute function public.set_updated_at();
create trigger professionals_updated_at before update on public.professionals for each row execute function public.set_updated_at();
create trigger demands_updated_at before update on public.demands for each row execute function public.set_updated_at();
create trigger screening_processes_updated_at before update on public.screening_processes for each row execute function public.set_updated_at();
create trigger resumes_updated_at before update on public.resumes for each row execute function public.set_updated_at();
create trigger training_tracks_updated_at before update on public.training_tracks for each row execute function public.set_updated_at();
create trigger notification_templates_updated_at before update on public.notification_templates for each row execute function public.set_updated_at();
create trigger support_tickets_updated_at before update on public.support_tickets for each row execute function public.set_updated_at();
create trigger platform_reviews_updated_at before update on public.platform_reviews for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.user_sessions enable row level security;
alter table public.companies enable row level security;
alter table public.company_contacts enable row level security;
alter table public.company_documents enable row level security;
alter table public.professionals enable row level security;
alter table public.professional_experiences enable row level security;
alter table public.professional_educations enable row level security;
alter table public.professional_courses enable row level security;
alter table public.professional_certificates enable row level security;
alter table public.professional_skills enable row level security;
alter table public.professional_languages enable row level security;
alter table public.professional_documents enable row level security;
alter table public.demands enable row level security;
alter table public.compatibility_scores enable row level security;
alter table public.screening_processes enable row level security;
alter table public.process_history enable row level security;
alter table public.process_notes enable row level security;
alter table public.resumes enable row level security;
alter table public.resume_versions enable row level security;
alter table public.training_tracks enable row level security;
alter table public.training_courses enable row level security;
alter table public.training_modules enable row level security;
alter table public.training_lessons enable row level security;
alter table public.training_enrollments enable row level security;
alter table public.training_progress enable row level security;
alter table public.training_certificates enable row level security;
alter table public.training_partners enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_templates enable row level security;
alter table public.email_logs enable row level security;
alter table public.support_categories enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
alter table public.platform_reviews enable row level security;
alter table public.review_responses enable row level security;
alter table public.consent_records enable row level security;
alter table public.data_requests enable row level security;
alter table public.anonymization_logs enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles own or admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles own update" on public.profiles for update using (id = auth.uid() or public.is_admin());
create policy "roles own or admin" on public.user_roles for select using (user_id = auth.uid() or public.is_admin());
create policy "companies owner or admin" on public.companies for all using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());
create policy "company contacts owner or admin" on public.company_contacts for all using (exists (select 1 from public.companies c where c.id = company_id and (c.owner_id = auth.uid() or public.is_admin()))) with check (exists (select 1 from public.companies c where c.id = company_id and (c.owner_id = auth.uid() or public.is_admin())));
create policy "company documents owner or admin" on public.company_documents for all using (exists (select 1 from public.companies c where c.id = company_id and (c.owner_id = auth.uid() or public.is_admin()))) with check (exists (select 1 from public.companies c where c.id = company_id and (c.owner_id = auth.uid() or public.is_admin())));
create policy "professionals own admin or forwarded company" on public.professionals for select using (user_id = auth.uid() or public.is_admin() or exists (select 1 from public.screening_processes sp join public.demands d on d.id = sp.demand_id join public.companies c on c.id = d.company_id where sp.professional_id = professionals.id and sp.status in ('forwarded','hired') and c.owner_id = auth.uid()));
create policy "professionals own insert" on public.professionals for insert with check (user_id = auth.uid());
create policy "professionals own update or admin" on public.professionals for update using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "demands company or admin" on public.demands for all using (public.is_admin() or exists (select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid())) with check (public.is_admin() or exists (select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid()));
create policy "scores admin only" on public.compatibility_scores for select using (public.is_admin());
create policy "processes participant company or admin" on public.screening_processes for select using (public.is_admin() or exists (select 1 from public.professionals p where p.id = professional_id and p.user_id = auth.uid()) or exists (select 1 from public.demands d join public.companies c on c.id = d.company_id where d.id = demand_id and c.owner_id = auth.uid()));
create policy "processes admin write" on public.screening_processes for all using (public.is_admin()) with check (public.is_admin());
create policy "history participant company or admin" on public.process_history for select using (public.is_admin() or exists (select 1 from public.screening_processes sp join public.professionals p on p.id = sp.professional_id where sp.id = process_id and p.user_id = auth.uid()) or exists (select 1 from public.screening_processes sp join public.demands d on d.id = sp.demand_id join public.companies c on c.id = d.company_id where sp.id = process_id and c.owner_id = auth.uid()));
create policy "notes admin only" on public.process_notes for all using (public.is_admin()) with check (public.is_admin());
create policy "notifications own" on public.notifications for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "support categories readable" on public.support_categories for select using (auth.uid() is not null);
create policy "support tickets owner or admin" on public.support_tickets for all using (opened_by = auth.uid() or public.is_admin()) with check (opened_by = auth.uid() or public.is_admin());
create policy "support messages ticket participant" on public.support_messages for all using (public.is_admin() or exists (select 1 from public.support_tickets t where t.id = ticket_id and t.opened_by = auth.uid())) with check (public.is_admin() or sender_id = auth.uid());
create policy "reviews owner or admin" on public.platform_reviews for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "review responses owner can read admin writes" on public.review_responses for select using (public.is_admin() or exists (select 1 from public.platform_reviews r where r.id = review_id and r.user_id = auth.uid()));
create policy "review responses admin write" on public.review_responses for all using (public.is_admin()) with check (public.is_admin());
create policy "consents own or admin" on public.consent_records for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "data requests own or admin" on public.data_requests for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "admin privacy logs" on public.anonymization_logs for select using (public.is_admin());
create policy "admin audit logs" on public.audit_logs for select using (public.is_admin());

create policy "professional child own or admin" on public.professional_experiences for all using (public.is_admin() or exists (select 1 from public.professionals p where p.id = professional_id and p.user_id = auth.uid())) with check (public.is_admin() or exists (select 1 from public.professionals p where p.id = professional_id and p.user_id = auth.uid()));
create policy "professional education own or admin" on public.professional_educations for all using (public.is_admin() or exists (select 1 from public.professionals p where p.id = professional_id and p.user_id = auth.uid())) with check (public.is_admin() or exists (select 1 from public.professionals p where p.id = professional_id and p.user_id = auth.uid()));
create policy "professional courses own or admin" on public.professional_courses for all using (public.is_admin() or exists (select 1 from public.professionals p where p.id = professional_id and p.user_id = auth.uid())) with check (public.is_admin() or exists (select 1 from public.professionals p where p.id = professional_id and p.user_id = auth.uid()));
create policy "professional certificates own or admin" on public.professional_certificates for all using (public.is_admin() or exists (select 1 from public.professionals p where p.id = professional_id and p.user_id = auth.uid())) with check (public.is_admin() or exists (select 1 from public.professionals p where p.id = professional_id and p.user_id = auth.uid()));
create policy "professional skills own or admin" on public.professional_skills for all using (public.is_admin() or exists (select 1 from public.professionals p where p.id = professional_id and p.user_id = auth.uid())) with check (public.is_admin() or exists (select 1 from public.professionals p where p.id = professional_id and p.user_id = auth.uid()));
create policy "professional languages own or admin" on public.professional_languages for all using (public.is_admin() or exists (select 1 from public.professionals p where p.id = professional_id and p.user_id = auth.uid())) with check (public.is_admin() or exists (select 1 from public.professionals p where p.id = professional_id and p.user_id = auth.uid()));
create policy "professional documents own or admin" on public.professional_documents for all using (public.is_admin() or exists (select 1 from public.professionals p where p.id = professional_id and p.user_id = auth.uid())) with check (public.is_admin() or exists (select 1 from public.professionals p where p.id = professional_id and p.user_id = auth.uid()));
create policy "resumes own or admin" on public.resumes for select using (public.is_admin() or exists (select 1 from public.professionals p where p.id = professional_id and p.user_id = auth.uid()));
create policy "resume versions own or admin" on public.resume_versions for select using (public.is_admin() or exists (select 1 from public.resumes r join public.professionals p on p.id = r.professional_id where r.id = resume_id and p.user_id = auth.uid()));
create policy "training admin manage" on public.training_tracks for all using (public.is_admin()) with check (public.is_admin());
create policy "training courses admin manage" on public.training_courses for all using (public.is_admin()) with check (public.is_admin());
create policy "training modules admin manage" on public.training_modules for all using (public.is_admin()) with check (public.is_admin());
create policy "training lessons admin manage" on public.training_lessons for all using (public.is_admin()) with check (public.is_admin());
create policy "training enrollments admin or own" on public.training_enrollments for select using (public.is_admin() or exists (select 1 from public.professionals p where p.id = professional_id and p.user_id = auth.uid()));
create policy "training progress admin or own" on public.training_progress for select using (public.is_admin() or exists (select 1 from public.training_enrollments e join public.professionals p on p.id = e.professional_id where e.id = enrollment_id and p.user_id = auth.uid()));
create policy "training certificates admin or own" on public.training_certificates for select using (public.is_admin() or exists (select 1 from public.training_enrollments e join public.professionals p on p.id = e.professional_id where e.id = enrollment_id and p.user_id = auth.uid()));
create policy "training partners admin manage" on public.training_partners for all using (public.is_admin()) with check (public.is_admin());
