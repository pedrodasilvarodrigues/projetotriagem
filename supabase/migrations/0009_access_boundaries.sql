create policy "scores professional own read" on public.compatibility_scores
for select
using (
  exists (
    select 1
    from public.professionals p
    where p.id = professional_id
      and p.user_id = auth.uid()
  )
);

create policy "scores company demand read" on public.compatibility_scores
for select
using (
  exists (
    select 1
    from public.demands d
    join public.companies c on c.id = d.company_id
    where d.id = demand_id
      and c.owner_id = auth.uid()
  )
);

create policy "demands compatible professional read" on public.demands
for select
using (
  status in ('active', 'screening')
  and exists (
    select 1
    from public.compatibility_scores cs
    join public.professionals p on p.id = cs.professional_id
    where cs.demand_id = demands.id
      and p.user_id = auth.uid()
  )
);

create policy "professionals compatible company read" on public.professionals
for select
using (
  exists (
    select 1
    from public.compatibility_scores cs
    join public.demands d on d.id = cs.demand_id
    join public.companies c on c.id = d.company_id
    where cs.professional_id = professionals.id
      and c.owner_id = auth.uid()
  )
);
