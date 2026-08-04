-- Fluxo auditavel de contratacao com confirmacao cruzada.
-- A empresa inicia, o profissional confirma e o Admin atua somente em disputas.

do $$
begin
  create type public.hire_confirmation_status as enum (
    'awaiting_company',
    'awaiting_professional',
    'confirmed',
    'disputed',
    'expired_no_response',
    'resolved_hired',
    'resolved_not_hired'
  );
exception
  when duplicate_object then null;
end
$$;

alter type public.process_status add value if not exists 'awaiting_professional_confirmation' after 'forwarded';
alter type public.process_status add value if not exists 'hire_dispute' after 'awaiting_professional_confirmation';

create table if not exists public.hire_confirmation_config (
  id boolean primary key default true check (id),
  response_deadline_days integer not null default 5 check (response_deadline_days between 1 and 30),
  reminder_after_days integer not null default 3 check (reminder_after_days >= 1),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint hire_confirmation_reminder_before_deadline check (reminder_after_days < response_deadline_days)
);

insert into public.hire_confirmation_config (id, response_deadline_days, reminder_after_days)
values (true, 5, 3)
on conflict (id) do nothing;

create table if not exists public.hire_confirmations (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null unique references public.screening_processes(id) on delete cascade,
  company_confirmed boolean not null default false,
  company_confirmed_at timestamptz,
  professional_confirmed boolean,
  professional_confirmed_at timestamptz,
  confirmation_status public.hire_confirmation_status not null default 'awaiting_company',
  deadline_at timestamptz,
  reminder_sent_at timestamptz,
  dispute_reason text check (dispute_reason is null or dispute_reason in ('professional_denied', 'professional_no_response')),
  resolved_by_admin_id uuid references auth.users(id),
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint hire_confirmation_company_dates check (
    (not company_confirmed and company_confirmed_at is null and deadline_at is null)
    or (company_confirmed and company_confirmed_at is not null and deadline_at is not null)
  ),
  constraint hire_confirmation_professional_dates check (
    (professional_confirmed is null and professional_confirmed_at is null)
    or (professional_confirmed is not null and professional_confirmed_at is not null)
  )
);

