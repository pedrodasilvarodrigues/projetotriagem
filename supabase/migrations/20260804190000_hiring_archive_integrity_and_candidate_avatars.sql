create or replace function public.company_can_read_candidate_avatar(target_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles profile
    join public.professionals professional on professional.user_id = profile.id
    join public.screening_processes process on process.professional_id = professional.id
    join public.demands demand on demand.id = process.demand_id
    join public.companies company on company.id = demand.company_id
    where profile.avatar_path = target_path
      and profile.deleted_at is null
      and professional.deleted_at is null
      and demand.deleted_at is null
      and company.deleted_at is null
      and company.owner_id = (select auth.uid())
      and company.status_plano = 'ativo'::public.company_plan_status
      and process.status <> 'waiting'::public.process_status
      and process.company_visibility <> 'removed'
  );
$$;

create or replace function public.list_company_candidate_avatars()
returns table(process_id uuid, avatar_path text)
language sql
stable
security definer
set search_path = ''
as $$
  select process.id, profile.avatar_path
  from public.screening_processes process
  join public.professionals professional on professional.id = process.professional_id
  join public.profiles profile on profile.id = professional.user_id
  join public.demands demand on demand.id = process.demand_id
  join public.companies company on company.id = demand.company_id
  where company.owner_id = (select auth.uid())
    and company.status_plano = 'ativo'::public.company_plan_status
    and company.deleted_at is null
    and demand.deleted_at is null
    and professional.deleted_at is null
    and profile.deleted_at is null
    and profile.avatar_path is not null
    and process.status <> 'waiting'::public.process_status
    and process.company_visibility <> 'removed';
$$;

revoke all on function public.company_can_read_candidate_avatar(text) from public, anon;
revoke all on function public.list_company_candidate_avatars() from public, anon;
grant execute on function public.company_can_read_candidate_avatar(text) to authenticated;
grant execute on function public.list_company_candidate_avatars() to authenticated;

drop policy if exists "companies read presented candidate avatars" on storage.objects;
create policy "companies read presented candidate avatars"
on storage.objects
for select to authenticated
using (
  bucket_id = 'avatars'
  and public.company_can_read_candidate_avatar(name)
);

create or replace function public.guard_hired_candidate_visibility()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'hired'::public.process_status and new.company_visibility = 'removed' then
    raise exception 'hired_candidate_must_be_archived';
  end if;
  return new;
end;
$$;

drop trigger if exists screening_process_guard_hired_visibility on public.screening_processes;
create trigger screening_process_guard_hired_visibility
before insert or update of status, company_visibility on public.screening_processes
for each row execute function public.guard_hired_candidate_visibility();

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
    process.id,
    process.status,
    process.company_visibility,
    company.id as company_id
  into process_row
  from public.screening_processes process
  join public.demands demand on demand.id = process.demand_id
  join public.companies company on company.id = demand.company_id
  where process.id = target_process_id
    and company.owner_id = current_user_id
    and company.status_plano = 'ativo'::public.company_plan_status
    and company.deleted_at is null
    and demand.deleted_at is null
  for update of process;

  if process_row.id is null then
    raise exception 'candidate_process_access_denied';
  end if;

  if process_row.status not in ('hired'::public.process_status, 'rejected'::public.process_status) then
    raise exception 'candidate_process_must_be_closed';
  end if;

  if target_visibility = 'removed' and process_row.status = 'hired'::public.process_status then
    raise exception 'hired_candidate_must_be_archived';
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

create or replace function public.guard_demand_with_hire_from_removal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_id uuid := case when tg_op = 'DELETE' then old.id else new.id end;
  has_hired_professional boolean;
begin
  select exists (
    select 1
    from public.screening_processes process
    where process.demand_id = target_id
      and process.status = 'hired'::public.process_status
  ) into has_hired_professional;

  if tg_op = 'DELETE' then
    if has_hired_professional then
      raise exception 'demand_with_hire_must_be_archived';
    end if;
    return old;
  end if;

  if has_hired_professional and (new.status = 'cancelled'::public.demand_status or new.deleted_at is not null) then
    raise exception 'demand_with_hire_must_be_archived';
  end if;

  return new;
end;
$$;

drop trigger if exists demand_guard_hiring_integrity on public.demands;
create trigger demand_guard_hiring_integrity
before delete or update of status, deleted_at on public.demands
for each row execute function public.guard_demand_with_hire_from_removal();

create or replace function public.company_remove_demand(target_demand_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  demand_row record;
begin
  if current_user_id is null then
    raise exception 'authentication_required';
  end if;

  select demand.id
  into demand_row
  from public.demands demand
  join public.companies company on company.id = demand.company_id
  where demand.id = target_demand_id
    and demand.deleted_at is null
    and company.owner_id = current_user_id
    and company.status_plano = 'ativo'::public.company_plan_status
    and company.deleted_at is null
  for update of demand;

  if demand_row.id is null then
    raise exception 'demand_access_denied';
  end if;

  if exists (
    select 1
    from public.screening_processes process
    where process.demand_id = demand_row.id
      and process.status = 'hired'::public.process_status
  ) then
    raise exception 'demand_with_hire_must_be_archived';
  end if;

  update public.demands
  set
    status = 'cancelled'::public.demand_status,
    deleted_at = timezone('utc', now())
  where id = demand_row.id;

  return demand_row.id;
end;
$$;

revoke all on function public.company_remove_demand(uuid) from public, anon;
grant execute on function public.company_remove_demand(uuid) to authenticated;
