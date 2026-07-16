create extension if not exists pg_trgm with schema extensions;

do $$ begin
  create type public.service_provider_status as enum ('not_requested', 'pending', 'approved', 'rejected', 'suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.service_mode as enum ('in_person', 'remote', 'both');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.service_pricing_model as enum ('fixed', 'hourly', 'quote', 'negotiable');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.marketplace_conversation_status as enum ('open', 'closed', 'blocked');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.service_request_status as enum ('sent', 'awaiting_response', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled', 'disputed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.marketplace_moderation_status as enum ('pending', 'approved', 'rejected', 'removed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.marketplace_report_type as enum ('provider_profile', 'portfolio', 'review', 'conversation', 'service_request', 'behavior');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.marketplace_report_status as enum ('open', 'under_review', 'resolved', 'archived');
exception when duplicate_object then null; end $$;

create table public.professional_capabilities (
  professional_id uuid primary key references public.professionals(id) on delete cascade,
  seeks_employment boolean not null default true,
  provides_services boolean not null default false,
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.professional_capabilities (professional_id)
select id from public.professionals
on conflict (professional_id) do nothing;

drop policy if exists "roles self choose onboarding" on public.user_roles;
create policy "roles self choose onboarding" on public.user_roles
for insert to authenticated
with check (user_id = auth.uid() and role in ('company', 'professional', 'client'));

drop policy if exists "roles self update onboarding" on public.user_roles;
create policy "roles self update onboarding" on public.user_roles
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid() and role in ('company', 'professional', 'client'));

create table public.client_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  city text not null default '',
  state text not null default '',
  region_name text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  check (latitude is null or latitude between -90 and 90),
  check (longitude is null or longitude between -180 and 180)
);

create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.service_categories(id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text,
  icon_name text,
  image_path text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (parent_id, name)
);

