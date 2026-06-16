alter table public.professionals
  alter column birth_date drop not null;

drop policy if exists "profiles own insert" on public.profiles;
create policy "profiles own insert" on public.profiles
for insert
with check (id = auth.uid() or public.is_admin());
