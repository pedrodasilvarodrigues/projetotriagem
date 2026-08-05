-- Web Push: subscriptions belong to an authenticated user and each notification
-- is copied to a server-only outbox. The private VAPID key never reaches Postgres
-- or the browser; it stays in the server environment.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  content_encoding text not null default 'aes128gcm',
  user_agent text,
  enabled boolean not null default true,
  last_success_at timestamptz,
  last_failure_at timestamptz,
  failure_count integer not null default 0 check (failure_count >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists push_subscriptions_user_enabled_idx
  on public.push_subscriptions (user_id, enabled)
  where enabled = true;

create table if not exists public.push_notification_outbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  body text not null check (char_length(body) between 1 and 500),
  url text not null default '/',
  source_table text not null,
  source_id uuid not null,
  status text not null default 'pending' check (status in ('pending', 'delivered', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  last_attempted_at timestamptz,
  processed_at timestamptz,
  last_error text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (source_table, source_id)
);

create index if not exists push_notification_outbox_pending_idx
  on public.push_notification_outbox (created_at)
  where status = 'pending';

alter table public.push_subscriptions enable row level security;
alter table public.push_notification_outbox enable row level security;

revoke all on table public.push_subscriptions, public.push_notification_outbox from anon;
grant select, insert, update, delete on table public.push_subscriptions to authenticated;

drop policy if exists "push subscriptions own select" on public.push_subscriptions;
create policy "push subscriptions own select" on public.push_subscriptions
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "push subscriptions own insert" on public.push_subscriptions;
create policy "push subscriptions own insert" on public.push_subscriptions
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "push subscriptions own update" on public.push_subscriptions;
create policy "push subscriptions own update" on public.push_subscriptions
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "push subscriptions own delete" on public.push_subscriptions;
create policy "push subscriptions own delete" on public.push_subscriptions
  for delete to authenticated using (user_id = auth.uid());

create or replace function public.web_push_default_path(target_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case coalesce((select role::text from public.user_roles where user_id = target_user_id), 'professional')
    when 'admin' then '/admin/notifications'
    when 'company' then '/company/notifications'
    when 'client' then '/client/notifications'
    else '/professional/notifications'
  end;
$$;

create or replace function public.enqueue_web_push_notification(
  target_user_id uuid,
  notification_title text,
  notification_body text,
  target_url text,
  event_source_table text,
  event_source_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.push_notification_outbox (
    user_id, title, body, url, source_table, source_id
  ) values (
    target_user_id,
    left(notification_title, 160),
    left(notification_body, 500),
    case when target_url like '/%' then target_url else public.web_push_default_path(target_user_id) end,
    event_source_table,
    event_source_id
  ) on conflict (source_table, source_id) do nothing;
end;
$$;

create or replace function public.enqueue_internal_notification_push()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.enqueue_web_push_notification(
    new.user_id, new.title, new.body, public.web_push_default_path(new.user_id), 'notifications', new.id
  );
  return new;
end;
$$;

create or replace function public.enqueue_marketplace_notification_push()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.enqueue_web_push_notification(
    new.user_id, new.title, new.body, new.link_path, 'marketplace_notifications', new.id
  );
  return new;
end;
$$;

drop trigger if exists notifications_enqueue_web_push on public.notifications;
create trigger notifications_enqueue_web_push
after insert on public.notifications
for each row execute function public.enqueue_internal_notification_push();

drop trigger if exists marketplace_notifications_enqueue_web_push on public.marketplace_notifications;
create trigger marketplace_notifications_enqueue_web_push
after insert on public.marketplace_notifications
for each row execute function public.enqueue_marketplace_notification_push();

create or replace function public.claim_push_notification_jobs(batch_size integer default 25)
returns table (
  id uuid,
  user_id uuid,
  title text,
  body text,
  url text,
  attempts integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with candidates as (
    select queue.id
    from public.push_notification_outbox queue
    where queue.status = 'pending'
      and queue.attempts < 3
      and (queue.last_attempted_at is null or queue.last_attempted_at < timezone('utc', now()) - interval '1 minute')
    order by queue.created_at
    for update skip locked
    limit greatest(1, least(batch_size, 100))
  ), claimed as (
    update public.push_notification_outbox queue
    set attempts = queue.attempts + 1,
        last_attempted_at = timezone('utc', now())
    from candidates
    where queue.id = candidates.id
    returning queue.id, queue.user_id, queue.title, queue.body, queue.url, queue.attempts
  )
  select claimed.id, claimed.user_id, claimed.title, claimed.body, claimed.url, claimed.attempts from claimed;
end;
$$;

revoke all on function public.claim_push_notification_jobs(integer) from public, anon, authenticated;
grant execute on function public.claim_push_notification_jobs(integer) to service_role;

drop trigger if exists push_subscriptions_updated_at on public.push_subscriptions;
create trigger push_subscriptions_updated_at
before update on public.push_subscriptions
for each row execute function public.set_updated_at();
