import React from 'react';
import { StudentQuizPage } from '../features/student/StudentQuizPage';
import { StudentNotificationItem } from '../features/student/types';

export type { StudentNotificationItem };

export const StudentQuiz: React.FC<{ onNavigateAdmin?: () => void }> = ({ onNavigateAdmin }) => {
  return <StudentQuizPage onNavigateAdmin={onNavigateAdmin} />;
};

export default StudentQuiz;
