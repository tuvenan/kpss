import { create } from 'zustand';
import { Question, OptionId, UserAnswer, UnitResult, Unit, Subject, Topic } from '@/types';
import { MOCK_QUESTIONS, MOCK_SUBJECTS, MOCK_UNITS } from '@/data/mockQuestions';
import { errorPoolService } from '@/services/errorPoolService';
import { questionService } from '@/services/questionService';
import { subjectService } from '@/services/subjectService';

export type ViewMode = 'subjects' | 'units' | 'topics' | 'unit-detail' | 'quiz' | 'feedback' | 'result' | 'error-pool';

interface QuizState {
  // Veri ve Durum
  subjects: Subject[];
  activeSubjectId: string;
  unitId: string | null;
  units: Unit[];
  topics: Topic[];
  selectedTopicId: string | null;
  selectedTopic: Topic | null;
  viewMode: ViewMode;
  questions: Question[];
  currentQuestionIndex: number;
  userAnswers: Record<string, UserAnswer>;
  isCompleted: boolean;
  isLoading: boolean;
  quizStartTime: number | null;
  questionStartTimestamp: number;
  isErrorPoolSession: boolean;

  // Eylemler (Actions)
  loadSubjects: () => Promise<void>;
  selectSubject: (subjectId: string) => Promise<void>;
  loadUnitsForSubject: (subjectId: string) => Promise<void>;
  loadTopicsForUnit: (unitId: string) => Promise<void>;
  selectUnitForDetail: (unitId: string) => void;
  selectTopicForDetail: (topicId: string) => void;
  startTopic: (topicId: string, customQuestions?: Question[]) => Promise<void>;
  startUnit: (unitId: string, customQuestions?: Question[]) => Promise<void>;
  loadCloudQuestions: (unitId: string) => Promise<void>;
  selectOption: (questionId: string, option: OptionId) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  jumpToQuestion: (index: number) => void;
  finishUnit: () => void;
  resetUnit: () => void;
  retryWrongQuestions: () => boolean;
  startErrorPoolPractice: (unitId?: string) => Promise<boolean>;
  completeUnitAndUnlockNext: () => Promise<void>;
  setViewMode: (mode: ViewMode) => void;

  // Hesaplama (Selectors)
  getUnitResult: () => UnitResult;
  getCurrentQuestion: () => Question | null;
  getCurrentAnswer: () => UserAnswer | undefined;
  getWrongQuestionsCount: () => number;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  subjects: MOCK_SUBJECTS,
  activeSubjectId: 'tarih',
  unitId: 'ilk-turk-devletleri',
  units: MOCK_UNITS.filter((u) => u.subjectId === 'tarih'),
  topics: [],
  selectedTopicId: null,
  selectedTopic: null,
  viewMode: 'subjects',
  questions: MOCK_QUESTIONS,
  currentQuestionIndex: 0,
  userAnswers: {},
  isCompleted: false,
  isLoading: false,
  quizStartTime: Date.now(),
  questionStartTimestamp: Date.now(),
  isErrorPoolSession: false,

  loadSubjects: async () => {
    set({ isLoading: true });
    const subjects = await subjectService.getSubjects();
    set({ subjects, isLoading: false });
  },

  selectSubject: async (subjectId: string) => {
    set({ activeSubjectId: subjectId, isLoading: true, viewMode: 'units' });
    const units = await subjectService.getUnitsBySubject(subjectId);
    set({ units, isLoading: false });
  },

  loadUnitsForSubject: async (subjectId: string) => {
    set({ isLoading: true });
    const units = await subjectService.getUnitsBySubject(subjectId);
    set({ units, isLoading: false });
  },

  loadTopicsForUnit: async (unitId: string) => {
    set({ isLoading: true, unitId });
    const topics = await subjectService.getTopicsByUnit(unitId);
    set({ topics, isLoading: false, viewMode: 'topics' });
  },

  selectUnitForDetail: (unitId: string) => {
    get().loadTopicsForUnit(unitId);
  },

  selectTopicForDetail: (topicId: string) => {
    const topic = get().topics.find((t) => t.id === topicId) || null;
    set({ selectedTopicId: topicId, selectedTopic: topic, viewMode: 'unit-detail' });
  },

