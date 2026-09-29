import React from 'react';
import { AdvancedCurriculumManager } from '../../../components/AdvancedCurriculumManager';

interface CurriculumViewProps {
  onNotify: (message: string, type?: 'success' | 'error' | 'info') => void;
  onCurriculumChanged: () => void;
}

export const CurriculumView: React.FC<CurriculumViewProps> = ({
  onNotify,
  onCurriculumChanged,
}) => {
  return (
    <AdvancedCurriculumManager
      onNotify={onNotify}
      onCurriculumChanged={onCurriculumChanged}
    />
  );
};
