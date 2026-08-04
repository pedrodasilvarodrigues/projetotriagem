-- Planos empresariais: a escolha é registrada de forma atômica e auditável.
-- Cobrança financeira não é processada nesta migration.
alter table public.companies add column if not exists plan_code text not null default 'essential';
alter table public.companies drop constraint if exists companies_plan_code_check;
alter table public.companies add constraint companies_plan_code_check check (plan_code in ('essential', 'professional', 'vip'));

create table if not exists public.company_plan_history (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  previous_plan text not null check (previous_plan in ('essential', 'professional', 'vip')),
  new_plan text not null check (new_plan in ('essential', 'professional', 'vip')),
  changed_by uuid not null references auth.users(id),
  changed_at timestamptz not null default timezone('utc', now())
);
create index if not exists company_plan_history_company_changed_at_idx on public.company_plan_history(company_id, changed_at desc);
alter table public.company_plan_history enable row level security;
grant select on public.company_plan_history to authenticated;
drop policy if exists "company plan history owner or admin read" on public.company_plan_history;
create policy "company plan history owner or admin read" on public.company_plan_history for select to authenticated using (public.is_admin() or public.is_company_owner(company_id));

create or replace function public.prevent_direct_company_plan_update() returns trigger language plpgsql set search_path = public as $$
begin
  if new.plan_code is distinct from old.plan_code and current_setting('app.company_plan_change', true) is distinct from 'allowed' then raise exception 'company_plan_change_requires_authorized_function'; end if;
  return new;
end;
$$;
drop trigger if exists protect_company_plan_code on public.companies;
create trigger protect_company_plan_code before update of plan_code on public.companies for each row execute function public.prevent_direct_company_plan_update();

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
    insert into public.company_plan_history (company_id, previous_plan, new_plan, changed_by) values (current_company.id, current_company.plan_code, target_plan, auth.uid());
  end if;
  return query select target_plan, now();
end;
$$;
revoke all on function public.change_company_plan(text) from public, anon;
grant execute on function public.change_company_plan(text) to authenticated;
revoke all on function public.prevent_direct_company_plan_update() from public, anon, authenticated;
