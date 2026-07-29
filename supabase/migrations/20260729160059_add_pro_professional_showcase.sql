do $$
begin
  if not exists (select 1 from pg_type where typname = 'company_plan') then
    create type public.company_plan as enum ('essencial', 'pro', 'vip');
  end if;
  if not exists (select 1 from pg_type where typname = 'company_professional_like_status') then
    create type public.company_professional_like_status as enum ('pendente', 'processado');
  end if;
end
$$;

alter table public.companies
  add column if not exists plano public.company_plan not null default 'essencial';

alter table public.screening_processes
  add column if not exists candidate_origin text not null default 'curadoria',
  add column if not exists source_like_id uuid;

alter table public.screening_processes
  drop constraint if exists screening_processes_candidate_origin_check;

alter table public.screening_processes
  add constraint screening_processes_candidate_origin_check
  check (candidate_origin in ('curadoria', 'interesse_empresa'));

create table public.company_professional_likes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.companies(id) on delete cascade,
  professional_id uuid not null references public.professionals(id) on delete cascade,
  demanda_id uuid not null references public.demands(id) on delete cascade,
  criado_em timestamptz not null default timezone('utc', now()),
  status public.company_professional_like_status not null default 'pendente',
  processado_em timestamptz,
  processado_por uuid references auth.users(id) on delete set null,
  constraint company_professional_likes_unique unique (empresa_id, professional_id, demanda_id),
  constraint company_professional_likes_processing_consistency check (
    (status = 'pendente' and processado_em is null and processado_por is null)
    or (status = 'processado' and processado_em is not null and processado_por is not null)
  )
);

alter table public.screening_processes
  drop constraint if exists screening_processes_source_like_id_fkey;

alter table public.screening_processes
  add constraint screening_processes_source_like_id_fkey
  foreign key (source_like_id) references public.company_professional_likes(id) on delete set null;

create index company_professional_likes_company_status_idx
  on public.company_professional_likes (empresa_id, status, criado_em desc);
create index company_professional_likes_admin_queue_idx
  on public.company_professional_likes (status, criado_em);
create index company_professional_likes_professional_idx
  on public.company_professional_likes (professional_id);
create index screening_processes_origin_idx
  on public.screening_processes (candidate_origin, updated_at desc);
create index companies_plan_idx on public.companies (plano);

create or replace function public.current_company_has_pro_plan(target_company_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.companies c
    where c.id = target_company_id
      and c.owner_id = (select auth.uid())
      and c.plano in ('pro'::public.company_plan, 'vip'::public.company_plan)
      and c.status = 'approved'::public.approval_status
      and c.deleted_at is null
  );
$$;

create or replace function public.professional_is_showcase_eligible(target_professional_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.professionals p
    where p.id = target_professional_id
      and p.status = 'approved'::public.approval_status
      and p.deleted_at is null
      and exists (
        select 1
        from public.resumes r
        where r.professional_id = p.id
          and r.active_version_id is not null
      )
  );
$$;

create or replace function public.protect_company_plan()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.plano is distinct from new.plano
    and (select auth.uid()) is not null
    and not public.is_admin()
  then
    raise exception 'Somente administradores podem alterar o plano da empresa.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_company_plan_trigger on public.companies;
create trigger protect_company_plan_trigger
before update of plano on public.companies
for each row execute function public.protect_company_plan();

alter table public.company_professional_likes enable row level security;

create policy "company reads own professional likes"
on public.company_professional_likes
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.companies c
    where c.id = empresa_id
      and c.owner_id = (select auth.uid())
      and c.deleted_at is null
  )
);

create policy "pro company creates own professional likes"
on public.company_professional_likes
for insert
to authenticated
with check (
  status = 'pendente'::public.company_professional_like_status
  and processado_em is null
  and processado_por is null
  and public.current_company_has_pro_plan(empresa_id)
  and exists (
    select 1
    from public.demands d
    where d.id = demanda_id
      and d.company_id = empresa_id
      and d.status in ('active'::public.demand_status, 'screening'::public.demand_status)
      and d.deleted_at is null
  )
  and public.professional_is_showcase_eligible(professional_id)
);

