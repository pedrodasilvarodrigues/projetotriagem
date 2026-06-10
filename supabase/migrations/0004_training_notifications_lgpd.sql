create table public.training_tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.training_courses (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.training_tracks(id) on delete cascade,
  title text not null,
  description text not null,
  workload_hours integer not null check (workload_hours >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create table public.training_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.training_courses(id) on delete cascade,
  title text not null,
  position integer not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.training_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.training_modules(id) on delete cascade,
  title text not null,
  content_url text,
  material_path text,
  position integer not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.training_enrollments (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  track_id uuid not null references public.training_tracks(id),
  enrolled_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  unique (professional_id, track_id)
);

create table public.training_progress (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.training_enrollments(id) on delete cascade,
  lesson_id uuid not null references public.training_lessons(id),
  completed_at timestamptz,
  unique (enrollment_id, lesson_id)
);

create table public.training_certificates (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.training_enrollments(id),
  certificate_code text not null unique,
  storage_path text not null,
  issued_at timestamptz not null default timezone('utc', now())
);

create table public.training_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_email text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.notification_templates (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text not null,
  body text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.email_logs (
  id uuid primary key default gen_random_uuid(),
  recipient text not null,
  template_key text not null,
  provider_id text,
  status text not null,
  error_message text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.support_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  opened_by uuid not null references auth.users(id),
  category_id uuid references public.support_categories(id),
  title text not null,
  description text not null,
  status ticket_status not null default 'open',
  protocol text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  closed_at timestamptz
);

create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_id uuid not null references auth.users(id),
  message text not null,
  attachment_path text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.platform_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  rating integer not null check (rating between 1 and 5),
  comment text not null check (char_length(comment) >= 20),
  improvement_suggestion text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.review_responses (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.platform_reviews(id) on delete cascade,
  admin_id uuid not null references auth.users(id),
  response text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  terms_version text not null,
  privacy_version text not null,
  ip_address inet,
  user_agent text,
  consented_at timestamptz not null default timezone('utc', now())
);

create table public.data_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  request_type data_request_type not null,
  status data_request_status not null default 'requested',
  result_storage_path text,
  created_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz
);

create table public.anonymization_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  executed_by uuid references auth.users(id),
  summary text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  action text not null,
  table_name text not null,
  record_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default timezone('utc', now())
);
