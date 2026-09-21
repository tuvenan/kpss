import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Subject, Unit, Topic, Question, OptionId, UserAnswer, UnitResult } from '../types';
import { CompetencyRadarCard } from '../components/CompetencyRadarCard';
import { StudentAnalyticsCards } from '../components/StudentAnalyticsCards';
import { DetailedTopicAnalysisCard } from '../components/DetailedTopicAnalysisCard';
import { studentProgressService } from '../services/studentProgressService';
import { StudentSettingsView } from '../components/StudentSettingsView';
import { userProfileService, UserProfile } from '../services/userProfileService';
import {
  User,
  BookOpen,
  Calculator,
  Landmark,
  Globe,
  Shield,
  Newspaper,
  ChevronRight,
  ChevronLeft,
  Home,
  Info,
  MoreVertical,
  Check,
  X,
  Bookmark,
  ChevronDown,
  AlertCircle,
  Search,
  Bell,
  Calendar,
  Target,
  Users,
  Play,
  FileText,
  BarChart2,
  AlertTriangle,
  Settings,
} from 'lucide-react';

export const StudentQuiz: React.FC<{ onNavigateAdmin: () => void }> = ({ onNavigateAdmin }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'subjects' | 'errors' | 'profile' | 'settings'>('home');
  const [userProfile, setUserProfile] = useState<UserProfile>(() => userProfileService.getProfile());
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const handleProfileUpdate = () => {
      setUserProfile(userProfileService.getProfile());
    };
    window.addEventListener('kpss_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('kpss_profile_updated', handleProfileUpdate);
  }, []);

  // Arama: ders/ünite/konu bazlı filtre
  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setActiveTab('subjects');
      setViewState('subjects');
    }
  };

  const notifications = [
    { id: 1, icon: '🎯', title: 'Günlük hedefin tamamlandı!', sub: 'Bugün 60 soru çözdün. Harika!', time: '5 dk önce', unread: true },
    { id: 2, icon: '🔥', title: '7 günlük seri devam ediyor', sub: 'Her gün düzenli çalışıyorsun.', time: '1 saat önce', unread: true },
    { id: 3, icon: '📊', title: 'Haftalık rapor hazır', sub: 'Bu hafta 240 soru çözdün.', time: '2 saat önce', unread: false },
  ];
  const unreadCount = notifications.filter(n => n.unread).length;

  const [errorFilter, setErrorFilter] = useState('Tümü');


  const errorQuestions = [
    { id: '1', subject: 'Tarih', topic: 'İslamiyet Öncesi', unit: 'İslamiyet Öncesi Türk Tarihi', qNumber: 'Soru 07', wrong: 'C', correct: 'B', icon: 'landmark' },
    { id: '2', subject: 'Türkçe', topic: 'Sözcükte Anlam', unit: 'Sözcükte Anlam', qNumber: 'Soru 13', wrong: 'D', correct: 'A', icon: 'book' },
    { id: '3', subject: 'Matematik', topic: 'Problemler', unit: 'Problemler', qNumber: 'Soru 05', wrong: 'B', correct: 'C', icon: 'calculator' },
    { id: '4', subject: 'Coğrafya', topic: "Türkiye Fiziki Yapısı", unit: "Türkiye'nin Fiziki Yapısı", qNumber: 'Soru 11', wrong: 'A', correct: 'earth' },
  ];

  const filteredErrorQuestions = errorFilter === 'Tümü'
    ? errorQuestions
    : errorQuestions.filter((q) => q.subject.toLowerCase() === errorFilter.toLowerCase());

  // Günlük İlerleme Verileri
  const dailyProgress = {
    current: 42,
    target: 60,
  };

  const progressPercentage = Math.min(100, Math.round((dailyProgress.current / dailyProgress.target) * 100));

  // KPSS Genel Yetenek Dersleri
  const generalTalentSubjects = [
    { id: 'turkce', title: 'Türkçe', unitCount: 12, percentage: 58, icon: 'book' },
    { id: 'matematik', title: 'Matematik', unitCount: 14, percentage: 42, icon: 'calculator' },
  ];

  // KPSS Genel Kültür Dersleri
  const generalCultureSubjects = [
    { id: 'tarih', title: 'Tarih', unitCount: 16, percentage: 71, icon: 'landmark' },
    { id: 'cografya', title: 'Coğrafya', unitCount: 10, percentage: 0, icon: 'globe' },
    { id: 'vatandaslik', title: 'Vatandaşlık', unitCount: 8, percentage: 38, icon: 'users' },
    { id: 'guncel', title: 'Güncel Bilgiler', unitCount: 6, percentage: 25, icon: 'newspaper' },
  ];

  // Sınav Durumu
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, UserAnswer>>({});
  const [stagedOption, setStagedOption] = useState<OptionId | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [viewState, setViewState] = useState<'subjects' | 'units' | 'topics' | 'unit-detail' | 'quiz' | 'feedback'>('subjects');
  const [startTime, setStartTime] = useState<number>(Date.now());

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    const list = await api.getSubjects();
    setSubjects(list);
  };

  const handleSelectSubject = async (sub: Subject) => {
    setSelectedSubject(sub);
    const unitList = await api.getUnits(sub.id);
    setUnits(unitList);
    setViewState('units');
  };

  const handleSelectUnit = async (unit: Unit) => {
    if (unit.isLocked) return;
    setSelectedUnit(unit);
    const topicList = await api.getTopics(unit.id);
    setTopics(topicList);
    setViewState('topics');
  };

  const handleSelectTopic = async (topic: Topic) => {
    if (topic.isLocked) return;
    setSelectedTopic(topic);
    const qList = await api.getQuestions(topic.id);
    setQuestions(qList);
    setViewState('unit-detail');
  };

  const handleStartQuiz = () => {
    setCurrentIndex(0);
    setUserAnswers({});
    setIsCompleted(false);
    setStagedOption(null);
    setStartTime(Date.now());
    setViewState('quiz');
  };

  const currentQ = questions[currentIndex];
  const currentAns = currentQ ? userAnswers[currentQ.id] : undefined;
  const isAnswered = Boolean(currentAns);

  const handleOptionSelect = (optId: OptionId) => {
    if (isAnswered) return;
    setStagedOption(optId);
  };

  const handleConfirmAnswer = () => {
    if (!stagedOption || isAnswered || !currentQ) return;
    const isCorrect = stagedOption === currentQ.correctOption;

    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        questionId: currentQ.id,
        selectedOption: stagedOption,
        isCorrect,
        timeSpentSeconds: 5,
      },
    }));

    if (!isCorrect && selectedUnit) {
      api.recordWrongAnswer(currentQ.id, selectedUnit.id, stagedOption, currentQ.correctOption);
    } else if (isCorrect) {
      api.markQuestionResolved(currentQ.id);
    }

    // Gerçek öğrenci analitiğine kaydet
    const topicKey = selectedTopic?.title || selectedTopic?.id || selectedUnit?.title || 'Genel';
    studentProgressService.recordAnswer(topicKey, isCorrect);

    setViewState('feedback');
  };

  const handleNext = () => {
    if (currentIndex === questions.length - 1) {
      setIsCompleted(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setStagedOption(null);
    }
  };

  const handleNextFromFeedback = () => {
    if (currentIndex === questions.length - 1) {
      setIsCompleted(true);
      setViewState('quiz');
    } else {
      setCurrentIndex((prev) => prev + 1);
      setStagedOption(null);
      setViewState('quiz');
    }
  };

  const getResult = (): UnitResult => {
    let c = 0;
    let w = 0;
    Object.values(userAnswers).forEach((a) => {
      if (a.isCorrect) c++;
      else w++;
    });
    return {
      unitId: selectedUnit?.id || '',
      totalQuestions: questions.length,
      correctCount: c,
      wrongCount: w,
      emptyCount: Math.max(0, questions.length - (c + w)),
      totalTimeSeconds: Math.round((Date.now() - startTime) / 1000),
    };
  };

  const handleRetryWrong = () => {
    const wrongOnes = questions.filter((q) => userAnswers[q.id] && !userAnswers[q.id].isCorrect);
    if (wrongOnes.length > 0) {
      setQuestions(wrongOnes);
      setCurrentIndex(0);
      setUserAnswers({});
      setIsCompleted(false);
      setStagedOption(null);
      setViewState('quiz');
    } else {
      handleRestartQuiz();
    }
  };

  const handleRestartQuiz = async () => {
    if (selectedTopic) {
      const qList = await api.getQuestions(selectedTopic.id);
      setQuestions(qList);
    } else if (selectedUnit) {
      const qList = await api.getQuestions(selectedUnit.id);
      setQuestions(qList);
    }
    setCurrentIndex(0);
    setUserAnswers({});
    setIsCompleted(false);
    setStagedOption(null);
    setViewState('quiz');
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'calculator':
        return <Calculator size={20} color="#111" />;
      case 'landmark':
        return <Landmark size={20} color="#111" />;
      case 'earth':
      case 'globe':
        return <Globe size={20} color="#111" />;
      case 'users':
        return <Users size={20} color="#111" />;
      case 'shield':
        return <Shield size={20} color="#111" />;
      case 'newspaper':
        return <Newspaper size={20} color="#111" />;
      case 'bookmark':
        return <Bookmark size={20} color="#111" />;
      case 'book':
      default:
        return <BookOpen size={20} color="#111" />;
    }
  };

  const renderTestResult = () => {
    const res = getResult();
    const total = res.totalQuestions || questions.length || 20;
    const correct = res.correctCount;
    const wrong = res.wrongCount;
    const empty = res.emptyCount;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    return (
      <div>
        {/* Üst Geri Tuşu ve Başlık */}
        <div style={styles.unitHeader}>
          <button
            onClick={() => setViewState('topics')}
            style={styles.unitBackButton}
            title="Konulara Dön"
          >
            <ChevronLeft size={22} color="#111" />
          </button>
          <div style={styles.unitDetailHeaderTitle}>Test Sonucu</div>
          <div style={{ width: '40px' }} />
        </div>

        {/* Sonuç Kartı / Başarı Halkası Alanı */}
        <div style={styles.resultCardNew}>
          <div style={styles.resultMainTitleNew}>Test Tamamlandı</div>

          {/* Başarı Halkası */}
          <div style={styles.circleContainerNew}>
            <div style={styles.scoreTextNew}>{correct} / {total}</div>
            <div style={styles.percentageTextNew}>%{percentage} Başarı</div>
          </div>

          {/* Doğru - Yanlış - Boş İstatistikleri */}
          <div style={styles.statsRowNew}>
            <div style={styles.statItemNew}>
              <div style={{ ...styles.statDotNew, backgroundColor: '#2E7D32' }} />
              <div style={styles.statLabelNew}>Doğru</div>
              <div style={styles.statValueNew}>{correct}</div>
            </div>
            <div style={styles.statDividerNew} />
            <div style={styles.statItemNew}>
              <div style={{ ...styles.statDotNew, backgroundColor: '#D32F2F' }} />
              <div style={styles.statLabelNew}>Yanlış</div>
              <div style={styles.statValueNew}>{wrong}</div>
            </div>
            <div style={styles.statDividerNew} />
            <div style={styles.statItemNew}>
              <div style={{ ...styles.statDotNew, backgroundColor: '#888' }} />
              <div style={styles.statLabelNew}>Boş</div>
              <div style={styles.statValueNew}>{empty}</div>
            </div>
          </div>
        </div>

        {/* Hata Bilgilendirme Banner'ı */}
        <div style={styles.errorBannerNew}>
          <Info size={18} color="#666" style={{ marginRight: '8px', flexShrink: 0 }} />
          <span style={styles.errorBannerTextNew}>
            {wrong > 0 ? `${wrong} soru hata havuzuna eklendi.` : 'Tebrikler! Hiç hata yapmadınız.'}
          </span>
        </div>

        {/* Yönlendirme Butonları */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {wrong > 0 && (
            <button
              onClick={handleRetryWrong}
              style={styles.resultPrimaryButton}
            >
              Hatalarımı Çöz
            </button>
          )}

          <button
            onClick={handleRestartQuiz}
            style={styles.resultSecondaryButton}
          >
            Testi Tekrarla
          </button>

          <button
            onClick={() => setViewState('topics')}
            style={styles.resultOutlineButton}
          >
            Konulara Dön
          </button>
        </div>
      </div>
    );
  };

  const handleSubjectClick = (item: { id: string; title: string; unitCount: number }) => {
    const matched = subjects.find(
      (s) => s.id.toLowerCase() === item.id.toLowerCase() || s.title.toLowerCase() === item.title.toLowerCase()
    ) || {
      id: item.id,
      title: item.title,
      totalUnits: item.unitCount,
    };
    handleSelectSubject(matched);
  };

  const renderSubjectCard = (subject: { id: string; title: string; unitCount: number; percentage: number; icon: string }) => (
    <div
      key={subject.id}
      onClick={() => handleSubjectClick(subject)}
      style={styles.subjectCard}
    >
      <div style={styles.iconContainer}>
        {renderIcon(subject.icon)}
      </div>
      <div style={styles.subjectInfo}>
        <div style={styles.subjectRow}>
          <span style={styles.subjectTitle}>{subject.title}</span>
          <ChevronRight size={18} color="#666" />
        </div>
        <div style={styles.unitText}>{subject.unitCount} Ünite</div>

        {/* İlerleme Çubuğu ve Yüzde */}
        <div style={styles.progressRow}>
          <div style={styles.progressBarBg}>
            <div style={{ ...styles.cardProgressBarFill, width: `${subject.percentage}%` }} />
          </div>
          <span style={styles.percentageText}>%{subject.percentage}</span>
        </div>
      </div>
    </div>
  );

  const standardIds = new Set(['turkce', 'matematik', 'tarih', 'cografya', 'vatandaslik', 'guncel', '1', '2', '3', '4', '5', '6']);
  const extraSubjects = subjects
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

  const handleStartPlan = async (planIndex: number) => {
    let subTitleQuery = 'tarih';
    if (planIndex === 2) subTitleQuery = 'türk';
    if (planIndex === 3) subTitleQuery = 'mat';
    if (planIndex === 4) subTitleQuery = 'coğ';
    const targetSubject = subjects.find((s) => s.title.toLowerCase().includes(subTitleQuery)) || subjects[0];
    if (targetSubject) {
      setSelectedSubject(targetSubject);
      const unitList = await api.getUnits(targetSubject.id);
      setUnits(unitList);
      if (unitList.length > 0) {
        handleSelectUnit(unitList[0]);
      } else {
        setViewState('units');
      }
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
        }

        @media (min-width: 901px) {
          .web-mobile-bottom-nav {
            display: none !important;
          }
        }
      `}</style>

      {/* 1. SOL KENAR ÇUBUĞU (SIDEBAR) */}
      <aside className="web-sidebar-desktop" style={styles.webSidebar}>
        <div>
          <div style={styles.sidebarBrand}>
            <BookOpen size={24} color="#111" style={{ marginRight: '10px', flexShrink: 0 }} />
            <div>
              <div style={styles.sidebarLogoTitle}>KPSS</div>
              <div style={styles.sidebarLogoSubtitle}>Hedefine Odaklan</div>
            </div>
          </div>

          <nav style={styles.sidebarNav}>
            <button
              onClick={() => { setActiveTab('home'); setViewState('subjects'); }}
              style={activeTab === 'home' && viewState === 'subjects' ? styles.sidebarNavItemActive : styles.sidebarNavItem}
            >
              <Home size={18} style={{ marginRight: '12px' }} />
              <span>Ana Sayfa</span>
            </button>

            <button
              onClick={() => { setActiveTab('subjects'); setViewState('subjects'); }}
              style={activeTab === 'subjects' && viewState === 'subjects' ? styles.sidebarNavItemActive : styles.sidebarNavItem}
            >
              <BookOpen size={18} style={{ marginRight: '12px' }} />
              <span>Dersler</span>
            </button>

            <button
              onClick={() => { setActiveTab('errors'); setViewState('subjects'); }}
              style={activeTab === 'errors' && viewState === 'subjects' ? styles.sidebarNavItemActive : styles.sidebarNavItem}
            >
              <AlertCircle size={18} style={{ marginRight: '12px' }} />
              <span>Hatalarım</span>
            </button>

            <button
              onClick={() => { setActiveTab('profile'); setViewState('subjects'); }}
              style={activeTab === 'profile' && viewState === 'subjects' ? styles.sidebarNavItemActive : styles.sidebarNavItem}
            >
              <User size={18} style={{ marginRight: '12px' }} />
              <span>Profil</span>
            </button>

            <button
              onClick={() => { setActiveTab('settings'); setViewState('subjects'); }}
              style={activeTab === 'settings' && viewState === 'subjects' ? styles.sidebarNavItemActive : styles.sidebarNavItem}
            >
              <Settings size={18} style={{ marginRight: '12px' }} />
              <span>Ayarlar</span>
            </button>
          </nav>
        </div>

        {/* Sol Alt Motivasyon Alanı */}
        <div style={styles.sidebarQuoteBox}>
          <div style={styles.quoteMark}>66</div>
          <div style={styles.quoteContent}>Küçük adımlar büyük hedeflere götürür.</div>
          <div style={styles.quoteFooter}>Başarı seninle.</div>
        </div>
      </aside>

      {/* 2. SAĞ İÇERİK ALANI */}
      <div style={styles.webRightArea}>
        {/* Üst Header */}
        <header className="web-header" style={styles.webHeader}>
          <div className="header-search-box" style={styles.headerSearchBox}>
            <Search size={16} color="#888" style={{ marginRight: '10px', flexShrink: 0 }} />
            <input
              placeholder="Ders, ünite veya konu ara..."
              style={styles.headerSearchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchSubmit}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', color: '#999' }}
              >
                ✕
              </button>
            )}
          </div>

          <div style={styles.headerRightActions}>
            {/* Bildirimler */}
            <div style={{ position: 'relative' }}>
              <button
                style={styles.headerIconBtn}
                title="Bildirimler"
                onClick={() => setShowNotifications(n => !n)}
              >
                <Bell size={18} color={showNotifications ? '#111' : '#333'} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '4px', right: '4px',
                    width: '16px', height: '16px', borderRadius: '50%',
                    backgroundColor: '#EF4444', color: '#fff',
                    fontSize: '10px', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    lineHeight: 1,
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Bildirim Paneli */}
              {showNotifications && (
                <>
                  {/* Overlay - dışarı tıklayınca kapat */}
                  <div
                    onClick={() => setShowNotifications(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 199 }}
                  />
                  <div style={{
                    position: 'fixed', top: '62px', right: '8px',
                    width: '320px', maxWidth: 'calc(100vw - 16px)', backgroundColor: '#fff',
                    borderRadius: '14px', border: '1px solid #E5E7EB',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    zIndex: 200, overflow: 'hidden',
                  }}>
                    <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '15px' }}>Bildirimler</span>
                      <button
                        onClick={() => setShowNotifications(false)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: '13px' }}
                      >
                        Tümünü gör →
                      </button>
                    </div>
                    {notifications.map(n => (
                      <div
                        key={n.id}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: '12px',
                          padding: '12px 18px',
                          backgroundColor: n.unread ? '#F9FAFB' : '#fff',
                          borderBottom: '1px solid #F3F4F6',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontSize: '22px', lineHeight: 1, flexShrink: 0 }}>{n.icon}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: n.unread ? 700 : 500, color: '#111', marginBottom: '2px' }}>{n.title}</div>
                          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>{n.sub}</div>
                          <div style={{ fontSize: '11px', color: '#999' }}>{n.time}</div>
                        </div>
                        {n.unread && (
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3B82F6', flexShrink: 0, marginTop: '4px' }} />
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div
              onClick={() => { setActiveTab('profile'); setViewState('subjects'); }}
              style={{ ...styles.headerUserBadge, cursor: 'pointer' }}
              title="Profil & Ayarlar"
            >
              <div style={styles.headerUserAvatar}>
                <User size={14} color="#333" />
              </div>
              <span style={styles.headerUserName}>{userProfile.name.split(' ')[0] || 'Ali'}</span>
              <ChevronDown size={14} color="#666" style={{ marginLeft: '4px' }} />
            </div>
          </div>
        </header>

        {/* Ana İçerik Scroll Alanı */}
        <main className="web-main-scroll" style={styles.webMainScroll}>
          {viewState === 'subjects' && activeTab === 'home' && (
            <div className="dashboard-container" style={styles.dashboardContainer}>
              {/* SOL KOLON (ANA AKIŞ) */}
              <div className="dashboard-left-col" style={styles.dashboardLeftCol}>
                {/* Karşılama ve Günlük İlerleme */}
                <div className="welcome-row" style={styles.welcomeRow}>
                  <div>
                    <h1 className="welcome-heading" style={styles.welcomeHeading}>Merhaba, {userProfile.name.split(' ')[0] || 'Ali'}</h1>
                    <div style={styles.welcomeSubheading}>Bugün ne çalışalım?</div>
                  </div>
                  <div className="date-badge-container" style={styles.dateBadgeContainer}>
                    <Calendar size={18} color="#444" style={{ marginRight: '10px' }} />
                    <div>
                      <div style={styles.dateBadgeTitle}>24 Eylül 2025</div>
                      <div style={styles.dateBadgeSub}>Çarşamba</div>
                    </div>
                  </div>
                </div>

                {/* Günlük Hedef Kartı */}
                <div style={styles.goalCardContainer}>
                  <div style={styles.goalHeaderRow}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={styles.goalTargetIconBox}>
                        <Target size={18} color="#111" />
                      </div>
                      <span style={styles.goalTitleText}>Günlük İlerleme</span>
                    </div>
                    <span style={styles.goalTargetText}>Hedef: 60 soru</span>
                  </div>

                  <div style={styles.goalNumberRow}>
                    <span style={styles.goalBigNum}>42</span>
                    <span style={styles.goalTotalDim}> / 60 soru</span>
                  </div>

                  <div style={styles.goalProgressBg}>
                    <div style={{ ...styles.goalProgressFill, width: `${progressPercentage}%` }} />
                  </div>

                  <div style={styles.goalFooterRow}>
                    <span>42 soru çözüldü</span>
                  </div>
                </div>

                {/* Dersler Bölümü (Grid) */}
                <div style={styles.sectionTitleRow}>
                  <h2 style={styles.sectionHeadingTitle}>Dersler</h2>
                  <button
                    onClick={() => setActiveTab('subjects')}
                    style={styles.textLinkBtn}
                  >
                    <span>Tümünü Gör →</span>
                  </button>
                </div>

                <div style={styles.categorySubTitle}>KPSS Genel Yetenek</div>
                <div className="subjects-grid-2" style={styles.subjectsGrid2}>
                  {/* Türkçe */}
                  <div
                    onClick={() => handleSubjectClick(generalTalentSubjects[0])}
                    style={styles.dashSubjectCard}
                  >
                    <div style={styles.dashSubjectIconBox}>
                      <BookOpen size={18} color="#111" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={styles.dashSubjectTop}>
                        <span style={styles.dashSubjectName}>Türkçe</span>
                        <ChevronRight size={16} color="#666" />
                      </div>
                      <div style={styles.dashSubjectUnits}>12 / 20 ünite</div>
                      <div style={styles.dashMiniBarBg}>
                        <div style={{ ...styles.dashMiniBarFill, width: '58%' }} />
                      </div>
                    </div>
                    <span style={styles.dashPercentNum}>%58</span>
                  </div>

                  {/* Matematik */}
                  <div
                    onClick={() => handleSubjectClick(generalTalentSubjects[1])}
                    style={styles.dashSubjectCard}
                  >
                    <div style={styles.dashSubjectIconBox}>
                      <Calculator size={18} color="#111" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={styles.dashSubjectTop}>
                        <span style={styles.dashSubjectName}>Matematik</span>
                        <ChevronRight size={16} color="#666" />
                      </div>
                      <div style={styles.dashSubjectUnits}>8 / 20 ünite</div>
                      <div style={styles.dashMiniBarBg}>
                        <div style={{ ...styles.dashMiniBarFill, width: '42%' }} />
                      </div>
                    </div>
                    <span style={styles.dashPercentNum}>%42</span>
                  </div>
                </div>

                <div style={{ ...styles.categorySubTitle, marginTop: '18px' }}>KPSS Genel Kültür</div>
                <div className="subjects-grid-2" style={styles.subjectsGrid2}>
                  {/* Tarih */}
                  <div
                    onClick={() => handleSubjectClick(generalCultureSubjects[0])}
                    style={styles.dashSubjectCard}
                  >
                    <div style={styles.dashSubjectIconBox}>
                      <Landmark size={18} color="#111" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={styles.dashSubjectTop}>
                        <span style={styles.dashSubjectName}>Tarih</span>
                        <ChevronRight size={16} color="#666" />
                      </div>
                      <div style={styles.dashSubjectUnits}>5 / 20 ünite</div>
                      <div style={styles.dashMiniBarBg}>
                        <div style={{ ...styles.dashMiniBarFill, width: '71%' }} />
                      </div>
                    </div>
                    <span style={styles.dashPercentNum}>%71</span>
                  </div>

                  {/* Coğrafya */}
                  <div
                    onClick={() => handleSubjectClick(generalCultureSubjects[1])}
                    style={styles.dashSubjectCard}
                  >
                    <div style={styles.dashSubjectIconBox}>
                      <Globe size={18} color="#111" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={styles.dashSubjectTop}>
                        <span style={styles.dashSubjectName}>Coğrafya</span>
                        <ChevronRight size={16} color="#666" />
                      </div>
                      <div style={styles.dashSubjectUnits}>0 / 20 ünite</div>
                      <div style={styles.dashMiniBarBg}>
                        <div style={{ ...styles.dashMiniBarFill, width: '0%' }} />
                      </div>
                    </div>
                    <span style={styles.dashPercentNum}>%0</span>
                  </div>

                  {/* Vatandaşlık */}
                  <div
                    onClick={() => handleSubjectClick(generalCultureSubjects[2])}
                    style={styles.dashSubjectCard}
                  >
                    <div style={styles.dashSubjectIconBox}>
                      <Users size={18} color="#111" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={styles.dashSubjectTop}>
                        <span style={styles.dashSubjectName}>Vatandaşlık</span>
                        <ChevronRight size={16} color="#666" />
                      </div>
                      <div style={styles.dashSubjectUnits}>8 / 20 ünite</div>
                      <div style={styles.dashMiniBarBg}>
                        <div style={{ ...styles.dashMiniBarFill, width: '38%' }} />
                      </div>
                    </div>
                    <span style={styles.dashPercentNum}>%38</span>
                  </div>

                  {/* Güncel Bilgiler */}
                  <div
                    onClick={() => handleSubjectClick(generalCultureSubjects[3])}
                    style={styles.dashSubjectCard}
                  >
                    <div style={styles.dashSubjectIconBox}>
                      <Newspaper size={18} color="#111" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={styles.dashSubjectTop}>
                        <span style={styles.dashSubjectName}>Güncel Bilgiler</span>
                        <ChevronRight size={16} color="#666" />
                      </div>
                      <div style={styles.dashSubjectUnits}>6 / 20 ünite</div>
                      <div style={styles.dashMiniBarBg}>
                        <div style={{ ...styles.dashMiniBarFill, width: '25%' }} />
                      </div>
                    </div>
                    <span style={styles.dashPercentNum}>%25</span>
                  </div>
                </div>

                {/* Hızlı Erişim */}
                <div style={styles.quickAccessTitle}>Hızlı Erişim</div>
                <div className="quick-access-row" style={styles.quickAccessRow}>
                  <div
                    onClick={() => handleStartPlan(1)}
                    style={styles.quickAccessCard}
                  >
                    <div style={styles.quickAccessIconBox}>
                      <Play size={16} color="#111" />
                    </div>
                    <div>
                      <div style={styles.quickAccessTitleText}>Soru Çöz</div>
                      <div style={styles.quickAccessSubText}>Teste başla</div>
                    </div>
                  </div>

                  <div
                    onClick={() => { setActiveTab('errors'); setViewState('subjects'); }}
                    style={styles.quickAccessCard}
                  >
                    <div style={styles.quickAccessIconBox}>
                      <FileText size={16} color="#111" />
                    </div>
                    <div>
                      <div style={styles.quickAccessTitleText}>Hata Havuzu</div>
                      <div style={styles.quickAccessSubText}>Yanlışlarını tekrar et</div>
                    </div>
                  </div>

                  <div
                    onClick={() => { setActiveTab('subjects'); setViewState('subjects'); }}
                    style={styles.quickAccessCard}
                  >
                    <div style={styles.quickAccessIconBox}>
                      <BookOpen size={16} color="#111" />
                    </div>
                    <div>
                      <div style={styles.quickAccessTitleText}>Dersler</div>
                      <div style={styles.quickAccessSubText}>Tüm derslere göz at</div>
                    </div>
                  </div>

                  <div
                    onClick={() => { setActiveTab('profile'); setViewState('subjects'); }}
                    style={styles.quickAccessCard}
                  >
                    <div style={styles.quickAccessIconBox}>
                      <User size={16} color="#111" />
                    </div>
                    <div>
                      <div style={styles.quickAccessTitleText}>Profil</div>
                      <div style={styles.quickAccessSubText}>İstatistiklerini gör</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SAĞ KOLON (ÇALIŞMA PLANI & İSTATİSTİKLER) */}
              <div className="dashboard-right-col" style={styles.dashboardRightCol}>
                {/* 1. Bugünün Çalışma Planı */}
                <div style={styles.widgetBox}>
                  <div style={styles.widgetHeaderRow}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Calendar size={18} color="#111" style={{ marginRight: '8px' }} />
                      <span style={styles.widgetTitleText}>Bugünün Çalışma Planı</span>
                    </div>
                    <button style={styles.widgetLinkBtn}>Düzenle</button>
                  </div>

                  <div style={styles.planItemsContainer}>
                    <div
                      onClick={() => handleStartPlan(1)}
                      style={styles.planCardItem}
                    >
                      <span style={styles.planNumBadge}>01</span>
                      <div style={{ flex: 1, marginLeft: '12px' }}>
                        <div style={styles.planItemTitle}>Tarih — İslamiyet Öncesi Türk Tarihi</div>
                        <div style={styles.planItemSub}>20 soru</div>
                      </div>
                      <ChevronRight size={16} color="#666" />
                    </div>

                    <div
                      onClick={() => handleStartPlan(2)}
                      style={styles.planCardItem}
                    >
                      <span style={styles.planNumBadge}>02</span>
                      <div style={{ flex: 1, marginLeft: '12px' }}>
                        <div style={styles.planItemTitle}>Türkçe — Sözcükte Anlam</div>
                        <div style={styles.planItemSub}>20 soru</div>
                      </div>
                      <ChevronRight size={16} color="#666" />
                    </div>

                    <div
                      onClick={() => handleStartPlan(3)}
                      style={styles.planCardItem}
                    >
                      <span style={styles.planNumBadge}>03</span>
                      <div style={{ flex: 1, marginLeft: '12px' }}>
                        <div style={styles.planItemTitle}>Matematik — Problemler</div>
                        <div style={styles.planItemSub}>20 soru</div>
                      </div>
                      <ChevronRight size={16} color="#666" />
                    </div>

                    <div
                      onClick={() => handleStartPlan(4)}
                      style={styles.planCardItem}
                    >
                      <span style={styles.planNumBadge}>04</span>
                      <div style={{ flex: 1, marginLeft: '12px' }}>
                        <div style={styles.planItemTitle}>Coğrafya — Türkiye Fiziki Yapısı</div>
                        <div style={styles.planItemSub}>20 soru</div>
                      </div>
                      <ChevronRight size={16} color="#666" />
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartPlan(1)}
                    style={styles.startPlanBlackBtn}
                  >
                    Çalışmaya Başla
                  </button>
                </div>

                {/* 2. Sonuçlarım */}
                <div style={styles.widgetBox}>
                  <div style={styles.widgetHeaderRow}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <BarChart2 size={18} color="#111" style={{ marginRight: '8px' }} />
                      <span style={styles.widgetTitleText}>Sonuçlarım</span>
                    </div>
                    <button
                      onClick={() => setActiveTab('subjects')}
                      style={styles.widgetLinkBtn}
                    >
                      Tümünü Gör →
                    </button>
                  </div>

                  <div className="stats-horizontal-grid" style={styles.statsHorizontalGrid}>
                    <div style={styles.statMiniBox}>
                      <div style={styles.statMiniLabel}>Toplam Soru</div>
                      <div style={styles.statMiniVal}>1.240</div>
                    </div>
                    <div style={styles.statMiniBox}>
                      <div style={styles.statMiniLabel}>Doğru</div>
                      <div style={{ ...styles.statMiniVal, color: '#16A34A' }}>982</div>
                    </div>
                    <div style={styles.statMiniBox}>
                      <div style={styles.statMiniLabel}>Yanlış</div>
                      <div style={{ ...styles.statMiniVal, color: '#DC2626' }}>258</div>
                    </div>
                    <div style={styles.statMiniBox}>
                      <div style={styles.statMiniLabel}>Başarı Oranı</div>
                      <div style={styles.statMiniVal}>%79</div>
                    </div>
                  </div>
                </div>

                {/* 3. Hata Havuzu */}
                <div style={styles.widgetBox}>
                  <div style={styles.widgetHeaderRow}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <AlertTriangle size={18} color="#111" style={{ marginRight: '8px' }} />
                      <span style={styles.widgetTitleText}>Hata Havuzu</span>
                    </div>
                    <button
                      onClick={() => { setActiveTab('errors'); setViewState('subjects'); }}
                      style={styles.widgetLinkBtn}
                    >
                      Tümünü Gör →
                    </button>
                  </div>
                  <div style={styles.errorSubCountMini}>4 hata sorusu</div>

                  <div style={styles.errorItemsContainer}>
                    <div
                      onClick={() => { setActiveTab('errors'); setViewState('subjects'); }}
                      style={styles.errorMiniItem}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={styles.errorItemTitle}>Tarih — İslamiyet Öncesi</div>
                        <div style={styles.errorItemSub}>Soru 07</div>
                      </div>
                      <span style={styles.errorRedPill}>Yanlış</span>
                      <ChevronRight size={16} color="#666" style={{ marginLeft: '6px' }} />
                    </div>

                    <div
                      onClick={() => { setActiveTab('errors'); setViewState('subjects'); }}
                      style={styles.errorMiniItem}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={styles.errorItemTitle}>Türkçe — Sözcükte Anlam</div>
                        <div style={styles.errorItemSub}>Soru 13</div>
                      </div>
                      <span style={styles.errorRedPill}>Yanlış</span>
                      <ChevronRight size={16} color="#666" style={{ marginLeft: '6px' }} />
                    </div>

                    <div
                      onClick={() => { setActiveTab('errors'); setViewState('subjects'); }}
                      style={styles.errorMiniItem}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={styles.errorItemTitle}>Matematik — Problemler</div>
                        <div style={styles.errorItemSub}>Soru 05</div>
                      </div>
                      <span style={styles.errorRedPill}>Yanlış</span>
                      <ChevronRight size={16} color="#666" style={{ marginLeft: '6px' }} />
                    </div>

                    <div
                      onClick={() => { setActiveTab('errors'); setViewState('subjects'); }}
                      style={styles.errorMiniItem}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={styles.errorItemTitle}>Coğrafya — Türkiye Fiziki Yapısı</div>
                        <div style={styles.errorItemSub}>Soru 11</div>
                      </div>
                      <span style={styles.errorRedPill}>Yanlış</span>
                      <ChevronRight size={16} color="#666" style={{ marginLeft: '6px' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DERSLER SEKMESİ */}
          {viewState === 'subjects' && activeTab === 'subjects' && (
            <div style={{ maxWidth: '780px', margin: '0 auto', width: '100%' }}>
              <h1 style={styles.mainTitle}>Dersler</h1>
              <div style={styles.categoryTitle}>KPSS Genel Yetenek</div>
              {generalTalentSubjects.map(renderSubjectCard)}
              <div style={{ ...styles.categoryTitle, marginTop: '24px' }}>KPSS Genel Kültür</div>
              {generalCultureSubjects.map(renderSubjectCard)}
              {extraSubjects.length > 0 && (
                <>
                  <div style={{ ...styles.categoryTitle, marginTop: '24px' }}>Özel Eklenen Dersler</div>
                  {extraSubjects.map(renderSubjectCard)}
                </>
              )}
            </div>
          )}

          {/* HATALARIM SEKMESİ */}
          {viewState === 'subjects' && activeTab === 'errors' && (
            <div style={{ maxWidth: '780px', margin: '0 auto', width: '100%' }}>
              <div style={styles.errorHeaderRow}>
                <div>
                  <h1 style={styles.errorMainTitle}>Hata Havuzu</h1>
                  <div style={styles.errorSubCountText}>{filteredErrorQuestions.length} hata sorusu</div>
                </div>
                <button
                  onClick={() => {
                    const filters = ['Tümü', 'Tarih', 'Türkçe', 'Matematik', 'Coğrafya'];
                    const nextIdx = (filters.indexOf(errorFilter) + 1) % filters.length;
                    setErrorFilter(filters[nextIdx]);
                  }}
                  style={styles.errorFilterButton}
                >
                  <span>{errorFilter}</span>
                  <ChevronDown size={14} color="#333" style={{ marginLeft: '6px' }} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredErrorQuestions.map((item) => (
                  <div key={item.id} style={styles.errorCardWeb}>
                    <div style={styles.errorCardLeft}>
                      <div style={styles.errorIconContainer}>{renderIcon(item.icon || 'book')}</div>
                      <div style={styles.errorInfoContainer}>
                        <div style={styles.errorSubjectName}>{item.subject}</div>
                        <div style={styles.errorUnitName}>{item.unit}</div>
                        <div style={styles.errorQNumberText}>{item.qNumber}</div>
                      </div>
                    </div>
                    <div style={styles.errorCardRight}>
                      <div style={styles.errorBadgeRow}>
                        <span style={styles.errorWrongBadge}>Yanlış: {item.wrong}</span>
                        <span style={styles.errorCorrectBadge}>Doğru: {item.correct}</span>
                      </div>
                      <ChevronRight size={18} color="#666" style={{ marginTop: '8px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROFİL SEKMESİ */}
          {viewState === 'subjects' && activeTab === 'profile' && (() => {
            const overallStats = studentProgressService.getOverallStats();
            const weeklyData = studentProgressService.getWeeklyActivity();

            return (
              <div style={{ maxWidth: '980px', margin: '0 auto', width: '100%' }}>
                <h1 style={styles.mainTitle}>Öğrenci Profili</h1>
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #EFEFF2', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#F2F2F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={28} color="#111" />
                      </div>
                      <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 4px 0' }}>{userProfile.name || 'Öğrenci'}</h2>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          {userProfile.examType} Adayı • Hedef: {userProfile.targetScore}+ Puan
                          {userProfile.branch ? ` • ${userProfile.branch}` : ''}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('settings')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '9px 16px',
                        borderRadius: '10px',
                        border: '1px solid #E5E7EB',
                        backgroundColor: '#F9FAFB',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#111827',
                        transition: 'background-color 0.15s',
                      }}
                    >
                      <Settings size={16} color="#4B5563" />
                      <span>Ayarları Düzenle</span>
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                    <div style={{ padding: '14px', backgroundColor: '#F9F9FB', borderRadius: '12px', border: '1px solid #EFEFF2' }}>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Çözülen Soru</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#111' }}>{overallStats.totalSolved}</div>
                    </div>
                    <div style={{ padding: '14px', backgroundColor: '#F9F9FB', borderRadius: '12px', border: '1px solid #EFEFF2' }}>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Başarı Oranı</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2E7D32' }}>%{overallStats.percentage}</div>
                    </div>
                    <div style={{ padding: '14px', backgroundColor: '#F9F9FB', borderRadius: '12px', border: '1px solid #EFEFF2' }}>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Günlük Hedef</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2563EB' }}>{userProfile.dailyGoal} Soru</div>
                    </div>
                  </div>
                </div>

                {/* 1. BLOK: YETERLİLİK RADARI & KAZANIM-KONU ANALİZİ */}
                <CompetencyRadarCard />

                {/* 2. BLOK: GENEL BAŞARI DAĞILIMI & HAFTALIK SORU ÇÖZÜMÜ */}
                <StudentAnalyticsCards
                  correctPercentage={overallStats.percentage}
                  solvedCount={overallStats.totalSolved}
                  targetCount={500}
                  weeklyData={weeklyData}
                />

                {/* 3. BLOK: DETAYLI KONU BAZLI ANALİZ */}
                <DetailedTopicAnalysisCard />
              </div>
            );
          })()}

          {/* AYARLAR & PROFİL DÜZENLEME SEKMESİ */}
          {viewState === 'subjects' && activeTab === 'settings' && (
            <StudentSettingsView />
          )}

        {/* 2. ÜNİTE SEÇİMİ (UNITS SCREEN) */}
        {viewState === 'units' && selectedSubject && (
          <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
            {/* Üst Geri Tuşu ve Başlık */}
            <div style={styles.unitHeader}>
              <button
                onClick={() => setViewState('subjects')}
                style={styles.unitBackButton}
                title="Derslere Dön"
              >
                <ChevronLeft size={22} color="#111" />
              </button>
              <div style={styles.unitHeaderTitle}>{selectedSubject.title}</div>
              <div style={{ width: '40px' }} /> {/* Dengeleme boşluğu */}
            </div>

            {/* Sayfa Alt Başlığı */}
            <h1 style={styles.subTitle}>{selectedSubject.title} Üniteleri</h1>

            {/* Ünite Listesi Kartları */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {units.map((unit, index) => {
                const formattedNumber = String(unit.unitNumber || index + 1).padStart(2, '0');
                return (
                  <div
                    key={unit.id}
                    onClick={() => handleSelectUnit(unit)}
                    style={styles.unitCard}
                  >
                    <div style={styles.unitNumberBadge}>
                      <span style={styles.unitNumberText}>{formattedNumber}</span>
                    </div>
                    <div style={styles.unitInfo}>
                      <div style={styles.unitName}>{unit.title}</div>
                      <div style={styles.unitQuestionText}>{unit.topicCount || 3} Konu • Testler</div>
                    </div>
                    <ChevronRight size={18} color="#666" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2.2 KONU SEÇİMİ (TOPICS SCREEN) */}
        {viewState === 'topics' && selectedUnit && (
          <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
            {/* Üst Geri Tuşu ve Başlık */}
            <div style={styles.unitHeader}>
              <button
                onClick={() => setViewState('units')}
                style={styles.unitBackButton}
                title="Ünitelere Dön"
              >
                <ChevronLeft size={22} color="#111" />
              </button>
              <div style={styles.unitHeaderTitle}>{selectedUnit.title}</div>
              <div style={{ width: '40px' }} />
            </div>

            {/* Sayfa Alt Başlığı */}
            <h1 style={styles.subTitle}>{selectedUnit.title} Konuları</h1>

            {/* Konu Listesi Kartları */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {topics.map((topic, index) => {
                const formattedNumber = String(topic.topicNumber || index + 1).padStart(2, '0');
                return (
                  <div
                    key={topic.id}
                    onClick={() => handleSelectTopic(topic)}
                    style={styles.unitCard}
                  >
                    <div style={styles.unitNumberBadge}>
                      <span style={styles.unitNumberText}>{formattedNumber}</span>
                    </div>
                    <div style={styles.unitInfo}>
                      <div style={styles.unitName}>{topic.title}</div>
                      <div style={styles.unitQuestionText}>{topic.questionCount || 20} Soru • Test</div>
                    </div>
                    <ChevronRight size={18} color="#666" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2.5 KONU/TEST DETAY / BAŞLANGIÇ EKRANI (TOPIC DETAIL SCREEN) */}
        {viewState === 'unit-detail' && (selectedTopic || selectedUnit) && (
          <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%', paddingBottom: '120px' }}>
            {/* Üst Geri Tuşu ve Başlık */}
            <div style={styles.unitHeader}>
              <button
                onClick={() => setViewState('topics')}
                style={styles.unitBackButton}
                title="Konulara Dön"
              >
                <ChevronLeft size={22} color="#111" />
              </button>
              <div style={styles.unitDetailHeaderTitle}>{selectedTopic ? selectedTopic.title : selectedUnit?.title}</div>
              <div style={{ width: '40px' }} />
            </div>

            {/* Büyük Numara ve Konu Başlık Kartı */}
            <div style={styles.heroCard}>
              <div style={styles.heroBadge}>
                <span style={styles.heroBadgeText}>
                  {String(selectedTopic?.topicNumber || selectedUnit?.unitNumber || 1).padStart(2, '0')}
                </span>
              </div>
              <div style={styles.heroTitle}>{selectedTopic ? selectedTopic.title : selectedUnit?.title}</div>
              <div style={styles.heroQuestionCount}>{questions.length || 20} Soru</div>
            </div>

            {/* Test Kuralları / Bilgi Kutusu */}
            <div style={styles.rulesCard}>
              <div style={styles.rulesCardTitle}>Bu testte:</div>

              <div style={styles.ruleItem}>
                <div style={styles.ruleDot} />
                <span style={styles.ruleText}>{questions.length || 20} soru</span>
              </div>

              <div style={styles.ruleItem}>
                <div style={styles.ruleDot} />
                <span style={styles.ruleText}>Sıralı ilerleme (1'den {questions.length || 20}'ye)</span>
              </div>

              <div style={styles.ruleItem}>
                <div style={styles.ruleDot} />
                <span style={styles.ruleText}>Soruları atlayamazsınız</span>
              </div>

              <div style={styles.ruleItem}>
                <div style={styles.ruleDot} />
                <span style={styles.ruleText}>Hatalar otomatik kaydedilir</span>
              </div>
            </div>

            {/* Sabit Alt Teste Başla Butonu */}
            <div style={styles.footerContainer}>
              <button
                onClick={handleStartQuiz}
                style={styles.startButton}
              >
                Teste Başla
              </button>

              <div style={styles.footerInfoRow}>
                <Info size={16} color="#666" style={{ marginRight: '6px' }} />
                <span style={styles.footerInfoText}>Test sırasında soruları atlayamazsınız.</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. SORU ÇÖZÜMÜ VEYA SONUÇ EKRANI */}
        {viewState === 'quiz' && (
          <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%', paddingBottom: '110px' }}>
            {!isCompleted ? (
              <div>
                {/* Üst Navigasyon ve Sayaç */}
                <div style={styles.quizNavHeader}>
                  <button
                    onClick={() => setViewState('topics')}
                    style={styles.quizBackButton}
                    title="Testten Çık"
                  >
                    <ChevronLeft size={22} color="#111" />
                  </button>
                  <div style={styles.quizHeaderCounter}>
                    {String(currentIndex + 1).padStart(2, '0')} / {String(questions.length).padStart(2, '0')}
                  </div>
                  <button
                    style={styles.quizMenuButton}
                    title="Seçenekler"
                  >
                    <MoreVertical size={18} color="#111" />
                  </button>
                </div>

                {/* İlerleme Çubuğu */}
                <div style={styles.progressBarBg}>
                  <div
                    style={{
                      ...styles.cardProgressBarFill,
                      width: `${((currentIndex + 1) / questions.length) * 100}%`,
                    }}
                  />
                </div>

                {/* Soru Kartı */}
                <div style={styles.questionCard}>
                  <div style={styles.questionLabel}>
                    SORU {String(currentIndex + 1).padStart(2, '0')}
                  </div>
                  <div style={styles.questionText}>{currentQ?.questionText}</div>
                </div>

                {/* Şıklar Listesi */}
                <div>
                  {currentQ?.options.map((opt) => {
                    const isSelected = stagedOption === opt.id;
                    const isCorrect = isAnswered && opt.id === currentQ.correctOption;
                    const isWrong = isAnswered && isSelected && !currentAns?.isCorrect;

                    let cardStyle: React.CSSProperties = { ...styles.optionCard };
                    let circleStyle: React.CSSProperties = { ...styles.radioCircle };
                    let keyStyle: React.CSSProperties = { ...styles.optionKey };
                    let textStyle: React.CSSProperties = { ...styles.optionText };

                    if (isAnswered) {
                      if (isCorrect) {
                        cardStyle = { ...cardStyle, backgroundColor: '#F0FDF4', borderColor: '#16A34A' };
                        circleStyle = { ...circleStyle, borderColor: '#16A34A' };
                        keyStyle = { ...keyStyle, color: '#16A34A' };
                        textStyle = { ...textStyle, color: '#16A34A', fontWeight: 600 };
                      } else if (isWrong) {
                        cardStyle = { ...cardStyle, backgroundColor: '#FEF2F2', borderColor: '#DC2626' };
                        circleStyle = { ...circleStyle, borderColor: '#DC2626' };
                        keyStyle = { ...keyStyle, color: '#DC2626' };
                        textStyle = { ...textStyle, color: '#DC2626', fontWeight: 600 };
                      } else {
                        cardStyle = { ...cardStyle, opacity: 0.5 };
                      }
                    } else if (isSelected) {
                      cardStyle = { ...cardStyle, ...styles.optionCardSelected };
                      circleStyle = { ...circleStyle, ...styles.radioCircleSelected };
                      keyStyle = { ...keyStyle, ...styles.optionKeySelected };
                      textStyle = { ...textStyle, ...styles.optionTextSelected };
                    }

                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleOptionSelect(opt.id)}
                        style={cardStyle}
                      >
                        <div style={circleStyle}>
                          {(isSelected || isCorrect) && (
                            <div
                              style={{
                                ...styles.radioInnerDot,
                                backgroundColor: isAnswered
                                  ? isCorrect ? '#16A34A' : '#DC2626'
                                  : '#FFFFFF',
                              }}
                            />
                          )}
                        </div>
                        <span style={keyStyle}>{opt.id}</span>
                        <span style={textStyle}>{opt.text}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Çözüm Açıklaması */}
                {isAnswered && (
                  <div style={styles.explanationBox}>
                    <div style={styles.explanationTitle}>
                      {currentAns?.isCorrect ? '✅ Doğru Cevap!' : '❌ Yanlış Cevap!'} &bull; Çözüm ve Açıklama
                    </div>
                    <div style={styles.explanationText}>{currentQ?.explanation}</div>
                  </div>
                )}

                {/* Sabit Alt Buton */}
                <div style={styles.footerContainer}>
                  {!isAnswered ? (
                    <button
                      disabled={!stagedOption}
                      onClick={handleConfirmAnswer}
                      style={{
                        ...styles.actionButton,
                        opacity: stagedOption ? 1 : 0.5,
                        cursor: stagedOption ? 'pointer' : 'not-allowed',
                      }}
                    >
                      Cevabı İşaretle
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      style={styles.actionButton}
                    >
                      {currentIndex === questions.length - 1 ? 'Sonuçları Gör' : 'Sonraki Soru →'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              renderTestResult()
            )}
          </div>
        )}

        {/* 4. FEEDBACK / ÇÖZÜM VE AÇIKLAMA EKRANI */}
        {viewState === 'feedback' && currentQ && (
          <div style={{ maxWidth: '440px', margin: '0 auto', width: '100%', padding: '48px 24px 110px' }}>
            {/* Üst Durum Alanı (Dairesel İkon, Başlık ve Alt Başlık) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
              <div
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '38px',
                  backgroundColor: currentAns?.isCorrect ? '#16A34A' : '#DC2626',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: '20px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                }}
              >
                {currentAns?.isCorrect ? (
                  <Check size={38} color="#FFFFFF" strokeWidth={3} />
                ) : (
                  <X size={38} color="#FFFFFF" strokeWidth={3} />
                )}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '6px', textAlign: 'center' }}>
                {currentAns?.isCorrect ? 'Doğru Cevap' : 'Yanlış Cevap'}
              </div>
              <div style={{ fontSize: '15px', color: '#6B7280', textAlign: 'center' }}>
                {currentAns?.isCorrect ? 'Tebrikler, doğru cevapladınız.' : 'Maalesef, yanlış cevapladınız.'}
              </div>
            </div>

            {/* Açıklama ve Doğru Cevap Kartı */}
            <div
              style={{
                backgroundColor: currentAns?.isCorrect ? '#EDF7EE' : '#FEE2E2',
                borderRadius: '16px',
                padding: '22px 24px',
                marginTop: '8px',
              }}
            >
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: currentAns?.isCorrect ? '#15803D' : '#B91C1C',
                  marginBottom: '12px',
                }}
              >
                Doğru cevap:  {currentQ.correctOption}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '6px' }}>
                Açıklama:
              </div>
              <div style={{ fontSize: '14px', color: '#374151', lineHeight: '22px', whiteSpace: 'pre-line' }}>
                {currentQ.explanation || 'Osmanlı Devleti\'nde ıslahat hareketleri, özellikle 18. yüzyıldan itibaren Avrupa\'daki gelişmelerin etkisiyle hız kazanmıştır.'}
              </div>
            </div>

            {/* Sabit Alt Buton */}
            <div style={styles.feedbackBottomBar}>
              <button
                onClick={handleNextFromFeedback}
                style={styles.feedbackNextButton}
              >
                {currentIndex === questions.length - 1 ? 'Sonuçları Gör' : 'Sonraki Soru'}
              </button>
            </div>
          </div>
        )}
        </main>

        {/* Mobil Alt Menü (Yalnızca mobilde CSS ile görünür) */}
        <nav className="web-mobile-bottom-nav" style={styles.mobileBottomNav}>
          <button
            onClick={() => { setActiveTab('home'); setViewState('subjects'); }}
            style={{
              ...styles.mobileBottomNavItem,
              ...(activeTab === 'home' && viewState === 'subjects' ? styles.mobileBottomNavItemActive : {}),
            }}
          >
            <Home size={20} color={activeTab === 'home' && viewState === 'subjects' ? '#111' : '#888'} />
            <span style={{
              ...styles.mobileBottomNavLabel,
              color: activeTab === 'home' && viewState === 'subjects' ? '#111' : '#888',
              fontWeight: activeTab === 'home' && viewState === 'subjects' ? 600 : 500,
            }}>Ana Sayfa</span>
          </button>

          <button
            onClick={() => { setActiveTab('subjects'); setViewState('subjects'); }}
            style={{
              ...styles.mobileBottomNavItem,
              ...(activeTab === 'subjects' && viewState === 'subjects' ? styles.mobileBottomNavItemActive : {}),
            }}
          >
            <BookOpen size={20} color={activeTab === 'subjects' && viewState === 'subjects' ? '#111' : '#888'} />
            <span style={{
              ...styles.mobileBottomNavLabel,
              color: activeTab === 'subjects' && viewState === 'subjects' ? '#111' : '#888',
              fontWeight: activeTab === 'subjects' && viewState === 'subjects' ? 600 : 500,
            }}>Dersler</span>
          </button>

          <button
            onClick={() => { setActiveTab('errors'); setViewState('subjects'); }}
            style={{
              ...styles.mobileBottomNavItem,
              ...(activeTab === 'errors' && viewState === 'subjects' ? styles.mobileBottomNavItemActive : {}),
            }}
          >
            <AlertTriangle size={20} color={activeTab === 'errors' && viewState === 'subjects' ? '#111' : '#888'} />
            <span style={{
              ...styles.mobileBottomNavLabel,
              color: activeTab === 'errors' && viewState === 'subjects' ? '#111' : '#888',
              fontWeight: activeTab === 'errors' && viewState === 'subjects' ? 600 : 500,
            }}>Hatalarım</span>
          </button>

          <button
            onClick={() => { setActiveTab('profile'); setViewState('subjects'); }}
            style={{
              ...styles.mobileBottomNavItem,
              ...(activeTab === 'profile' && viewState === 'subjects' ? styles.mobileBottomNavItemActive : {}),
            }}
          >
            <User size={20} color={activeTab === 'profile' && viewState === 'subjects' ? '#111' : '#888'} />
            <span style={{
              ...styles.mobileBottomNavLabel,
              color: activeTab === 'profile' && viewState === 'subjects' ? '#111' : '#888',
              fontWeight: activeTab === 'profile' && viewState === 'subjects' ? 600 : 500,
            }}>Profil</span>
          </button>

          <button
            onClick={() => { setActiveTab('settings'); setViewState('subjects'); }}
            style={{
              ...styles.mobileBottomNavItem,
              ...(activeTab === 'settings' && viewState === 'subjects' ? styles.mobileBottomNavItemActive : {}),
            }}
          >
            <Settings size={20} color={activeTab === 'settings' && viewState === 'subjects' ? '#111' : '#888'} />
            <span style={{
              ...styles.mobileBottomNavLabel,
              color: activeTab === 'settings' && viewState === 'subjects' ? '#111' : '#888',
              fontWeight: activeTab === 'settings' && viewState === 'subjects' ? 600 : 500,
            }}>Ayarlar</span>
          </button>
        </nav>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  outer: {
    minHeight: '100vh',
    backgroundColor: '#F9F9FB',
    color: '#000000',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E5E7EB',
    padding: '12px 24px',
  },
  headerInner: {
    maxWidth: '760px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandTitle: {
    fontWeight: 'bold',
    fontSize: '16px',
    color: '#111827',
  },
  adminNavButton: {
    backgroundColor: '#F3F4F6',
    border: '1px solid #E5E7EB',
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
    fontWeight: 500,
  },
  mainContainer: {
    maxWidth: '720px',
    margin: '0 auto',
    padding: '24px 16px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  heading: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#111827',
    margin: 0,
  },
  subtext: {
    fontSize: '14px',
    color: '#6B7280',
    margin: 0,
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '12px',
  },
  initialBadge: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: '#F3F4F6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '18px',
  },
  cardTitle: {
    fontWeight: 600,
    fontSize: '16px',
  },
  cardSub: {
    fontSize: '13px',
    color: '#6B7280',
    marginTop: '2px',
  },
  arrowIcon: {
    fontSize: '18px',
    color: '#9CA3AF',
  },
  backLink: {
    background: 'none',
    border: 'none',
    color: '#6B7280',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '4px 0',
    textAlign: 'left',
  },
  unitHeader: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  unitBackButton: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#EFEFF2',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  unitHeaderTitle: {
    fontSize: '17px',
    fontWeight: 600,
    color: '#111',
  },
  subTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#111',
    marginBottom: '16px',
    marginTop: 0,
  },
  unitCard: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    padding: '16px',
    marginBottom: '12px',
    alignItems: 'center',
    border: '1px solid #EFEFF2',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
    cursor: 'pointer',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
  },
  unitNumberBadge: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    backgroundColor: '#F2F2F5',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '14px',
    flexShrink: 0,
  },
  unitNumberText: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#333',
  },
  unitInfo: {
    flex: 1,
  },
  unitName: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#111',
    marginBottom: '3px',
  },
  unitQuestionText: {
    fontSize: '13px',
    color: '#777',
  },
  unitDetailHeaderTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111',
    maxWidth: '320px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textAlign: 'center',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '16px',
    border: '1px solid #EFEFF2',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
  },
  heroBadge: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: '#F2F2F5',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '12px',
  },
  heroBadgeText: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#111',
  },
  heroTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#111',
    textAlign: 'center',
    marginBottom: '6px',
  },
  heroQuestionCount: {
    fontSize: '14px',
    color: '#777',
  },
  rulesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid #EFEFF2',
  },
  rulesCardTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#111',
    marginBottom: '14px',
  },
  ruleItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '10px',
  },
  ruleDot: {
    width: '6px',
    height: '6px',
    borderRadius: '3px',
    backgroundColor: '#111',
    marginRight: '10px',
    flexShrink: 0,
  },
  ruleText: {
    fontSize: '14px',
    color: '#444',
  },
  footerContainer: {
    position: 'fixed',
    bottom: '64px',
    left: 0,
    right: 0,
    backgroundColor: '#F9F9FB',
    padding: '16px 20px',
    borderTop: '1px solid #EFEFF2',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 100,
  },
  startButton: {
    maxWidth: '600px',
    width: '100%',
    backgroundColor: '#111',
    color: '#FFF',
    borderRadius: '14px',
    height: '52px',
    border: 'none',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '10px',
    transition: 'background-color 0.15s ease',
  },
  footerInfoRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerInfoText: {
    fontSize: '12px',
    color: '#666',
  },
  quizNavHeader: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  quizBackButton: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#EFEFF2',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  quizMenuButton: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#EFEFF2',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  quizHeaderCounter: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '16px',
    border: '1px solid #EFEFF2',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
  },
  questionLabel: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#777',
    marginBottom: '8px',
    letterSpacing: '0.5px',
  },
  questionText: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111',
    lineHeight: '22px',
  },
  optionCard: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    padding: '16px',
    marginBottom: '10px',
    border: '1px solid #EFEFF2',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  optionCardSelected: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  radioCircle: {
    width: '20px',
    height: '20px',
    borderRadius: '10px',
    border: '2px solid #CCC',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '12px',
    flexShrink: 0,
  },
  radioCircleSelected: {
    borderColor: '#FFF',
  },
  radioInnerDot: {
    width: '8px',
    height: '8px',
    borderRadius: '4px',
    backgroundColor: '#FFF',
  },
  optionKey: {
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#333',
    marginRight: '10px',
    width: '16px',
    flexShrink: 0,
  },
  optionKeySelected: {
    color: '#FFF',
  },
  optionText: {
    fontSize: '14px',
    color: '#333',
    flex: 1,
  },
  optionTextSelected: {
    color: '#FFF',
  },
  actionButton: {
    maxWidth: '600px',
    width: '100%',
    backgroundColor: '#111',
    color: '#FFF',
    borderRadius: '14px',
    height: '52px',
    border: 'none',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'all 0.15s ease',
  },
  explanationBox: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '14px',
    padding: '16px',
    marginTop: '12px',
    marginBottom: '16px',
  },
  explanationTitle: {
    fontWeight: 'bold',
    fontSize: '14px',
    marginBottom: '6px',
  },
  explanationText: {
    fontSize: '13px',
    lineHeight: '20px',
    color: '#4B5563',
  },
  resultBox: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '10px',
    padding: '28px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  resultStatsRow: {
    display: 'flex',
    justifyContent: 'space-around',
    gap: '12px',
  },
  resultCard: {
    flex: 1,
    padding: '16px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    backgroundColor: '#F9F9FB',
  },
  resultActions: {
    display: 'flex',
    gap: '12px',
  },
  primaryActionBtn: {
    flex: 1,
    minHeight: '50px',
    backgroundColor: '#111827',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  secondaryActionBtn: {
    flex: 1,
    minHeight: '50px',
    backgroundColor: '#FFFFFF',
    color: '#111827',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  homeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  greetingSub: {
    fontSize: '16px',
    color: '#666',
  },
  greetingName: {
    fontSize: '26px',
    fontWeight: 'bold',
    color: '#111',
  },
  profileButton: {
    width: '42px',
    height: '42px',
    borderRadius: '21px',
    backgroundColor: '#EFEFF2',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
  },
  subQuestion: {
    fontSize: '15px',
    color: '#555',
    marginBottom: '20px',
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    border: '1px solid #EFEFF2',
  },
  goalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  goalTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#333',
  },
  goalTargetText: {
    fontSize: '13px',
    color: '#777',
  },
  goalNumbers: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#111',
    marginBottom: '12px',
  },
  goalTotal: {
    fontSize: '16px',
    fontWeight: 'normal',
    color: '#777',
  },
  progressBarBackground: {
    height: '8px',
    backgroundColor: '#EFEFF2',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#111',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  goalFooterText: {
    fontSize: '12px',
    color: '#666',
  },
  sectionHeader: {
    marginBottom: '12px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#111',
  },
  seeAllButton: {
    background: 'none',
    border: 'none',
    color: '#111',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px',
  },
  topTabBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  tabContainer: {
    display: 'flex',
    backgroundColor: '#EFEFF2',
    borderRadius: '10px',
    padding: '4px',
    gap: '4px',
  },
  tabButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#666',
    fontWeight: 500,
    fontSize: '13px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  tabButtonActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    border: 'none',
    backgroundColor: '#FFFFFF',
    color: '#111',
    fontWeight: 600,
    fontSize: '13px',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  mainTitle: {
    fontSize: '26px',
    fontWeight: 'bold',
    color: '#111',
    marginBottom: '20px',
    marginTop: 0,
  },
  categoryTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#666',
    marginBottom: '12px',
    marginTop: '4px',
  },
  subjectCard: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    padding: '16px',
    marginBottom: '12px',
    alignItems: 'center',
    border: '1px solid #EFEFF2',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  iconContainer: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    backgroundColor: '#F2F2F5',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '14px',
    flexShrink: 0,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2px',
  },
  subjectTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111',
  },
  unitText: {
    fontSize: '13px',
    color: '#777',
    marginBottom: '8px',
  },
  progressRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBg: {
    flex: 1,
    height: '6px',
    backgroundColor: '#EFEFF2',
    borderRadius: '3px',
    overflow: 'hidden',
    marginRight: '10px',
  },
  cardProgressBarFill: {
    height: '100%',
    backgroundColor: '#111',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  },
  percentageText: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#555',
    width: '32px',
    textAlign: 'right',
  },
  statusCard: {
    padding: '24px',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '16px',
    borderWidth: '1px',
    borderStyle: 'solid',
    textAlign: 'center',
  },
  statusCardCorrect: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  statusCardWrong: {
    backgroundColor: '#FFF2F2',
    borderColor: '#FEE2E2',
  },
  statusIconContainer: {
    width: '56px',
    height: '56px',
    borderRadius: '28px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '12px',
  },
  statusIconCorrect: {
    backgroundColor: '#2E7D32',
  },
  statusIconWrong: {
    backgroundColor: '#D32F2F',
  },
  statusTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#111',
    marginBottom: '4px',
  },
  statusSubtitle: {
    fontSize: '14px',
    color: '#666',
  },
  feedbackExplanationCard: {
    backgroundColor: '#FFF',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#EFEFF2',
    borderRadius: '16px',
    padding: '20px',
  },
  feedbackExplanationLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: '8px',
    letterSpacing: '0.5px',
  },
  feedbackExplanationText: {
    fontSize: '14px',
    color: '#333',
    lineHeight: '22px',
    whiteSpace: 'pre-line',
  },
  feedbackBottomBar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: '18px 24px',
    borderTop: '1px solid #F3F4F6',
    display: 'flex',
    justifyContent: 'center',
    zIndex: 100,
  },
  feedbackNextButton: {
    maxWidth: '440px',
    width: '100%',
    backgroundColor: '#18181B',
    height: '52px',
    borderRadius: '14px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#FFFFFF',
    fontSize: '16px',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    transition: 'all 0.15s ease',
  },
  resultCardNew: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '16px',
    border: '1px solid #EFEFF2',
  },
  resultMainTitleNew: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#111',
    marginBottom: '20px',
  },
  circleContainerNew: {
    width: '130px',
    height: '130px',
    borderRadius: '65px',
    border: '8px solid #111',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '24px',
  },
  scoreTextNew: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#111',
  },
  percentageTextNew: {
    fontSize: '12px',
    color: '#666',
    marginTop: '2px',
  },
  statsRowNew: {
    display: 'flex',
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTop: '1px solid #EFEFF2',
    paddingTop: '16px',
  },
  statItemNew: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statDotNew: {
    width: '8px',
    height: '8px',
    borderRadius: '4px',
    marginBottom: '4px',
  },
  statLabelNew: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '2px',
  },
  statValueNew: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#111',
  },
  statDividerNew: {
    width: '1px',
    height: '24px',
    backgroundColor: '#EFEFF2',
  },
  errorBannerNew: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '14px',
    marginBottom: '20px',
    border: '1px solid #EFEFF2',
    justifyContent: 'center',
  },
  errorBannerTextNew: {
    fontSize: '13px',
    color: '#555',
  },
  resultPrimaryButton: {
    backgroundColor: '#111',
    borderRadius: '14px',
    height: '52px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#FFF',
    fontSize: '16px',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    width: '100%',
  },
  resultSecondaryButton: {
    backgroundColor: '#EFEFF2',
    borderRadius: '14px',
    height: '52px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#111',
    fontSize: '16px',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    width: '100%',
  },
  resultOutlineButton: {
    backgroundColor: 'transparent',
    borderRadius: '14px',
    height: '52px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#555',
    fontSize: '16px',
    fontWeight: 600,
    border: '1px solid #EFEFF2',
    cursor: 'pointer',
    width: '100%',
  },
  errorHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
  },
  errorMainTitle: {
    fontSize: '26px',
    fontWeight: 'bold',
    color: '#111',
    margin: 0,
    marginBottom: '2px',
  },
  errorSubCountText: {
    fontSize: '14px',
    color: '#666',
  },
  errorFilterButton: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: '8px 14px',
    borderRadius: '10px',
    border: '1px solid #EFEFF2',
    fontSize: '14px',
    fontWeight: 600,
    color: '#111',
    cursor: 'pointer',
  },
  errorCardWeb: {
    display: 'flex',
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    padding: '16px',
    alignItems: 'center',
    justifyContent: 'space-between',
    border: '1px solid #EFEFF2',
    cursor: 'pointer',
    transition: 'border-color 0.15s ease',
  },
  errorCardLeft: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
  },
  errorIconContainer: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#F2F2F5',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '12px',
    flexShrink: 0,
  },
  errorInfoContainer: {
    flex: 1,
  },
  errorSubjectName: {
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#111',
    marginBottom: '2px',
  },
  errorUnitName: {
    fontSize: '13px',
    color: '#555',
    marginBottom: '2px',
  },
  errorQNumberText: {
    fontSize: '12px',
    color: '#777',
  },
  errorCardRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  errorBadgeRow: {
    display: 'flex',
    gap: '6px',
  },
  errorWrongBadge: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#D32F2F',
    backgroundColor: '#FFDCDC',
    padding: '2px 6px',
    borderRadius: '6px',
  },
  errorCorrectBadge: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#2E7D32',
    backgroundColor: '#E8F5E9',
    padding: '2px 6px',
    borderRadius: '6px',
  },
  searchContainerDashboard: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    border: '1px solid #EFEFF2',
    borderRadius: '10px',
    padding: '0 12px',
    height: '40px',
    width: '240px',
  },
  searchInputDashboard: {
    border: 'none',
    outline: 'none',
    fontSize: '13px',
    color: '#111',
    width: '100%',
    backgroundColor: 'transparent',
  },
  scrollBodyDashboard: {
    display: 'flex',
    gap: '24px',
    marginTop: '20px',
  },
  leftColumnDashboard: {
    flex: 1.4,
  },
  welcomeSectionDashboard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '20px',
  },
  welcomeTitleDashboard: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#111',
    margin: 0,
    marginBottom: '4px',
  },
  welcomeSubDashboard: {
    fontSize: '15px',
    color: '#666',
  },
  dateBadgeDashboard: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: '8px 12px',
    borderRadius: '10px',
    border: '1px solid #EFEFF2',
  },
  dateTextDashboard: {
    fontSize: '13px',
    color: '#444',
    fontWeight: 500,
  },
  goalCardDashboard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
    border: '1px solid #EFEFF2',
  },
  goalHeaderRowDashboard: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  goalCardTitleDashboard: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#333',
  },
  goalTargetTextDashboard: {
    fontSize: '13px',
    color: '#777',
  },
  goalBigNumbersDashboard: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#111',
    marginBottom: '14px',
  },
  goalTotalDimDashboard: {
    fontSize: '16px',
    fontWeight: 'normal',
    color: '#777',
  },
  progressBarBgDashboard: {
    height: '8px',
    backgroundColor: '#EFEFF2',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  progressBarFillDashboard: {
    height: '100%',
    backgroundColor: '#111',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  goalFooterInfoDashboard: {
    fontSize: '12px',
    color: '#666',
  },
  sectionHeaderRowDashboard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  sectionHeadingDashboard: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#111',
  },
  seeAllTextDashboard: {
    fontSize: '13px',
    color: '#666',
    fontWeight: 600,
  },
  categorySubHeadingDashboard: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#666',
    marginBottom: '10px',
  },
  gridRowDashboard: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '12px',
  },
  gridCardDashboard: {
    display: 'flex',
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    padding: '16px',
    alignItems: 'center',
    border: '1px solid #EFEFF2',
    cursor: 'pointer',
    transition: 'border-color 0.15s ease, transform 0.15s ease',
  },
  cardIconBoxDashboard: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#F2F2F5',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '12px',
    flexShrink: 0,
  },
  cardTitleRowDashboard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2px',
  },
  cardSubjectTitleDashboard: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#111',
  },
  cardSubInfoDashboard: {
    fontSize: '12px',
    color: '#777',
    marginBottom: '8px',
  },
  miniBarBgDashboard: {
    height: '4px',
    backgroundColor: '#EFEFF2',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  miniBarFillDashboard: {
    height: '100%',
    backgroundColor: '#111',
    borderRadius: '2px',
  },
  percentLabelDashboard: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#444',
    marginLeft: '12px',
  },
  rightColumnDashboard: {
    flex: 1,
  },
  rightWidgetDashboard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '20px',
    border: '1px solid #EFEFF2',
  },
  widgetHeaderRowDashboard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  widgetTitleDashboard: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#111',
  },
  editTextDashboard: {
    fontSize: '13px',
    color: '#666',
    fontWeight: 500,
    cursor: 'pointer',
  },
  planItemDashboard: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#F9F9FB',
    borderRadius: '12px',
    padding: '12px',
    marginBottom: '10px',
    border: '1px solid #EFEFF2',
    cursor: 'pointer',
    transition: 'border-color 0.15s ease',
  },
  planNumberDashboard: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#111',
    backgroundColor: '#EFEFF2',
    padding: '6px 8px',
    borderRadius: '8px',
    flexShrink: 0,
  },
  planSubjectDashboard: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#111',
    marginBottom: '2px',
  },
  planDetailDashboard: {
    fontSize: '11px',
    color: '#777',
  },
  startPlanButtonDashboard: {
    backgroundColor: '#111',
    borderRadius: '12px',
    height: '48px',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#FFF',
    fontSize: '14px',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    marginTop: '6px',
    transition: 'opacity 0.15s ease',
  },
  statsGridDashboard: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
  },
  statBoxDashboard: {
    backgroundColor: '#F9F9FB',
    borderRadius: '12px',
    padding: '14px',
    border: '1px solid #EFEFF2',
  },
  statBoxLabelDashboard: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '4px',
  },
  statBoxValDashboard: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#111',
  },
  webContainer: {
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#F9F9FB',
    color: '#111',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  webSidebar: {
    width: '240px',
    minWidth: '240px',
    backgroundColor: '#FFFFFF',
    borderRight: '1px solid #EFEFF2',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '24px 16px',
    position: 'sticky',
    top: 0,
    height: '100vh',
    boxSizing: 'border-box',
    zIndex: 10,
  },
  sidebarBrand: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 8px 24px 8px',
  },
  sidebarLogoTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#111',
    letterSpacing: '-0.3px',
    lineHeight: 1.1,
  },
  sidebarLogoSubtitle: {
    fontSize: '11px',
    color: '#888',
    marginTop: '2px',
  },
  sidebarNav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  sidebarNavItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 14px',
    borderRadius: '10px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#666',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background-color 0.15s ease, color 0.15s ease',
    width: '100%',
  },
  sidebarNavItemActive: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 14px',
    borderRadius: '10px',
    backgroundColor: '#F0F0F3',
    border: 'none',
    color: '#111',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
  },
  sidebarQuoteBox: {
    padding: '16px 12px',
    borderTop: '1px solid #F2F2F5',
  },
  quoteMark: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#AAA',
    lineHeight: 1,
    marginBottom: '6px',
  },
  quoteContent: {
    fontSize: '12px',
    color: '#555',
    lineHeight: 1.4,
  },
  quoteFooter: {
    fontSize: '11px',
    color: '#999',
    marginTop: '6px',
  },
  webRightArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    height: '100vh',
    overflow: 'hidden',
  },
  webHeader: {
    height: '64px',
    minHeight: '64px',
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #EFEFF2',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 32px',
    boxSizing: 'border-box',
  },
  headerSearchBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    border: '1px solid #EFEFF2',
    borderRadius: '10px',
    padding: '0 14px',
    height: '40px',
    width: '320px',
  },
  headerSearchInput: {
    border: 'none',
    outline: 'none',
    fontSize: '13px',
    color: '#111',
    width: '100%',
    backgroundColor: 'transparent',
  },
  headerRightActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  adminNavHeaderButton: {
    backgroundColor: '#F4F4F7',
    border: '1px solid #E5E7EB',
    borderRadius: '9999px',
    padding: '7px 14px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#374151',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  headerIconBtn: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #EFEFF2',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
  },
  headerUserBadge: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    border: '1px solid #EFEFF2',
    borderRadius: '10px',
    padding: '6px 12px',
    cursor: 'pointer',
  },
  headerUserAvatar: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    backgroundColor: '#F2F2F5',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '8px',
  },
  headerUserName: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#111',
  },
  webMainScroll: {
    flex: 1,
    overflowY: 'auto',
    padding: '28px 32px',
    boxSizing: 'border-box',
  },
  dashboardContainer: {
    display: 'flex',
    gap: '28px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  dashboardLeftCol: {
    flex: 1.45,
    minWidth: 0,
  },
  dashboardRightCol: {
    flex: 1,
    minWidth: 0,
  },
  welcomeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '18px',
  },
  welcomeHeading: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#111',
    margin: 0,
    marginBottom: '4px',
  },
  welcomeSubheading: {
    fontSize: '14px',
    color: '#666',
  },
  dateBadgeContainer: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    border: '1px solid #EFEFF2',
    borderRadius: '12px',
    padding: '8px 14px',
  },
  dateBadgeTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#111',
  },
  dateBadgeSub: {
    fontSize: '11px',
    color: '#777',
  },
  goalCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '20px 24px',
    marginBottom: '20px',
    border: '1px solid #EFEFF2',
  },
  goalHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  goalTargetIconBox: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#F2F2F5',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '10px',
  },
  goalTitleText: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#111',
  },
  goalNumberRow: {
    marginBottom: '12px',
  },
  goalBigNum: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#111',
  },
  goalTotalDim: {
    fontSize: '16px',
    fontWeight: 'normal',
    color: '#777',
  },
  goalProgressBg: {
    height: '8px',
    backgroundColor: '#EFEFF2',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: '#111',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  goalFooterRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    fontSize: '12px',
    color: '#777',
  },
  sectionTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    marginTop: '20px',
  },
  sectionHeadingTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#111',
    margin: 0,
  },
  textLinkBtn: {
    background: 'none',
    border: 'none',
    color: '#666',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
  },
  categorySubTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#666',
    marginBottom: '10px',
  },
  subjectsGrid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '12px',
  },
  dashSubjectCard: {
    display: 'flex',
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    padding: '16px',
    alignItems: 'center',
    border: '1px solid #EFEFF2',
    cursor: 'pointer',
    transition: 'border-color 0.15s ease, transform 0.15s ease',
  },
  dashSubjectIconBox: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#F2F2F5',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '12px',
    flexShrink: 0,
  },
  dashSubjectTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2px',
  },
  dashSubjectName: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#111',
  },
  dashSubjectUnits: {
    fontSize: '12px',
    color: '#777',
    marginBottom: '6px',
  },
  dashMiniBarBg: {
    height: '4px',
    backgroundColor: '#EFEFF2',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  dashMiniBarFill: {
    height: '100%',
    backgroundColor: '#111',
    borderRadius: '2px',
  },
  dashPercentNum: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#444',
    marginLeft: '12px',
    flexShrink: 0,
  },
  quickAccessTitle: {
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#111',
    marginTop: '22px',
    marginBottom: '12px',
  },
  quickAccessRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '10px',
  },
  quickAccessCard: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '12px 10px',
    border: '1px solid #EFEFF2',
    cursor: 'pointer',
    transition: 'border-color 0.15s ease',
  },
  quickAccessIconBox: {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    backgroundColor: '#F2F2F5',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '8px',
    flexShrink: 0,
  },
  quickAccessTitleText: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#111',
    lineHeight: 1.2,
  },
  quickAccessSubText: {
    fontSize: '11px',
    color: '#777',
    marginTop: '2px',
  },
  widgetBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '18px',
    border: '1px solid #EFEFF2',
  },
  widgetHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },
  widgetTitleText: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#111',
  },
  widgetLinkBtn: {
    background: 'none',
    border: 'none',
    fontSize: '13px',
    color: '#666',
    fontWeight: 500,
    cursor: 'pointer',
    padding: 0,
  },
  planItemsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  planCardItem: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#F9F9FB',
    borderRadius: '12px',
    padding: '10px 12px',
    border: '1px solid #EFEFF2',
    cursor: 'pointer',
    transition: 'border-color 0.15s ease',
  },
  planNumBadge: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#111',
    backgroundColor: '#EFEFF2',
    padding: '6px 8px',
    borderRadius: '8px',
    flexShrink: 0,
  },
  planItemTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#111',
    marginBottom: '2px',
  },
  planItemSub: {
    fontSize: '11px',
    color: '#777',
  },
  startPlanBlackBtn: {
    backgroundColor: '#111',
    borderRadius: '12px',
    height: '44px',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#FFF',
    fontSize: '14px',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    marginTop: '12px',
    transition: 'opacity 0.15s ease',
  },
  statsHorizontalGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
  },
  statMiniBox: {
    backgroundColor: '#F9F9FB',
    borderRadius: '10px',
    padding: '12px 10px',
    border: '1px solid #EFEFF2',
    textAlign: 'center',
  },
  statMiniLabel: {
    fontSize: '11px',
    color: '#666',
    marginBottom: '4px',
    whiteSpace: 'nowrap',
  },
  statMiniVal: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#111',
  },
  errorSubCountMini: {
    fontSize: '12px',
    color: '#777',
    marginBottom: '12px',
    marginTop: '-8px',
  },
  errorItemsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  errorMiniItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 12px',
    backgroundColor: '#F9F9FB',
    borderRadius: '10px',
    border: '1px solid #EFEFF2',
    cursor: 'pointer',
  },
  errorItemTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#111',
  },
  errorItemSub: {
    fontSize: '11px',
    color: '#777',
  },
  errorRedPill: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#EF4444',
    backgroundColor: '#FEE2E2',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  mobileBottomNav: {
    display: 'none',
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '64px',
    backgroundColor: '#FFFFFF',
    borderTop: '1px solid #EFEFF2',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 1000,
    boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
  },
  mobileBottomNavItem: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    padding: '6px 0',
    cursor: 'pointer',
    gap: '3px',
  },
  mobileBottomNavItemActive: {},
  mobileBottomNavLabel: {
    fontSize: '11px',
    letterSpacing: '-0.2px',
  },
};

export default StudentQuiz;