create policy "company removes own pending professional likes"
on public.company_professional_likes
for delete
to authenticated
using (
  status = 'pendente'::public.company_professional_like_status
  and public.current_company_has_pro_plan(empresa_id)
);

create policy "admin updates professional likes"
on public.company_professional_likes
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace function public.list_pro_professionals(
  search_query text default null,
  area_filter text default null,
  language_filter text default null,
  certification_filter text default null,
  min_experience_months integer default null,
  target_demand_id uuid default null,
  page_offset integer default 0,
  page_limit integer default 12
)
returns table (
  professional_id uuid,
  full_name text,
  desired_role text,
  summary text,
  experience_months integer,
  recent_role text,
  languages jsonb,
  certifications jsonb,
  specializations text[],
  compatibility_score numeric,
  liked boolean,
  like_id uuid,
  like_status public.company_professional_like_status,
  total_count bigint
)
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  caller_company_id uuid;
begin
  select c.id
  into caller_company_id
  from public.companies c
  where c.owner_id = (select auth.uid())
    and c.plano in ('pro'::public.company_plan, 'vip'::public.company_plan)
    and c.status = 'approved'::public.approval_status
    and c.deleted_at is null;

  if caller_company_id is null then
    raise exception 'Esta funcionalidade exige o Plano Pro.'
      using errcode = '42501';
  end if;

  if target_demand_id is not null and not exists (
    select 1
    from public.demands d
    where d.id = target_demand_id
      and d.company_id = caller_company_id
      and d.status in ('active'::public.demand_status, 'screening'::public.demand_status)
      and d.deleted_at is null
  ) then
    raise exception 'Demanda inválida ou indisponível.'
      using errcode = '22023';
  end if;

  return query
  with eligible as (
    select
      p.id,
      p.full_name,
      p.desired_role,
      p.summary,
      coalesce((
        select sum(public.months_between(pe.started_at, pe.ended_at))
        from public.professional_experiences pe
        where pe.professional_id = p.id
      ), 0)::integer as calculated_experience_months,
      (
        select pe.role_title
        from public.professional_experiences pe
        where pe.professional_id = p.id
        order by pe.is_current desc, pe.started_at desc
        limit 1
      ) as calculated_recent_role,
      coalesce((
        select jsonb_agg(
          jsonb_build_object('name', pl.language_name, 'proficiency', pl.proficiency)
          order by pl.language_name
        )
        from public.professional_languages pl
        where pl.professional_id = p.id
      ), '[]'::jsonb) as calculated_languages,
      coalesce((
        select jsonb_agg(
          jsonb_build_object('title', c.title, 'category', c.category, 'approved_at', pc.approved_at)
          order by pc.approved_at desc
        )
        from public.professional_certifications pc
        join public.courses c on c.id = pc.course_id
        where pc.professional_id = p.id
      ), '[]'::jsonb) as calculated_certifications,
      array(
        select distinct specialization
        from (
          select p.desired_role as specialization
          union all
          select ps.name
          from public.professional_skills ps
          where ps.professional_id = p.id and ps.skill_type = 'technical'
          union all
          select c.category
          from public.professional_certifications pc
          join public.courses c on c.id = pc.course_id
          where pc.professional_id = p.id
        ) values_list
        where specialization is not null and btrim(specialization) <> ''
        order by specialization
      ) as calculated_specializations,
      case
        when target_demand_id is null then null
        else (
          select cs.total_score
          from public.compatibility_scores cs
          where cs.professional_id = p.id
            and cs.demand_id = target_demand_id
        )
      end as calculated_compatibility_score
    from public.professionals p
    where p.status = 'approved'::public.approval_status
      and p.deleted_at is null
      and exists (
        select 1
        from public.resumes r
        where r.professional_id = p.id
          and r.active_version_id is not null
      )
      and (
        search_query is null
        or btrim(search_query) = ''
        or p.full_name ilike '%' || btrim(search_query) || '%'
        or p.desired_role ilike '%' || btrim(search_query) || '%'
        or coalesce(p.summary, '') ilike '%' || btrim(search_query) || '%'
      )
      and (
        area_filter is null
        or btrim(area_filter) = ''
        or p.desired_role ilike '%' || btrim(area_filter) || '%'
        or exists (
          select 1
          from public.professional_skills ps
          where ps.professional_id = p.id
            and ps.name ilike '%' || btrim(area_filter) || '%'
        )
        or exists (
          select 1
          from public.professional_certifications pc
          join public.courses c on c.id = pc.course_id
          where pc.professional_id = p.id
            and c.category ilike '%' || btrim(area_filter) || '%'
        )
      )
      and (
        language_filter is null
        or btrim(language_filter) = ''
        or exists (
          select 1
          from public.professional_languages pl
          where pl.professional_id = p.id
            and pl.language_name ilike '%' || btrim(language_filter) || '%'
        )
      )
      and (
        certification_filter is null
        or btrim(certification_filter) = ''
        or exists (
          select 1
          from public.professional_certifications pc
          join public.courses c on c.id = pc.course_id
          where pc.professional_id = p.id
            and (
              c.title ilike '%' || btrim(certification_filter) || '%'
              or c.category ilike '%' || btrim(certification_filter) || '%'
            )
        )
      )
  ),
  filtered as (
    select *
    from eligible e
    where min_experience_months is null
      or e.calculated_experience_months >= greatest(min_experience_months, 0)
  )
  select
    f.id,
    f.full_name,
    f.desired_role,
    f.summary,
    f.calculated_experience_months,
    f.calculated_recent_role,
    f.calculated_languages,
    f.calculated_certifications,
    f.calculated_specializations,
    f.calculated_compatibility_score,
    (like_record.id is not null),
    like_record.id,
    like_record.status,
    count(*) over()
  from filtered f
  left join lateral (
    select cpl.id, cpl.status
    from public.company_professional_likes cpl
    where cpl.empresa_id = caller_company_id
      and cpl.professional_id = f.id
      and cpl.demanda_id = target_demand_id
    limit 1
  ) like_record on target_demand_id is not null
  order by f.calculated_compatibility_score desc nulls last, f.full_name
  offset greatest(page_offset, 0)
  limit least(greatest(page_limit, 1), 24);