  startTopic: async (topicId: string, customQuestions?: Question[]) => {
    const now = Date.now();
    const { unitId, topics } = get();
    const topic = topics.find((t) => t.id === topicId) || null;

    if (customQuestions && customQuestions.length > 0) {
      set({
        selectedTopicId: topicId,
        selectedTopic: topic,
        questions: customQuestions,
        currentQuestionIndex: 0,
        userAnswers: {},
        isCompleted: false,
        isErrorPoolSession: false,
        isLoading: false,
        viewMode: 'quiz',
        quizStartTime: now,
        questionStartTimestamp: now,
      });
      return;
    }

    set({ isLoading: true, selectedTopicId: topicId, selectedTopic: topic, viewMode: 'quiz' });
    const cloudQuestions = await questionService.getQuestionsByTopic(topicId, unitId || undefined);

    set({
      selectedTopicId: topicId,
      selectedTopic: topic,
      questions: cloudQuestions,
      currentQuestionIndex: 0,
      userAnswers: {},
      isCompleted: false,
      isErrorPoolSession: false,
      isLoading: false,
      viewMode: 'quiz',
      quizStartTime: now,
      questionStartTimestamp: now,
    });
  },

  startUnit: async (unitId: string, customQuestions?: Question[]) => {
    const now = Date.now();
    const { selectedTopicId } = get();

    if (customQuestions && customQuestions.length > 0) {
      set({
        unitId,
        questions: customQuestions,
        currentQuestionIndex: 0,
        userAnswers: {},
        isCompleted: false,
        isErrorPoolSession: false,
        isLoading: false,
        viewMode: 'quiz',
        quizStartTime: now,
        questionStartTimestamp: now,
      });
      return;
    }

    set({ isLoading: true, unitId, viewMode: 'quiz' });

    // Konu seçilmişse konu bazlı, değilse ünite bazlı çek
    const cloudQuestions = selectedTopicId
      ? await questionService.getQuestionsByTopic(selectedTopicId, unitId)
      : await questionService.getQuestionsByUnit(unitId);

    set({
      unitId,
      questions: cloudQuestions,
      currentQuestionIndex: 0,
      userAnswers: {},
      isCompleted: false,
      isErrorPoolSession: false,
      isLoading: false,
      viewMode: 'quiz',
      quizStartTime: now,
      questionStartTimestamp: now,
    });
  },

  loadCloudQuestions: async (unitId: string) => {
    set({ isLoading: true });
    const questions = await questionService.getQuestionsByUnit(unitId);
    set({ questions, isLoading: false });
  },

  selectOption: (questionId: string, option: OptionId) => {
    const { questions, userAnswers, questionStartTimestamp, isCompleted, unitId } = get();
    if (isCompleted) return;

    const question = questions.find((q) => q.id === questionId);
    if (!question) return;

    const now = Date.now();
    const timeSpent = Math.max(1, Math.round((now - questionStartTimestamp) / 1000));
    const isCorrect = question.correctOption === option;

    const newAnswer: UserAnswer = {
      questionId,
      selectedOption: option,
      isCorrect,
      timeSpentSeconds: timeSpent,
    };

    set({
      userAnswers: {
        ...userAnswers,
        [questionId]: newAnswer,
      },
    });

    // Supabase error_pool tablosuna asenkron kayıt / çözümleme
    if (!isCorrect) {
      errorPoolService.recordWrongAnswer({
        questionId,
        unitId: question.unitId || unitId || 'ilk-turk-devletleri',
        selectedOption: option,
        correctOption: question.correctOption,
      });
    } else {
      // Doğru çözüldüğünde hata havuzundan 'resolved' olarak düş
      errorPoolService.markQuestionResolved(questionId);
    }
  },

  nextQuestion: () => {
    const { currentQuestionIndex, questions } = get();
    if (currentQuestionIndex < questions.length - 1) {
      set({
        currentQuestionIndex: currentQuestionIndex + 1,
        questionStartTimestamp: Date.now(),
      });
    }
  },

  previousQuestion: () => {
    const { currentQuestionIndex } = get();
    if (currentQuestionIndex > 0) {
      set({
        currentQuestionIndex: currentQuestionIndex - 1,
        questionStartTimestamp: Date.now(),
      });
    }
  },

  jumpToQuestion: (index: number) => {
    const { questions } = get();
    if (index >= 0 && index < questions.length) {
      set({
        currentQuestionIndex: index,
        questionStartTimestamp: Date.now(),
      });
    }
  },

