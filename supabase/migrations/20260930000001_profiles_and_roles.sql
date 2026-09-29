-- ==============================================================================
-- Migration: 20260930000001_profiles_and_roles.sql
-- Description: Kullanıcı profilleri, rol yetkilendirme şeması ve güvenli triggerlar
-- ==============================================================================

-- 1. PROFILES TABLOSU
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  display_name text, -- Geriye dönük uyumluluk
  username text unique,
  avatar_url text,
  exam_type text default 'KPSS Lisans (GY-GK)',
  daily_goal integer default 60, -- Geriye dönük uyumluluk
  target_score numeric(5,2),
  status text not null check (status in ('active', 'suspended', 'deleted')) default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Var olan tablolar için eksik kolonları ekle (veri kaybı olmadan migration)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'full_name') then
    alter table public.profiles add column full_name text not null default '';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'username') then
    alter table public.profiles add column username text unique;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'status') then
    alter table public.profiles add column status text not null check (status in ('active', 'suspended', 'deleted')) default 'active';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'updated_at') then
    alter table public.profiles add column updated_at timestamptz not null default now();
  end if;
end $$;

-- 2. USER_ROLES TABLOSU
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('member', 'teacher', 'editor', 'super_admin')),
  assigned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint uq_user_roles unique(user_id, role)
);

create index if index_user_roles_user_id not exists on public.user_roles(user_id);
create index if index_user_roles_role not exists on public.user_roles(role);

-- 3. GÜVENLİK YARDIMCI FONKSİYONLARI (SECURITY DEFINER)
create or replace function public.has_role(_user_id uuid, _role text)
returns boolean
language sql
security definer
stable
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
stable
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'super_admin'
  );
$$;

create or replace function public.is_editor_or_admin()
returns boolean
language sql
security definer
stable
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role in ('editor', 'super_admin')
  );
$$;

create or replace function public.is_teacher()
returns boolean
language sql
security definer
stable
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role in ('teacher', 'super_admin')
  );
$$;

-- 4. OTOMATİK PROFİL VE MEMBER ROLÜ TRİGGERI (SELF-SIGNUP GÜVENLİĞİ)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  raw_full_name text;
  raw_username text;
  raw_exam_type text;
begin
  raw_full_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  raw_username := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  raw_exam_type := coalesce(new.raw_user_meta_data->>'exam_type', 'KPSS Lisans (GY-GK)');

  -- Profil kaydı oluştur
  insert into public.profiles (id, full_name, display_name, username, avatar_url, exam_type, status, created_at, updated_at)
  values (
    new.id,
    raw_full_name,
    raw_full_name,
    raw_username,
    coalesce(new.raw_user_meta_data->>'avatar_url', ''),
    raw_exam_type,
    'active',
    now(),
    now()
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    updated_at = now();

  -- Kullanıcıya her zaman zorunlu olarak yalnızca 'member' rolü verilir (Privilege escalation önlenir)
  insert into public.user_roles (user_id, role, created_at)
  values (new.id, 'member', now())
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

-- Trigger'ı auth.users üzerine bağla (varsa önce kaldır)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5. RLS ETKİNLEŞTİRME
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

-- Profiles Politikaları
create policy "Herkes yayımlanmış/aktif temel profil bilgilerini okuyabilir"
  on public.profiles for select
  using (status = 'active');

create policy "Kullanıcılar yalnızca kendi profilini güncelleyebilir"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and status = 'active'); -- Kendi statüsünü değiştiremez

create policy "Super admin tüm profilleri yönetebilir"
  on public.profiles for all
  using (public.is_super_admin());

-- User Roles Politikaları
create policy "Kullanıcılar yalnızca kendi rollerini okuyabilir"
  on public.user_roles for select
  using (auth.uid() = user_id or public.is_super_admin());

-- Doğrudan istemci INSERT/UPDATE/DELETE kapalıdır (yalnızca güvenli super_admin RPC fonksiyonları yazabilir)
create policy "Yalnızca super admin rol ekleyebilir"
  on public.user_roles for insert
  with check (public.is_super_admin());

create policy "Yalnızca super admin rol silebilir"
  on public.user_roles for delete
  using (public.is_super_admin());
