alter table public.companies
add column if not exists segment text,
add column if not exists description text;
