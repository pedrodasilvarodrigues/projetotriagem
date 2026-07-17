create table if not exists public.system_feature_flags (
  feature_key text primary key,
  enabled boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint system_feature_flags_key_format check (feature_key ~ '^[a-z0-9_]+$')
);

insert into public.system_feature_flags (feature_key, enabled)
values ('marketplace_services', true)
on conflict (feature_key) do nothing;

alter table public.system_feature_flags enable row level security;
revoke all on table public.system_feature_flags from anon, authenticated;
grant select on table public.system_feature_flags to authenticated;

create policy "feature flags admin read"
on public.system_feature_flags for select to authenticated
using (public.is_admin());

create or replace function public.is_feature_enabled(feature_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select flag.enabled
    from public.system_feature_flags flag
    where flag.feature_key = $1
  ), false);
$$;

revoke all on function public.is_feature_enabled(text) from public;
grant execute on function public.is_feature_enabled(text) to anon, authenticated, service_role;

create or replace function public.admin_set_feature(feature_key text, target_enabled boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin_required';
  end if;
  if $1 <> 'marketplace_services' then
    raise exception 'unknown_feature';
  end if;

  update public.system_feature_flags
  set enabled = target_enabled,
      updated_by = auth.uid(),
      updated_at = timezone('utc', now())
  where system_feature_flags.feature_key = $1;

  return target_enabled;
end;
$$;

revoke all on function public.admin_set_feature(text, boolean) from public, anon;
grant execute on function public.admin_set_feature(text, boolean) to authenticated;

-- Restrictive policies are combined with every existing permissive policy.
-- They make the switch authoritative for direct Data API access as well.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'client_profiles',
    'service_categories',
    'service_provider_profiles',
    'service_provider_categories',
    'service_provider_areas',
    'service_provider_portfolio',
    'marketplace_conversations',
    'marketplace_messages',
    'service_requests',
    'service_request_events',
    'service_reviews',
    'marketplace_reports',
    'marketplace_moderation_actions',
    'marketplace_notifications'
  ] loop
    execute format('drop policy if exists "marketplace globally enabled" on public.%I', table_name);
    execute format(
      'create policy "marketplace globally enabled" on public.%I as restrictive for all to anon, authenticated using (public.is_feature_enabled(''marketplace_services'')) with check (public.is_feature_enabled(''marketplace_services''))',
      table_name
    );
  end loop;
end $$;

-- SECURITY DEFINER mutations also pass through this trigger, preventing bypass
-- of the restrictive RLS policies while the feature is disabled.
create or replace function public.enforce_marketplace_feature_enabled()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.is_feature_enabled('marketplace_services') then
    raise exception 'marketplace_disabled';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_marketplace_feature_enabled() from public, anon, authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'client_profiles',
    'service_categories',
    'service_provider_profiles',
    'service_provider_categories',
    'service_provider_areas',
    'service_provider_portfolio',
    'marketplace_conversations',
    'marketplace_messages',
    'service_requests',
    'service_request_events',
    'service_reviews',
    'marketplace_reports',
    'marketplace_moderation_actions',
    'marketplace_notifications'
  ] loop
    execute format('drop trigger if exists enforce_marketplace_feature_enabled_trigger on public.%I', table_name);
    execute format(
      'create trigger enforce_marketplace_feature_enabled_trigger before insert or update or delete on public.%I for each row execute function public.enforce_marketplace_feature_enabled()',
      table_name
    );
  end loop;
end $$;