create table public.service_provider_profiles (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null unique references public.professionals(id) on delete cascade,
  professional_title text not null,
  service_description text not null,
  specialties text[] not null default '{}',
  service_mode public.service_mode not null default 'in_person',
  pricing_model public.service_pricing_model not null default 'negotiable',
  starting_price numeric(12,2) check (starting_price is null or starting_price >= 0),
  availability text,
  experience_description text,
  status public.service_provider_status not null default 'pending',
  rejection_reason text,
  suspension_reason text,
  submitted_at timestamptz not null default timezone('utc', now()),
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  rating_average numeric(3,2) not null default 0 check (rating_average between 0 and 5),
  rating_count integer not null default 0 check (rating_count >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (char_length(trim(professional_title)) >= 3),
  check (char_length(trim(service_description)) >= 20)
);

create table public.service_provider_categories (
  provider_id uuid not null references public.service_provider_profiles(id) on delete cascade,
  category_id uuid not null references public.service_categories(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (provider_id, category_id)
);

create table public.service_provider_areas (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.service_provider_profiles(id) on delete cascade,
  city text not null,
  state text not null,
  region_name text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  radius_km integer not null default 20 check (radius_km between 1 and 500),
  created_at timestamptz not null default timezone('utc', now()),
  check (latitude is null or latitude between -90 and 90),
  check (longitude is null or longitude between -180 and 180)
);

create table public.service_provider_portfolio (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.service_provider_profiles(id) on delete cascade,
  title text not null,
  description text,
  storage_path text not null,
  display_order integer not null default 0,
  moderation_status public.marketplace_moderation_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.marketplace_conversations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.client_profiles(id) on delete restrict,
  provider_id uuid not null references public.service_provider_profiles(id) on delete restrict,
  status public.marketplace_conversation_status not null default 'open',
  client_last_read_at timestamptz,
  provider_last_read_at timestamptz,
  last_message_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index marketplace_open_conversation_pair_idx
on public.marketplace_conversations (client_id, provider_id)
where status = 'open';

create table public.marketplace_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.marketplace_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 4000),
  read_at timestamptz,
  moderation_status public.marketplace_moderation_status not null default 'approved',
  created_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.marketplace_conversations(id) on delete restrict,
  client_id uuid not null references public.client_profiles(id) on delete restrict,
  provider_id uuid not null references public.service_provider_profiles(id) on delete restrict,
  title text not null,
  description text not null,
  status public.service_request_status not null default 'sent',
  pricing_model public.service_pricing_model not null default 'negotiable',
  proposed_amount numeric(12,2) check (proposed_amount is null or proposed_amount >= 0),
  currency char(3) not null default 'BRL',
  commercial_terms jsonb not null default '{}'::jsonb,
  client_completed_at timestamptz,
  provider_completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz
);

create table public.service_request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  previous_status public.service_request_status,
  new_status public.service_request_status not null,
  note text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.service_reviews (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.service_requests(id) on delete restrict,
  client_id uuid not null references public.client_profiles(id) on delete restrict,
  provider_id uuid not null references public.service_provider_profiles(id) on delete restrict,
  rating integer not null check (rating between 1 and 5),
  comment text,
  provider_response text,
  provider_responded_at timestamptz,
  moderation_status public.marketplace_moderation_status not null default 'approved',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.marketplace_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid references auth.users(id) on delete set null,
  report_type public.marketplace_report_type not null,
  provider_id uuid references public.service_provider_profiles(id) on delete set null,
  portfolio_id uuid references public.service_provider_portfolio(id) on delete set null,
  review_id uuid references public.service_reviews(id) on delete set null,
  conversation_id uuid references public.marketplace_conversations(id) on delete set null,
  request_id uuid references public.service_requests(id) on delete set null,
  reason text not null,
  description text,
  status public.marketplace_report_status not null default 'open',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  resolved_at timestamptz
);

create table public.marketplace_moderation_actions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.marketplace_reports(id) on delete set null,
  admin_id uuid not null references auth.users(id) on delete restrict,
  target_user_id uuid references auth.users(id) on delete set null,
  action_type text not null check (action_type in ('approve', 'reject', 'warn', 'suspend', 'reactivate', 'remove_content', 'archive_report')),
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.marketplace_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_type text not null,
  title text not null,
  body text not null,
  link_path text,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index service_categories_parent_order_idx on public.service_categories (parent_id, display_order) where is_active;
create index service_provider_status_rating_idx on public.service_provider_profiles (status, rating_average desc, rating_count desc);
create index service_provider_title_trgm_idx on public.service_provider_profiles using gin (professional_title extensions.gin_trgm_ops);
create index service_provider_categories_category_idx on public.service_provider_categories (category_id, provider_id);
create index service_provider_areas_location_idx on public.service_provider_areas (state, city, provider_id);
create index marketplace_messages_conversation_idx on public.marketplace_messages (conversation_id, created_at);
create index marketplace_messages_unread_idx on public.marketplace_messages (conversation_id, read_at) where read_at is null;
create index service_requests_client_idx on public.service_requests (client_id, created_at desc);
create index service_requests_provider_idx on public.service_requests (provider_id, created_at desc);
create index marketplace_reports_status_idx on public.marketplace_reports (status, created_at desc);
create index marketplace_notifications_user_idx on public.marketplace_notifications (user_id, read_at, created_at desc);

create or replace function public.marketplace_provider_owner(target_provider_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from public.service_provider_profiles spp
  join public.professionals p on p.id = spp.professional_id
  where spp.id = target_provider_id and p.user_id = auth.uid() and p.deleted_at is null
) $$;

create or replace function public.marketplace_client_owner(target_client_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from public.client_profiles cp
  where cp.id = target_client_id and cp.user_id = auth.uid() and cp.deleted_at is null
) $$;

create or replace function public.marketplace_conversation_participant(target_conversation_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from public.marketplace_conversations mc
  left join public.client_profiles cp on cp.id = mc.client_id
  left join public.service_provider_profiles spp on spp.id = mc.provider_id
  left join public.professionals p on p.id = spp.professional_id
  where mc.id = target_conversation_id
    and (cp.user_id = auth.uid() or p.user_id = auth.uid())
) $$;

revoke all on function public.marketplace_provider_owner(uuid) from public, anon;
revoke all on function public.marketplace_client_owner(uuid) from public, anon;
revoke all on function public.marketplace_conversation_participant(uuid) from public, anon;
grant execute on function public.marketplace_provider_owner(uuid) to authenticated;
grant execute on function public.marketplace_client_owner(uuid) to authenticated;
grant execute on function public.marketplace_conversation_participant(uuid) to authenticated;

alter table public.professional_capabilities enable row level security;
alter table public.client_profiles enable row level security;
alter table public.service_categories enable row level security;
alter table public.service_provider_profiles enable row level security;
alter table public.service_provider_categories enable row level security;
alter table public.service_provider_areas enable row level security;
alter table public.service_provider_portfolio enable row level security;
alter table public.marketplace_conversations enable row level security;
alter table public.marketplace_messages enable row level security;
alter table public.service_requests enable row level security;
alter table public.service_request_events enable row level security;
alter table public.service_reviews enable row level security;
alter table public.marketplace_reports enable row level security;
alter table public.marketplace_moderation_actions enable row level security;
alter table public.marketplace_notifications enable row level security;

create policy "professional capabilities owner or admin" on public.professional_capabilities
for all to authenticated
using (public.is_admin() or exists (select 1 from public.professionals p where p.id = professional_id and p.user_id = auth.uid()))
with check (public.is_admin() or exists (select 1 from public.professionals p where p.id = professional_id and p.user_id = auth.uid()));

create policy "client profiles owner or admin" on public.client_profiles
for all to authenticated
using (public.is_admin() or user_id = auth.uid())
with check (public.is_admin() or user_id = auth.uid());

create policy "service categories public read" on public.service_categories
for select to anon, authenticated using (is_active or public.is_admin());
create policy "service categories admin manage" on public.service_categories
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "service providers public approved or owner" on public.service_provider_profiles
for select to anon, authenticated
using (status = 'approved' or public.is_admin() or public.marketplace_provider_owner(id));

create policy "service providers owner insert" on public.service_provider_profiles
for insert to authenticated
with check (status = 'pending' and exists (select 1 from public.professionals p where p.id = professional_id and p.user_id = auth.uid()));

create policy "service providers owner update" on public.service_provider_profiles
for update to authenticated
using (public.is_admin() or public.marketplace_provider_owner(id))
with check (public.is_admin() or public.marketplace_provider_owner(id));

create policy "provider categories readable" on public.service_provider_categories
for select to anon, authenticated
using (exists (select 1 from public.service_provider_profiles spp where spp.id = provider_id and (spp.status = 'approved' or public.marketplace_provider_owner(spp.id) or public.is_admin())));
create policy "provider categories owner manage" on public.service_provider_categories
for all to authenticated using (public.is_admin() or public.marketplace_provider_owner(provider_id))
with check (public.is_admin() or public.marketplace_provider_owner(provider_id));

create policy "provider areas readable" on public.service_provider_areas
for select to anon, authenticated
using (exists (select 1 from public.service_provider_profiles spp where spp.id = provider_id and (spp.status = 'approved' or public.marketplace_provider_owner(spp.id) or public.is_admin())));
create policy "provider areas owner manage" on public.service_provider_areas
for all to authenticated using (public.is_admin() or public.marketplace_provider_owner(provider_id))
with check (public.is_admin() or public.marketplace_provider_owner(provider_id));

create policy "provider portfolio readable" on public.service_provider_portfolio
for select to anon, authenticated
using (
  (moderation_status = 'approved' and exists (select 1 from public.service_provider_profiles spp where spp.id = provider_id and spp.status = 'approved'))
  or public.marketplace_provider_owner(provider_id) or public.is_admin()
);
create policy "provider portfolio owner manage" on public.service_provider_portfolio
for all to authenticated using (public.is_admin() or public.marketplace_provider_owner(provider_id))
with check (public.is_admin() or public.marketplace_provider_owner(provider_id));

create policy "conversations participants" on public.marketplace_conversations
for select to authenticated using (public.is_admin() or public.marketplace_client_owner(client_id) or public.marketplace_provider_owner(provider_id));
create policy "conversations client create" on public.marketplace_conversations
for insert to authenticated with check (public.marketplace_client_owner(client_id) and status = 'open');
create policy "conversations participants update" on public.marketplace_conversations
for update to authenticated
using (public.is_admin() or public.marketplace_client_owner(client_id) or public.marketplace_provider_owner(provider_id))
with check (public.is_admin() or public.marketplace_client_owner(client_id) or public.marketplace_provider_owner(provider_id));

create policy "messages participants read" on public.marketplace_messages
for select to authenticated using (public.is_admin() or public.marketplace_conversation_participant(conversation_id));
create policy "messages participant send" on public.marketplace_messages
for insert to authenticated with check (
  sender_id = auth.uid()
  and public.marketplace_conversation_participant(conversation_id)
  and exists (select 1 from public.marketplace_conversations mc where mc.id = conversation_id and mc.status = 'open')
);
create policy "messages recipient mark read" on public.marketplace_messages
for update to authenticated using (public.marketplace_conversation_participant(conversation_id))
with check (public.marketplace_conversation_participant(conversation_id));

create policy "requests participants read" on public.service_requests
for select to authenticated using (public.is_admin() or public.marketplace_client_owner(client_id) or public.marketplace_provider_owner(provider_id));
create policy "request events participants read" on public.service_request_events
for select to authenticated using (
  public.is_admin() or exists (
    select 1 from public.service_requests sr
    where sr.id = request_id and (public.marketplace_client_owner(sr.client_id) or public.marketplace_provider_owner(sr.provider_id))
  )
);

create policy "reviews public approved" on public.service_reviews
for select to anon, authenticated
using (moderation_status = 'approved' or public.is_admin() or public.marketplace_client_owner(client_id) or public.marketplace_provider_owner(provider_id));

create policy "reports reporter or admin read" on public.marketplace_reports
for select to authenticated using (reporter_id = auth.uid() or public.is_admin());
create policy "reports authenticated create" on public.marketplace_reports
for insert to authenticated with check (reporter_id = auth.uid());
create policy "reports admin update" on public.marketplace_reports
for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "moderation actions admin read" on public.marketplace_moderation_actions
for select to authenticated using (public.is_admin());
create policy "moderation actions admin insert" on public.marketplace_moderation_actions
for insert to authenticated with check (public.is_admin() and admin_id = auth.uid());

create policy "marketplace notifications own" on public.marketplace_notifications
for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "marketplace notifications own update" on public.marketplace_notifications
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on table public.professional_capabilities, public.client_profiles, public.service_categories,
  public.service_provider_profiles, public.service_provider_categories, public.service_provider_areas,
  public.service_provider_portfolio, public.marketplace_conversations, public.marketplace_messages,
  public.service_requests, public.service_request_events, public.service_reviews, public.marketplace_reports,
  public.marketplace_moderation_actions, public.marketplace_notifications from anon, authenticated;

grant select on table public.service_categories, public.service_provider_profiles, public.service_provider_categories,
  public.service_provider_areas, public.service_provider_portfolio, public.service_reviews to anon;
grant select, insert, update, delete on table public.professional_capabilities, public.client_profiles,
  public.service_provider_categories, public.service_provider_areas,
  public.service_provider_portfolio, public.marketplace_conversations, public.marketplace_messages,
  public.marketplace_reports, public.marketplace_notifications to authenticated;
grant select on table public.service_provider_profiles to authenticated;
grant select on table public.service_categories, public.service_requests, public.service_request_events,
  public.service_reviews, public.marketplace_moderation_actions to authenticated;
grant insert, update, delete on table public.service_categories to authenticated;
grant insert, update on table public.marketplace_reports to authenticated;
grant insert on table public.marketplace_moderation_actions to authenticated;

create or replace function public.submit_service_provider_profile(
  target_title text,
  target_description text,
  target_specialties text[],
  target_mode public.service_mode,
  target_pricing public.service_pricing_model,
  target_starting_price numeric,
  target_availability text,
  target_experience text
) returns uuid language plpgsql security definer set search_path = public
as $$
declare target_professional uuid; result_id uuid;
begin
  select id into target_professional from public.professionals
  where user_id = auth.uid() and deleted_at is null limit 1;
  if target_professional is null then raise exception 'professional_profile_required'; end if;
  if char_length(trim(target_title)) < 3 or char_length(trim(target_description)) < 20 then
    raise exception 'invalid_provider_profile';
  end if;
  insert into public.professional_capabilities (professional_id, provides_services)
  values (target_professional, true)
  on conflict (professional_id) do update set provides_services = true, updated_at = timezone('utc', now());
  insert into public.service_provider_profiles (
    professional_id, professional_title, service_description, specialties, service_mode,
    pricing_model, starting_price, availability, experience_description, status,
    rejection_reason, suspension_reason, submitted_at
  ) values (
    target_professional, trim(target_title), trim(target_description), coalesce(target_specialties, '{}'),
    target_mode, target_pricing, target_starting_price, target_availability, target_experience,
    'pending', null, null, timezone('utc', now())
  )
  on conflict (professional_id) do update set
    professional_title = excluded.professional_title,
    service_description = excluded.service_description,
    specialties = excluded.specialties,
    service_mode = excluded.service_mode,
    pricing_model = excluded.pricing_model,
    starting_price = excluded.starting_price,
    availability = excluded.availability,
    experience_description = excluded.experience_description,
    status = case when public.service_provider_profiles.status = 'suspended' then 'suspended'::public.service_provider_status else 'pending'::public.service_provider_status end,
    rejection_reason = case when public.service_provider_profiles.status = 'suspended' then public.service_provider_profiles.rejection_reason else null end,
    submitted_at = timezone('utc', now()),
    updated_at = timezone('utc', now())
  returning id into result_id;
  return result_id;
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
  provider_id uuid,
  full_name text,
  avatar_path text,
  professional_title text,
  service_description text,
  specialties text[],
  service_mode public.service_mode,
  pricing_model public.service_pricing_model,
  starting_price numeric,
  availability text,
  rating_average numeric,
  rating_count integer,
  city text,
  state text,
  category_names text[]
) language sql stable security definer set search_path = public
as $$
  select
    spp.id,
    p.full_name,
    pr.avatar_path,
    spp.professional_title,
    spp.service_description,
    spp.specialties,
    spp.service_mode,
    spp.pricing_model,
    spp.starting_price,
    spp.availability,
    spp.rating_average,
    spp.rating_count,
    coalesce(area.city, p.city),
    coalesce(area.state, p.state),
    coalesce(categories.names, '{}')
  from public.service_provider_profiles spp
  join public.professionals p on p.id = spp.professional_id
  join public.profiles pr on pr.id = p.user_id
  left join lateral (
    select spa.city, spa.state
    from public.service_provider_areas spa
    where spa.provider_id = spp.id
    order by spa.created_at
    limit 1
  ) area on true
  left join lateral (
    select array_agg(sc.name order by sc.display_order, sc.name) names
    from public.service_provider_categories spc
    join public.service_categories sc on sc.id = spc.category_id and sc.is_active
    where spc.provider_id = spp.id
  ) categories on true
  where spp.status = 'approved'
    and p.deleted_at is null
    and (
      search_text is null or trim(search_text) = ''
      or spp.professional_title ilike '%' || trim(search_text) || '%'
      or spp.service_description ilike '%' || trim(search_text) || '%'
      or p.full_name ilike '%' || trim(search_text) || '%'
      or exists (select 1 from unnest(spp.specialties) item where item ilike '%' || trim(search_text) || '%')
    )
    and (
      target_category is null
      or exists (
        select 1 from public.service_provider_categories spc
        join public.service_categories selected on selected.id = target_category
        join public.service_categories linked on linked.id = spc.category_id
        where spc.provider_id = spp.id
          and (linked.id = selected.id or linked.parent_id = selected.id)
      )
    )
    and (target_city is null or trim(target_city) = '' or lower(coalesce(area.city, p.city)) = lower(trim(target_city)))
    and (target_mode is null or spp.service_mode = target_mode or spp.service_mode = 'both')
    and (minimum_rating is null or spp.rating_average >= minimum_rating)
  order by spp.rating_average desc, spp.rating_count desc, spp.approved_at desc nulls last
  limit least(greatest(result_limit, 1), 60)
  offset greatest(result_offset, 0);
