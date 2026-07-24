create or replace function public.is_service_cpf_banned(target_cpf text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.banned_cpfs blocked
    where blocked.cpf = regexp_replace(coalesce(target_cpf, ''), '[^0-9]', '', 'g')
  );
$$;

revoke all on function public.is_service_cpf_banned(text) from public, anon, authenticated;

create or replace function public.enforce_service_activation_allowed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  professional_cpf text;
  provider_status public.service_provider_status;
begin
  if not new.provides_services then
    return new;
  end if;

  select
    regexp_replace(coalesce(professional.cpf, ''), '[^0-9]', '', 'g'),
    provider.status
  into professional_cpf, provider_status
  from public.professionals professional
  left join public.service_provider_profiles provider on provider.professional_id = professional.id
  where professional.id = new.professional_id;

  if length(professional_cpf) <> 11 then
    raise exception 'service_cpf_required';
  end if;
  if provider_status = 'banned' or public.is_service_cpf_banned(professional_cpf) then
    raise exception 'service_activation_blocked';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_service_activation_allowed() from public, anon, authenticated;

drop trigger if exists enforce_service_activation_allowed_trigger on public.professional_capabilities;
create trigger enforce_service_activation_allowed_trigger
before insert or update of provides_services on public.professional_capabilities
for each row execute function public.enforce_service_activation_allowed();

