create or replace function public.invalidate_resume_cache()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_professional_id uuid;
begin
  if tg_table_name = 'professionals' then
    target_professional_id := coalesce(new.id, old.id);
  else
    target_professional_id := coalesce(new.professional_id, old.professional_id);
  end if;

  if target_professional_id is not null then
    update public.resume_versions
       set invalidated_at = timezone('utc', now())
     where resume_id in (
       select id from public.resumes where professional_id = target_professional_id
     )
       and invalidated_at is null;
  end if;

  return coalesce(new, old);
end;
$$;