$$;

create or replace function public.get_service_provider_public(target_provider_id uuid)
returns table (
  provider_id uuid,
  full_name text,
  avatar_path text,
  professional_title text,
  service_description text,
  specialties text[],
  service_mode public.service_mode,
  pricing_model public.service_pricing_model,
  starting_price numeric,
  availability text,
  experience_description text,
  rating_average numeric,
  rating_count integer,
  city text,
  state text,
  category_names text[]
) language sql stable security definer set search_path = public
as $$
  select
    spp.id, p.full_name, pr.avatar_path, spp.professional_title, spp.service_description,
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
  where spp.id = target_provider_id and spp.status = 'approved' and p.deleted_at is null;
$$;

create or replace function public.admin_moderate_service_provider(
  target_provider_id uuid,
  target_status public.service_provider_status,
  target_reason text default null
) returns void language plpgsql security definer set search_path = public
as $$
declare target_user uuid;
begin
  if not public.is_admin() then raise exception 'admin_required'; end if;
  if target_status not in ('approved', 'rejected', 'suspended', 'pending') then raise exception 'invalid_status'; end if;
  update public.service_provider_profiles set
    status = target_status,
    rejection_reason = case when target_status = 'rejected' then target_reason else null end,
    suspension_reason = case when target_status = 'suspended' then target_reason else null end,
    approved_at = case when target_status = 'approved' then timezone('utc', now()) else approved_at end,
    approved_by = case when target_status = 'approved' then auth.uid() else approved_by end,
    updated_at = timezone('utc', now())
  where id = target_provider_id;
  select p.user_id into target_user from public.service_provider_profiles spp
  join public.professionals p on p.id = spp.professional_id where spp.id = target_provider_id;
  insert into public.marketplace_moderation_actions (admin_id, target_user_id, action_type, reason)
  values (auth.uid(), target_user,
    case target_status when 'approved' then 'approve' when 'rejected' then 'reject' when 'suspended' then 'suspend' else 'reactivate' end,
    target_reason);
  insert into public.marketplace_notifications (user_id, notification_type, title, body, link_path)
  values (target_user, 'provider_status', 'Status do perfil de prestador atualizado',
    case target_status when 'approved' then 'Seu perfil foi aprovado e já está visível.' when 'rejected' then 'Seu perfil precisa de ajustes: ' || coalesce(target_reason, 'revise os dados.') when 'suspended' then 'Seu perfil foi suspenso: ' || coalesce(target_reason, 'consulte o suporte.') else 'Seu perfil voltou para análise.' end,
    '/professional/services');
