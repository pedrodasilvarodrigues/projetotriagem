alter table public.professionals
add column if not exists cpf text unique;

alter table public.companies
add column if not exists phone text,
add column if not exists corporate_email text;

do $$
begin
  alter table public.resumes add constraint resumes_professional_id_key unique (professional_id);
exception when duplicate_object then null;
end $$;

create policy "roles self choose onboarding" on public.user_roles
for insert
with check (user_id = auth.uid() and role in ('company', 'professional'));

create policy "roles self update onboarding" on public.user_roles
for update
using (user_id = auth.uid())
with check (user_id = auth.uid() and role in ('company', 'professional'));

create policy "resumes own insert" on public.resumes
for insert
with check (exists (select 1 from public.professionals p where p.id = professional_id and p.user_id = auth.uid()));

create policy "resumes own update" on public.resumes
for update
using (exists (select 1 from public.professionals p where p.id = professional_id and p.user_id = auth.uid()))
with check (exists (select 1 from public.professionals p where p.id = professional_id and p.user_id = auth.uid()));

create policy "resume versions own insert" on public.resume_versions
for insert
with check (exists (select 1 from public.resumes r join public.professionals p on p.id = r.professional_id where r.id = resume_id and p.user_id = auth.uid()));