create table if not exists public.hire_confirmation_audit (
  id uuid primary key default gen_random_uuid(),
  confirmation_id uuid not null references public.hire_confirmations(id) on delete cascade,
  action text not null check (action in (
    'company_confirmed',
    'professional_confirmed',
    'professional_denied',
    'reminder_sent',
    'expired',
    'admin_resolved_hired',
    'admin_resolved_not_hired'
  )),
  actor_user_id uuid references auth.users(id),
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.hire_billing_events (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null unique references public.screening_processes(id) on delete restrict,
  confirmation_id uuid not null references public.hire_confirmations(id) on delete restrict,
  event_type text not null default 'confirmed_hire' check (event_type = 'confirmed_hire'),
  source text not null check (source in ('cross_confirmation', 'admin_dispute_resolution')),
  processing_status text not null default 'pending' check (processing_status in ('pending', 'processing', 'processed', 'failed')),
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz
);

create table if not exists public.hire_confirmation_email_queue (
  id uuid primary key default gen_random_uuid(),
  confirmation_id uuid not null references public.hire_confirmations(id) on delete cascade,
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  recipient_email text not null,
  template_key text not null check (template_key in ('hire_confirmation_request', 'hire_confirmation_reminder')),
  variables jsonb not null default '{}'::jsonb,
  delivery_status text not null default 'pending' check (delivery_status in ('pending', 'processing', 'sent', 'failed')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  provider_id text,
  last_error text,
  next_attempt_at timestamptz not null default timezone('utc', now()),
  sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (confirmation_id, template_key)
);

create index if not exists hire_confirmations_pending_deadline_idx
  on public.hire_confirmations (deadline_at)
  where confirmation_status = 'awaiting_professional';
create index if not exists hire_confirmation_audit_confirmation_idx
  on public.hire_confirmation_audit (confirmation_id, created_at desc);
create index if not exists hire_confirmation_email_pending_idx
  on public.hire_confirmation_email_queue (next_attempt_at)
  where delivery_status in ('pending', 'failed');

create or replace function public.hire_company_owns_process(target_process_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.screening_processes sp
    join public.demands d on d.id = sp.demand_id
    join public.companies c on c.id = d.company_id
    where sp.id = target_process_id
      and c.owner_id = auth.uid()
      and c.status_plano = 'ativo'
      and sp.status in (
        'forwarded',
        'interview',
        'pre_approved',
        'awaiting_professional_confirmation',
        'hire_dispute',
        'hired',
        'rejected'
      )
      and c.deleted_at is null
      and d.deleted_at is null
  );
$$;

create or replace function public.hire_professional_owns_process(target_process_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.screening_processes sp
    join public.professionals p on p.id = sp.professional_id
    where sp.id = target_process_id
      and p.user_id = auth.uid()
      and p.deleted_at is null
  );
$$;

create or replace function public.get_company_candidate_resume(target_process_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;
  if not public.hire_company_owns_process(target_process_id) then
    raise exception 'company_process_access_denied';
  end if;

  select jsonb_build_object(
    'process_id', sp.id,
    'process_status', sp.status,
    'demand', jsonb_build_object(
      'title', d.title,
      'name', d.name
    ),
    'professional', jsonb_build_object(
      'full_name', p.full_name,
      'desired_role', p.desired_role,
      'summary', p.summary,
      'education_level', p.education_level,
      'city', p.city,
      'state', p.state,
      'available_in_days', p.available_in_days
    ),
    'experiences', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', pe.id,
        'company_name', pe.company_name,
        'role_title', pe.role_title,
        'description', pe.description,
        'started_at', pe.started_at,
        'ended_at', pe.ended_at,
        'is_current', pe.is_current
      ) order by pe.started_at desc)
      from public.professional_experiences pe
      where pe.professional_id = p.id
    ), '[]'::jsonb),
    'educations', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ped.id,
        'level', ped.level,
        'institution', ped.institution,
        'course_name', ped.course_name,
        'completed_at', ped.completed_at
      ) order by ped.completed_at desc nulls first)
      from public.professional_educations ped
      where ped.professional_id = p.id
    ), '[]'::jsonb),
    'courses', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', pc.id,
        'name', pc.name,
        'institution', pc.institution,
        'workload_hours', pc.workload_hours,
        'completed_at', pc.completed_at
      ) order by pc.completed_at desc nulls first)
      from public.professional_courses pc
      where pc.professional_id = p.id
    ), '[]'::jsonb),
    'certificates', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', pce.id,
        'name', pce.name,
        'issuer', pce.issuer,
        'issued_at', pce.issued_at,
        'expires_at', pce.expires_at
      ) order by pce.issued_at desc nulls first)
      from public.professional_certificates pce
      where pce.professional_id = p.id
    ), '[]'::jsonb),
    'skills', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ps.id,
        'name', ps.name,
        'skill_type', ps.skill_type,
        'proficiency', ps.proficiency
      ) order by ps.skill_type, ps.name)
      from public.professional_skills ps
      where ps.professional_id = p.id
    ), '[]'::jsonb),
    'languages', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', pl.id,
        'language_name', pl.language_name,
        'proficiency', pl.proficiency
      ) order by pl.language_name)
      from public.professional_languages pl
      where pl.professional_id = p.id
    ), '[]'::jsonb)
  )
  into result
  from public.screening_processes sp
  join public.demands d on d.id = sp.demand_id
  join public.professionals p on p.id = sp.professional_id
  where sp.id = target_process_id
    and sp.status <> 'waiting';

  if result is null then
    raise exception 'candidate_resume_not_available';
  end if;

  return result;
end;
$$;

