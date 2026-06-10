create table if not exists public.professional_preferred_cities (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  city text not null,
  state text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (professional_id, city, state)
);

alter table public.professional_preferred_cities enable row level security;

drop policy if exists "preferred cities own or admin" on public.professional_preferred_cities;
create policy "preferred cities own or admin" on public.professional_preferred_cities
for all
using (
  public.is_admin()
  or exists (
    select 1 from public.professionals p
    where p.id = professional_id
      and p.user_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.professionals p
    where p.id = professional_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "professionals read active demands" on public.demands;
create policy "professionals read active demands" on public.demands
for select
using (
  status in ('active', 'screening')
  and deleted_at is null
  and exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'professional'
  )
);

drop policy if exists "professionals read companies with active demands" on public.companies;
create policy "professionals read companies with active demands" on public.companies
for select
using (
  deleted_at is null
  and exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'professional'
  )
  and exists (
    select 1 from public.demands d
    where d.company_id = companies.id
      and d.status in ('active', 'screening')
      and d.deleted_at is null
  )
);
