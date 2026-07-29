do $$
begin
  create type public.user_theme_preference as enum ('claro', 'escuro', 'automatico');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.user_font_size_preference as enum ('pequeno', 'medio', 'grande');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.user_density_preference as enum ('compacta', 'confortavel');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  tema public.user_theme_preference not null default 'automatico',
  tamanho_fonte public.user_font_size_preference not null default 'medio',
  densidade public.user_density_preference not null default 'confortavel',
  atualizado_em timestamptz not null default timezone('utc', now())
);

alter table public.user_preferences enable row level security;

drop policy if exists "user preferences select own" on public.user_preferences;
create policy "user preferences select own"
on public.user_preferences
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "user preferences insert own" on public.user_preferences;
create policy "user preferences insert own"
on public.user_preferences
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "user preferences update own" on public.user_preferences;
create policy "user preferences update own"
on public.user_preferences
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create or replace function public.set_user_preferences_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em = timezone('utc', now());
  return new;
end;
$$;

revoke all on function public.set_user_preferences_updated_at() from public;

drop trigger if exists user_preferences_updated_at on public.user_preferences;
create trigger user_preferences_updated_at
before update on public.user_preferences
for each row execute function public.set_user_preferences_updated_at();

revoke all on table public.user_preferences from anon;
grant select, insert, update on table public.user_preferences to authenticated;
