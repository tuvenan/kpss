import { supabase, isSupabaseConfigured } from './supabase';
import { rbacService } from './rbacService';

export interface EnrolledClass {
  id: string;
  class_id: string;
  class_name: string;
  class_description: string;
  teacher_id: string;
  teacher_name?: string;
  teacher_email?: string;
  joined_at: string;
  status: 'active' | 'invited' | 'removed';
}

export interface StudentAssignment {
  id: string;
  assignment_id: string;
  class_id: string;
  class_name?: string;
  teacher_id: string;
  teacher_name?: string;
  title: string;
  description: string;
  assignment_type: 'quiz' | 'mock_exam' | 'study_plan';
  configuration: any;
  due_at: string | null;
  status: 'assigned' | 'started' | 'completed' | 'overdue';
  score?: number | null;
  completed_at?: string | null;
}

export const memberService = {
  /**
   * Öğrencinin kayıtlı olduğu sınıfları ve öğretmen bilgilerini çeker.
   * RLS: Öğrenci yalnızca kendi üyelik kayıtlarını görebilir.
   */
  async getMyEnrolledClasses(studentId: string): Promise<EnrolledClass[]> {
    if (!isSupabaseConfigured() || !studentId) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('class_members')
        .select(`
          id,
          class_id,
          status,
          joined_at,
          teacher_classes:class_id (
            id,
            name,
            description,
            teacher_id,
            profiles:teacher_id (
              full_name,
              username
            )
          )
        `)
        .eq('student_id', studentId)
        .eq('status', 'active')
        .order('joined_at', { ascending: false });

      if (error || !data) {
        console.warn('getMyEnrolledClasses error:', error?.message);
        return [];
      }

      return data.map((item: any) => {
        const tc = item.teacher_classes || {};
        const teacherProfile = tc.profiles || {};
        return {
          id: item.id,
          class_id: item.class_id,
          class_name: tc.name || 'Sınıf',
          class_description: tc.description || '',
          teacher_id: tc.teacher_id,
          teacher_name: teacherProfile.full_name || teacherProfile.username || 'Öğretmen',
          joined_at: item.joined_at,
          status: item.status,
        };
      });
    } catch (err) {
      console.warn('getMyEnrolledClasses exception:', err);
      return [];
    }
  },

  /**
   * Davet kodu girerek güvenli RPC fonksiyonu üzerinden sınıfa katılır.
   */
  async joinClassByInviteCode(code: string): Promise<{ success: boolean; message: string; className?: string; classId?: string }> {
    const cleanCode = code.trim();
    if (!cleanCode) {
      return { success: false, message: 'Lütfen geçerli bir davet kodu giriniz.' };
    }
    return rbacService.joinClassByInviteCode(cleanCode);
  },

  /**
   * Öğrenciye atanmış çalışmaları / ödevleri çeker.
   */
  async getMyAssignments(studentId: string): Promise<StudentAssignment[]> {
    if (!isSupabaseConfigured() || !studentId) {
      return [];
    }

    try {
      // 1. Önce öğrencinin aktif olduğu sınıfları bul
      const { data: memberData, error: memberErr } = await supabase
        .from('class_members')
        .select('class_id, teacher_classes(name)')
        .eq('student_id', studentId)
        .eq('status', 'active');

      if (memberErr || !memberData || memberData.length === 0) {
        return [];
      }

      const classIds = memberData.map((m: any) => m.class_id);
      const classMap: Record<string, string> = {};
      memberData.forEach((m: any) => {
        classMap[m.class_id] = m.teacher_classes?.name || 'Sınıf';
      });

      // 2. Bu sınıflara ait yayınlanmış ödevleri çek
      const { data: assignData, error: assignErr } = await supabase
        .from('assignments')
        .select(`
          id,
          class_id,
          teacher_id,
          title,
          description,
          assignment_type,
          configuration,
          due_at,
          status,
          created_at
        `)
        .in('class_id', classIds)
        .eq('status', 'published')
        .order('due_at', { ascending: true });

      if (assignErr || !assignData) {
        return [];
      }

      // 3. Öğrencinin mevcut tamamlama/başlama sonuçlarını çek
      const assignmentIds = assignData.map((a: any) => a.id);
      const { data: resultsData } = await supabase
        .from('assignment_results')
        .select('*')
        .eq('student_id', studentId)
        .in('assignment_id', assignmentIds);

      const resultMap: Record<string, any> = {};
      if (resultsData) {
        resultsData.forEach((r: any) => {
          resultMap[r.assignment_id] = r;
        });
      }

      const now = new Date().getTime();

      return assignData.map((a: any) => {
        const result = resultMap[a.id];
        let status: 'assigned' | 'started' | 'completed' | 'overdue' = 'assigned';

        if (result?.status === 'completed') {
          status = 'completed';
        } else if (result?.status === 'started') {
          status = 'started';
        } else if (a.due_at && new Date(a.due_at).getTime() < now) {
          status = 'overdue';
        }

        return {
          id: a.id,
          assignment_id: a.id,
          class_id: a.class_id,
          class_name: classMap[a.class_id] || 'Sınıf',
          teacher_id: a.teacher_id,
          title: a.title,
          description: a.description || '',
          assignment_type: a.assignment_type,
          configuration: a.configuration || {},
          due_at: a.due_at,
          status,
          score: result?.score ?? null,
          completed_at: result?.completed_at ?? null,
        };
      });
    } catch (err) {
      console.warn('getMyAssignments exception:', err);
      return [];
    }
  },

  /**
   * Öğrencinin tamamladığı ödevin sonucunu kaydeder.
   */
  async submitAssignmentResult(
    assignmentId: string,
    studentId: string,
    score: number,
    resultSummary: any = {},
    examAttemptId?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Veritabanı yapılandırılmamış.' };
    }

    try {
      const { error } = await supabase
        .from('assignment_results')
        .upsert(
          {
            assignment_id: assignmentId,
            student_id: studentId,
            score,
            status: 'completed',
            completed_at: new Date().toISOString(),
            result_summary: resultSummary,
            exam_attempt_id: examAttemptId || null,
          },
          { onConflict: 'assignment_id,student_id' }
        );

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Sonuç kaydedilemedi.' };
    }
  },

  /**
   * Sınıftan ayrılma
   */
  async leaveClass(classId: string, studentId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Veritabanı yapılandırılmamış.' };
    }

    try {
      const { error } = await supabase
        .from('class_members')
        .delete()
        .eq('class_id', classId)
        .eq('student_id', studentId);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Sınıftan çıkılamadı.' };
    }
  },
};
