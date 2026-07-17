create or replace function public.start_marketplace_conversation(target_provider_id uuid)
returns uuid language plpgsql security definer set search_path = public
as $$
declare target_client uuid; provider_user uuid; result_id uuid; requester_role public.user_role;
begin
  select ur.role into requester_role from public.user_roles ur where ur.user_id = auth.uid();
  if requester_role not in ('client','professional') then raise exception 'marketplace_requester_required'; end if;
  select p.user_id into provider_user from public.service_provider_profiles spp
  join public.professionals p on p.id = spp.professional_id
  join public.professional_capabilities pc on pc.professional_id = p.id and pc.provides_services
  where spp.id = target_provider_id and spp.status = 'approved';
  if provider_user is null then raise exception 'provider_unavailable'; end if;
  if provider_user = auth.uid() then raise exception 'cannot_contact_own_provider_profile'; end if;
  if requester_role = 'client' then
    select id into target_client from public.client_profiles where user_id = auth.uid() and deleted_at is null;
    if target_client is null then raise exception 'client_profile_required'; end if;
  end if;
  select id into result_id from public.marketplace_conversations
  where requester_user_id = auth.uid() and provider_id = target_provider_id and status = 'open' limit 1;
  if result_id is null then
    insert into public.marketplace_conversations (client_id, requester_user_id, provider_id)
    values (target_client, auth.uid(), target_provider_id) returning id into result_id;
  end if;
  return result_id;
end $$;
revoke all on function public.start_marketplace_conversation(uuid) from public, anon;
grant execute on function public.start_marketplace_conversation(uuid) to authenticated;
