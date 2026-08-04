do $$
begin
  if not exists (select 1 from pg_type where typname = 'company_plan_status') then
    create type public.company_plan_status as enum ('nenhum', 'pendente_ativacao', 'ativo', 'inativo');
  end if;
end
$$;

alter table public.companies
  add column if not exists status_plano public.company_plan_status not null default 'nenhum',
  add column if not exists plano_escolhido_em timestamptz,
  add column if not exists plano_ativado_em timestamptz,
  add column if not exists plano_ativado_por uuid references auth.users(id) on delete set null;

-- Existing companies already had an assigned plan. Preserve their access while
-- making every company created after this migration start without a plan.
update public.companies
set
  status_plano = 'ativo'::public.company_plan_status,
  plano_escolhido_em = coalesce(plano_escolhido_em, created_at, timezone('utc', now())),
  plano_ativado_em = coalesce(plano_ativado_em, created_at, timezone('utc', now()))
where plano <> 'nenhum'::public.company_plan
  and status_plano = 'nenhum'::public.company_plan_status;

alter table public.companies
  alter column plano set default 'nenhum'::public.company_plan;

create index if not exists companies_plan_status_idx
  on public.companies (status_plano, plano, plano_escolhido_em desc);

create or replace function private.company_has_active_plan(target_company_id uuid)
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
      and c.status_plano = 'ativo'::public.company_plan_status
      and c.deleted_at is null
  );
$$;

create or replace function private.current_company_has_pro_plan(target_company_id uuid)
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
      and c.status_plano = 'ativo'::public.company_plan_status
      and c.status = 'approved'::public.approval_status
      and c.deleted_at is null
  );
$$;

create or replace function public.protect_company_plan()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (
    old.plano is distinct from new.plano
    or old.status_plano is distinct from new.status_plano
    or old.plano_escolhido_em is distinct from new.plano_escolhido_em
    or old.plano_ativado_em is distinct from new.plano_ativado_em
    or old.plano_ativado_por is distinct from new.plano_ativado_por
  )
    and (select auth.uid()) is not null
    and not public.is_admin()
    and coalesce(current_setting('portal.plan_change_authorized', true), 'false') <> 'true'
  then
    raise exception 'As informacoes do plano devem ser alteradas pelo fluxo seguro de assinatura.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_company_plan_trigger on public.companies;
create trigger protect_company_plan_trigger
before update of plano, status_plano, plano_escolhido_em, plano_ativado_em, plano_ativado_por
on public.companies
for each row execute function public.protect_company_plan();

create or replace function public.choose_company_plan(selected_plan public.company_plan)
returns table (company_id uuid, plano public.company_plan, status_plano public.company_plan_status)
language plpgsql
security definer
set search_path = ''
as $$
declare
  company_record public.companies%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'Autenticacao necessaria.' using errcode = '42501';
  end if;

  if selected_plan not in (
    'essencial'::public.company_plan,
    'pro'::public.company_plan,
    'vip'::public.company_plan
  ) then
    raise exception 'Plano invalido.' using errcode = '22023';
  end if;

  select *
  into company_record
  from public.companies c
  where c.owner_id = (select auth.uid())
    and c.deleted_at is null
  for update;

  if company_record.id is null then
    raise exception 'Cadastro empresarial nao encontrado.' using errcode = 'P0002';
  end if;

  if company_record.status_plano = 'ativo'::public.company_plan_status then
    raise exception 'O plano da empresa ja esta ativo.' using errcode = '22023';
  end if;

  if company_record.status_plano = 'pendente_ativacao'::public.company_plan_status then
    raise exception 'A ativacao deste plano ja esta em andamento.' using errcode = '22023';
  end if;

  if company_record.status_plano = 'inativo'::public.company_plan_status then
    raise exception 'A reativacao deve ser solicitada pelo faturamento.' using errcode = '22023';
  end if;

  perform set_config('portal.plan_change_authorized', 'true', true);

  update public.companies
  set
    plano = selected_plan,
    status_plano = case
      when selected_plan = 'essencial'::public.company_plan
        then 'ativo'::public.company_plan_status
      else 'pendente_ativacao'::public.company_plan_status
    end,
    plano_escolhido_em = timezone('utc', now()),
    plano_ativado_em = case
      when selected_plan = 'essencial'::public.company_plan then timezone('utc', now())
      else null
    end,
    plano_ativado_por = null,
    updated_at = timezone('utc', now())
  where id = company_record.id;

  return query
  select c.id, c.plano, c.status_plano
  from public.companies c
  where c.id = company_record.id;
