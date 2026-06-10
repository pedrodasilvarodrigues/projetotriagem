create table public.demands (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  title text not null,
  description text not null,
  education_minimum education_level not null,
  accepted_formation_areas text[] not null default '{}',
  age_minimum integer check (age_minimum is null or age_minimum >= 14),
  age_maximum integer check (age_maximum is null or age_maximum >= 14),
  required_courses text[] not null default '{}',
  required_certifications text[] not null default '{}',
  minimum_experience_months integer not null default 0 check (minimum_experience_months >= 0),
  technical_skills text[] not null default '{}',
  behavioral_skills text[] not null default '{}',
  city text not null,
  state text not null,
  modality work_modality not null,
  contract_type contract_type not null,
  salary_min numeric(12,2),
  salary_max numeric(12,2),
  benefits text[] not null default '{}',
  openings integer not null default 1 check (openings > 0),
  closing_date date,
  internal_notes text,
  status demand_status not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.compatibility_scores (
  id uuid primary key default gen_random_uuid(),
  demand_id uuid not null references public.demands(id) on delete cascade,
  professional_id uuid not null references public.professionals(id) on delete cascade,
  education_score numeric(5,2) not null,
  experience_score numeric(5,2) not null,
  courses_score numeric(5,2) not null,
  technical_score numeric(5,2) not null,
  location_score numeric(5,2) not null,
  availability_score numeric(5,2) not null,
  total_score numeric(5,2) not null,
  calculated_at timestamptz not null default timezone('utc', now()),
  unique (demand_id, professional_id)
);

create table public.screening_processes (
  id uuid primary key default gen_random_uuid(),
  demand_id uuid not null references public.demands(id),
  professional_id uuid not null references public.professionals(id),
  status process_status not null default 'received',
  admin_owner_id uuid references auth.users(id),
  company_result text check (company_result is null or company_result in ('hired', 'not_hired')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (demand_id, professional_id)
);

create table public.process_history (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null references public.screening_processes(id) on delete cascade,
  changed_by uuid references auth.users(id),
  previous_status process_status,
  new_status process_status not null,
  note text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.process_notes (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null references public.screening_processes(id) on delete cascade,
  admin_id uuid not null references auth.users(id),
  note text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  active_version_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.resume_versions (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes(id) on delete cascade,
  version integer not null,
  storage_path text not null,
  generated_at timestamptz not null default timezone('utc', now()),
  invalidated_at timestamptz,
  unique (resume_id, version)
);

alter table public.resumes
add constraint resumes_active_version_id_fkey foreign key (active_version_id) references public.resume_versions(id);
