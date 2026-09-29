-- ==============================================================================
-- Migration: 20260930000005_enforce_strict_rbac_rls.sql
-- Description: Eksiksiz RLS Politikaları, Öğrenci Tabloları Güvenliği,
--              İstemci Yazma Yasakları ve Eşzamanlı Son Süper Admin Koruması
-- ==============================================================================

-- 1. EKSİK ÖĞRENCİ VE İLERLEME TABLOLARININ OLUŞTURULMASI (IF NOT EXISTS)
-- ------------------------------------------------------------------------------

-- Exam Attempts (Sınav Oturumları ve Sonuçları)
create table if not exists public.exam_attempts (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid,
  status text not null check (status in ('in_progress', 'completed', 'abandoned')) default 'in_progress',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  current_question_index integer not null default 0,
  remaining_seconds integer not null default 0,
  score numeric(5,2),
  correct_count integer default 0,
  wrong_count integer default 0,
  net_score numeric(5,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_exam_attempts_user_id on public.exam_attempts(user_id);
create index if not exists idx_exam_attempts_status on public.exam_attempts(status);

-- Question Attempts (Soru Bazlı Yanıt ve Performans Kaydı)
create table if not exists public.question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  exam_attempt_id text,
  selected_option text,
  is_correct boolean not null,
  time_spent_seconds integer default 0,
  client_event_id text unique,
  created_at timestamptz not null default now()
);

create index if not exists idx_question_attempts_user_id on public.question_attempts(user_id);
create index if not exists idx_question_attempts_question_id on public.question_attempts(question_id);

-- Spaced Repetition Cards (Leitner Kutusu / Aralıklı Tekrar)
create table if not exists public.spaced_repetition_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  box integer not null default 1,
  repetitions integer not null default 0,
  interval_days integer not null default 1,
  ease_factor numeric(4,2) not null default 2.50,
  last_reviewed_at timestamptz not null default now(),
  next_review_at timestamptz not null default now(),
  constraint uq_card_user_question unique(user_id, question_id)
);

create index if not exists idx_spaced_cards_user_id on public.spaced_repetition_cards(user_id);
create index if not exists idx_spaced_cards_next_review on public.spaced_repetition_cards(next_review_at);

-- Error Pool (Hata Havuzu ve Yanlış Yapılan Sorular)
create table if not exists public.error_pool (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  wrong_count integer not null default 1,
  is_resolved boolean not null default false,
  reported_error text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_error_user_question unique(user_id, question_id)
);

create index if not exists idx_error_pool_user_id on public.error_pool(user_id);
create index if not exists idx_error_pool_question_id on public.error_pool(question_id);

-- Exam Templates (Deneme Sınav Şablonları)
create table if not exists public.exam_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  total_questions integer not null default 120,
  duration_minutes integer not null default 130,
  is_active boolean not null default true,
  distribution jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 2. RLS ETKİNLEŞTİRME (TÜM TABLOLAR)
-- ------------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.teacher_classes enable row level security;
alter table public.class_members enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_results enable row level security;
alter table public.subjects enable row level security;
alter table public.units enable row level security;
alter table public.topics enable row level security;
alter table public.questions enable row level security;
alter table public.exam_attempts enable row level security;
alter table public.question_attempts enable row level security;
alter table public.spaced_repetition_cards enable row level security;
alter table public.error_pool enable row level security;
alter table public.exam_templates enable row level security;
alter table public.audit_logs enable row level security;

-- ------------------------------------------------------------------------------
-- 3. USER_ROLES TABLOSU KATI GÜVENLİK AYARLARI
-- (İstemciden doğrudan INSERT, UPDATE, DELETE tamamen KAPATILIR. Yalnızca RPC ile yapılır)
-- ------------------------------------------------------------------------------
drop policy if exists "Yalnızca super admin rol ekleyebilir" on public.user_roles;
drop policy if exists "Yalnızca super admin rol silebilir" on public.user_roles;
drop policy if exists "Kullanıcılar yalnızca kendi rollerini okuyabilir" on public.user_roles;

