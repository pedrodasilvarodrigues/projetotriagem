-- The owner update is still constrained by the existing RLS policy and
-- service_provider_update_allowed(). Only the cover fields are granted.
grant update (cover_image_path, updated_at)
on table public.service_provider_profiles
to authenticated;
