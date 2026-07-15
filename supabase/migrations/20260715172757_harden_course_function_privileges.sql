-- Follow-up hardening after validating the course module with Supabase advisors.

alter function public.course_passing_score() set search_path = '';
alter function public.course_certification_bonus_per_match() set search_path = '';
alter function public.course_certification_bonus_cap() set search_path = '';

revoke all on function public.validate_course_attempt_limit() from public, anon, authenticated;
revoke all on function public.create_professional_certification_from_attempt() from public, anon, authenticated;
revoke all on function public.recalculate_scores_after_professional_certification() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

drop function if exists public.professional_owner_id(uuid);

drop policy if exists "courses admin manage" on public.courses;
drop policy if exists "courses professional published read" on public.courses;
drop policy if exists "courses authorized read" on public.courses;
drop policy if exists "courses admin insert" on public.courses;
drop policy if exists "courses admin update" on public.courses;
drop policy if exists "courses admin delete" on public.courses;

create policy "courses authorized read"
on public.courses
for select
to authenticated
using (
  public.is_admin()
  or (status = 'published' and public.is_professional_user())
);

create policy "courses admin insert"
on public.courses
for insert
to authenticated
with check (public.is_admin());

create policy "courses admin update"
on public.courses
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "courses admin delete"
on public.courses
for delete
to authenticated
using (public.is_admin());

drop policy if exists "course questions admin manage" on public.course_quiz_questions;
drop policy if exists "course questions professional published read" on public.course_quiz_questions;
drop policy if exists "course questions authorized read" on public.course_quiz_questions;
drop policy if exists "course questions admin insert" on public.course_quiz_questions;
drop policy if exists "course questions admin update" on public.course_quiz_questions;
drop policy if exists "course questions admin delete" on public.course_quiz_questions;

create policy "course questions authorized read"
on public.course_quiz_questions
for select
to authenticated
using (
  public.is_admin()
  or (public.is_professional_user() and public.is_published_course(course_id))
);

create policy "course questions admin insert"
on public.course_quiz_questions
for insert
to authenticated
with check (public.is_admin());

create policy "course questions admin update"
on public.course_quiz_questions
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "course questions admin delete"
on public.course_quiz_questions
for delete
to authenticated
using (public.is_admin());

drop policy if exists "course attempts admin read" on public.course_attempts;
drop policy if exists "course attempts professional own read" on public.course_attempts;
drop policy if exists "course attempts authorized read" on public.course_attempts;

create policy "course attempts authorized read"
on public.course_attempts
for select
to authenticated
using (
  public.is_admin()
  or public.user_owns_professional(professional_id)
);

drop policy if exists "course answers admin read" on public.course_attempt_answers;
drop policy if exists "course answers professional own read" on public.course_attempt_answers;
drop policy if exists "course answers authorized read" on public.course_attempt_answers;

create policy "course answers authorized read"
on public.course_attempt_answers
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.course_attempts ca
    where ca.id = attempt_id
      and public.user_owns_professional(ca.professional_id)
  )
);

drop policy if exists "certifications admin read" on public.professional_certifications;
drop policy if exists "certifications professional own read" on public.professional_certifications;
drop policy if exists "certifications company presented read" on public.professional_certifications;
drop policy if exists "certifications authorized read" on public.professional_certifications;

create policy "certifications authorized read"
on public.professional_certifications
for select
to authenticated
using (
  public.is_admin()
  or public.user_owns_professional(professional_id)
  or public.company_can_read_professional(professional_id)
);
