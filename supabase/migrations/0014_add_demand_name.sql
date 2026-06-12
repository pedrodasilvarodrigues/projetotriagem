alter table public.demands
add column if not exists name text;

update public.demands
set name = coalesce(nullif(name, ''), title)
where name is null or name = '';
