alter table public.professionals
add column if not exists email text,
add column if not exists phone text,
add column if not exists cep text,
add column if not exists street text,
add column if not exists address_number text,
add column if not exists neighborhood text;

alter table public.companies
add column if not exists cep text,
add column if not exists street text,
add column if not exists address_number text,
add column if not exists neighborhood text;

update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]
where id = 'curriculums';
