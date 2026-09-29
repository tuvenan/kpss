import { useState } from 'react';
import { api } from '../../../services/api';
import { Question, OptionId, UserAnswer, UnitResult, Subject, Unit, Topic, QuestionBank } from '../../../types';
import { spacedRepetitionService } from '../../../services/spacedRepetitionService';
import { studentProgressService } from '../../../services/studentProgressService';
import { examSessionService } from '../../../services/examSessionService';
import {
  saveWrongQuestionToMistakesBank,
  saveWrongQuestionsToMistakesBank,
  removeQuestionFromMistakesBank,
  MISTAKES_BANK_ID,
  MOCK_EXAM_CONFIGS,
  MockExamType,
} from '../../../services/mockExamService';
import { StudentViewState } from '../types';

export interface UseQuizSessionProps {
  isDenemeMode: boolean;
  activeExamAttemptId: string | null;
  selectedExamType: MockExamType;
  denemeDurationMinutes: number;
  timeRemainingSeconds: number;
  denemeTotalElapsedSeconds: number;
  selectedSubject: Subject | null;
  selectedUnit: Unit | null;
  selectedTopic: Topic | null;
  selectedBank: QuestionBank | null;
  setViewState: (vs: StudentViewState) => void;
  onRefreshLeitnerStats: () => void;
}

export const useQuizSession = ({
  isDenemeMode,
  activeExamAttemptId,
  selectedExamType,
  denemeDurationMinutes,
  timeRemainingSeconds,
  denemeTotalElapsedSeconds,
  selectedSubject,
  selectedUnit,
  selectedTopic,
  selectedBank,
  setViewState,
  onRefreshLeitnerStats,
}: UseQuizSessionProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, UserAnswer>>({});
  const [stagedOption, setStagedOption] = useState<OptionId | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());

  const currentQ = questions[currentIndex];
  const currentAns = currentQ ? userAnswers[currentQ.id] : undefined;
  const isAnswered = Boolean(currentAns);

  const handleOptionSelect = (optId: OptionId) => {
    if (isAnswered) return;
    setStagedOption(optId);
  };

  const handleConfirmAnswer = () => {
    if (!stagedOption || isAnswered || !currentQ) return;
    const isCorrect = stagedOption === currentQ.correctOption;

    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        questionId: currentQ.id,
        selectedOption: stagedOption,
        isCorrect,
        timeSpentSeconds: 5,
      },
    }));

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
    api.recordQuestionAttempt({
      questionId: currentQ.id,
      selectedOption: stagedOption,
      isCorrect,
      timeSpentSeconds: 5,
      examAttemptId: isDenemeMode && activeExamAttemptId ? activeExamAttemptId : undefined,
    }).catch(console.warn);

    // Active exam session instant update
    if (isDenemeMode && activeExamAttemptId) {
      examSessionService.saveActiveSession({
        examAttemptId: activeExamAttemptId,
        templateCode: selectedExamType,
        templateName: MOCK_EXAM_CONFIGS[selectedExamType]?.title || 'KPSS Deneme Sınavı',
        durationMinutes: denemeDurationMinutes,
        timeRemainingSeconds,
        totalElapsedSeconds: denemeTotalElapsedSeconds,
        currentIndex,
        questions,
        userAnswers: {
          ...userAnswers,
          [currentQ.id]: {
            questionId: currentQ.id,
            selectedOption: stagedOption,
            isCorrect,
            timeSpentSeconds: 5,
          },
        },
        startedAt: new Date(startTime).toISOString(),
        lastActiveAt: new Date().toISOString(),
        status: 'in_progress',
      });
    }

    // Student progress analytics
    const topicKey = currentQ?.subjectTitle
      ? `${currentQ.subjectTitle} - ${currentQ.topicTitle || 'Deneme'}`
      : selectedTopic?.title || selectedTopic?.id || selectedUnit?.title || 'Genel';
    studentProgressService.recordAnswer(topicKey, isCorrect);

    setViewState('feedback');
  };

  const handleNext = () => {
    if (currentIndex === questions.length - 1) {
      if (isDenemeMode) {
        const wrongOnes = questions.filter((q) => userAnswers[q.id] && !userAnswers[q.id].isCorrect);
        if (wrongOnes.length > 0) {
          saveWrongQuestionsToMistakesBank(wrongOnes);
        }
      }
      setIsCompleted(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setStagedOption(null);
    }
  };

  const handleNextFromFeedback = () => {
    if (currentIndex === questions.length - 1) {
      if (isDenemeMode) {
        const wrongOnes = questions.filter((q) => userAnswers[q.id] && !userAnswers[q.id].isCorrect);
        if (wrongOnes.length > 0) {
          saveWrongQuestionsToMistakesBank(wrongOnes);
        }
      }
      setIsCompleted(true);
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
      setIsCompleted(false);
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
    setIsCompleted(false);
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