end;
$$;

create or replace function public.activate_company_plan(target_company_id uuid)
returns table (
  company_id uuid,
  company_name text,
  company_email text,
  plano public.company_plan,
  status_plano public.company_plan_status
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem ativar planos.' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.companies c
    where c.id = target_company_id
      and c.plano in ('pro'::public.company_plan, 'vip'::public.company_plan)
      and c.status_plano = 'pendente_ativacao'::public.company_plan_status
      and c.deleted_at is null
  ) then
    raise exception 'Nao existe uma assinatura Pro ou VIP pendente para esta empresa.' using errcode = '22023';
  end if;

  update public.companies
  set
    status_plano = 'ativo'::public.company_plan_status,
    plano_ativado_em = timezone('utc', now()),
    plano_ativado_por = (select auth.uid()),
    updated_at = timezone('utc', now())
  where id = target_company_id;

  return query
  select c.id, c.trade_name, c.corporate_email, c.plano, c.status_plano
  from public.companies c
  where c.id = target_company_id;
end;
$$;

-- Company records remain readable by their owner so onboarding can resolve its
-- state. Writes to the company workspace require an active plan.
drop policy if exists "companies owner or admin" on public.companies;
create policy "companies owner or admin read"
on public.companies for select to authenticated
using (owner_id = (select auth.uid()) or public.is_admin());

create policy "companies onboarding insert"
on public.companies for insert to authenticated
with check (
  public.is_admin()
  or (
    owner_id = (select auth.uid())
    and plano = 'nenhum'::public.company_plan
    and status_plano = 'nenhum'::public.company_plan_status
  )
);

create policy "active companies update own profile"
on public.companies for update to authenticated
using (public.is_admin() or (select private.company_has_active_plan(id)))
with check (public.is_admin() or (select private.company_has_active_plan(id)));

create policy "admins delete companies"
on public.companies for delete to authenticated
using (public.is_admin());

drop policy if exists "demands company or admin" on public.demands;
create policy "active company or admin manages demands"
on public.demands for all to authenticated
using (public.is_admin() or (select private.company_has_active_plan(company_id)))
with check (public.is_admin() or (select private.company_has_active_plan(company_id)));

drop policy if exists "company contacts owner or admin" on public.company_contacts;
create policy "active company or admin reads contacts"
on public.company_contacts for select to authenticated
using (public.is_admin() or (select private.company_has_active_plan(company_id)));
create policy "company onboarding inserts contact"
on public.company_contacts for insert to authenticated
with check (
  public.is_admin()
  or exists (
    select 1 from public.companies c
    where c.id = company_id
      and c.owner_id = (select auth.uid())
      and c.status_plano in ('nenhum'::public.company_plan_status, 'ativo'::public.company_plan_status)
      and c.deleted_at is null
  )
);
create policy "active company or admin updates contacts"
on public.company_contacts for update to authenticated
using (public.is_admin() or (select private.company_has_active_plan(company_id)))
with check (public.is_admin() or (select private.company_has_active_plan(company_id)));
create policy "active company or admin deletes contacts"
on public.company_contacts for delete to authenticated
using (public.is_admin() or (select private.company_has_active_plan(company_id)));

drop policy if exists "company documents owner or admin" on public.company_documents;
create policy "active company or admin manages documents"
on public.company_documents for all to authenticated
using (public.is_admin() or (select private.company_has_active_plan(company_id)))
with check (public.is_admin() or (select private.company_has_active_plan(company_id)));

revoke all on function private.company_has_active_plan(uuid) from public, anon;
revoke all on function private.current_company_has_pro_plan(uuid) from public, anon;
grant execute on function private.company_has_active_plan(uuid) to authenticated;
grant execute on function private.current_company_has_pro_plan(uuid) to authenticated;

revoke all on function public.choose_company_plan(public.company_plan) from public, anon;
revoke all on function public.activate_company_plan(uuid) from public, anon;
grant execute on function public.choose_company_plan(public.company_plan) to authenticated;
grant execute on function public.activate_company_plan(uuid) to authenticated;

comment on column public.companies.status_plano is
  'Estado de acesso da assinatura: nenhum, pendente de ativacao, ativo ou inativo.';
comment on function public.choose_company_plan(public.company_plan) is
  'Escolha inicial atomica: Essencial ativa imediatamente; Pro e VIP aguardam o administrador.';
