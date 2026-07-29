create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

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
      and c.status = 'approved'::public.approval_status
      and c.deleted_at is null
  );
$$;

create or replace function private.professional_is_showcase_eligible(target_professional_id uuid)
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

revoke all on function private.current_company_has_pro_plan(uuid) from public, anon;
revoke all on function private.professional_is_showcase_eligible(uuid) from public, anon;
grant execute on function private.current_company_has_pro_plan(uuid) to authenticated;
grant execute on function private.professional_is_showcase_eligible(uuid) to authenticated;

drop policy if exists "pro company creates own professional likes"
on public.company_professional_likes;
create policy "pro company creates own professional likes"
on public.company_professional_likes
for insert
to authenticated
with check (
  status = 'pendente'::public.company_professional_like_status
  and processado_em is null
  and processado_por is null
  and (select private.current_company_has_pro_plan(empresa_id))
  and exists (
    select 1
    from public.demands d
    where d.id = demanda_id
      and d.company_id = empresa_id
      and d.status in ('active'::public.demand_status, 'screening'::public.demand_status)
      and d.deleted_at is null
  )
  and (select private.professional_is_showcase_eligible(professional_id))
);

drop policy if exists "company removes own pending professional likes"
on public.company_professional_likes;
create policy "company removes own pending professional likes"
on public.company_professional_likes
for delete
to authenticated
using (
  status = 'pendente'::public.company_professional_like_status
  and (select private.current_company_has_pro_plan(empresa_id))
);

revoke all on function public.current_company_has_pro_plan(uuid) from public, anon, authenticated;
revoke all on function public.professional_is_showcase_eligible(uuid) from public, anon, authenticated;
drop function public.current_company_has_pro_plan(uuid);
drop function public.professional_is_showcase_eligible(uuid);
