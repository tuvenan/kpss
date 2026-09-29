begin;

create extension if not exists pgtap with schema extensions;
select plan(30);

-- Stable fixture identifiers make failures easy to diagnose.
select set_config('test.member_1', '00000000-0000-0000-0000-000000000101', true);
select set_config('test.member_2', '00000000-0000-0000-0000-000000000102', true);
select set_config('test.teacher_1', '00000000-0000-0000-0000-000000000201', true);
select set_config('test.teacher_2', '00000000-0000-0000-0000-000000000202', true);
select set_config('test.editor_1', '00000000-0000-0000-0000-000000000301', true);
select set_config('test.admin_1', '00000000-0000-0000-0000-000000000401', true);
select set_config('test.admin_2', '00000000-0000-0000-0000-000000000402', true);
select set_config('test.class_1', '10000000-0000-0000-0000-000000000001', true);
select set_config('test.class_2', '10000000-0000-0000-0000-000000000002', true);

-- auth.users inserts invoke the profile/member-role trigger from migration 001.
insert into auth.users (id, email, raw_user_meta_data)
values
  (current_setting('test.member_1')::uuid, 'member1@test.local', '{}'::jsonb),
  (current_setting('test.member_2')::uuid, 'member2@test.local', '{}'::jsonb),
  (current_setting('test.teacher_1')::uuid, 'teacher1@test.local', '{}'::jsonb),
  (current_setting('test.teacher_2')::uuid, 'teacher2@test.local', '{}'::jsonb),
  (current_setting('test.editor_1')::uuid, 'editor1@test.local', '{}'::jsonb),
  (current_setting('test.admin_1')::uuid, 'admin1@test.local', '{}'::jsonb),
  (current_setting('test.admin_2')::uuid, 'admin2@test.local', '{}'::jsonb);

insert into public.user_roles (user_id, role)
values
  (current_setting('test.teacher_1')::uuid, 'teacher'),
  (current_setting('test.teacher_2')::uuid, 'teacher'),
  (current_setting('test.editor_1')::uuid, 'editor'),
  (current_setting('test.admin_1')::uuid, 'super_admin'),
  (current_setting('test.admin_2')::uuid, 'super_admin');

insert into public.teacher_classes (id, teacher_id, name, invite_code)
values
  (current_setting('test.class_1')::uuid, current_setting('test.teacher_1')::uuid, 'Class One', 'INVITE-ONE'),
  (current_setting('test.class_2')::uuid, current_setting('test.teacher_2')::uuid, 'Class Two', 'INVITE-TWO');

insert into public.class_members (class_id, student_id, status)
values
  (current_setting('test.class_1')::uuid, current_setting('test.member_1')::uuid, 'active'),
  (current_setting('test.class_2')::uuid, current_setting('test.member_2')::uuid, 'active');

insert into public.assignments (id, teacher_id, class_id, title, assignment_type)
values (
  '20000000-0000-0000-0000-000000000001'::uuid,
  current_setting('test.teacher_1')::uuid,
  current_setting('test.class_1')::uuid,
  'Assignment One',
  'quiz'
);

insert into public.assignment_targets (assignment_id, student_id)
values (
  '20000000-0000-0000-0000-000000000001'::uuid,
  current_setting('test.member_1')::uuid
);

insert into public.exam_attempts (id, user_id, status)
values
  ('attempt-member-1', current_setting('test.member_1')::uuid, 'completed'),
  ('attempt-member-2', current_setting('test.member_2')::uuid, 'completed');

insert into public.error_pool (user_id, question_id)
values
  (current_setting('test.member_1')::uuid, 'question-1'),
  (current_setting('test.member_2')::uuid, 'question-2');

-- Structural safety assertions.
select ok((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), 'profiles has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.user_roles'::regclass), 'user_roles has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.teacher_classes'::regclass), 'teacher_classes has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.exam_attempts'::regclass), 'exam_attempts has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.audit_logs'::regclass), 'audit_logs has RLS enabled');

-- MEMBER: own-data access and horizontal isolation.
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', current_setting('test.member_1'), 'role', 'authenticated')::text, true);

