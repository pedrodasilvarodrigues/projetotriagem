alter type public.service_provider_status add value if not exists 'banned';

create table if not exists public.banned_cpfs (
  id uuid primary key default gen_random_uuid(),
  cpf text not null unique,
  provider_id_original uuid references public.service_provider_profiles(id) on delete set null,
  reason text not null default 'reputação abaixo do limite mínimo',
  created_at timestamptz not null default timezone('utc', now()),
  constraint banned_cpfs_normalized_check check (cpf ~ '^[0-9]{11}$')
);

create unique index if not exists banned_cpfs_cpf_idx on public.banned_cpfs (cpf);

alter table public.service_provider_profiles
  add column if not exists banned_at timestamptz,
  add column if not exists ban_reason text;

alter table public.marketplace_moderation_actions
  alter column admin_id drop not null;

alter table public.marketplace_moderation_actions
  drop constraint if exists marketplace_moderation_actions_action_type_check;

alter table public.marketplace_moderation_actions
  add constraint marketplace_moderation_actions_action_type_check
  check (action_type in (
    'approve',
    'reject',
    'warn',
    'suspend',
    'reactivate',
    'remove_content',
    'archive_report',
    'ban'
  ));

alter table public.banned_cpfs enable row level security;
revoke all on table public.banned_cpfs from anon, authenticated;
grant select on table public.banned_cpfs to authenticated;

create policy "banned cpfs admin read"
on public.banned_cpfs
for select
to authenticated
using (public.is_admin());

comment on table public.banned_cpfs is
  'Bloqueio permanente de CPF para oferta de serviços. Não bloqueia currículo, vagas ou cursos.';

comment on column public.service_provider_profiles.banned_at is
  'Data do banimento definitivo da função de prestador, sem afetar o papel profissional.';
