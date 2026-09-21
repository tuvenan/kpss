import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase, isSupabaseConfigured } from './supabase';
import { OptionId, Question, UserAnswer, ErrorPoolEntry } from '@/types';

const LOCAL_STORAGE_KEY = '@kpss_error_pool_cache';
const DEFAULT_USER_ID = 'local_device_user';

/**
 * Yanlış yapılan soruların 'error_pool' tablosuna kaydedilmesini,
 * yönetilmesini ve tekrar çözülmesini sağlayan servis.
 */
export const errorPoolService = {
  /**
   * Tek bir yanlış cevabı 'error_pool' tablosuna kaydeder (veya sayacını artırır).
   */
  async recordWrongAnswer(params: {
    questionId: string;
    unitId: string;
    selectedOption: OptionId;
    correctOption: OptionId;
    userId?: string;
  }): Promise<void> {
    const userId = params.userId || DEFAULT_USER_ID;
    const now = new Date().toISOString();

    // 1. Yerel AsyncStorage önbelleğini güncelle (Çevrimdışı destek için)
    await this.updateLocalCache({
      questionId: params.questionId,
      unitId: params.unitId,
      selectedOption: params.selectedOption,
      correctOption: params.correctOption,
      userId,
      isResolved: false,
      lastAttemptAt: now,
    });

    // 2. Supabase yapılandırılmışsa sunucuya kaydet/güncelle (Upsert)
    if (isSupabaseConfigured()) {
      try {
        // Önce mevcut kaydı kontrol et
        const { data: existing } = await supabase
          .from('error_pool')
          .select('id, wrong_count')
          .eq('user_id', userId)
          .eq('question_id', params.questionId)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('error_pool')
            .update({
              selected_option: params.selectedOption,
              wrong_count: (existing.wrong_count || 1) + 1,
              is_resolved: false,
              last_attempt_at: now,
            })
            .eq('id', existing.id);
        } else {
          await supabase.from('error_pool').insert({
            user_id: userId,
            question_id: params.questionId,
            unit_id: params.unitId,
            selected_option: params.selectedOption,
            correct_option: params.correctOption,
            wrong_count: 1,
            is_resolved: false,
            last_attempt_at: now,
            created_at: now,
          });
        }
      } catch (error) {
        console.warn('Supabase error_pool yazma hatası (yerel önbellek kullanıldı):', error);
      }
    }
  },

  /**
   * Bir test/ünite bittiğinde tüm yanlış soruları toplu olarak senkronize eder.
   */
  async syncQuizWrongAnswers(
    userAnswers: Record<string, UserAnswer>,
    questions: Question[],
    unitId: string,
    userId?: string
  ): Promise<number> {
    const activeUserId = userId || DEFAULT_USER_ID;
    let savedCount = 0;

    for (const q of questions) {
      const answer = userAnswers[q.id];
      if (answer && !answer.isCorrect) {
        await this.recordWrongAnswer({
          questionId: q.id,
          unitId,
          selectedOption: answer.selectedOption,
          correctOption: q.correctOption,
          userId: activeUserId,
        });
        savedCount += 1;
      }
    }

    return savedCount;
  },

  /**
   * Hata havuzunda bekleyen (henüz çözülmemiş) soru ID'lerini getirir.
   */
  async getUnresolvedQuestionIds(unitId?: string, userId?: string): Promise<string[]> {
    const activeUserId = userId || DEFAULT_USER_ID;

    // 1. Supabase aktif ise sunucudan çek
    if (isSupabaseConfigured()) {
      try {
        let query = supabase
          .from('error_pool')
          .select('question_id')
          .eq('user_id', activeUserId)
          .eq('is_resolved', false);

        if (unitId) {
          query = query.eq('unit_id', unitId);
        }

        const { data, error } = await query;
        if (!error && data) {
          return data.map((item) => item.question_id);
        }
      } catch (error) {
        console.warn('Supabase error_pool okuma hatası, yerel önbelleğe geçiliyor:', error);
      }
    }

    // 2. Çevrimdışı yerel önbellek fallback'i
    const localCache = await this.getLocalCache();
    return localCache
      .filter((item) => {
        const matchesUser = item.userId === activeUserId;
        const matchesUnit = unitId ? item.unitId === unitId : true;
        return matchesUser && matchesUnit && !item.isResolved;
      })
      .map((item) => item.questionId);
  },

  /**
   * Kullanıcı soru havuzundaki bir soruyu doğru çözdüğünde soruyu 'çözüldü' (resolved) olarak işaretler.
   */
  async markQuestionResolved(questionId: string, userId?: string): Promise<void> {
    const activeUserId = userId || DEFAULT_USER_ID;
    const now = new Date().toISOString();

    // 1. Yerel önbellekte güncelle
    const localCache = await this.getLocalCache();
    const updatedCache = localCache.map((item) => {
      if (item.questionId === questionId && item.userId === activeUserId) {
        return { ...item, isResolved: true, lastAttemptAt: now };
      }
      return item;
    });
    await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedCache));

    // 2. Supabase'de güncelle
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('error_pool')
          .update({
            is_resolved: true,
            last_attempt_at: now,
          })
          .eq('user_id', activeUserId)
          .eq('question_id', questionId);
      } catch (error) {
        console.warn('Supabase error_pool markQuestionResolved hatası:', error);
      }
    }
  },

  /**
   * Hata havuzunun genel istatistiklerini getirir.
   */
  async getErrorPoolStats(unitId?: string, userId?: string): Promise<{
    totalUnresolved: number;
    totalResolved: number;
  }> {
    const activeUserId = userId || DEFAULT_USER_ID;

    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('error_pool').select('is_resolved').eq('user_id', activeUserId);
        if (unitId) {
          query = query.eq('unit_id', unitId);
        }
        const { data, error } = await query;
        if (!error && data) {
          const unresolved = data.filter((d) => !d.is_resolved).length;
          const resolved = data.filter((d) => d.is_resolved).length;
          return { totalUnresolved: unresolved, totalResolved: resolved };
        }
      } catch (e) {
        console.warn('Supabase getErrorPoolStats hatası:', e);
      }
    }

    const local = await this.getLocalCache();
    const filtered = local.filter((item) => {
      const matchesUser = item.userId === activeUserId;
      const matchesUnit = unitId ? item.unitId === unitId : true;
      return matchesUser && matchesUnit;
    });

    return {
      totalUnresolved: filtered.filter((f) => !f.isResolved).length,
      totalResolved: filtered.filter((f) => f.isResolved).length,
    };
  },

  /**
   * Yerel önbelleğe kayıt ekler veya var olanı günceller.
   */
  async updateLocalCache(entry: {
    questionId: string;
    unitId: string;
    selectedOption: OptionId;
    correctOption: OptionId;
    userId: string;
    isResolved: boolean;
    lastAttemptAt: string;
  }): Promise<void> {
    try {
      const cache = await this.getLocalCache();
      const existingIndex = cache.findIndex(
        (c) => c.questionId === entry.questionId && c.userId === entry.userId
      );

      if (existingIndex >= 0) {
        cache[existingIndex] = {
          ...cache[existingIndex],
          selectedOption: entry.selectedOption,
          wrongCount: (cache[existingIndex].wrongCount || 1) + 1,
          isResolved: false,
          lastAttemptAt: entry.lastAttemptAt,
        };
      } else {
        cache.push({
          id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          userId: entry.userId,
          questionId: entry.questionId,
          unitId: entry.unitId,
          selectedOption: entry.selectedOption,
          correctOption: entry.correctOption,
          wrongCount: 1,
          isResolved: false,
          lastAttemptAt: entry.lastAttemptAt,
          createdAt: entry.lastAttemptAt,
        });
      }

      await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cache));
    } catch (e) {
      console.warn('Local cache yazma hatası:', e);
    }
  },

  /**
   * Yerel önbelleği okur.
   */
  async getLocalCache(): Promise<ErrorPoolEntry[]> {
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      return [];
    }
    try {
      const raw = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },
};

export default errorPoolService;