-- Okuma: Yalnızca kendi rolünü veya super admin okuyabilir. Anon kesinlikle okuyamaz.
create policy "user_roles_select_policy"
  on public.user_roles for select
  using (
    auth.uid() is not null
    and (auth.uid() = user_id or public.is_super_admin())
  );

-- Yazma (INSERT/UPDATE/DELETE): İstemciden doğrudan erişim tamamen engellenir (False)
create policy "user_roles_no_direct_client_insert"
  on public.user_roles for insert
  with check (false);

create policy "user_roles_no_direct_client_update"
  on public.user_roles for update
  using (false);

create policy "user_roles_no_direct_client_delete"
  on public.user_roles for delete
  using (false);

-- ------------------------------------------------------------------------------
-- 4. PROFILES TABLOSU İZOLASYON POLİTİKALARI
-- (Üye yalnızca kendisini görür. Öğretmen yalnızca bağlı aktif öğrencisini görür)
-- ------------------------------------------------------------------------------
drop policy if exists "Herkes yayımlanmış/aktif temel profil bilgilerini okuyabilir" on public.profiles;
drop policy if exists "Kullanıcılar yalnızca kendi profilini güncelleyebilir" on public.profiles;
drop policy if exists "Super admin tüm profilleri yönetebilir" on public.profiles;

create policy "profiles_select_isolated"
  on public.profiles for select
  using (
    auth.uid() is not null
    and (
      auth.uid() = id
      or public.is_teacher_of(id)
      or public.is_super_admin()
    )
  );

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id or public.is_super_admin())
  with check (
    (auth.uid() = id and status = 'active') -- Kendi hesabını suspend yapamaz / rol yükseltemez
    or public.is_super_admin()
  );

create policy "profiles_insert_own_or_admin"
  on public.profiles for insert
  with check (auth.uid() = id or public.is_super_admin());

create policy "profiles_delete_admin_only"
  on public.profiles for delete
  using (public.is_super_admin());

-- ------------------------------------------------------------------------------
-- 5. SINAV VE ÖĞRENCİ VERİLERİ (EXAM_ATTEMPTS, QUESTION_ATTEMPTS, KARTLAR)
-- (Öğretmen salt-okunur görebilir, değiştiremez. Üye yalnızca kendisininkini yönetir)
-- ------------------------------------------------------------------------------

-- Exam Attempts Policies
drop policy if exists "exam_attempts_select" on public.exam_attempts;
drop policy if exists "exam_attempts_insert" on public.exam_attempts;
drop policy if exists "exam_attempts_update" on public.exam_attempts;
drop policy if exists "exam_attempts_delete" on public.exam_attempts;

create policy "exam_attempts_select"
  on public.exam_attempts for select
  using (
    auth.uid() is not null
    and (
      auth.uid() = user_id
      or public.is_teacher_of(user_id)
      or public.is_super_admin()
    )
  );

create policy "exam_attempts_insert"
  on public.exam_attempts for insert
  with check (
    auth.uid() is not null
    and (auth.uid() = user_id or public.is_super_admin())
  );

-- Öğretmen öğrenci sonucunu DEĞİŞTİREMEZ (Yalnızca öğrenci kendisininkini veya super admin güncelleyebilir)
create policy "exam_attempts_update"
  on public.exam_attempts for update
  using (
    auth.uid() is not null
    and (auth.uid() = user_id or public.is_super_admin())
  );

create policy "exam_attempts_delete"
  on public.exam_attempts for delete
  using (
    auth.uid() is not null
    and (auth.uid() = user_id or public.is_super_admin())
  );

-- Question Attempts Policies
drop policy if exists "question_attempts_select" on public.question_attempts;
drop policy if exists "question_attempts_insert" on public.question_attempts;
drop policy if exists "question_attempts_update" on public.question_attempts;
drop policy if exists "question_attempts_delete" on public.question_attempts;

create policy "question_attempts_select"
  on public.question_attempts for select
  using (
    auth.uid() is not null
    and (
      auth.uid() = user_id
      or public.is_teacher_of(user_id)
      or public.is_super_admin()
    )
  );

