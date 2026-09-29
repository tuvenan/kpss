-- ==============================================================================
-- Supabase Local Seed: supabase/seed.sql
-- Description: Geliştirme ve yerel veritabanı tohumlama (seed) verileri.
--              Varsayılan süper yönetici: tuvenan / ada18kasim
-- ==============================================================================

create extension if not exists pgcrypto with schema extensions;

do $$
declare
  admin_uid uuid := 'a0000000-0000-0000-0000-000000000001'::uuid;
  pwd_hash text;
begin
  pwd_hash := extensions.crypt('ada18kasim', extensions.gen_salt('bf', 10));

  -- tuvenan süper admin kullanıcısını oluştur veya güncelle
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

  -- profiles kaydı
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

  -- super_admin ve member rolleri
  insert into public.user_roles (user_id, role, created_at)
  values
    (admin_uid, 'super_admin', now()),
    (admin_uid, 'member', now())
  on conflict (user_id, role) do nothing;
end;
$$;
