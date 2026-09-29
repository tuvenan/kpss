import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Lock } from 'lucide-react';
import { api } from '../../services/api';
import { isSupabaseConfigured } from '../../services/supabase';
import { adminAuthService } from '../../services/adminAuthService';
import { getRuntimeConfig } from '../../config/runtimeConfig';
import { Question } from '../../types';
import { SAMPLE_20_QUESTIONS } from '../../data/samplePackage';
import {
  AdminTabType,
  AdminNotification,
  AdminPanelProps,
  ErrorPoolStats,
} from './types';
import { adminStyles } from './AdminPanel.styles';
import { useAdminCurriculum } from './hooks/useAdminCurriculum';
import { useQuestionEditor } from './hooks/useQuestionEditor';
import { useStorageManagement } from './hooks/useStorageManagement';

// Components
import { AdminLogin } from './components/AdminLogin';
import { AdminSidebar } from './components/AdminSidebar';
import { AdminHeader } from './components/AdminHeader';

// Views
import { DashboardView } from './views/DashboardView';
import { CurriculumView } from './views/CurriculumView';
import { QuestionsView } from './views/QuestionsView';
import { BulkPackagesView } from './views/BulkPackagesView';
import { ErrorPoolView } from './views/ErrorPoolView';
import { StudentDataView } from './views/StudentDataView';
import { UsersRolesView } from './views/UsersRolesView';
import { AuditLogsView } from './views/AuditLogsView';
import { ThemeEditorView } from './views/ThemeEditorView';
import { SystemSettingsView } from './views/SystemSettingsView';

// Modals
import { QuestionModal } from './modals/QuestionModal';
import { EditSubjectModal } from './modals/EditSubjectModal';
import { EditUnitModal } from './modals/EditUnitModal';
import { EditTopicModal } from './modals/EditTopicModal';

