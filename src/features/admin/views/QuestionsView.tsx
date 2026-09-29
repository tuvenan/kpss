import React from 'react';
import { Subject, Unit, Topic, Question } from '../../../types';
import { AdvancedQuestionManager } from '../../../components/AdvancedQuestionManager';

interface QuestionsViewProps {
  subjects: Subject[];
  selectedSubjectId: string;
  onSelectSubjectId: (id: string) => void;
  units: Unit[];
  selectedUnitId: string;
  onSelectUnitId: (id: string) => void;
  topics: Topic[];
  selectedTopicId: string;
  onSelectTopicId: (id: string) => void;
  questions: Question[];
  onReloadQuestions: () => void;
  onNotify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const QuestionsView: React.FC<QuestionsViewProps> = ({
  subjects,
  selectedSubjectId,
  onSelectSubjectId,
  units,
  selectedUnitId,
  onSelectUnitId,
  topics,
  selectedTopicId,
  onSelectTopicId,
  questions,
  onReloadQuestions,
  onNotify,
}) => {
  return (
    <AdvancedQuestionManager
      subjects={subjects}
      selectedSubjectId={selectedSubjectId}
      onSelectSubjectId={onSelectSubjectId}
      units={units}
      selectedUnitId={selectedUnitId}
      onSelectUnitId={onSelectUnitId}
      topics={topics}
      selectedTopicId={selectedTopicId}
      onSelectTopicId={onSelectTopicId}
      questions={questions}
      onReloadQuestions={onReloadQuestions}
      onNotify={onNotify}
    />
  );
};