create or replace function public.on_confirmed_hire(target_confirmation_id uuid, event_source text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  confirmation_row public.hire_confirmations%rowtype;
  event_id uuid;
begin
  if event_source not in ('cross_confirmation', 'admin_dispute_resolution') then
    raise exception 'invalid_hire_event_source';
  end if;

  select * into confirmation_row
  from public.hire_confirmations
  where id = target_confirmation_id
  for update;

  if confirmation_row.id is null then
    raise exception 'hire_confirmation_not_found';
  end if;
  if confirmation_row.confirmation_status not in ('confirmed', 'resolved_hired') then
    raise exception 'hire_not_confirmed';
  end if;

  insert into public.hire_billing_events (process_id, confirmation_id, source, payload)
  values (
    confirmation_row.process_id,
    confirmation_row.id,
    event_source,
    jsonb_build_object('process_id', confirmation_row.process_id, 'confirmation_id', confirmation_row.id)
  )
  on conflict (process_id) do update
    set confirmation_id = excluded.confirmation_id
  returning id into event_id;

  return event_id;
end;
$$;

create or replace function public.company_confirm_hire(target_process_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  process_row public.screening_processes%rowtype;
  confirmation_row public.hire_confirmations%rowtype;
  config_row public.hire_confirmation_config%rowtype;
  professional_user_id uuid;
  professional_email text;
  professional_name text;
  company_name text;
  demand_title text;
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;

  select * into process_row
  from public.screening_processes
  where id = target_process_id
  for update;

  if process_row.id is null then
    raise exception 'screening_process_not_found';
  end if;
  if not public.hire_company_owns_process(target_process_id) then
    raise exception 'company_process_access_denied';
  end if;
  if process_row.status <> 'pre_approved' then
    raise exception 'process_must_be_approved_by_admin';
  end if;

  select * into config_row from public.hire_confirmation_config where id = true;
  insert into public.hire_confirmations (process_id)
  values (target_process_id)
  on conflict (process_id) do nothing;

  select * into confirmation_row
  from public.hire_confirmations
  where process_id = target_process_id
  for update;

  if confirmation_row.company_confirmed then
    raise exception 'company_hire_already_confirmed';
  end if;

  update public.hire_confirmations
  set company_confirmed = true,
      company_confirmed_at = timezone('utc', now()),
      professional_confirmed = null,
      professional_confirmed_at = null,
      confirmation_status = 'awaiting_professional',
      deadline_at = timezone('utc', now()) + make_interval(days => config_row.response_deadline_days),
      dispute_reason = null,
      updated_at = timezone('utc', now())
  where id = confirmation_row.id
  returning * into confirmation_row;

  perform set_config('app.hire_workflow_authorized', 'true', true);
  update public.screening_processes
  set status = 'awaiting_professional_confirmation', updated_at = timezone('utc', now())
  where id = target_process_id;

  insert into public.hire_confirmation_audit (confirmation_id, action, actor_user_id)
  values (confirmation_row.id, 'company_confirmed', auth.uid());

  select p.user_id, p.email, p.full_name, coalesce(c.trade_name, c.legal_name), d.title
  into professional_user_id, professional_email, professional_name, company_name, demand_title
  from public.screening_processes sp
  join public.professionals p on p.id = sp.professional_id
  join public.demands d on d.id = sp.demand_id
  join public.companies c on c.id = d.company_id
  where sp.id = target_process_id;

  insert into public.notifications (user_id, title, body)
  values (
    professional_user_id,
    'Confirmação de contratação pendente',
    format(
      'Você foi contratado pela %s para a vaga %s? Confirme sua resposta até %s.',
      company_name,
      demand_title,
      to_char(confirmation_row.deadline_at at time zone 'America/Sao_Paulo', 'DD/MM/YYYY')
    )
  );

  if professional_email is not null and professional_email <> '' then
    insert into public.hire_confirmation_email_queue (
      confirmation_id,
      recipient_user_id,
      recipient_email,
      template_key,
      variables
    )
    values (
      confirmation_row.id,
      professional_user_id,
      professional_email,
      'hire_confirmation_request',
      jsonb_build_object(
        'name', professional_name,
        'company', company_name,
        'demand', demand_title,
        'deadline', to_char(confirmation_row.deadline_at at time zone 'America/Sao_Paulo', 'DD/MM/YYYY'),
        'path', '/professional/screening-status'
      )
    )
    on conflict (confirmation_id, template_key) do nothing;
  end if;

  return jsonb_build_object(
    'confirmation_id', confirmation_row.id,
    'deadline_at', confirmation_row.deadline_at
  );
end;
$$;

create or replace function public.professional_respond_hire(target_process_id uuid, was_hired boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  process_row public.screening_processes%rowtype;
  confirmation_row public.hire_confirmations%rowtype;
  next_status public.process_status;
  audit_action text;
  billing_event_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;

  select * into process_row
  from public.screening_processes
  where id = target_process_id
  for update;

  if process_row.id is null then
    raise exception 'screening_process_not_found';
  end if;
  if not public.hire_professional_owns_process(target_process_id) then
    raise exception 'professional_process_access_denied';
  end if;

  select * into confirmation_row
  from public.hire_confirmations
  where process_id = target_process_id
  for update;

  if confirmation_row.id is null or not confirmation_row.company_confirmed then
    raise exception 'company_confirmation_required';
  end if;
  if confirmation_row.professional_confirmed is not null then
    raise exception 'professional_response_already_recorded';
  end if;
  if confirmation_row.confirmation_status <> 'awaiting_professional' then
    raise exception 'hire_confirmation_not_pending';
  end if;
  if confirmation_row.deadline_at <= timezone('utc', now()) then
    raise exception 'hire_confirmation_expired';
  end if;

  if was_hired then
    update public.hire_confirmations
    set professional_confirmed = true,
        professional_confirmed_at = timezone('utc', now()),
        confirmation_status = 'confirmed',
        updated_at = timezone('utc', now())
    where id = confirmation_row.id
    returning * into confirmation_row;
    next_status := 'hired';
    audit_action := 'professional_confirmed';
  else
    update public.hire_confirmations
    set professional_confirmed = false,
        professional_confirmed_at = timezone('utc', now()),
        confirmation_status = 'disputed',
        dispute_reason = 'professional_denied',
        updated_at = timezone('utc', now())
    where id = confirmation_row.id
    returning * into confirmation_row;
    next_status := 'hire_dispute';
    audit_action := 'professional_denied';
  end if;

  perform set_config('app.hire_workflow_authorized', 'true', true);
  update public.screening_processes
  set status = next_status,
      company_result = case when was_hired then 'hired' else null end,
      updated_at = timezone('utc', now())
  where id = target_process_id;

  insert into public.hire_confirmation_audit (confirmation_id, action, actor_user_id)
  values (confirmation_row.id, audit_action, auth.uid());

  if was_hired then
    billing_event_id := public.on_confirmed_hire(confirmation_row.id, 'cross_confirmation');
  else
    insert into public.notifications (user_id, title, body)
    select ur.user_id,
      'Nova disputa de contratação',
      'Um profissional negou uma contratação informada pela empresa. Analise o caso em Disputas de Contratação.'
    from public.user_roles ur
    where ur.role = 'admin';
  end if;

  return jsonb_build_object(
    'confirmation_id', confirmation_row.id,
    'status', confirmation_row.confirmation_status,
    'billing_event_id', billing_event_id
  );
end;
$$;

create or replace function public.admin_resolve_hire_dispute(
  target_confirmation_id uuid,
  resolution text,
  internal_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  confirmation_row public.hire_confirmations%rowtype;
  next_confirmation_status public.hire_confirmation_status;
  next_process_status public.process_status;
  audit_action text;
  billing_event_id uuid;
begin
  if not public.is_admin() then
    raise exception 'admin_access_required';
  end if;
  if resolution not in ('hired', 'not_hired') then
    raise exception 'invalid_hire_dispute_resolution';
  end if;

  select * into confirmation_row
  from public.hire_confirmations
  where id = target_confirmation_id
  for update;

  if confirmation_row.id is null then
    raise exception 'hire_confirmation_not_found';
  end if;
  if confirmation_row.confirmation_status not in ('disputed', 'expired_no_response') then
    raise exception 'hire_confirmation_not_in_dispute';
  end if;

  if resolution = 'hired' then
    next_confirmation_status := 'resolved_hired';
    next_process_status := 'hired';
    audit_action := 'admin_resolved_hired';
  else
    next_confirmation_status := 'resolved_not_hired';
    next_process_status := 'waiting';
    audit_action := 'admin_resolved_not_hired';
  end if;

  update public.hire_confirmations
  set confirmation_status = next_confirmation_status,
      resolved_by_admin_id = auth.uid(),
      resolved_at = timezone('utc', now()),
      resolution_note = nullif(trim(internal_note), ''),
      updated_at = timezone('utc', now())
  where id = target_confirmation_id
  returning * into confirmation_row;

  perform set_config('app.hire_workflow_authorized', 'true', true);
  update public.screening_processes
  set status = next_process_status,
      company_result = case when resolution = 'hired' then 'hired' else 'not_hired' end,
      updated_at = timezone('utc', now())
  where id = confirmation_row.process_id;

  insert into public.hire_confirmation_audit (confirmation_id, action, actor_user_id, note)
  values (confirmation_row.id, audit_action, auth.uid(), nullif(trim(internal_note), ''));

  if resolution = 'hired' then
    billing_event_id := public.on_confirmed_hire(confirmation_row.id, 'admin_dispute_resolution');
  end if;

  return jsonb_build_object(
    'confirmation_id', confirmation_row.id,
    'status', confirmation_row.confirmation_status,
    'billing_event_id', billing_event_id
  );
end;
$$;

create or replace function public.process_hire_confirmation_deadlines()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  reminder_days integer;
  reminder_count integer := 0;
  expired_count integer := 0;
  item record;
  professional_user_id uuid;
  professional_email text;
  professional_name text;
  company_name text;
  demand_title text;
begin
  select reminder_after_days
  into reminder_days
  from public.hire_confirmation_config
  where id = true;

  for item in
    select hc.id, hc.process_id, hc.company_confirmed_at, hc.deadline_at
    from public.hire_confirmations hc
    where hc.confirmation_status = 'awaiting_professional'
      and hc.professional_confirmed is null
      and hc.reminder_sent_at is null
      and hc.company_confirmed_at + make_interval(days => reminder_days) <= timezone('utc', now())
      and hc.deadline_at > timezone('utc', now())
    for update skip locked
  loop
    select p.user_id, p.email, p.full_name, coalesce(c.trade_name, c.legal_name), d.title
    into professional_user_id, professional_email, professional_name, company_name, demand_title
    from public.screening_processes sp
    join public.professionals p on p.id = sp.professional_id
    join public.demands d on d.id = sp.demand_id
    join public.companies c on c.id = d.company_id
    where sp.id = item.process_id;

    update public.hire_confirmations
    set reminder_sent_at = timezone('utc', now()), updated_at = timezone('utc', now())
    where id = item.id;

    insert into public.notifications (user_id, title, body)
    values (
      professional_user_id,
      'Lembrete: confirme sua contratação',
      format(
        'Confirme se você foi contratado pela %s para a vaga %s até %s.',
        company_name,
        demand_title,
        to_char(item.deadline_at at time zone 'America/Sao_Paulo', 'DD/MM/YYYY')
      )
    );

    insert into public.hire_confirmation_audit (confirmation_id, action, metadata)
    values (item.id, 'reminder_sent', jsonb_build_object('deadline_at', item.deadline_at));

    if professional_email is not null and professional_email <> '' then
      insert into public.hire_confirmation_email_queue (
        confirmation_id,
        recipient_user_id,
        recipient_email,
        template_key,
        variables
      )
      values (
        item.id,
        professional_user_id,
        professional_email,
        'hire_confirmation_reminder',
        jsonb_build_object(
          'name', professional_name,
          'company', company_name,
          'demand', demand_title,
          'deadline', to_char(item.deadline_at at time zone 'America/Sao_Paulo', 'DD/MM/YYYY'),
          'path', '/professional/screening-status'
        )
      )
      on conflict (confirmation_id, template_key) do nothing;
    end if;

    reminder_count := reminder_count + 1;
  end loop;

  for item in
    select hc.id, hc.process_id
    from public.hire_confirmations hc
    where hc.confirmation_status = 'awaiting_professional'
      and hc.professional_confirmed is null
      and hc.deadline_at <= timezone('utc', now())
    for update skip locked
  loop
    update public.hire_confirmations
    set confirmation_status = 'expired_no_response',
        dispute_reason = 'professional_no_response',
        updated_at = timezone('utc', now())
    where id = item.id;

    perform set_config('app.hire_workflow_authorized', 'true', true);
    update public.screening_processes
    set status = 'hire_dispute', updated_at = timezone('utc', now())
    where id = item.process_id;

    insert into public.hire_confirmation_audit (confirmation_id, action)
    values (item.id, 'expired');

    insert into public.notifications (user_id, title, body)
    select ur.user_id,
      'Contratação sem resposta',
      'O prazo de confirmação profissional expirou. Analise o caso em Disputas de Contratação.'
    from public.user_roles ur
    where ur.role = 'admin';

    expired_count := expired_count + 1;
  end loop;

  return jsonb_build_object(
    'reminders_created', reminder_count,
    'confirmations_expired', expired_count
  );
end;
$$;

create or replace function public.ensure_hire_confirmation_after_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'pre_approved' then
    insert into public.hire_confirmations (process_id)
    values (new.id)
    on conflict (process_id) do nothing;
  end if;
  return new;
end;
$$;

create or replace function public.guard_hire_workflow_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status
    and (
      old.status in ('awaiting_professional_confirmation', 'hire_dispute', 'hired')
      or new.status in ('awaiting_professional_confirmation', 'hire_dispute', 'hired')
    )
    and coalesce(current_setting('app.hire_workflow_authorized', true), 'false') <> 'true'
  then
    raise exception 'hire_status_requires_confirmation_workflow';
  end if;
  return new;
end;
$$;

drop trigger if exists screening_process_hire_confirmation on public.screening_processes;
drop trigger if exists screening_process_hire_confirmation_after_approval on public.screening_processes;
create trigger screening_process_hire_confirmation_after_approval
after insert or update of status on public.screening_processes
for each row execute function public.ensure_hire_confirmation_after_approval();

drop trigger if exists screening_process_guard_hired on public.screening_processes;
drop trigger if exists screening_process_guard_hire_workflow on public.screening_processes;
create trigger screening_process_guard_hire_workflow
before update of status on public.screening_processes
for each row execute function public.guard_hire_workflow_status();

alter table public.hire_confirmation_config enable row level security;
alter table public.hire_confirmations enable row level security;
alter table public.hire_confirmation_audit enable row level security;
alter table public.hire_billing_events enable row level security;
alter table public.hire_confirmation_email_queue enable row level security;

drop policy if exists "hire confirmations participants after own step or admin" on public.hire_confirmations;
create policy "hire confirmations participants after own step or admin"
on public.hire_confirmations
for select
to authenticated
using (
  public.is_admin()
  or (company_confirmed and public.hire_company_owns_process(process_id))
  or (company_confirmed and public.hire_professional_owns_process(process_id))
);

drop policy if exists "hire confirmation audit admin read" on public.hire_confirmation_audit;
create policy "hire confirmation audit admin read"
on public.hire_confirmation_audit
for select
to authenticated
using (public.is_admin());

drop policy if exists "hire billing events admin read" on public.hire_billing_events;
create policy "hire billing events admin read"
on public.hire_billing_events
for select
to authenticated
using (public.is_admin());

revoke all on table public.hire_confirmation_config from public, anon, authenticated;
revoke all on table public.hire_confirmations from public, anon, authenticated;
revoke all on table public.hire_confirmation_audit from public, anon, authenticated;
revoke all on table public.hire_billing_events from public, anon, authenticated;
revoke all on table public.hire_confirmation_email_queue from public, anon, authenticated;
grant select on table public.hire_confirmations to authenticated;
grant select on table public.hire_confirmation_audit to authenticated;
grant select on table public.hire_billing_events to authenticated;

revoke all on function public.hire_company_owns_process(uuid) from public, anon;
revoke all on function public.hire_professional_owns_process(uuid) from public, anon;
revoke all on function public.get_company_candidate_resume(uuid) from public, anon;
revoke all on function public.company_confirm_hire(uuid) from public, anon;
revoke all on function public.professional_respond_hire(uuid, boolean) from public, anon;
revoke all on function public.admin_resolve_hire_dispute(uuid, text, text) from public, anon;
revoke all on function public.on_confirmed_hire(uuid, text) from public, anon, authenticated;
revoke all on function public.process_hire_confirmation_deadlines() from public, anon, authenticated;
revoke all on function public.ensure_hire_confirmation_after_approval() from public, anon, authenticated;
revoke all on function public.guard_hire_workflow_status() from public, anon, authenticated;

grant execute on function public.hire_company_owns_process(uuid) to authenticated;
grant execute on function public.hire_professional_owns_process(uuid) to authenticated;
grant execute on function public.get_company_candidate_resume(uuid) to authenticated;
grant execute on function public.company_confirm_hire(uuid) to authenticated;
grant execute on function public.professional_respond_hire(uuid, boolean) to authenticated;
grant execute on function public.admin_resolve_hire_dispute(uuid, text, text) to authenticated;
grant execute on function public.process_hire_confirmation_deadlines() to service_role;

comment on table public.hire_billing_events is
  'Evento idempotente criado somente apos confirmacao cruzada ou resolucao administrativa de disputa; fonte da cobranca por contratacao.';
comment on function public.get_company_candidate_resume(uuid) is
  'Retorna apenas dados curriculares para a empresa dona do processo; nunca retorna email, telefone, documentos ou endereco completo.';
