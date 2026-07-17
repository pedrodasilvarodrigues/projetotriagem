-- Align course completion proof and marketplace requester/review rules with the production MVP.

create or replace function public.course_video_completion_threshold()
returns numeric language sql immutable set search_path = public as $$ select 90::numeric $$;
revoke all on function public.course_video_completion_threshold() from public, anon;
grant execute on function public.course_video_completion_threshold() to authenticated, service_role;

create table if not exists public.course_video_progress (
  course_id uuid not null references public.courses(id) on delete cascade,
  professional_id uuid not null references public.professionals(id) on delete cascade,
  watched_percent numeric(5,2) not null default 0 check (watched_percent between 0 and 100),
  completed boolean not null default false,
  last_position_seconds numeric(12,2) not null default 0 check (last_position_seconds >= 0),
  duration_seconds numeric(12,2) check (duration_seconds is null or duration_seconds > 0),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (course_id, professional_id)
);
alter table public.course_video_progress enable row level security;
revoke all on table public.course_video_progress from anon, authenticated;
grant select on table public.course_video_progress to authenticated;
create policy "course progress own or admin read" on public.course_video_progress
for select to authenticated using (
  public.is_admin() or exists (
    select 1 from public.professionals p where p.id = professional_id and p.user_id = auth.uid()
  )
);

create or replace function public.record_course_video_progress(
  target_course_id uuid,
  target_position_seconds numeric,
  target_duration_seconds numeric
) returns numeric language plpgsql security definer set search_path = public
as $$
declare target_professional uuid; computed_percent numeric;
begin
  if not public.is_professional_user() or not public.is_published_course(target_course_id) then
    raise exception 'course_video_access_denied';
  end if;
  if target_duration_seconds is null or target_duration_seconds <= 0 or target_position_seconds < 0 then
    raise exception 'invalid_video_progress';
  end if;
  select id into target_professional from public.professionals where user_id = auth.uid() and deleted_at is null limit 1;
  if target_professional is null then raise exception 'professional_profile_required'; end if;
  computed_percent := least(100, greatest(0, round((target_position_seconds / target_duration_seconds) * 100, 2)));
  insert into public.course_video_progress (course_id, professional_id, watched_percent, completed, last_position_seconds, duration_seconds)
  values (target_course_id, target_professional, computed_percent, computed_percent >= public.course_video_completion_threshold(), target_position_seconds, target_duration_seconds)
  on conflict (course_id, professional_id) do update set
    watched_percent = greatest(public.course_video_progress.watched_percent, excluded.watched_percent),
    completed = public.course_video_progress.completed or excluded.completed,
    last_position_seconds = greatest(public.course_video_progress.last_position_seconds, excluded.last_position_seconds),
    duration_seconds = excluded.duration_seconds,
    updated_at = timezone('utc', now());
  select watched_percent into computed_percent from public.course_video_progress
  where course_id = target_course_id and professional_id = target_professional;
  return computed_percent;
end $$;
revoke all on function public.record_course_video_progress(uuid,numeric,numeric) from public, anon;
grant execute on function public.record_course_video_progress(uuid,numeric,numeric) to authenticated;

create or replace function public.get_published_course_quiz(target_course_id uuid)
returns table (question_id uuid, question_prompt text, question_position integer, option_id uuid, option_text text, option_position integer)
language sql security definer set search_path = public stable
as $$
  select q.id, q.prompt, q.position, o.id, o.option_text, o.position
  from public.course_quiz_questions q
  join public.course_quiz_options o on o.question_id = q.id
  where q.course_id = target_course_id
    and public.is_professional_user()
    and public.is_published_course(target_course_id)
    and exists (
      select 1 from public.course_video_progress cvp
      join public.professionals p on p.id = cvp.professional_id
      where cvp.course_id = target_course_id and p.user_id = auth.uid()
        and cvp.watched_percent >= public.course_video_completion_threshold()
    )
  order by q.position, o.position;
$$;
revoke all on function public.get_published_course_quiz(uuid) from public, anon;
grant execute on function public.get_published_course_quiz(uuid) to authenticated;

