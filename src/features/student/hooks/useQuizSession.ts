import { useState, useCallback, useRef } from 'react';
import { api } from '../../../services/api';
import { Question, OptionId, UserAnswer, UnitResult, Subject, Unit, Topic, QuestionBank } from '../../../types';
import { spacedRepetitionService } from '../../../services/spacedRepetitionService';
import { studentProgressService } from '../../../services/studentProgressService';
import {
  saveWrongQuestionToMistakesBank,
  removeQuestionFromMistakesBank,
  MISTAKES_BANK_ID,
} from '../../../services/mockExamService';
import { StudentViewState } from '../types';

export interface UseQuizSessionProps {
  isDenemeMode: boolean;
  activeExamAttemptId?: string | null;
  getActiveExamAttemptId?: () => string | null;
  selectedSubject: Subject | null;
  selectedUnit: Unit | null;
  selectedTopic: Topic | null;
  selectedBank: QuestionBank | null;
  setViewState: (vs: StudentViewState) => void;
  onRefreshLeitnerStats: () => void;
  onAnswerSaved?: (questionId: string, answer: UserAnswer, nextAnswers: Record<string, UserAnswer>) => void;
  onCompleteExam?: (questions: Question[], answers: Record<string, UserAnswer>) => void;
}

export const useQuizSession = ({
  isDenemeMode,
  activeExamAttemptId,
  getActiveExamAttemptId,
  selectedSubject,
  selectedUnit,
  selectedTopic,
  selectedBank,
  setViewState,
  onRefreshLeitnerStats,
  onAnswerSaved,
  onCompleteExam,
}: UseQuizSessionProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, UserAnswer>>({});
  const [stagedOption, setStagedOption] = useState<OptionId | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());

  // Idempotency: completeQuiz çağrısının tekrar tekrar tetiklenmesini önler
  const isCompletedRef = useRef(false);

  const currentQ = questions[currentIndex];
  const currentAns = currentQ ? userAnswers[currentQ.id] : undefined;
  const isAnswered = Boolean(currentAns);

  const handleOptionSelect = (optId: OptionId) => {
    if (isAnswered) return;
    setStagedOption(optId);
  };

  /**
   * Merkezi ve idempotent sınavı tamamlama fonksiyonu.
   * Zaman aşımı, son soruyu bitirme ve erken bitirme akışları bu fonksiyonu çağırır.
   */
  const completeQuiz = useCallback(
    (customQuestions?: Question[], customAnswers?: Record<string, UserAnswer>) => {
      if (isCompletedRef.current) return;
      isCompletedRef.current = true;
      setIsCompleted(true);

      const finalQuestions = customQuestions || questions;
      const finalAnswers = customAnswers || userAnswers;

      if (onCompleteExam) {
        onCompleteExam(finalQuestions, finalAnswers);
      }
    },
    [onCompleteExam, questions, userAnswers]
  );

  const resetCompletionStatus = useCallback(() => {
    isCompletedRef.current = false;
    setIsCompleted(false);
  }, []);

  const handleConfirmAnswer = () => {
    if (!stagedOption || isAnswered || !currentQ) return;
    const isCorrect = stagedOption === currentQ.correctOption;

    const answerObj: UserAnswer = {
      questionId: currentQ.id,
      selectedOption: stagedOption,
      isCorrect,
      timeSpentSeconds: 5,
    };

    const nextAnswers = {
      ...userAnswers,
      [currentQ.id]: answerObj,
    };

    setUserAnswers(nextAnswers);

    if (!isCorrect) {
      if (selectedUnit) {
        api.recordWrongAnswer(currentQ.id, selectedUnit.id, stagedOption, currentQ.correctOption);
      }
      if (isDenemeMode) {
        saveWrongQuestionToMistakesBank(currentQ);
      }
    } else if (isCorrect) {
      api.markQuestionResolved(currentQ.id);
      if (selectedBank?.id === MISTAKES_BANK_ID) {
        removeQuestionFromMistakesBank(currentQ.id);
      }
    }

    // Leitner spaced repetition
    spacedRepetitionService.recordReviewResult(currentQ.id, isCorrect);
    onRefreshLeitnerStats();

    // Offline-First attempt sync
    const attemptId = activeExamAttemptId || (getActiveExamAttemptId ? getActiveExamAttemptId() : null);
    api.recordQuestionAttempt({
      questionId: currentQ.id,
      selectedOption: stagedOption,
      isCorrect,
      timeSpentSeconds: 5,
      examAttemptId: isDenemeMode && attemptId ? attemptId : undefined,
    }).catch(console.warn);

    // Aktif oturum anında güncellensin
    if (isDenemeMode && onAnswerSaved) {
      onAnswerSaved(currentQ.id, answerObj, nextAnswers);
    }

    // Öğrenci istatistikleri
    const topicKey = currentQ?.subjectTitle
      ? `${currentQ.subjectTitle} - ${currentQ.topicTitle || 'Deneme'}`
      : selectedTopic?.title || selectedTopic?.id || selectedUnit?.title || 'Genel';
    studentProgressService.recordAnswer(topicKey, isCorrect);

    setViewState('feedback');
  };

  const handleNext = () => {
    if (currentIndex === questions.length - 1) {
      completeQuiz();
    } else {
      setCurrentIndex((prev) => prev + 1);
      setStagedOption(null);
    }
  };

  const handleNextFromFeedback = () => {
    if (currentIndex === questions.length - 1) {
      completeQuiz();
      setViewState('quiz');
    } else {
      setCurrentIndex((prev) => prev + 1);
      setStagedOption(null);
      setViewState('quiz');
    }
  };

  const handleRetryWrong = () => {
    const wrongOnes = questions.filter((q) => userAnswers[q.id] && !userAnswers[q.id].isCorrect);
    if (wrongOnes.length > 0) {
      setQuestions(wrongOnes);
      setCurrentIndex(0);
      setUserAnswers({});
      resetCompletionStatus();
      setStagedOption(null);
      setViewState('quiz');
    } else {
      handleRestartQuiz();
    }
  };

  const handleRestartQuiz = async () => {
    if (selectedTopic) {
      const qList = await api.getQuestions(selectedTopic.id);
      setQuestions(qList);
    } else if (selectedUnit) {
      const qList = await api.getQuestions(selectedUnit.id);
      setQuestions(qList);
    }
    setCurrentIndex(0);
    setUserAnswers({});
    resetCompletionStatus();
    setStagedOption(null);
    setViewState('quiz');
  };

  const getResult = (): UnitResult => {
    let c = 0;
    let w = 0;
    Object.values(userAnswers).forEach((a) => {
      if (a.isCorrect) c++;
      else w++;
    });
    return {
      unitId: selectedUnit?.id || '',
      totalQuestions: questions.length,
      correctCount: c,
      wrongCount: w,
      emptyCount: Math.max(0, questions.length - (c + w)),
      totalTimeSeconds: Math.round((Date.now() - startTime) / 1000),
    };
  };

  return {
    questions,
    setQuestions,
    currentIndex,
    setCurrentIndex,
    userAnswers,
    setUserAnswers,
    stagedOption,
    setStagedOption,
    isCompleted,
    setIsCompleted,
    resetCompletionStatus,
    completeQuiz,
    startTime,
    setStartTime,
    currentQ,
    currentAns,
    isAnswered,
    handleOptionSelect,
    handleConfirmAnswer,
    handleNext,
    handleNextFromFeedback,
    handleRetryWrong,
    handleRestartQuiz,
    getResult,
  };
};
