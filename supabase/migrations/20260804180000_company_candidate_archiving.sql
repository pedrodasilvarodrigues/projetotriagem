alter table public.screening_processes
  add column if not exists company_visibility text not null default 'active',
  add column if not exists company_visibility_changed_at timestamptz,
  add column if not exists company_visibility_changed_by uuid references auth.users(id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'screening_processes_company_visibility_check'
      and conrelid = 'public.screening_processes'::regclass
  ) then
    alter table public.screening_processes
      add constraint screening_processes_company_visibility_check
      check (company_visibility in ('active', 'archived', 'removed'));
  end if;
end
$$;

create index if not exists screening_processes_company_visibility_idx
  on public.screening_processes (company_visibility, updated_at desc);

create table if not exists public.company_candidate_visibility_audit (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null references public.screening_processes(id),
  company_id uuid not null references public.companies(id),
  actor_user_id uuid not null references auth.users(id),
  previous_visibility text not null check (previous_visibility in ('active', 'archived', 'removed')),
  new_visibility text not null check (new_visibility in ('active', 'archived', 'removed')),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.company_candidate_visibility_audit enable row level security;

drop policy if exists "company reads own candidate visibility audit" on public.company_candidate_visibility_audit;
create policy "company reads own candidate visibility audit"
on public.company_candidate_visibility_audit
for select to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.companies c
    where c.id = company_id
      and c.owner_id = (select auth.uid())
      and c.deleted_at is null
  )
);

revoke all on public.company_candidate_visibility_audit from public, anon;
grant select on public.company_candidate_visibility_audit to authenticated;

create or replace function public.set_company_candidate_visibility(
  target_process_id uuid,
  target_visibility text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  process_row record;
begin
  if current_user_id is null then
    raise exception 'authentication_required';
  end if;

  if target_visibility not in ('active', 'archived', 'removed') then
    raise exception 'invalid_candidate_visibility';
  end if;

  select
    sp.id,
    sp.status,
    sp.company_visibility,
    c.id as company_id
  into process_row
  from public.screening_processes sp
  join public.demands d on d.id = sp.demand_id
  join public.companies c on c.id = d.company_id
  where sp.id = target_process_id
    and c.owner_id = current_user_id
    and c.status_plano = 'ativo'::public.company_plan_status
    and c.deleted_at is null
    and d.deleted_at is null
  for update of sp;

  if process_row.id is null then
    raise exception 'candidate_process_access_denied';
  end if;

  if process_row.status not in ('hired'::public.process_status, 'rejected'::public.process_status) then
    raise exception 'candidate_process_must_be_closed';
  end if;

  if process_row.company_visibility = 'removed' then
    raise exception 'candidate_already_removed';
  end if;

  if target_visibility = 'active' and process_row.company_visibility <> 'archived' then
    raise exception 'candidate_restore_requires_archive';
  end if;

  if target_visibility = process_row.company_visibility then
    return process_row.company_visibility;
  end if;

  update public.screening_processes
  set
    company_visibility = target_visibility,
    company_visibility_changed_at = timezone('utc', now()),
    company_visibility_changed_by = current_user_id
  where id = process_row.id;

  insert into public.company_candidate_visibility_audit (
    process_id,
    company_id,
    actor_user_id,
    previous_visibility,
    new_visibility
  ) values (
    process_row.id,
    process_row.company_id,
    current_user_id,
    process_row.company_visibility,
    target_visibility
  );

  return target_visibility;
end;
$$;

revoke all on function public.set_company_candidate_visibility(uuid, text) from public, anon;
grant execute on function public.set_company_candidate_visibility(uuid, text) to authenticated;
