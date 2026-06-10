insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('curriculums', 'curriculums', false, 5242880, array['application/pdf']),
  ('certificates', 'certificates', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('avatars', 'avatars', false, 2097152, array['image/webp', 'image/jpeg', 'image/png']),
  ('documents', 'documents', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "avatars own folder" on storage.objects
for all
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "curriculums own or admin" on storage.objects
for select
using (
  bucket_id = 'curriculums'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
  )
);

create policy "curriculums own upload" on storage.objects
for insert
with check (bucket_id = 'curriculums' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "certificates own or admin" on storage.objects
for all
using (bucket_id = 'certificates' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()))
with check (bucket_id = 'certificates' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

create policy "documents segmented access" on storage.objects
for all
using (
  bucket_id = 'documents'
  and (
    public.is_admin()
    or (storage.foldername(name))[2] = auth.uid()::text
  )
)
with check (
  bucket_id = 'documents'
  and (
    public.is_admin()
    or (storage.foldername(name))[2] = auth.uid()::text
  )
);
