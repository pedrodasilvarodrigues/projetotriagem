create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null,
  status text not null default 'pending' check (status in ('active', 'pending', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now()),
  unique (normalized_name)
);

create index if not exists institutions_status_name_idx
  on public.institutions (status, name);

create index if not exists institutions_normalized_name_idx
  on public.institutions (normalized_name);

alter table public.institutions enable row level security;

drop policy if exists "institutions active readable" on public.institutions;
create policy "institutions active readable"
on public.institutions
for select
to authenticated
using (status = 'active' or created_by = auth.uid() or public.is_admin());

drop policy if exists "institutions user create pending" on public.institutions;
create policy "institutions user create pending"
on public.institutions
for insert
to authenticated
with check (status = 'pending' and created_by = auth.uid());

drop policy if exists "institutions admin manage" on public.institutions;
create policy "institutions admin manage"
on public.institutions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select, insert, update, delete on public.institutions to authenticated;

insert into public.institutions (name, normalized_name, status)
values
  ('SENAI', 'senai', 'active'),
  ('SENAC', 'senac', 'active'),
  ('SENAR', 'senar', 'active'),
  ('UNIFOA', 'unifoa', 'active'),
  ('UNOPAR', 'unopar', 'active'),
  ('UNIASSELVI', 'uniasselvi', 'active')
on conflict (normalized_name) do nothing;
