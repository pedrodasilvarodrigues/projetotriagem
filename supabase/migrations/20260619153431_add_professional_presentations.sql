create table if not exists public.professional_presentations (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  admin_id uuid references auth.users(id) on delete set null,
  status text not null default 'presented',
  notes text,
  presented_at timestamp with time zone not null default timezone('utc', now()),
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now()),
  unique (professional_id, company_id)
);

alter table public.professional_presentations enable row level security;

drop policy if exists "admins manage professional presentations" on public.professional_presentations;
create policy "admins manage professional presentations"
on public.professional_presentations
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create index if not exists professional_presentations_professional_idx
  on public.professional_presentations (professional_id, presented_at desc);

create index if not exists professional_presentations_company_idx
  on public.professional_presentations (company_id, presented_at desc);

create index if not exists professional_presentations_admin_idx
  on public.professional_presentations (admin_id, presented_at desc);
