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
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  );

  requested_role := case
    when new.raw_user_meta_data->>'role' = 'company' then 'company'::public.user_role
    else 'professional'::public.user_role
  end;

  insert into public.user_roles (user_id, role)
  values (new.id, requested_role);

  return new;
end;
$$;
