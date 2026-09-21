import { supabase, isSupabaseConfigured } from './supabase';
import { Question, OptionId } from '@/types';
import { MOCK_QUESTIONS } from '@/data/mockQuestions';

/**
 * Supabase 'questions' tablosundan soruları çeken ve
 * bulut veri altyapısını yöneten servis.
 */
export const questionService = {
  /**
   * Belirtilen üniteye ait soruları Supabase'den çeker.
   * Bulut verisi yoksa veya bağlantı kurulamazsa güvenli bir şekilde yerel veriyi döner.
   */
  async getQuestionsByUnit(unitId: string): Promise<Question[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('unit_id', unitId)
          .order('question_number', { ascending: true });

        if (!error && data && data.length > 0) {
          // Supabase veritabanı sütunlarını (snake_case) uygulama modeline (camelCase) eşle
          return data.map((row: any) => ({
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
        }
      } catch (err) {
        console.warn('Supabase questions sorgu hatası, yerel veriye dönülüyor:', err);
      }
    }

    // Supabase yapılandırılmamışsa veya hata olursa yerel KPSS sorularını kullan
    const localFiltered = MOCK_QUESTIONS.filter((q) => q.unitId === unitId);
    return localFiltered.length > 0 ? localFiltered : MOCK_QUESTIONS;
  },

  /**
   * Belirtilen konuya ait soruları Supabase'den çeker.
   * Yoksa ünite sorularına veya genel mock sorulara döner.
   */
  async getQuestionsByTopic(topicId: string, unitId?: string): Promise<Question[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('topic_id', topicId)
          .order('question_number', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((row: any) => ({
            id: row.id,
            unitId: row.unit_id,
            topicId: row.topic_id,
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
        }
      } catch (err) {
        console.warn('Supabase questions by topic sorgu hatası, yerel veriye dönülüyor:', err);
      }
    }

    return this.getQuestionsByUnit(unitId || topicId);
  },

  /**
   * Belirtilen ID listesine sahip soruları Supabase'den çeker (Hata havuzu pratiği için).
   */
  async getQuestionsByIds(questionIds: string[]): Promise<Question[]> {
    if (questionIds.length === 0) return [];

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .in('id', questionIds);

        if (!error && data && data.length > 0) {
          return data.map((row: any) => ({
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
        }
      } catch (err) {
        console.warn('Supabase getQuestionsByIds hatası:', err);
      }
    }

    return MOCK_QUESTIONS.filter((q) => questionIds.includes(q.id));
  },

  /**
   * Supabase 'questions' tablosu boş ise başlangıç mock sorularını buluta tohumlar (seed).
   */
  async seedMockQuestionsToSupabase(): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    try {
      // Önce tabloda soru var mı kontrol et
      const { count } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true });

      if (count && count > 0) {
        return false; // Zaten veriler mevcut
      }

      const rows = MOCK_QUESTIONS.map((q) => ({
        id: q.id,
        unit_id: q.unitId,
        question_number: q.questionNumber,
        question_text: q.questionText,
        options: q.options,
        correct_option: q.correctOption,
        explanation: q.explanation,
      }));

      const { error } = await supabase.from('questions').insert(rows);
      return !error;
    } catch (e) {
      console.warn('seedMockQuestionsToSupabase hatası:', e);
      return false;
    }
  },
};

export default questionService;
