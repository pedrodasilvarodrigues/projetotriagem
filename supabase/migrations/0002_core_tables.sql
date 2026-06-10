create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  avatar_path text,
  status approval_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and role = 'admin'
  );
$$;

create table public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ip_address inet,
  user_agent text,
  started_at timestamptz not null default timezone('utc', now()),
  ended_at timestamptz
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  legal_name text not null,
  trade_name text not null,
  cnpj text not null unique,
  city text not null,
  state text not null,
  status approval_status not null default 'pending',
  rejection_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.company_contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  role_title text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.company_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  document_type text not null,
  storage_path text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.professionals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  birth_date date not null,
  desired_role text not null,
  summary text,
  education_level education_level not null,
  city text not null,
  state text not null,
  available_in_days integer not null default 0 check (available_in_days >= 0),
  status approval_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.professional_experiences (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  company_name text not null,
  role_title text not null,
  description text not null,
  started_at date not null,
  ended_at date,
  is_current boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.professional_educations (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  level education_level not null,
  institution text not null,
  course_name text not null,
  completed_at date,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.professional_courses (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  name text not null,
  institution text,
  workload_hours integer check (workload_hours is null or workload_hours >= 0),
  completed_at date,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.professional_certificates (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  name text not null,
  issuer text,
  storage_path text,
  issued_at date,
  expires_at date,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.professional_skills (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  name text not null,
  skill_type text not null check (skill_type in ('technical', 'behavioral')),
  proficiency integer check (proficiency between 1 and 5),
  created_at timestamptz not null default timezone('utc', now())
);

create table public.professional_languages (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  language_name text not null,
  proficiency text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.professional_documents (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  document_type text not null,
  storage_path text not null,
  created_at timestamptz not null default timezone('utc', now())
);
