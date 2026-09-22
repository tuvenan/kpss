import { supabase, isSupabaseConfigured, getAdminClient, hasAdminSecretKey } from './supabase';
import { Question, UserAnswer } from '../types';
import { MockExamType } from './mockExamService';

const ACTIVE_EXAM_SESSION_KEY = 'kpss_active_exam_session_v1';

export interface ExamTemplateConfig {
  id?: string;
  name: string;
  code: MockExamType;
  total_questions: number;
  duration_minutes: number;
  is_active: boolean;
  distribution: {
    turkce: number;
    matematik: number;
    tarih: number;
    cografya: number;
    vatandaslik: number;
    guncel: number;
  };
}

export interface ActiveExamSession {
  examAttemptId: string;
  templateCode: MockExamType;
  templateName: string;
  durationMinutes: number;
  timeRemainingSeconds: number;
  totalElapsedSeconds: number;
  currentIndex: number;
  questions: Question[];
  userAnswers: Record<string, UserAnswer>;
  startedAt: string;
  lastActiveAt: string;
  status: 'in_progress' | 'completed' | 'abandoned';
}

export const DEFAULT_EXAM_TEMPLATES: ExamTemplateConfig[] = [
  {
    name: 'KPSS Genel Yetenek - Genel Kültür (Tam ÖSYM Formatı)',
    code: 'gy_gk_full_120',
    total_questions: 120,
    duration_minutes: 130,
    is_active: true,
    distribution: {
      turkce: 30,
      matematik: 30,
      tarih: 27,
      cografya: 18,
      vatandaslik: 9,
      guncel: 6,
    },
  },
  {
    name: 'Genel Yetenek Branş Denemesi (Türkçe & Matematik)',
    code: 'gy_branch_60',
    total_questions: 60,
    duration_minutes: 65,
    is_active: true,
    distribution: {
      turkce: 30,
      matematik: 30,
      tarih: 0,
      cografya: 0,
      vatandaslik: 0,
      guncel: 0,
    },
  },
  {
    name: 'Genel Kültür Branş Denemesi (Tarih, Coğrafya, Vatandaşlık, Güncel)',
    code: 'gk_branch_60',
    total_questions: 60,
    duration_minutes: 65,
    is_active: true,
    distribution: {
      turkce: 0,
      matematik: 0,
      tarih: 27,
      cografya: 18,
      vatandaslik: 9,
      guncel: 6,
    },
  },
  {
    name: '20 Soruluk Hızlı KPSS Denemesi',
    code: 'quick_20',
    total_questions: 20,
    duration_minutes: 25,
    is_active: true,
    distribution: {
      turkce: 5,
      matematik: 5,
      tarih: 4,
      cografya: 3,
      vatandaslik: 2,
      guncel: 1,
    },
  },
];

