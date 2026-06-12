create or replace function public.has_role(target_role public.user_role)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = target_role
  );
$$;

create or replace function public.is_company_owner(target_company_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.companies
    where id = target_company_id
      and owner_id = auth.uid()
  );
$$;

create or replace function public.company_has_active_demands(target_company_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.demands
    where company_id = target_company_id
      and status in ('active', 'screening')
      and deleted_at is null
  );
$$;

drop policy if exists "companies owner or admin" on public.companies;
create policy "companies owner or admin" on public.companies
for all
using (
  owner_id = auth.uid()
  or public.is_admin()
)
with check (
  owner_id = auth.uid()
  or public.is_admin()
);

drop policy if exists "professionals read companies with active demands" on public.companies;
create policy "professionals read companies with active demands" on public.companies
for select
using (
  deleted_at is null
  and public.has_role('professional')
  and public.company_has_active_demands(id)
);

drop policy if exists "demands company or admin" on public.demands;
create policy "demands company or admin" on public.demands
for all
using (
  public.is_admin()
  or public.is_company_owner(company_id)
)
with check (
  public.is_admin()
  or public.is_company_owner(company_id)
);
