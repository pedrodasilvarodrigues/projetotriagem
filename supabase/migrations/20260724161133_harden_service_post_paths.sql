create or replace function public.service_post_paths_owned(
  target_provider_id uuid,
  target_paths text[]
) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    auth.uid() is not null
    and cardinality(target_paths) between 1 and 6
    and public.marketplace_provider_owner(target_provider_id)
    and public.provider_service_management_allowed(target_provider_id)
    and not exists (
      select 1
      from unnest(target_paths) path
      where (storage.foldername(path))[1] is distinct from auth.uid()::text
         or (storage.foldername(path))[2] is distinct from target_provider_id::text
         or not exists (
           select 1
           from storage.objects object
           where object.bucket_id = 'service-posts'
             and object.name = path
         )
    );
$$;

revoke all on function public.service_post_paths_owned(uuid, text[])
  from public, anon;
grant execute on function public.service_post_paths_owned(uuid, text[])
  to authenticated;

drop policy if exists "service posts owner insert" on public.service_posts;
create policy "service posts owner insert"
on public.service_posts
for insert
to authenticated
with check (
  status = 'published'
  and public.service_post_paths_owned(provider_id, images)
);

drop policy if exists "service posts owner update" on public.service_posts;
create policy "service posts owner update"
on public.service_posts
for update
to authenticated
using (
  public.marketplace_provider_owner(provider_id)
  and public.provider_service_management_allowed(provider_id)
)
with check (
  public.service_post_paths_owned(provider_id, images)
);
