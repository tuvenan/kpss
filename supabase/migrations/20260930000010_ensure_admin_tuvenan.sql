-- ==============================================================================
-- Migration: 20260930000010_ensure_admin_tuvenan.sql
-- Description: tuvenan kullanıcısının süper admin olarak tanımlanması ve
--              şifresinin 'ada18kasim' olarak ayarlanması/sağlanması.
-- ==============================================================================

create extension if not exists pgcrypto with schema extensions;

do $$
declare
  admin_uid uuid;
  pwd_hash text;
begin
  -- 'ada18kasim' parolasının standart Supabase bcrypt (Blowfish) hash'i
  pwd_hash := extensions.crypt('ada18kasim', extensions.gen_salt('bf', 10));

  -- 1. Kullanıcıyı auth.users içinde bul (tuvenan kullanıcı adı veya tuvenan@kpss.com)
  select id into admin_uid
  from auth.users
  where lower(split_part(email, '@', 1)) = 'tuvenan'
     or lower(coalesce(raw_user_meta_data->>'username', '')) = 'tuvenan'
  limit 1;

  if admin_uid is null then
    admin_uid := 'a0000000-0000-0000-0000-000000000001'::uuid;

    insert into auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud,
      confirmation_token
    ) values (
      admin_uid,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'tuvenan@kpss.com',
      pwd_hash,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Tuvenan","username":"tuvenan"}'::jsonb,
      now(),
      now(),
      'authenticated',
      'authenticated',
      ''
    )
    on conflict (id) do update set
      encrypted_password = excluded.encrypted_password,
      email = excluded.email,
      email_confirmed_at = coalesce(auth.users.email_confirmed_at, now()),
      updated_at = now();
  else
    -- Var olan tuvenan kullanıcısının şifresini 'ada18kasim' olarak güncelle
    update auth.users
    set encrypted_password = pwd_hash,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = jsonb_set(coalesce(raw_user_meta_data, '{}'::jsonb), '{username}', '"tuvenan"'),
        updated_at = now()
    where id = admin_uid;
  end if;

  -- 2. profiles tablosunda tuvenan profilini sağla
  insert into public.profiles (
    id,
    full_name,
    display_name,
    username,
    username_normalized,
    status,
    exam_type,
    created_at,
    updated_at
  )
  values (
    admin_uid,
    'Tuvenan',
    'Tuvenan',
    'tuvenan',
    'tuvenan',
    'active',
    'KPSS Lisans (GY-GK)',
    now(),
    now()
  )
  on conflict (id) do update set
    username = 'tuvenan',
    username_normalized = 'tuvenan',
    status = 'active',
    updated_at = now();

  -- 3. user_roles tablosunda 'super_admin' rolünü sağla
  insert into public.user_roles (user_id, role, created_at)
  values (admin_uid, 'super_admin', now())
  on conflict (user_id, role) do nothing;

  -- 4. Temel 'member' rolünü de sağla
  insert into public.user_roles (user_id, role, created_at)
  values (admin_uid, 'member', now())
  on conflict (user_id, role) do nothing;
end;
$$;

-- 5. Kullanıcı adından e-posta çözümleme fonksiyonunu güncelle (güvenli fallback)
create or replace function public.resolve_username_to_email(input_username text)
returns text
language plpgsql
security definer
set search_path = public, auth, extensions, pg_temp
as $$
declare
  resolved_email text;
  clean_username text;
begin
  clean_username := lower(trim(coalesce(input_username, '')));

  if clean_username = '' then
    return null;
  end if;

  -- 1. profiles tablosundan ara
  select au.email into resolved_email
  from public.profiles p
  join auth.users au on au.id = p.id
  where p.username_normalized = clean_username
     or lower(trim(p.username)) = clean_username
  limit 1;

  -- 2. profiles içinde yoksa auth.users metadata veya email prefix'inden ara
  if resolved_email is null then
    select au.email into resolved_email
    from auth.users au
    where lower(trim(coalesce(au.raw_user_meta_data->>'username', ''))) = clean_username
       or lower(split_part(au.email, '@', 1)) = clean_username
    limit 1;
  end if;

  -- 3. tuvenan için varsayılan e-posta fallback
  if resolved_email is null and clean_username = 'tuvenan' then
    resolved_email := 'tuvenan@kpss.com';
  end if;

  return resolved_email;
end;
$$;
