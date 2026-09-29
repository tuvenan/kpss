import { Subject, Unit, Topic, Question } from '../../types';

export type AdminTabType =
  | 'dashboard'
  | 'curriculum'
  | 'questions'
  | 'bulk_packages'
  | 'error_pool'
  | 'student_data'
  | 'theme_editor'
  | 'system_settings';

export interface StorageBreakdown {
  totalBytes: number;
  totalFormatted: string;
  keyCount: number;
  curriculumBytes: number;
  curriculumFormatted: string;
  themeBytes: number;
  themeFormatted: string;
  studentBytes: number;
  studentFormatted: string;
  otherBytes: number;
  otherFormatted: string;
}

export interface AdminNotification {
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface AdminPanelProps {
  onNavigateStudent: () => void;
}

export interface ErrorPoolStatItem {
  id?: string;
  question_id?: string;
  questions?: {
    question_text?: string;
  };
  wrong_count?: number;
  is_resolved?: boolean;
}

export interface ErrorPoolStats {
  unresolvedCount: number;
  resolvedCount: number;
  list?: ErrorPoolStatItem[];
}