end;
$$;

create or replace function public.get_company_professional_likes()
returns table (
  like_id uuid,
  professional_id uuid,
  professional_name text,
  desired_role text,
  demanda_id uuid,
  demand_title text,
  status public.company_professional_like_status,
  criado_em timestamptz,
  processado_em timestamptz
)
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  caller_company_id uuid;
begin
  select c.id
  into caller_company_id
  from public.companies c
  where c.owner_id = (select auth.uid())
    and c.plano in ('pro'::public.company_plan, 'vip'::public.company_plan)
    and c.status = 'approved'::public.approval_status
    and c.deleted_at is null;

  if caller_company_id is null then
    raise exception 'Esta funcionalidade exige o Plano Pro.'
      using errcode = '42501';
  end if;

  return query
  select
    cpl.id,
    p.id,
    p.full_name,
    p.desired_role,
    d.id,
    coalesce(d.name, d.title),
    cpl.status,
    cpl.criado_em,
    cpl.processado_em
  from public.company_professional_likes cpl
  join public.professionals p on p.id = cpl.professional_id
  join public.demands d on d.id = cpl.demanda_id
  where cpl.empresa_id = caller_company_id
  order by cpl.criado_em desc;
end;
$$;

create or replace function public.formalize_company_professional_like(target_like_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  like_record public.company_professional_likes%rowtype;
  process_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem formalizar apresentações.'
      using errcode = '42501';
  end if;

  select *
  into like_record
  from public.company_professional_likes cpl
  where cpl.id = target_like_id
  for update;

  if like_record.id is null then
    raise exception 'Curtida não encontrada.' using errcode = 'P0002';
  end if;

  if like_record.status <> 'pendente'::public.company_professional_like_status then
    raise exception 'Esta curtida já foi processada.' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.professionals p
    where p.id = like_record.professional_id
      and p.status = 'approved'::public.approval_status
      and p.deleted_at is null
      and exists (
        select 1 from public.resumes r
        where r.professional_id = p.id and r.active_version_id is not null
      )
  ) then
    raise exception 'O profissional não está mais disponível para apresentação.'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.demands d
    where d.id = like_record.demanda_id
      and d.company_id = like_record.empresa_id
      and d.status in ('active'::public.demand_status, 'screening'::public.demand_status)
      and d.deleted_at is null
  ) then
    raise exception 'A demanda não está mais aberta.'
      using errcode = '22023';
  end if;

  insert into public.screening_processes (
    demand_id,
    professional_id,
    status,
    admin_owner_id,
    candidate_origin,
    source_like_id,
    updated_at
  )
  values (
    like_record.demanda_id,
    like_record.professional_id,
    'forwarded'::public.process_status,
    (select auth.uid()),
    'interesse_empresa',
    like_record.id,
    timezone('utc', now())
  )
  on conflict (demand_id, professional_id)
  do update set
    status = 'forwarded'::public.process_status,
    admin_owner_id = excluded.admin_owner_id,
    candidate_origin = 'interesse_empresa',
    source_like_id = excluded.source_like_id,
    updated_at = timezone('utc', now())
  returning id into process_id;

  insert into public.professional_presentations (
    professional_id,
    company_id,
    admin_id,
    status,
    notes,
    presented_at,
    updated_at
  )
  values (
    like_record.professional_id,
    like_record.empresa_id,
    (select auth.uid()),
    'presented',
    'Apresentação formalizada a partir de interesse da empresa.',
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (professional_id, company_id)
  do update set
    admin_id = excluded.admin_id,
    status = 'presented',
    notes = excluded.notes,
    presented_at = excluded.presented_at,
    updated_at = excluded.updated_at;

  update public.company_professional_likes
  set
    status = 'processado'::public.company_professional_like_status,
    processado_em = timezone('utc', now()),
    processado_por = (select auth.uid())
  where id = like_record.id;

  update public.demands
  set status = 'screening'::public.demand_status, updated_at = timezone('utc', now())
  where id = like_record.demanda_id
    and status = 'active'::public.demand_status;

  return process_id;
end;
$$;

revoke all on table public.company_professional_likes from anon;
revoke all on table public.company_professional_likes from authenticated;
grant select, insert, update, delete on table public.company_professional_likes to authenticated;

revoke all on function public.current_company_has_pro_plan(uuid) from public, anon;
revoke all on function public.professional_is_showcase_eligible(uuid) from public, anon;
revoke all on function public.protect_company_plan() from public, anon, authenticated;
revoke all on function public.list_pro_professionals(text, text, text, text, integer, uuid, integer, integer) from public, anon;
revoke all on function public.get_company_professional_likes() from public, anon;
revoke all on function public.formalize_company_professional_like(uuid) from public, anon;

grant execute on function public.current_company_has_pro_plan(uuid) to authenticated;
grant execute on function public.professional_is_showcase_eligible(uuid) to authenticated;
grant execute on function public.list_pro_professionals(text, text, text, text, integer, uuid, integer, integer) to authenticated;
grant execute on function public.get_company_professional_likes() to authenticated;
grant execute on function public.formalize_company_professional_like(uuid) to authenticated;

comment on table public.company_professional_likes is
  'Interesses de empresas Pro. Inserções não disparam notificações; o profissional só vê o processo após formalização.';
comment on column public.screening_processes.candidate_origin is
  'Origem visível do candidato: curadoria administrativa ou interesse iniciado pela empresa Pro.';
