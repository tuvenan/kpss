import React from 'react';
import { ActionOrientedHome } from '../../../components/ActionOrientedHome';
import { UserProfile } from '../../../services/userProfileService';
import { ActiveExamSession } from '../../../services/examSessionService';
import { StudentTabType, SubjectCardItem } from '../types';

interface HomeViewProps {
  userProfile: UserProfile;
  onStartQuick20: () => void;
  onStartPlan: (planIndex: number) => void;
  onStartMistakesBank: () => void;
  onStartLeitnerQuiz: () => void;
  onOpenDenemeSetup: () => void;
  onNavigateTab: (tab: StudentTabType) => void;
  onResumeExamSession: (session: ActiveExamSession) => void;
  onPracticeTopic: (topicTitle: string, subjectTitle?: string) => void;
  generalTalentSubjects: SubjectCardItem[];
  generalCultureSubjects: SubjectCardItem[];
  onSubjectClick: (item: { id: string; title: string; unitCount: number }) => void;
  mistakesBankCount: number;
}

export const HomeView: React.FC<HomeViewProps> = ({
  userProfile,
  onStartQuick20,
  onStartPlan,
  onStartMistakesBank,
  onStartLeitnerQuiz,
  onOpenDenemeSetup,
  onNavigateTab,
  onResumeExamSession,
  onPracticeTopic,
  generalTalentSubjects,
  generalCultureSubjects,
  onSubjectClick,
  mistakesBankCount,
}) => {
  return (
    <ActionOrientedHome
      userProfile={userProfile}
      onStartQuick20={onStartQuick20}
      onStartPlan={onStartPlan}
      onStartMistakesBank={onStartMistakesBank}
      onStartLeitnerQuiz={onStartLeitnerQuiz}
      onOpenDenemeSetup={onOpenDenemeSetup}
      onNavigateTab={onNavigateTab}
      onResumeExamSession={onResumeExamSession}
      onPracticeTopic={onPracticeTopic}
      generalTalentSubjects={generalTalentSubjects}
      generalCultureSubjects={generalCultureSubjects}
      onSubjectClick={onSubjectClick}
      mistakesBankCount={mistakesBankCount}
    />
  );
};
