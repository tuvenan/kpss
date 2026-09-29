import React from 'react';
import { AdvancedStudentManager } from '../../../components/AdvancedStudentManager';

interface StudentDataViewProps {
  onNotify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const StudentDataView: React.FC<StudentDataViewProps> = ({ onNotify }) => {
  return <AdvancedStudentManager onNotify={onNotify} />;
};
