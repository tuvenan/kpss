import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminCurriculum } from '../admin/hooks/useAdminCurriculum';
import { CurriculumView } from '../admin/views/CurriculumView';
import { QuestionsView } from '../admin/views/QuestionsView';
import { BulkPackagesView } from '../admin/views/BulkPackagesView';
import { ErrorPoolView } from '../admin/views/ErrorPoolView';
import { BookOpen, HelpCircle, PackagePlus, AlertTriangle, ArrowLeft, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export const EditorWorkspace: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'curriculum' | 'questions' | 'bulk' | 'error_pool'>('curriculum');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const notify = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 3500);
  };

  const curriculum = useAdminCurriculum(true, notify);

  const handleExportQuestions = () => {
    if (curriculum.questions.length === 0) {
      notify('Dışa aktarılacak soru bulunamadı.', 'error');
      return;
    }
    const blob = new Blob([JSON.stringify(curriculum.questions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kpss-sorular-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Sorular JSON olarak dışa aktarıldı.', 'success');
  };

  return (
    <div
      style={{
        fontFamily: "var(--kpss-font, 'Plus Jakarta Sans', sans-serif)",
        minHeight: '100vh',
        backgroundColor: 'var(--kpss-page-bg, #F8FAFC)',
        color: 'var(--kpss-text, #0F172A)',
      }}
    >
      {/* Top Header */}
      <header
        style={{
          borderBottom: '1px solid var(--kpss-border, #E2E8F0)',
          backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
          padding: '16px 24px',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => {
                window.location.hash = '#student';
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                border: '1px solid var(--kpss-border, #E2E8F0)',
                borderRadius: '8px',
                color: 'var(--kpss-text, #0F172A)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={16} />
              Öğrenci Paneline Dön
            </button>
            <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--kpss-border, #E2E8F0)' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '18px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                  Editör İçerik Yönetimi
                </h1>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                    border: '1px solid var(--kpss-border, #E2E8F0)',
                    color: '#64748B',
                  }}
                >
                  Editör Yetkisi
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#64748B' }}>
                KPSS derslerini, ünitelerini, konularını ve soru havuzunu düzenleyin
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => {
                curriculum.loadAllSubjects();
                notify('İçerikler yenilendi.');
              }}
              disabled={curriculum.isLoading}
              style={{
                padding: '8px 14px',
                backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                border: '1px solid var(--kpss-border, #E2E8F0)',
                borderRadius: '8px',
                color: 'var(--kpss-text, #0F172A)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <RefreshCw size={14} className={curriculum.isLoading ? 'animate-spin' : ''} />
              Yenile
            </button>
          </div>
        </div>
      </header>

      {/* Floating Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: notification.type === 'error' ? '#EF4444' : '#111111',
            color: '#FFFFFF',
            padding: '12px 18px',
            borderRadius: '10px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          {notification.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          {notification.message}
        </div>
      )}

      {/* Main Container */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '1px solid var(--kpss-border, #E2E8F0)',
            marginBottom: '24px',
            paddingBottom: '8px',
          }}
        >
          <button
            onClick={() => setActiveTab('curriculum')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'curriculum' ? '#111111' : 'transparent',
              color: activeTab === 'curriculum' ? '#FFFFFF' : 'var(--kpss-text, #0F172A)',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <BookOpen size={16} />
            Müfredat Ağacı
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'questions' ? '#111111' : 'transparent',
              color: activeTab === 'questions' ? '#FFFFFF' : 'var(--kpss-text, #0F172A)',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <HelpCircle size={16} />
            Soru Bankası & İnceleme ({curriculum.questions.length})
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'bulk' ? '#111111' : 'transparent',
              color: activeTab === 'bulk' ? '#FFFFFF' : 'var(--kpss-text, #0F172A)',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <PackagePlus size={16} />
            Toplu Soru Yükleme
          </button>
          <button
            onClick={() => setActiveTab('error_pool')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'error_pool' ? '#111111' : 'transparent',
              color: activeTab === 'error_pool' ? '#FFFFFF' : 'var(--kpss-text, #0F172A)',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertTriangle size={16} />
            Hata Havuzu
          </button>
        </div>

        {/* Tab 1: Curriculum */}
        {activeTab === 'curriculum' && (
          <CurriculumView
            onNotify={notify}
            onCurriculumChanged={() => {
              curriculum.loadAllSubjects();
            }}
          />
        )}

        {/* Tab 2: Questions */}
        {activeTab === 'questions' && (
          <QuestionsView
            subjects={curriculum.subjects}
            selectedSubjectId={curriculum.selectedSubjectId}
            onSelectSubjectId={curriculum.setSelectedSubjectId}
            units={curriculum.units}
            selectedUnitId={curriculum.selectedUnitId}
            onSelectUnitId={curriculum.setSelectedUnitId}
            topics={curriculum.topics}
            selectedTopicId={curriculum.selectedTopicId}
            onSelectTopicId={curriculum.setSelectedTopicId}
            questions={curriculum.questions}
            onReloadQuestions={() => {
              if (curriculum.selectedTopicId) {
                curriculum.loadQuestionsForTarget(curriculum.selectedTopicId);
              } else if (curriculum.selectedUnitId) {
                curriculum.loadQuestionsForTarget(curriculum.selectedUnitId);
              }
            }}
            onNotify={notify}
          />
        )}

        {/* Tab 3: Bulk Import */}
        {activeTab === 'bulk' && (
          <BulkPackagesView
            currentTopic={curriculum.currentTopic}
            currentUnit={curriculum.currentUnit}
            selectedTopicId={curriculum.selectedTopicId}
            selectedUnitId={curriculum.selectedUnitId}
            questions={curriculum.questions}
            onUploadSample20={() => {}}
            onExportQuestions={handleExportQuestions}
            onImportSuccess={(targetId) => {
              curriculum.loadQuestionsForTarget(targetId);
              notify('Toplu sorular başarıyla aktarıldı.', 'success');
            }}
            notify={notify}
          />
        )}

        {/* Tab 4: Error Pool */}
        {activeTab === 'error_pool' && (
          <ErrorPoolView
            errorPoolStats={{
              unresolvedCount: 0,
              resolvedCount: 0,
              list: [],
            }}
          />
        )}
      </main>
    </div>
  );
};
