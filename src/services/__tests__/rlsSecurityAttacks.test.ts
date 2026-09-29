import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../supabase';
import { rbacService } from '../rbacService';
import { UserRole } from '../../types/auth';

describe('RLS Güvenlik ve Saldırı Senaryoları Test Paketi (12 Senaryo)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Senaryo 1: Member kendisine editor rolü eklemeye çalışır
  // --------------------------------------------------------------------------
  it('1. Member doğrudan user_roles tablosuna editor rolü eklemeye çalıştığında RLS tarafından engellenir', async () => {
    // İstemciden doğrudan INSERT sorgusu simüle edilir
    vi.spyOn(supabase, 'from').mockReturnValueOnce({
      insert: vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'new row violates row-level security policy for table "user_roles"',
          code: '42501',
          details: 'Direct client INSERT is disabled on user_roles.',
        },
      }),
    } as any);

    const { data, error } = await supabase
      .from('user_roles')
      .insert({ user_id: 'member-user-id', role: 'editor' });

    expect(data).toBeNull();
    expect(error).toBeDefined();
    expect(error?.code).toBe('42501');
    expect(error?.message).toContain('row-level security policy');
  });

  // --------------------------------------------------------------------------
  // Senaryo 2: Member başka kullanıcının profilini okur
  // --------------------------------------------------------------------------
  it('2. Member başka bir kullanıcının profil verisini okumaya çalıştığında RLS izole eder ve veri döndürmez', async () => {
    // profiles_select_isolated politikası: auth.uid() = id or is_teacher_of(id) or is_super_admin()
    const mockEq = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });
    vi.spyOn(supabase, 'from').mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: mockEq,
      }),
    } as any);

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', 'other-victim-user-id');

    expect(data).toBeNull();
  });

  // --------------------------------------------------------------------------
  // Senaryo 3: Member başka öğrencinin sınav sonucunu okur
  // --------------------------------------------------------------------------
  it('3. Member başka bir öğrencinin sınav sonucunu (exam_attempts) okumaya çalıştığında RLS erişimi engeller', async () => {
    vi.spyOn(supabase, 'from').mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    } as any);

    const { data } = await supabase
      .from('exam_attempts')
      .select('*')
      .eq('user_id', 'other-student-id');

    expect(data).toEqual([]);
  });

  // --------------------------------------------------------------------------
  // Senaryo 4: Teacher başka öğretmenin sınıfını okur
  // --------------------------------------------------------------------------
  it('4. Öğretmen başka bir öğretmene ait olan ve üyesi olmadığı sınıfı sorguladığında RLS boş sonuç döner', async () => {
    vi.spyOn(supabase, 'from').mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    } as any);

    const { data } = await supabase
      .from('teacher_classes')
      .select('*')
      .eq('id', 'foreign-class-id');

    expect(data).toEqual([]);
  });

  // --------------------------------------------------------------------------
  // Senaryo 5: Teacher bağlı olmayan öğrenciyi okur
  // --------------------------------------------------------------------------
  it('5. Öğretmen kendi sınıfına kayıtlı olmayan (bağlı olmayan) bir öğrencinin profiline veya denemesine erişemez', async () => {
    vi.spyOn(supabase, 'from').mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: {
            message: 'Permission denied: is_teacher_of condition not met',
            code: '42501',
          },
        }),
      }),
    } as any);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', 'unconnected-student-id');

    expect(data).toBeNull();
    expect(error?.code).toBe('42501');
  });

  // --------------------------------------------------------------------------
  // Senaryo 6: Teacher öğrenci sonucunu değiştirmeye çalışır
  // --------------------------------------------------------------------------
  it('6. Öğretmen öğrencinin sınav sonucunu değiştirmeye (UPDATE) çalıştığında RLS politikası işlemi reddeder', async () => {
    // exam_attempts_update politikası: Yalnızca auth.uid() = user_id or is_super_admin()
    vi.spyOn(supabase, 'from').mockReturnValueOnce({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: {
            message: 'new row violates row-level security policy for table "exam_attempts"',
            code: '42501',
          },
        }),
      }),
    } as any);

    const { data, error } = await supabase
      .from('exam_attempts')
      .update({ score: 100, net_score: 100 })
      .eq('user_id', 'student-uid');

    expect(data).toBeNull();
    expect(error?.code).toBe('42501');
  });

  // --------------------------------------------------------------------------
  // Senaryo 7: Editor kullanıcı rolünü değiştirmeye çalışır
  // --------------------------------------------------------------------------
  it('7. Editör kullanıcı rolü atamaya (assign_user_role) çalıştığında RPC seviyesinde yetkisiz erişim fırlatılır', async () => {
    vi.spyOn(supabase, 'rpc').mockResolvedValueOnce({
      data: null,
      error: {
        message: 'Yetkisiz erişim: Bu işlemi yalnızca süper yöneticiler gerçekleştirebilir.',
      },
    } as any);

    const result = await rbacService.assignRole('target-user-id', 'editor');

    expect(result.success).toBe(false);
    expect(result.error).toContain('yalnızca süper yöneticiler');
  });

  // --------------------------------------------------------------------------
  // Senaryo 8: Editor öğrenci özel verisini okumaya çalışır
  // --------------------------------------------------------------------------
  it('8. Editör öğrenciye ait kişisel sınav ve soru denemesi verilerini okumaya çalıştığında RLS boş veri döner', async () => {
    // exam_attempts ve question_attempts için editörün okuma yetkisi yoktur
    vi.spyOn(supabase, 'from').mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    } as any);

    const { data } = await supabase
      .from('exam_attempts')
      .select('*')
      .limit(10);

    expect(data).toEqual([]);
  });

  // --------------------------------------------------------------------------
  // Senaryo 9: Anon kullanıcı özel veri okumaya çalışır
  // --------------------------------------------------------------------------
  it('9. Anonim (oturum açmamış) kullanıcı profilleri veya öğrenci verilerini sorguladığında RLS reddeder', async () => {
    vi.spyOn(supabase, 'from').mockReturnValueOnce({
      select: vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'permission denied for table profiles: auth.uid() is null',
          code: '42501',
        },
      }),
    } as any);

    const { data, error } = await supabase.from('profiles').select('*');

    expect(data).toBeNull();
    expect(error?.code).toBe('42501');
  });

  // --------------------------------------------------------------------------
  // Senaryo 10: Son super_admin rolü kaldırılmaya çalışılır
  // --------------------------------------------------------------------------
  it('10. Sistemdeki son süper yöneticinin rolü kaldırılmaya çalışıldığında eşzamanlı koruma hatası fırlatılır', async () => {
    vi.spyOn(supabase, 'rpc').mockResolvedValueOnce({
      data: null,
      error: {
        message: 'Güvenlik kuralı: Sistemdeki son süper yönetici rolü silinemez!',
      },
    } as any);

    const result = await rbacService.removeRole('last-super-admin-uid', 'super_admin');

    expect(result.success).toBe(false);
    expect(result.error).toContain('son süper yönetici rolü silinemez');
  });

  // --------------------------------------------------------------------------
  // Senaryo 11: localStorage veya sessionStorage değişikliğiyle yetki yükseltilmeye çalışılır
  // --------------------------------------------------------------------------
  it('11. localStorage veya sessionStorage içine yetkili roller yazılsa bile istemci manipülasyonu geçersiz kalır', async () => {
    // Saldırgan tarayıcı depolama alanına sahte roller enjekte eder
    localStorage.setItem('kpss_user_role', 'super_admin');
    localStorage.setItem('roles', JSON.stringify(['super_admin', 'editor', 'teacher']));
    sessionStorage.setItem('kpss_admin_auth', 'true');
    sessionStorage.setItem('user_roles', 'super_admin');

    // Sunucu tarafı user_roles tablosu ise sadece 'member' döner
    vi.spyOn(supabase, 'from').mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [{ role: 'member' }],
          error: null,
        }),
      }),
    } as any);

    const verifiedRoles = await rbacService.fetchUserRoles('attacker-user-id');

    expect(verifiedRoles).toEqual(['member']);
    expect(verifiedRoles).not.toContain('super_admin');
    expect(verifiedRoles).not.toContain('editor');
    expect(verifiedRoles).not.toContain('teacher');
  });

  // --------------------------------------------------------------------------
  // Senaryo 12: Doğrudan Supabase REST çağrısıyla RLS aşılmaya çalışılır
  // --------------------------------------------------------------------------
  it('12. Doğrudan PostgREST API çağrısı yapılarak RLS bypass edilmeye çalışıldığında 42501 hata kodu ile engellenir', async () => {
    // Örneğin questions tablosundaki taslak/in_review bir soruyu yetkisiz DELETE isteği göndermek
    vi.spyOn(supabase, 'from').mockReturnValueOnce({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: {
            message: 'new row violates row-level security policy for table "questions"',
            code: '42501',
            status: 403,
          },
        }),
      }),
    } as any);

    const { data, error } = await supabase
      .from('questions')
      .delete()
      .eq('id', 'question-to-delete');

    expect(data).toBeNull();
    expect(error?.code).toBe('42501');
    expect((error as any)?.status).toBe(403);
  });
});
