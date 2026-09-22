import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Subject, Unit, Topic, Question, OptionId, UserAnswer, UnitResult, QuestionBank } from '../types';
import { CompetencyRadarCard } from '../components/CompetencyRadarCard';
import { StudentAnalyticsCards } from '../components/StudentAnalyticsCards';
import { DetailedTopicAnalysisCard } from '../components/DetailedTopicAnalysisCard';
import { StudyCalendarCard } from '../components/StudyCalendarCard';
import { studentProgressService } from '../services/studentProgressService';
import { StudentSettingsView } from '../components/StudentSettingsView';
import { userProfileService, UserProfile } from '../services/userProfileService';
import { curriculumSearchService, CurriculumSearchItem } from '../services/curriculumSearchService';
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
  Lock,
  Database,
  Timer,
  Clock,
  Pause,
  RotateCcw,
  Zap,
  Flame,
  Award,
  Sun,
  Moon,
  Crown,
  WifiOff,
  LogOut,
} from 'lucide-react';
import { AuthModal } from '../components/AuthModal';
import { PricingPaywallModal } from '../components/PricingPaywallModal';
import { DenemeSetupModal } from '../components/DenemeSetupModal';
import { styles } from './StudentQuiz.styles';
import { authService, AuthUser } from '../services/authService';
import { subscriptionService, SubscriptionState } from '../services/subscriptionService';
import { spacedRepetitionService } from '../services/spacedRepetitionService';
import { themeService, PRESET_THEMES } from '../services/themeService';
import { useOnlineStatus } from '../services/networkService';
import {
  MockExamType,
  MOCK_EXAM_CONFIGS,
  generateRandomMockExam,
  saveWrongQuestionToMistakesBank,
  saveWrongQuestionsToMistakesBank,
  recordDenemeMistakesToMistakesBank,
  removeQuestionFromMistakesBank,
  getMistakesBankQuestions,
  getOrCreateMistakesBank,
  MISTAKES_BANK_ID,
} from '../services/mockExamService';

export interface StudentNotificationItem {
  id: string;
  icon: string;
  title: string;
  sub: string;
  time: string;
  unread: boolean;
  actionType: 'calendar' | 'radar' | 'errors' | 'deneme';
  badgeText?: string;
}

const INITIAL_STUDENT_NOTIFICATIONS: StudentNotificationItem[] = [
  {
    id: 'notif-1',
    icon: '🎯',
    title: 'Günlük hedefin tamamlandı!',
    sub: 'Bugün 60 soru çözdün. Çalışma takvimini ve hedeflerini gör.',
    time: '5 dk önce',
    unread: true,
    actionType: 'calendar',
    badgeText: 'Takvim & Hedef',
  },
  {
    id: 'notif-2',
    icon: '🔥',
    title: '7 günlük seri devam ediyor',
    sub: 'Düzenli soru çözme serini korumak için bugün de soru çöz.',
    time: '1 saat önce',
    unread: true,
    actionType: 'calendar',
    badgeText: 'Seri',
  },
  {
    id: 'notif-3',
    icon: '📊',
    title: 'Yeterlilik raporun hazır',
    sub: 'Ders ve konu bazlı akademik yeterlilik radarını incele.',
    time: '2 saat önce',
    unread: true,
    actionType: 'radar',
    badgeText: 'Radar',
  },
  {
    id: 'notif-4',
    icon: '⏱️',
    title: '20 Soruluk Deneme Sınavı',
    sub: 'Rastgele konulardan 20 soruyla canlı süreli sınav simülasyonu başlat.',
    time: 'Bugün',
    unread: true,
    actionType: 'deneme',
    badgeText: 'Deneme',
  },
  {
    id: 'notif-5',
    icon: '⚠️',
    title: 'Hata Havuzu & Yanlışlarım',
    sub: 'Yanlış yaptığın soruları tekrar çözerek kalıcı öğrenme sağla.',
    time: 'Dün',
    unread: false,
    actionType: 'errors',
    badgeText: 'Yanlışlarım',
  },
];