end $$;

create or replace function public.start_marketplace_conversation(target_provider_id uuid)
returns uuid language plpgsql security definer set search_path = public
as $$
declare target_client uuid; result_id uuid;
begin
  select id into target_client from public.client_profiles where user_id = auth.uid() and deleted_at is null;
  if target_client is null then raise exception 'client_profile_required'; end if;
  if not exists (select 1 from public.service_provider_profiles where id = target_provider_id and status = 'approved') then
    raise exception 'provider_unavailable';
  end if;
  select id into result_id from public.marketplace_conversations
  where client_id = target_client and provider_id = target_provider_id and status = 'open' limit 1;
  if result_id is null then
    insert into public.marketplace_conversations (client_id, provider_id)
    values (target_client, target_provider_id) returning id into result_id;
  end if;
  return result_id;
end $$;

create or replace function public.create_service_request(
  target_conversation_id uuid,
  target_title text,
  target_description text,
  target_pricing public.service_pricing_model,
  target_amount numeric default null
) returns uuid language plpgsql security definer set search_path = public
as $$
declare conv public.marketplace_conversations%rowtype; result_id uuid;
begin
  select * into conv from public.marketplace_conversations where id = target_conversation_id and status = 'open';
  if conv.id is null or not public.marketplace_client_owner(conv.client_id) then raise exception 'client_conversation_required'; end if;
  insert into public.service_requests (conversation_id, client_id, provider_id, title, description, status, pricing_model, proposed_amount)
  values (conv.id, conv.client_id, conv.provider_id, trim(target_title), trim(target_description), 'awaiting_response', target_pricing, target_amount)
  returning id into result_id;
  insert into public.service_request_events (request_id, actor_id, new_status)
  values (result_id, auth.uid(), 'awaiting_response');
  return result_id;
