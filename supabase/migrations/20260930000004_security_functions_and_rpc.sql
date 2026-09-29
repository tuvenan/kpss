-- ==============================================================================
-- Migration: 20260930000004_security_functions_and_rpc.sql
-- Description: Güvenli RPC fonksiyonları (Rol atama/kaldırma, kullanıcı askıya alma, sınıfa katılma, bootstrap)
-- ==============================================================================

-- 1. İLK SÜPER ADMİN BOOTSTRAP FONKSİYONU
-- Yalnızca sistemde 0 süper admin varken çalışır; var olan bir süper admin varsa yetki yükseltmeyi reddeder.
create or replace function public.bootstrap_initial_super_admin(admin_email text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  target_uid uuid;
  super_admin_count integer;
begin
  select count(*) into super_admin_count
  from public.user_roles
  where role = 'super_admin';

  if super_admin_count > 0 then
    raise exception 'Sistemde zaten kayıtlı süper admin bulunmaktadır. Bootstrap kullanılamaz.';
  end if;

  select id into target_uid
  from auth.users
  where lower(email) = lower(trim(admin_email));

  if target_uid is null then
    raise exception 'Kullanıcı bulunamadı. Lütfen önce bu e-posta ile kayıt olunuz: %', admin_email;
  end if;

  -- Rol ata
  insert into public.user_roles (user_id, role, created_at)
  values (target_uid, 'super_admin', now())
  on conflict (user_id, role) do nothing;

  -- Audit log kaydı
  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
  values (
    target_uid,
    'BOOTSTRAP_SUPER_ADMIN',
    'user_roles',
    target_uid::text,
    jsonb_build_object('email', admin_email, 'timestamp', now())
  );

  return jsonb_build_object('success', true, 'message', 'İlk süper admin başarıyla yetkilendirildi.', 'user_id', target_uid);
end;
$$;

-- 2. GÜVENLİ ROL ATAMA RPC FONKSİYONU
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

-- 3. GÜVENLİ ROL KALDIRMA RPC FONKSİYONU (SON SÜPER ADMİN KORUMASIYLA)
create or replace function public.remove_user_role(target_user_id uuid, target_role text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  caller_id uuid;
  super_admin_count integer;
begin
  caller_id := auth.uid();
  if caller_id is null or not public.is_super_admin() then
    raise exception 'Yetkisiz erişim: Bu işlemi yalnızca süper yöneticiler gerçekleştirebilir.';
  end if;

  -- Son aktif super_admin'in kaldırılmasına izin verilmez!
  if target_role = 'super_admin' then
    select count(*) into super_admin_count
    from public.user_roles
    where role = 'super_admin';

    if super_admin_count <= 1 then
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

-- 4. KULLANICI ASKIYA ALMA (SUSPEND) VE YENİDEN ETKİNLEŞTİRME
create or replace function public.suspend_user(target_user_id uuid, reason text default '')
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
    raise exception 'Yönetici kendi hesabını askıya alamaz.';
  end if;

  update public.profiles
  set status = 'suspended', updated_at = now()
  where id = target_user_id;

  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
  values (
    caller_id,
    'SUSPEND_USER',
    'profiles',
    target_user_id::text,
    jsonb_build_object('reason', reason, 'target_user_id', target_user_id)
  );

  return jsonb_build_object('success', true, 'message', 'Kullanıcı hesabı askıya alındı.');
end;
$$;

create or replace function public.reactivate_user(target_user_id uuid)
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

  update public.profiles
  set status = 'active', updated_at = now()
  where id = target_user_id;

  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
  values (
    caller_id,
    'REACTIVATE_USER',
    'profiles',
    target_user_id::text,
    jsonb_build_object('target_user_id', target_user_id)
  );

  return jsonb_build_object('success', true, 'message', 'Kullanıcı hesabı yeniden etkinleştirildi.');
end;
$$;

-- 5. DAVET KODU İLE SINIF KATILIM RPC FONKSİYONU
create or replace function public.join_class_by_invite_code(code text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  caller_id uuid;
  found_class record;
begin
  caller_id := auth.uid();
  if caller_id is null then
    raise exception 'Sınıfa katılabilmek için lütfen giriş yapınız.';
  end if;

  select * into found_class
  from public.teacher_classes
  where lower(invite_code) = lower(trim(code))
    and is_active = true
    and (invite_expires_at is null or invite_expires_at > now());

  if found_class.id is null then
    raise exception 'Geçersiz veya süresi dolmuş davet kodu!';
  end if;

  -- Kendi sınıfına öğrenci olarak katılamaz
  if found_class.teacher_id = caller_id then
    raise exception 'Öğretmen kendi oluşturduğu sınıfa öğrenci olarak katılamaz.';
  end if;

  insert into public.class_members (class_id, student_id, status, joined_at)
  values (found_class.id, caller_id, 'active', now())
  on conflict (class_id, student_id) do update set
    status = 'active',
    joined_at = now();

  return jsonb_build_object(
    'success', true,
    'message', 'Sınıfa başarıyla katıldınız!',
    'class_id', found_class.id,
    'class_name', found_class.name
  );
end;
$$;
