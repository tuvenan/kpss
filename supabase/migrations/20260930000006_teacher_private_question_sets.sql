-- ==============================================================================
-- Migration: 20260930000006_teacher_private_question_sets.sql
-- Description: Öğretmenlere özel soru setleri (özel soru bankaları) ve RLS politikaları
-- ==============================================================================

create table if not exists public.teacher_question_sets (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid references public.teacher_classes(id) on delete set null,
  title text not null,
  description text default '',
  subject_id text,
  questions jsonb not null default '[]'::jsonb,
  is_private boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_teacher_question_sets_teacher on public.teacher_question_sets(teacher_id);
create index if not exists idx_teacher_question_sets_class on public.teacher_question_sets(class_id);

alter table public.teacher_question_sets enable row level security;

-- Yalnızca oluşturan öğretmen ve süper admin görebilir; diğer öğretmenler göremez
create policy "teacher_question_sets_select"
  on public.teacher_question_sets for select
  using (
    auth.uid() is not null
    and (auth.uid() = teacher_id or public.is_super_admin())
  );

create policy "teacher_question_sets_insert"
  on public.teacher_question_sets for insert
  with check (
    auth.uid() is not null
    and (auth.uid() = teacher_id or public.is_super_admin())
  );

create policy "teacher_question_sets_update"
  on public.teacher_question_sets for update
  using (
    auth.uid() is not null
    and (auth.uid() = teacher_id or public.is_super_admin())
  );

create policy "teacher_question_sets_delete"
  on public.teacher_question_sets for delete
  using (
    auth.uid() is not null
    and (auth.uid() = teacher_id or public.is_super_admin())
  );