end $$;

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
  if not (is_client or is_provider or public.is_admin()) then raise exception 'request_access_denied'; end if;
  if target_status in ('accepted', 'rejected') and (not is_provider or req.status <> 'awaiting_response') then raise exception 'invalid_request_transition'; end if;
  if target_status = 'in_progress' and req.status <> 'accepted' then raise exception 'invalid_request_transition'; end if;
  if target_status = 'cancelled' and req.status in ('completed', 'cancelled') then raise exception 'invalid_request_transition'; end if;
  if target_status = 'disputed' and req.status not in ('accepted', 'in_progress') then raise exception 'invalid_request_transition'; end if;
  update public.service_requests set status = target_status, updated_at = timezone('utc', now()) where id = req.id;
  insert into public.service_request_events (request_id, actor_id, previous_status, new_status, note)
  values (req.id, auth.uid(), req.status, target_status, target_note);
end $$;

create or replace function public.confirm_service_completion(target_request_id uuid)
returns boolean language plpgsql security definer set search_path = public
as $$
declare req public.service_requests%rowtype; done boolean;
begin
  select * into req from public.service_requests where id = target_request_id for update;
  if req.id is null or req.status not in ('accepted', 'in_progress') then raise exception 'invalid_completion_state'; end if;
  if public.marketplace_client_owner(req.client_id) then
    update public.service_requests set client_completed_at = timezone('utc', now()) where id = req.id;
  elsif public.marketplace_provider_owner(req.provider_id) then
    update public.service_requests set provider_completed_at = timezone('utc', now()) where id = req.id;
  else raise exception 'request_access_denied'; end if;
  select client_completed_at is not null and provider_completed_at is not null into done
  from public.service_requests where id = req.id;
  if done then
    update public.service_requests set status = 'completed', completed_at = timezone('utc', now()), updated_at = timezone('utc', now()) where id = req.id;
    insert into public.service_request_events (request_id, actor_id, previous_status, new_status, note)
    values (req.id, auth.uid(), req.status, 'completed', 'Conclusão confirmada pelas duas partes.');
  end if;
  return done;