  finishUnit: () => {
    const { userAnswers, questions, unitId } = get();
    // Test bittiğinde tüm hataları Supabase error_pool ile toplu senkronize et
    errorPoolService.syncQuizWrongAnswers(
      userAnswers,
      questions,
      unitId || 'ilk-turk-devletleri'
    );

    set({ isCompleted: true, viewMode: 'result' });
  },

  resetUnit: () => {
    const now = Date.now();

    set({
      currentQuestionIndex: 0,
      userAnswers: {},
      isCompleted: false,
      isErrorPoolSession: false,
      viewMode: 'quiz',
      quizStartTime: now,
      questionStartTimestamp: now,
    });
  },

  retryWrongQuestions: (): boolean => {
    const { questions, userAnswers } = get();
    // Sadece hatalı cevaplanan soruları filtrele
    const wrongList = questions.filter(
      (q) => userAnswers[q.id] && !userAnswers[q.id].isCorrect
    );

    if (wrongList.length === 0) {
      return false;
    }

    const now = Date.now();
    set({
      questions: wrongList,
      currentQuestionIndex: 0,
      userAnswers: {},
      isCompleted: false,
      isErrorPoolSession: true,
      viewMode: 'quiz',
      quizStartTime: now,
      questionStartTimestamp: now,
    });

    return true;
  },

  startErrorPoolPractice: async (targetUnitId?: string): Promise<boolean> => {
    set({ isLoading: true });

    // 1. Supabase error_pool tablosundan çözülmemiş soru ID'lerini al
    const unresolvedIds = await errorPoolService.getUnresolvedQuestionIds(targetUnitId);
    if (unresolvedIds.length === 0) {
      set({ isLoading: false });
      return false;
    }

    // 2. Supabase questions tablosundan veya yerelden bu soruları çek
    const poolQuestions = await questionService.getQuestionsByIds(unresolvedIds);
    if (poolQuestions.length === 0) {
      set({ isLoading: false });
      return false;
    }

    const now = Date.now();
    set({
      questions: poolQuestions,
      currentQuestionIndex: 0,
      userAnswers: {},
      isCompleted: false,
      isErrorPoolSession: true,
      isLoading: false,
      viewMode: 'quiz',
      quizStartTime: now,
      questionStartTimestamp: now,
    });

    return true;
  },

  completeUnitAndUnlockNext: async () => {
    const { unitId, activeSubjectId } = get();

    if (unitId) {
      // subjectService üzerinden tamamlanma durumunu kalıcılaştır ve bir sonraki üniteyi aç
      const updatedUnits = await subjectService.markUnitCompleted(unitId, activeSubjectId);
      set({
        units: updatedUnits,
        viewMode: 'units',
        isCompleted: false,
        isErrorPoolSession: false,
      });
    } else {
      set({
        viewMode: 'units',
        isCompleted: false,
        isErrorPoolSession: false,
      });
    }
  },

  setViewMode: (mode: ViewMode) => {
    set({ viewMode: mode });
  },

  getUnitResult: (): UnitResult => {
    const { unitId, questions, userAnswers, quizStartTime } = get();
    const totalQuestions = questions.length;
    let correctCount = 0;
    let wrongCount = 0;

    Object.values(userAnswers).forEach((ans) => {
      if (ans.isCorrect) {
        correctCount += 1;
      } else {
        wrongCount += 1;
      }
    });

    const emptyCount = Math.max(0, totalQuestions - (correctCount + wrongCount));
    const totalTimeSeconds = quizStartTime
      ? Math.max(1, Math.round((Date.now() - quizStartTime) / 1000))
      : 0;

    return {
      unitId: unitId || 'ilk-turk-devletleri',
      totalQuestions,
      correctCount,
      wrongCount,
      emptyCount,
      totalTimeSeconds,
    };
  },

  getCurrentQuestion: (): Question | null => {
    const { questions, currentQuestionIndex } = get();
    return questions[currentQuestionIndex] ?? null;
  },

  getCurrentAnswer: (): UserAnswer | undefined => {
    const { questions, currentQuestionIndex, userAnswers } = get();
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return undefined;
    return userAnswers[currentQ.id];
  },

  getWrongQuestionsCount: (): number => {
    const { questions, userAnswers } = get();
    return questions.filter((q) => userAnswers[q.id] && !userAnswers[q.id].isCorrect).length;
  },
}));
