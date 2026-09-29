export type TeacherTabType =
  | 'overview'
  | 'classes'
  | 'students'
  | 'assignments'
  | 'question_sets';

export interface TeacherNotification {
  message: string;
  type: 'success' | 'error' | 'info';
}