create policy "question_attempts_insert"
  on public.question_attempts for insert
  with check (
    auth.uid() is not null
    and (auth.uid() = user_id or public.is_super_admin())
  );

create policy "question_attempts_update"
  on public.question_attempts for update
  using (
    auth.uid() is not null
    and (auth.uid() = user_id or public.is_super_admin())
  );

create policy "question_attempts_delete"
  on public.question_attempts for delete
  using (
    auth.uid() is not null
    and (auth.uid() = user_id or public.is_super_admin())
  );

-- Spaced Repetition Cards Policies
drop policy if exists "spaced_cards_select" on public.spaced_repetition_cards;
drop policy if exists "spaced_cards_insert" on public.spaced_repetition_cards;
drop policy if exists "spaced_cards_update" on public.spaced_repetition_cards;
drop policy if exists "spaced_cards_delete" on public.spaced_repetition_cards;

create policy "spaced_cards_select"
  on public.spaced_repetition_cards for select
  using (
    auth.uid() is not null
    and (
      auth.uid() = user_id
      or public.is_teacher_of(user_id)
      or public.is_super_admin()
    )
  );

create policy "spaced_cards_insert"
  on public.spaced_repetition_cards for insert
  with check (
    auth.uid() is not null
    and (auth.uid() = user_id or public.is_super_admin())
  );

create policy "spaced_cards_update"
  on public.spaced_repetition_cards for update
  using (
    auth.uid() is not null
    and (auth.uid() = user_id or public.is_super_admin())
  );

create policy "spaced_cards_delete"
  on public.spaced_repetition_cards for delete
  using (
    auth.uid() is not null
    and (auth.uid() = user_id or public.is_super_admin())
  );

-- Error Pool Policies
drop policy if exists "error_pool_select" on public.error_pool;
drop policy if exists "error_pool_insert" on public.error_pool;
drop policy if exists "error_pool_update" on public.error_pool;
drop policy if exists "error_pool_delete" on public.error_pool;

create policy "error_pool_select"
  on public.error_pool for select
  using (
    auth.uid() is not null
    and (
      auth.uid() = user_id
      or public.is_teacher_of(user_id)
      or public.is_editor_or_admin()
    )
  );

create policy "error_pool_insert"
  on public.error_pool for insert
  with check (
    auth.uid() is not null
    and (auth.uid() = user_id or public.is_editor_or_admin())
  );

create policy "error_pool_update"
  on public.error_pool for update
  using (
    auth.uid() is not null
    and (auth.uid() = user_id or public.is_editor_or_admin())
  );

create policy "error_pool_delete"
  on public.error_pool for delete
  using (
    auth.uid() is not null
    and (auth.uid() = user_id or public.is_super_admin())
  );

-- ------------------------------------------------------------------------------
-- 6. MÜFREDAT VE SORULAR (EDITÖR VE SUPER ADMİN DIŞINDA DEĞİŞTİRİLEMEZ)
-- ------------------------------------------------------------------------------
-- Öğretmen ve Üye genel müfredatı değiştiremez. Yalnızca published içerikleri okuyabilir.
drop policy if exists "Herkes yayımlanmış dersleri görebilir" on public.subjects;
drop policy if exists "Editör ve Admin ders yönetebilir" on public.subjects;
create policy "subjects_select" on public.subjects for select
  using (status = 'published' or public.is_editor_or_admin());
create policy "subjects_manage" on public.subjects for all
  using (public.is_editor_or_admin());

drop policy if exists "Herkes yayımlanmış üniteleri görebilir" on public.units;
drop policy if exists "Editör ve Admin ünite yönetebilir" on public.units;
create policy "units_select" on public.units for select
  using (status = 'published' or public.is_editor_or_admin());
create policy "units_manage" on public.units for all
  using (public.is_editor_or_admin());

drop policy if exists "Herkes yayımlanmış konuları görebilir" on public.topics;
drop policy if exists "Editör ve Admin konu yönetebilir" on public.topics;
create policy "topics_select" on public.topics for select
  using (status = 'published' or public.is_editor_or_admin());
create policy "topics_manage" on public.topics for all
  using (public.is_editor_or_admin());

