create extension if not exists pgcrypto;

do $$
begin
  create type public.user_role as enum ('admin', 'company', 'professional');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.approval_status as enum ('pending', 'approved', 'rejected', 'suspended');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.education_level as enum ('fundamental', 'medio', 'tecnico', 'superior', 'pos', 'mba', 'mestrado', 'doutorado');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.demand_status as enum ('draft', 'active', 'screening', 'closed', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.work_modality as enum ('presencial', 'hibrido', 'remoto');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.contract_type as enum ('clt', 'pj', 'temporario', 'estagio', 'aprendiz');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.process_status as enum ('received', 'analysis', 'screening', 'pre_approved', 'training', 'interview', 'forwarded', 'hired', 'rejected', 'waiting');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.ticket_status as enum ('open', 'in_service', 'waiting_user', 'resolved', 'closed');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.data_request_type as enum ('export', 'partial_anonymization', 'account_deletion');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.data_request_status as enum ('requested', 'processing', 'completed', 'denied');
exception when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;
