alter table public.service_provider_profiles
  add column if not exists cover_image_path text;

alter table public.service_provider_profiles
  drop constraint if exists service_provider_cover_image_path_check;

alter table public.service_provider_profiles
  add constraint service_provider_cover_image_path_check
  check (
    cover_image_path is null
    or (
      char_length(cover_image_path) between 10 and 500
      and cover_image_path not like '%..%'
      and cover_image_path like '%/covers/%'
    )
  );

comment on column public.service_provider_profiles.cover_image_path is
  'Private Storage path for the provider service cover image.';
