import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTeacherWorkspace } from './hooks/useTeacherWorkspace';
import { TeacherSidebar } from './components/TeacherSidebar';
import { TeacherHeader } from './components/TeacherHeader';
import { OverviewView } from './views/OverviewView';
import { ClassesView } from './views/ClassesView';
import { StudentsView } from './views/StudentsView';
import { AssignmentsView } from './views/AssignmentsView';
import { QuestionSetsView } from './views/QuestionSetsView';
import { CreateClassModal } from './components/CreateClassModal';
import { CreateAssignmentModal } from './components/CreateAssignmentModal';
import { CreateQuestionSetModal } from './components/CreateQuestionSetModal';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

interface TeacherWorkspaceProps {
  onNavigateStudent?: () => void;
}

export const TeacherWorkspace: React.FC<TeacherWorkspaceProps> = ({ onNavigateStudent }) => {
  const { signOut } = useAuth();
  const ws = useTeacherWorkspace();

  const [showClassModal, setShowClassModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showQuestionSetModal, setShowQuestionSetModal] = useState(false);

  const handleNavigateHome = () => {
    if (onNavigateStudent) {
      onNavigateStudent();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: 'var(--kpss-page-bg, #F8FAFC)',
        color: 'var(--kpss-text, #0F172A)',
        fontFamily: "var(--kpss-font, 'Plus Jakarta Sans', sans-serif)",
      }}
    >
      {/* SOL NAVİGASYON */}
      <TeacherSidebar
        activeTab={ws.activeTab}
        onSelectTab={ws.setActiveTab}
        onNavigateStudent={handleNavigateHome}
        onLogout={signOut}
        classesCount={ws.classes.length}
        studentsCount={ws.students.length}
      />

      {/* SAĞ ANA İÇERİK ALANI */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* ÜST HEADER */}
        <TeacherHeader activeTab={ws.activeTab} />

        {/* BİLDİRİM / TOAST BANNER */}
        {ws.notification && (
          <div
            style={{
              padding: '12px 24px',
              backgroundColor:
                ws.notification.type === 'success'
                  ? '#10B981'
                  : ws.notification.type === 'error'
                  ? '#EF4444'
                  : '#3B82F6',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            {ws.notification.type === 'success' && <CheckCircle size={16} />}
            {ws.notification.type === 'error' && <AlertCircle size={16} />}
            {ws.notification.type === 'info' && <Info size={16} />}
            <span>{ws.notification.message}</span>
          </div>
        )}

        {/* İÇERİK GÖVDESİ */}
        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
          {ws.activeTab === 'overview' && (
            <OverviewView
              metrics={ws.metrics}
              onNavigateTab={ws.setActiveTab}
              onOpenNewClass={() => setShowClassModal(true)}
              onOpenNewAssignment={() => setShowAssignmentModal(true)}
            />
          )}

          {ws.activeTab === 'classes' && (
            <ClassesView
              classes={ws.classes}
              onOpenNewClass={() => setShowClassModal(true)}
              onUpdateClass={ws.handleUpdateClass}
              onArchiveClass={ws.handleArchiveClass}
              onRegenerateCode={ws.handleRegenerateCode}
              onRevokeCode={ws.handleRevokeCode}
            />
          )}

          {ws.activeTab === 'students' && (
            <StudentsView
              students={ws.students}
              classes={ws.classes}
            />
          )}

          {ws.activeTab === 'assignments' && (
            <AssignmentsView
              assignments={ws.assignments}
              onOpenNewAssignment={() => setShowAssignmentModal(true)}
              onUpdateStatus={ws.handleUpdateAssignmentStatus}
            />
          )}

          {ws.activeTab === 'question_sets' && (
            <QuestionSetsView
              questionSets={ws.questionSets}
              onOpenNewSet={() => setShowQuestionSetModal(true)}
              onDeleteSet={ws.handleDeleteQuestionSet}
            />
          )}
        </main>
      </div>

      {/* MODALLAR */}
      <CreateClassModal
        isOpen={showClassModal}
        onClose={() => setShowClassModal(false)}
        onSubmit={ws.handleCreateClass}
      />

      <CreateAssignmentModal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        classes={ws.classes}
        students={ws.students}
        onSubmit={ws.handleCreateAssignment}
      />

      <CreateQuestionSetModal
        isOpen={showQuestionSetModal}
        onClose={() => setShowQuestionSetModal(false)}
        classes={ws.classes}
        onSubmit={ws.handleCreateQuestionSet}
      />
    </div>
  );
};
