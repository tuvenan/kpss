import { supabase, isSupabaseConfigured } from './supabase';
import { Question, Subject, Unit, OptionId } from '@/types';
import { MOCK_QUESTIONS, MOCK_SUBJECTS, MOCK_UNITS } from '@/data/mockQuestions';

export interface AdminOverviewStats {
  totalSubjects: number;
  totalUnits: number;
  totalQuestions: number;
  totalErrorsInPool: number;
  isCloudConnected: boolean;
}

export interface FailedQuestionStat {
  questionId: string;
  questionText: string;
  unitId: string;
  wrongCount: number;
  correctOption: string;
}

export const adminService = {
  /**
   * Yönetici paneli için genel istatistikleri çeker.
   */
  async getOverviewStats(): Promise<AdminOverviewStats> {
    const isCloudConnected = isSupabaseConfigured();

    if (isCloudConnected) {
      try {
        const [
          { count: subjectsCount },
          { count: unitsCount },
          { count: questionsCount },
          { count: errorsCount },
        ] = await Promise.all([
          supabase.from('subjects').select('*', { count: 'exact', head: true }),
          supabase.from('units').select('*', { count: 'exact', head: true }),
          supabase.from('questions').select('*', { count: 'exact', head: true }),
          supabase.from('error_pool').select('*', { count: 'exact', head: true }),
        ]);

        return {
          totalSubjects: subjectsCount ?? MOCK_SUBJECTS.length,
          totalUnits: unitsCount ?? MOCK_UNITS.length,
          totalQuestions: questionsCount ?? MOCK_QUESTIONS.length,
          totalErrorsInPool: errorsCount ?? 0,
          isCloudConnected: true,
        };
      } catch (err) {
        console.warn('Admin stats sorgulama hatası:', err);
      }
    }

    return {
      totalSubjects: MOCK_SUBJECTS.length,
      totalUnits: MOCK_UNITS.length,
      totalQuestions: MOCK_QUESTIONS.length,
      totalErrorsInPool: 0,
      isCloudConnected: false,
    };
  },

  /**
   * Tüm soruları arama ve ünite filtresiyle getirir.
   */
  async getQuestions(filter?: { unitId?: string; search?: string }): Promise<Question[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('questions').select('*').order('question_number', { ascending: true });

        if (filter?.unitId && filter.unitId !== 'all') {
          query = query.eq('unit_id', filter.unitId);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          let list: Question[] = data.map((row: any) => ({
            id: row.id,
            unitId: row.unit_id,
            questionNumber: row.question_number,
            questionText: row.question_text,
            options: Array.isArray(row.options)
              ? row.options
              : typeof row.options === 'string'
              ? JSON.parse(row.options)
              : [],
            correctOption: row.correct_option as OptionId,
            explanation: row.explanation || '',
          }));

          if (filter?.search) {
            const q = filter.search.toLowerCase();
            list = list.filter((item) => item.questionText.toLowerCase().includes(q));
          }

          return list;
        }
      } catch (err) {
        console.warn('Admin getQuestions hatası:', err);
      }
    }

    let localList = [...MOCK_QUESTIONS];
    if (filter?.unitId && filter.unitId !== 'all') {
      localList = localList.filter((item) => item.unitId === filter.unitId);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      localList = localList.filter((item) => item.questionText.toLowerCase().includes(q));
    }
    return localList;
  },

  /**
   * Yeni soru ekler.
   */
  async createQuestion(question: Question): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured()) {
      try {
        const payload: any = {
          unit_id: question.unitId,
          question_number: question.questionNumber,
          question_text: question.questionText,
          options: question.options,
          correct_option: question.correctOption,
          explanation: question.explanation,
        };
        if (question.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(question.id)) {
          payload.id = question.id;
        }

        const { error } = await supabase.from('questions').insert(payload);

        if (error) {
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'Bilinmeyen hata' };
      }
    }

    // Mock veriye geçici ekle
    MOCK_QUESTIONS.push(question);
    return { success: true };
  },

  /**
   * Mevcut bir soruyu günceller.
   */
  async updateQuestion(id: string, updates: Partial<Question>): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured()) {
      try {
        const payload: any = {};
        if (updates.questionText !== undefined) payload.question_text = updates.questionText;
        if (updates.unitId !== undefined) payload.unit_id = updates.unitId;
        if (updates.questionNumber !== undefined) payload.question_number = updates.questionNumber;
        if (updates.options !== undefined) payload.options = updates.options;
        if (updates.correctOption !== undefined) payload.correct_option = updates.correctOption;
        if (updates.explanation !== undefined) payload.explanation = updates.explanation;

        const { error } = await supabase.from('questions').update(payload).eq('id', id);
        if (error) return { success: false, error: error.message };
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    const idx = MOCK_QUESTIONS.findIndex((q) => q.id === id);
    if (idx >= 0) {
      MOCK_QUESTIONS[idx] = { ...MOCK_QUESTIONS[idx], ...updates };
    }
    return { success: true };
  },

  /**
   * Soruyu siler.
   */
  async deleteQuestion(id: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('questions').delete().eq('id', id);
        if (error) return { success: false, error: error.message };
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    const idx = MOCK_QUESTIONS.findIndex((q) => q.id === id);
    if (idx >= 0) {
      MOCK_QUESTIONS.splice(idx, 1);
    }
    return { success: true };
  },

  /**
   * Öğrencilerin en çok yanlış yaptığı soruların analitiğini döner.
   */
  async getMostFailedQuestions(): Promise<FailedQuestionStat[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('error_pool')
          .select('question_id, unit_id, wrong_count, questions(question_text, correct_option)')
          .order('wrong_count', { ascending: false })
          .limit(10);

        if (!error && data) {
          return data.map((item: any) => ({
            questionId: item.question_id,
            unitId: item.unit_id,
            wrongCount: item.wrong_count || 1,
            questionText: item.questions?.question_text || 'Soru metni',
            correctOption: item.questions?.correct_option || '-',
          }));
        }
      } catch (err) {
        console.warn('getMostFailedQuestions hatası:', err);
      }
    }

    return [];
  },

  /**
   * Tüm mock verilerini (dersler, üniteler, sorular) Supabase'e tek tıkla tohumlar.
   */
  async seedAllDataToSupabase(): Promise<{ success: boolean; message: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, message: 'Supabase URL veya Anon Key yapılandırılmamış.' };
    }

    try {
      // 1. Dersleri tohumla
      const subjectRows = MOCK_SUBJECTS.map((s) => ({
        id: s.id,
        title: s.title,
        icon_name: s.iconName,
        total_units: s.totalUnits,
      }));
      await supabase.from('subjects').upsert(subjectRows);

      // 2. Üniteleri tohumla
      const unitRows = MOCK_UNITS.map((u) => ({
        id: u.id,
        subject_id: u.subjectId,
        title: u.title,
        unit_number: u.unitNumber,
        is_locked: u.isLocked,
        is_completed: u.isCompleted,
      }));
      await supabase.from('units').upsert(unitRows);

      // 3. Soruları tohumla
      const questionRows = MOCK_QUESTIONS.map((q) => ({
        id: q.id,
        unit_id: q.unitId,
        question_number: q.questionNumber,
        question_text: q.questionText,
        options: q.options,
        correct_option: q.correctOption,
        explanation: q.explanation,
      }));
      await supabase.from('questions').upsert(questionRows);

      return { success: true, message: 'Dersler, üniteler ve 20 soru Supabase bulut veritabanına başarıyla aktarıldı.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Tohumlama esnasında hata oluştu.' };
    }
  },
};

export default adminService;
