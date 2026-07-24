-- O proprietário pode editar sua oferta, mas não pode aprovar a si mesmo,
-- remover suspensão/banimento ou manipular a própria reputação.

create or replace function public.service_provider_update_allowed(
  target_id uuid,
  target_professional_id uuid,
  target_status public.service_provider_status,
  target_approved_at timestamptz,
  target_approved_by uuid,
  target_rejection_reason text,
  target_suspension_reason text,
  target_rating_average numeric,
  target_rating_count integer,
  target_banned_at timestamptz,
  target_ban_reason text
) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.service_provider_profiles current_provider
      join public.professionals professional
        on professional.id = current_provider.professional_id
      where current_provider.id = target_id
        and professional.user_id = auth.uid()
        and current_provider.professional_id is not distinct from target_professional_id
        and current_provider.status is not distinct from target_status
        and current_provider.approved_at is not distinct from target_approved_at
        and current_provider.approved_by is not distinct from target_approved_by
        and current_provider.rejection_reason is not distinct from target_rejection_reason
        and current_provider.suspension_reason is not distinct from target_suspension_reason
        and current_provider.rating_average is not distinct from target_rating_average
        and current_provider.rating_count is not distinct from target_rating_count
        and current_provider.banned_at is not distinct from target_banned_at
        and current_provider.ban_reason is not distinct from target_ban_reason
    );
$$;

revoke all on function public.service_provider_update_allowed(
  uuid,
  uuid,
  public.service_provider_status,
  timestamptz,
  uuid,
  text,
  text,
  numeric,
  integer,
  timestamptz,
  text
) from public, anon;

grant execute on function public.service_provider_update_allowed(
  uuid,
  uuid,
  public.service_provider_status,
  timestamptz,
  uuid,
  text,
  text,
  numeric,
  integer,
  timestamptz,
  text
) to authenticated;

drop policy if exists "service providers owner update" on public.service_provider_profiles;
create policy "service providers owner update"
on public.service_provider_profiles
for update
to authenticated
using (public.is_admin() or public.marketplace_provider_owner(id))
with check (
  public.service_provider_update_allowed(
    id,
    professional_id,
    status,
    approved_at,
    approved_by,
    rejection_reason,
    suspension_reason,
    rating_average,
    rating_count,
    banned_at,
    ban_reason
  )
);
