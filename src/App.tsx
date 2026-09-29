import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { StudentQuiz } from './pages/StudentQuiz';
import { AdminPanel } from './pages/AdminPanel';
import { TeacherWorkspace } from './features/teacher/TeacherWorkspace';
import { EditorWorkspace } from './features/editor/EditorWorkspace';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './features/auth/ResetPasswordPage';
import { RequireRole, UnauthorizedView, AuthLoadingView } from './components/rbac';

type AppRoute = 'login' | 'register' | 'forgot-password' | 'reset-password' | 'student' | 'admin' | 'teacher' | 'editor';

/** Giriş yapılmadan erişilebilecek sayfalar */
const PUBLIC_ROUTES: AppRoute[] = ['login', 'register', 'forgot-password', 'reset-password'];

const resolveCurrentRoute = (): AppRoute => {
  if (typeof window === 'undefined') return 'login';
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const hash = window.location.hash;

  if (path === '/login' || hash.includes('login')) return 'login';
  if (path === '/register' || hash.includes('register')) return 'register';
  if (path === '/forgot-password' || hash.includes('forgot-password')) return 'forgot-password';
  if (path === '/reset-password' || hash.includes('reset-password')) return 'reset-password';
  if (path === '/admin' || path.startsWith('/admin') || hash.includes('admin')) return 'admin';
  if (path === '/teacher' || path.startsWith('/teacher') || hash.includes('teacher')) return 'teacher';
  if (path === '/editor' || path.startsWith('/editor') || hash.includes('editor')) return 'editor';

  return 'student';
};

export const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<AppRoute>(resolveCurrentRoute);
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    const handleNavigation = () => {
      setCurrentPage(resolveCurrentRoute());
    };
    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('hashchange', handleNavigation);
    return () => {
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('hashchange', handleNavigation);
    };
  }, []);

  const navigateTo = (route: AppRoute | string) => {
    const url = route === 'student' ? '/' : `/${route}`;
    window.history.pushState({}, '', url);
    setCurrentPage(resolveCurrentRoute());
  };

  // Auth loading durumunda splash göster
  if (isLoading) {
    return <AuthLoadingView message="Oturum doğrulanıyor..." />;
  }

  // Herkese açık sayfalar (giriş yapılmadan erişilebilir)
  if (PUBLIC_ROUTES.includes(currentPage)) {
    // Zaten giriş yapmışsa public sayfalardan öğrenci ekranına yönlendir
    // (LoginPage ve RegisterPage kendi içinde rol bazlı yönlendirme yapar)
    if (currentPage === 'login') return <LoginPage />;
    if (currentPage === 'register') return <RegisterPage />;
    if (currentPage === 'forgot-password') return <ForgotPasswordPage />;
    if (currentPage === 'reset-password') return <ResetPasswordPage />;
  }

  // Korumalı sayfalar: oturum yoksa login'e yönlendir
  if (!isAuthenticated || !user) {
    // URL'yi login olarak güncelle (geri dönüş için mevcut yolu kaydet)
    const returnPath = window.location.pathname;
    if (returnPath !== '/login') {
      window.history.replaceState({ returnTo: returnPath }, '', '/login');
    }
    return <LoginPage />;
  }

  // Korumalı içerikler
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
              requiredRole="super_admin"
              title="Yönetim Paneli Erişimi"
              message="Yönetim paneline erişebilmek için süper admin yetkisine sahip olmanız gerekmektedir."
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
              requiredRole="teacher"
              title="Öğretmen Paneli Erişimi"
              message="Öğretmen çalışma alanına erişebilmek için hesabınıza öğretmen rolü atanmış olmalıdır."
              onGoBack={() => navigateTo('student')}
            />
          }
        >
          <TeacherWorkspace onNavigateStudent={() => navigateTo('student')} />
        </RequireRole>
      )}

      {currentPage === 'editor' && (
        <RequireRole
          role="editor"
          fallback={
            <UnauthorizedView
              requiredRole="editor"
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
