-- Security hardening discovered while preparing the RBAC/RLS test suite.
-- Keep this as a forward migration: earlier migrations may already be applied remotely.

-- Question banks are part of the curriculum but were absent from the original
-- workflow migration. Add the same lifecycle metadata and RLS boundary.
alter table public.question_banks
  add column if not exists status text not null default 'published'
    check (status in ('draft', 'in_review', 'published', 'archived')),
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_by uuid references auth.users(id) on delete set null,
  add column if not exists published_by uuid references auth.users(id) on delete set null,
  add column if not exists published_at timestamptz default now(),
  add column if not exists version integer not null default 1;

alter table public.question_banks enable row level security;
drop policy if exists "question_banks_select" on public.question_banks;
drop policy if exists "question_banks_manage" on public.question_banks;
create policy "question_banks_select"
  on public.question_banks for select
  using (status = 'published' or public.is_editor_or_admin());
create policy "question_banks_manage"
  on public.question_banks for all
  to authenticated
  using (public.is_editor_or_admin())
  with check (public.is_editor_or_admin());

-- Audit entries are append-only and must only be produced by trusted
-- SECURITY DEFINER functions. Direct client writes are forbidden.
drop policy if exists "Audit logları sistem ve admin fonksiyonları ekleyebilir" on public.audit_logs;
drop policy if exists "audit_logs_no_direct_client_insert" on public.audit_logs;
create policy "audit_logs_no_direct_client_insert"
  on public.audit_logs for insert
  to authenticated
  with check (false);

-- Assignment targets had RLS enabled but no policies, which made the feature
-- unusable. Students may see only their own targets; teachers may manage
-- targets only for assignments they own.
drop policy if exists "assignment_targets_select" on public.assignment_targets;
drop policy if exists "assignment_targets_insert" on public.assignment_targets;
drop policy if exists "assignment_targets_update" on public.assignment_targets;
drop policy if exists "assignment_targets_delete" on public.assignment_targets;

create policy "assignment_targets_select"
  on public.assignment_targets for select
  to authenticated
  using (
    student_id = auth.uid()
    or exists (
      select 1 from public.assignments a
      where a.id = assignment_id and a.teacher_id = auth.uid()
    )
    or public.is_super_admin()
  );

create policy "assignment_targets_insert"
  on public.assignment_targets for insert
  to authenticated
  with check (
    exists (
      select 1 from public.assignments a
      where a.id = assignment_id and a.teacher_id = auth.uid()
    )
    or public.is_super_admin()
  );

create policy "assignment_targets_update"
  on public.assignment_targets for update
  to authenticated
  using (
    exists (
      select 1 from public.assignments a
      where a.id = assignment_id and a.teacher_id = auth.uid()
    )
    or public.is_super_admin()
  )
  with check (
    exists (
      select 1 from public.assignments a
      where a.id = assignment_id and a.teacher_id = auth.uid()
    )
    or public.is_super_admin()
  );

create policy "assignment_targets_delete"
  on public.assignment_targets for delete
  to authenticated
  using (
    exists (
      select 1 from public.assignments a
      where a.id = assignment_id and a.teacher_id = auth.uid()
    )
    or public.is_super_admin()
  );

-- Teachers can read student results but cannot create or modify them.
drop policy if exists "Öğrenci veya öğretmen ödev sonucunu başlatabilir/oluşturabilir" on public.assignment_results;
create policy "assignment_results_insert_own_or_admin"
  on public.assignment_results for insert
  to authenticated
  with check (student_id = auth.uid() or public.is_super_admin());

-- Editors manage global content, not private student performance data.
drop policy if exists "error_pool_select" on public.error_pool;
drop policy if exists "error_pool_insert" on public.error_pool;
drop policy if exists "error_pool_update" on public.error_pool;
drop policy if exists "error_pool_delete" on public.error_pool;