select is((select count(*) from public.profiles), 1::bigint, 'member sees only own profile');
select is((select count(*) from public.exam_attempts), 1::bigint, 'member sees only own exam attempts');
select is((select count(*) from public.user_roles), 1::bigint, 'member sees only own roles');
select is((select count(*) from public.assignment_targets), 1::bigint, 'member sees own assignment target');
select throws_ok(
  format('insert into public.user_roles (user_id, role) values (%L, %L)', current_setting('test.member_1'), 'editor'),
  '42501', null, 'member cannot grant itself editor role'
);
select throws_ok(
  format('insert into public.audit_logs (actor_user_id, action, entity_type) values (%L, %L, %L)', current_setting('test.member_1'), 'FORGED', 'security'),
  '42501', null, 'member cannot forge audit logs'
);
select throws_ok(
  format('insert into public.teacher_question_sets (teacher_id, title) values (%L, %L)', current_setting('test.member_1'), 'Fake teacher set'),
  '42501', null, 'member cannot create teacher-only question sets'
);

-- TEACHER: only assigned students/classes; student performance is read-only.
reset role;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', current_setting('test.teacher_1'), 'role', 'authenticated')::text, true);

select is((select count(*) from public.teacher_classes), 1::bigint, 'teacher sees only own class');
select is((select count(*) from public.profiles where id = current_setting('test.member_1')::uuid), 1::bigint, 'teacher sees assigned student');
select is((select count(*) from public.profiles where id = current_setting('test.member_2')::uuid), 0::bigint, 'teacher cannot see unassigned student');
select is((select count(*) from public.exam_attempts), 1::bigint, 'teacher sees only assigned student attempts');
select is((select count(*) from public.assignment_targets), 1::bigint, 'teacher sees targets for own assignment');
select lives_ok(
  format('insert into public.teacher_question_sets (teacher_id, class_id, title) values (%L, %L, %L)', current_setting('test.teacher_1'), current_setting('test.class_1'), 'Teacher set'),
  'teacher can create its own private question set'
);
select throws_ok(
  format('insert into public.teacher_question_sets (teacher_id, class_id, title) values (%L, %L, %L)', current_setting('test.teacher_1'), current_setting('test.class_2'), 'Foreign class set'),
  '42501', null, 'teacher cannot attach a private set to another teacher class'
);

update public.exam_attempts set net_score = 99 where id = 'attempt-member-1';
reset role;
select is((select net_score from public.exam_attempts where id = 'attempt-member-1'), null::numeric, 'teacher cannot modify student result');

-- EDITOR: private student performance remains invisible.
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', current_setting('test.editor_1'), 'role', 'authenticated')::text, true);
select is((select count(*) from public.exam_attempts), 0::bigint, 'editor cannot read student exam attempts');
select is((select count(*) from public.error_pool), 0::bigint, 'editor cannot read student error pool');
select throws_ok(
  format('insert into public.user_roles (user_id, role) values (%L, %L)', current_setting('test.member_1'), 'teacher'),
  '42501', null, 'editor cannot assign roles directly'
);

-- SUPER ADMIN: can inspect protected records and use role RPCs.
reset role;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', current_setting('test.admin_1'), 'role', 'authenticated')::text, true);
select is((select count(*) from public.profiles), 7::bigint, 'super admin sees all profiles');
select lives_ok(
  format('select public.assign_user_role(%L, %L)', current_setting('test.member_1'), 'teacher'),
  'super admin can assign a role through RPC'
);
select is(
  (select count(*) from public.audit_logs where action = 'ASSIGN_ROLE'),
  1::bigint,
  'role assignment creates one audit event'
);
select lives_ok(
  format('select public.remove_user_role(%L, %L)', current_setting('test.admin_2'), 'super_admin'),
  'one of two super-admin roles can be removed'
);
select throws_ok(
  format('select public.remove_user_role(%L, %L)', current_setting('test.admin_1'), 'super_admin'),
  'P0001', null,
  'last super-admin role cannot be removed'
);

-- ANON: no private data or role visibility.
reset role;
set local role anon;
select set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
select is((select count(*) from public.profiles), 0::bigint, 'anonymous user cannot read profiles');
select is((select count(*) from public.user_roles), 0::bigint, 'anonymous user cannot read roles');

select * from finish();
rollback;
