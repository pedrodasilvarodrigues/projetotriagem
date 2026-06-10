alter table public.professionals
add column if not exists nationality text not null default 'Brasileira';

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_notifications boolean not null default true,
  opportunity_alerts boolean not null default true,
  profile_visible boolean not null default true,
  allow_recruiter_contact boolean not null default true,
  show_salary_expectation boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.user_settings enable row level security;

drop policy if exists "user settings own or admin" on public.user_settings;
create policy "user settings own or admin" on public.user_settings
for all
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop trigger if exists user_settings_updated_at on public.user_settings;
create trigger user_settings_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

grant select, insert, update, delete on table public.user_settings to authenticated;
grant select, insert, update, delete on table public.professional_preferred_cities to authenticated;
