import React, { useState, useEffect } from 'react';
import { StudentQuiz } from './pages/StudentQuiz';
import { AdminPanel } from './pages/AdminPanel';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'student' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path.includes('/admin') || hash.includes('admin')) {
        return 'admin';
      }
    }
    return 'student';
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path.includes('/admin') || hash.includes('admin')) {
        setCurrentPage('admin');
      } else {
        setCurrentPage('student');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToAdmin = () => {
    window.history.pushState({}, '', '#admin');
    setCurrentPage('admin');
  };

  const navigateToStudent = () => {
    window.history.pushState({}, '', '#student');
    setCurrentPage('student');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9F9FB', color: '#000000', fontFamily: "'Roboto', sans-serif" }}>
      {currentPage === 'admin' ? (
        <AdminPanel onNavigateStudent={navigateToStudent} />
      ) : (
        <StudentQuiz onNavigateAdmin={navigateToAdmin} />
      )}
    </div>
  );
};