class ExamSessionService {
  /**
   * Supabase üzerindeki aktif sınav şablonlarını çeker veya varsayılan ÖSYM şablonlarını döner.
   */
  public async getExamTemplates(): Promise<ExamTemplateConfig[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('exam_templates')
          .select('id, name, code, total_questions, is_active')
          .eq('is_active', true);

        if (!error && data && data.length > 0) {
          return data.map((t: any) => {
            const def = DEFAULT_EXAM_TEMPLATES.find((d) => d.code === t.code) || DEFAULT_EXAM_TEMPLATES[0];
            return {
              id: t.id,
              name: t.name || def.name,
              code: (t.code as MockExamType) || def.code,
              total_questions: t.total_questions || def.total_questions,
              duration_minutes: def.duration_minutes,
              is_active: t.is_active ?? true,
              distribution: def.distribution,
            };
          });
        }
      } catch (e) {
        console.warn('getExamTemplates error, falling back to default templates:', e);
      }
    }
    return DEFAULT_EXAM_TEMPLATES;
  }

  /**
   * Aktif sınav oturumunu anında yerel hafızaya kaydeder ve çevrimiçiyse Supabase exam_attempts'i günceller.
   */
  public saveActiveSession(session: ActiveExamSession): void {
    if (typeof window === 'undefined') return;

    session.lastActiveAt = new Date().toISOString();
    try {
      localStorage.setItem(ACTIVE_EXAM_SESSION_KEY, JSON.stringify(session));
      window.dispatchEvent(new CustomEvent('kpss_exam_session_updated', { detail: { session } }));
    } catch (e) {
      console.warn('saveActiveSession localStorage error:', e);
    }

    // Supabase exam_attempts senkronizasyonu
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (isOnline && isSupabaseConfigured()) {
      (async () => {
        try {
          const { data: authData } = await supabase.auth.getSession();
          const userId = authData?.session?.user?.id;
          if (userId) {
            const client = hasAdminSecretKey() ? getAdminClient() : supabase;
            await client.from('exam_attempts').upsert({
              id: session.examAttemptId,
              user_id: userId,
              template_id: session.templateCode,
              status: session.status,
              started_at: session.startedAt,
              current_question_index: session.currentIndex,
              remaining_seconds: session.timeRemainingSeconds,
            }, { onConflict: 'id' });
          }
        } catch (err) {
          console.warn('saveActiveSession cloud sync error:', err);
        }
      })();
    }
  }

  /**
   * Sayfa yenilendiğinde veya tarayıcı açıldığında kurtarılabilir aktif sınav oturumunu döner.
   */
  public getActiveSession(): ActiveExamSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(ACTIVE_EXAM_SESSION_KEY);
      if (!raw) return null;

      const session: ActiveExamSession = JSON.parse(raw);
      if (session && session.status === 'in_progress' && session.questions && session.questions.length > 0) {
        return session;
      }
    } catch (e) {
      console.warn('getActiveSession error:', e);
    }
    return null;
  }

  /**
   * Sınav başarıyla bittiğinde oturumu 'completed' olarak kapatır ve Supabase'e net puanını yazar.
   */
  public async completeActiveSession(
    session: ActiveExamSession,
    results: { netScore: number; correctCount: number; wrongCount: number }
  ): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(ACTIVE_EXAM_SESSION_KEY);
      window.dispatchEvent(new CustomEvent('kpss_exam_session_cleared'));
    } catch {}

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (isOnline && isSupabaseConfigured()) {
      try {
        const { data: authData } = await supabase.auth.getSession();
        const userId = authData?.session?.user?.id;
        if (userId) {
          const client = hasAdminSecretKey() ? getAdminClient() : supabase;
          await client.from('exam_attempts').upsert({
            id: session.examAttemptId,
            user_id: userId,
            template_id: session.templateCode,
            status: 'completed',
            started_at: session.startedAt,
            completed_at: new Date().toISOString(),
            current_question_index: session.questions.length - 1,
            remaining_seconds: session.timeRemainingSeconds,
            net_score: results.netScore,
            correct_count: results.correctCount,
            wrong_count: results.wrongCount,
          }, { onConflict: 'id' });
        }
      } catch (err) {
        console.warn('completeActiveSession error:', err);
      }
    }
  }

  /**
   * Kullanıcı sınavdan kendi isteğiyle ayrıldığında veya iptal ettiğinde oturumu sonlandırır.
   */
  public async abandonActiveSession(session?: ActiveExamSession | null): Promise<void> {
    if (typeof window === 'undefined') return;

    const current = session || this.getActiveSession();

    try {
      localStorage.removeItem(ACTIVE_EXAM_SESSION_KEY);
      window.dispatchEvent(new CustomEvent('kpss_exam_session_cleared'));
    } catch {}

    if (current && isSupabaseConfigured()) {
      try {
        const { data: authData } = await supabase.auth.getSession();
        const userId = authData?.session?.user?.id;
        if (userId) {
          const client = hasAdminSecretKey() ? getAdminClient() : supabase;
          await client.from('exam_attempts').upsert({
            id: current.examAttemptId,
            user_id: userId,
            template_id: current.templateCode,
            status: 'abandoned',
            started_at: current.startedAt,
            completed_at: new Date().toISOString(),
            remaining_seconds: current.timeRemainingSeconds,
          }, { onConflict: 'id' });
        }
      } catch (err) {
        console.warn('abandonActiveSession error:', err);
      }
    }
  }
}

export const examSessionService = new ExamSessionService();
