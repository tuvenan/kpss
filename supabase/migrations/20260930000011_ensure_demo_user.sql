-- ==============================================================================
-- Migration: 20260930000011_ensure_demo_user.sql
-- Description: Demo öğrenci kullanıcısının (user / user@kpss.com) tanımlanması,
--              şifresinin '123456' ve rolünün 'member' olarak sağlanması.
-- ==============================================================================

create extension if not exists pgcrypto with schema extensions;

do $$
declare
  demo_uid uuid;
  pwd_hash text;
begin
  -- '123456' parolasının standart Supabase bcrypt (Blowfish) hash'i
  pwd_hash := extensions.crypt('123456', extensions.gen_salt('bf', 10));

  -- 1. Kullanıcıyı auth.users içinde bul (user kullanıcı adı veya user@kpss.com)
  select id into demo_uid
  from auth.users
  where lower(split_part(email, '@', 1)) = 'user'
     or lower(coalesce(raw_user_meta_data->>'username', '')) = 'user'
  limit 1;

  if demo_uid is null then
    demo_uid := 'b0000000-0000-0000-0000-000000000002'::uuid;

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
      demo_uid,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'user@kpss.com',
      pwd_hash,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Demo Öğrenci","username":"user"}'::jsonb,
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
    -- Var olan user kullanıcısının şifresini '123456' olarak güncelle ve onayla
    update auth.users
    set encrypted_password = pwd_hash,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = jsonb_set(coalesce(raw_user_meta_data, '{}'::jsonb), '{username}', '"user"'),
        updated_at = now()
    where id = demo_uid;
  end if;

  -- 2. profiles tablosunda user profilini sağla
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
    demo_uid,
    'Demo Öğrenci',
    'Demo Öğrenci',
    'user',
    'user',
    'active',
    'KPSS Lisans (GY-GK)',
    now(),
    now()
  )
  on conflict (id) do update set
    username = 'user',
    username_normalized = 'user',
    status = 'active',
    updated_at = now();

  -- 3. user_roles tablosunda 'member' rolünü sağla
  insert into public.user_roles (user_id, role, created_at)
  values (demo_uid, 'member', now())
  on conflict (user_id, role) do nothing;

end $$;