comment on function public.activate_company_plan(uuid) is
  'Ativa uma assinatura Pro ou VIP pendente e registra o administrador responsavel.';

-- Preserve the existing showcase implementation behind a plan-status gate.
alter function public.list_pro_professionals(text, text, text, text, integer, uuid, integer, integer)
  rename to list_pro_professionals_without_plan_status_gate;

revoke all on function public.list_pro_professionals_without_plan_status_gate(text, text, text, text, integer, uuid, integer, integer)
  from public, anon, authenticated;

create function public.list_pro_professionals(
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
  select c.id into caller_company_id
  from public.companies c
  where c.owner_id = (select auth.uid())
    and c.plano in ('pro'::public.company_plan, 'vip'::public.company_plan)
    and c.status_plano = 'ativo'::public.company_plan_status
    and c.status = 'approved'::public.approval_status
    and c.deleted_at is null;

  if caller_company_id is null then
    raise exception 'Esta funcionalidade exige um Plano Pro ativo.' using errcode = '42501';
  end if;

  return query
  select * from public.list_pro_professionals_without_plan_status_gate(
    search_query,
    area_filter,
    language_filter,
    certification_filter,
    min_experience_months,
    target_demand_id,
    page_offset,
    page_limit
  );
end;
$$;

alter function public.get_company_professional_likes()
  rename to get_company_professional_likes_without_plan_status_gate;

revoke all on function public.get_company_professional_likes_without_plan_status_gate()
  from public, anon, authenticated;

create function public.get_company_professional_likes()
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
  select c.id into caller_company_id
  from public.companies c
  where c.owner_id = (select auth.uid())
    and c.plano in ('pro'::public.company_plan, 'vip'::public.company_plan)
    and c.status_plano = 'ativo'::public.company_plan_status
    and c.status = 'approved'::public.approval_status
    and c.deleted_at is null;

  if caller_company_id is null then
    raise exception 'Esta funcionalidade exige um Plano Pro ativo.' using errcode = '42501';
  end if;

  return query select * from public.get_company_professional_likes_without_plan_status_gate();
end;
$$;

revoke all on function public.list_pro_professionals(text, text, text, text, integer, uuid, integer, integer) from public, anon;
revoke all on function public.get_company_professional_likes() from public, anon;
grant execute on function public.list_pro_professionals(text, text, text, text, integer, uuid, integer, integer) to authenticated;
grant execute on function public.get_company_professional_likes() to authenticated;

create or replace function public.company_can_read_professional(target_professional_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.professional_presentations pp
    join public.companies c on c.id = pp.company_id
    where pp.professional_id = target_professional_id
      and c.owner_id = (select auth.uid())
      and c.status_plano = 'ativo'::public.company_plan_status
      and c.deleted_at is null
      and pp.status <> 'archived'
  )
  or exists (
    select 1
    from public.screening_processes sp
    join public.demands d on d.id = sp.demand_id
    join public.companies c on c.id = d.company_id
    where sp.professional_id = target_professional_id
      and sp.status <> 'waiting'::public.process_status
      and c.owner_id = (select auth.uid())
      and c.status_plano = 'ativo'::public.company_plan_status
      and c.deleted_at is null
      and d.deleted_at is null
  );
$$;

create or replace function public.company_can_read_screening_process(target_demand_id uuid, target_status public.process_status)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select target_status <> 'waiting'::public.process_status
    and exists (
      select 1
      from public.demands d
      join public.companies c on c.id = d.company_id
      where d.id = target_demand_id
        and c.owner_id = (select auth.uid())
        and c.status_plano = 'ativo'::public.company_plan_status
        and c.deleted_at is null
        and d.deleted_at is null
    );
$$;

do $$
begin
  if to_regclass('public.demand_reserve_queue') is not null then
    execute 'drop policy if exists "reserve queue company read own demands" on public.demand_reserve_queue';
    execute $policy$
      create policy "reserve queue active company reads own demands"
      on public.demand_reserve_queue
      for select to authenticated
      using (
        exists (
          select 1
          from public.demands d
          where d.id = demand_id
            and (select private.company_has_active_plan(d.company_id))
        )
      )
    $policy$;
  end if;
end
$$;

drop policy if exists "company reads own professional likes" on public.company_professional_likes;
create policy "active company reads own professional likes"
on public.company_professional_likes
for select to authenticated
using (public.is_admin() or (select private.company_has_active_plan(empresa_id)));
