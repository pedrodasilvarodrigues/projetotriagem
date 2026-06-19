drop policy if exists "professionals read active demands" on public.demands;
drop policy if exists "demands compatible professional read" on public.demands;

create policy "professionals read active demands" on public.demands
for select
to authenticated
using (
  status in ('active', 'screening')
  and deleted_at is null
  and public.has_role('professional')
);

drop policy if exists "professionals read companies with active demands" on public.companies;

create policy "professionals read companies with active demands" on public.companies
for select
to authenticated
using (
  deleted_at is null
  and public.has_role('professional')
  and public.company_has_active_demands(id)
);
