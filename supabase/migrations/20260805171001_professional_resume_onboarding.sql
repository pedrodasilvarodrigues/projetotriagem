create table if not exists public.professional_resume_onboarding (
  professional_id uuid primary key references public.professionals(id) on delete cascade,
  choice text not null check (choice in ('uploaded', 'none')),
  prompt_status text not null default 'not_applicable'
    check (prompt_status in ('pending', 'fill', 'later', 'not_applicable')),
  import_status text not null default 'not_requested'
    check (import_status in ('not_requested', 'pending', 'completed', 'partial', 'failed')),
  import_summary jsonb not null default '{}'::jsonb,
  import_error text,
  decided_at timestamptz not null default timezone('utc', now()),
  imported_at timestamptz,
  prompt_answered_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (
    (choice = 'none' and import_status = 'not_requested')
    or choice = 'uploaded'
  )
);

create index if not exists professional_resume_onboarding_prompt_idx
on public.professional_resume_onboarding (prompt_status)
where choice = 'none' and prompt_status = 'pending';

drop trigger if exists professional_resume_onboarding_updated_at on public.professional_resume_onboarding;
create trigger professional_resume_onboarding_updated_at
before update on public.professional_resume_onboarding
for each row execute function public.set_updated_at();

alter table public.professional_resume_onboarding enable row level security;

drop policy if exists "resume onboarding own or admin select" on public.professional_resume_onboarding;
create policy "resume onboarding own or admin select"
on public.professional_resume_onboarding
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.professionals p
    where p.id = professional_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "resume onboarding own insert" on public.professional_resume_onboarding;
create policy "resume onboarding own insert"
on public.professional_resume_onboarding
for insert
to authenticated
with check (
  exists (
    select 1
    from public.professionals p
    where p.id = professional_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "resume onboarding own or admin update" on public.professional_resume_onboarding;
create policy "resume onboarding own or admin update"
on public.professional_resume_onboarding
for update
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.professionals p
    where p.id = professional_id
      and p.user_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.professionals p
    where p.id = professional_id
      and p.user_id = auth.uid()
  )
);

revoke all on public.professional_resume_onboarding from anon;
grant select, insert, update on public.professional_resume_onboarding to authenticated;
