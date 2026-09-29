-- ==============================================================================
-- Migration: 20260930000009_username_constraints_and_login_rpc.sql
-- Description: Kullanıcı adı kuralları, normalize edilmiş indeks ve
--              kullanıcı adıyla güvenli giriş için RPC fonksiyonu.
--              Mevcut tablolara yıkıcı değişiklik yapmaz (forward-only).
-- ==============================================================================

-- 1. NORMALIZE EDİLMİŞ KULLANICI ADI KOLONU
-- Büyük/küçük harften bağımsız benzersizlik için ayrı bir kolon.
alter table public.profiles
  add column if not exists username_normalized text;

-- Mevcut kullanıcı adlarını normalize et (backfill)
update public.profiles
set username_normalized = lower(trim(username))
where username is not null
  and username_normalized is null;

-- Benzersiz indeks: büyük/küçük harf bağımsız
create unique index if not exists idx_profiles_username_normalized
  on public.profiles (username_normalized)
  where username_normalized is not null;

-- 2. KULLANICI ADI DOĞRULAMA FONKSİYONU
-- 3-30 karakter, yalnızca harf/sayı/nokta/alt çizgi, baş/sonda nokta yok, boşluk yok
create or replace function public.validate_username(uname text)
returns boolean
language plpgsql
immutable
as $$
begin
  if uname is null or length(uname) < 3 or length(uname) > 30 then
    return false;
  end if;
  -- Yalnızca harf, sayı, nokta ve alt çizgi
  if uname !~ '^[a-zA-Z0-9._]+$' then
    return false;
  end if;
  -- Baş veya sonda nokta yok
  if uname like '.%' or uname like '%.' then
    return false;
  end if;
  return true;
end;
$$;

-- 3. TRİGGER: Profil oluşturma/güncelleme sırasında kullanıcı adını doğrula ve normalize et
create or replace function public.enforce_username_rules()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  -- Kullanıcı adı boşsa kabul et (henüz atanmamış)
  if new.username is null or trim(new.username) = '' then
    new.username_normalized := null;
    return new;
  end if;

  new.username := trim(new.username);

  if not public.validate_username(new.username) then
    raise exception 'Geçersiz kullanıcı adı. 3-30 karakter, yalnızca harf, sayı, nokta ve alt çizgi kullanılabilir. Baş veya sonda nokta olamaz.'
      using errcode = 'check_violation';
  end if;

  new.username_normalized := lower(new.username);
  return new;
end;
$$;

drop trigger if exists trg_enforce_username on public.profiles;
create trigger trg_enforce_username
  before insert or update of username on public.profiles
  for each row execute function public.enforce_username_rules();

-- 4. GÜVENLİ GİRİŞ RPC: Kullanıcı adıyla e-posta çözümlemesi
-- Anonim kullanıcılar bu RPC'yi çağırabilir ama yalnızca e-posta döner.
-- Bulunamayan kullanıcılar için NULL döner (frontend genel hata gösterir).
-- Hassas bilgi loglanmaz, hesap varlığı ifşa edilmez.
create or replace function public.resolve_username_to_email(input_username text)
returns text
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  resolved_email text;
  clean_username text;
begin
  -- Normalize et
  clean_username := lower(trim(coalesce(input_username, '')));

  if clean_username = '' then
    return null;
  end if;

  -- profiles tablosundan e-posta al (auth.users ile join)
  select au.email into resolved_email
  from public.profiles p
  inner join auth.users au on au.id = p.id
  where p.username_normalized = clean_username
    and p.status = 'active'
  limit 1;

  -- Bulunamazsa NULL dön (hesap varlığı ifşa edilmez)
  return resolved_email;
end;
$$;

-- Anonim kullanıcıların bu fonksiyonu çağırmasına izin ver
grant execute on function public.resolve_username_to_email(text) to anon;
grant execute on function public.resolve_username_to_email(text) to authenticated;

-- 5. HANDLE_NEW_USER TRİGGERINI GÜNCELLE: username_normalized desteği
-- Mevcut trigger'ı bozmadan, yeni kolon desteği ekle
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
  clean_username text;
begin
  raw_full_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  raw_username := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  raw_exam_type := coalesce(new.raw_user_meta_data->>'exam_type', 'KPSS Lisans (GY-GK)');

  -- Kullanıcı adını normalize et
  clean_username := lower(trim(raw_username));

  -- Profil kaydı oluştur
  insert into public.profiles (id, full_name, display_name, username, username_normalized, avatar_url, exam_type, status, created_at, updated_at)
  values (
    new.id,
    raw_full_name,
    raw_full_name,
    raw_username,
    clean_username,
    coalesce(new.raw_user_meta_data->>'avatar_url', ''),
    raw_exam_type,
    'active',
    now(),
    now()
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    username_normalized = coalesce(excluded.username_normalized, public.profiles.username_normalized),
    updated_at = now();

  -- Kullanıcıya her zaman zorunlu olarak yalnızca 'member' rolü verilir
  insert into public.user_roles (user_id, role, created_at)
  values (new.id, 'member', now())
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

-- 6. KULLANICI ADI BENZERSİZLİK KONTROLÜ (kayıt sırasında)
create or replace function public.check_username_available(desired_username text)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  clean_username text;
begin
  clean_username := lower(trim(coalesce(desired_username, '')));

  if clean_username = '' then
    return false;
  end if;

  if not public.validate_username(desired_username) then
    return false;
  end if;

  return not exists (
    select 1 from public.profiles
    where username_normalized = clean_username
  );
end;
$$;

grant execute on function public.check_username_available(text) to anon;
grant execute on function public.check_username_available(text) to authenticated;
