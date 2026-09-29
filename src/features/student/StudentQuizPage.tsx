import React, { useRef } from 'react';
import {
  WifiOff,
  Lock,
  Timer,
  Play,
  X,
} from 'lucide-react';
import { styles } from '../../pages/StudentQuiz.styles';
import { SubjectCardItem } from './types';
import { api } from '../../services/api';
import {
  MockExamType,
  MOCK_EXAM_CONFIGS,
  generateRandomMockExam,
  getMistakesBankQuestions,
  getOrCreateMistakesBank,
} from '../../services/mockExamService';
import { examSessionService, ActiveExamSession } from '../../services/examSessionService';
import { authService } from '../../services/authService';
import { subscriptionService } from '../../services/subscriptionService';
import { spacedRepetitionService } from '../../services/spacedRepetitionService';

// Hooks
import { useStudentSession } from './hooks/useStudentSession';
import { useCurriculumNavigation } from './hooks/useCurriculumNavigation';
import { useQuizSession } from './hooks/useQuizSession';
import { useExamTimer } from './hooks/useExamTimer';
import { useNotifications } from './hooks/useNotifications';
import { useCurriculumSearch } from './hooks/useCurriculumSearch';

// Components
import { StudentHeader } from './components/StudentHeader';
import { StudentSidebar } from './components/StudentSidebar';
import { MobileNavigation } from './components/MobileNavigation';

// Views
import { HomeView } from './views/HomeView';
import { SubjectsView } from './views/SubjectsView';
import { UnitsView } from './views/UnitsView';
import { TopicsView } from './views/TopicsView';
import { TopicDetailView } from './views/TopicDetailView';
import { QuizView } from './views/QuizView';
import { QuizFeedbackView } from './views/QuizFeedbackView';
import { ErrorPoolView } from './views/ErrorPoolView';
import { ProfileView } from './views/ProfileView';
import { SettingsView } from './views/SettingsView';

// Modals
import { DenemeSetupModal } from '../../components/DenemeSetupModal';
import { AuthModal } from '../../components/AuthModal';
import { PricingPaywallModal } from '../../components/PricingPaywallModal';

