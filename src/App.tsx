import React, { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { StudentQuiz } from './pages/StudentQuiz';
import { AdminPanel } from './pages/AdminPanel';
import { TeacherWorkspace } from './features/teacher/TeacherWorkspace';
import { EditorWorkspace } from './features/editor/EditorWorkspace';
import { RequireRole } from './components/rbac/RequireRole';
import { UnauthorizedView } from './components/rbac/UnauthorizedView';

type AppRoute = 'student' | 'admin' | 'teacher' | 'editor';

const resolveCurrentRoute = (): AppRoute => {
  if (typeof window === 'undefined') return 'student';
  const path = window.location.pathname;
  const hash = window.location.hash;

  if (path.includes('/admin') || hash.includes('admin')) return 'admin';
  if (path.includes('/teacher') || hash.includes('teacher')) return 'teacher';
  if (path.includes('/editor') || hash.includes('editor')) return 'editor';

  return 'student';
};

export const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<AppRoute>(resolveCurrentRoute);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(resolveCurrentRoute());
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const navigateTo = (route: AppRoute) => {
    window.history.pushState({}, '', `#${route}`);
    setCurrentPage(route);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--kpss-page-bg, #F8FAFC)',
        color: 'var(--kpss-text, #0F172A)',
        fontFamily: "var(--kpss-font, 'Plus Jakarta Sans', sans-serif)",
      }}
    >
      {currentPage === 'admin' && (
        <RequireRole
          role="super_admin"
          fallback={
            <UnauthorizedView
              title="Süper Admin Girişi Gerekli"
              message="Yönetim merkezine erişebilmek için süper admin yetkisine sahip olmanız gerekmektedir."
              onGoBack={() => navigateTo('student')}
            />
          }
        >
          <AdminPanel onNavigateStudent={() => navigateTo('student')} />
        </RequireRole>
      )}

      {currentPage === 'teacher' && (
        <RequireRole
          role="teacher"
          fallback={
            <UnauthorizedView
              title="Öğretmen Paneli Erişimi"
              message="Öğretmen çalışma alanına erişebilmek için hesabınıza öğretmen rolü atanmış olmalıdır."
              onGoBack={() => navigateTo('student')}
            />
          }
        >
          <TeacherWorkspace />
        </RequireRole>
      )}

      {currentPage === 'editor' && (
        <RequireRole
          role="editor"
          fallback={
            <UnauthorizedView
              title="Editör Paneli Erişimi"
              message="İçerik ve soru düzenleme alanına erişebilmek için editör rolüne sahip olmanız gerekmektedir."
              onGoBack={() => navigateTo('student')}
            />
          }
        >
          <EditorWorkspace />
        </RequireRole>
      )}

      {currentPage === 'student' && (
        <StudentQuiz onNavigateAdmin={() => navigateTo('admin')} />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};
