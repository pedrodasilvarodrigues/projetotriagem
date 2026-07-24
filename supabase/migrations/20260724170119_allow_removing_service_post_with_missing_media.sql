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
  public.marketplace_provider_owner(provider_id)
  and public.provider_service_management_allowed(provider_id)
  and (
    status = 'removed'
    or public.service_post_paths_owned(provider_id, images)
  )
);

comment on policy "service posts owner update" on public.service_posts is
  'Permite remover publicação mesmo se uma mídia já tiver sido perdida; republicação exige todas as imagens válidas.';