export const AdminPanelPage: React.FC<AdminPanelProps> = ({ onNavigateStudent }) => {
  // ----------------------------------------------------
  // 1. GÜVENLİK & KİMLİK DOĞRULAMA (AUTH)
  // ----------------------------------------------------
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return adminAuthService.isAuthenticated();
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // ----------------------------------------------------
  // 2. NAVİGASYON & PANEL DURUMLARI
  // ----------------------------------------------------
  const [activeTab, setActiveTab] = useState<AdminTabType>('dashboard');
  const [notification, setNotification] = useState<AdminNotification | null>(null);

  const notify = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // ----------------------------------------------------
  // 3. HOOKLAR
  // ----------------------------------------------------
  const curriculum = useAdminCurriculum(isAuthenticated, notify);
  const questionEditor = useQuestionEditor(notify);
  const storage = useStorageManagement(notify);

  // Hata Havuzu Verileri
  const [errorPoolStats, setErrorPoolStats] = useState<ErrorPoolStats | null>(null);

  // Supabase Bulut Durumu
  const isCloud = isSupabaseConfigured();

  // Şifre Değiştirme
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [adminPasswordMsg, setAdminPasswordMsg] = useState('');

  // ----------------------------------------------------
  // 4. VERİ YÜKLEME DÖNGÜLERİ (EFFECTS)
  // ----------------------------------------------------
  const loadErrorStats = async () => {
    try {
      const data = await api.adminGetErrorPoolStats();
      setErrorPoolStats(data);
    } catch (e) {
      console.warn('Hata havuzu istatistikleri yüklenemedi:', e);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadErrorStats();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeTab === 'system_settings') {
      storage.updateStorageInfo();
    }
  }, [activeTab]);

  // ----------------------------------------------------
  // 5. GİRİŞ & ÇIKIŞ İŞLEMLERİ
  // ----------------------------------------------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await adminAuthService.verifyPassword(passwordInput);
    if (isValid) {
      adminAuthService.createSession();
      setIsAuthenticated(true);
      setAuthError('');
      setPasswordInput('');
    } else {
      setAuthError('Hatalı yetkili şifresi! Lütfen tekrar deneyiniz.');
    }
  };

  const handleLogout = () => {
    adminAuthService.logout();
    setIsAuthenticated(false);
  };

  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await adminAuthService.updatePassword(newAdminPassword);
    setAdminPasswordMsg(res.message);
    if (res.success) {
      setNewAdminPassword('');
      setTimeout(() => setAdminPasswordMsg(''), 4000);
    }
  };

  // ----------------------------------------------------
  // 6. PAKET YÖNETİMİ & JSON TOPLU İÇE / DIŞA AKTARMA
  // ----------------------------------------------------
  const handleUploadSample20 = async () => {
    const targetId = curriculum.selectedTopicId || curriculum.selectedUnitId;
    if (!targetId) {
      notify('Lütfen önce bir ünite veya konu seçiniz.', 'error');
      return;
    }

    const questionsToUpload: Question[] = SAMPLE_20_QUESTIONS.map((q, idx) => ({
      id: `${targetId}-q${idx + 1}`,
      unitId: curriculum.selectedUnitId,
      topicId: curriculum.selectedTopicId || undefined,
      questionNumber: idx + 1,
      questionText: q.questionText,
      options: q.options,
      correctOption: q.correctOption,
      explanation: q.explanation,
    }));

    const res = await api.adminUpload20QuestionPackage(targetId, questionsToUpload, !!curriculum.selectedTopicId);
    if (res.success) {
      notify(`20 Soruluk KPSS paketi başarıyla yüklendi! (${res.count} soru)`);
      curriculum.loadQuestionsForTarget(targetId);
    } else {
      notify(`Paket yükleme hatası: ${res.error}`, 'error');
    }
  };

  const handleExportQuestions = () => {
    if (curriculum.questions.length === 0) {
      notify('Dışa aktarılacak soru bulunmuyor.', 'info');
      return;
    }
    const cleanList = curriculum.questions.map(({ questionNumber, questionText, options, correctOption, explanation }) => ({
      questionNumber,
      questionText,
      options,
      correctOption,
      explanation,
    }));
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(cleanList, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `kpss_sorulari_${curriculum.selectedTopicId || curriculum.selectedUnitId || 'sorular'}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    notify(`${curriculum.questions.length} soru JSON dosyası olarak indirildi.`);
  };



  const { allowClientAdminDemo } = getRuntimeConfig();

  // ----------------------------------------------------
  // PRODUCTION ERİŞİM ENGELİ (GERÇEK ADMIN ALTYAPISI YOKSA)
  // ----------------------------------------------------
  if (!allowClientAdminDemo) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0F172A',
        padding: '24px',
        fontFamily: "var(--kpss-font, 'Plus Jakarta Sans', sans-serif)",
      }}>
        <div style={{
          maxWidth: '460px',
          width: '100%',
          backgroundColor: '#1E293B',
          borderRadius: '16px',
          padding: '36px 28px',
          textAlign: 'center',
          border: '1px solid #334155',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            backgroundColor: '#334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <Lock size={26} color="#94A3B8" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#F8FAFC', marginBottom: '12px' }}>
            Yönetici Erişimi Kısıtlandı
          </h2>
          <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: 1.6, marginBottom: '24px' }}>
            Admin altyapısı henüz production için yapılandırılmadı. Güvenlik gereği istemci tabanlı demo yetkilendirme production ortamında devre dışıdır.
          </p>
          <button
            onClick={onNavigateStudent}
            style={{
              width: '100%',
              padding: '12px 20px',
              backgroundColor: '#111111',
              color: '#FFFFFF',
              border: '1px solid #334155',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Öğrenci Paneline Dön
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // GİRİŞ EKRANI (AUTH GATE)
  // ----------------------------------------------------
  if (!isAuthenticated) {
    return (
      <AdminLogin
        passwordInput={passwordInput}
        setPasswordInput={setPasswordInput}
        authError={authError}
        onLogin={handleLogin}
        onNavigateStudent={onNavigateStudent}
      />
    );
  }

  // ----------------------------------------------------
  // ANA ADMİN PANELİ GÖRÜNÜMÜ
  // ----------------------------------------------------
  return (
    <div style={adminStyles.adminContainer}>
      {/* TOAST / BİLDİRİM BANNER */}
      {notification && (
        <div
          style={{
            ...adminStyles.toastBanner,
            backgroundColor:
              notification.type === 'success'
                ? '#10B981'
                : notification.type === 'error'
                ? '#EF4444'
                : '#3B82F6',
          }}
        >
          {notification.type === 'success' && <CheckCircle size={18} color="#fff" style={{ marginRight: '8px' }} />}
          {notification.type === 'error' && <AlertCircle size={18} color="#fff" style={{ marginRight: '8px' }} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* SOL SİDEBAR (NAVİGASYON) */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        questionsCount={curriculum.questions.length}
        onNavigateStudent={onNavigateStudent}
        onLogout={handleLogout}
      />

      {/* SAĞ ANA İÇERİK ALANI */}
      <div style={adminStyles.mainWrapper}>
        {/* ÜST HEADER */}
        <AdminHeader
          activeTab={activeTab}
          isCloud={isCloud}
        />

        {/* İÇERİK GÖVDE BÖLÜMÜ */}
        <main style={adminStyles.scrollContent}>
          {activeTab === 'dashboard' && (
            <DashboardView
              subjectsCount={curriculum.subjects.length}
              unitsCount={curriculum.units.length}
              topicsCount={curriculum.topics.length}
              questionsCount={curriculum.questions.length}
              currentSubject={curriculum.currentSubject}
              currentUnit={curriculum.currentUnit}
              isCloud={isCloud}
              errorPoolStats={errorPoolStats}
              onNavigateTab={setActiveTab}
              onOpenNewQuestionModal={questionEditor.openNewQuestionModal}
            />
          )}

          {activeTab === 'curriculum' && (
            <CurriculumView
              onNotify={notify}
              onCurriculumChanged={curriculum.loadAllSubjects}
            />
          )}

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
                const targetId = curriculum.selectedTopicId || curriculum.selectedUnitId;
                if (targetId) curriculum.loadQuestionsForTarget(targetId);
              }}
              onNotify={notify}
            />
          )}

          {activeTab === 'bulk_packages' && (
            <BulkPackagesView
              currentTopic={curriculum.currentTopic}
              currentUnit={curriculum.currentUnit}
              selectedTopicId={curriculum.selectedTopicId}
              selectedUnitId={curriculum.selectedUnitId}
              questions={curriculum.questions}
              onUploadSample20={handleUploadSample20}
              onExportQuestions={handleExportQuestions}
              onImportSuccess={(targetId) => {
                curriculum.loadQuestionsForTarget(targetId);
                setActiveTab('questions');
              }}
              notify={notify}
            />
          )}

          {activeTab === 'error_pool' && (
            <ErrorPoolView errorPoolStats={errorPoolStats} />
          )}

          {activeTab === 'student_data' && (
            <StudentDataView onNotify={notify} />
          )}

          {activeTab === 'users_roles' && (
            <UsersRolesView notify={notify} />
          )}

          {activeTab === 'audit_logs' && (
            <AuditLogsView notify={notify} />
          )}

          {activeTab === 'theme_editor' && (
            <ThemeEditorView onNotify={notify} />
          )}

          {activeTab === 'system_settings' && (
            <SystemSettingsView
              isCloud={isCloud}
              newAdminPassword={newAdminPassword}
              setNewAdminPassword={setNewAdminPassword}
              adminPasswordMsg={adminPasswordMsg}
              onChangeAdminPassword={handleChangeAdminPassword}
              storageInfo={storage.storageInfo}
              isClearingCache={storage.isClearingCache}
              onUpdateStorageInfo={storage.updateStorageInfo}
              onClearBrowserCache={storage.handleClearBrowserCache}
              onClearCurriculumCache={() => storage.handleClearCurriculumCache(curriculum.loadAllSubjects)}
              onClearStudentDataCache={storage.handleClearStudentDataCache}
              onClearAllStorage={storage.handleClearAllStorage}
            />
          )}
        </main>
      </div>

      {/* MODALLAR */}
      <QuestionModal
        isOpen={questionEditor.showQuestionModal}
        onClose={() => questionEditor.setShowQuestionModal(false)}
        editingQuestionId={questionEditor.editingQuestionId}
        formData={questionEditor.formData}
        onUpdateField={questionEditor.updateFormField}
        onUpdateOptionText={questionEditor.updateOptionText}
        onSubmit={(e) =>
          questionEditor.handleSaveQuestion(
            e,
            curriculum.selectedUnitId,
            curriculum.selectedTopicId,
            curriculum.questions,
            curriculum.loadQuestionsForTarget
          )
        }
      />

      <EditSubjectModal
        subject={curriculum.editingSubject}
        onClose={() => curriculum.setEditingSubject(null)}
        onSubjectChange={curriculum.setEditingSubject}
        onSave={curriculum.handleUpdateSubject}
      />

      <EditUnitModal
        unit={curriculum.editingUnit}
        onClose={() => curriculum.setEditingUnit(null)}
        onUnitChange={curriculum.setEditingUnit}
        onSave={curriculum.handleUpdateUnit}
      />

      <EditTopicModal
        topic={curriculum.editingTopic}
        onClose={() => curriculum.setEditingTopic(null)}
        onTopicChange={curriculum.setEditingTopic}
        onSave={curriculum.handleUpdateTopic}
      />
    </div>
  );
};
