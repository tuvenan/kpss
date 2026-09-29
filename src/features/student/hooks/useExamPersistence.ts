import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MockExamType,
  MOCK_EXAM_CONFIGS,
  recordDenemeMistakesToMistakesBank,
} from '../../../services/mockExamService';
import { examSessionService, ActiveExamSession } from '../../../services/examSessionService';
import { Question, UserAnswer } from '../../../types';

export interface UseExamPersistenceProps {
  isDenemeMode: boolean;
  isCompleted: boolean;
  questions: Question[];
  userAnswers: Record<string, UserAnswer>;
  currentIndex: number;
  startTime: number;
  timeRemainingSeconds: number;
  denemeTotalElapsedSeconds: number;
  denemeDurationMinutes: number;
}

export const useExamPersistence = ({
  isDenemeMode,
  isCompleted,
  questions,
  userAnswers,
  currentIndex,
  startTime,
  timeRemainingSeconds,
  denemeTotalElapsedSeconds,
  denemeDurationMinutes,
}: UseExamPersistenceProps) => {
  const [activeExamAttemptId, setActiveExamAttemptId] = useState<string | null>(() => {
    const s = examSessionService.getActiveSession();
    return s ? s.examAttemptId : null;
  });

  const [recoveredSession, setRecoveredSession] = useState<ActiveExamSession | null>(() => {
    return examSessionService.getActiveSession();
  });

  const [selectedExamType, setSelectedExamType] = useState<MockExamType>('quick_20');
  const [showDenemeSetupModal, setShowDenemeSetupModal] = useState<boolean>(false);

  // Idempotency: Sınavın yalnızca bir kez tamamlanıp kapatılmasını garanti eder
  const completedAttemptsRef = useRef<Set<string>>(new Set());

  // Canlı referanslar (setInterval ve beforeunload için en güncel state'i yakalar)
  const stateRef = useRef({
    isDenemeMode,
    activeExamAttemptId,
    isCompleted,
    selectedExamType,
    denemeDurationMinutes,
    timeRemainingSeconds,
    denemeTotalElapsedSeconds,
    currentIndex,
    questions,
    userAnswers,
    startTime,
  });

  useEffect(() => {
    stateRef.current = {
      isDenemeMode,
      activeExamAttemptId,
      isCompleted,
      selectedExamType,
      denemeDurationMinutes,
      timeRemainingSeconds,
      denemeTotalElapsedSeconds,
      currentIndex,
      questions,
      userAnswers,
      startTime,
    };
  }, [
    isDenemeMode,
    activeExamAttemptId,
    isCompleted,
    selectedExamType,
    denemeDurationMinutes,
    timeRemainingSeconds,
    denemeTotalElapsedSeconds,
    currentIndex,
    questions,
    userAnswers,
    startTime,
  ]);

  /**
   * Aktif sınav oturumunu anında kaydeder.
   */
  const saveSessionNow = useCallback(
    (overrides?: Partial<ActiveExamSession>) => {
      const s = stateRef.current;
      if (!s.isDenemeMode || !s.activeExamAttemptId || s.isCompleted || s.questions.length === 0) {
        return;
      }

      examSessionService.saveActiveSession({
        examAttemptId: s.activeExamAttemptId,
        templateCode: s.selectedExamType,
        templateName: MOCK_EXAM_CONFIGS[s.selectedExamType]?.title || 'KPSS Deneme Sınavı',
        durationMinutes: s.denemeDurationMinutes,
        timeRemainingSeconds: s.timeRemainingSeconds,
        totalElapsedSeconds: s.denemeTotalElapsedSeconds,
        currentIndex: s.currentIndex,
        questions: s.questions,
        userAnswers: s.userAnswers,
        startedAt: new Date(s.startTime).toISOString(),
        lastActiveAt: new Date().toISOString(),
        status: 'in_progress',
        ...overrides,
      });
    },
    []
  );

  /**
   * Periyodik (5 sn) ve sayfa kapanmadan önce (beforeunload) canlı oturumu kaydetme effect'i
   */
  useEffect(() => {
    if (!isDenemeMode || !activeExamAttemptId || isCompleted) return;

    const handleSave = () => {
      saveSessionNow();
    };

    const interval = setInterval(handleSave, 5000);
    window.addEventListener('beforeunload', handleSave);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleSave);
    };
  }, [isDenemeMode, activeExamAttemptId, isCompleted, saveSessionNow]);

  /**
   * Sınavı başarıyla/zaman aşımıyla idempotent şekilde tamamlar ve sonuçları kaydeder.
   */
  const completeExamSession = useCallback(
    (qList?: Question[], answers?: Record<string, UserAnswer>) => {
      const s = stateRef.current;
      const attemptId = s.activeExamAttemptId;

      if (!s.isDenemeMode || !attemptId) return;

      // Zaten tamamlanmışsa tekrar çalıştırma (idempotency guard)
      if (completedAttemptsRef.current.has(attemptId)) {
        return;
      }
      completedAttemptsRef.current.add(attemptId);

      const targetQuestions = qList && qList.length > 0 ? qList : s.questions;
      const targetAnswers = answers || s.userAnswers;

      if (targetQuestions.length > 0) {
        // 1. Yanlış çözülen soruları Yanlışlar Bankası'na ekle
        recordDenemeMistakesToMistakesBank(targetQuestions, targetAnswers);

        // 2. Net puan ve doğru/yanlış sayılarını hesapla
        let correctCount = 0;
        let wrongCount = 0;
        Object.values(targetAnswers).forEach((a) => {
          if (a.isCorrect) correctCount++;
          else wrongCount++;
        });
        const netScore = Math.max(0, +(correctCount - wrongCount / 4).toFixed(2));

        // 3. Aktif oturumu 'completed' durumuna getir
        const activeSession = examSessionService.getActiveSession();
        if (activeSession) {
          examSessionService.completeActiveSession(activeSession, {
            netScore,
            correctCount,
            wrongCount,
          });
        }
      }
    },
    []
  );

  /**
   * Kurtarılabilir oturumu kullanıcı istemezse iptal edip hafızadan siler.
   */
  const handleDiscardRecoveredSession = useCallback(() => {
    if (recoveredSession) {
      examSessionService.abandonActiveSession(recoveredSession);
    }
    setRecoveredSession(null);
  }, [recoveredSession]);

  return {
    activeExamAttemptId,
    setActiveExamAttemptId,
    recoveredSession,
    setRecoveredSession,
    selectedExamType,
    setSelectedExamType,
    showDenemeSetupModal,
    setShowDenemeSetupModal,
    saveSessionNow,
    completeExamSession,
    handleDiscardRecoveredSession,
  };
};
