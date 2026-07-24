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

  if target_status not in ('approved', 'rejected', 'suspended', 'pending') then
    raise exception 'invalid_status';
  end if;

  if target_status in ('rejected', 'suspended') and normalized_reason is null then
    raise exception 'moderation_reason_required';
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
