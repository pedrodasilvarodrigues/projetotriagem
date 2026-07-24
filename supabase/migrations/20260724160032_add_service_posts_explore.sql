create type public.service_post_status as enum ('published', 'removed');

create table public.service_posts (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.service_provider_profiles(id) on delete cascade,
  images text[] not null,
  description text not null,
  status public.service_post_status not null default 'published',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint service_posts_images_count_check
    check (cardinality(images) between 1 and 6),
  constraint service_posts_images_not_blank_check
    check (array_position(images, '') is null),
  constraint service_posts_description_check
    check (char_length(trim(description)) between 3 and 1000)
);

create index service_posts_provider_status_created_idx
  on public.service_posts (provider_id, status, created_at desc);
create index service_posts_published_created_idx
  on public.service_posts (provider_id, created_at desc)
  where status = 'published';
create index service_posts_description_trgm_idx
  on public.service_posts using gin (description extensions.gin_trgm_ops);

create trigger service_posts_updated_at
before update on public.service_posts
for each row execute function public.set_updated_at();

alter table public.service_posts enable row level security;

create policy "service posts published or owner read"
on public.service_posts
for select
to authenticated
using (
  (
    status = 'published'
    and exists (
      select 1
      from public.service_provider_profiles provider
      where provider.id = provider_id
        and provider.status = 'approved'
    )
  )
  or public.marketplace_provider_owner(provider_id)
  or public.is_admin()
);

create policy "service posts owner insert"
on public.service_posts
for insert
to authenticated
with check (
  status = 'published'
  and public.marketplace_provider_owner(provider_id)
  and public.provider_service_management_allowed(provider_id)
);

create policy "service posts owner update"
on public.service_posts
for update
to authenticated
using (
  public.marketplace_provider_owner(provider_id)
  and public.provider_service_management_allowed(provider_id)
)
with check (
  public.marketplace_provider_owner(provider_id)
  and public.provider_service_management_allowed(provider_id)
);

create policy "service posts owner delete"
on public.service_posts
for delete
to authenticated
using (
  public.marketplace_provider_owner(provider_id)
  and public.provider_service_management_allowed(provider_id)
);

grant select, insert, update, delete on table public.service_posts to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'service-posts',
  'service-posts',
  true,
  8388608,
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.service_post_storage_owner(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.service_provider_profiles provider
    join public.professionals professional
      on professional.id = provider.professional_id
    where professional.user_id = auth.uid()
      and professional.deleted_at is null
      and provider.status <> 'banned'
      and provider.id::text = (storage.foldername(object_name))[2]
      and auth.uid()::text = (storage.foldername(object_name))[1]
  );
$$;

revoke all on function public.service_post_storage_owner(text) from public, anon;
grant execute on function public.service_post_storage_owner(text) to authenticated;

create policy "service post images authenticated read"
on storage.objects
for select
to authenticated
using (bucket_id = 'service-posts');

create policy "service post images owner insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'service-posts'
  and public.service_post_storage_owner(name)
);

create policy "service post images owner update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'service-posts'
  and public.service_post_storage_owner(name)
)
with check (
  bucket_id = 'service-posts'
  and public.service_post_storage_owner(name)
);

create policy "service post images owner delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'service-posts'
  and public.service_post_storage_owner(name)
);

