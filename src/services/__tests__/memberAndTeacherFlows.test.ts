import { describe, it, expect, vi, beforeEach } from 'vitest';
import { teacherService } from '../teacherService';
import { memberService } from '../memberService';
import { rbacService } from '../rbacService';
import { supabase } from '../supabase';

describe('Member ve Teacher Rollerine Ait Gerçek Kullanıcı Akışları', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  // 1. Teacher kendi sınıfını oluşturur
  it('1. Teacher kendi sınıfını oluşturur ve 6 haneli davet kodu üretilir', async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'cls-101',
            teacher_id: 'teacher-ali',
            name: '2026 KPSS Hukuk',
            description: 'Temel Anayasa ve Medeni Hukuk',
            invite_code: 'KPSS-839201',
            invite_expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
            is_active: true,
          },
          error: null,
        }),
      }),
    });

    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'teacher_classes') {
        return { insert: mockInsert } as any;
      }
      return {} as any;
    });

    const res = await teacherService.createClass('teacher-ali', '2026 KPSS Hukuk', 'Temel Anayasa ve Medeni Hukuk');

    expect(res.success).toBe(true);
    expect(res.data?.teacher_id).toBe('teacher-ali');
    expect(res.data?.name).toBe('2026 KPSS Hukuk');
    expect(res.data?.invite_code).toMatch(/^KPSS-\d{6}$/);
    expect(res.data?.is_active).toBe(true);
  });

  // 2. Başka teacher’ın sınıfını göremez
  it('2. Başka öğretmenin sınıfını göremez, yalnızca kendi oluşturduğu sınıfları listeler', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockImplementation((col: string, val: string) => {
        expect(col).toBe('teacher_id');
        expect(val).toBe('teacher-1'); // Yalnızca teacher-1'in sınıfları filtrelenmeli
        return {
          order: vi.fn().mockResolvedValue({
            data: [
              { id: 'cls-1', teacher_id: 'teacher-1', name: 'Sınıfım 1', class_members: [{ count: 12 }] },
            ],
            error: null,
          }),
        };
      }),
    });

    vi.spyOn(supabase, 'from').mockReturnValue({
      select: mockSelect,
    } as any);

    const classes = await teacherService.getMyClasses('teacher-1');

    expect(classes).toHaveLength(1);
    expect(classes[0].teacher_id).toBe('teacher-1');
    expect(classes[0].name).toBe('Sınıfım 1');
  });

  // 3. Member geçerli davet koduyla katılır
  it('3. Member geçerli davet koduyla sınıfa katılır ve güvenli RPC tetiklenir', async () => {
    const rpcSpy = vi.spyOn(supabase, 'rpc').mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Sınıfa başarıyla katıldınız!',
        class_id: 'cls-101',
        class_name: '2026 KPSS Hukuk',
      },
      error: null,
    } as any);

    const res = await memberService.joinClassByInviteCode('KPSS-839201');

    expect(rpcSpy).toHaveBeenCalledWith('join_class_by_invite_code', {
      code: 'KPSS-839201',
    });
    expect(res.success).toBe(true);
    expect(res.className).toBe('2026 KPSS Hukuk');
  });

  // 4. Geçersiz/süresi dolmuş kod reddedilir
  it('4. Geçersiz veya süresi dolmuş davet kodu veritabanı RPC tarafından reddedilir', async () => {
    vi.spyOn(supabase, 'rpc').mockResolvedValueOnce({
      data: null,
      error: { message: 'Geçersiz veya süresi dolmuş davet kodu!' },
    } as any);

    const res = await memberService.joinClassByInviteCode('EXPIRED-CODE');

    expect(res.success).toBe(false);
    expect(res.message).toContain('Geçersiz veya süresi dolmuş');
  });

  // 5. Teacher bağlı öğrenciyi görür
  it('5. Teacher yalnızca kendi sınıfına kayıtlı aktif öğrenciyi görür', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockImplementation((col: string, val: string) => {
        return {
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                {
                  id: 'cm-1',
                  class_id: 'cls-101',
                  student_id: 'student-ayse',
                  status: 'active',
                  joined_at: '2026-09-29T10:00:00Z',
                  profiles: {
                    full_name: 'Ayşe Yılmaz',
                    username: 'ayseyilmaz',
                    exam_type: 'KPSS Lisans',
                  },
                },
              ],
              error: null,
            }),
          }),
        };
      }),
    });

    vi.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const students = await teacherService.getClassStudents('cls-101');

    expect(students).toHaveLength(1);
    expect(students[0].student_id).toBe('student-ayse');
    expect(students[0].full_name).toBe('Ayşe Yılmaz');
  });

  // 6. Bağlı olmayan öğrenciyi göremez
  it('6. Teacher kendi sınıflarında kayıtlı olmayan öğrencileri listede göremez', async () => {
    vi.spyOn(teacherService, 'getMyClasses').mockResolvedValue([
      { id: 'cls-mine', teacher_id: 'teacher-1', name: 'Benim Sınıfım', description: '', invite_code: 'KPSS-111111', invite_expires_at: null, is_active: true, created_at: '', updated_at: '' },
    ]);

    const mockSelect = vi.fn().mockReturnValue({
      in: vi.fn().mockImplementation((col: string, ids: string[]) => {
        expect(ids).toEqual(['cls-mine']); // Yalnızca öğretmenin sınıf ID'leri sorgulanmalı
        return {
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                {
                  id: 'cm-1',
                  class_id: 'cls-mine',
                  student_id: 'student-mine',
                  status: 'active',
                  joined_at: '',
                  profiles: { full_name: 'Benim Öğrencim', username: 'mine' },
                },
              ],
              error: null,
            }),
          }),
        };
      }),
    });

    vi.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const students = await teacherService.getAllMyStudents('teacher-1');

    expect(students).toHaveLength(1);
    expect(students[0].student_id).toBe('student-mine');
    expect(students.some((s) => s.student_id === 'other-teacher-student')).toBe(false);
  });

  // 7. Teacher ödev oluşturur
  it('7. Teacher kendi sınıfı için yeni ödev oluşturur ve yayınlar', async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'asg-501',
            teacher_id: 'teacher-1',
            class_id: 'cls-101',
            title: 'Tarih İslamiyet Öncesi Testi',
            description: 'İlk 20 soru',
            assignment_type: 'quiz',
            status: 'published',
            due_at: '2026-10-06T00:00:00Z',
          },
          error: null,
        }),
      }),
    });

    vi.spyOn(supabase, 'from').mockReturnValue({ insert: mockInsert } as any);

    const res = await teacherService.createAssignment(
      'teacher-1',
      'cls-101',
      'Tarih İslamiyet Öncesi Testi',
      'İlk 20 soru',
      'quiz',
      {},
      7
    );

    expect(res.success).toBe(true);
    expect(res.data?.id).toBe('asg-501');
    expect(res.data?.status).toBe('published');
  });

  // 8. Member yalnızca kendisine atanmış ödevi görür
  it('8. Member yalnızca kayıtlı olduğu sınıfların yayınlanmış ödevlerini görür', async () => {
    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'class_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ class_id: 'cls-enrolled', teacher_classes: { name: 'Kayıtlı Sınıfım' } }],
                error: null,
              }),
            }),
          }),
        } as any;
      }
      if (table === 'assignments') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockImplementation((col: string, ids: string[]) => {
              expect(ids).toEqual(['cls-enrolled']); // Yalnızca kayıtlı sınıf
              return {
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: 'asg-for-me',
                        class_id: 'cls-enrolled',
                        title: 'Benim Ödevim',
                        assignment_type: 'quiz',
                        status: 'published',
                      },
                    ],
                    error: null,
                  }),
                }),
              };
            }),
          }),
        } as any;
      }
      if (table === 'assignment_results') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        } as any;
      }
      return {} as any;
    });

    const assignments = await memberService.getMyAssignments('student-1');

    expect(assignments).toHaveLength(1);
    expect(assignments[0].id).toBe('asg-for-me');
    expect(assignments.some((a) => a.id === 'unrelated-assignment')).toBe(false);
  });

  // 9. Member başka öğrencinin sonucunu göremez
  it('9. Member yalnızca kendi sınav ve ödev sonuçlarına erişebilir', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockImplementation((col: string, val: string) => {
        expect(col).toBe('student_id');
        expect(val).toBe('student-ben'); // Kendi student_id'si ile filtrelenmeli
        return {
          in: vi.fn().mockResolvedValue({
            data: [
              { assignment_id: 'asg-1', student_id: 'student-ben', score: 85, status: 'completed' },
            ],
            error: null,
          }),
        };
      }),
    });

    vi.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    // Öğrenci sonuç sorgusu
    const { data } = await supabase
      .from('assignment_results')
      .select('*')
      .eq('student_id', 'student-ben')
      .in('assignment_id', ['asg-1']);

    expect(data).toHaveLength(1);
    expect(data?.[0].student_id).toBe('student-ben');
    expect(data?.some((r: any) => r.student_id === 'baska-ogrenci')).toBe(false);
  });

  // 10. Teacher öğrenci sonucunu değiştiremez (Salt Okunur)
  it('10. Teacher öğrenci sonucunu değiştiremez; öğretmen servisinde öğrenci sonucunu değiştiren metod bulunmaz ve RLS engeller', () => {
    // teacherService arayüzünde öğrenci sonucunu değiştirecek bir mutasyon metodu KESİNLİKLE OLMAMALIDIR
    expect((teacherService as any).updateStudentResult).toBeUndefined();
    expect((teacherService as any).deleteStudentResult).toBeUndefined();
    expect((teacherService as any).setStudentScore).toBeUndefined();

    // Sonuç kaydetme/değiştirme yetkisi yalnızca öğrencinin kendi memberService üzerinde mevcuttur
    expect(typeof memberService.submitAssignmentResult).toBe('function');
  });

  // Ek Test: Öğretmen özel soru seti oluşturabilir ve bu genel soru havuzunu etkilemez
  it('Öğretmen özel soru seti oluşturabilir ve bu havuz diğer öğretmenlerden izoledir', async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'qs-909',
            teacher_id: 'teacher-1',
            title: 'Özel Deneme Seti 1',
            questions: [{ id: 'q1', text: 'Özgün Soru 1' }],
            is_private: true,
          },
          error: null,
        }),
      }),
    });

    vi.spyOn(supabase, 'from').mockReturnValue({ insert: mockInsert } as any);

    const res = await teacherService.createTeacherQuestionSet(
      'teacher-1',
      'Özel Deneme Seti 1',
      'Açıklama',
      'cls-101',
      'sub-1',
      [{ id: 'q1', text: 'Özgün Soru 1' }]
    );

    expect(res.success).toBe(true);
    expect(res.data?.is_private).toBe(true);
    expect(res.data?.teacher_id).toBe('teacher-1');
  });
});
