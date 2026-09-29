import { supabase, isSupabaseConfigured } from './supabase';
import { getRuntimeConfig } from '../config/runtimeConfig';

export interface TeacherClass {
  id: string;
  teacher_id: string;
  name: string;
  description: string;
  invite_code: string;
  invite_expires_at: string | null;
  is_active: boolean;
  student_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ClassStudent {
  id: string;
  class_id: string;
  student_id: string;
  status: 'invited' | 'active' | 'removed';
  joined_at: string;
  full_name: string;
  username: string;
  email?: string;
  avatar_url?: string;
  exam_type?: string;
}

export interface TeacherAssignment {
  id: string;
  teacher_id: string;
  class_id: string;
  title: string;
  description: string;
  assignment_type: 'quiz' | 'mock_exam' | 'study_plan';
  configuration: any;
  due_at: string | null;
  status: 'draft' | 'published' | 'archived';
  completed_count?: number;
  total_assigned?: number;
  created_at: string;
}

export const teacherService = {
  /**
   * Öğretmenin sahip olduğu sınıfları listeler
   */
  async getMyClasses(teacherId: string): Promise<TeacherClass[]> {
    if (!isSupabaseConfigured() || !teacherId) return [];

    try {
      const { data, error } = await supabase
        .from('teacher_classes')
        .select('*, class_members(count)')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      return data.map((c: any) => ({
        ...c,
        student_count: c.class_members?.[0]?.count ?? 0,
      }));
    } catch (err) {
      console.warn('getMyClasses error:', err);
      return [];
    }
  },

  /**
   * Yeni sınıf oluşturur ve 6 haneli benzersiz davet kodu üretir
   */
  async createClass(teacherId: string, name: string, description = ''): Promise<{ success: boolean; data?: TeacherClass; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Veritabanı bağlantısı yok.' };
    }

    try {
      const randomCode = 'KPSS-' + Math.floor(100000 + Math.random() * 900000);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 gün geçerli

      const { data, error } = await supabase
        .from('teacher_classes')
        .insert({
          teacher_id: teacherId,
          name: name.trim(),
          description: description.trim(),
          invite_code: randomCode,
          invite_expires_at: expiresAt,
          is_active: true,
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Sınıf oluşturulamadı.' };
    }
  },

  /**
   * Belirli bir sınıfa kayıtlı öğrencileri ve profil bilgilerini listeler
   */
  async getClassStudents(classId: string): Promise<ClassStudent[]> {
    if (!isSupabaseConfigured() || !classId) return [];

    try {
      const { data, error } = await supabase
        .from('class_members')
        .select(`
          id,
          class_id,
          student_id,
          status,
          joined_at,
          profiles:student_id (
            full_name,
            username,
            avatar_url,
            exam_type
          )
        `)
        .eq('class_id', classId)
        .eq('status', 'active')
        .order('joined_at', { ascending: false });

      if (error || !data) return [];

      return data.map((item: any) => ({
        id: item.id,
        class_id: item.class_id,
        student_id: item.student_id,
        status: item.status,
        joined_at: item.joined_at,
        full_name: item.profiles?.full_name || 'Öğrenci',
        username: item.profiles?.username || '',
        avatar_url: item.profiles?.avatar_url || '',
        exam_type: item.profiles?.exam_type || '',
      }));
    } catch (err) {
      console.warn('getClassStudents error:', err);
      return [];
    }
  },

  /**
   * Sınıf için yeni ödev / çalışma atar
   */
  async createAssignment(
    teacherId: string,
    classId: string,
    title: string,
    description: string,
    assignmentType: 'quiz' | 'mock_exam' | 'study_plan',
    configuration: any,
    dueDays = 7
  ): Promise<{ success: boolean; data?: TeacherAssignment; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Veritabanı bağlantısı yok.' };
    }

    try {
      const dueAt = new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('assignments')
        .insert({
          teacher_id: teacherId,
          class_id: classId,
          title: title.trim(),
          description: description.trim(),
          assignment_type: assignmentType,
          configuration,
          due_at: dueAt,
          status: 'published',
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Ödev atanamadı.' };
    }
  },

  /**
   * Sınıfa ait tüm ödevleri listeler
   */
  async getClassAssignments(classId: string): Promise<TeacherAssignment[]> {
    if (!isSupabaseConfigured() || !classId) return [];

    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*, assignment_results(count)')
        .eq('class_id', classId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      return data.map((a: any) => ({
        ...a,
        completed_count: a.assignment_results?.[0]?.count ?? 0,
      }));
    } catch (err) {
      console.warn('getClassAssignments error:', err);
      return [];
    }
  },
};