create or replace function public.submit_service_provider_profile(
  target_title text,
  target_description text,
  target_specialties text[],
  target_mode public.service_mode,
  target_pricing public.service_pricing_model,
  target_starting_price numeric,
  target_availability text,
  target_experience text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_professional uuid;
  professional_cpf text;
  current_status public.service_provider_status;
  result_id uuid;
begin
  select
    professional.id,
    regexp_replace(coalesce(professional.cpf, ''), '[^0-9]', '', 'g'),
    provider.status
  into target_professional, professional_cpf, current_status
  from public.professionals professional
  left join public.service_provider_profiles provider on provider.professional_id = professional.id
  where professional.user_id = auth.uid() and professional.deleted_at is null
  limit 1;

  if target_professional is null then
    raise exception 'professional_profile_required';
  end if;
  if length(professional_cpf) <> 11 then
    raise exception 'service_cpf_required';
  end if;
  if current_status = 'banned' or public.is_service_cpf_banned(professional_cpf) then
    raise exception 'service_activation_blocked';
  end if;
  if char_length(trim(target_title)) < 3 or char_length(trim(target_description)) < 20 then
    raise exception 'invalid_provider_profile';
  end if;

  insert into public.professional_capabilities (professional_id, provides_services)
  values (target_professional, true)
  on conflict (professional_id) do update
  set provides_services = true, updated_at = timezone('utc', now());

  insert into public.service_provider_profiles (
    professional_id,
    professional_title,
    service_description,
    specialties,
    service_mode,
    pricing_model,
    starting_price,
    availability,
    experience_description,
    status,
    rejection_reason,
    suspension_reason,
    submitted_at
  )
  values (
    target_professional,
    trim(target_title),
    trim(target_description),
    coalesce(target_specialties, '{}'),
    target_mode,
    target_pricing,
    target_starting_price,
    nullif(trim(target_availability), ''),
    nullif(trim(target_experience), ''),
    'pending',
    null,
    null,
    timezone('utc', now())
  )
  on conflict (professional_id) do update
  set
    professional_title = excluded.professional_title,
    service_description = excluded.service_description,
    specialties = excluded.specialties,
    service_mode = excluded.service_mode,
    pricing_model = excluded.pricing_model,
    starting_price = excluded.starting_price,
    availability = excluded.availability,
    experience_description = excluded.experience_description,
    status = case
      when public.service_provider_profiles.status = 'suspended' then 'suspended'::public.service_provider_status
      else 'pending'::public.service_provider_status
    end,
    rejection_reason = case
      when public.service_provider_profiles.status = 'suspended'
        then public.service_provider_profiles.rejection_reason
      else null
    end,
    submitted_at = timezone('utc', now()),
    updated_at = timezone('utc', now())
  returning id into result_id;

  return result_id;
end;
$$;

revoke all on function public.submit_service_provider_profile(
  text,
  text,
  text[],
  public.service_mode,
  public.service_pricing_model,
  numeric,
  text,
  text
) from public, anon;

grant execute on function public.submit_service_provider_profile(
  text,
  text,
  text[],
  public.service_mode,
  public.service_pricing_model,
  numeric,
  text,
  text
) to authenticated;

create or replace function public.set_service_offering(target_enabled boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_professional uuid;
  professional_cpf text;
  current_status public.service_provider_status;
begin
  select
    professional.id,
    regexp_replace(coalesce(professional.cpf, ''), '[^0-9]', '', 'g'),
    provider.status
  into target_professional, professional_cpf, current_status
  from public.professionals professional
  left join public.service_provider_profiles provider on provider.professional_id = professional.id
  where professional.user_id = auth.uid() and professional.deleted_at is null
  limit 1;

  if target_professional is null then
    raise exception 'professional_profile_required';
  end if;

  if target_enabled then
    if length(professional_cpf) <> 11 then
      raise exception 'service_cpf_required';
    end if;
    if current_status = 'banned' or public.is_service_cpf_banned(professional_cpf) then
      raise exception 'service_activation_blocked';
    end if;
  end if;

  insert into public.professional_capabilities (professional_id, provides_services)
  values (target_professional, target_enabled)
  on conflict (professional_id) do update
  set provides_services = excluded.provides_services, updated_at = timezone('utc', now());

  if not target_enabled then
    update public.service_provider_profiles
    set
      status = case when status = 'banned' then status else 'not_requested' end,
      updated_at = timezone('utc', now())
    where professional_id = target_professional;
  else
    update public.service_provider_profiles
    set
      status = case
        when status = 'suspended' then status
        else 'pending'::public.service_provider_status
      end,
      submitted_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
    where professional_id = target_professional;
  end if;
end;
$$;

revoke all on function public.set_service_offering(boolean) from public, anon;
grant execute on function public.set_service_offering(boolean) to authenticated;

create or replace function public.create_service_conversation_review(
  target_conversation_id uuid,
  target_rating integer,
  target_comment text default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  conversation public.marketplace_conversations%rowtype;
  result_id uuid;
  normalized_comment text := nullif(trim(target_comment), '');
begin
  select *
  into conversation
  from public.marketplace_conversations
  where id = target_conversation_id;

  if conversation.id is null or conversation.requester_user_id <> auth.uid() then
    raise exception 'requester_conversation_required';
  end if;
  if target_rating not between 1 and 5 then
    raise exception 'invalid_rating';
  end if;
  if normalized_comment is not null and char_length(normalized_comment) > 2000 then
    raise exception 'review_comment_too_long';
  end if;

  insert into public.service_reviews (
    conversation_id,
    evaluator_user_id,
    provider_id,
    rating,
    comment
  )
  values (
    conversation.id,
    auth.uid(),
    conversation.provider_id,
    target_rating,
    normalized_comment
  )
  returning id into result_id;

  return result_id;
end;
$$;

revoke all on function public.create_service_conversation_review(uuid, integer, text) from public, anon;
grant execute on function public.create_service_conversation_review(uuid, integer, text) to authenticated;

create or replace function public.refresh_service_provider_rating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_provider uuid := coalesce(new.provider_id, old.provider_id);
  review_count integer;
  average_rating numeric;
  recent_low_count integer;
  professional_cpf text;
  provider_user_id uuid;
  reputation_reason text;
begin
  -- Serializa avaliações simultâneas do mesmo prestador antes do agregado.
  perform 1
  from public.service_provider_profiles
  where id = target_provider
  for update;

  select count(*), coalesce(round(avg(review.rating)::numeric, 2), 0)
  into review_count, average_rating
  from public.service_reviews review
  where review.provider_id = target_provider
    and review.moderation_status = 'approved';

  update public.service_provider_profiles
  set
    rating_average = average_rating,
    rating_count = review_count,
    updated_at = timezone('utc', now())
  where id = target_provider;

  if tg_op <> 'INSERT' or review_count < 3 then
    return coalesce(new, old);
  end if;

  select count(*) filter (where recent.rating <= 3)
  into recent_low_count
  from (
    select review.rating
    from public.service_reviews review
    where review.provider_id = target_provider
      and review.moderation_status = 'approved'
    order by review.created_at desc, review.id desc
    limit 3
  ) recent;

  if recent_low_count < 3 and average_rating > 3 then
    return new;
  end if;

  select
    regexp_replace(coalesce(professional.cpf, ''), '[^0-9]', '', 'g'),
    professional.user_id
  into professional_cpf, provider_user_id
  from public.service_provider_profiles provider
  join public.professionals professional on professional.id = provider.professional_id
  where provider.id = target_provider;

  reputation_reason := case
    when recent_low_count = 3 and average_rating <= 3
      then 'reputação abaixo do limite mínimo: média geral e 3 avaliações recentes'
    when recent_low_count = 3
      then 'reputação abaixo do limite mínimo: 3 avaliações recentes'
    else 'reputação abaixo do limite mínimo: média geral'
  end;

  update public.service_provider_profiles
  set
    status = 'banned',
    banned_at = coalesce(banned_at, timezone('utc', now())),
    ban_reason = reputation_reason,
    rejection_reason = null,
    suspension_reason = null,
    updated_at = timezone('utc', now())
  where id = target_provider
    and status <> 'banned';

  update public.professional_capabilities
  set provides_services = false, updated_at = timezone('utc', now())
  where professional_id = (
    select provider.professional_id
    from public.service_provider_profiles provider
    where provider.id = target_provider
  );

  if length(professional_cpf) = 11 then
    insert into public.banned_cpfs (cpf, provider_id_original, reason)
    values (professional_cpf, target_provider, reputation_reason)
    on conflict (cpf) do nothing;
  end if;

  insert into public.marketplace_moderation_actions (
    admin_id,
    target_user_id,
    action_type,
    reason,
    metadata
  )
  values (
    null,
    provider_user_id,
    'ban',
    reputation_reason,
    jsonb_build_object(
      'provider_id', target_provider,
      'review_count', review_count,
      'average_rating', average_rating,
      'recent_low_count', recent_low_count,
      'automatic', true
    )
  );

  insert into public.marketplace_notifications (
    user_id,
    notification_type,
    title,
    body,
    link_path,
    metadata
  )
  values (
    provider_user_id,
    'provider_banned',
    'Função de prestador encerrada',
    'Seu acesso à oferta de serviços foi encerrado por reputação abaixo do limite mínimo. Seu currículo e sua participação em vagas continuam ativos.',
    '/professional/services',
    jsonb_build_object('provider_id', target_provider)
  );

  return new;
end;
$$;

revoke all on function public.refresh_service_provider_rating() from public, anon, authenticated;

drop trigger if exists refresh_service_provider_rating_trigger on public.service_reviews;
create trigger refresh_service_provider_rating_trigger
after insert or update or delete on public.service_reviews
for each row execute function public.refresh_service_provider_rating();

create or replace function public.provider_service_management_allowed(target_provider_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.service_provider_profiles provider
    where provider.id = target_provider_id
      and provider.status <> 'banned'
  );
$$;

revoke all on function public.provider_service_management_allowed(uuid) from public, anon;
grant execute on function public.provider_service_management_allowed(uuid) to authenticated;

drop policy if exists "banned provider profile immutable" on public.service_provider_profiles;
create policy "banned provider profile immutable"
on public.service_provider_profiles
as restrictive
for update
to authenticated
using (status <> 'banned')
with check (status <> 'banned');

drop policy if exists "banned provider categories immutable" on public.service_provider_categories;
create policy "banned provider categories immutable"
on public.service_provider_categories
as restrictive
for all
to authenticated
using (public.provider_service_management_allowed(provider_id))
with check (public.provider_service_management_allowed(provider_id));

drop policy if exists "banned provider areas immutable" on public.service_provider_areas;
create policy "banned provider areas immutable"
on public.service_provider_areas
as restrictive
for all
to authenticated
using (public.provider_service_management_allowed(provider_id))
with check (public.provider_service_management_allowed(provider_id));

drop policy if exists "banned provider portfolio immutable" on public.service_provider_portfolio;
create policy "banned provider portfolio immutable"
on public.service_provider_portfolio
as restrictive
for all
to authenticated
using (public.provider_service_management_allowed(provider_id))
with check (public.provider_service_management_allowed(provider_id));

create or replace function public.admin_moderate_service_provider(
  target_provider_id uuid,
  target_status public.service_provider_status,
  target_reason text default null
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user uuid;
  previous_status public.service_provider_status;
  normalized_reason text := nullif(trim(target_reason), '');
  moderation_action text;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'admin_required';
  end if;

  select professional.user_id, provider.status
  into target_user, previous_status
  from public.service_provider_profiles provider
  join public.professionals professional on professional.id = provider.professional_id
  where provider.id = target_provider_id
  for update of provider;

  if target_user is null then
    raise exception 'provider_not_found';
  end if;
  if previous_status = 'banned' then
    raise exception 'provider_banned';
  end if;
  if target_status not in ('approved', 'rejected', 'suspended', 'pending') then
    raise exception 'invalid_status';
  end if;
  if target_status in ('rejected', 'suspended') and normalized_reason is null then
    raise exception 'moderation_reason_required';
  end if;

  update public.service_provider_profiles
  set
    status = target_status,
    rejection_reason = case when target_status = 'rejected' then normalized_reason else null end,
    suspension_reason = case when target_status = 'suspended' then normalized_reason else null end,
    approved_at = case when target_status = 'approved' then timezone('utc', now()) else approved_at end,
    approved_by = case when target_status = 'approved' then auth.uid() else approved_by end,
    updated_at = timezone('utc', now())
  where id = target_provider_id;

  moderation_action := case
    when target_status = 'approved' and previous_status = 'suspended' then 'reactivate'
    when target_status = 'approved' then 'approve'
    when target_status = 'rejected' then 'reject'
    when target_status = 'suspended' then 'suspend'
    else 'reactivate'
  end;

  insert into public.marketplace_moderation_actions (
    admin_id,
    target_user_id,
    action_type,
    reason,
    metadata
  )
  values (
    auth.uid(),
    target_user,
    moderation_action,
    normalized_reason,
    jsonb_build_object(
      'provider_id', target_provider_id,
      'previous_status', previous_status,
      'new_status', target_status
    )
  );

  insert into public.marketplace_notifications (
    user_id,
    notification_type,
    title,
    body,
    link_path
  )
  values (
    target_user,
    'provider_status',
    'Status do perfil de prestador atualizado',
    case
      when target_status = 'approved' then 'Seu perfil foi aprovado e já está visível.'
      when target_status = 'rejected' then 'Seu perfil precisa de ajustes: ' || normalized_reason
      when target_status = 'suspended' then 'Seu perfil foi suspenso: ' || normalized_reason
      else 'Seu perfil voltou para análise.'
    end,
    '/professional/services'
  );
end;
$$;

revoke all on function public.admin_moderate_service_provider(
  uuid,
  public.service_provider_status,
  text
) from public, anon;

grant execute on function public.admin_moderate_service_provider(
  uuid,
  public.service_provider_status,
  text
) to authenticated;
