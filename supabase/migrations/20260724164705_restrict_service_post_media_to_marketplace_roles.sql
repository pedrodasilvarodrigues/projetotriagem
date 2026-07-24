create or replace function public.is_marketplace_service_reader()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles user_role
    where user_role.user_id = auth.uid()
      and user_role.role in ('client', 'professional', 'admin')
  );
$$;

revoke all on function public.is_marketplace_service_reader()
  from public, anon;
grant execute on function public.is_marketplace_service_reader()
  to authenticated;

drop policy if exists "service posts published or owner read" on public.service_posts;
create policy "service posts published or owner read"
on public.service_posts
for select
to authenticated
using (
  (
    public.is_marketplace_service_reader()
    and status = 'published'
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

update storage.buckets
set public = false
where id = 'service-posts';

drop policy if exists "service post images authenticated read" on storage.objects;
create policy "service post images marketplace read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'service-posts'
  and public.is_marketplace_service_reader()
);

comment on function public.is_marketplace_service_reader() is
  'Impede empresas e usuários anônimos de ler posts ou gerar URLs assinadas do marketplace.';