export const StudentQuiz: React.FC<{ onNavigateAdmin: () => void }> = ({ onNavigateAdmin }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [topicBanks, setTopicBanks] = useState<QuestionBank[]>([]);
  const [selectedBank, setSelectedBank] = useState<QuestionBank | null>(null);
  const [isLoadingBanks, setIsLoadingBanks] = useState<boolean>(false);
  const [unpublishedModalInfo, setUnpublishedModalInfo] = useState<{ topicTitle: string; questionCount: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'subjects' | 'errors' | 'profile' | 'settings'>('home');
  const [userProfile, setUserProfile] = useState<UserProfile>(() => userProfileService.getProfile());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CurriculumSearchItem[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  // ----------------------------------------------------
  // 'YANLIŞLARIM' ÖZEL SORU BANKASI SAYACI & DİNLENMESİ
  // ----------------------------------------------------
  const [mistakesBankCount, setMistakesBankCount] = useState<number>(() => {
    return getMistakesBankQuestions().length;
  });

  useEffect(() => {
    const handleMistakesUpdate = (e: any) => {
      const count = e?.detail?.totalCount ?? getMistakesBankQuestions().length;
      setMistakesBankCount(count);
    };
    window.addEventListener('kpss_mistakes_bank_updated', handleMistakesUpdate);
    return () => window.removeEventListener('kpss_mistakes_bank_updated', handleMistakesUpdate);
  }, []);

  // ----------------------------------------------------
  // DENEME MODU & CANLI SÜRE TUTMA (TIMER) DURUMLARI
  // ----------------------------------------------------
  const [isDenemeMode, setIsDenemeMode] = useState<boolean>(false);
  const [showDenemeSetupModal, setShowDenemeSetupModal] = useState<boolean>(false);
  const [denemeDurationMinutes, setDenemeDurationMinutes] = useState<number>(25); // 20, 25, 30 veya 0 (süresiz/kronometre)
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(25 * 60);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);
  const [denemeTotalElapsedSeconds, setDenemeTotalElapsedSeconds] = useState<number>(0);

  // ----------------------------------------------------
  // AUTH, ABONELİK (PAYWALL), ÇEVRİMDIŞI & TEMALAR
  // ----------------------------------------------------
  const [authUser, setAuthUser] = useState<AuthUser>(() => authService.getCurrentUser());
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const [subscription, setSubscription] = useState<SubscriptionState>(() => subscriptionService.getSubscription());
  const [showPricingModal, setShowPricingModal] = useState<boolean>(false);

  const isOnline = useOnlineStatus();
  const [selectedExamType, setSelectedExamType] = useState<MockExamType>('quick_20');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => themeService.getActiveTheme().isDark);
  const [leitnerStats, setLeitnerStats] = useState(() => spacedRepetitionService.getSummaryStats());
  const [leitnerFilter, setLeitnerFilter] = useState<'all' | 'due'>('all');

  useEffect(() => {
    const handleAuthChange = (e: any) => {
      setAuthUser(e?.detail?.user ?? authService.getCurrentUser());
    };
    const handleSubChange = (e: any) => {
      setSubscription(e?.detail?.subscription ?? subscriptionService.getSubscription());
    };
    const handleThemeChange = () => {
      setIsDarkMode(themeService.getActiveTheme().isDark);
    };
    const handleSrChange = () => {
      setLeitnerStats(spacedRepetitionService.getSummaryStats());
    };

    // İlk yüklemede aktif temayı uygula
    themeService.applyTheme(themeService.getActiveTheme());

    window.addEventListener('kpss_auth_changed', handleAuthChange);
    window.addEventListener('kpss_subscription_changed', handleSubChange);
    window.addEventListener('kpss_theme_changed', handleThemeChange);
    window.addEventListener('kpss_spaced_repetition_updated', handleSrChange);

    return () => {
      window.removeEventListener('kpss_auth_changed', handleAuthChange);
      window.removeEventListener('kpss_subscription_changed', handleSubChange);
      window.removeEventListener('kpss_theme_changed', handleThemeChange);
      window.removeEventListener('kpss_spaced_repetition_updated', handleSrChange);
    };
  }, []);

  const handleToggleDarkMode = () => {
    const current = themeService.getActiveTheme();
    if (current.isDark) {
      const light = PRESET_THEMES.find((t) => !t.isDark) || PRESET_THEMES[0];
      themeService.setActiveTheme(light);
      setIsDarkMode(false);
    } else {
      const dark = PRESET_THEMES.find((t) => t.isDark) || PRESET_THEMES[1];
      themeService.setActiveTheme(dark);
      setIsDarkMode(true);
    }
  };

  useEffect(() => {
    const handleProfileUpdate = () => {
      setUserProfile(userProfileService.getProfile());
    };
    window.addEventListener('kpss_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('kpss_profile_updated', handleProfileUpdate);
  }, []);

  // ----------------------------------------------------
  // GELİŞMİŞ MÜFREDAT & KATEGORİ ARAMA FONKSİYONLARI
  // ----------------------------------------------------
  // Arama motorunu önden ısıt (warmup cache)
  useEffect(() => {
    curriculumSearchService.getIndex().catch(console.warn);
  }, []);

  // Arama sorgusu değiştikçe anlık sonuçları getir
  useEffect(() => {
    let isCancelled = false;
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setIsSearchOpen(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    curriculumSearchService.search(q).then((results) => {
      if (!isCancelled) {
        setSearchResults(results);
        setIsSearchOpen(true);
        setIsSearching(false);
      }
    }).catch(() => {
      if (!isCancelled) {
        setIsSearching(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [searchQuery]);

  // Arama kutusu dışına tıklandığında açılır menüyü kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Arama sonucuna tıklandığında ilgili ders, ünite, konu veya kategoriye doğrudan git
  const handleSelectSearchResult = async (item: CurriculumSearchItem) => {
    setIsSearchOpen(false);
    setSearchQuery('');

    // 1. Kategori / Özel Modül Seçimi
    if (item.type === 'category') {
      if (item.categoryKey === 'deneme') {
        handleOpenDenemeSetup();
      } else if (item.categoryKey === 'mistakes') {
        setActiveTab('errors');
        setViewState('subjects');
      } else if (item.categoryKey === 'radar') {
        setActiveTab('home');
        setViewState('subjects');
      } else if (item.categoryKey === 'calendar') {
        setActiveTab('profile');
        setViewState('subjects');
      } else if (item.categoryKey === 'settings') {
        setActiveTab('settings');
        setViewState('subjects');
      }
      return;
    }

    // 2. Ders Seçimi (Doğrudan o dersin üniteler sayfasına gider)
    if (item.type === 'subject' && item.subject) {
      setActiveTab('subjects');
      await handleSelectSubject(item.subject);
      return;
    }

    // 3. Ünite Seçimi (Dersi seçer, üniteleri yükler ve o ünitenin alt konularına gider)
    if (item.type === 'unit' && item.subject && item.unit) {
      setActiveTab('subjects');
      setSelectedSubject(item.subject);
      try {
        const unitList = await api.getUnits(item.subject.id);
        setUnits(unitList);
      } catch {}
      await handleSelectUnit(item.unit);
      return;
    }

    // 4. Alt Konu / Kazanım Seçimi (Dersi ve üniteyi bağlar, konunun test ve soru bankaları detayına gider)
    if (item.type === 'topic' && item.subject && item.unit && item.topic) {
      setActiveTab('subjects');
      setSelectedSubject(item.subject);
      try {
        const unitList = await api.getUnits(item.subject.id);
        setUnits(unitList);
      } catch {}
      setSelectedUnit(item.unit);
      try {
        const topicList = await api.getTopics(item.unit.id);
        setTopics(topicList);
      } catch {}
      await handleSelectTopic(item.topic);
      return;
    }
  };

  // Arama kutusunda Enter tuşuna basıldığında en uygun ilk sonuca otomatik git
  const handleSearchSubmit = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0) {
        handleSelectSearchResult(searchResults[0]);
      } else if (searchQuery.trim()) {
        const res = await curriculumSearchService.search(searchQuery);
        if (res.length > 0) {
          handleSelectSearchResult(res[0]);
        } else {
          setActiveTab('subjects');
          setViewState('subjects');
          setIsSearchOpen(false);
        }
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
  };

  // ----------------------------------------------------
  // BİLDİRİM MERKEZİ STATE VE ETKİLEŞİMLERİ
  // ----------------------------------------------------
  const [notifications, setNotifications] = useState<StudentNotificationItem[]>(() => {
    try {
      const stored = localStorage.getItem('kpss_student_notifications');
      if (stored) return JSON.parse(stored);
    } catch {}
    return INITIAL_STUDENT_NOTIFICATIONS;
  });

  const saveNotifications = (newList: StudentNotificationItem[]) => {
    setNotifications(newList);
    try {
      localStorage.setItem('kpss_student_notifications', JSON.stringify(newList));
    } catch {}
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  // Bildirime tıklandığında okundu say ve ilgili sayfaya/özelliğe yönlendir
  const handleNotificationClick = (notif: StudentNotificationItem) => {
    const updated = notifications.map((n) =>
      n.id === notif.id ? { ...n, unread: false } : n
    );
    saveNotifications(updated);
    setShowNotifications(false);

    switch (notif.actionType) {
      case 'calendar':
        setActiveTab('profile');
        setViewState('subjects');
        break;
      case 'radar':
        setActiveTab('home');
        setViewState('subjects');
        break;
      case 'errors':
        setActiveTab('errors');
        setViewState('subjects');
        break;
      case 'deneme':
        handleOpenDenemeSetup();
        break;
      default:
        setActiveTab('home');
        setViewState('subjects');
        break;
    }
  };

  // Tüm bildirimleri okundu olarak işaretleme
  const handleMarkAllNotificationsRead = () => {
    const updated = notifications.map((n) => ({ ...n, unread: false }));
    saveNotifications(updated);
  };

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
    setIsLoadingBanks(true);
    try {
      const banks = await api.getQuestionBanks(topic.id, selectedUnit?.id);
      setTopicBanks(banks);
      if (banks.length > 0) {
        setSelectedBank(banks[0]);
        const qList = await api.getQuestions(topic.id, banks[0].id);
        setQuestions(qList);
      } else {
        setSelectedBank(null);
        const qList = await api.getQuestions(topic.id);
        setQuestions(qList);
      }
    } catch {
      setTopicBanks([]);
      setSelectedBank(null);
      setQuestions([]);
    } finally {
      setIsLoadingBanks(false);
    }
    setViewState('unit-detail');
  };

  const handleSelectBank = async (bank: QuestionBank) => {
    setSelectedBank(bank);
    if (selectedTopic) {
      try {
        const qList = await api.getQuestions(selectedTopic.id, bank.id);
        setQuestions(qList);
      } catch {
        setQuestions([]);
      }
    }
  };

  useEffect(() => {
    let interval: any = null;
    if (isDenemeMode && (viewState === 'quiz' || viewState === 'feedback') && !isCompleted && !isTimerPaused) {
      interval = setInterval(() => {
        setDenemeTotalElapsedSeconds((prev) => prev + 1);
        setTimeRemainingSeconds((prev) => {
          if (denemeDurationMinutes > 0) {
            if (prev <= 1) {
              clearInterval(interval);
              setIsCompleted(true);
              return 0;
            }
            return prev - 1;
          } else {
            return prev + 1;
          }
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isDenemeMode, viewState, isCompleted, isTimerPaused, denemeDurationMinutes]);

  // Deneme Modu tamamlandığında (zaman aşımı, erken bitirme veya son soruya ulaşma)
  // tüm yanlış yapılan soruları otomatik olarak 'Yanlışlarım' özel soru bankasına kaydet
  useEffect(() => {
    if (isCompleted && isDenemeMode && questions.length > 0) {
      recordDenemeMistakesToMistakesBank(questions, userAnswers);
    }
  }, [isCompleted, isDenemeMode, questions, userAnswers]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleOpenDenemeSetup = () => {
    setShowDenemeSetupModal(true);
  };

  const handleStartDenemeExam = (durationMinutes: number = denemeDurationMinutes, examType: MockExamType = selectedExamType) => {
    const config = MOCK_EXAM_CONFIGS[examType] || MOCK_EXAM_CONFIGS.quick_20;
    const targetCount = config.questionCount || 20;
    const mockQuestions = generateRandomMockExam(targetCount, examType);
    setQuestions(mockQuestions);
    setCurrentIndex(0);
    setUserAnswers({});
    setIsCompleted(false);
    setStagedOption(null);
    setIsDenemeMode(true);
    setDenemeDurationMinutes(durationMinutes);
    setTimeRemainingSeconds(durationMinutes > 0 ? durationMinutes * 60 : 0);
    setDenemeTotalElapsedSeconds(0);
    setIsTimerPaused(false);
    setStartTime(Date.now());
    setSelectedSubject(null);
    setSelectedUnit(null);
    setSelectedTopic(null);
    setSelectedBank(null);
    setShowDenemeSetupModal(false);
    setViewState('quiz');
  };

  const handleStartQuiz = () => {
    setIsDenemeMode(false);
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

    if (!isCorrect) {
      if (selectedUnit) {
        api.recordWrongAnswer(currentQ.id, selectedUnit.id, stagedOption, currentQ.correctOption);
      }
      // Deneme Modu'nda yanlış yapılan soruları anında 'Yanlışlarım' özel soru bankasına kaydet
      if (isDenemeMode) {
        saveWrongQuestionToMistakesBank(currentQ);
      }
    } else if (isCorrect) {
      api.markQuestionResolved(currentQ.id);
      if (selectedBank?.id === MISTAKES_BANK_ID) {
        removeQuestionFromMistakesBank(currentQ.id);
      }
    }

    // Aralıklı tekrar (Spaced Repetition / Leitner 5-Kutu) kaydı
    spacedRepetitionService.recordReviewResult(currentQ.id, isCorrect);
    setLeitnerStats(spacedRepetitionService.getSummaryStats());

    // Offline-First Idempotent Soru Çözümü & Bulut Senkronizasyonu (question_attempts & spaced_repetition_cards)
    api.recordQuestionAttempt({
      questionId: currentQ.id,
      selectedOption: stagedOption,
      isCorrect,
      timeSpentSeconds: 5,
    }).catch(console.warn);

    // Gerçek öğrenci analitiğine kaydet
    const topicKey = currentQ?.subjectTitle
      ? `${currentQ.subjectTitle} - ${currentQ.topicTitle || 'Deneme'}`
      : selectedTopic?.title || selectedTopic?.id || selectedUnit?.title || 'Genel';
    studentProgressService.recordAnswer(topicKey, isCorrect);

    setViewState('feedback');
  };

  const handleNext = () => {
    if (currentIndex === questions.length - 1) {
      if (isDenemeMode) {
        const wrongOnes = questions.filter((q) => userAnswers[q.id] && !userAnswers[q.id].isCorrect);
        if (wrongOnes.length > 0) {
          saveWrongQuestionsToMistakesBank(wrongOnes);
        }
      }
      setIsCompleted(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setStagedOption(null);
    }
  };

  const handleNextFromFeedback = () => {
    if (currentIndex === questions.length - 1) {
      if (isDenemeMode) {
        const wrongOnes = questions.filter((q) => userAnswers[q.id] && !userAnswers[q.id].isCorrect);
        if (wrongOnes.length > 0) {
          saveWrongQuestionsToMistakesBank(wrongOnes);
        }
      }
      setIsCompleted(true);
      setViewState('quiz');
    } else {
      setCurrentIndex((prev) => prev + 1);
      setStagedOption(null);
      setViewState('quiz');
    }
  };

  // 'Yanlışlarım' Özel Soru Bankasını Başlatma Fonksiyonu
  const handleStartMistakesBankQuiz = () => {
    const mistakesQuestions = getMistakesBankQuestions();
    if (mistakesQuestions.length === 0) {
      alert("'Yanlışlarım' soru bankasında henüz soru bulunmuyor. Deneme sınavlarında yanlış çözdüğünüz sorular otomatik olarak buraya kaydedilir.");
      return;
    }
    setIsDenemeMode(false);
    setSelectedSubject(null);
    setSelectedUnit(null);
    setSelectedTopic(null);
    setSelectedBank(getOrCreateMistakesBank());
    setQuestions(mistakesQuestions);
    setCurrentIndex(0);
    setUserAnswers({});
    setIsCompleted(false);
    setStagedOption(null);
    setStartTime(Date.now());
    setViewState('quiz');
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
    if (isDenemeMode) {
      handleStartDenemeExam(denemeDurationMinutes);
      return;
    }
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

    if (isDenemeMode) {
      const totalTime = denemeDurationMinutes > 0
        ? Math.max(1, (denemeDurationMinutes * 60) - timeRemainingSeconds)
        : Math.max(1, denemeTotalElapsedSeconds);
      const spentMins = Math.floor(totalTime / 60);
      const spentSecs = totalTime % 60;
      const avgSecsPerQ = Math.round(totalTime / (total || 20));

      // Konu / Ders bazlı dağılım hesapla
      const subjectStats: Record<string, { correct: number; total: number }> = {};
      questions.forEach((q) => {
        const sub = q.subjectTitle || 'Karma Alan';
        if (!subjectStats[sub]) subjectStats[sub] = { correct: 0, total: 0 };
        subjectStats[sub].total++;
        if (userAnswers[q.id]?.isCorrect) {
          subjectStats[sub].correct++;
        }
      });

      return (
        <div>
          {/* Üst Geri Tuşu ve Başlık */}
          <div style={styles.unitHeader}>
            <button
              onClick={() => {
                setIsDenemeMode(false);
                setViewState('subjects');
                setActiveTab('home');
              }}
              style={styles.unitBackButton}
              title="Ana Sayfaya Dön"
            >
              <ChevronLeft size={22} color="#111" />
            </button>
            <div style={styles.unitDetailHeaderTitle}>Deneme Sınavı Raporu</div>
            <div style={{ width: '40px' }} />
          </div>

          {/* Sonuç Kartı / Başarı Halkası Alanı */}
          <div style={styles.resultCardNew}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', backgroundColor: '#F1F5F9', color: '#334155', fontSize: '11px', fontWeight: 700, marginBottom: '8px' }}>
              <Award size={14} />
              <span>20 SORULUK GENEL DENEME</span>
            </div>
            <div style={styles.resultMainTitleNew}>Deneme Sınavı Tamamlandı!</div>

            {/* Başarı Halkası */}
            <div style={styles.circleContainerNew}>
              <div style={styles.scoreTextNew}>{correct} / {total}</div>
              <div style={styles.percentageTextNew}>%{percentage} Başarı</div>
            </div>

            {/* Doğru - Yanlış - Boş - Net İstatistikleri */}
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
              <div style={styles.statDividerNew} />
              <div style={styles.statItemNew}>
                <div style={{ ...styles.statDotNew, backgroundColor: '#4F46E5' }} />
                <div style={styles.statLabelNew}>KPSS Net</div>
                <div style={{ ...styles.statValueNew, color: '#4F46E5' }}>
                  {Math.max(0, correct - wrong * 0.25).toFixed(2).replace(/\.00$/, '')}
                </div>
              </div>
            </div>
          </div>

          {/* SÜRE VE HIZ ANALİZ KARTI */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '16px',
            marginBottom: '16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            textAlign: 'center',
          }}>
            <div style={{ padding: '10px', backgroundColor: '#F8FAFC', borderRadius: '10px' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <Clock size={13} />
                Toplam Süre
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>
                {spentMins} dk {spentSecs} sn
              </div>
            </div>

            <div style={{ padding: '10px', backgroundColor: '#F8FAFC', borderRadius: '10px' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <Zap size={13} />
                Soru Başına
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>
                {avgSecsPerQ} sn
              </div>
            </div>

            <div style={{ padding: '10px', backgroundColor: '#F8FAFC', borderRadius: '10px' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <Timer size={13} />
                Sınav Temposu
              </div>
              <div style={{
                fontSize: '12px',
                fontWeight: 700,
                color: avgSecsPerQ <= 60 ? '#15803D' : avgSecsPerQ <= 75 ? '#2563EB' : '#D97706',
                marginTop: '5px',
              }}>
                {avgSecsPerQ <= 60 ? '⚡ Çok Hızlı' : avgSecsPerQ <= 75 ? '🎯 İdeal KPSS' : '⏳ Normal'}
              </div>
            </div>
          </div>

          {/* DERS BAZLI BAŞARI DAĞILIMI */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '16px',
            marginBottom: '16px',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BarChart2 size={16} color="#4F46E5" />
              <span>Ders Bazlı Performans Dağılımı</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(subjectStats).map(([subName, stat]) => {
                const subPct = Math.round((stat.correct / stat.total) * 100);
                return (
                  <div key={subName} style={{ padding: '10px 12px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{subName}</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: stat.correct === stat.total ? '#16A34A' : '#475569' }}>
                        {stat.correct} / {stat.total} Doğru (%{subPct})
                      </span>
                    </div>
                    <div style={{ height: '5px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${subPct}%`,
                          backgroundColor: subPct >= 75 ? '#16A34A' : subPct >= 50 ? '#F59E0B' : '#EF4444',
                          borderRadius: '3px',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Yanlışlarım Özel Soru Bankası Bilgisi */}
          {wrong > 0 && (
            <div style={{
              backgroundColor: '#FEF2F2',
              borderRadius: '14px',
              border: '1px solid #FECACA',
              padding: '14px 16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: '#FEE2E2',
                  color: '#DC2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Database size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#991B1B' }}>
                    'Yanlışlarım' Soru Bankasına Kaydedildi
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#B91C1C', marginTop: '2px' }}>
                    Bu denemedeki {wrong} yanlış soru otomatik olarak <b>'Yanlışlarım'</b> özel soru bankasına eklendi.
                  </div>
                </div>
              </div>

              <button
                onClick={handleStartMistakesBankQuiz}
                style={{
                  padding: '8px 14px',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)',
                }}
              >
                <BookOpen size={13} />
                <span>Yanlışlarım Bankasını Aç ({mistakesBankCount})</span>
              </button>
            </div>
          )}

          {/* Yönlendirme Butonları */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => handleStartDenemeExam(denemeDurationMinutes)}
              style={{
                ...styles.resultPrimaryButton,
                backgroundColor: '#111111',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <RotateCcw size={16} />
              Yeni Deneme Sınavı Başlat (20 Soru)
            </button>

            {mistakesBankCount > 0 && (
              <button
                onClick={handleStartMistakesBankQuiz}
                style={{
                  ...styles.resultSecondaryButton,
                  backgroundColor: '#FFF1F2',
                  color: '#E11D48',
                  border: '1px solid #FECDD3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Database size={16} />
                <span>'Yanlışlarım' Özel Soru Bankasını Çöz ({mistakesBankCount} Soru)</span>
              </button>
            )}

            {wrong > 0 && (
              <button
                onClick={handleRetryWrong}
                style={styles.resultSecondaryButton}
              >
                Sadece Bu Denemedeki Hataları Çöz ({wrong} Soru)
              </button>
            )}

            <button
              onClick={() => {
                setIsDenemeMode(false);
                setViewState('subjects');
                setActiveTab('home');
              }}
              style={styles.resultOutlineButton}
            >
              Ana Sayfaya Dön
            </button>
          </div>
        </div>
      );
    }

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

          {/* Doğru - Yanlış - Boş - Net İstatistikleri */}
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
            <div style={styles.statDividerNew} />
            <div style={styles.statItemNew}>
              <div style={{ ...styles.statDotNew, backgroundColor: '#4F46E5' }} />
              <div style={styles.statLabelNew}>KPSS Net</div>
              <div style={{ ...styles.statValueNew, color: '#4F46E5' }}>
                {Math.max(0, correct - wrong * 0.25).toFixed(2).replace(/\.00$/, '')}
              </div>
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
          background-color: #FFFFFF;
          border: 1px solid #EFEFF2;
          border-radius: 16px;
          padding: 14px 18px;
          margin-bottom: 16px;
          gap: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .deneme-theme-banner:hover {
          border-color: #D1D5DB;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
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
          background-color: #FFFFFF;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04);
          z-index: 2500;
          overflow: hidden;
        }
        .search-result-item:hover {
          background-color: #F8FAFC !important;
        }
        .notification-item:hover {
          background-color: #F1F5F9 !important;
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
            background-color: #FFFFFF !important;
            box-shadow: 0 -3px 12px rgba(0, 0, 0, 0.05) !important;
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
              style={activeTab === 'home' && viewState === 'subjects' && !isDenemeMode ? styles.sidebarNavItemActive : styles.sidebarNavItem}
            >
              <Home size={18} style={{ marginRight: '12px' }} />
              <span>Ana Sayfa</span>
            </button>

            <button
              onClick={handleOpenDenemeSetup}
              style={isDenemeMode && viewState === 'quiz' ? styles.sidebarNavItemActive : styles.sidebarNavItem}
            >
              <Timer
                size={18}
                color={isDenemeMode && viewState === 'quiz' ? '#111' : '#666'}
                style={{ marginRight: '12px', flexShrink: 0 }}
              />
              <span>Deneme Sınavı</span>
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
          <div
            ref={searchContainerRef}
            className="header-search-box"
            style={{ ...styles.headerSearchBox, position: 'relative' }}
          >
            <Search size={16} color="#888" style={{ marginRight: '10px', flexShrink: 0 }} />
            <input
              placeholder="Ders, ünite veya konu ara..."
              style={styles.headerSearchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim().length > 0) setIsSearchOpen(true);
              }}
              onKeyDown={handleSearchSubmit}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', color: '#999' }}
                title="Aramayı Temizle"
              >
                ✕
              </button>
            )}

            {/* ARAMA SONUÇLARI AÇILIR MENÜSÜ (DROPDOWN) */}
            {isSearchOpen && searchQuery.trim().length > 0 && (
              <div className="search-dropdown-menu">
                {/* Üst Durum Başlığı */}
                <div style={{
                  padding: '10px 14px',
                  backgroundColor: '#F8FAFC',
                  borderBottom: '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#64748B',
                }}>
                  <span>Arama Sonuçları</span>
                  <span>{isSearching ? 'Aranıyor...' : `${searchResults.length} sonuç`}</span>
                </div>

                {/* Sonuç Listesi */}
                <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                  {searchResults.length === 0 && !isSearching ? (
                    <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                      <Search size={22} color="#94A3B8" style={{ marginBottom: '8px' }} />
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                        Sonuç bulunamadı
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>
                        "{searchQuery}" ile eşleşen ders, ünite veya konu bulunamadı.
                      </div>
                    </div>
                  ) : (
                    searchResults.map((item) => (
                      <div
                        key={item.id}
                        className="search-result-item"
                        onClick={() => handleSelectSearchResult(item)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderBottom: '1px solid #F1F5F9',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: '#F1F5F9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            {item.type === 'category' ? (
                              item.categoryKey === 'deneme' ? <Timer size={16} color="#D97706" /> :
                              item.categoryKey === 'mistakes' ? <AlertTriangle size={16} color="#DC2626" /> :
                              item.categoryKey === 'radar' ? <BarChart2 size={16} color="#4338CA" /> :
                              <Zap size={16} color="#D97706" />
                            ) : item.type === 'subject' ? (
                              <BookOpen size={16} color="#1D4ED8" />
                            ) : item.type === 'unit' ? (
                              <FileText size={16} color="#7E22CE" />
                            ) : (
                              <Target size={16} color="#15803D" />
                            )}
                          </div>

                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                              <span style={{
                                backgroundColor: item.badgeBg,
                                color: item.badgeColor,
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                flexShrink: 0,
                              }}>
                                {item.typeLabel}
                              </span>
                              <span style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#0F172A',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}>
                                {item.title}
                              </span>
                            </div>
                            <div style={{
                              fontSize: '11px',
                              color: '#64748B',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}>
                              {item.breadcrumb}
                            </div>
                          </div>
                        </div>

                        <ChevronRight size={15} color="#94A3B8" style={{ flexShrink: 0, marginLeft: '8px' }} />
                      </div>
                    ))
                  )}
                </div>

                {/* Alt Kısayol İpuçları */}
                <div style={{
                  padding: '7px 14px',
                  backgroundColor: '#F8FAFC',
                  borderTop: '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11px',
                  color: '#94A3B8',
                }}>
                  <span>↵ Enter: İlk sonuca git</span>
                  <span>ESC: Kapat</span>
                </div>
              </div>
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
                    <div style={{
                      padding: '14px 18px',
                      borderBottom: '1px solid #F3F4F6',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#F9FAFB',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>Bildirimler</span>
                        {unreadCount > 0 && (
                          <span style={{
                            backgroundColor: '#EF4444',
                            color: '#FFFFFF',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '1px 7px',
                            borderRadius: '9999px',
                          }}>
                            {unreadCount} yeni
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 ? (
                        <button
                          type="button"
                          onClick={handleMarkAllNotificationsRead}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#4F46E5',
                            fontSize: '12px',
                            fontWeight: 600,
                            padding: '4px 6px',
                            borderRadius: '6px',
                          }}
                        >
                          Tümünü Okundu Say
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#16A34A', fontWeight: 600 }}>Tümü okundu ✓</span>
                      )}
                    </div>

                    <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className="notification-item"
                          onClick={() => handleNotificationClick(n)}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                            padding: '12px 16px',
                            backgroundColor: n.unread ? '#F8FAFC' : '#FFFFFF',
                            borderBottom: '1px solid #F1F5F9',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s ease',
                          }}
                        >
                          <div style={{
                            fontSize: '20px',
                            lineHeight: 1,
                            flexShrink: 0,
                            marginTop: '2px',
                          }}>
                            {n.icon}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '6px',
                              marginBottom: '3px',
                            }}>
                              <span style={{
                                fontSize: '13px',
                                fontWeight: n.unread ? 700 : 600,
                                color: n.unread ? '#0F172A' : '#334155',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}>
                                {n.title}
                              </span>
                              {n.badgeText && (
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  color: '#6366F1',
                                  backgroundColor: '#EEF2FF',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  flexShrink: 0,
                                }}>
                                  {n.badgeText}
                                </span>
                              )}
                            </div>

                            <div style={{
                              fontSize: '12px',
                              color: '#64748B',
                              lineHeight: '16px',
                              marginBottom: '4px',
                            }}>
                              {n.sub}
                            </div>

                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}>
                              <span style={{ fontSize: '11px', color: '#94A3B8' }}>{n.time}</span>
                              <span style={{ fontSize: '11px', color: '#4F46E5', fontWeight: 600 }}>Görüntüle →</span>
                            </div>
                          </div>

                          {n.unread && (
                            <div style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#3B82F6',
                              flexShrink: 0,
                              marginTop: '6px',
                            }} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Koyu / Açık Tema Hızlı Değiştirme */}
            <button
              type="button"
              onClick={handleToggleDarkMode}
              style={{
                ...styles.headerIconBtn,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              title={isDarkMode ? "Açık Temaya Geç" : "Karanlık Temaya Geç"}
              aria-label="Karanlık Mod Değiştir"
            >
              {isDarkMode ? <Sun size={18} color="#F59E0B" /> : <Moon size={18} color="#475569" />}
            </button>

            {/* PRO / Abonelik Butonu - Şimdilik deaktif edildi (ileride ayrı bir sayfaya yerleştirilecek) */}
            {/*
            <button
              type="button"
              onClick={() => setShowPricingModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '9999px',
                border: 'none',
                background: subscription.tier !== 'free'
                  ? 'linear-gradient(135deg, #10B981, #059669)'
                  : 'linear-gradient(135deg, #6366F1, #4F46E5)',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
              }}
              title="Abonelik Paketleri & PRO Avantajlar"
            >
              <Crown size={14} color="#FFFFFF" />
              <span>{subscription.tier !== 'free' ? 'PRO VIP' : 'PRO Paketler'}</span>
            </button>
            */}

            {/* Giriş / Profil Alanı */}
            {!authService.isUserLoggedIn() ? (
              <button
                type="button"
                onClick={() => {
                  setAuthModalMode('login');
                  setShowAuthModal(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <User size={14} color="#FFFFFF" />
                <span>Giriş Yap</span>
              </button>
            ) : (
              <div style={{ position: 'relative' }} ref={userDropdownRef}>
                <div
                  onClick={() => setShowUserDropdown((prev) => !prev)}
                  style={{ ...styles.headerUserBadge, cursor: 'pointer' }}
                  title="Hesap ve Ayarlar"
                >
                  <div style={styles.headerUserAvatar}>
                    <User size={14} color="#333" />
                  </div>
                  <span style={styles.headerUserName}>{authUser?.name?.split(' ')[0] || userProfile.name.split(' ')[0] || 'Hesabım'}</span>
                  <ChevronDown size={14} color="#666" style={{ marginLeft: '4px' }} />
                </div>

                {showUserDropdown && (
                  <>
                    <div
                      onClick={() => setShowUserDropdown(false)}
                      style={{ position: 'fixed', inset: 0, zIndex: 199 }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: '210px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                      border: '1px solid #E2E8F0',
                      padding: '8px 0',
                      zIndex: 200,
                    }}>
                      <div style={{ padding: '8px 16px', borderBottom: '1px solid #F1F5F9' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{authUser?.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis' }}>{authUser?.email}</div>
                        <div style={{ marginTop: '4px' }}>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            color: subscription.tier !== 'free' ? '#059669' : '#64748B',
                            backgroundColor: subscription.tier !== 'free' ? '#ECFDF5' : '#F1F5F9',
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}>
                            {subscription.tier !== 'free' ? 'PRO Üye' : 'Ücretsiz Plan'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setShowUserDropdown(false);
                          setActiveTab('profile');
                          setViewState('subjects');
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 16px',
                          background: 'none',
                          border: 'none',
                          fontSize: '13px',
                          color: '#334155',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <User size={15} color="#64748B" />
                        <span>Profilim</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowUserDropdown(false);
                          setShowPricingModal(true);
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 16px',
                          background: 'none',
                          border: 'none',
                          fontSize: '13px',
                          color: '#334155',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <Crown size={15} color="#EAB308" />
                        <span>PRO Paketler</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowUserDropdown(false);
                          setActiveTab('settings');
                          setViewState('subjects');
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 16px',
                          background: 'none',
                          border: 'none',
                          fontSize: '13px',
                          color: '#334155',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <Settings size={15} color="#64748B" />
                        <span>Ayarlar</span>
                      </button>

                      <div style={{ height: '1px', backgroundColor: '#F1F5F9', margin: '4px 0' }} />

                      <button
                        type="button"
                        onClick={async () => {
                          setShowUserDropdown(false);
                          await authService.logout();
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 16px',
                          background: 'none',
                          border: 'none',
                          fontSize: '13px',
                          color: '#DC2626',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <LogOut size={15} color="#DC2626" />
                        <span>Çıkış Yap</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Ana İçerik Scroll Alanı */}
        <main className="web-main-scroll" style={styles.webMainScroll}>
          {/* Çevrimdışı Bildirim Çubuğu */}
          {!isOnline && (
            <div style={{
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
            }}>
              <WifiOff size={18} color="#DC2626" />
              <span>İnternet bağlantısı kesildi. Çevrimdışı moddasınız; indirilmiş soruları ve yerel verilerinizi kesintisiz kullanabilirsiniz.</span>
            </div>
          )}
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

                {/* KPSS DENEME MODU KARTI (Mevcut Görsel Temaya Tam Uyumlu & Mobilde Kompakt) */}
                <div className="deneme-theme-banner" style={styles.denemeThemeCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <div style={styles.denemeThemeIconBox}>
                      <Timer size={20} color="#111" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={styles.denemeThemeTitle}>KPSS Deneme Modu</span>
                        <span style={styles.denemeThemeBadge}>20 Soru • Süreli</span>
                      </div>
                      <div className="deneme-desc-text" style={styles.denemeThemeDesc}>
                        Farklı konulardan dengeli 20 soru, canlı süre takibi ve tempo analizi
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleOpenDenemeSetup}
                    className="deneme-action-btn"
                    style={styles.denemeThemeBtn}
                  >
                    <Play size={13} fill="#FFFFFF" />
                    <span className="deneme-btn-desktop-text">Denemeyi Başlat</span>
                    <span className="deneme-btn-mobile-text">Başlat</span>
                  </button>
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
                    onClick={handleOpenDenemeSetup}
                    style={styles.quickAccessCard}
                  >
                    <div style={styles.quickAccessIconBox}>
                      <Timer size={16} color="#111" />
                    </div>
                    <div>
                      <div style={styles.quickAccessTitleText}>Deneme Sınavı</div>
                      <div style={styles.quickAccessSubText}>20 Soru • Süreli</div>
                    </div>
                  </div>

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
                      <div style={{ ...styles.quickAccessTitleText, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Hata Havuzu</span>
                        {mistakesBankCount > 0 && (
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '8px',
                            backgroundColor: '#FEE2E2',
                            color: '#DC2626',
                          }}>
                            {mistakesBankCount}
                          </span>
                        )}
                      </div>
                      <div style={styles.quickAccessSubText}>
                        {mistakesBankCount > 0 ? "'Yanlışlarım' soru bankası" : 'Yanlışlarını tekrar et'}
                      </div>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <h1 style={{ ...styles.mainTitle, margin: 0 }}>Dersler</h1>
                <button
                  onClick={handleOpenDenemeSetup}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    backgroundColor: '#111111',
                    color: '#FFFFFF',
                    borderRadius: '10px',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <Timer size={15} />
                  <span>Deneme Sınavı (20 Soru)</span>
                </button>
              </div>
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

              {/* ARALIKLI TEKRAR (SPACED REPETITION / LEITNER 5-KUTU SİSTEMİ) KARTI */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E0E7FF',
                padding: '20px',
                marginBottom: '18px',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.06)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: '#EEF2FF',
                      color: '#4F46E5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Clock size={20} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '15px', color: '#0F172A' }}>
                          Aralıklı Tekrar & Kalıcı Hafıza (Leitner)
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', backgroundColor: '#EEF2FF', color: '#4F46E5' }}>
                          5-Kutu Algoritması
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                        Öğrendiğiniz ve hata yaptığınız sorular unutma eğrisine göre periyodik olarak önünüze gelir.
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: leitnerStats.dueTodayCount > 0 ? '#FEF3C7' : '#F0FDF4',
                    padding: '6px 12px',
                    borderRadius: '8px',
                  }}>
                    <Zap size={14} color={leitnerStats.dueTodayCount > 0 ? '#D97706' : '#16A34A'} />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: leitnerStats.dueTodayCount > 0 ? '#B45309' : '#15803D' }}>
                      {leitnerStats.dueTodayCount > 0
                        ? `Bugün ${leitnerStats.dueTodayCount} soru tekrar bekliyor`
                        : 'Bugün için tüm tekrarlar tamamlandı!'}
                    </span>
                  </div>
                </div>

                {/* 5 Kutu İlerleme Izgarası */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                  {[
                    { box: 1, name: '1. Kutu', interval: '1 Gün', count: leitnerStats.boxes[0]?.count || 0, color: '#EF4444', bg: '#FEE2E2' },
                    { box: 2, name: '2. Kutu', interval: '3 Gün', count: leitnerStats.boxes[1]?.count || 0, color: '#F97316', bg: '#FFEDD5' },
                    { box: 3, name: '3. Kutu', interval: '7 Gün', count: leitnerStats.boxes[2]?.count || 0, color: '#F59E0B', bg: '#FEF3C7' },
                    { box: 4, name: '4. Kutu', interval: '14 Gün', count: leitnerStats.boxes[3]?.count || 0, color: '#3B82F6', bg: '#DBEAFE' },
                    { box: 5, name: '5. Kutu (Kalıcı)', interval: '30 Gün', count: leitnerStats.boxes[4]?.count || 0, color: '#10B981', bg: '#D1FAE5' },
                  ].map((b) => (
                    <div
                      key={b.box}
                      style={{
                        backgroundColor: '#F8FAFC',
                        borderRadius: '12px',
                        padding: '12px 10px',
                        border: '1px solid #F1F5F9',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>{b.name}</span>
                        <span style={{ fontSize: '9px', fontWeight: 600, color: b.color, backgroundColor: b.bg, padding: '1px 5px', borderRadius: '4px' }}>
                          {b.interval}
                        </span>
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>
                        {b.count}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                        soru hafızada
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 'Yanlışlarım' Özel Soru Bankası Kartı */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #FECACA',
                padding: '16px 20px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.06)',
                flexWrap: 'wrap',
                gap: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: '#FEE2E2',
                    color: '#DC2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Database size={22} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 800, fontSize: '15px', color: '#111827' }}>'Yanlışlarım' Soru Bankası</span>
                      <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                        Otomatik Banka
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '3px' }}>
                      Deneme sınavlarında yanlış çözdüğünüz sorular otomatik olarak bu soru bankasında birikir. ({mistakesBankCount} Soru)
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleStartMistakesBankQuiz}
                  disabled={mistakesBankCount === 0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 18px',
                    backgroundColor: mistakesBankCount > 0 ? '#DC2626' : '#E5E7EB',
                    color: mistakesBankCount > 0 ? '#FFFFFF' : '#9CA3AF',
                    borderRadius: '10px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: mistakesBankCount > 0 ? 'pointer' : 'not-allowed',
                    boxShadow: mistakesBankCount > 0 ? '0 2px 8px rgba(220, 38, 38, 0.25)' : 'none',
                  }}
                >
                  <Play size={15} fill={mistakesBankCount > 0 ? '#FFFFFF' : '#9CA3AF'} />
                  <span>Yanlışlarımı Çöz ({mistakesBankCount})</span>
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

                {/* 3. BLOK: ÇALIŞMA TAKVİMİ */}
                <StudyCalendarCard />

                {/* 4. BLOK: DETAYLI KONU BAZLI ANALİZ */}
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
                const isUnder20 = (topic.questionCount ?? 0) < 20;
                return (
                  <div
                    key={topic.id}
                    onClick={() => handleSelectTopic(topic)}
                    style={{
                      ...styles.unitCard,
                      opacity: isUnder20 ? 0.8 : 1,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{
                      ...styles.unitNumberBadge,
                      backgroundColor: isUnder20 ? '#F1F5F9' : undefined,
                    }}>
                      <span style={{
                        ...styles.unitNumberText,
                        color: isUnder20 ? '#94A3B8' : undefined,
                      }}>
                        {formattedNumber}
                      </span>
                    </div>
                    <div style={styles.unitInfo}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <div style={styles.unitName}>{topic.title}</div>
                        {isUnder20 && (
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#FEF2F2',
                            color: '#DC2626',
                            border: '1px solid #FECACA',
                          }}>
                            🔒 Hazırlık Aşamasında ({topic.questionCount || 0}/20 Soru)
                          </span>
                        )}
                      </div>
                      <div style={styles.unitQuestionText}>
                        {isUnder20
                          ? `${topic.questionCount || 0} Soru • Henüz Yayınlanmadı (Hazırlıkta)`
                          : `${topic.questionCount || 20} Soru • Test`}
                      </div>
                    </div>
                    {isUnder20 ? <Lock size={18} color="#94A3B8" /> : <ChevronRight size={18} color="#666" />}
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
              <div style={{ fontSize: '13px', color: '#6366F1', fontWeight: 600, marginTop: '4px' }}>
                {selectedBank ? selectedBank.title : 'Soru Bankası'} • {questions.length} Soru
              </div>
            </div>

            {/* Soru Bankaları Seçim Bölümü (4. Düzey Hiyerarşi) */}
            {topicBanks.length > 0 && (
              <div style={{ marginBottom: '18px' }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#475569',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Database size={15} color="#4F46E5" />
                  <span>Bu Konuya Ait Soru Bankaları ({topicBanks.length}):</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {topicBanks.map((bank) => {
                    const isSelected = selectedBank?.id === bank.id;
                    const isBankUnder20 = (bank.questionCount || 0) < 20;
                    return (
                      <div
                        key={bank.id}
                        onClick={() => handleSelectBank(bank)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid #4F46E5' : '1px solid #E2E8F0',
                          backgroundColor: isSelected ? '#F5F3FF' : '#FFFFFF',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          boxShadow: isSelected ? '0 2px 8px rgba(79, 70, 229, 0.12)' : 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            backgroundColor: isSelected ? '#4F46E5' : '#F1F5F9',
                            color: isSelected ? '#FFFFFF' : '#64748B',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '13px'
                          }}>
                            {bank.orderNumber || 1}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>
                              {bank.title}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{bank.bankType || 'Standart Konu Testi'}</span>
                              <span>•</span>
                              <span>{bank.questionCount || 0} Soru</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          {isBankUnder20 ? (
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              backgroundColor: '#FEF2F2',
                              color: '#DC2626',
                              border: '1px solid #FECACA',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Lock size={12} />
                              Hazırlıkta ({bank.questionCount || 0}/20)
                            </span>
                          ) : (
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              backgroundColor: '#ECFDF5',
                              color: '#059669',
                              border: '1px solid #A7F3D0',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Check size={12} />
                              Yayında (20+ Soru)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Test Kuralları / Bilgi Kutusu */}
            <div style={styles.rulesCard}>
              <div style={styles.rulesCardTitle}>
                {selectedBank ? selectedBank.title : 'Bu testte'}:
              </div>

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
            <div style={styles.footerContainer} className="quiz-footer-container">
              {questions.length < 20 ? (
                <div style={{
                  padding: '14px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '12px',
                  textAlign: 'center',
                  color: '#991B1B',
                  fontWeight: 600,
                  fontSize: '13px',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}>
                  <Lock size={16} color="#DC2626" />
                  <span>Seçili Soru Bankası Hazırlık Aşamasında (Yayınlanmadı • {questions.length}/20 Soru)</span>
                </div>
              ) : (
                <button
                  onClick={handleStartQuiz}
                  style={styles.startButton}
                >
                  Teste Başla ({selectedBank ? selectedBank.title : 'Sınavı Başlat'})
                </button>
              )}

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
              questions.length === 0 || !currentQ ? (
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  padding: '48px 24px',
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: '#F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px auto',
                  }}>
                    <BookOpen size={28} color="#64748B" />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                    Bu Testte Henüz Soru Bulunmuyor
                  </h3>
                  <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '360px', margin: '0 auto 24px auto', lineHeight: 1.5 }}>
                    Seçilen konu veya soru bankasına ait soru henüz eklenmemiş. Lütfen başka bir test seçiniz.
                  </p>
                  <button
                    onClick={() => {
                      if (selectedTopic) setViewState('unit-detail');
                      else if (selectedUnit) setViewState('topics');
                      else setViewState('subjects');
                    }}
                    style={{
                      padding: '10px 24px',
                      backgroundColor: '#111111',
                      color: '#FFFFFF',
                      borderRadius: '10px',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    Geri Dön
                  </button>
                </div>
              ) : (
              <div>
                {/* Duraklatma Katmanı (Overlay) */}
                {isTimerPaused && (
                  <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.88)',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px',
                    color: '#FFFFFF',
                    textAlign: 'center',
                    backdropFilter: 'blur(4px)',
                  }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      backgroundColor: '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px',
                    }}>
                      <Pause size={32} color="#F59E0B" />
                    </div>
                    <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>Sınav Duraklatıldı</h3>
                    <p style={{ fontSize: '14px', color: '#94A3B8', maxWidth: '340px', marginBottom: '24px', lineHeight: 1.5 }}>
                      Süre sayacı durduruldu. Dinlendikten sonra sınavınıza kaldığınız yerden devam edebilirsiniz.
                    </p>
                    <button
                      onClick={() => setIsTimerPaused(false)}
                      style={{
                        padding: '12px 28px',
                        backgroundColor: '#10B981',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '15px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                      }}
                    >
                      <Play size={16} />
                      Sınava Devam Et
                    </button>
                  </div>
                )}

                {/* Üst Navigasyon ve Sayaç */}
                <div style={styles.quizNavHeader}>
                  <button
                    onClick={() => {
                      if (isDenemeMode) {
                        if (confirm('Deneme sınavından çıkmak istediğinize emin misiniz? İlerlemeniz kaydedilmeyecektir.')) {
                          setIsDenemeMode(false);
                          setViewState('subjects');
                          setActiveTab('home');
                        }
                      } else {
                        setViewState('topics');
                      }
                    }}
                    style={styles.quizBackButton}
                    title={isDenemeMode ? 'Denemeden Çık' : 'Testten Çık'}
                  >
                    <ChevronLeft size={22} color="#111" />
                  </button>

                  {isDenemeMode ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Canlı Süre Sayacı Rozeti */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        backgroundColor: (denemeDurationMinutes > 0 && timeRemainingSeconds <= 60)
                          ? '#FEF2F2'
                          : (denemeDurationMinutes > 0 && timeRemainingSeconds <= 300)
                          ? '#FFFBEB'
                          : '#0F172A',
                        color: (denemeDurationMinutes > 0 && timeRemainingSeconds <= 60)
                          ? '#DC2626'
                          : (denemeDurationMinutes > 0 && timeRemainingSeconds <= 300)
                          ? '#D97706'
                          : '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '13px',
                        border: (denemeDurationMinutes > 0 && timeRemainingSeconds <= 60)
                          ? '1px solid #FECACA'
                          : (denemeDurationMinutes > 0 && timeRemainingSeconds <= 300)
                          ? '1px solid #FDE68A'
                          : 'none',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      }}>
                        <Clock size={15} />
                        <span>
                          {denemeDurationMinutes > 0
                            ? formatTime(timeRemainingSeconds)
                            : formatTime(denemeTotalElapsedSeconds)}
                        </span>
                        {denemeDurationMinutes > 0 && (
                          <span style={{ fontSize: '11px', opacity: 0.85 }}>kaldı</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsTimerPaused((p) => !p)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'inherit',
                            padding: '0 0 0 4px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title={isTimerPaused ? 'Süreyi Devam Ettir' : 'Süreyi Duraklat'}
                        >
                          {isTimerPaused ? <Play size={13} /> : <Pause size={13} />}
                        </button>
                      </div>

                      <div style={styles.quizHeaderCounter}>
                        {String(currentIndex + 1).padStart(2, '0')} / {String(questions.length).padStart(2, '0')}
                      </div>
                    </div>
                  ) : (
                    <div style={styles.quizHeaderCounter}>
                      {String(currentIndex + 1).padStart(2, '0')} / {String(questions.length).padStart(2, '0')}
                    </div>
                  )}

                  {isDenemeMode ? (
                    <button
                      onClick={() => {
                        if (confirm('Deneme sınavını şimdi sonlandırıp sonuç raporunu görmek istiyor musunuz?')) {
                          const wrongOnes = questions.filter((q) => userAnswers[q.id] && !userAnswers[q.id].isCorrect);
                          if (wrongOnes.length > 0) {
                            saveWrongQuestionsToMistakesBank(wrongOnes);
                          }
                          setIsCompleted(true);
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#FEF2F2',
                        color: '#DC2626',
                        border: '1px solid #FECACA',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                      title="Denemeyi Bitir"
                    >
                      Bitir
                    </button>
                  ) : (
                    <button
                      style={styles.quizMenuButton}
                      title="Seçenekler"
                    >
                      <MoreVertical size={18} color="#111" />
                    </button>
                  )}
                </div>

                {/* İlerleme Çubuğu */}
                <div style={styles.progressBarBg}>
                  <div
                    style={{
                      ...styles.cardProgressBarFill,
                      backgroundColor: '#111111',
                      width: `${questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0}%`,
                    }}
                  />
                </div>

                {/* Soru Kartı */}
                <div style={styles.questionCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={styles.questionLabel}>
                      {isDenemeMode ? `DENEME SORUSU ${String(currentIndex + 1).padStart(2, '0')}` : `SORU ${String(currentIndex + 1).padStart(2, '0')}`}
                    </div>
                    {currentQ?.subjectTitle && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 9px',
                        borderRadius: '6px',
                        backgroundColor: '#EEF2FF',
                        color: '#4F46E5',
                        border: '1px solid #C7D2FE',
                      }}>
                        {currentQ.subjectTitle} • {currentQ.topicTitle || 'Karma'}
                      </span>
                    )}
                  </div>
                  <div style={styles.questionText}>{currentQ?.questionText}</div>
                </div>

                {/* Şıklar Listesi */}
                <div>
                  {(currentQ?.options || []).map((opt) => {
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
                <div style={styles.footerContainer} className="quiz-footer-container">
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
              )
            ) : (
              renderTestResult()
            )}
          </div>
        )}

        {/* 4. FEEDBACK / ÇÖZÜM VE AÇIKLAMA EKRANI */}
        {viewState === 'feedback' && currentQ && (
          <div className="feedback-content-container" style={{ maxWidth: '440px', margin: '0 auto', width: '100%', padding: '36px 20px 160px' }}>
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
            <div style={styles.feedbackBottomBar} className="feedback-bottom-bar">
              <button
                onClick={handleNextFromFeedback}
                style={styles.feedbackNextButton}
                className="feedback-next-button"
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

      {/* Soru Sayısı 20'nin Altında (Yayınlanmadı) Modalı */}
      {unpublishedModalInfo && (
        <div style={{
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
        }}>
          <div style={{
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
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              <Lock size={30} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
              Soru Bankası Hazırlık Aşamasında
            </h3>

            <div style={{
              fontSize: '14px',
              color: '#475569',
              lineHeight: 1.6,
              marginBottom: '20px',
              backgroundColor: '#F8FAFC',
              padding: '14px',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              width: '100%',
            }}>
              <p style={{ margin: 0, marginBottom: '8px' }}>
                <b>"{unpublishedModalInfo.topicTitle}"</b> konusunun soru bankasında şu an <b>{unpublishedModalInfo.questionCount}</b> soru bulunmaktadır.
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                KPSS hazırlık ve kalite standartlarımız gereği, <b>20 sorunun altındaki soru bankaları yayına alınmamaktadır.</b> İçerik ekibimiz soruları 20'ye tamamladığında bu test çözüme açılacaktır.
              </p>
            </div>

            <button
              onClick={() => setUnpublishedModalInfo(null)}
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

      {/* DENEME MODU BAŞLATMA & SÜRE AYARI MODALI */}
      <DenemeSetupModal
        isOpen={showDenemeSetupModal}
        onClose={() => setShowDenemeSetupModal(false)}
        onStartExam={(durationMinutes, examType) => handleStartDenemeExam(durationMinutes, examType)}
        selectedExamType={selectedExamType}
        setSelectedExamType={setSelectedExamType}
        denemeDurationMinutes={denemeDurationMinutes}
        setDenemeDurationMinutes={setDenemeDurationMinutes}
      />

      {/* AUTH (GİRİŞ / KAYIT / ŞİFRE SIFIRLAMA) MODALI */}
      <AuthModal
        isOpen={showAuthModal}
        initialMode={authModalMode}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          setAuthUser(authService.getCurrentUser());
        }}
      />

      {/* ABONELİK & FİYATLANDIRMA (PAYWALL) MODALI */}
      <PricingPaywallModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        onSuccess={() => {
          setShowPricingModal(false);
          setSubscription(subscriptionService.getSubscription());
        }}
      />
    </div>
  );
};

export default StudentQuiz;
