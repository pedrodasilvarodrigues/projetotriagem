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

  perform set_config('portal.plan_change_authorized', 'false', true);

  return query
  select c.id, c.plano, c.status_plano
  from public.companies c
  where c.id = company_record.id;
exception
  when others then
    perform set_config('portal.plan_change_authorized', 'false', true);
    raise;
end;
$$;

revoke all on function public.choose_company_plan(public.company_plan) from public, anon;
grant execute on function public.choose_company_plan(public.company_plan) to authenticated;
