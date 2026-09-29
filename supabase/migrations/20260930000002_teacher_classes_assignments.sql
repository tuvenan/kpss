-- ==============================================================================
-- Migration: 20260930000002_teacher_classes_assignments.sql
-- Description: Öğretmen sınıfları, sınıf üyeleri, ödevler ve sonuç tabloları
-- ==============================================================================

-- 1. TEACHER_CLASSES TABLOSU
create table if not exists public.teacher_classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text default '',
  invite_code text not null unique,
  invite_expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_teacher_classes_teacher_id on public.teacher_classes(teacher_id);
create index if not exists idx_teacher_classes_invite_code on public.teacher_classes(invite_code);

-- 2. CLASS_MEMBERS TABLOSU
create table if not exists public.class_members (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.teacher_classes(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('invited', 'active', 'removed')) default 'active',
  joined_at timestamptz not null default now(),
  constraint uq_class_student unique(class_id, student_id)
);

create index if not exists idx_class_members_class_id on public.class_members(class_id);
create index if not exists idx_class_members_student_id on public.class_members(student_id);

-- 3. ASSIGNMENTS TABLOSU
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null references public.teacher_classes(id) on delete cascade,
  title text not null,
  description text default '',
  assignment_type text not null check (assignment_type in ('quiz', 'mock_exam', 'study_plan')),
  configuration jsonb not null default '{}'::jsonb,
  due_at timestamptz,
  published_at timestamptz default now(),
  status text not null check (status in ('draft', 'published', 'archived')) default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_assignments_class_id on public.assignments(class_id);
create index if not exists idx_assignments_teacher_id on public.assignments(teacher_id);

-- 4. ASSIGNMENT_TARGETS TABLOSU (Bireysel öğrenciye özel atama)
create table if not exists public.assignment_targets (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint uq_assignment_student unique(assignment_id, student_id)
);

-- 5. ASSIGNMENT_RESULTS TABLOSU (Öğrenci ödev sonuçları)
create table if not exists public.assignment_results (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  exam_attempt_id text,
  status text not null check (status in ('assigned', 'started', 'completed', 'overdue')) default 'assigned',
  started_at timestamptz,
  completed_at timestamptz,
  score numeric(5,2),
  result_summary jsonb not null default '{}'::jsonb,
  constraint uq_assignment_result unique(assignment_id, student_id)
);

create index if not exists idx_assignment_results_student on public.assignment_results(student_id);
create index if not exists idx_assignment_results_assignment on public.assignment_results(assignment_id);

-- 6. GÜVENLİK YARDIMCI FONKSİYONLARI (SECURITY DEFINER)
create or replace function public.is_class_teacher(_class_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.teacher_classes
    where id = _class_id
      and teacher_id = auth.uid()
  ) or public.is_super_admin();
$$;

create or replace function public.is_teacher_of(_student_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.class_members cm
    join public.teacher_classes tc on tc.id = cm.class_id
    where cm.student_id = _student_id
      and cm.status = 'active'
      and tc.teacher_id = auth.uid()
  ) or public.is_super_admin();
$$;

create or replace function public.is_class_member(_class_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.class_members
    where class_id = _class_id
      and student_id = auth.uid()
      and status = 'active'
  ) or public.is_class_teacher(_class_id) or public.is_super_admin();
$$;

-- 7. RLS POLİTİKALARI
alter table public.teacher_classes enable row level security;
alter table public.class_members enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_targets enable row level security;
alter table public.assignment_results enable row level security;

-- Teacher Classes RLS
create policy "Öğretmenler kendi sınıflarını görebilir; üyeler kendi sınıfını görebilir"
  on public.teacher_classes for select
  using (
    teacher_id = auth.uid()
    or public.is_class_member(id)
    or public.is_super_admin()
  );

create policy "Yalnızca öğretmenler sınıf oluşturabilir"
  on public.teacher_classes for insert
  with check (
    (teacher_id = auth.uid() and public.is_teacher())
    or public.is_super_admin()
  );

create policy "Öğretmenler yalnızca kendi sınıflarını güncelleyebilir"
  on public.teacher_classes for update
  using (teacher_id = auth.uid() or public.is_super_admin());

create policy "Öğretmenler yalnızca kendi sınıflarını silebilir"
  on public.teacher_classes for delete
  using (teacher_id = auth.uid() or public.is_super_admin());

-- Class Members RLS
create policy "Öğretmen kendi sınıf üyelerini, öğrenci kendi kaydını görebilir"
  on public.class_members for select
  using (
    student_id = auth.uid()
    or public.is_class_teacher(class_id)
    or public.is_super_admin()
  );

create policy "Yalnızca sınıf öğretmeni üye ekleyebilir/yönetebilir"
  on public.class_members for insert
  with check (public.is_class_teacher(class_id) or public.is_super_admin());

create policy "Yalnızca sınıf öğretmeni üye durumunu güncelleyebilir"
  on public.class_members for update
  using (public.is_class_teacher(class_id) or public.is_super_admin());

create policy "Yalnızca sınıf öğretmeni üye silebilir"
  on public.class_members for delete
  using (public.is_class_teacher(class_id) or public.is_super_admin());

-- Assignments RLS
create policy "Sınıf üyeleri yayımlanmış ödevleri, öğretmen kendi ödevlerini görebilir"
  on public.assignments for select
  using (
    public.is_class_teacher(class_id)
    or (public.is_class_member(class_id) and status = 'published')
    or public.is_super_admin()
  );

create policy "Öğretmen kendi sınıfına ödev ekleyebilir"
  on public.assignments for insert
  with check (public.is_class_teacher(class_id) or public.is_super_admin());

create policy "Öğretmen kendi ödevlerini güncelleyebilir"
  on public.assignments for update
  using (public.is_class_teacher(class_id) or public.is_super_admin());

create policy "Öğretmen kendi ödevlerini silebilir"
  on public.assignments for delete
  using (public.is_class_teacher(class_id) or public.is_super_admin());

-- Assignment Results RLS
create policy "Öğrenci kendi sonucunu, öğretmen sınıfının sonuçlarını görebilir"
  on public.assignment_results for select
  using (
    student_id = auth.uid()
    or exists (
      select 1 from public.assignments a
      where a.id = assignment_id and public.is_class_teacher(a.class_id)
    )
    or public.is_super_admin()
  );

create policy "Öğrenci veya öğretmen ödev sonucunu başlatabilir/oluşturabilir"
  on public.assignment_results for insert
  with check (
    student_id = auth.uid()
    or exists (
      select 1 from public.assignments a
      where a.id = assignment_id and public.is_class_teacher(a.class_id)
    )
    or public.is_super_admin()
  );

create policy "Öğrenci yalnızca kendi ödev sonucunu güncelleyebilir"
  on public.assignment_results for update
  using (student_id = auth.uid() or public.is_super_admin());
