-- Core curriculum baseline.
-- The remote project already had these tables, but the migration history did
-- not create them, so a fresh local database could not be reproduced.

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  icon_name text,
  total_units integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  title text not null,
  unit_number integer not null,
  is_locked boolean not null default false,
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_units_subject_number unique(subject_id, unit_number)
);

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  topic_number integer not null,
  is_locked boolean not null default false,
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_topics_unit_number unique(unit_id, topic_number)
);

create table if not exists public.question_banks (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  unit_id uuid references public.units(id) on delete set null,
  title text not null,
  description text default '',
  bank_type text not null default 'standard',
  target_question_count integer not null default 20,
  question_count integer not null default 0,
  is_locked boolean not null default false,
  order_number integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  bank_id uuid references public.question_banks(id) on delete set null,
  topic_id uuid references public.topics(id) on delete set null,
  unit_id uuid references public.units(id) on delete set null,
  question_number integer not null,
  question_text text not null,
  options jsonb not null,
  correct_option char(1) not null check (correct_option in ('A', 'B', 'C', 'D', 'E')),
  explanation text default '',
  difficulty text not null default 'Orta' check (difficulty in ('Kolay', 'Orta', 'Zor')),
  year text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_units_subject_id on public.units(subject_id);
create index if not exists idx_topics_unit_id on public.topics(unit_id);
create index if not exists idx_topics_subject_id on public.topics(subject_id);
create index if not exists idx_question_banks_topic_id on public.question_banks(topic_id);
create index if not exists idx_question_banks_unit_id on public.question_banks(unit_id);
create index if not exists idx_questions_bank_id on public.questions(bank_id);
create index if not exists idx_questions_topic_id on public.questions(topic_id);
create index if not exists idx_questions_unit_id on public.questions(unit_id);
