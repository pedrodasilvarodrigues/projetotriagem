-- Curriculo e confirmacao so ficam disponiveis depois que o Admin apresenta o candidato.
create or replace function public.hire_company_owns_process(target_process_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.screening_processes sp
    join public.demands d on d.id = sp.demand_id
    join public.companies c on c.id = d.company_id
    where sp.id = target_process_id
      and c.owner_id = auth.uid()
      and c.status_plano = 'ativo'
      and sp.status in (
        'forwarded',
        'interview',
        'pre_approved',
        'awaiting_professional_confirmation',
        'hire_dispute',
        'hired',
        'rejected'
      )
      and c.deleted_at is null
      and d.deleted_at is null
  );
$$;

revoke all on function public.hire_company_owns_process(uuid) from public, anon;
grant execute on function public.hire_company_owns_process(uuid) to authenticated;
