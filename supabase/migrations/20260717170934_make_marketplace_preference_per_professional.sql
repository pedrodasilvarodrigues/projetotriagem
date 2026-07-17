alter table public.user_settings
add column if not exists service_marketplace_enabled boolean not null default true;

-- O marketplace continua ativo para a plataforma. A escolha passa a ser
-- individual e só restringe profissionais que desativaram a preferência.
update public.system_feature_flags
set enabled = true, updated_at = timezone('utc', now())
where feature_key = 'marketplace_services';

revoke execute on function public.admin_set_feature(text, boolean) from authenticated;
drop function if exists public.admin_set_feature(text, boolean);

create or replace function public.is_feature_enabled(feature_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select flag.enabled
      and case
        when exists (
          select 1 from public.user_roles ur
          where ur.user_id = auth.uid() and ur.role = 'professional'
        ) then coalesce((
          select us.service_marketplace_enabled
          from public.user_settings us
          where us.user_id = auth.uid()
        ), true)
        else true
      end
    from public.system_feature_flags flag
    where flag.feature_key = $1
  ), false);
$$;

revoke all on function public.is_feature_enabled(text) from public;
grant execute on function public.is_feature_enabled(text) to anon, authenticated, service_role;
