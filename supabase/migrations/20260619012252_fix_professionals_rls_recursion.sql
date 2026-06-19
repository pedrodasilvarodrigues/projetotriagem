-- A professionals SELECT policy queried screening_processes while the
-- screening_processes SELECT policy queried professionals. PostgreSQL rejects
-- that cycle with 42P17 before evaluating the user's own-row condition.
drop policy if exists "companies read professionals catalog" on public.professionals;
drop policy if exists "professionals own admin or forwarded company" on public.professionals;
drop policy if exists "professionals own or admin" on public.professionals;

create policy "professionals select own catalog or admin"
on public.professionals
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin()
  or public.has_role('company')
);
