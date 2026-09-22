import { Question } from '../types';
import { getMistakesBankQuestions } from './mockExamService';

export interface SpacedCard {
  questionId: string;
  boxLevel: number; // 1 to 5
  lastReviewedAt: string;
  nextReviewDate: string; // YYYY-MM-DD
  correctStreak: number;
  totalReviews: number;
}

const SP_STORAGE_KEY = 'kpss_spaced_repetition_cards_v1';

// Leitner gün aralıkları
const BOX_INTERVALS_DAYS = [1, 3, 7, 14, 30];

class SpacedRepetitionService {
  private cards: Record<string, SpacedCard> = this.loadCards();

  private loadCards(): Record<string, SpacedCard> {
    if (typeof window === 'undefined') return {};
    try {
      const stored = localStorage.getItem(SP_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('loadCards error in spacedRepetitionService:', e);
    }
    return {};
  }

  private saveCards(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SP_STORAGE_KEY, JSON.stringify(this.cards));
      window.dispatchEvent(new CustomEvent('kpss_spaced_repetition_updated'));
    } catch (e) {
      console.warn('saveCards error in spacedRepetitionService:', e);
    }
  }

  private getTodayStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  private addDaysToToday(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  /** Bir soruyu aralıklı tekrar havuzuna ekler veya mevcut durumunu döner */
  public registerQuestion(questionId: string): SpacedCard {
    if (!this.cards[questionId]) {
      this.cards[questionId] = {
        questionId,
        boxLevel: 1,
        lastReviewedAt: new Date().toISOString(),
        nextReviewDate: this.getTodayStr(), // İlk gün hemen çözülebilir
        correctStreak: 0,
        totalReviews: 0,
      };
      this.saveCards();
    }
    return this.cards[questionId];
  }

  /** Tekrar sonucunu kaydet (Doğru ise kutu atlar, yanlış ise 1. kutuya geri döner) */
  public recordReviewResult(questionId: string, isCorrect: boolean): SpacedCard {
    const card = this.registerQuestion(questionId);

    if (isCorrect) {
      const nextBox = Math.min(5, card.boxLevel + 1);
      const intervalDays = BOX_INTERVALS_DAYS[nextBox - 1] || 1;

      card.boxLevel = nextBox;
      card.correctStreak += 1;
      card.nextReviewDate = this.addDaysToToday(intervalDays);
    } else {
      // Yanlış cevaplandıysa 1. kutuya döner (yarın tekrar çözülecek)
      card.boxLevel = 1;
      card.correctStreak = 0;
      card.nextReviewDate = this.addDaysToToday(1);
    }

    card.lastReviewedAt = new Date().toISOString();
    card.totalReviews += 1;

    this.saveCards();
    return card;
  }

  /** Bugün tekrar edilmesi gereken soruları döner */
  public getDueQuestions(): Question[] {
    const allMistakes = getMistakesBankQuestions();
    const today = this.getTodayStr();

    return allMistakes.filter((q) => {
      const card = this.cards[q.id];
      if (!card) return true; // Henüz kartı yoksa bugün çözülebilir
      return card.nextReviewDate <= today;
    });
  }

  /** Kutu bazlı istatistikleri döner */
  public getBoxStats(): { box: number; count: number; intervalText: string }[] {
    const allMistakes = getMistakesBankQuestions();
    const counts = [0, 0, 0, 0, 0];

    for (const q of allMistakes) {
      const card = this.cards[q.id];
      const box = card ? card.boxLevel : 1;
      counts[box - 1] = (counts[box - 1] || 0) + 1;
    }

    return [
      { box: 1, count: counts[0], intervalText: '1 Gün' },
      { box: 2, count: counts[1], intervalText: '3 Gün' },
      { box: 3, count: counts[2], intervalText: '7 Gün' },
      { box: 4, count: counts[3], intervalText: '14 Gün' },
      { box: 5, count: counts[4], intervalText: '30 Gün (Kalıcı)' },
    ];
  }

  public getSummaryStats(): {
    boxes: { box: number; count: number; intervalText: string }[];
    dueTodayCount: number;
    totalCards: number;
  } {
    const boxes = this.getBoxStats();
    const dueTodayCount = this.getDueQuestions().length;
    const totalCards = Object.keys(this.cards).length;
    return {
      boxes,
      dueTodayCount,
      totalCards,
    };
  }

  public getCardForQuestion(questionId: string): SpacedCard | undefined {
    return this.cards[questionId];
  }
}

export const spacedRepetitionService = new SpacedRepetitionService();
