/**
 * KPSS Minimalist Soru Bankası - Veri Tipleri
 */

export type OptionId = 'A' | 'B' | 'C' | 'D' | 'E';

export interface QuestionOption {
  id: OptionId;
  text: string;
}

/**
 * Ders Modeli (Örn: Tarih, Coğrafya, Vatandaşlık)
 */
export interface Subject {
  id: string;
  title: string;
  iconName: string;
  totalUnits: number;
}

/**
 * Ünite Modeli (Örn: İslamiyet Öncesi Türk Tarihi)
 */
export interface Unit {
  id: string;
  subjectId: string;
  title: string;
  unitNumber: number;
  topicCount?: number;
  isLocked: boolean;
  isCompleted: boolean;
}

/**
 * Konu Modeli (Örn: Orta Asya Kültür Merkezleri)
 */
export interface Topic {
  id: string;
  unitId: string;
  subjectId?: string;
  title: string;
  topicNumber: number;
  questionCount?: number;
  isLocked?: boolean;
  isCompleted?: boolean;
}

/**
 * Soru Modeli
 * 1-20 arası sıralı, A-E şıkları ve detaylı çözüm metni
 */
export interface Question {
  id: string;
  topicId?: string;
  unitId?: string;
  questionNumber: number; // 1-20
  questionText: string;
  options: QuestionOption[];
  correctOption: OptionId;
  explanation: string; // Detaylı MEB/ÖSYM tarzı çözüm metni
}

/**
 * Kullanıcı Yanıtı Modeli
 */
export interface UserAnswer {
  questionId: string;
  selectedOption: OptionId;
  isCorrect: boolean;
  timeSpentSeconds: number;
}

/**
 * Ünite Tamamlama / Sonuç Modeli
 */
export interface UnitResult {
  unitId: string;
  totalQuestions: number; // 20 soru standardı
  correctCount: number;
  wrongCount: number;
  emptyCount: number;
  totalTimeSeconds: number;
}

/**
 * Supabase 'error_pool' Tablo Modeli
 * Yanlış yapılan soruların takibi ve tekrar çözülmesi için
 */
export interface ErrorPoolEntry {
  id?: string;
  userId?: string;
  questionId: string;
  unitId: string;
  selectedOption: OptionId;
  correctOption: OptionId;
  wrongCount: number;
  isResolved: boolean;
  lastAttemptAt?: string;
  createdAt?: string;
}

