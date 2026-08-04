-- Corrige o tipo retornado pela RPC para timestamptz.
create or replace function public.change_company_plan(target_plan text)
returns table(plan_code text, changed_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare current_company public.companies%rowtype;
begin
  if auth.uid() is null then raise exception 'company_access_required'; end if;
  if not public.has_role('company') then raise exception 'company_access_required'; end if;
  if target_plan not in ('essential', 'professional', 'vip') then raise exception 'invalid_company_plan'; end if;

  select * into current_company from public.companies where owner_id = auth.uid() and deleted_at is null for update;
  if not found then raise exception 'company_not_found'; end if;

  if current_company.plan_code is distinct from target_plan then
    perform set_config('app.company_plan_change', 'allowed', true);
    update public.companies set plan_code = target_plan where id = current_company.id;
    insert into public.company_plan_history (company_id, previous_plan, new_plan, changed_by)
    values (current_company.id, current_company.plan_code, target_plan, auth.uid());
  end if;

  return query select target_plan, now();
end;
$$;

revoke all on function public.change_company_plan(text) from public, anon;
grant execute on function public.change_company_plan(text) to authenticated;
