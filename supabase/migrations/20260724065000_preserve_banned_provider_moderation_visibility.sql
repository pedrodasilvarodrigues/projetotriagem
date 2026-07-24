-- Mantém o histórico visível ao administrador e bloqueia somente mutações
-- nos dados de oferta pertencentes a um prestador banido.

drop policy if exists "banned provider categories immutable" on public.service_provider_categories;
create policy "banned provider categories insert blocked"
on public.service_provider_categories as restrictive for insert to authenticated
with check (public.provider_service_management_allowed(provider_id));
create policy "banned provider categories update blocked"
on public.service_provider_categories as restrictive for update to authenticated
using (public.provider_service_management_allowed(provider_id))
with check (public.provider_service_management_allowed(provider_id));
create policy "banned provider categories delete blocked"
on public.service_provider_categories as restrictive for delete to authenticated
using (public.provider_service_management_allowed(provider_id));

drop policy if exists "banned provider areas immutable" on public.service_provider_areas;
create policy "banned provider areas insert blocked"
on public.service_provider_areas as restrictive for insert to authenticated
with check (public.provider_service_management_allowed(provider_id));
create policy "banned provider areas update blocked"
on public.service_provider_areas as restrictive for update to authenticated
using (public.provider_service_management_allowed(provider_id))
with check (public.provider_service_management_allowed(provider_id));
create policy "banned provider areas delete blocked"
on public.service_provider_areas as restrictive for delete to authenticated
using (public.provider_service_management_allowed(provider_id));

drop policy if exists "banned provider portfolio immutable" on public.service_provider_portfolio;
create policy "banned provider portfolio insert blocked"
on public.service_provider_portfolio as restrictive for insert to authenticated
with check (public.provider_service_management_allowed(provider_id));
create policy "banned provider portfolio update blocked"
on public.service_provider_portfolio as restrictive for update to authenticated
using (public.provider_service_management_allowed(provider_id))
with check (public.provider_service_management_allowed(provider_id));
create policy "banned provider portfolio delete blocked"
on public.service_provider_portfolio as restrictive for delete to authenticated
using (public.provider_service_management_allowed(provider_id));
