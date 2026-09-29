import { useState, useEffect } from 'react';
import {
  MockExamType,
  MOCK_EXAM_CONFIGS,
  recordDenemeMistakesToMistakesBank,
} from '../../../services/mockExamService';
import { examSessionService, ActiveExamSession } from '../../../services/examSessionService';
import { Question, UserAnswer } from '../../../types';

export const useExamTimer = (
  viewState: string,
  isCompleted: boolean,
  setIsCompleted: (val: boolean) => void,
  questions: Question[],
  userAnswers: Record<string, UserAnswer>,
  currentIndex: number,
  startTime: number
) => {
  const [isDenemeMode, setIsDenemeMode] = useState<boolean>(false);
  const [showDenemeSetupModal, setShowDenemeSetupModal] = useState<boolean>(false);
  const [denemeDurationMinutes, setDenemeDurationMinutes] = useState<number>(25);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(25 * 60);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);
  const [denemeTotalElapsedSeconds, setDenemeTotalElapsedSeconds] = useState<number>(0);
  const [selectedExamType, setSelectedExamType] = useState<MockExamType>('quick_20');

  const [activeExamAttemptId, setActiveExamAttemptId] = useState<string | null>(() => {
    const s = examSessionService.getActiveSession();
    return s ? s.examAttemptId : null;
  });
  const [recoveredSession, setRecoveredSession] = useState<ActiveExamSession | null>(() =>
    examSessionService.getActiveSession()
  );

  // Timer interval effect
  useEffect(() => {
    let interval: any = null;
    if (isDenemeMode && (viewState === 'quiz' || viewState === 'feedback') && !isCompleted && !isTimerPaused) {
      interval = setInterval(() => {
        setDenemeTotalElapsedSeconds((prev) => prev + 1);
        setTimeRemainingSeconds((prev) => {
          if (denemeDurationMinutes > 0) {
            if (prev <= 1) {
              clearInterval(interval);
              setIsCompleted(true);
              return 0;
            }
            return prev - 1;
          } else {
            return prev + 1;
          }
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isDenemeMode, viewState, isCompleted, isTimerPaused, denemeDurationMinutes, setIsCompleted]);

  // Deneme Modu tamamlandığında yanlışları kaydetme ve oturumu kapatma
  useEffect(() => {
    if (isCompleted && isDenemeMode && questions.length > 0) {
      recordDenemeMistakesToMistakesBank(questions, userAnswers);

      const activeSession = examSessionService.getActiveSession();
      if (activeSession) {
        let correctCount = 0;
        let wrongCount = 0;
        Object.values(userAnswers).forEach((a) => {
          if (a.isCorrect) correctCount++;
          else wrongCount++;
        });
        const netScore = Math.max(0, +(correctCount - wrongCount / 4).toFixed(2));
        examSessionService.completeActiveSession(activeSession, {
          netScore,
          correctCount,
          wrongCount,
        });
      }
    }
  }, [isCompleted, isDenemeMode, questions, userAnswers]);

  // Sınav Oturumu Kurtarma - Canlı oturumu periyodik ve sayfa kapanırken kaydet
  useEffect(() => {
    if (!isDenemeMode || !activeExamAttemptId || isCompleted) return;

    const saveSession = () => {
      examSessionService.saveActiveSession({
        examAttemptId: activeExamAttemptId,
        templateCode: selectedExamType,
        templateName: MOCK_EXAM_CONFIGS[selectedExamType]?.title || 'KPSS Deneme Sınavı',
        durationMinutes: denemeDurationMinutes,
        timeRemainingSeconds,
        totalElapsedSeconds: denemeTotalElapsedSeconds,
        currentIndex,
        questions,
        userAnswers,
        startedAt: new Date(startTime).toISOString(),
        lastActiveAt: new Date().toISOString(),
        status: 'in_progress',
      });
    };

    const interval = setInterval(saveSession, 5000);
    window.addEventListener('beforeunload', saveSession);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', saveSession);
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

  const handleDiscardSession = () => {
    if (recoveredSession) {
      examSessionService.abandonActiveSession(recoveredSession);
    }
    setRecoveredSession(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return {
    isDenemeMode,
    setIsDenemeMode,
    showDenemeSetupModal,
    setShowDenemeSetupModal,
    denemeDurationMinutes,
    setDenemeDurationMinutes,
    timeRemainingSeconds,
    setTimeRemainingSeconds,
    isTimerPaused,
    setIsTimerPaused,
    denemeTotalElapsedSeconds,
    setDenemeTotalElapsedSeconds,
    selectedExamType,
    setSelectedExamType,
    activeExamAttemptId,
    setActiveExamAttemptId,
    recoveredSession,
    setRecoveredSession,
    handleDiscardSession,
    formatTime,
  };
};