end $$;

create or replace function public.create_service_review(
  target_request_id uuid,
  target_rating integer,
  target_comment text default null
) returns uuid language plpgsql security definer set search_path = public
as $$
declare req public.service_requests%rowtype; result_id uuid;
begin
  select * into req from public.service_requests where id = target_request_id;
  if req.id is null or req.status <> 'completed' or not public.marketplace_client_owner(req.client_id) then
    raise exception 'completed_client_request_required';
  end if;
  if target_rating not between 1 and 5 then raise exception 'invalid_rating'; end if;
  insert into public.service_reviews (request_id, client_id, provider_id, rating, comment)
  values (req.id, req.client_id, req.provider_id, target_rating, target_comment)
  returning id into result_id;
  update public.service_provider_profiles spp set
    rating_average = stats.average_rating,
    rating_count = stats.review_count,
    updated_at = timezone('utc', now())
  from (
    select provider_id, round(avg(rating)::numeric, 2) average_rating, count(*)::integer review_count
    from public.service_reviews where provider_id = req.provider_id and moderation_status = 'approved'
    group by provider_id
  ) stats where spp.id = stats.provider_id;
  return result_id;
end $$;

create or replace function public.notify_marketplace_message()
returns trigger language plpgsql security definer set search_path = public
as $$
declare recipient uuid; conv public.marketplace_conversations%rowtype;
begin
  select * into conv from public.marketplace_conversations where id = new.conversation_id;
  select case when cp.user_id = new.sender_id then p.user_id else cp.user_id end into recipient
  from public.client_profiles cp
  join public.service_provider_profiles spp on spp.id = conv.provider_id
  join public.professionals p on p.id = spp.professional_id
  where cp.id = conv.client_id;
  update public.marketplace_conversations set last_message_at = new.created_at, updated_at = new.created_at where id = new.conversation_id;
  insert into public.marketplace_notifications (user_id, notification_type, title, body, link_path, metadata)
  values (recipient, 'new_message', 'Nova mensagem de serviço', left(new.body, 160),
    '/marketplace/conversations/' || new.conversation_id,
    jsonb_build_object('conversation_id', new.conversation_id));
  return new;