create or replace function public.search_service_providers(
  search_text text default null,
  target_category uuid default null,
  target_city text default null,
  target_mode public.service_mode default null,
  minimum_rating numeric default null,
  result_limit integer default 24,
  result_offset integer default 0
) returns table (
  provider_id uuid, full_name text, avatar_path text, professional_title text,
  service_description text, specialties text[], service_mode public.service_mode,
  pricing_model public.service_pricing_model, starting_price numeric, availability text,
  rating_average numeric, rating_count integer, city text, state text, category_names text[]
) language sql stable security definer set search_path = public
as $$
  select spp.id, p.full_name, pr.avatar_path, spp.professional_title, spp.service_description,
    spp.specialties, spp.service_mode, spp.pricing_model, spp.starting_price, spp.availability,
    spp.rating_average, spp.rating_count, coalesce(area.city, p.city), coalesce(area.state, p.state),
    coalesce(categories.names, '{}')
  from public.service_provider_profiles spp
  join public.professionals p on p.id = spp.professional_id
  join public.profiles pr on pr.id = p.user_id
  left join lateral (
    select spa.city, spa.state from public.service_provider_areas spa
    where spa.provider_id = spp.id order by spa.created_at limit 1
  ) area on true
  left join lateral (
    select array_agg(sc.name order by sc.display_order, sc.name) names
    from public.service_provider_categories spc
    join public.service_categories sc on sc.id = spc.category_id and sc.is_active
    where spc.provider_id = spp.id
  ) categories on true
  where public.is_feature_enabled('marketplace_services')
    and spp.status = 'approved' and p.deleted_at is null
    and (search_text is null or trim(search_text) = ''
      or spp.professional_title ilike '%' || trim(search_text) || '%'
      or spp.service_description ilike '%' || trim(search_text) || '%'
      or p.full_name ilike '%' || trim(search_text) || '%'
      or exists (select 1 from unnest(spp.specialties) item where item ilike '%' || trim(search_text) || '%'))
    and (target_category is null or exists (
      select 1 from public.service_provider_categories spc
      join public.service_categories selected on selected.id = target_category
      join public.service_categories linked on linked.id = spc.category_id
      where spc.provider_id = spp.id and (linked.id = selected.id or linked.parent_id = selected.id)))
    and (target_city is null or trim(target_city) = '' or lower(coalesce(area.city, p.city)) = lower(trim(target_city)))
    and (target_mode is null or spp.service_mode = target_mode or spp.service_mode = 'both')
    and (minimum_rating is null or spp.rating_average >= minimum_rating)
  order by spp.rating_average desc, spp.rating_count desc, spp.approved_at desc nulls last
  limit least(greatest(result_limit, 1), 60) offset greatest(result_offset, 0);
$$;

create or replace function public.get_service_provider_public(target_provider_id uuid)
returns table (
  provider_id uuid, full_name text, avatar_path text, professional_title text,
  service_description text, specialties text[], service_mode public.service_mode,
  pricing_model public.service_pricing_model, starting_price numeric, availability text,
  experience_description text, rating_average numeric, rating_count integer,
  city text, state text, category_names text[]
) language sql stable security definer set search_path = public
as $$
  select spp.id, p.full_name, pr.avatar_path, spp.professional_title, spp.service_description,
    spp.specialties, spp.service_mode, spp.pricing_model, spp.starting_price, spp.availability,
    spp.experience_description, spp.rating_average, spp.rating_count,
    coalesce(area.city, p.city), coalesce(area.state, p.state), coalesce(categories.names, '{}')
  from public.service_provider_profiles spp
  join public.professionals p on p.id = spp.professional_id
  join public.profiles pr on pr.id = p.user_id
  left join lateral (
    select spa.city, spa.state from public.service_provider_areas spa
    where spa.provider_id = spp.id order by spa.created_at limit 1
  ) area on true
  left join lateral (
    select array_agg(sc.name order by sc.display_order, sc.name) names
    from public.service_provider_categories spc
    join public.service_categories sc on sc.id = spc.category_id and sc.is_active
    where spc.provider_id = spp.id
  ) categories on true
  where public.is_feature_enabled('marketplace_services')
    and spp.id = target_provider_id and spp.status = 'approved' and p.deleted_at is null;
$$;

-- Cursos passam a ser exclusivamente administrativos. O histórico de
-- certificações é preservado, mas profissionais não podem abrir prova,
-- registrar vídeo nem enviar novas tentativas por chamada direta à API.
revoke execute on function public.get_published_course_quiz(uuid) from authenticated;
revoke execute on function public.submit_course_attempt(uuid, jsonb) from authenticated;
revoke execute on function public.record_course_video_progress(uuid, numeric, numeric) from authenticated;