drop policy if exists "Herkes yayımlanmış soruları görebilir" on public.questions;
drop policy if exists "Editör ve Admin soru yönetebilir" on public.questions;
create policy "questions_select" on public.questions for select
  using (status = 'published' or public.is_editor_or_admin());
create policy "questions_manage" on public.questions for all
  using (public.is_editor_or_admin());

-- Exam Templates
create policy "exam_templates_select" on public.exam_templates for select
  using (is_active = true or public.is_editor_or_admin());
create policy "exam_templates_manage" on public.exam_templates for all
  using (public.is_editor_or_admin());

-- ------------------------------------------------------------------------------
-- 7. GÜVENLİ VE EŞZAMANLI (CONCURRENCY-SAFE) RPC FONKSİYONLARI
-- ------------------------------------------------------------------------------

-- Rol Atama (Kullanıcı kendisine rol atayamaz; çağıran auth.uid() super_admin olmalıdır)
create or replace function public.assign_user_role(target_user_id uuid, new_role text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  caller_id uuid;
begin
  caller_id := auth.uid();
  if caller_id is null or not public.is_super_admin() then
    raise exception 'Yetkisiz erişim: Bu işlemi yalnızca süper yöneticiler gerçekleştirebilir.';
  end if;

  if target_user_id = caller_id then
    raise exception 'Güvenlik kuralı: Yönetici kendi rolünü doğrudan değiştiremez.';
  end if;

  if new_role not in ('member', 'teacher', 'editor', 'super_admin') then
    raise exception 'Geçersiz rol: %', new_role;
  end if;

  if not exists (select 1 from public.profiles where id = target_user_id) then
    raise exception 'Hedef kullanıcı profili bulunamadı.';
  end if;

  insert into public.user_roles (user_id, role, assigned_by, created_at)
  values (target_user_id, new_role, caller_id, now())
  on conflict (user_id, role) do nothing;

  -- Audit log kaydı
  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
  values (
    caller_id,
    'ASSIGN_ROLE',
    'user_roles',
    target_user_id::text,
    jsonb_build_object('assigned_role', new_role, 'assigned_to', target_user_id)
  );

  return jsonb_build_object('success', true, 'message', 'Rol başarıyla atandı.');
end;
$$;

-- Rol Kaldırma (Eşzamanlı son super_admin koruması ile row-locking)
create or replace function public.remove_user_role(target_user_id uuid, target_role text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  caller_id uuid;
  active_super_admin_count integer;
begin
  caller_id := auth.uid();
  if caller_id is null or not public.is_super_admin() then
    raise exception 'Yetkisiz erişim: Bu işlemi yalnızca süper yöneticiler gerçekleştirebilir.';
  end if;

  -- Son aktif super_admin koruması: Eşzamanlı yarış koşullarını önlemek için FOR UPDATE kilidi
  if target_role = 'super_admin' then
    perform pg_advisory_xact_lock(hashtext('super_admin_role_lock'));

    select count(*) into active_super_admin_count
    from public.user_roles
    where role = 'super_admin'
    for update;

    if active_super_admin_count <= 1 then
      raise exception 'Güvenlik kuralı: Sistemdeki son süper yönetici rolü silinemez!';
    end if;
  end if;

  delete from public.user_roles
  where user_id = target_user_id
    and role = target_role;

  -- Audit log kaydı
  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
  values (
    caller_id,
    'REMOVE_ROLE',
    'user_roles',
    target_user_id::text,
    jsonb_build_object('removed_role', target_role, 'target_user_id', target_user_id)
  );

  return jsonb_build_object('success', true, 'message', 'Rol başarıyla kaldırıldı.');
end;
$$;

-- Execute izinlerini sınırla
revoke execute on function public.assign_user_role from public;
grant execute on function public.assign_user_role to authenticated;

revoke execute on function public.remove_user_role from public;
grant execute on function public.remove_user_role to authenticated;

revoke execute on function public.suspend_user from public;
grant execute on function public.suspend_user to authenticated;

revoke execute on function public.reactivate_user from public;
grant execute on function public.reactivate_user to authenticated;
