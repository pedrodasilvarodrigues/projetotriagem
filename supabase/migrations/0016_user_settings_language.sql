alter table public.user_settings
add column if not exists preferred_language text not null default 'pt-BR';