create or replace function public.get_featured_service_providers(
  search_text text default null,
  target_category uuid default null,
  target_city text default null
) returns table (
  provider_id uuid,
  full_name text,
  avatar_path text,
  professional_title text,
  city text,
  state text,
  category_names text[],
  rating_average numeric,
  rating_count integer,
  latest_post_at timestamptz,
  posts jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  with eligible as (
    select
      provider.id,
      professional.full_name,
      profile.avatar_path,
      provider.professional_title,
      coalesce(area.city, professional.city) as city,
      coalesce(area.state, professional.state) as state,
      coalesce(categories.names, '{}') as category_names,
      provider.rating_average,
      provider.rating_count,
      post_data.latest_post_at,
      post_data.posts
    from public.service_provider_profiles provider
    join public.professionals professional
      on professional.id = provider.professional_id
    join public.profiles profile
      on profile.id = professional.user_id
    join lateral (
      select
        max(post.created_at) as latest_post_at,
        jsonb_agg(
          jsonb_build_object(
            'id', post.id,
            'images', post.images,
            'description', post.description,
            'created_at', post.created_at
          )
          order by post.created_at desc, post.id desc
        ) as posts
      from public.service_posts post
      where post.provider_id = provider.id
        and post.status = 'published'
    ) post_data on post_data.latest_post_at is not null
    left join lateral (
      select provider_area.city, provider_area.state
      from public.service_provider_areas provider_area
      where provider_area.provider_id = provider.id
      order by provider_area.created_at
      limit 1
    ) area on true
    left join lateral (
      select array_agg(category.name order by category.display_order, category.name) as names
      from public.service_provider_categories link
      join public.service_categories category
        on category.id = link.category_id
       and category.is_active
      where link.provider_id = provider.id
    ) categories on true
    where auth.uid() is not null
      and exists (
        select 1
        from public.user_roles user_role
        where user_role.user_id = auth.uid()
          and user_role.role in ('client', 'professional')
      )
      and provider.status = 'approved'
      and provider.rating_count > 0
      and professional.deleted_at is null
      and (
        search_text is null
        or trim(search_text) = ''
        or professional.full_name ilike '%' || trim(search_text) || '%'
        or provider.professional_title ilike '%' || trim(search_text) || '%'
        or exists (
          select 1
          from public.service_posts matching_post
          where matching_post.provider_id = provider.id
            and matching_post.status = 'published'
            and matching_post.description ilike '%' || trim(search_text) || '%'
        )
        or exists (
          select 1
          from unnest(provider.specialties) specialty
          where specialty ilike '%' || trim(search_text) || '%'
        )
      )
      and (
        target_category is null
        or exists (
          select 1
          from public.service_provider_categories category_link
          join public.service_categories linked_category
            on linked_category.id = category_link.category_id
          where category_link.provider_id = provider.id
            and (
              linked_category.id = target_category
              or linked_category.parent_id = target_category
            )
        )
      )
      and (
        target_city is null
        or trim(target_city) = ''
        or lower(coalesce(area.city, professional.city)) = lower(trim(target_city))
      )
  )
  select
    eligible.id,
    eligible.full_name,
    eligible.avatar_path,
    eligible.professional_title,
    eligible.city,
    eligible.state,
    eligible.category_names,
    eligible.rating_average,
    eligible.rating_count,
    eligible.latest_post_at,
    eligible.posts
  from eligible
  order by
    eligible.rating_average desc,
    eligible.rating_count desc,
    eligible.latest_post_at desc,
    eligible.id
  limit 5;
$$;

revoke all on function public.get_featured_service_providers(text, uuid, text)
  from public, anon;
grant execute on function public.get_featured_service_providers(text, uuid, text)
  to authenticated;

create or replace function public.get_service_post_detail(target_post_id uuid)
returns table (
  post_id uuid,
  provider_id uuid,
  images text[],
  description text,
  created_at timestamptz,
  full_name text,
  avatar_path text,
  professional_title text,
  rating_average numeric,
  rating_count integer,
  category_names text[]
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    post.id,
    provider.id,
    post.images,
    post.description,
    post.created_at,
    professional.full_name,
    profile.avatar_path,
    provider.professional_title,
    provider.rating_average,
    provider.rating_count,
    coalesce(categories.names, '{}')
  from public.service_posts post
  join public.service_provider_profiles provider
    on provider.id = post.provider_id
  join public.professionals professional
    on professional.id = provider.professional_id
  join public.profiles profile
    on profile.id = professional.user_id
  left join lateral (
    select array_agg(category.name order by category.display_order, category.name) as names
    from public.service_provider_categories link
    join public.service_categories category
      on category.id = link.category_id
     and category.is_active
    where link.provider_id = provider.id
  ) categories on true
  where auth.uid() is not null
    and exists (
      select 1
      from public.user_roles user_role
      where user_role.user_id = auth.uid()
        and user_role.role in ('client', 'professional')
    )
    and post.id = target_post_id
    and post.status = 'published'
    and provider.status = 'approved'
    and professional.deleted_at is null;
$$;

revoke all on function public.get_service_post_detail(uuid) from public, anon;
grant execute on function public.get_service_post_detail(uuid) to authenticated;

comment on table public.service_posts is
  'Publicações reais de trabalhos dos prestadores exibidas na área Explorar.';