end $$;

create trigger notify_marketplace_message_trigger
after insert on public.marketplace_messages
for each row execute function public.notify_marketplace_message();

revoke all on function public.submit_service_provider_profile(text,text,text[],public.service_mode,public.service_pricing_model,numeric,text,text) from public, anon;
revoke all on function public.search_service_providers(text,uuid,text,public.service_mode,numeric,integer,integer) from public;
revoke all on function public.get_service_provider_public(uuid) from public;
revoke all on function public.admin_moderate_service_provider(uuid,public.service_provider_status,text) from public, anon;
revoke all on function public.start_marketplace_conversation(uuid) from public, anon;
revoke all on function public.create_service_request(uuid,text,text,public.service_pricing_model,numeric) from public, anon;
revoke all on function public.transition_service_request(uuid,public.service_request_status,text) from public, anon;
revoke all on function public.confirm_service_completion(uuid) from public, anon;
revoke all on function public.create_service_review(uuid,integer,text) from public, anon;
revoke all on function public.notify_marketplace_message() from public, anon, authenticated;
grant execute on function public.submit_service_provider_profile(text,text,text[],public.service_mode,public.service_pricing_model,numeric,text,text) to authenticated;
grant execute on function public.search_service_providers(text,uuid,text,public.service_mode,numeric,integer,integer) to anon, authenticated;
grant execute on function public.get_service_provider_public(uuid) to anon, authenticated;
grant execute on function public.admin_moderate_service_provider(uuid,public.service_provider_status,text) to authenticated;
grant execute on function public.start_marketplace_conversation(uuid) to authenticated;
grant execute on function public.create_service_request(uuid,text,text,public.service_pricing_model,numeric) to authenticated;
grant execute on function public.transition_service_request(uuid,public.service_request_status,text) to authenticated;
grant execute on function public.confirm_service_completion(uuid) to authenticated;
grant execute on function public.create_service_review(uuid,integer,text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('provider-portfolios', 'provider-portfolios', false, 8388608, array['image/webp','image/jpeg','image/png'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "provider portfolio storage owner manage" on storage.objects
for all to authenticated
using (bucket_id = 'provider-portfolios' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'provider-portfolios' and (storage.foldername(name))[1] = auth.uid()::text);

with roots(name, slug, icon_name, display_order) as (
  values
    ('Serviços domésticos','servicos-domesticos','House',10),
    ('Construção e manutenção','construcao-manutencao','Hammer',20),
    ('Tecnologia e TI','tecnologia-ti','MonitorCog',30),
    ('Design e comunicação','design-comunicacao','Palette',40),
    ('Educação e aulas particulares','educacao-aulas','GraduationCap',50),
    ('Beleza e bem-estar','beleza-bem-estar','Sparkles',60),
    ('Contabilidade e serviços administrativos','contabilidade-administrativo','Calculator',70),
    ('Eventos','eventos','PartyPopper',80),
    ('Transporte e entregas','transporte-entregas','Truck',90),
    ('Cuidados pessoais','cuidados-pessoais','HeartHandshake',100),
    ('Serviços para empresas','servicos-empresas','Building2',110)
)
insert into public.service_categories (name, slug, icon_name, display_order)
select * from roots on conflict (slug) do nothing;

insert into public.service_categories (parent_id, name, slug, display_order)
select r.id, s.name, s.slug, s.ord
from (values
  ('servicos-domesticos','Limpeza residencial','limpeza-residencial',10),
  ('construcao-manutencao','Eletricista','eletricista',10),
  ('construcao-manutencao','Encanador','encanador',20),
  ('tecnologia-ti','Suporte técnico','suporte-tecnico',10),
  ('tecnologia-ti','Desenvolvimento de software','desenvolvimento-software',20),
  ('design-comunicacao','Design gráfico','design-grafico',10),
  ('educacao-aulas','Aulas particulares','aulas-particulares',10),
  ('beleza-bem-estar','Cabeleireiro e barbearia','cabeleireiro-barbearia',10),
  ('eventos','Fotografia e vídeo','fotografia-video',10),
  ('transporte-entregas','Fretes e entregas','fretes-entregas',10)
) s(parent_slug,name,slug,ord)
join public.service_categories r on r.slug = s.parent_slug
on conflict (slug) do nothing;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'marketplace_messages') then
    alter publication supabase_realtime add table public.marketplace_messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'marketplace_conversations') then
    alter publication supabase_realtime add table public.marketplace_conversations;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'marketplace_notifications') then
    alter publication supabase_realtime add table public.marketplace_notifications;
  end if;
end $$;