export const StudentQuizPage: React.FC<{ onNavigateAdmin?: () => void }> = () => {
  // Session Hook (Auth, Theme, Profile, Subscription, Network)
  const session = useStudentSession();

  // Curriculum Navigation Hook
  const curriculumNav = useCurriculumNavigation({
    setQuestions: (qList) => quiz.setQuestions(qList),
  });

  // Exam Timer Hook (declarative placeholders filled below)
  const timer = useExamTimer(
    curriculumNav.viewState,
    false, // placeholder, dynamically wired with quiz.isCompleted
    (val) => quiz.setIsCompleted(val),
    [],
    {},
    0,
    0
  );

  // Quiz Session Hook
  const quiz = useQuizSession({
    isDenemeMode: timer.isDenemeMode,
    activeExamAttemptId: timer.activeExamAttemptId,
    selectedExamType: timer.selectedExamType,
    denemeDurationMinutes: timer.denemeDurationMinutes,
    timeRemainingSeconds: timer.timeRemainingSeconds,
    denemeTotalElapsedSeconds: timer.denemeTotalElapsedSeconds,
    selectedSubject: curriculumNav.selectedSubject,
    selectedUnit: curriculumNav.selectedUnit,
    selectedTopic: curriculumNav.selectedTopic,
    selectedBank: curriculumNav.selectedBank,
    setViewState: curriculumNav.setViewState,
    onRefreshLeitnerStats: session.refreshLeitnerStats,
  });

  // Notifications Hook
  const notifs = useNotifications(
    curriculumNav.setActiveTab,
    curriculumNav.setViewState,
    () => timer.setShowDenemeSetupModal(true)
  );

  // Curriculum Search Hook
  const search = useCurriculumSearch({
    setActiveTab: curriculumNav.setActiveTab,
    setViewState: curriculumNav.setViewState,
    setSelectedSubject: curriculumNav.setSelectedSubject,
    setUnits: curriculumNav.setUnits,
    setSelectedUnit: curriculumNav.setSelectedUnit,
    setTopics: curriculumNav.setTopics,
    handleSelectSubject: curriculumNav.handleSelectSubject,
    handleSelectUnit: curriculumNav.handleSelectUnit,
    handleSelectTopic: curriculumNav.handleSelectTopic,
    handleOpenDenemeSetup: () => timer.setShowDenemeSetupModal(true),
  });

  // Subject Card Items
  const generalTalentSubjects: SubjectCardItem[] = [
    { id: 'turkce', title: 'Türkçe', unitCount: 12, percentage: 58, icon: 'book' },
    { id: 'matematik', title: 'Matematik', unitCount: 14, percentage: 42, icon: 'calculator' },
  ];

  const generalCultureSubjects: SubjectCardItem[] = [
    { id: 'tarih', title: 'Tarih', unitCount: 16, percentage: 71, icon: 'landmark' },
    { id: 'cografya', title: 'Coğrafya', unitCount: 10, percentage: 0, icon: 'globe' },
    { id: 'vatandaslik', title: 'Vatandaşlık', unitCount: 8, percentage: 38, icon: 'users' },
    { id: 'guncel', title: 'Güncel Bilgiler', unitCount: 6, percentage: 25, icon: 'newspaper' },
  ];

  const standardIds = new Set(['turkce', 'matematik', 'tarih', 'cografya', 'vatandaslik', 'guncel', '1', '2', '3', '4', '5', '6']);
  const extraSubjects: SubjectCardItem[] = curriculumNav.subjects
    .filter(
      (s) =>
        !standardIds.has(s.id.toLowerCase()) &&
        !['türkçe', 'matematik', 'tarih', 'coğrafya', 'vatandaşlık', 'güncel bilgiler'].includes(s.title.toLowerCase())
    )
    .map((s) => ({
      id: s.id,
      title: s.title,
      unitCount: s.totalUnits || 10,
      percentage: 0,
      icon: s.iconName?.includes('calc') ? 'calculator' : s.iconName?.includes('earth') ? 'earth' : 'book',
    }));

  // Exam Handlers
  const handleStartDenemeExam = (
    durationMinutes: number = timer.denemeDurationMinutes,
    examType: MockExamType = timer.selectedExamType
  ) => {
    const config = MOCK_EXAM_CONFIGS[examType] || MOCK_EXAM_CONFIGS.quick_20;
    const targetCount = config.questionCount || 20;
    const mockQuestions = generateRandomMockExam(targetCount, examType);
    const newAttemptId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `00000000-0000-4000-8000-${String(Date.now()).padStart(12, '0').slice(-12)}`;

    timer.setActiveExamAttemptId(newAttemptId);
    quiz.setQuestions(mockQuestions);
    quiz.setCurrentIndex(0);
    quiz.setUserAnswers({});
    quiz.setIsCompleted(false);
    quiz.setStagedOption(null);
    timer.setIsDenemeMode(true);
    timer.setDenemeDurationMinutes(durationMinutes);
    const initialSeconds = durationMinutes > 0 ? durationMinutes * 60 : 0;
    timer.setTimeRemainingSeconds(initialSeconds);
    timer.setDenemeTotalElapsedSeconds(0);
    timer.setIsTimerPaused(false);
    const now = Date.now();
    quiz.setStartTime(now);
    curriculumNav.setSelectedSubject(null);
    curriculumNav.setSelectedUnit(null);
    curriculumNav.setSelectedTopic(null);
    curriculumNav.setSelectedBank(null);
    timer.setShowDenemeSetupModal(false);
    timer.setRecoveredSession(null);
    curriculumNav.setViewState('quiz');

    examSessionService.saveActiveSession({
      examAttemptId: newAttemptId,
      templateCode: examType,
      templateName: config.title || 'KPSS Deneme Sınavı',
      durationMinutes,
      timeRemainingSeconds: initialSeconds,
      totalElapsedSeconds: 0,
      currentIndex: 0,
      questions: mockQuestions,
      userAnswers: {},
      startedAt: new Date(now).toISOString(),
      lastActiveAt: new Date(now).toISOString(),
      status: 'in_progress',
    });
  };

  const handleStartQuick20 = () => {
    timer.setSelectedExamType('quick_20');
    timer.setDenemeDurationMinutes(25);
    handleStartDenemeExam(25, 'quick_20');
  };

  const handleStartQuiz = () => {
    timer.setIsDenemeMode(false);
    quiz.setCurrentIndex(0);
    quiz.setUserAnswers({});
    quiz.setIsCompleted(false);
    quiz.setStagedOption(null);
    quiz.setStartTime(Date.now());
    curriculumNav.setViewState('quiz');
  };

  const handleStartMistakesBankQuiz = () => {
    const mistakesQuestions = getMistakesBankQuestions();
    if (mistakesQuestions.length === 0) {
      alert(
        "'Yanlışlarım' soru bankasında henüz soru bulunmuyor. Deneme sınavlarında yanlış çözdüğünüz sorular otomatik olarak buraya kaydedilir."
      );
      return;
    }
    timer.setIsDenemeMode(false);
    curriculumNav.setSelectedSubject(null);
    curriculumNav.setSelectedUnit(null);
    curriculumNav.setSelectedTopic(null);
    curriculumNav.setSelectedBank(getOrCreateMistakesBank());
    quiz.setQuestions(mistakesQuestions);
    quiz.setCurrentIndex(0);
    quiz.setUserAnswers({});
    quiz.setIsCompleted(false);
    quiz.setStagedOption(null);
    quiz.setStartTime(Date.now());
    curriculumNav.setViewState('quiz');
  };

  const handleStartLeitnerQuiz = () => {
    const dueQuestions = spacedRepetitionService.getDueQuestions();
    if (dueQuestions.length === 0) {
      handleStartMistakesBankQuiz();
      return;
    }
    timer.setIsDenemeMode(false);
    curriculumNav.setSelectedSubject(null);
    curriculumNav.setSelectedUnit(null);
    curriculumNav.setSelectedTopic(null);
    curriculumNav.setSelectedBank(getOrCreateMistakesBank());
    quiz.setQuestions(dueQuestions);
    quiz.setCurrentIndex(0);
    quiz.setUserAnswers({});
    quiz.setIsCompleted(false);
    quiz.setStagedOption(null);
    quiz.setStartTime(Date.now());
    curriculumNav.setViewState('quiz');
  };

  const handleResumeExamSession = (activeSession: ActiveExamSession) => {
    timer.setIsDenemeMode(true);
    timer.setSelectedExamType(activeSession.templateCode);
    timer.setDenemeDurationMinutes(activeSession.durationMinutes);
    quiz.setQuestions(activeSession.questions);
    quiz.setUserAnswers(activeSession.userAnswers || {});
    quiz.setCurrentIndex(activeSession.currentIndex || 0);
    timer.setTimeRemainingSeconds(activeSession.timeRemainingSeconds);
    timer.setActiveExamAttemptId(activeSession.examAttemptId);
    quiz.setStartTime(Date.now() - activeSession.totalElapsedSeconds * 1000);
    quiz.setIsCompleted(false);
    curriculumNav.setViewState('quiz');
  };

  const handleResumeRecoveredSession = () => {
    if (!timer.recoveredSession) return;
    timer.setActiveExamAttemptId(timer.recoveredSession.examAttemptId);
    timer.setSelectedExamType(timer.recoveredSession.templateCode);
    quiz.setQuestions(timer.recoveredSession.questions);
    quiz.setCurrentIndex(timer.recoveredSession.currentIndex || 0);
    quiz.setUserAnswers(timer.recoveredSession.userAnswers || {});
    timer.setDenemeDurationMinutes(timer.recoveredSession.durationMinutes || 25);
    timer.setTimeRemainingSeconds(timer.recoveredSession.timeRemainingSeconds ?? 25 * 60);
    timer.setDenemeTotalElapsedSeconds(timer.recoveredSession.totalElapsedSeconds || 0);
    quiz.setStartTime(new Date(timer.recoveredSession.startedAt).getTime() || Date.now());
    timer.setIsDenemeMode(true);
    quiz.setIsCompleted(false);
    quiz.setStagedOption(null);
    curriculumNav.setViewState('quiz');
    timer.setRecoveredSession(null);
  };

  const handlePracticeTopic = (topicTitle: string, subjectTitle?: string) => {
    const cleanTitle = topicTitle.replace(/^[^\—\-]+[\—\-]\s*/, '').trim().toLowerCase();
    const foundTopic = curriculumNav.topics.find(
      (t) => t.title.toLowerCase().includes(cleanTitle) || cleanTitle.includes(t.title.toLowerCase())
    );
    if (foundTopic) {
      curriculumNav.handleSelectTopic(foundTopic);
      return;
    }

    if (subjectTitle) {
      const foundSub = curriculumNav.subjects.find((s) =>
        s.title.toLowerCase().includes(subjectTitle.toLowerCase())
      );
      if (foundSub) {
        curriculumNav.handleSelectSubject(foundSub);
        return;
      }
    }

    curriculumNav.setActiveTab('subjects');
    curriculumNav.setViewState('subjects');
  };

  const handleStartPlan = async (planIndex: number) => {
    let subTitleQuery = 'tarih';
    if (planIndex === 2) subTitleQuery = 'türk';
    if (planIndex === 3) subTitleQuery = 'mat';
    if (planIndex === 4) subTitleQuery = 'coğ';
    const targetSubject =
      curriculumNav.subjects.find((s) => s.title.toLowerCase().includes(subTitleQuery)) ||
      curriculumNav.subjects[0];
    if (targetSubject) {
      curriculumNav.setSelectedSubject(targetSubject);
      const unitList = await api.getUnits(targetSubject.id);
      curriculumNav.setUnits(unitList);
      if (unitList.length > 0) {
        curriculumNav.handleSelectUnit(unitList[0]);
      } else {
        curriculumNav.setViewState('units');
      }
    }
  };

  const handleSubjectClick = (item: { id: string; title: string; unitCount: number }) => {
    const matched = curriculumNav.subjects.find(
      (s) =>
        s.id.toLowerCase() === item.id.toLowerCase() ||
        s.title.toLowerCase() === item.title.toLowerCase()
    ) || {
      id: item.id,
      title: item.title,
      totalUnits: item.unitCount,
    };
    curriculumNav.handleSelectSubject(matched);
  };

  const handleExitQuiz = () => {
    if (timer.isDenemeMode) {
      if (
        confirm(
          'Deneme sınavından çıkmak istediğinize emin misiniz? İlerlemeniz kaydedilmeyecektir.'
        )
      ) {
        timer.setIsDenemeMode(false);
        curriculumNav.setViewState('subjects');
        curriculumNav.setActiveTab('home');
      }
    } else {
      curriculumNav.setViewState('topics');
    }
  };

  const handleFinishDenemeEarly = () => {
    if (confirm('Deneme sınavını şimdi sonlandırıp sonuç raporunu görmek istiyor musunuz?')) {
      quiz.setIsCompleted(true);
    }
  };

  return (
    <div style={styles.webContainer}>
      <style>{`
        @media (max-width: 900px) {
          .web-sidebar-desktop {
            display: none !important;
          }
          .web-mobile-bottom-nav {
            display: flex !important;
          }
          .web-header {
            padding: 0 16px !important;
          }
          .header-search-box {
            width: auto !important;
            max-width: 180px !important;
          }
          .admin-nav-header-btn {
            padding: 6px 10px !important;
            font-size: 11px !important;
          }
          .web-main-scroll {
            padding: 16px 14px 85px 14px !important;
          }
          .dashboard-container {
            flex-direction: column !important;
            gap: 20px !important;
          }
          .dashboard-left-col, .dashboard-right-col {
            flex: none !important;
            width: 100% !important;
          }
          .quick-access-row {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
          }
          .stats-horizontal-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
          }
          .welcome-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .date-badge-container {
            width: 100% !important;
            box-sizing: border-box !important;
            justify-content: space-between !important;
          }
        }

        @media (max-width: 540px) {
          .subjects-grid-2 {
            grid-template-columns: 1fr !important;
          }
          .header-search-box {
            max-width: 130px !important;
          }
          .welcome-heading {
            font-size: 22px !important;
          }
          .deneme-theme-banner {
            padding: 10px 12px !important;
            margin-bottom: 12px !important;
            border-radius: 14px !important;
          }
          .deneme-desc-text {
            display: none !important;
          }
          .deneme-btn-desktop-text {
            display: none !important;
          }
          .deneme-btn-mobile-text {
            display: inline !important;
          }
          .deneme-action-btn {
            padding: 7px 12px !important;
            font-size: 12px !important;
          }
        }

        .deneme-theme-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: var(--kpss-card-bg, #FFFFFF);
          border: 1px solid var(--kpss-border, #EFEFF2);
          border-radius: 16px;
          padding: 14px 18px;
          margin-bottom: 16px;
          gap: 12px;
          box-shadow: var(--kpss-shadow, 0 2px 8px rgba(0, 0, 0, 0.02));
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .deneme-theme-banner:hover {
          border-color: var(--kpss-primary, #D1D5DB);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .deneme-btn-desktop-text {
          display: inline;
        }
        .deneme-btn-mobile-text {
          display: none;
        }

        .search-dropdown-menu {
          position: absolute;
          top: 48px;
          left: 0;
          width: 380px;
          background-color: var(--kpss-card-bg, #FFFFFF);
          border-radius: 12px;
          border: 1px solid var(--kpss-border, #E2E8F0);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2), 0 2px 6px rgba(0, 0, 0, 0.08);
          z-index: 2500;
          overflow: hidden;
        }
        .search-result-item:hover {
          background-color: var(--kpss-hover-bg, #F8FAFC) !important;
        }
        .notification-item:hover {
          background-color: var(--kpss-hover-bg, #F1F5F9) !important;
        }
        @media (max-width: 900px) {
          .search-dropdown-menu {
            position: fixed !important;
            top: 64px !important;
            left: 12px !important;
            right: 12px !important;
            width: auto !important;
            max-width: none !important;
          }
        }

        @media (max-width: 900px) {
          .feedback-bottom-bar,
          .quiz-footer-container {
            bottom: 64px !important;
            padding: 10px 16px !important;
            z-index: 990 !important;
            background-color: var(--kpss-card-bg, #FFFFFF) !important;
            border-top: 1px solid var(--kpss-border, #EFEFF2) !important;
            box-shadow: 0 -3px 12px rgba(0, 0, 0, 0.15) !important;
          }
          .feedback-content-container {
            padding-bottom: 160px !important;
          }
        }

        @media (min-width: 901px) {
          .web-mobile-bottom-nav {
            display: none !important;
          }
          .feedback-bottom-bar,
          .quiz-footer-container {
            bottom: 0 !important;
          }
        }
      `}</style>

      {/* 1. SOL KENAR ÇUBUĞU (SIDEBAR) */}
      <StudentSidebar
        activeTab={curriculumNav.activeTab}
        viewState={curriculumNav.viewState}
        isDenemeMode={timer.isDenemeMode}
        onNavigateTab={curriculumNav.setActiveTab}
        onSetViewState={curriculumNav.setViewState}
        onOpenDenemeSetup={() => timer.setShowDenemeSetupModal(true)}
      />

      {/* 2. SAĞ İÇERİK ALANI */}
      <div style={styles.webRightArea}>
        {/* Üst Header */}
        <StudentHeader
          searchQuery={search.searchQuery}
          setSearchQuery={search.setSearchQuery}
          searchResults={search.searchResults}
          isSearchOpen={search.isSearchOpen}
          setIsSearchOpen={search.setIsSearchOpen}
          isSearching={search.isSearching}
          searchContainerRef={search.searchContainerRef}
          onSelectSearchResult={search.handleSelectSearchResult}
          onSearchSubmit={search.handleSearchSubmit}
          notifications={notifs.notifications}
          unreadCount={notifs.unreadCount}
          showNotifications={notifs.showNotifications}
          setShowNotifications={notifs.setShowNotifications}
          onNotificationClick={notifs.handleNotificationClick}
          onMarkAllNotificationsRead={notifs.handleMarkAllNotificationsRead}
          isDarkMode={session.isDarkMode}
          onToggleDarkMode={session.handleToggleDarkMode}
          authUser={session.authUser}
          userProfile={session.userProfile}
          subscription={session.subscription}
          showUserDropdown={session.showUserDropdown}
          setShowUserDropdown={session.setShowUserDropdown}
          userDropdownRef={session.userDropdownRef}
          onOpenAuthModal={(mode) => {
            session.setAuthModalMode(mode);
            session.setShowAuthModal(true);
          }}
          onOpenPricingModal={() => session.setShowPricingModal(true)}
          onNavigateTab={curriculumNav.setActiveTab}
          onSetViewState={curriculumNav.setViewState}
        />

        {/* Ana İçerik Scroll Alanı */}
        <main className="web-main-scroll" style={styles.webMainScroll}>
          {/* Çevrimdışı Bildirim Çubuğu */}
          {!session.isOnline && (
            <div
              style={{
                backgroundColor: '#FEF2F2',
                borderBottom: '1px solid #FECACA',
                color: '#991B1B',
                padding: '10px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              <WifiOff size={18} color="#DC2626" />
              <span>
                İnternet bağlantısı kesildi. Çevrimdışı moddasınız; indirilmiş soruları ve yerel
                verilerinizi kesintisiz kullanabilirsiniz.
              </span>
            </div>
          )}

          {/* 1. HOME VIEW */}
          {curriculumNav.viewState === 'subjects' && curriculumNav.activeTab === 'home' && (
            <HomeView
              userProfile={session.userProfile}
              onStartQuick20={handleStartQuick20}
              onStartPlan={handleStartPlan}
              onStartMistakesBank={handleStartMistakesBankQuiz}
              onStartLeitnerQuiz={handleStartLeitnerQuiz}
              onOpenDenemeSetup={() => timer.setShowDenemeSetupModal(true)}
              onNavigateTab={(tab) => {
                curriculumNav.setActiveTab(tab);
                curriculumNav.setViewState('subjects');
              }}
              onResumeExamSession={handleResumeExamSession}
              onPracticeTopic={handlePracticeTopic}
              generalTalentSubjects={generalTalentSubjects}
              generalCultureSubjects={generalCultureSubjects}
              onSubjectClick={handleSubjectClick}
              mistakesBankCount={session.mistakesBankCount}
            />
          )}

          {/* 2. SUBJECTS VIEW */}
          {curriculumNav.viewState === 'subjects' && curriculumNav.activeTab === 'subjects' && (
            <SubjectsView
              generalTalentSubjects={generalTalentSubjects}
              generalCultureSubjects={generalCultureSubjects}
              extraSubjects={extraSubjects}
              onSubjectClick={handleSubjectClick}
              onOpenDenemeSetup={() => timer.setShowDenemeSetupModal(true)}
            />
          )}

          {/* 3. ERRORS VIEW */}
          {curriculumNav.viewState === 'subjects' && curriculumNav.activeTab === 'errors' && (
            <ErrorPoolView
              leitnerStats={session.leitnerStats}
              mistakesBankCount={session.mistakesBankCount}
              onStartMistakesBankQuiz={handleStartMistakesBankQuiz}
            />
          )}

          {/* 4. PROFILE VIEW */}
          {curriculumNav.viewState === 'subjects' && curriculumNav.activeTab === 'profile' && (
            <ProfileView
              userProfile={session.userProfile}
              onNavigateSettings={() => {
                curriculumNav.setActiveTab('settings');
                curriculumNav.setViewState('subjects');
              }}
            />
          )}

          {/* 5. SETTINGS VIEW */}
          {curriculumNav.viewState === 'subjects' && curriculumNav.activeTab === 'settings' && (
            <SettingsView />
          )}

          {/* 6. UNITS VIEW */}
          {curriculumNav.viewState === 'units' && curriculumNav.selectedSubject && (
            <UnitsView
              selectedSubject={curriculumNav.selectedSubject}
              units={curriculumNav.units}
              onSelectUnit={curriculumNav.handleSelectUnit}
              onBack={() => curriculumNav.setViewState('subjects')}
            />
          )}

          {/* 7. TOPICS VIEW */}
          {curriculumNav.viewState === 'topics' && curriculumNav.selectedUnit && (
            <TopicsView
              selectedUnit={curriculumNav.selectedUnit}
              topics={curriculumNav.topics}
              onSelectTopic={curriculumNav.handleSelectTopic}
              onBack={() => curriculumNav.setViewState('units')}
            />
          )}

          {/* 8. TOPIC DETAIL VIEW */}
          {curriculumNav.viewState === 'unit-detail' &&
            (curriculumNav.selectedTopic || curriculumNav.selectedUnit) && (
              <TopicDetailView
                selectedTopic={curriculumNav.selectedTopic}
                selectedUnit={curriculumNav.selectedUnit}
                selectedBank={curriculumNav.selectedBank}
                topicBanks={curriculumNav.topicBanks}
                questions={quiz.questions}
                onSelectBank={curriculumNav.handleSelectBank}
                onStartQuiz={handleStartQuiz}
                onBack={() => curriculumNav.setViewState('topics')}
              />
            )}

          {/* 9. QUIZ VIEW */}
          {curriculumNav.viewState === 'quiz' && (
            <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%', paddingBottom: '110px' }}>
              <QuizView
                isCompleted={quiz.isCompleted}
                questions={quiz.questions}
                currentQ={quiz.currentQ}
                currentAns={quiz.currentAns}
                currentIndex={quiz.currentIndex}
                stagedOption={quiz.stagedOption}
                isAnswered={quiz.isAnswered}
                isDenemeMode={timer.isDenemeMode}
                denemeDurationMinutes={timer.denemeDurationMinutes}
                timeRemainingSeconds={timer.timeRemainingSeconds}
                denemeTotalElapsedSeconds={timer.denemeTotalElapsedSeconds}
                isTimerPaused={timer.isTimerPaused}
                mistakesBankCount={session.mistakesBankCount}
                result={quiz.getResult()}
                formatTime={timer.formatTime}
                onOptionSelect={quiz.handleOptionSelect}
                onConfirmAnswer={quiz.handleConfirmAnswer}
                onNext={quiz.handleNext}
                onToggleTimerPause={() => timer.setIsTimerPaused((p) => !p)}
                onExitQuiz={handleExitQuiz}
                onFinishDenemeEarly={handleFinishDenemeEarly}
                onNavigateHome={() => {
                  timer.setIsDenemeMode(false);
                  curriculumNav.setViewState('subjects');
                  curriculumNav.setActiveTab('home');
                }}
                onNavigateTopics={() => curriculumNav.setViewState('topics')}
                onStartDenemeExam={(duration) => handleStartDenemeExam(duration)}
                onStartMistakesBankQuiz={handleStartMistakesBankQuiz}
                onRetryWrong={quiz.handleRetryWrong}
                onRestartQuiz={quiz.handleRestartQuiz}
                onBackToTopicDetail={() => {
                  if (curriculumNav.selectedTopic) curriculumNav.setViewState('unit-detail');
                  else if (curriculumNav.selectedUnit) curriculumNav.setViewState('topics');
                  else curriculumNav.setViewState('subjects');
                }}
              />
            </div>
          )}

          {/* 10. FEEDBACK VIEW */}
          {curriculumNav.viewState === 'feedback' && quiz.currentQ && (
            <QuizFeedbackView
              currentQ={quiz.currentQ}
              currentAns={quiz.currentAns}
              currentIndex={quiz.currentIndex}
              totalQuestions={quiz.questions.length}
              onNextFromFeedback={quiz.handleNextFromFeedback}
            />
          )}
        </main>

        {/* Mobil Alt Menü */}
        <MobileNavigation
          activeTab={curriculumNav.activeTab}
          viewState={curriculumNav.viewState}
          onNavigateTab={curriculumNav.setActiveTab}
          onSetViewState={curriculumNav.setViewState}
        />
      </div>

      {/* Soru Sayısı 20'nin Altında (Yayınlanmadı) Modalı */}
      {curriculumNav.unpublishedModalInfo && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '28px 24px',
              maxWidth: '460px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <Lock size={30} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
              Soru Bankası Hazırlık Aşamasında
            </h3>

            <div
              style={{
                fontSize: '14px',
                color: '#475569',
                lineHeight: 1.6,
                marginBottom: '20px',
                backgroundColor: '#F8FAFC',
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                width: '100%',
              }}
            >
              <p style={{ margin: 0, marginBottom: '8px' }}>
                <b>"{curriculumNav.unpublishedModalInfo.topicTitle}"</b> konusunun soru bankasında şu
                an <b>{curriculumNav.unpublishedModalInfo.questionCount}</b> soru bulunmaktadır.
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                KPSS hazırlık ve kalite standartlarımız gereği,{' '}
                <b>20 sorunun altındaki soru bankaları yayına alınmamaktadır.</b> İçerik ekibimiz
                soruları 20'ye tamamladığında bu test çözüme açılacaktır.
              </p>
            </div>

            <button
              onClick={() => curriculumNav.setUnpublishedModalInfo(null)}
              style={{
                width: '100%',
                padding: '13px',
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                borderRadius: '12px',
                border: 'none',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Tamam, Anladım
            </button>
          </div>
        </div>
      )}

      {/* Sınav Oturumu Kurtarma (Exam Session Recovery) Bildirimi */}
      {timer.recoveredSession &&
        curriculumNav.viewState !== 'quiz' &&
        curriculumNav.viewState !== 'feedback' && (
          <div
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '20px',
              left: '20px',
              maxWidth: '520px',
              margin: '0 auto',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              borderRadius: '16px',
              padding: '16px 20px',
              boxShadow: '0 20px 35px -5px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.1)',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: '#4F46E5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Timer size={20} color="#FFFFFF" />
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#F8FAFC' }}>
                    Yarım Kalan Sınav Oturumu
                  </div>
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                    {timer.recoveredSession.templateName} • Soru{' '}
                    {timer.recoveredSession.currentIndex + 1}/
                    {timer.recoveredSession.questions.length} • Kalan:{' '}
                    {timer.formatTime(timer.recoveredSession.timeRemainingSeconds)}
                  </div>
                </div>
              </div>
              <button
                onClick={timer.handleDiscardSession}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '4px',
                }}
                title="Oturumu İptal Et"
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleResumeRecoveredSession}
                style={{
                  flex: 2,
                  padding: '10px 14px',
                  backgroundColor: '#4F46E5',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Play size={15} />
                <span>Kaldığım Yerden Devam Et</span>
              </button>
              <button
                onClick={timer.handleDiscardSession}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  color: '#E2E8F0',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                }}
              >
                Sınavı İptal Et
              </button>
            </div>
          </div>
        )}

      {/* DENEME MODU BAŞLATMA & SÜRE AYARI MODALI */}
      <DenemeSetupModal
        isOpen={timer.showDenemeSetupModal}
        onClose={() => timer.setShowDenemeSetupModal(false)}
        onStartExam={(durationMinutes, examType) => handleStartDenemeExam(durationMinutes, examType)}
        selectedExamType={timer.selectedExamType}
        setSelectedExamType={timer.setSelectedExamType}
        denemeDurationMinutes={timer.denemeDurationMinutes}
        setDenemeDurationMinutes={timer.setDenemeDurationMinutes}
      />

      {/* AUTH MODALI */}
      <AuthModal
        isOpen={session.showAuthModal}
        initialMode={session.authModalMode}
        onClose={() => session.setShowAuthModal(false)}
        onSuccess={() => {
          session.setShowAuthModal(false);
          session.setAuthUser(authService.getCurrentUser());
        }}
      />

      {/* ABONELİK MODALI */}
      <PricingPaywallModal
        isOpen={session.showPricingModal}
        onClose={() => session.setShowPricingModal(false)}
        onSuccess={() => {
          session.setShowPricingModal(false);
          session.setSubscription(subscriptionService.getSubscription());
        }}
      />
    </div>
  );
};
