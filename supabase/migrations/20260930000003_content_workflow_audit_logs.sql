-- ==============================================================================
-- Migration: 20260930000003_content_workflow_audit_logs.sql
-- Description: İçerik iş akışı (workflow), denetim kayıtları (audit logs) ve davetiyeler
-- ==============================================================================

-- 1. İÇERİK TABLOLARINA WORKFLOW ALANLARININ EKLENMESİ
do $$
declare
  tbl text;
begin
  for tbl in select unnest(array['subjects', 'units', 'topics', 'questions']) loop
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = tbl) then
      -- status kolonu
      if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = tbl and column_name = 'status') then
        execute format('alter table public.%I add column status text not null check (status in (''draft'', ''in_review'', ''published'', ''archived'')) default ''published''', tbl);
      end if;
      -- created_by kolonu
      if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = tbl and column_name = 'created_by') then
        execute format('alter table public.%I add column created_by uuid references auth.users(id) on delete set null', tbl);
      end if;
      -- updated_by kolonu
      if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = tbl and column_name = 'updated_by') then
        execute format('alter table public.%I add column updated_by uuid references auth.users(id) on delete set null', tbl);
      end if;
      -- published_by kolonu
      if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = tbl and column_name = 'published_by') then
        execute format('alter table public.%I add column published_by uuid references auth.users(id) on delete set null', tbl);
      end if;
      -- published_at kolonu
      if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = tbl and column_name = 'published_at') then
        execute format('alter table public.%I add column published_at timestamptz default now()', tbl);
      end if;
      -- version kolonu
      if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = tbl and column_name = 'version') then
        execute format('alter table public.%I add column version integer not null default 1', tbl);
      end if;
    end if;
  end loop;
end $$;

-- 2. AUDIT_LOGS TABLOSU (APPEND-ONLY GÜVENLİK)
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_actor on public.audit_logs(actor_user_id);
create index if not exists idx_audit_logs_entity on public.audit_logs(entity_type, entity_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

-- 3. ROLE_INVITATIONS TABLOSU (GÜVENLİ DAVET SİSTEMİ)
create table if not exists public.role_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null check (role in ('teacher', 'editor')),
  token_hash text not null unique,
  invited_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_role_invitations_email on public.role_invitations(email);

-- 4. RLS ETKİNLEŞTİRME
alter table public.audit_logs enable row level security;
alter table public.role_invitations enable row level security;

-- Audit Logs RLS: Yalnızca super admin görüntüleyebilir; doğrudan UPDATE/DELETE KESİNLİKLE YASAKTIR
create policy "Yalnızca super admin audit kayıtlarını okuyabilir"
  on public.audit_logs for select
  using (public.is_super_admin());

create policy "Audit logları sistem ve admin fonksiyonları ekleyebilir"
  on public.audit_logs for insert
  with check (auth.uid() is not null);

-- Role Invitations RLS: Yalnızca super admin yönetebilir
create policy "Super admin rol davetiyelerini yönetebilir"
  on public.role_invitations for all
  using (public.is_super_admin());

-- 5. İÇERİK TABLOLARI İÇİN İŞ AKIŞI RLS POLİTİKALARI
-- Subjects
alter table public.subjects enable row level security;
drop policy if exists "Herkes yayımlanmış dersleri görebilir" on public.subjects;
create policy "Herkes yayımlanmış dersleri görebilir"
  on public.subjects for select
  using (status = 'published' or public.is_editor_or_admin());

drop policy if exists "Editör ve Admin ders yönetebilir" on public.subjects;
create policy "Editör ve Admin ders yönetebilir"
  on public.subjects for all
  using (public.is_editor_or_admin());

-- Units
alter table public.units enable row level security;
drop policy if exists "Herkes yayımlanmış üniteleri görebilir" on public.units;
create policy "Herkes yayımlanmış üniteleri görebilir"
  on public.units for select
  using (status = 'published' or public.is_editor_or_admin());

drop policy if exists "Editör ve Admin ünite yönetebilir" on public.units;
create policy "Editör ve Admin ünite yönetebilir"
  on public.units for all
  using (public.is_editor_or_admin());

-- Topics
alter table public.topics enable row level security;
drop policy if exists "Herkes yayımlanmış konuları görebilir" on public.topics;
create policy "Herkes yayımlanmış konuları görebilir"
  on public.topics for select
  using (status = 'published' or public.is_editor_or_admin());

drop policy if exists "Editör ve Admin konu yönetebilir" on public.topics;
create policy "Editör ve Admin konu yönetebilir"
  on public.topics for all
  using (public.is_editor_or_admin());

-- Questions
alter table public.questions enable row level security;
drop policy if exists "Herkes yayımlanmış soruları görebilir" on public.questions;
create policy "Herkes yayımlanmış soruları görebilir"
  on public.questions for select
  using (status = 'published' or public.is_editor_or_admin());

drop policy if exists "Editör ve Admin soru yönetebilir" on public.questions;
create policy "Editör ve Admin soru yönetebilir"
  on public.questions for all
  using (public.is_editor_or_admin());
