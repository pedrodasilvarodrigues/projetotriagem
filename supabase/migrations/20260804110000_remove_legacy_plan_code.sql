-- O Portal utiliza companies.plano/status_plano como fonte oficial de assinatura.
-- Remove o campo transitório criado antes da integração com o fluxo oficial.
drop trigger if exists protect_company_plan_code on public.companies;
drop function if exists public.prevent_direct_company_plan_update();
drop function if exists public.change_company_plan(text);
drop table if exists public.company_plan_history;
alter table public.companies drop column if exists plan_code;
