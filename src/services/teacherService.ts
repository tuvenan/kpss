import { supabase, isSupabaseConfigured } from './supabase';

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
  class_name?: string;
  student_id: string;
  status: 'invited' | 'active' | 'removed';
  joined_at: string;
  full_name: string;
  username: string;
  email?: string;
  avatar_url?: string;
  exam_type?: string;
  completed_assignments_count?: number;
  average_score?: number | null;
}

export interface TeacherAssignment {
  id: string;
  teacher_id: string;
  class_id: string;
  class_name?: string;
  title: string;
  description: string;
  assignment_type: 'quiz' | 'mock_exam' | 'study_plan';
  configuration: any;
  due_at: string | null;
  status: 'draft' | 'published' | 'archived';
  target_scope: 'class' | 'students';
  completed_count?: number;
  total_assigned?: number;
  created_at: string;
}

export interface TeacherQuestionSet {
  id: string;
  teacher_id: string;
  class_id?: string | null;
  class_name?: string;
  title: string;
  description: string;
  subject_id?: string;
  questions: any[];
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeacherOverviewMetrics {
  totalClasses: number;
  activeStudentsCount: number;
  pendingAssignmentsCount: number;
  recentSubmissions: {
    studentName: string;
    assignmentTitle: string;
    score: number;
    completedAt: string;
  }[];
  lowPerformanceAlerts: {
    studentId: string;
    studentName: string;
    className: string;
    recentScore: number;
    issue: string;
  }[];
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
   * Sınıfı günceller (isim, açıklama)
   */
  async updateClass(classId: string, teacherId: string, name: string, description: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) return { success: false, error: 'Veritabanı bağlantısı yok.' };

    try {
      const { error } = await supabase
        .from('teacher_classes')
        .update({
          name: name.trim(),
          description: description.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', classId)
        .eq('teacher_id', teacherId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Sınıf güncellenemedi.' };
    }
  },

  /**
   * Sınıfı arşivler / pasifleştirir (is_active: false)
   */
  async archiveClass(classId: string, teacherId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) return { success: false, error: 'Veritabanı bağlantısı yok.' };

    try {
      const { error } = await supabase
        .from('teacher_classes')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', classId)
        .eq('teacher_id', teacherId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Sınıf arşivlenemedi.' };
    }
  },

  /**
   * Davet kodunu yeniler (yeni kod üretir ve süresini 30 gün uzatır)
   */
  async regenerateInviteCode(classId: string, teacherId: string): Promise<{ success: boolean; newCode?: string; error?: string }> {
    if (!isSupabaseConfigured()) return { success: false, error: 'Veritabanı bağlantısı yok.' };

    try {
      const newCode = 'KPSS-' + Math.floor(100000 + Math.random() * 900000);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from('teacher_classes')
        .update({
          invite_code: newCode,
          invite_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', classId)
        .eq('teacher_id', teacherId);

      if (error) return { success: false, error: error.message };
      return { success: true, newCode };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Davet kodu yenilenemedi.' };
    }
  },

  /**
   * Davet kodunu süresi dolmuş olarak işaretler / iptal eder
   */
  async revokeInviteCode(classId: string, teacherId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) return { success: false, error: 'Veritabanı bağlantısı yok.' };

    try {
      const { error } = await supabase
        .from('teacher_classes')
        .update({
          invite_expires_at: new Date(Date.now() - 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', classId)
        .eq('teacher_id', teacherId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Davet kodu iptal edilemedi.' };
    }
  },

  /**
   * Belirli bir sınıfa kayıtlı öğrencileri listeler
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
   * Öğretmenin tüm sınıflarına kayıtlı olan tekil öğrencileri listeler
   */
  async getAllMyStudents(teacherId: string): Promise<ClassStudent[]> {
    if (!isSupabaseConfigured() || !teacherId) return [];

    try {
      const myClasses = await this.getMyClasses(teacherId);
      if (myClasses.length === 0) return [];

      const classIds = myClasses.map((c) => c.id);
      const classMap = Object.fromEntries(myClasses.map((c) => [c.id, c.name]));

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
        .in('class_id', classIds)
        .eq('status', 'active')
        .order('joined_at', { ascending: false });

      if (error || !data) return [];

      return data.map((item: any) => ({
        id: item.id,
        class_id: item.class_id,
        class_name: classMap[item.class_id] || 'Sınıf',
        student_id: item.student_id,
        status: item.status,
        joined_at: item.joined_at,
        full_name: item.profiles?.full_name || 'Öğrenci',
        username: item.profiles?.username || '',
        avatar_url: item.profiles?.avatar_url || '',
        exam_type: item.profiles?.exam_type || '',
      }));
    } catch (err) {
      console.warn('getAllMyStudents error:', err);
      return [];
    }
  },

  /**
   * Sınıf veya tüm sınıflar için ödev atar (Tüm sınıfa veya belirli öğrencilere)
   */
  async createAssignment(
    teacherId: string,
    classId: string,
    title: string,
    description: string,
    assignmentType: 'quiz' | 'mock_exam' | 'study_plan',
    configuration: any = {},
    dueDays = 7,
    targetStudentIds: string[] = [],
    status: 'draft' | 'published' = 'published'
  ): Promise<{ success: boolean; data?: TeacherAssignment; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Veritabanı bağlantısı yok.' };
    }

    try {
      const dueAt = new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000).toISOString();

      const { data: assignmentData, error } = await supabase
        .from('assignments')
        .insert({
          teacher_id: teacherId,
          class_id: classId,
          title: title.trim(),
          description: description.trim(),
          assignment_type: assignmentType,
          configuration,
          due_at: dueAt,
          status,
          target_scope: targetStudentIds.length > 0 ? 'students' : 'class',
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };

      // Bireysel hedef öğrenci atamaları
      if (targetStudentIds.length > 0 && assignmentData?.id) {
        const targets = targetStudentIds.map((sid) => ({
          assignment_id: assignmentData.id,
          student_id: sid,
        }));
        const { error: targetsError } = await supabase.from('assignment_targets').insert(targets);
        if (targetsError) {
          // Do not leave a targeted assignment behind without its targets: it
          // would otherwise be invisible or could later be misinterpreted.
          await supabase.from('assignments').delete().eq('id', assignmentData.id);
          return { success: false, error: targetsError.message };
        }
      }

      return { success: true, data: assignmentData };
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

  /**
   * Öğretmenin tüm sınıflarına ait ödevleri listeler
   */
  async getAllMyAssignments(teacherId: string): Promise<TeacherAssignment[]> {
    if (!isSupabaseConfigured() || !teacherId) return [];

    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*, teacher_classes(name), assignment_results(count)')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      return data.map((a: any) => ({
        ...a,
        class_name: a.teacher_classes?.name || 'Sınıf',
        completed_count: a.assignment_results?.[0]?.count ?? 0,
      }));
    } catch (err) {
      console.warn('getAllMyAssignments error:', err);
      return [];
    }
  },

  /**
   * Ödevin durumunu günceller (draft, published, archived)
   */
  async updateAssignmentStatus(
    assignmentId: string,
    teacherId: string,
    status: 'draft' | 'published' | 'archived'
  ): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) return { success: false, error: 'Veritabanı bağlantısı yok.' };

    try {
      const { error } = await supabase
        .from('assignments')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', assignmentId)
        .eq('teacher_id', teacherId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Ödev durumu güncellenemedi.' };
    }
  },

  /**
   * Genel Bakış Metrikleri ve Uyarıları (Overview)
   */
  async getTeacherOverviewMetrics(teacherId: string): Promise<TeacherOverviewMetrics> {
    const fallback: TeacherOverviewMetrics = {
      totalClasses: 0,
      activeStudentsCount: 0,
      pendingAssignmentsCount: 0,
      recentSubmissions: [],
      lowPerformanceAlerts: [],
    };

    if (!isSupabaseConfigured() || !teacherId) return fallback;

    try {
      const [classes, students, assignments] = await Promise.all([
        this.getMyClasses(teacherId),
        this.getAllMyStudents(teacherId),
        this.getAllMyAssignments(teacherId),
      ]);

      const assignmentIds = assignments.map((a) => a.id);
      let submissions: any[] = [];

      if (assignmentIds.length > 0) {
        const { data: subData } = await supabase
          .from('assignment_results')
          .select(`
            id,
            assignment_id,
            student_id,
            score,
            completed_at,
            profiles:student_id(full_name, username),
            assignments:assignment_id(title)
          `)
          .in('assignment_id', assignmentIds)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(10);

        if (subData) submissions = subData;
      }

      const recentSubmissions = submissions.map((s: any) => ({
        studentName: s.profiles?.full_name || s.profiles?.username || 'Öğrenci',
        assignmentTitle: s.assignments?.title || 'Ödev',
        score: Number(s.score || 0),
        completedAt: s.completed_at || new Date().toISOString(),
      }));

      // Düşük performans uyarıları (skoru 50'nin altında kalan teslimler)
      const lowPerformanceAlerts = submissions
        .filter((s: any) => Number(s.score || 0) < 50)
        .map((s: any) => ({
          studentId: s.student_id,
          studentName: s.profiles?.full_name || s.profiles?.username || 'Öğrenci',
          className: 'Kayıtlı Sınıf',
          recentScore: Number(s.score || 0),
          issue: `Son çalışmada %${Number(s.score || 0)} başarı gösterdi. Konu tekrarı önerilir.`,
        }));

      return {
        totalClasses: classes.length,
        activeStudentsCount: students.length,
        pendingAssignmentsCount: assignments.filter((a) => a.status === 'published').length,
        recentSubmissions,
        lowPerformanceAlerts,
      };
    } catch (err) {
      console.warn('getTeacherOverviewMetrics error:', err);
      return fallback;
    }
  },

  /**
   * Öğretmenin Özel Soru Setlerini Listeler (Başka öğretmenler göremez)
   */
  async getTeacherQuestionSets(teacherId: string): Promise<TeacherQuestionSet[]> {
    if (!isSupabaseConfigured() || !teacherId) return [];

    try {
      const { data, error } = await supabase
        .from('teacher_question_sets')
        .select('*, teacher_classes(name)')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      return data.map((item: any) => ({
        id: item.id,
        teacher_id: item.teacher_id,
        class_id: item.class_id,
        class_name: item.teacher_classes?.name,
        title: item.title,
        description: item.description || '',
        subject_id: item.subject_id,
        questions: Array.isArray(item.questions) ? item.questions : [],
        is_private: item.is_private,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));
    } catch (err) {
      console.warn('getTeacherQuestionSets error:', err);
      return [];
    }
  },

  /**
   * Yeni Özel Soru Seti Oluşturur
   */
  async createTeacherQuestionSet(
    teacherId: string,
    title: string,
    description = '',
    classId: string | null = null,
    subjectId = '',
    questions: any[] = []
  ): Promise<{ success: boolean; data?: TeacherQuestionSet; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Veritabanı bağlantısı yok.' };
    }

    try {
      const { data, error } = await supabase
        .from('teacher_question_sets')
        .insert({
          teacher_id: teacherId,
          class_id: classId || null,
          title: title.trim(),
          description: description.trim(),
          subject_id: subjectId || null,
          questions,
          is_private: true,
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Özel soru seti oluşturulamadı.' };
    }
  },

  /**
   * Özel Soru Setini Siler
   */
  async deleteTeacherQuestionSet(setId: string, teacherId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) return { success: false, error: 'Veritabanı bağlantısı yok.' };

    try {
      const { error } = await supabase
        .from('teacher_question_sets')
        .delete()
        .eq('id', setId)
        .eq('teacher_id', teacherId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Soru seti silinemedi.' };
    }
  },
};
