-- =========================================================
-- KPSS Soru Bankası - Supabase Veritabanı Şeması
-- =========================================================

-- 1. 'subjects' Tablosu (Dersler: Tarih, Coğrafya, Vatandaşlık)
create table if not exists public.subjects (
  id text primary key,
  title text not null,
  icon_name text default 'book-outline',
  total_units integer default 10,
  created_at timestamp with time zone default now()
);

alter table public.subjects enable row level security;
create policy "Dersleri herkes okuyabilir" on public.subjects for select using (true);
create policy "Dersleri yönetici ekleyebilir" on public.subjects for insert with check (true);

-- 2. 'units' Tablosu (Ders Üniteleri)
create table if not exists public.units (
  id text primary key,
  subject_id text not null references public.subjects(id) on delete cascade,
  title text not null,
  unit_number integer not null,
  is_locked boolean default true,
  is_completed boolean default false,
  created_at timestamp with time zone default now()
);

create index if not exists idx_units_subject on public.units (subject_id, unit_number);
alter table public.units enable row level security;
create policy "Üniteleri herkes okuyabilir" on public.units for select using (true);
create policy "Üniteleri yönetici ekleyebilir" on public.units for insert with check (true);

-- 3. 'topics' Tablosu (Ünite Konuları: 20'şer soruluk test birimleri)
create table if not exists public.topics (
  id text primary key,
  unit_id text not null references public.units(id) on delete cascade,
  title text not null,
  topic_number integer not null,
  is_locked boolean default false,
  is_completed boolean default false,
  created_at timestamp with time zone default now()
);

create index if not exists idx_topics_unit on public.topics (unit_id, topic_number);
alter table public.topics enable row level security;
create policy "Konuları herkes okuyabilir" on public.topics for select using (true);
create policy "Konuları yönetici ekleyebilir" on public.topics for insert with check (true);

-- 4. 'user_unit_progress' Tablosu (Kullanıcı Ünite/Konu Tamamlama Takibi)
create table if not exists public.user_unit_progress (
  id uuid default gen_random_uuid() primary key,
  user_id text not null default 'anonymous_user',
  unit_id text not null references public.units(id) on delete cascade,
  is_completed boolean default true,
  updated_at timestamp with time zone default now(),
  constraint unique_user_unit unique (user_id, unit_id)
);

alter table public.user_unit_progress enable row level security;
create policy "Kullanıcı kendi ilerlemesini yönetebilir" on public.user_unit_progress for all using (true) with check (true);

-- 5. 'questions' Tablosu (Bulut Soru Bankası)
create table if not exists public.questions (
  id text primary key,
  topic_id text references public.topics(id) on delete cascade,
  unit_id text references public.units(id) on delete cascade,
  question_number integer not null,
  question_text text not null,
  options jsonb not null,
  correct_option text not null,
  explanation text not null,
  created_at timestamp with time zone default now()
);

create index if not exists idx_questions_topic on public.questions (topic_id);
create index if not exists idx_questions_unit on public.questions (unit_id);
create index if not exists idx_questions_number on public.questions (topic_id, question_number);

alter table public.questions enable row level security;
create policy "Soruları herkes okuyabilir" on public.questions for select using (true);
create policy "Soruları yönetici ekleyebilir" on public.questions for insert with check (true);

-- 5. 'error_pool' Tablosu (Yanlış Yapılan Sorular Havuzu)
create table if not exists public.error_pool (
  id uuid default gen_random_uuid() primary key,
  user_id text not null default 'anonymous_user',
  question_id text not null references public.questions(id) on delete cascade,
  unit_id text not null,
  selected_option text not null,
  correct_option text not null,
  wrong_count integer default 1,
  is_resolved boolean default false,
  last_attempt_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  constraint unique_user_question unique (user_id, question_id)
);

create index if not exists idx_error_pool_user_resolved on public.error_pool (user_id, is_resolved);
create index if not exists idx_error_pool_unit on public.error_pool (unit_id);

alter table public.error_pool enable row level security;
create policy "Hata havuzu erişim politikası" on public.error_pool for all using (true) with check (true);
