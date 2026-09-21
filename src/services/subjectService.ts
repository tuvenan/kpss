import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase, isSupabaseConfigured } from './supabase';
import { Subject, Unit, Topic } from '@/types';
import { MOCK_SUBJECTS, MOCK_UNITS, MOCK_TOPICS } from '@/data/mockQuestions';

const USER_PROGRESS_KEY = '@kpss_unit_progress_map';

export interface UserUnitProgress {
  unitId: string;
  isCompleted: boolean;
  completedAt?: string;
}

export const subjectService = {
  /**
   * Supabase 'subjects' tablosundan tüm dersleri çeker.
   * Bağlantı yoksa veya tablo boşsa yerel MOCK_SUBJECTS döner.
   */
  async getSubjects(): Promise<Subject[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('subjects')
          .select('*')
          .order('title');

        if (!error && data && data.length > 0) {
          return data.map((row: any) => ({
            id: row.id,
            title: row.title,
            iconName: row.icon_name || 'book-outline',
            totalUnits: row.total_units || 10,
          }));
        }
      } catch (err) {
        console.warn('Supabase subjects sorgu hatası, yerel veriye dönülüyor:', err);
      }
    }

    return MOCK_SUBJECTS;
  },

  /**
   * Belirtilen derse ait üniteleri Supabase'den çeker ve
   * kullanıcının tamamlanma/kilit durumlarıyla (Progress) birleştirir:
   * - Tamamlanan ünite: isCompleted = true, isLocked = false (Yeşil Tikli)
   * - Sonraki ünite: isCompleted = false, isLocked = false (Açık / Başla)
   * - Diğerleri: isLocked = true (Kilitli)
   */
  async getUnitsBySubject(subjectId: string): Promise<Unit[]> {
    let baseUnits: Unit[] = [];

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('units')
          .select('*')
          .eq('subject_id', subjectId)
          .order('unit_number', { ascending: true });

        if (!error && data && data.length > 0) {
          baseUnits = data.map((row: any) => ({
            id: row.id,
            subjectId: row.subject_id,
            title: row.title,
            unitNumber: row.unit_number,
            isLocked: row.is_locked ?? true,
            isCompleted: row.is_completed ?? false,
          }));
        }
      } catch (err) {
        console.warn('Supabase units sorgu hatası, yerel üniteler kullanılıyor:', err);
      }
    }

    if (baseUnits.length === 0) {
      baseUnits = MOCK_UNITS.filter((u) => u.subjectId === subjectId);
    }

    // Kullanıcının kayıtlı ilerlemesini al ve kilit/tamamlanma durumlarını hesapla
    const progressMap = await this.getUserProgressMap();
    return this.calculateUnitLockStates(baseUnits, progressMap);
  },

  /**
   * Bir ünite tamamlandığında durumu kaydeder ve bir sonraki ünitenin kilidini açar.
   */
  async markUnitCompleted(unitId: string, subjectId: string): Promise<Unit[]> {
    const progressMap = await this.getUserProgressMap();
    progressMap[unitId] = {
      unitId,
      isCompleted: true,
      completedAt: new Date().toISOString(),
    };

    // 1. Yerel AsyncStorage'a kaydet
    await AsyncStorage.setItem(USER_PROGRESS_KEY, JSON.stringify(progressMap));

    // 2. Supabase yapılandırılmışsa sunucuya kaydet
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('user_unit_progress').upsert({
          user_id: 'anonymous_user',
          unit_id: unitId,
          is_completed: true,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Supabase user_unit_progress yazma hatası:', err);
      }
    }

    // Güncel ünite listesini yeniden hesapla ve dön
    return this.getUnitsBySubject(subjectId);
  },

  /**
   * Kullanıcının tamamlanmış ünite haritasını getirir.
   */
  async getUserProgressMap(): Promise<Record<string, UserUnitProgress>> {
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      return {};
    }
    try {
      const raw = await AsyncStorage.getItem(USER_PROGRESS_KEY);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch {
      return {};
    }
  },

  /**
   * Katı iş kuralı:
   * 1. Tamamlanan üniteler: isCompleted = true, isLocked = false
   * 2. Henüz tamamlanmamış İLK ünite: isCompleted = false, isLocked = false (Açık)
   * 3. Diğer tüm sonraki üniteler: isCompleted = false, isLocked = true (Kilitli)
   */
  calculateUnitLockStates(
    units: Unit[],
    progressMap: Record<string, UserUnitProgress>
  ): Unit[] {
    const sorted = [...units].sort((a, b) => a.unitNumber - b.unitNumber);
    let foundFirstIncomplete = false;

    return sorted.map((unit, index) => {
      const isCompleted = Boolean(progressMap[unit.id]?.isCompleted);

      if (isCompleted) {
        return {
          ...unit,
          isCompleted: true,
          isLocked: false,
        };
      }

      // İlk tamamlanmamış üniteye denk geldik -> Açık (Unlocked)
      if (!foundFirstIncomplete) {
        foundFirstIncomplete = true;
        return {
          ...unit,
          isCompleted: false,
          isLocked: false, // Açık!
        };
      }

      // Daha sonraki tüm üniteler kilitli
      return {
        ...unit,
        isCompleted: false,
        isLocked: true, // Kilitli!
      };
    });
  },

  /**
   * Belirtilen üniteye ait konuları getirir.
   */
  async getTopicsByUnit(unitId: string): Promise<Topic[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('topics')
          .select('*')
          .eq('unit_id', unitId)
          .order('topic_number', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            unitId: d.unit_id,
            subjectId: d.subject_id,
            title: d.title,
            topicNumber: d.topic_number,
            questionCount: 20,
            isLocked: d.is_locked ?? false,
            isCompleted: d.is_completed ?? false,
          }));
        }
      } catch (err) {
        console.warn('Supabase topics sorgu hatası, yerel verilere dönülüyor:', err);
      }
    }

    const filtered = MOCK_TOPICS.filter((t) => t.unitId === unitId);
    if (filtered.length > 0) {
      return filtered;
    }

    return [
      {
        id: `${unitId}-t1`,
        unitId,
        title: '1. Konu Testi',
        topicNumber: 1,
        questionCount: 20,
        isLocked: false,
        isCompleted: false,
      },
      {
        id: `${unitId}-t2`,
        unitId,
        title: '2. Konu Testi',
        topicNumber: 2,
        questionCount: 20,
        isLocked: false,
        isCompleted: false,
      },
    ];
  },
};

export default subjectService;
