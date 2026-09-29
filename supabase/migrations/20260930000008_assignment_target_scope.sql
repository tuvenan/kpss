-- Distinguish whole-class assignments from assignments intended for selected
-- students. Without this flag, class members could see assignments targeted at
-- other students because hidden assignment_targets rows are indistinguishable
-- from an assignment with no targets.

alter table public.assignments
  add column if not exists target_scope text not null default 'class';

update public.assignments a
set target_scope = 'students'
where exists (
  select 1 from public.assignment_targets t
  where t.assignment_id = a.id
);

alter table public.assignments
  drop constraint if exists assignments_target_scope_check;
alter table public.assignments
  add constraint assignments_target_scope_check
  check (target_scope in ('class', 'students'));

-- Keep assignment and assignment_targets policies from querying one another.
-- These narrow SECURITY DEFINER helpers bypass RLS only for boolean ownership
-- checks and therefore avoid a recursive-policy error.
create or replace function public.is_my_assignment_target(_assignment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.assignment_targets
    where assignment_id = _assignment_id
      and student_id = auth.uid()
  );
$$;

create or replace function public.is_assignment_owner(_assignment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.assignments
    where id = _assignment_id
      and teacher_id = auth.uid()
  );
$$;

create or replace function public.can_target_assignment_student(
  _assignment_id uuid,
  _student_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.assignments a
    join public.class_members cm
      on cm.class_id = a.class_id
     and cm.student_id = _student_id
     and cm.status = 'active'
    where a.id = _assignment_id
      and a.teacher_id = auth.uid()
      and a.target_scope = 'students'
  );
$$;

revoke all on function public.is_my_assignment_target(uuid) from public;
revoke all on function public.is_assignment_owner(uuid) from public;
revoke all on function public.can_target_assignment_student(uuid, uuid) from public;
grant execute on function public.is_my_assignment_target(uuid) to authenticated;
grant execute on function public.is_assignment_owner(uuid) to authenticated;
grant execute on function public.can_target_assignment_student(uuid, uuid) to authenticated;

drop policy if exists "Sınıf üyeleri yayımlanmış ödevleri, öğretmen kendi ödevlerini görebilir" on public.assignments;
drop policy if exists "assignments_select_scoped" on public.assignments;
create policy "assignments_select_scoped"
  on public.assignments for select
  to authenticated
  using (
    public.is_class_teacher(class_id)
    or public.is_super_admin()
    or (
      public.is_class_member(class_id)
      and status = 'published'
      and (
        target_scope = 'class'
        or public.is_my_assignment_target(id)
      )
    )
  );

drop policy if exists "assignment_targets_insert" on public.assignment_targets;
drop policy if exists "assignment_targets_update" on public.assignment_targets;
drop policy if exists "assignment_targets_select" on public.assignment_targets;
drop policy if exists "assignment_targets_delete" on public.assignment_targets;

create policy "assignment_targets_select"
  on public.assignment_targets for select
  to authenticated
  using (
    student_id = auth.uid()
    or public.is_assignment_owner(assignment_id)
    or public.is_super_admin()
  );

create policy "assignment_targets_insert"
  on public.assignment_targets for insert
  to authenticated
  with check (
    public.is_super_admin()
    or public.can_target_assignment_student(assignment_id, student_id)
  );

create policy "assignment_targets_update"
  on public.assignment_targets for update
  to authenticated
  using (
    public.is_super_admin()
    or public.is_assignment_owner(assignment_id)
  )
  with check (
    public.is_super_admin()
    or public.can_target_assignment_student(assignment_id, student_id)
  );

create policy "assignment_targets_delete"
  on public.assignment_targets for delete
  to authenticated
  using (
    public.is_super_admin()
    or public.is_assignment_owner(assignment_id)
  );
