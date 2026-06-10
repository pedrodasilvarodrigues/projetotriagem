alter table public.companies
add column if not exists segment text,
add column if not exists description text;

create table if not exists public.demand_reserve_queue (
  id uuid primary key default gen_random_uuid(),
  demand_id uuid not null references public.demands(id) on delete cascade,
  professional_id uuid not null references public.professionals(id) on delete cascade,
  position integer not null check (position > 0),
  status text not null default 'reserve' check (status in ('reserve', 'forwarded', 'skipped')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (demand_id, professional_id),
  unique (demand_id, position)
);

alter table public.demand_reserve_queue enable row level security;

create policy "reserve queue admin manage" on public.demand_reserve_queue
for all
using (public.is_admin())
with check (public.is_admin());

create policy "reserve queue company read own demands" on public.demand_reserve_queue
for select
using (
  exists (
    select 1
    from public.demands d
    join public.companies c on c.id = d.company_id
    where d.id = demand_id
      and c.owner_id = auth.uid()
  )
);

create policy "reserve queue professional read own" on public.demand_reserve_queue
for select
using (
  exists (
    select 1
    from public.professionals p
    where p.id = professional_id
      and p.user_id = auth.uid()
  )
);

create trigger demand_reserve_queue_updated_at
before update on public.demand_reserve_queue
for each row execute function public.set_updated_at();
