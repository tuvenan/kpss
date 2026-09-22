import { supabase, isSupabaseConfigured, getAdminClient, hasAdminSecretKey } from './supabase';
import { QuestionAttempt, DbSpacedRepetitionCard, OptionId } from '../types';
import { spacedRepetitionService } from './spacedRepetitionService';

const ATTEMPTS_QUEUE_KEY = 'kpss_offline_attempts_queue_v1';
const CARDS_QUEUE_KEY = 'kpss_offline_cards_queue_v1';
const LOCAL_ATTEMPTS_HISTORY_KEY = 'kpss_local_attempts_history_v1';

export const isUuid = (val?: string): boolean => {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
};

export const toValidUuid = (val?: string): string => {
  if (!val) return '00000000-0000-4000-8000-000000000000';
  if (isUuid(val)) return val;

  // UUID formatında olmayan stringler için (örn: '1', 'turkce-soru-1') deterministik hash ile geçerli UUID üret
  let hash = 0;
  for (let i = 0; i < val.length; i++) {
    hash = (hash << 5) - hash + val.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(12, '0').slice(0, 12);
  return `00000000-0000-4000-8000-${hex}`;
};

export const generateClientEventId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export interface RecordAttemptParams {
  questionId: string;
  selectedOption: OptionId;
  isCorrect: boolean;
  timeSpentSeconds?: number;
  examAttemptId?: string | null;
}

export interface OfflineSyncResult {
  attempt: QuestionAttempt;
  isStoredLocally: boolean;
  isSyncedToCloud: boolean;
  syncError?: string;
}

class OfflineSyncService {
  private isSyncing = false;

  constructor() {
    this.initAutoSync();
  }

  private initAutoSync(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      console.log('🌐 İnternet bağlantısı sağlandı. Çevrimdışı kuyruk senkronize ediliyor...');
      this.syncPendingData();
    });

    window.addEventListener('kpss_auth_changed', () => {
      this.syncPendingData();
    });

    // Periyodik kontrol (bağlantı aktif ve kuyrukta veri varsa 60 saniyede bir senkronize et)
    setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        const stats = this.getPendingStats();
        if (stats.total > 0 && !this.isSyncing) {
          this.syncPendingData();
        }
      }
    }, 60000);
  }

  // ==========================================
  // LOKAL KUYRUK İŞLEMLERİ (LOCAL STORAGE)
  // ==========================================

  public getAttemptsQueue(): QuestionAttempt[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(ATTEMPTS_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveAttemptsQueue(queue: QuestionAttempt[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(ATTEMPTS_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.warn('saveAttemptsQueue error:', e);
    }
  }

  public getCardsQueue(): DbSpacedRepetitionCard[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(CARDS_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveCardsQueue(queue: DbSpacedRepetitionCard[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CARDS_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.warn('saveCardsQueue error:', e);
    }
  }

  public getLocalAttemptsHistory(): QuestionAttempt[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(LOCAL_ATTEMPTS_HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private appendLocalAttemptHistory(attempt: QuestionAttempt): void {
    if (typeof window === 'undefined') return;
    try {
      const history = this.getLocalAttemptsHistory();
      // En son 500 çözümü hafızada tut
      history.push(attempt);
      if (history.length > 500) {
        history.shift();
      }
      localStorage.setItem(LOCAL_ATTEMPTS_HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn('appendLocalAttemptHistory error:', e);
    }
  }

  public getPendingStats(): { attempts: number; cards: number; total: number } {
    const attempts = this.getAttemptsQueue().length;
    const cards = this.getCardsQueue().length;
    return { attempts, cards, total: attempts + cards };
  }

  // ==========================================
  // SORU ÇÖZÜMÜ KAYDI (SUBMIT & OFFLINE QUEUE)
  // ==========================================

  /**
   * Kullanıcı bir soru çözdüğünde çağrılır:
   * 1. Benzersiz client_event_id üretir (İdempotency).
   * 2. Leitner algoritmasını günceller.
   * 3. Anında lokal depolamaya kaydeder (asla veri kaybı olmaz).
   * 4. İnternet ve oturum varsa Supabase'e yazar; yoksa kuyruğa ekler.
   */
  public async recordQuestionAttempt(params: RecordAttemptParams): Promise<OfflineSyncResult> {
    const clientEventId = generateClientEventId();
    const formattedQuestionId = toValidUuid(params.questionId);
    const answeredAt = new Date().toISOString();

    // 1. Leitner (Aralıklı Tekrar) kartını yerelde güncelle
    const updatedCard = spacedRepetitionService.recordReviewResult(params.questionId, params.isCorrect);

    // 2. Soru Çözüm Nesnesi
    const attempt: QuestionAttempt = {
      client_event_id: clientEventId,
      question_id: formattedQuestionId,
      selected_option: params.selectedOption,
      is_correct: params.isCorrect,
      time_spent_seconds: params.timeSpentSeconds || 5,
      answered_at: answeredAt,
      exam_attempt_id: params.examAttemptId ? toValidUuid(params.examAttemptId) : null,
    };

    // 3. Aralıklı Tekrar DB Kart Nesnesi
    const dbCard: DbSpacedRepetitionCard = {
      question_id: formattedQuestionId,
      box: updatedCard.boxLevel,
      consecutive_correct: updatedCard.correctStreak,
      review_count: updatedCard.totalReviews,
      last_reviewed_at: answeredAt,
      due_at: updatedCard.nextReviewDate ? new Date(updatedCard.nextReviewDate).toISOString() : answeredAt,
    };

    // 4. Anında Lokal Depolamaya Kaydet
    this.appendLocalAttemptHistory(attempt);

    // 5. Çevrimiçi Durumda Supabase'e Yazmayı Dene
    let isSyncedToCloud = false;
    let syncError: string | undefined;

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    if (isOnline && isSupabaseConfigured()) {
      try {
        const { data: authData } = await supabase.auth.getSession();
        const activeUserId = authData?.session?.user?.id;

        if (activeUserId) {
          attempt.user_id = activeUserId;
          dbCard.user_id = activeUserId;

          // question_attempts tablosuna idempotent ekleme
          const clientToUse = hasAdminSecretKey() ? getAdminClient() : supabase;
          const { error: attemptError } = await clientToUse
            .from('question_attempts')
            .upsert(attempt, { onConflict: 'client_event_id' });

          if (!attemptError) {
            isSyncedToCloud = true;
          } else {
            syncError = attemptError.message;
          }

          // spaced_repetition_cards tablosuna upsert
          const { error: cardError } = await clientToUse
            .from('spaced_repetition_cards')
            .upsert(dbCard, { onConflict: 'user_id,question_id' });

          if (cardError) {
            console.warn('spaced_repetition_cards upsert warning:', cardError.message);
          }
        } else {
          syncError = 'Kullanıcı oturumu aktif değil (Misafir modunda kuyruğa alındı)';
        }
      } catch (err: any) {
        syncError = err?.message || 'Ağ hatası';
      }
    } else {
      syncError = 'Çevrimdışı moddasınız (Kuyruğa alındı)';
    }

    // Buluta anında yazılamadıysa kuyruğa ekle
    if (!isSyncedToCloud) {
      const attemptsQueue = this.getAttemptsQueue();
      attemptsQueue.push(attempt);
      this.saveAttemptsQueue(attemptsQueue);

      const cardsQueue = this.getCardsQueue();
      // Aynı soru için kart kuyruğunda mükerrer olmaması için varsa güncelle
      const cardIdx = cardsQueue.findIndex((c) => c.question_id === dbCard.question_id);
      if (cardIdx >= 0) {
        cardsQueue[cardIdx] = dbCard;
      } else {
        cardsQueue.push(dbCard);
      }
      this.saveCardsQueue(cardsQueue);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('kpss_attempt_recorded', {
          detail: { attempt, isSyncedToCloud },
        })
      );
    }

    return {
      attempt,
      isStoredLocally: true,
      isSyncedToCloud,
      syncError,
    };
  }

  // ==========================================
  // BULUT SENKRONİZASYON MOTORU (FLUSH QUEUE)
  // ==========================================

  /**
   * Kuyruktaki tüm çözümleri ve aralıklı tekrar kartlarını Supabase'e aktarır
   */
  public async syncPendingData(): Promise<{
    syncedAttempts: number;
    syncedCards: number;
    pendingRemaining: number;
    errors: string[];
  }> {
    if (this.isSyncing) {
      return { syncedAttempts: 0, syncedCards: 0, pendingRemaining: this.getPendingStats().total, errors: [] };
    }

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (!isOnline || !isSupabaseConfigured()) {
      return {
        syncedAttempts: 0,
        syncedCards: 0,
        pendingRemaining: this.getPendingStats().total,
        errors: ['Çevrimdışı veya Supabase bağlantısı yapılandırılmamış'],
      };
    }

    this.isSyncing = true;
    const errors: string[] = [];
    let syncedAttempts = 0;
    let syncedCards = 0;

    try {
      const { data: authData } = await supabase.auth.getSession();
      const activeUserId = authData?.session?.user?.id;

      if (!activeUserId && !hasAdminSecretKey()) {
        // Kullanıcı giriş yapmadığı sürece RLS politikaları gereği kuyruk bekletilir
        this.isSyncing = false;
        return {
          syncedAttempts: 0,
          syncedCards: 0,
          pendingRemaining: this.getPendingStats().total,
          errors: ['Senkronizasyon için oturum açılması bekleniyor'],
        };
      }

      const clientToUse = hasAdminSecretKey() ? getAdminClient() : supabase;
      const targetUserId = activeUserId || '00000000-0000-0000-0000-000000000000';

      // 1. question_attempts Kuyruğunu Temizle
      const attemptsQueue = this.getAttemptsQueue();
      if (attemptsQueue.length > 0) {
        const remainingAttempts: QuestionAttempt[] = [];

        for (const item of attemptsQueue) {
          try {
            item.user_id = item.user_id || targetUserId;
            const { error } = await clientToUse
              .from('question_attempts')
              .upsert(item, { onConflict: 'client_event_id' });

            if (!error) {
              syncedAttempts++;
            } else {
              remainingAttempts.push(item);
              errors.push(`Attempt ${item.client_event_id}: ${error.message}`);
            }
          } catch (e: any) {
            remainingAttempts.push(item);
            errors.push(e?.message || 'Unknown attempt sync error');
          }
        }

        this.saveAttemptsQueue(remainingAttempts);
      }

      // 2. spaced_repetition_cards Kuyruğunu Temizle
      const cardsQueue = this.getCardsQueue();
      if (cardsQueue.length > 0) {
        const remainingCards: DbSpacedRepetitionCard[] = [];

        for (const card of cardsQueue) {
          try {
            card.user_id = card.user_id || targetUserId;
            const { error } = await clientToUse
              .from('spaced_repetition_cards')
              .upsert(card, { onConflict: 'user_id,question_id' });

            if (!error) {
              syncedCards++;
            } else {
              remainingCards.push(card);
              errors.push(`Card ${card.question_id}: ${error.message}`);
            }
          } catch (e: any) {
            remainingCards.push(card);
            errors.push(e?.message || 'Unknown card sync error');
          }
        }

        this.saveCardsQueue(remainingCards);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('kpss_sync_completed', {
            detail: { syncedAttempts, syncedCards, remaining: this.getPendingStats().total },
          })
        );
      }
    } catch (e: any) {
      errors.push(e?.message || 'Genel senkronizasyon hatası');
    } finally {
      this.isSyncing = false;
    }

    return {
      syncedAttempts,
      syncedCards,
      pendingRemaining: this.getPendingStats().total,
      errors,
    };
  }
}

export const offlineSyncService = new OfflineSyncService();