create policy "error_pool_select"
  on public.error_pool for select
  to authenticated
  using (
    auth.uid() = user_id
    or public.is_teacher_of(user_id)
    or public.is_super_admin()
  );

create policy "error_pool_insert"
  on public.error_pool for insert
  to authenticated
  with check (auth.uid() = user_id or public.is_super_admin());

create policy "error_pool_update"
  on public.error_pool for update
  to authenticated
  using (auth.uid() = user_id or public.is_super_admin())
  with check (auth.uid() = user_id or public.is_super_admin());

create policy "error_pool_delete"
  on public.error_pool for delete
  to authenticated
  using (auth.uid() = user_id or public.is_super_admin());

-- Owning a row is not enough: the owner must still hold the teacher role.
drop policy if exists "teacher_question_sets_select" on public.teacher_question_sets;
drop policy if exists "teacher_question_sets_insert" on public.teacher_question_sets;
drop policy if exists "teacher_question_sets_update" on public.teacher_question_sets;
drop policy if exists "teacher_question_sets_delete" on public.teacher_question_sets;

create policy "teacher_question_sets_select"
  on public.teacher_question_sets for select
  to authenticated
  using (
    (auth.uid() = teacher_id and public.is_teacher())
    or public.is_super_admin()
  );

create policy "teacher_question_sets_insert"
  on public.teacher_question_sets for insert
  to authenticated
  with check (
    (
      auth.uid() = teacher_id
      and public.is_teacher()
      and (class_id is null or public.is_class_teacher(class_id))
    )
    or public.is_super_admin()
  );

create policy "teacher_question_sets_update"
  on public.teacher_question_sets for update
  to authenticated
  using (
    (auth.uid() = teacher_id and public.is_teacher())
    or public.is_super_admin()
  )
  with check (
    (
      auth.uid() = teacher_id
      and public.is_teacher()
      and (class_id is null or public.is_class_teacher(class_id))
    )
    or public.is_super_admin()
  );

create policy "teacher_question_sets_delete"
  on public.teacher_question_sets for delete
  to authenticated
  using (
    (auth.uid() = teacher_id and public.is_teacher())
    or public.is_super_admin()
  );

-- Recreate role removal without SELECT count(*) ... FOR UPDATE, which is not
-- valid PostgreSQL. The transaction advisory lock serializes super-admin
-- removals before the count is evaluated.
create or replace function public.remove_user_role(target_user_id uuid, target_role text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  caller_id uuid := auth.uid();
  active_super_admin_count integer;
begin
  if caller_id is null or not public.is_super_admin() then
    raise exception 'Yetkisiz erişim: Bu işlemi yalnızca süper yöneticiler gerçekleştirebilir.';
  end if;

  if target_user_id = caller_id then
    raise exception 'Güvenlik kuralı: Yönetici kendi rolünü doğrudan değiştiremez.';
  end if;

  if target_role not in ('member', 'teacher', 'editor', 'super_admin') then
    raise exception 'Geçersiz rol: %', target_role;
  end if;

  if target_role = 'super_admin' then
    perform pg_advisory_xact_lock(hashtext('super_admin_role_lock'));

    select count(*) into active_super_admin_count
    from public.user_roles
    where role = 'super_admin';

    if active_super_admin_count <= 1 then
      raise exception 'Güvenlik kuralı: Sistemdeki son süper yönetici rolü silinemez!';
    end if;
  end if;

  delete from public.user_roles
  where user_id = target_user_id
    and role = target_role;

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

revoke execute on function public.bootstrap_initial_super_admin(text) from public;
grant execute on function public.bootstrap_initial_super_admin(text) to service_role;

revoke execute on function public.join_class_by_invite_code(text) from public;
grant execute on function public.join_class_by_invite_code(text) to authenticated;

revoke execute on function public.remove_user_role(uuid, text) from public;
grant execute on function public.remove_user_role(uuid, text) to authenticated;
