create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.user_role;
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  );

  requested_role := case new.raw_user_meta_data->>'role'
    when 'company' then 'company'::public.user_role
    when 'professional' then 'professional'::public.user_role
    when 'client' then 'client'::public.user_role
    else null
  end;

  if requested_role is not null then
    insert into public.user_roles (user_id, role)
    values (new.id, requested_role);
  end if;

  return new;
end;
$$;

delete from public.user_roles ur
using auth.users u
where ur.user_id = u.id
  and ur.role = 'professional'::public.user_role
  and not exists (select 1 from public.professionals p where p.user_id = u.id)
  and not exists (select 1 from public.companies c where c.owner_id = u.id)
  and not exists (select 1 from public.client_profiles cp where cp.user_id = u.id)
  and exists (
    select 1
    from auth.identities i
    where i.user_id = u.id
      and i.provider = 'google'
  )
  and coalesce(u.raw_user_meta_data->>'role', '') not in ('company', 'professional', 'client');
