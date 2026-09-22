export type OptionId = 'A' | 'B' | 'C' | 'D' | 'E';

export interface QuestionOption {
  id: OptionId;
  text: string;
}

export interface Subject {
  id: string;
  title: string;
  iconName?: string;
  totalUnits: number;
}

export interface Unit {
  id: string;
  subjectId: string;
  title: string;
  unitNumber: number;
  topicCount?: number;
  isLocked?: boolean;
  isCompleted?: boolean;
}

export interface Topic {
  id: string;
  unitId: string;
  subjectId?: string;
  title: string;
  topicNumber: number;
  questionCount?: number;
  isLocked?: boolean;
  isCompleted?: boolean;
  bankTitle?: string;
  bankDescription?: string;
  bankType?: string;
}

export interface QuestionBank {
  id: string;
  topicId: string;
  unitId?: string;
  title: string;
  description?: string;
  bankType?: string;
  targetQuestionCount?: number;
  questionCount?: number;
  isLocked?: boolean;
  orderNumber?: number;
  createdAt?: string;
}

export interface Question {
  id: string;
  bankId?: string;
  topicId?: string;
  unitId?: string;
  questionNumber: number;
  questionText: string;
  options: QuestionOption[];
  correctOption: OptionId;
  explanation: string;
  difficulty?: 'Kolay' | 'Orta' | 'Zor';
  year?: string;
  tags?: string[];
  subjectTitle?: string;
  topicTitle?: string;
}

export interface UserAnswer {
  questionId: string;
  selectedOption: OptionId;
  isCorrect: boolean;
  timeSpentSeconds: number;
}

export interface UnitResult {
  unitId: string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  emptyCount: number;
  totalTimeSeconds: number;
}

export interface QuestionAttempt {
  id?: string;
  client_event_id: string; // Benzersiz olay UUID'si (Idempotency için)
  user_id?: string;
  question_id: string;
  selected_option: OptionId;
  is_correct: boolean;
  time_spent_seconds: number;
  answered_at: string;
  exam_attempt_id?: string | null;
}

export interface DbSpacedRepetitionCard {
  id?: string;
  user_id?: string;
  question_id: string;
  box: number; // 1 to 5
  consecutive_correct: number;
  review_count: number;
  last_reviewed_at: string;
  due_at: string;
}