create or replace function public.enforce_course_video_completion()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from public.course_video_progress cvp
    where cvp.course_id = new.course_id and cvp.professional_id = new.professional_id
      and cvp.watched_percent >= public.course_video_completion_threshold()
  ) then raise exception 'course_video_not_completed'; end if;
  new.watched_video := true;
  return new;
end $$;
revoke all on function public.enforce_course_video_completion() from public, anon, authenticated;
drop trigger if exists enforce_course_video_completion_trigger on public.course_attempts;
create trigger enforce_course_video_completion_trigger before insert on public.course_attempts
for each row execute function public.enforce_course_video_completion();

-- A requester can be either a client account or a professional account.
alter table public.marketplace_conversations add column if not exists requester_user_id uuid references auth.users(id) on delete restrict;
update public.marketplace_conversations mc set requester_user_id = cp.user_id
from public.client_profiles cp where cp.id = mc.client_id and mc.requester_user_id is null;
alter table public.marketplace_conversations alter column requester_user_id set not null;
alter table public.marketplace_conversations alter column client_id drop not null;
drop index if exists public.marketplace_open_conversation_pair_idx;
create unique index if not exists marketplace_open_requester_provider_idx
on public.marketplace_conversations (requester_user_id, provider_id) where status = 'open';

alter table public.service_reviews add column if not exists conversation_id uuid references public.marketplace_conversations(id) on delete restrict;
alter table public.service_reviews add column if not exists evaluator_user_id uuid references auth.users(id) on delete restrict;
update public.service_reviews r set conversation_id = sr.conversation_id
from public.service_requests sr where sr.id = r.request_id and r.conversation_id is null;
update public.service_reviews r set evaluator_user_id = cp.user_id
from public.client_profiles cp where cp.id = r.client_id and r.evaluator_user_id is null;
alter table public.service_reviews alter column request_id drop not null;
alter table public.service_reviews alter column client_id drop not null;
alter table public.service_reviews alter column conversation_id set not null;
alter table public.service_reviews alter column evaluator_user_id set not null;
alter table public.service_reviews drop constraint if exists service_reviews_request_id_key;
create unique index if not exists service_reviews_conversation_evaluator_idx on public.service_reviews (conversation_id, evaluator_user_id);

create or replace function public.marketplace_conversation_participant(target_conversation_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from public.marketplace_conversations mc
  left join public.service_provider_profiles spp on spp.id = mc.provider_id
  left join public.professionals p on p.id = spp.professional_id
  where mc.id = target_conversation_id and (mc.requester_user_id = auth.uid() or p.user_id = auth.uid())
) $$;
revoke all on function public.marketplace_conversation_participant(uuid) from public, anon;
grant execute on function public.marketplace_conversation_participant(uuid) to authenticated;

drop policy if exists "conversations participants" on public.marketplace_conversations;
drop policy if exists "conversations client create" on public.marketplace_conversations;
create policy "conversations participants" on public.marketplace_conversations
for select to authenticated using (public.is_admin() or public.marketplace_conversation_participant(id));
create policy "conversations requester create" on public.marketplace_conversations
for insert to authenticated with check (requester_user_id = auth.uid() and status = 'open');

drop policy if exists "reviews public approved" on public.service_reviews;
create policy "reviews public approved" on public.service_reviews
for select to anon, authenticated using (
  moderation_status = 'approved' or public.is_admin() or evaluator_user_id = auth.uid() or public.marketplace_provider_owner(provider_id)
);

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

create or replace function public.create_service_conversation_review(
  target_conversation_id uuid, target_rating integer, target_comment text default null
) returns uuid language plpgsql security definer set search_path = public
as $$
declare conv public.marketplace_conversations%rowtype; result_id uuid;
begin
  select * into conv from public.marketplace_conversations where id = target_conversation_id;
  if conv.id is null or conv.requester_user_id <> auth.uid() then raise exception 'requester_conversation_required'; end if;
  if target_rating not between 1 and 5 then raise exception 'invalid_rating'; end if;
  insert into public.service_reviews (conversation_id, evaluator_user_id, provider_id, rating, comment)
  values (conv.id, auth.uid(), conv.provider_id, target_rating, nullif(trim(target_comment), ''))
  returning id into result_id;
  return result_id;
