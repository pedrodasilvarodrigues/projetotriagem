-- Harden company access to professional data and screening rows.
-- Root cause: older policies allowed every company account to read the
-- full professionals catalog and every company-owned screening row, including
-- reserve queue entries in status "waiting".

create or replace function public.company_can_read_professional(target_professional_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.professional_presentations pp
    join public.companies c on c.id = pp.company_id
    where pp.professional_id = target_professional_id
      and c.owner_id = auth.uid()
      and c.deleted_at is null
      and pp.status <> 'archived'
  )
  or exists (
    select 1
    from public.screening_processes sp
    join public.demands d on d.id = sp.demand_id
    join public.companies c on c.id = d.company_id
    where sp.professional_id = target_professional_id
      and sp.status <> 'waiting'::public.process_status
      and c.owner_id = auth.uid()
      and c.deleted_at is null
      and d.deleted_at is null
  );
$$;

create or replace function public.user_owns_professional(target_professional_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.professionals p
    where p.id = target_professional_id
      and p.user_id = auth.uid()
      and p.deleted_at is null
  );
$$;

create or replace function public.company_can_read_screening_process(target_demand_id uuid, target_status public.process_status)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select target_status <> 'waiting'::public.process_status
    and exists (
      select 1
      from public.demands d
      join public.companies c on c.id = d.company_id
      where d.id = target_demand_id
        and c.owner_id = auth.uid()
        and c.deleted_at is null
        and d.deleted_at is null
    );
$$;

revoke all on function public.company_can_read_professional(uuid) from public, anon;
revoke all on function public.user_owns_professional(uuid) from public, anon;
revoke all on function public.company_can_read_screening_process(uuid, public.process_status) from public, anon;
grant execute on function public.company_can_read_professional(uuid) to authenticated;
grant execute on function public.user_owns_professional(uuid) to authenticated;
grant execute on function public.company_can_read_screening_process(uuid, public.process_status) to authenticated;

drop policy if exists "companies read professionals catalog" on public.professionals;
drop policy if exists "professionals own admin or forwarded company" on public.professionals;
drop policy if exists "professionals own or admin" on public.professionals;
drop policy if exists "professionals select own catalog or admin" on public.professionals;

create policy "professionals own admin or presented company"
on public.professionals
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin()
  or public.company_can_read_professional(id)
);

drop policy if exists "processes participant company or admin" on public.screening_processes;

create policy "processes participant visible company or admin"
on public.screening_processes
for select
to authenticated
using (
  public.is_admin()
  or public.user_owns_professional(professional_id)
  or public.company_can_read_screening_process(demand_id, status)
);

drop policy if exists "history participant company or admin" on public.process_history;

create policy "history participant visible company or admin"
on public.process_history
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.screening_processes sp
    where sp.id = process_id
      and public.user_owns_professional(sp.professional_id)
  )
  or exists (
    select 1
    from public.screening_processes sp
    where sp.id = process_id
      and public.company_can_read_screening_process(sp.demand_id, sp.status)
  )
);

-- Re-apply role hardening defensively so a production database that missed the
-- older migration cannot accept "admin" from user-editable signup metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.user_role;
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  );

  requested_role := case
    when new.raw_user_meta_data->>'role' = 'company' then 'company'::public.user_role
    else 'professional'::public.user_role
  end;

  insert into public.user_roles (user_id, role)
  values (new.id, requested_role);

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
