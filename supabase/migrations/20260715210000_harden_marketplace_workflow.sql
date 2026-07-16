-- Harden mutable marketplace records and make the service state machine authoritative.

drop policy if exists "provider portfolio owner manage" on public.service_provider_portfolio;
create policy "provider portfolio owner insert" on public.service_provider_portfolio
for insert to authenticated
with check (public.marketplace_provider_owner(provider_id) and moderation_status = 'pending');
create policy "provider portfolio owner update pending" on public.service_provider_portfolio
for update to authenticated
using (public.marketplace_provider_owner(provider_id))
with check (public.marketplace_provider_owner(provider_id) and moderation_status = 'pending');
create policy "provider portfolio owner delete" on public.service_provider_portfolio
for delete to authenticated
using (public.marketplace_provider_owner(provider_id));
create policy "provider portfolio admin manage" on public.service_provider_portfolio
for all to authenticated
using (public.is_admin()) with check (public.is_admin());

revoke update, delete on table public.marketplace_messages from authenticated;
grant select, insert on table public.marketplace_messages to authenticated;

revoke update, delete on table public.marketplace_conversations from authenticated;
grant select, insert on table public.marketplace_conversations to authenticated;

revoke insert, delete on table public.marketplace_notifications from authenticated;
grant select, update on table public.marketplace_notifications to authenticated;

create or replace function public.transition_service_request(
  target_request_id uuid,
  target_status public.service_request_status,
  target_note text default null
) returns void language plpgsql security definer set search_path = public
as $$
declare req public.service_requests%rowtype; is_client boolean; is_provider boolean;
begin
  select * into req from public.service_requests where id = target_request_id for update;
  if req.id is null then raise exception 'request_not_found'; end if;
  is_client := public.marketplace_client_owner(req.client_id);
  is_provider := public.marketplace_provider_owner(req.provider_id);
  if not (is_client or is_provider) then raise exception 'request_access_denied'; end if;

  if target_status in ('accepted', 'rejected') then
    if not is_provider or req.status <> 'awaiting_response' then raise exception 'invalid_request_transition'; end if;
  elsif target_status = 'in_progress' then
    if not is_provider or req.status <> 'accepted' then raise exception 'invalid_request_transition'; end if;
  elsif target_status = 'cancelled' then
    if req.status not in ('sent', 'awaiting_response', 'accepted', 'in_progress') then raise exception 'invalid_request_transition'; end if;
  elsif target_status = 'disputed' then
    if req.status not in ('accepted', 'in_progress') then raise exception 'invalid_request_transition'; end if;
  else
    -- Completed is exclusively produced by confirm_service_completion after both parties confirm.
    raise exception 'invalid_request_transition';
  end if;

  update public.service_requests set status = target_status, updated_at = timezone('utc', now()) where id = req.id;
  insert into public.service_request_events (request_id, actor_id, previous_status, new_status, note)
  values (req.id, auth.uid(), req.status, target_status, nullif(trim(target_note), ''));
end $$;

create or replace function public.mark_marketplace_conversation_read(target_conversation_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
declare conv public.marketplace_conversations%rowtype;
begin
  select * into conv from public.marketplace_conversations where id = target_conversation_id;
  if conv.id is null then raise exception 'conversation_not_found'; end if;
  if public.marketplace_client_owner(conv.client_id) then
    update public.marketplace_conversations set client_last_read_at = timezone('utc', now()) where id = conv.id;
  elsif public.marketplace_provider_owner(conv.provider_id) then
    update public.marketplace_conversations set provider_last_read_at = timezone('utc', now()) where id = conv.id;
  else raise exception 'conversation_access_denied'; end if;
  update public.marketplace_messages set read_at = timezone('utc', now())
  where conversation_id = conv.id and sender_id <> auth.uid() and read_at is null;
end $$;

revoke all on function public.mark_marketplace_conversation_read(uuid) from public, anon;
grant execute on function public.mark_marketplace_conversation_read(uuid) to authenticated;

create or replace function public.close_marketplace_conversation(target_conversation_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if not public.marketplace_conversation_participant(target_conversation_id) then raise exception 'conversation_access_denied'; end if;
  if exists (select 1 from public.service_requests where conversation_id = target_conversation_id and status in ('awaiting_response','accepted','in_progress','disputed')) then
    raise exception 'active_request_prevents_closing';
  end if;
  update public.marketplace_conversations set status = 'closed', updated_at = timezone('utc', now()) where id = target_conversation_id;
end $$;

revoke all on function public.close_marketplace_conversation(uuid) from public, anon;
grant execute on function public.close_marketplace_conversation(uuid) to authenticated;