end $$;
revoke all on function public.create_service_conversation_review(uuid,integer,text) from public, anon;
grant execute on function public.create_service_conversation_review(uuid,integer,text) to authenticated;

create or replace function public.refresh_service_provider_rating()
returns trigger language plpgsql security definer set search_path = public
as $$
declare target_provider uuid;
begin
  target_provider := coalesce(new.provider_id, old.provider_id);
  update public.service_provider_profiles spp set
    rating_average = coalesce((select round(avg(r.rating)::numeric, 2) from public.service_reviews r where r.provider_id = target_provider and r.moderation_status = 'approved'), 0),
    rating_count = (select count(*) from public.service_reviews r where r.provider_id = target_provider and r.moderation_status = 'approved'),
    updated_at = timezone('utc', now())
  where spp.id = target_provider;
  return coalesce(new, old);
end $$;
revoke all on function public.refresh_service_provider_rating() from public, anon, authenticated;
drop trigger if exists refresh_service_provider_rating_trigger on public.service_reviews;
create trigger refresh_service_provider_rating_trigger after insert or update or delete on public.service_reviews
for each row execute function public.refresh_service_provider_rating();

create or replace function public.set_service_offering(target_enabled boolean)
returns void language plpgsql security definer set search_path = public
as $$
declare target_professional uuid;
begin
  select id into target_professional from public.professionals where user_id = auth.uid() and deleted_at is null limit 1;
  if target_professional is null then raise exception 'professional_profile_required'; end if;
  insert into public.professional_capabilities (professional_id, provides_services)
  values (target_professional, target_enabled)
  on conflict (professional_id) do update set provides_services = excluded.provides_services, updated_at = timezone('utc', now());
  if not target_enabled then
    update public.service_provider_profiles set status = 'not_requested', updated_at = timezone('utc', now()) where professional_id = target_professional;
  else
    update public.service_provider_profiles set status = case when status = 'suspended' then status else 'pending' end,
      submitted_at = timezone('utc', now()), updated_at = timezone('utc', now())
    where professional_id = target_professional;
  end if;
end $$;
revoke all on function public.set_service_offering(boolean) from public, anon;
grant execute on function public.set_service_offering(boolean) to authenticated;

create or replace function public.notify_marketplace_message()
returns trigger language plpgsql security definer set search_path = public
as $$
declare conv public.marketplace_conversations%rowtype; recipient uuid; provider_user uuid;
begin
  select * into conv from public.marketplace_conversations where id = new.conversation_id;
  select p.user_id into provider_user from public.service_provider_profiles spp
  join public.professionals p on p.id = spp.professional_id where spp.id = conv.provider_id;
  recipient := case when new.sender_id = conv.requester_user_id then provider_user else conv.requester_user_id end;
  update public.marketplace_conversations set last_message_at = new.created_at, updated_at = new.created_at where id = new.conversation_id;
  insert into public.marketplace_notifications (user_id, notification_type, title, body, link_path, metadata)
  values (recipient, 'new_message', 'Nova mensagem de serviço', left(new.body, 160),
    '/marketplace/conversations/' || new.conversation_id, jsonb_build_object('conversation_id', new.conversation_id));
  return new;
end $$;
revoke all on function public.notify_marketplace_message() from public, anon, authenticated;

-- Compatibility aliases requested by product language, without duplicating stored data.
create or replace view public.service_conversations with (security_invoker = true) as select * from public.marketplace_conversations;
create or replace view public.service_messages with (security_invoker = true) as select * from public.marketplace_messages;
create or replace view public.service_reports with (security_invoker = true) as select * from public.marketplace_reports;
grant select on public.service_conversations, public.service_messages, public.service_reports to authenticated;
