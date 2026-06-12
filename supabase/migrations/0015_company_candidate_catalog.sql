drop policy if exists "companies read professionals catalog" on public.professionals;

create policy "companies read professionals catalog" on public.professionals
for select
using (
  public.is_admin()
  or public.has_role('company')
  or user_id = auth.uid()
  or exists (
    select 1
    from public.screening_processes sp
    join public.demands d on d.id = sp.demand_id
    join public.companies c on c.id = d.company_id
    where sp.professional_id = professionals.id
      and sp.status in ('forwarded', 'hired')
      and c.owner_id = auth.uid()
  )
);
