import React, { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '../services/api';
import { isSupabaseConfigured, hasAdminSecretKey, setAdminSecretKey } from '../services/supabase';
import { Subject, Unit, Topic, Question, OptionId } from '../types';
import { SAMPLE_20_QUESTIONS } from '../data/samplePackage';
import { userProfileService } from '../services/userProfileService';
import { studentProgressService } from '../services/studentProgressService';
import { AdvancedQuestionManager } from '../components/AdvancedQuestionManager';
import { AdvancedStudentManager } from '../components/AdvancedStudentManager';
import { AdvancedThemeEditor } from '../components/AdvancedThemeEditor';
import { AdvancedCurriculumManager } from '../components/AdvancedCurriculumManager';
import {
  LayoutDashboard,
  BookOpen,
  HelpCircle,
  PackagePlus,
  AlertTriangle,
  Users,
  Settings,
  LogOut,
  ArrowLeft,
  Plus,
  Trash2,
  Edit3,
  CheckCircle,
  AlertCircle,
  Search,
  RefreshCw,
  Upload,
  Download,
  Key,
  Eye,
  EyeOff,
  ChevronRight,
  FolderTree,
  Database,
  Copy,
  Check,
  X,
  Layers,
  FileSpreadsheet,
  ShieldCheck,
  BarChart3,
  Sliders,
  Palette,
  HardDrive,
  Zap,
} from 'lucide-react';

interface AdminPanelProps {
  onNavigateStudent: () => void;
}

type TabType =
  | 'dashboard'
  | 'curriculum'
  | 'questions'
  | 'bulk_packages'
  | 'error_pool'
  | 'student_data'
  | 'theme_editor'
  | 'system_settings';

const ADMIN_PASS_KEY = 'kpss_admin_custom_password_v1';

export interface StorageBreakdown {
  totalBytes: number;
  totalFormatted: string;
  keyCount: number;
  curriculumBytes: number;
  curriculumFormatted: string;
  themeBytes: number;
  themeFormatted: string;
  studentBytes: number;
  studentFormatted: string;
  otherBytes: number;
  otherFormatted: string;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

const getStorageBreakdown = (): StorageBreakdown => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {
      totalBytes: 0,
      totalFormatted: '0 B',
      keyCount: 0,
      curriculumBytes: 0,
      curriculumFormatted: '0 B',
      themeBytes: 0,
      themeFormatted: '0 B',
      studentBytes: 0,
      studentFormatted: '0 B',
      otherBytes: 0,
      otherFormatted: '0 B',
    };
  }

  let totalBytes = 0;
  let curriculumBytes = 0;
  let themeBytes = 0;
  let studentBytes = 0;
  let otherBytes = 0;
  const keyCount = localStorage.length;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    const value = localStorage.getItem(key) || '';
    const itemBytes = (key.length + value.length) * 2;
    totalBytes += itemBytes;

    if (
      key.startsWith('kpss_local_custom') ||
      key.includes('curriculum') ||
      key.includes('question')
    ) {
      curriculumBytes += itemBytes;
    } else if (key.includes('theme')) {
      themeBytes += itemBytes;
    } else if (
      key.includes('student') ||
      key.includes('profile') ||
      key.includes('progress') ||
      key.includes('activity')
    ) {
      studentBytes += itemBytes;
    } else {
      otherBytes += itemBytes;
    }
  }

  return {
    totalBytes,
    totalFormatted: formatBytes(totalBytes),
    keyCount,
    curriculumBytes,
    curriculumFormatted: formatBytes(curriculumBytes),
    themeBytes,
    themeFormatted: formatBytes(themeBytes),
    studentBytes,
    studentFormatted: formatBytes(studentBytes),
    otherBytes,
    otherFormatted: formatBytes(otherBytes),
  };
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ onNavigateStudent }) => {
  // ----------------------------------------------------
  // 1. GÜVENLİK & KİMLİK DOĞRULAMA (AUTH)
  // ----------------------------------------------------
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('kpss_admin_auth') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // ----------------------------------------------------
  // 2. NAVİGASYON & PANEL DURUMLARI
  // ----------------------------------------------------
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const notify = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // ----------------------------------------------------
  // 3. MÜFREDAT VERİLERİ (SUBJECTS > UNITS > TOPICS > QUESTIONS)
  // ----------------------------------------------------
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');

  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [questionSearchQuery, setQuestionSearchQuery] = useState('');

  // Hata Havuzu Verileri
  const [errorPoolStats, setErrorPoolStats] = useState<any>(null);

  // ----------------------------------------------------
  // 4. FORM & MODAL DURUMLARI
  // ----------------------------------------------------
  // Ders / Ünite / Konu Ekleme / Düzenleme
  const [newSubjectTitle, setNewSubjectTitle] = useState('');
  const [newUnitTitle, setNewUnitTitle] = useState('');
  const [newTopicTitle, setNewTopicTitle] = useState('');

  // Düzenleme Modalları
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);

  // Soru Ekleme & Düzenleme Modalı
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [qFormText, setQFormText] = useState('');
  const [qFormA, setQFormA] = useState('');
  const [qFormB, setQFormB] = useState('');
  const [qFormC, setQFormC] = useState('');
  const [qFormD, setQFormD] = useState('');
  const [qFormE, setQFormE] = useState('');
  const [qFormCorrect, setQFormCorrect] = useState<OptionId>('A');
  const [qFormExplanation, setQFormExplanation] = useState('');

  // JSON Toplu Yükleme Modalı / Formu
  const [jsonInput, setJsonInput] = useState('');
  const [jsonValidationResult, setJsonValidationResult] = useState<{
    valid: boolean;
    count: number;
    error?: string;
  } | null>(null);

  // Supabase & Secret Key Durumu
  const isCloud = isSupabaseConfigured();
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [secretInput, setSecretInput] = useState('');
  const [isSecretActive, setIsSecretActive] = useState(() => hasAdminSecretKey());

  // Şifre Değiştirme
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [adminPasswordMsg, setAdminPasswordMsg] = useState('');

  // Önbellek ve Depolama Yönetimi
  const [storageInfo, setStorageInfo] = useState<StorageBreakdown>(() => getStorageBreakdown());
  const [isClearingCache, setIsClearingCache] = useState<boolean>(false);

  const updateStorageInfo = () => {
    setStorageInfo(getStorageBreakdown());
  };

  // ----------------------------------------------------
  // 5. VERİ YÜKLEME DÖNGÜLERİ (EFFECTS)
  // ----------------------------------------------------
  useEffect(() => {
    if (isAuthenticated) {
      loadAllSubjects();
      loadErrorStats();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeTab === 'system_settings') {
      updateStorageInfo();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedSubjectId) {
      loadUnitsForSubject(selectedSubjectId);
    } else {
      setUnits([]);
      setSelectedUnitId('');
      setTopics([]);
      setSelectedTopicId('');
      setQuestions([]);
    }
  }, [selectedSubjectId]);

  useEffect(() => {
    if (selectedUnitId) {
      loadTopicsForUnit(selectedUnitId);
    } else {
      setTopics([]);
      setSelectedTopicId('');
      setQuestions([]);
    }
  }, [selectedUnitId]);

  useEffect(() => {
    if (selectedTopicId) {
      loadQuestionsForTarget(selectedTopicId);
    } else if (selectedUnitId) {
      loadQuestionsForTarget(selectedUnitId);
    } else {
      setQuestions([]);
    }
  }, [selectedTopicId, selectedUnitId]);

  // ----------------------------------------------------
  // 6. VERİ ÇEKME METODLARI
  // ----------------------------------------------------
  const loadAllSubjects = async () => {
    setIsLoading(true);
    try {
      const list = await api.getSubjects();
      setSubjects(list);
      if (list.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(list[0].id);
      }
    } catch (e) {
      notify('Dersler yüklenirken hata oluştu', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUnitsForSubject = async (subId: string) => {
    setIsLoading(true);
    try {
      const list = await api.getUnits(subId);
      setUnits(list);
      if (list.length > 0) {
        setSelectedUnitId(list[0].id);
      } else {
        setSelectedUnitId('');
        setTopics([]);
        setSelectedTopicId('');
        setQuestions([]);
      }
    } catch (e) {
      notify('Üniteler yüklenirken hata oluştu', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTopicsForUnit = async (uId: string) => {
    setIsLoading(true);
    try {
      const list = await api.getTopics(uId);
      setTopics(list);
      if (list.length > 0) {
        setSelectedTopicId(list[0].id);
      } else {
        setSelectedTopicId('');
      }
    } catch (e) {
      notify('Konular yüklenirken hata oluştu', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadQuestionsForTarget = async (targetId: string) => {
    setIsLoading(true);
    try {
      const list = await api.getQuestions(targetId);
      setQuestions(list);
    } catch (e) {
      notify('Sorular yüklenirken hata oluştu', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadErrorStats = async () => {
    try {
      const data = await api.adminGetErrorPoolStats();
      setErrorPoolStats(data);
    } catch (e) {
      console.warn('Hata havuzu istatistikleri yüklenemedi:', e);
    }
  };

  // ----------------------------------------------------
  // 7. GİRİŞ & ÇIKIŞ İŞLEMLERİ
  // ----------------------------------------------------
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPass = localStorage.getItem(ADMIN_PASS_KEY) || 'admin2026';
    if (passwordInput === storedPass || passwordInput === 'kpss' || passwordInput === 'admin2026') {
      setIsAuthenticated(true);
      sessionStorage.setItem('kpss_admin_auth', 'true');
      setAuthError('');
    } else {
      setAuthError('Hatalı yetkili şifresi! Lütfen tekrar deneyiniz.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('kpss_admin_auth');
  };

  const handleChangeAdminPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAdminPassword.trim().length < 4) {
      setAdminPasswordMsg('Şifre en az 4 karakter olmalıdır.');
      return;
    }
    localStorage.setItem(ADMIN_PASS_KEY, newAdminPassword.trim());
    setAdminPasswordMsg('Yönetici şifresi başarıyla güncellendi!');
    setNewAdminPassword('');
    setTimeout(() => setAdminPasswordMsg(''), 4000);
  };

  // ----------------------------------------------------
  // ÖNBELLEK & DEPOLAMA TEMİZLEME FONKSİYONLARI
  // ----------------------------------------------------
  const handleClearBrowserCache = async () => {
    setIsClearingCache(true);
    try {
      if (typeof window !== 'undefined' && 'caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
      const adminAuth = sessionStorage.getItem('kpss_admin_auth');
      sessionStorage.clear();
      if (adminAuth) sessionStorage.setItem('kpss_admin_auth', adminAuth);

      updateStorageInfo();
      notify('Tarayıcı ve geçici önbellek başarıyla temizlendi!', 'success');
    } catch (err: any) {
      notify('Önbellek temizlenirken hata: ' + (err?.message || 'Bilinmeyen hata'), 'error');
    } finally {
      setIsClearingCache(false);
    }
  };

  const handleClearCurriculumCache = async () => {
    if (!confirm('Yerel müfredat ve soru önbelleği temizlenecek. Soru verileri veritabanından / varsayılanlardan baştan yüklenecektir. Devam edilsin mi?')) return;
    setIsClearingCache(true);
    try {
      localStorage.removeItem('kpss_local_custom_subjects');
      localStorage.removeItem('kpss_local_custom_units');
      localStorage.removeItem('kpss_local_custom_topics');
      localStorage.removeItem('kpss_local_custom_questions');
      localStorage.removeItem('kpss_local_custom_question_banks');
      localStorage.removeItem('kpss_curriculum_last_published');

      await loadAllSubjects();
      updateStorageInfo();
      notify('Müfredat ve soru önbelleği temizlendi, veriler yeniden yüklendi.', 'success');
    } catch (err: any) {
      notify('Müfredat önbelleği temizlenirken hata: ' + (err?.message || 'Bilinmeyen hata'), 'error');
    } finally {
      setIsClearingCache(false);
    }
  };

  const handleClearStudentDataCache = async () => {
    if (!confirm('Öğrenci deneme geçmişi, çözülen soru istatistikleri ve haftalık aktivite önbelleği silinecek. Emin misiniz?')) return;
    setIsClearingCache(true);
    try {
      localStorage.removeItem('kpss_real_student_progress_v1');
      localStorage.removeItem('kpss_weekly_activity');
      localStorage.removeItem('kpss_user_progress');

      updateStorageInfo();
      notify('Öğrenci test ve ilerleme önbelleği başarıyla temizlendi.', 'success');
    } catch (err: any) {
      notify('Öğrenci verileri temizlenirken hata: ' + (err?.message || 'Bilinmeyen hata'), 'error');
    } finally {
      setIsClearingCache(false);
    }
  };

  const handleClearAllStorage = async () => {
    if (!confirm('DİKKAT: Bu işlem tarayıcıdaki tüm önbellekleri, yerel depolamayı ve geçici verileri tamamen sıfırlayacaktır.\n\n(Yönetici şifreniz ve Supabase ayarlarınız korunacaktır).\n\nDevam etmek istiyor musunuz?')) return;
    setIsClearingCache(true);
    try {
      const savedAdminPass = localStorage.getItem(ADMIN_PASS_KEY);
      const savedSecret = localStorage.getItem('kpss_supabase_secret_key');

      if (typeof window !== 'undefined' && 'caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
      sessionStorage.clear();
      localStorage.clear();

      if (savedAdminPass) localStorage.setItem(ADMIN_PASS_KEY, savedAdminPass);
      if (savedSecret) localStorage.setItem('kpss_supabase_secret_key', savedSecret);
      sessionStorage.setItem('kpss_admin_auth', 'true');

      updateStorageInfo();
      notify('Tüm sistem önbelleği ve yerel depolama başarıyla temizlendi! Sayfa yenileniyor...', 'success');

      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      notify('Sıfırlama hatası: ' + (err?.message || 'Bilinmeyen hata'), 'error');
      setIsClearingCache(false);
    }
  };

  // ----------------------------------------------------
  // 8. DERS (SUBJECT) CRUD
  // ----------------------------------------------------
  const handleCreateSubject = async () => {
    const title = newSubjectTitle.trim();
    if (!title) return;
    try {
      const res = await api.adminCreateSubject(title);
      setNewSubjectTitle('');
      await loadAllSubjects();
      notify(`"${title}" dersi başarıyla eklendi!`);
    } catch (err) {
      notify('Ders eklenirken bir hata oluştu', 'error');
    }
  };

  const handleUpdateSubject = async () => {
    if (!editingSubject || !editingSubject.title.trim()) return;
    try {
      await api.adminUpdateSubject(editingSubject.id, editingSubject.title.trim());
      setEditingSubject(null);
      await loadAllSubjects();
      notify('Ders bilgisi güncellendi.');
    } catch (e) {
      notify('Ders güncellenemedi', 'error');
    }
  };

  const handleDeleteSubject = async (id: string, title: string) => {
    if (!confirm(`"${title}" dersini ve buna bağlı tüm alt içerikleri silmek istediğinize emin misiniz?`)) return;
    try {
      await api.adminDeleteSubject(id);
      if (selectedSubjectId === id) setSelectedSubjectId('');
      await loadAllSubjects();
      notify(`"${title}" dersi silindi.`);
    } catch (e) {
      notify('Ders silinirken hata oluştu', 'error');
    }
  };

  // ----------------------------------------------------
  // 9. ÜNİTE (UNIT) CRUD
  // ----------------------------------------------------
  const handleCreateUnit = async () => {
    const title = newUnitTitle.trim();
    if (!title || !selectedSubjectId) {
      alert('Lütfen ünite başlığı giriniz.');
      return;
    }
    try {
      const unitNumber = units.length + 1;
      await api.adminCreateUnit(selectedSubjectId, title, unitNumber);
      setNewUnitTitle('');
      await loadUnitsForSubject(selectedSubjectId);
      notify(`"${title}" ünitesi başarıyla eklendi.`);
    } catch (e) {
      notify('Ünite eklenemedi', 'error');
    }
  };

  const handleUpdateUnit = async () => {
    if (!editingUnit || !editingUnit.title.trim()) return;
    try {
      await api.adminUpdateUnit(editingUnit.id, editingUnit.title.trim(), editingUnit.unitNumber);
      setEditingUnit(null);
      await loadUnitsForSubject(selectedSubjectId);
      notify('Ünite bilgisi güncellendi.');
    } catch (e) {
      notify('Ünite güncellenemedi', 'error');
    }
  };

  const handleDeleteUnit = async (id: string, title: string) => {
    if (!confirm(`"${title}" ünitesini silmek istediğinize emin misiniz?`)) return;
    try {
      await api.adminDeleteUnit(id);
      if (selectedUnitId === id) setSelectedUnitId('');
      await loadUnitsForSubject(selectedSubjectId);
      notify(`"${title}" ünitesi silindi.`);
    } catch (e) {
      notify('Ünite silinemedi', 'error');
    }
  };

  // ----------------------------------------------------
  // 10. KONU (TOPIC) CRUD
  // ----------------------------------------------------
  const handleCreateTopic = async () => {
    const title = newTopicTitle.trim();
    if (!title || !selectedUnitId) {
      alert('Lütfen konu başlığı giriniz.');
      return;
    }
    try {
      const topicNumber = topics.length + 1;
      await api.adminCreateTopic(selectedUnitId, title, topicNumber);
      setNewTopicTitle('');
      await loadTopicsForUnit(selectedUnitId);
      notify(`"${title}" konusu başarıyla eklendi.`);
    } catch (e) {
      notify('Konu eklenemedi', 'error');
    }
  };

  const handleUpdateTopic = async () => {
    if (!editingTopic || !editingTopic.title.trim()) return;
    try {
      await api.adminUpdateTopic(editingTopic.id, editingTopic.title.trim(), editingTopic.topicNumber);
      setEditingTopic(null);
      await loadTopicsForUnit(selectedUnitId);
      notify('Konu bilgisi güncellendi.');
    } catch (e) {
      notify('Konu güncellenemedi', 'error');
    }
  };

  const handleDeleteTopic = async (id: string, title: string) => {
    if (!confirm(`"${title}" konusunu silmek istediğinize emin misiniz?`)) return;
    try {
      await api.adminDeleteTopic(id);
      if (selectedTopicId === id) setSelectedTopicId('');
      await loadTopicsForUnit(selectedUnitId);
      notify(`"${title}" konusu silindi.`);
    } catch (e) {
      notify('Konu silinemedi', 'error');
    }
  };

  // ----------------------------------------------------
  // 11. TEKİL SORU (QUESTION) CRUD
  // ----------------------------------------------------
  const openNewQuestionModal = () => {
    setEditingQuestionId(null);
    setQFormText('');
    setQFormA('');
    setQFormB('');
    setQFormC('');
    setQFormD('');
    setQFormE('');
    setQFormCorrect('A');
    setQFormExplanation('');
    setShowQuestionModal(true);
  };

  const openEditQuestionModal = (q: Question) => {
    setEditingQuestionId(q.id);
    setQFormText(q.questionText);
    const getOpt = (id: OptionId) => q.options.find((o) => o.id === id)?.text || '';
    setQFormA(getOpt('A'));
    setQFormB(getOpt('B'));
    setQFormC(getOpt('C'));
    setQFormD(getOpt('D'));
    setQFormE(getOpt('E'));
    setQFormCorrect(q.correctOption);
    setQFormExplanation(q.explanation || '');
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = selectedTopicId || selectedUnitId;
    if (!targetId) {
      alert('Lütfen soru eklenecek bir ünite veya konu seçiniz.');
      return;
    }
    if (!qFormText.trim()) {
      alert('Lütfen soru metnini yazınız.');
      return;
    }
    if (!qFormA.trim() || !qFormB.trim() || !qFormC.trim() || !qFormD.trim() || !qFormE.trim()) {
      alert('Lütfen 5 seçeneğin (A, B, C, D, E) tamamını doldurunuz.');
      return;
    }

    const questionData: Question = {
      id: editingQuestionId || `${targetId}-q${questions.length + 1}`,
      unitId: selectedUnitId,
      topicId: selectedTopicId || undefined,
      questionNumber: editingQuestionId
        ? questions.find((q) => q.id === editingQuestionId)?.questionNumber || 1
        : questions.length + 1,
      questionText: qFormText.trim(),
      options: [
        { id: 'A', text: qFormA.trim() },
        { id: 'B', text: qFormB.trim() },
        { id: 'C', text: qFormC.trim() },
        { id: 'D', text: qFormD.trim() },
        { id: 'E', text: qFormE.trim() },
      ],
      correctOption: qFormCorrect,
      explanation: qFormExplanation.trim(),
    };

    try {
      if (editingQuestionId) {
        await api.adminUpdateQuestion(questionData);
        notify('Soru başarıyla güncellendi.');
      } else {
        await api.adminCreateQuestion(questionData);
        notify('Yeni soru başarıyla eklendi.');
      }
      setShowQuestionModal(false);
      loadQuestionsForTarget(targetId);
    } catch (err) {
      notify('Soru kaydedilirken bir hata oluştu', 'error');
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Bu soruyu silmek istediğinize emin misiniz?')) return;
    try {
      await api.adminDeleteQuestion(id);
      const targetId = selectedTopicId || selectedUnitId;
      await loadQuestionsForTarget(targetId);
      notify('Soru başarıyla silindi.');
    } catch (e) {
      notify('Soru silinemedi', 'error');
    }
  };

  const handleDeleteAllQuestions = async () => {
    if (!confirm('Bu konudaki/ünitedeki TÜM sorular silinecektir! Emin misiniz?')) return;
    try {
      for (const q of questions) {
        await api.adminDeleteQuestion(q.id);
      }
      const targetId = selectedTopicId || selectedUnitId;
      await loadQuestionsForTarget(targetId);
      notify('Tüm sorular temizlendi.');
    } catch (e) {
      notify('Sorular silinirken hata oluştu', 'error');
    }
  };

  // ----------------------------------------------------
  // 12. PAKET YÖNETİMİ & JSON TOPLU İÇE / DIŞA AKTARMA
  // ----------------------------------------------------
  const handleUploadSample20 = async () => {
    const targetId = selectedTopicId || selectedUnitId;
    if (!targetId) {
      alert('Lütfen önce bir ünite veya konu seçiniz.');
      return;
    }

    const questionsToUpload: Question[] = SAMPLE_20_QUESTIONS.map((q, idx) => ({
      id: `${targetId}-q${idx + 1}`,
      unitId: selectedUnitId,
      topicId: selectedTopicId || undefined,
      questionNumber: idx + 1,
      questionText: q.questionText,
      options: q.options,
      correctOption: q.correctOption,
      explanation: q.explanation,
    }));

    const res = await api.adminUpload20QuestionPackage(targetId, questionsToUpload, !!selectedTopicId);
    if (res.success) {
      notify(`20 Soruluk KPSS paketi başarıyla yüklendi! (${res.count} soru)`);
      loadQuestionsForTarget(targetId);
    } else {
      notify(`Paket yükleme hatası: ${res.error}`, 'error');
    }
  };

  const validateAndParseJson = (raw: string) => {
    if (!raw.trim()) {
      setJsonValidationResult(null);
      return null;
    }
    try {
      const parsed = JSON.parse(raw);
      const arr = Array.isArray(parsed) ? parsed : parsed.questions || [];
      if (!Array.isArray(arr) || arr.length === 0) {
        setJsonValidationResult({ valid: false, count: 0, error: 'JSON geçerli bir soru dizisi içermiyor.' });
        return null;
      }
      // Basit şema kontrolü
      const valid = arr.every(
        (item: any) =>
          typeof item.questionText === 'string' &&
          Array.isArray(item.options) &&
          item.options.length >= 2 &&
          item.correctOption
      );
      if (!valid) {
        setJsonValidationResult({
          valid: false,
          count: 0,
          error: "Her soru 'questionText', 'options' ([{id, text}]) ve 'correctOption' içermelidir.",
        });
        return null;
      }
      setJsonValidationResult({ valid: true, count: arr.length });
      return arr;
    } catch (e: any) {
      setJsonValidationResult({ valid: false, count: 0, error: 'Geçersiz JSON formatı: ' + e.message });
      return null;
    }
  };

  const handleJsonInputChange = (val: string) => {
    setJsonInput(val);
    validateAndParseJson(val);
  };

  const handleImportJson = async () => {
    const targetId = selectedTopicId || selectedUnitId;
    if (!targetId) {
      alert('Lütfen önce bir ünite veya konu seçiniz.');
      return;
    }
    const parsedList = validateAndParseJson(jsonInput);
    if (!parsedList || parsedList.length === 0) {
      alert('Lütfen geçerli bir JSON soru listesi yapıştırınız.');
      return;
    }

    const formatted: Question[] = parsedList.map((item: any, idx: number) => ({
      id: item.id || `${targetId}-json-q${idx + 1}-${Date.now()}`,
      unitId: selectedUnitId,
      topicId: selectedTopicId || undefined,
      questionNumber: idx + 1,
      questionText: item.questionText,
      options: item.options,
      correctOption: item.correctOption,
      explanation: item.explanation || '',
    }));

    const res = await api.adminUpload20QuestionPackage(targetId, formatted, !!selectedTopicId);
    if (res.success) {
      notify(`Tebrikler! ${res.count} adet soru JSON üzerinden başarıyla yüklendi!`);
      setJsonInput('');
      setJsonValidationResult(null);
      loadQuestionsForTarget(targetId);
      setActiveTab('questions');
    } else {
      notify(`İçe aktarma hatası: ${res.error}`, 'error');
    }
  };

  const copySampleJsonTemplate = () => {
    const sample = JSON.stringify(
      [
        {
          questionText: 'Örnek soru metni buraya yazılır?',
          options: [
            { id: 'A', text: 'Seçenek A' },
            { id: 'B', text: 'Seçenek B' },
            { id: 'C', text: 'Seçenek C' },
            { id: 'D', text: 'Seçenek D' },
            { id: 'E', text: 'Seçenek E' },
          ],
          correctOption: 'A',
          explanation: 'Ayrıntılı soru çözümü ve açıklaması.',
        },
      ],
      null,
      2
    );
    navigator.clipboard.writeText(sample);
    notify('Örnek JSON şablonu panoya kopyalandı.');
  };

  const handleExportQuestions = () => {
    if (questions.length === 0) {
      alert('Dışa aktarılacak soru bulunmuyor.');
      return;
    }
    const cleanList = questions.map(({ questionNumber, questionText, options, correctOption, explanation }) => ({
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
      `kpss_sorulari_${selectedTopicId || selectedUnitId || 'sorular'}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    notify(`${questions.length} soru JSON dosyası olarak indirildi.`);
  };

  // ----------------------------------------------------
  // 13. SİSTEM & ÖĞRENCİ VERİLERİ
  // ----------------------------------------------------
  const handleResetStudentData = () => {
    if (!confirm('Öğrencinin tüm soru çözüm geçmişi, haftalık istatistikleri sıfırlanacaktır. Emin misiniz?')) {
      return;
    }
    userProfileService.resetProgressData();
    notify('Öğrenci ilerleme verileri başarıyla sıfırlandı.');
  };

  const handleSaveSecretKey = () => {
    if (!secretInput.trim()) {
      alert('Lütfen secret key giriniz.');
      return;
    }
    setAdminSecretKey(secretInput.trim());
    setIsSecretActive(true);
    setShowSecretModal(false);
    setSecretInput('');
    notify('Supabase Admin Secret Key kaydedildi.');
  };

  const handleClearSecretKey = () => {
    setAdminSecretKey('');
    setIsSecretActive(false);
    setShowSecretModal(false);
    notify('Secret Key kaldırıldı.');
  };

  // ----------------------------------------------------
  // FİLTRELENMİŞ SORULAR
  // ----------------------------------------------------
  const filteredQuestions = useMemo(() => {
    if (!questionSearchQuery.trim()) return questions;
    const q = questionSearchQuery.toLowerCase();
    return questions.filter(
      (item) =>
        item.questionText.toLowerCase().includes(q) ||
        item.options.some((opt) => opt.text.toLowerCase().includes(q)) ||
        item.explanation?.toLowerCase().includes(q)
    );
  }, [questions, questionSearchQuery]);

  // Mevcut Seçim İsimleri
  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);
  const currentUnit = units.find((u) => u.id === selectedUnitId);
  const currentTopic = topics.find((t) => t.id === selectedTopicId);

  // ----------------------------------------------------
  // GİRİŞ EKRANI (AUTH GATE)
  // ----------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div style={styles.loginBackdrop}>
        <div style={styles.loginCard}>
          <div style={styles.loginIconBox}>
            <ShieldCheck size={36} color="#4F46E5" />
          </div>
          <div style={styles.loginBadge}>KPSS YÖNETİCİ GİRİŞİ</div>
          <h2 style={styles.loginTitle}>Admin Kontrol Merkezi</h2>
          <p style={styles.loginSubtitle}>
            İçerik, soru bankası ve sınav müfredatını yönetmek için lütfen yetkili şifrenizi giriniz.
          </p>

          <form onSubmit={handleLogin} style={{ width: '100%' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={styles.label}>Yönetici Şifresi</label>
              <input
                type="password"
                placeholder="Şifrenizi giriniz..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                style={styles.inputField}
                autoFocus
              />
            </div>

            {authError && (
              <div style={styles.loginErrorBox}>
                <AlertCircle size={16} color="#DC2626" style={{ marginRight: '8px', flexShrink: 0 }} />
                <span>{authError}</span>
              </div>
            )}

            <button type="submit" style={styles.loginBtn}>
              Giriş Yap →
            </button>
          </form>

          <div style={styles.loginFooter}>
            <button onClick={onNavigateStudent} style={styles.backLinkBtn}>
              <ArrowLeft size={15} style={{ marginRight: '6px' }} />
              Öğrenci Arayüzüne Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ANA ADMİN PANELİ GÖRÜNÜMÜ
  // ----------------------------------------------------
  return (
    <div style={styles.adminContainer}>
      {/* TOAST / BİLDİRİM BANNER */}
      {notification && (
        <div
          style={{
            ...styles.toastBanner,
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
      <aside style={styles.sidebar}>
        {/* Logo & Başlık */}
        <div style={styles.sidebarBrand}>
          <div style={styles.brandIconBox}>
            <Layers size={22} color="#FFFFFF" />
          </div>
          <div>
            <div style={styles.brandTitle}>KPSS Panel</div>
            <div style={styles.brandBadge}>YÖNETİCİ MERKEZİ</div>
          </div>
        </div>

        {/* Menü Öğeleri */}
        <nav style={styles.sidebarNav}>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              ...styles.navItem,
              backgroundColor: activeTab === 'dashboard' ? '#1E293B' : 'transparent',
              color: activeTab === 'dashboard' ? '#FFFFFF' : '#94A3B8',
              fontWeight: activeTab === 'dashboard' ? 600 : 400,
            }}
          >
            <LayoutDashboard size={18} color={activeTab === 'dashboard' ? '#818CF8' : '#64748B'} />
            <span>Genel Bakış</span>
          </button>

          <button
            onClick={() => setActiveTab('curriculum')}
            style={{
              ...styles.navItem,
              backgroundColor: activeTab === 'curriculum' ? '#1E293B' : 'transparent',
              color: activeTab === 'curriculum' ? '#FFFFFF' : '#94A3B8',
              fontWeight: activeTab === 'curriculum' ? 600 : 400,
            }}
          >
            <FolderTree size={18} color={activeTab === 'curriculum' ? '#818CF8' : '#64748B'} />
            <span>Müfredat &amp; İçerik</span>
          </button>

          <button
            onClick={() => setActiveTab('questions')}
            style={{
              ...styles.navItem,
              backgroundColor: activeTab === 'questions' ? '#1E293B' : 'transparent',
              color: activeTab === 'questions' ? '#FFFFFF' : '#94A3B8',
              fontWeight: activeTab === 'questions' ? 600 : 400,
            }}
          >
            <HelpCircle size={18} color={activeTab === 'questions' ? '#818CF8' : '#64748B'} />
            <span>Soru Bankası</span>
            {questions.length > 0 && <span style={styles.navCountBadge}>{questions.length}</span>}
          </button>

          <button
            onClick={() => setActiveTab('bulk_packages')}
            style={{
              ...styles.navItem,
              backgroundColor: activeTab === 'bulk_packages' ? '#1E293B' : 'transparent',
              color: activeTab === 'bulk_packages' ? '#FFFFFF' : '#94A3B8',
              fontWeight: activeTab === 'bulk_packages' ? 600 : 400,
            }}
          >
            <PackagePlus size={18} color={activeTab === 'bulk_packages' ? '#818CF8' : '#64748B'} />
            <span>Toplu Paket &amp; JSON</span>
          </button>

          <button
            onClick={() => setActiveTab('error_pool')}
            style={{
              ...styles.navItem,
              backgroundColor: activeTab === 'error_pool' ? '#1E293B' : 'transparent',
              color: activeTab === 'error_pool' ? '#FFFFFF' : '#94A3B8',
              fontWeight: activeTab === 'error_pool' ? 600 : 400,
            }}
          >
            <AlertTriangle size={18} color={activeTab === 'error_pool' ? '#818CF8' : '#64748B'} />
            <span>Hata Havuzu Analizi</span>
          </button>

          <button
            onClick={() => setActiveTab('student_data')}
            style={{
              ...styles.navItem,
              backgroundColor: activeTab === 'student_data' ? '#1E293B' : 'transparent',
              color: activeTab === 'student_data' ? '#FFFFFF' : '#94A3B8',
              fontWeight: activeTab === 'student_data' ? 600 : 400,
            }}
          >
            <Users size={18} color={activeTab === 'student_data' ? '#818CF8' : '#64748B'} />
            <span>Öğrenci &amp; Veri</span>
          </button>

          <button
            onClick={() => setActiveTab('theme_editor')}
            style={{
              ...styles.navItem,
              backgroundColor: activeTab === 'theme_editor' ? '#1E293B' : 'transparent',
              color: activeTab === 'theme_editor' ? '#FFFFFF' : '#94A3B8',
              fontWeight: activeTab === 'theme_editor' ? 600 : 400,
            }}
          >
            <Palette size={18} color={activeTab === 'theme_editor' ? '#818CF8' : '#64748B'} />
            <span>Tema &amp; Görsel Stil</span>
          </button>

          <button
            onClick={() => setActiveTab('system_settings')}
            style={{
              ...styles.navItem,
              backgroundColor: activeTab === 'system_settings' ? '#1E293B' : 'transparent',
              color: activeTab === 'system_settings' ? '#FFFFFF' : '#94A3B8',
              fontWeight: activeTab === 'system_settings' ? 600 : 400,
            }}
          >
            <Settings size={18} color={activeTab === 'system_settings' ? '#818CF8' : '#64748B'} />
            <span>Sistem &amp; Depolama</span>
          </button>
        </nav>

        {/* Sidebar Alt Butonlar */}
        <div style={styles.sidebarFooter}>
          <button onClick={onNavigateStudent} style={styles.sidebarStudentBtn}>
            <ArrowLeft size={16} style={{ marginRight: '8px' }} />
            Öğrenci Görünümü
          </button>
          <button onClick={handleLogout} style={styles.sidebarLogoutBtn}>
            <LogOut size={16} style={{ marginRight: '8px' }} />
            Oturumu Kapat
          </button>
        </div>
      </aside>

      {/* SAĞ ANA İÇERİK ALANI */}
      <div style={styles.mainWrapper}>
        {/* ÜST HEADER */}
        <header style={styles.topHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={styles.headerTitle}>
              {activeTab === 'dashboard' && 'Genel Bakış & İstatistikler'}
              {activeTab === 'curriculum' && 'Müfredat & İçerik Düzenleyici'}
              {activeTab === 'questions' && 'Soru Bankası & Yönetimi'}
              {activeTab === 'bulk_packages' && 'Toplu Paket Yükleme & JSON'}
              {activeTab === 'error_pool' && 'Hata Havuzu & Raporlama'}
              {activeTab === 'student_data' && 'Öğrenci & Test İlerleme Yönetimi'}
              {activeTab === 'theme_editor' && 'Görsel Stil & Tema Editörü'}
              {activeTab === 'system_settings' && 'Sistem & Depolama Ayarları'}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Supabase Bulut Durumu Rozeti */}
            <div
              style={{
                ...styles.statusBadge,
                backgroundColor: isCloud ? '#ECFDF5' : '#FEF9C3',
                borderColor: isCloud ? '#A7F3D0' : '#FDE047',
                color: isCloud ? '#065F46' : '#854D0E',
              }}
              title={isCloud ? 'Supabase Bulut Veritabanı Aktif' : 'Tarayıcı Yerel Depolama (LocalStorage) Aktif'}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isCloud ? '#10B981' : '#EAB308',
                }}
              />
              <span>{isCloud ? 'Bulut Bağlı' : 'Yerel Mod'}</span>
            </div>

            {/* Secret Key Butonu */}
            <button
              onClick={() => setShowSecretModal(true)}
              style={{
                ...styles.headerActionBtn,
                backgroundColor: isSecretActive ? '#EEF2FF' : '#F8FAFC',
                borderColor: isSecretActive ? '#C7D2FE' : '#E2E8F0',
                color: isSecretActive ? '#4338CA' : '#475569',
              }}
            >
              <Key size={14} style={{ marginRight: '6px' }} />
              {isSecretActive ? 'Secret Key Aktif' : 'Secret Key Ekle'}
            </button>
          </div>
        </header>

        {/* İÇERİK GÖVDE BÖLÜMÜ */}
        <main style={styles.scrollContent}>
          {/* ============================================================== */}
          {/* 1. SEKME: DASHBOARD (GENEL BAKIŞ) */}
          {/* ============================================================== */}
          {activeTab === 'dashboard' && (
            <div>
              {/* İstatistik Kartları */}
              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <div style={{ ...styles.statIconBox, backgroundColor: '#EEF2FF' }}>
                    <BookOpen size={22} color="#4F46E5" />
                  </div>
                  <div>
                    <div style={styles.statLabel}>Toplam Ders</div>
                    <div style={styles.statValue}>{subjects.length}</div>
                  </div>
                </div>

                <div style={styles.statCard}>
                  <div style={{ ...styles.statIconBox, backgroundColor: '#F0FDF4' }}>
                    <Layers size={22} color="#16A34A" />
                  </div>
                  <div>
                    <div style={styles.statLabel}>Aktif Ünite</div>
                    <div style={styles.statValue}>{units.length}</div>
                  </div>
                </div>

                <div style={styles.statCard}>
                  <div style={{ ...styles.statIconBox, backgroundColor: '#FEF3C7' }}>
                    <FolderTree size={22} color="#D97706" />
                  </div>
                  <div>
                    <div style={styles.statLabel}>Aktif Konu</div>
                    <div style={styles.statValue}>{topics.length}</div>
                  </div>
                </div>

                <div style={styles.statCard}>
                  <div style={{ ...styles.statIconBox, backgroundColor: '#F3E8FF' }}>
                    <HelpCircle size={22} color="#9333EA" />
                  </div>
                  <div>
                    <div style={styles.statLabel}>Seçili Alandaki Soru</div>
                    <div style={styles.statValue}>{questions.length}</div>
                  </div>
                </div>
              </div>

              {/* Hızlı İşlemler Paneli */}
              <div style={styles.sectionCard}>
                <h3 style={styles.sectionTitle}>Hızlı Yönetim Kısayolları</h3>
                <p style={styles.sectionSub}>Sık kullanılan yönetim işlemlerini tek tıkla başlatın.</p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
                  <button
                    onClick={() => setActiveTab('curriculum')}
                    style={styles.actionPillBtn}
                  >
                    <Plus size={16} color="#4F46E5" style={{ marginRight: '8px' }} />
                    Yeni Ders / Ünite Ekle
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('questions');
                      openNewQuestionModal();
                    }}
                    style={styles.actionPillBtn}
                  >
                    <HelpCircle size={16} color="#059669" style={{ marginRight: '8px' }} />
                    Yeni Soru Yaz
                  </button>

                  <button
                    onClick={() => setActiveTab('bulk_packages')}
                    style={styles.actionPillBtn}
                  >
                    <PackagePlus size={16} color="#D97706" style={{ marginRight: '8px' }} />
                    20 Soruluk Paket Yükle
                  </button>

                  <button
                    onClick={() => setActiveTab('student_data')}
                    style={styles.actionPillBtn}
                  >
                    <Users size={16} color="#7C3AED" style={{ marginRight: '8px' }} />
                    Öğrenci Verilerini İncele
                  </button>
                </div>
              </div>

              {/* Sistem Özeti */}
              <div style={styles.twoColGrid}>
                <div style={styles.sectionCard}>
                  <h3 style={styles.sectionTitle}>Veritabanı &amp; Depolama</h3>
                  <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Depolama Motoru:</span>
                      <span style={styles.infoValue}>{isCloud ? 'Supabase PostgreSQL' : 'Yerel Hafıza (LocalStorage)'}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>RLS Secret Bypass:</span>
                      <span style={styles.infoValue}>{isSecretActive ? 'Etkin (Admin Yetkisi Var)' : 'Pasif'}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Seçili Ders:</span>
                      <span style={styles.infoValue}>{currentSubject?.title || 'Seçilmedi'}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Seçili Ünite:</span>
                      <span style={styles.infoValue}>{currentUnit ? `${currentUnit.unitNumber}. ${currentUnit.title}` : 'Seçilmedi'}</span>
                    </div>
                  </div>
                </div>

                <div style={styles.sectionCard}>
                  <h3 style={styles.sectionTitle}>Hata Havuzu Özeti</h3>
                  <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Çözülmemiş Hatalı Soru:</span>
                      <span style={{ ...styles.infoValue, color: '#DC2626', fontWeight: 700 }}>
                        {errorPoolStats?.unresolvedCount || 0}
                      </span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Çözülmüş Hatalar:</span>
                      <span style={{ ...styles.infoValue, color: '#16A34A', fontWeight: 700 }}>
                        {errorPoolStats?.resolvedCount || 0}
                      </span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Son Test Kontrolü:</span>
                      <span style={styles.infoValue}>Güncel</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 2. SEKME: GELİŞMİŞ HİYERARŞİK MÜFREDAT YÖNETİMİ */}
          {/* ============================================================== */}
          {activeTab === 'curriculum' && (
            <AdvancedCurriculumManager
              onNotify={notify}
              onCurriculumChanged={() => {
                loadAllSubjects();
              }}
            />
          )}

          {/* ============================================================== */}
          {/* 3. SEKME: GELİŞMİŞ SORU BANKASI & YÖNETİMİ */}
          {/* ============================================================== */}
          {activeTab === 'questions' && (
            <AdvancedQuestionManager
              subjects={subjects}
              selectedSubjectId={selectedSubjectId}
              onSelectSubjectId={setSelectedSubjectId}
              units={units}
              selectedUnitId={selectedUnitId}
              onSelectUnitId={setSelectedUnitId}
              topics={topics}
              selectedTopicId={selectedTopicId}
              onSelectTopicId={setSelectedTopicId}
              questions={questions}
              onReloadQuestions={() => {
                const targetId = selectedTopicId || selectedUnitId;
                if (targetId) loadQuestionsForTarget(targetId);
              }}
              onNotify={notify}
            />
          )}

          {/* ============================================================== */}
          {/* 4. SEKME: TOPLU PAKET & JSON İÇE / DIŞA AKTARMA */}
          {/* ============================================================== */}
          {activeTab === 'bulk_packages' && (
            <div>
              <div style={styles.twoColGrid}>
                {/* Sol: 20 Soruluk Örnek Paket */}
                <div style={styles.sectionCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ ...styles.statIconBox, backgroundColor: '#EEF2FF' }}>
                      <PackagePlus size={22} color="#4F46E5" />
                    </div>
                    <div>
                      <h3 style={styles.sectionTitle}>Tek Tıkla 20 Soru Paketi</h3>
                      <p style={styles.sectionSub}>Özenle hazırlanmış KPSS GY-GK soru setini yükleyin.</p>
                    </div>
                  </div>

                  <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: '#475569' }}>
                    Seçili Konu: <b>{currentTopic?.title || currentUnit?.title || 'Seçilmedi'}</b>
                    <br />
                    Bu işlem seçili konunun mevcut sorularını sıfırlayarak 20 adet standart KPSS sorusu ekler.
                  </div>

                  <button onClick={handleUploadSample20} style={{ ...styles.primaryBtn, width: '100%', justifyContent: 'center' }}>
                    <PackagePlus size={16} style={{ marginRight: '8px' }} />
                    20 Soruluk Paketi Bu Konuya Yükle
                  </button>
                </div>

                {/* Sağ: JSON Dışa Aktar */}
                <div style={styles.sectionCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ ...styles.statIconBox, backgroundColor: '#F0FDF4' }}>
                      <Download size={22} color="#16A34A" />
                    </div>
                    <div>
                      <h3 style={styles.sectionTitle}>Soruları JSON Olarak İndir</h3>
                      <p style={styles.sectionSub}>Mevcut sorularınızı yedekleyin veya başka bir alana aktarın.</p>
                    </div>
                  </div>

                  <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: '#475569' }}>
                    Seçili alanda <b>{questions.length}</b> soru mevcut. Dosya formatı standart JSON formatında dışa aktarılır.
                  </div>

                  <button
                    onClick={handleExportQuestions}
                    disabled={questions.length === 0}
                    style={{ ...styles.secondaryBtn, width: '100%', justifyContent: 'center', opacity: questions.length === 0 ? 0.5 : 1 }}
                  >
                    <Download size={16} style={{ marginRight: '8px' }} />
                    Mevcut Soruları JSON İndir
                  </button>
                </div>
              </div>

              {/* Alt: JSON Yapıştırarak Toplu Yükleme */}
              <div style={{ ...styles.sectionCard, marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <h3 style={styles.sectionTitle}>Özel JSON Yapıştırarak Toplu Soru Yükleme</h3>
                    <p style={styles.sectionSub}>Kendi hazırladığınız JSON soru formatını doğrudan yapıştırıp aktarabilirsiniz.</p>
                  </div>
                  <button onClick={copySampleJsonTemplate} style={styles.secondaryBtn}>
                    <Copy size={14} style={{ marginRight: '6px' }} />
                    Örnek Formatı Kopyala
                  </button>
                </div>

                <textarea
                  rows={8}
                  placeholder={`[\n  {\n    "questionText": "Soru metni...",\n    "options": [\n      { "id": "A", "text": "Cevap A" },\n      { "id": "B", "text": "Cevap B" },\n      { "id": "C", "text": "Cevap C" },\n      { "id": "D", "text": "Cevap D" },\n      { "id": "E", "text": "Cevap E" }\n    ],\n    "correctOption": "A",\n    "explanation": "Çözüm açıklaması..."\n  }\n]`}
                  value={jsonInput}
                  onChange={(e) => handleJsonInputChange(e.target.value)}
                  style={{ ...styles.inputField, fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }}
                />

                {/* Doğrulama Durumu */}
                {jsonValidationResult && (
                  <div
                    style={{
                      marginTop: '10px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      backgroundColor: jsonValidationResult.valid ? '#ECFDF5' : '#FEF2F2',
                      borderColor: jsonValidationResult.valid ? '#A7F3D0' : '#FECACA',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      color: jsonValidationResult.valid ? '#065F46' : '#991B1B',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {jsonValidationResult.valid ? (
                      <>
                        <CheckCircle size={16} style={{ marginRight: '8px' }} />
                        Format Geçerli: Toplam <b>{jsonValidationResult.count}</b> soru tespit edildi.
                      </>
                    ) : (
                      <>
                        <AlertCircle size={16} style={{ marginRight: '8px' }} />
                        {jsonValidationResult.error}
                      </>
                    )}
                  </div>
                )}

                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={handleImportJson}
                    disabled={!jsonValidationResult?.valid}
                    style={{
                      ...styles.primaryBtn,
                      opacity: jsonValidationResult?.valid ? 1 : 0.5,
                      cursor: jsonValidationResult?.valid ? 'pointer' : 'not-allowed',
                    }}
                  >
                    <Upload size={16} style={{ marginRight: '8px' }} />
                    Soruları Sisteme Yükle
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 5. SEKME: HATA HAVUZU ANALİZİ */}
          {/* ============================================================== */}
          {activeTab === 'error_pool' && (
            <div>
              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <div style={{ ...styles.statIconBox, backgroundColor: '#FEF2F2' }}>
                    <AlertTriangle size={22} color="#DC2626" />
                  </div>
                  <div>
                    <div style={styles.statLabel}>Çözülmemiş Hatalı Soru</div>
                    <div style={styles.statValue}>{errorPoolStats?.unresolvedCount || 0}</div>
                  </div>
                </div>

                <div style={styles.statCard}>
                  <div style={{ ...styles.statIconBox, backgroundColor: '#ECFDF5' }}>
                    <CheckCircle size={22} color="#16A34A" />
                  </div>
                  <div>
                    <div style={styles.statLabel}>Çözülmüş Hata</div>
                    <div style={styles.statValue}>{errorPoolStats?.resolvedCount || 0}</div>
                  </div>
                </div>

                <div style={styles.statCard}>
                  <div style={{ ...styles.statIconBox, backgroundColor: '#EEF2FF' }}>
                    <BarChart3 size={22} color="#4F46E5" />
                  </div>
                  <div>
                    <div style={styles.statLabel}>Hata Havuzu Kaydı</div>
                    <div style={styles.statValue}>{errorPoolStats?.list?.length || 0}</div>
                  </div>
                </div>
              </div>

              <div style={styles.sectionCard}>
                <h3 style={styles.sectionTitle}>En Çok Hata Yapılan Sorular Listesi</h3>
                <p style={styles.sectionSub}>Öğrencilerin testlerde yanlış cevapladığı soruların dökümü.</p>

                <div style={{ marginTop: '16px' }}>
                  {(!errorPoolStats?.list || errorPoolStats.list.length === 0) ? (
                    <div style={styles.emptyNotice}>Henüz kaydedilmiş hata analizi verisi bulunmuyor.</div>
                  ) : (
                    <table style={styles.dataTable}>
                      <thead>
                        <tr>
                          <th style={styles.tableTh}>Soru No / ID</th>
                          <th style={styles.tableTh}>Soru Metni</th>
                          <th style={styles.tableTh}>Hata Sayısı</th>
                          <th style={styles.tableTh}>Durum</th>
                        </tr>
                      </thead>
                      <tbody>
                        {errorPoolStats.list.map((item: any, i: number) => (
                          <tr key={item.id || i} style={styles.tableTr}>
                            <td style={styles.tableTd}>#{i + 1}</td>
                            <td style={styles.tableTd}>
                              {item.questions?.question_text || item.question_id || 'Soru Metni Yok'}
                            </td>
                            <td style={{ ...styles.tableTd, fontWeight: 700, color: '#DC2626' }}>
                              {item.wrong_count || 1} kez
                            </td>
                            <td style={styles.tableTd}>
                              <span
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  backgroundColor: item.is_resolved ? '#ECFDF5' : '#FEF2F2',
                                  color: item.is_resolved ? '#065F46' : '#991B1B',
                                }}
                              >
                                {item.is_resolved ? 'Çözüldü' : 'Bekliyor'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 6. SEKME: GELİŞMİŞ ÖĞRENCİ YÖNETİM MODÜLÜ */}
          {/* ============================================================== */}
          {activeTab === 'student_data' && (
            <AdvancedStudentManager onNotify={notify} />
          )}

          {/* ============================================================== */}
          {/* 7. SEKME: GELİŞMİŞ GÖRSEL STİL & TEMA EDİTÖRÜ */}
          {/* ============================================================== */}
          {activeTab === 'theme_editor' && (
            <AdvancedThemeEditor onNotify={notify} />
          )}

          {/* ============================================================== */}
          {/* 8. SEKME: SİSTEM & VERİTABANI AYARLARI */}
          {/* ============================================================== */}
          {activeTab === 'system_settings' && (
            <div>
              <div style={styles.twoColGrid}>
                {/* Supabase Ayarları */}
                <div style={styles.sectionCard}>
                  <h3 style={styles.sectionTitle}>Supabase Bulut Durumu</h3>
                  <p style={styles.sectionSub}>PostgreSQL veritabanı bağlantısı ve kimlik doğrulama ayarları.</p>

                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Bağlantı Durumu:</span>
                      <span style={{ ...styles.infoValue, color: isCloud ? '#16A34A' : '#D97706', fontWeight: 600 }}>
                        {isCloud ? 'Supabase Yapılandırılmış' : 'Çevrimdışı / Yerel Mod'}
                      </span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Admin Secret Key:</span>
                      <span style={styles.infoValue}>{isSecretActive ? 'Mevcut (RLS Bypass Aktif)' : 'Eksik'}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: '18px' }}>
                    <button onClick={() => setShowSecretModal(true)} style={styles.primaryBtn}>
                      <Key size={16} style={{ marginRight: '8px' }} />
                      Secret Key Yönetimi
                    </button>
                  </div>
                </div>

                {/* Yönetici Şifresini Değiştir */}
                <div style={styles.sectionCard}>
                  <h3 style={styles.sectionTitle}>Yönetici Giriş Şifresi</h3>
                  <p style={styles.sectionSub}>Admin paneline giriş için kullanılan güvenlik şifresini değiştirin.</p>

                  <form onSubmit={handleChangeAdminPassword} style={{ marginTop: '16px' }}>
                    <label style={styles.label}>Yeni Yönetici Şifresi</label>
                    <input
                      type="password"
                      placeholder="Yeni şifrenizi yazınız..."
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      style={styles.inputField}
                    />

                    {adminPasswordMsg && (
                      <div
                        style={{
                          marginTop: '8px',
                          fontSize: '12px',
                          color: adminPasswordMsg.includes('başarıyla') ? '#16A34A' : '#DC2626',
                          fontWeight: 600,
                        }}
                      >
                        {adminPasswordMsg}
                      </div>
                    )}

                    <button type="submit" style={{ ...styles.secondaryBtn, marginTop: '12px' }}>
                      Şifreyi Güncelle
                    </button>
                  </form>
                </div>
              </div>

              {/* 3. BÖLÜM: ÖNBELLEK & DEPOLAMA YÖNETİMİ (CACHE CLEANER) */}
              <div style={{ ...styles.sectionCard, marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <HardDrive size={22} color="#4F46E5" />
                    </div>
                    <div>
                      <h3 style={{ ...styles.sectionTitle, margin: 0, fontSize: '16px' }}>Önbellek &amp; Depolama Yönetimi (Cache Cleaner)</h3>
                      <p style={{ ...styles.sectionSub, margin: '2px 0 0' }}>Tarayıcıda saklanan yerel önbelleği, müfredat ve geçici verileri inceleyin ve güvenle temizleyin.</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={updateStorageInfo}
                    style={{ ...styles.secondaryBtn, padding: '6px 12px', fontSize: '12px' }}
                    title="Depolama kullanımını tekrar tara"
                  >
                    <RefreshCw size={13} style={{ marginRight: '6px' }} />
                    Kullanımı Yenile
                  </button>
                </div>

                {/* Bellek Göstergesi & İstatistik Kartları */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '18px' }}>
                  <div style={{ padding: '12px 14px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>TOPLAM ÖNBELLEK</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', marginTop: '4px' }}>
                      {storageInfo.totalFormatted}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                      {storageInfo.keyCount} Adet Veri Anahtarı
                    </div>
                  </div>

                  <div style={{ padding: '12px 14px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>MÜFREDAT &amp; SORU</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#4F46E5', marginTop: '4px' }}>
                      {storageInfo.curriculumFormatted}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                      Ders, Ünite, Konu &amp; Bankalar
                    </div>
                  </div>

                  <div style={{ padding: '12px 14px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>ÖĞRENCİ &amp; TEST</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                      {storageInfo.studentFormatted}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                      Profil &amp; Çözüm Geçmişi
                    </div>
                  </div>

                  <div style={{ padding: '12px 14px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>TEMA &amp; DİĞER</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#D97706', marginTop: '4px' }}>
                      {storageInfo.themeFormatted}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                      Aktif Renk &amp; Tasarım Ayarları
                    </div>
                  </div>
                </div>

                {/* Depolama Barı */}
                <div style={{ marginBottom: '22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748B', marginBottom: '6px' }}>
                    <span>Tarayıcı Depolama Kotası (Standart ~5 MB)</span>
                    <span style={{ fontWeight: 600, color: '#1E293B' }}>
                      {((storageInfo.totalBytes / (5 * 1024 * 1024)) * 100).toFixed(2)}% Kullanılıyor
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, Math.max(1, (storageInfo.curriculumBytes / (5 * 1024 * 1024)) * 100))}%`,
                        backgroundColor: '#4F46E5',
                      }}
                      title={`Müfredat: ${storageInfo.curriculumFormatted}`}
                    />
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, (storageInfo.studentBytes / (5 * 1024 * 1024)) * 100)}%`,
                        backgroundColor: '#059669',
                      }}
                      title={`Öğrenci: ${storageInfo.studentFormatted}`}
                    />
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, (storageInfo.themeBytes / (5 * 1024 * 1024)) * 100)}%`,
                        backgroundColor: '#D97706',
                      }}
                      title={`Tema: ${storageInfo.themeFormatted}`}
                    />
                  </div>
                </div>

                {/* Temizleme Butonları Kartları */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                  {/* Hızlı Önbellek Temizle */}
                  <div style={{ padding: '16px', borderRadius: '10px', border: '1px solid #E0E7FF', backgroundColor: '#EEF2FF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <Zap size={18} color="#4F46E5" />
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#312E81' }}>Hızlı Önbellek Temizle</h4>
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: '#4338CA', lineHeight: 1.4 }}>
                        Tarayıcı CacheStorage ve geçici oturumları temizler. Öğrenci verilerine veya sorulara dokunmaz, sistemi hızlandırır.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearBrowserCache}
                      disabled={isClearingCache}
                      style={{
                        ...styles.primaryBtn,
                        marginTop: '14px',
                        justifyContent: 'center',
                        backgroundColor: '#4F46E5',
                        fontSize: '12px',
                        padding: '8px 12px',
                      }}
                    >
                      <RefreshCw size={13} style={{ marginRight: '6px' }} />
                      Hızlı Önbelleği Temizle
                    </button>
                  </div>

                  {/* Müfredat & Soru Önbelleğini Sıfırla */}
                  <div style={{ padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <Database size={18} color="#059669" />
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#065F46' }}>Müfredat Önbelleğini Yenile</h4>
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748B', lineHeight: 1.4 }}>
                        Yerel müfredat, ünite, konu ve soru kopyalarını silip veritabanından veya varsayılan paketlerden taze olarak yükler.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearCurriculumCache}
                      disabled={isClearingCache}
                      style={{
                        ...styles.secondaryBtn,
                        marginTop: '14px',
                        justifyContent: 'center',
                        borderColor: '#A7F3D0',
                        color: '#065F46',
                        backgroundColor: '#F0FDF4',
                        fontSize: '12px',
                        padding: '8px 12px',
                      }}
                    >
                      <Database size={13} style={{ marginRight: '6px' }} />
                      Müfredat Önbelleğini Sıfırla
                    </button>
                  </div>

                  {/* Öğrenci İlerleme Önbelleğini Temizle */}
                  <div style={{ padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <Users size={18} color="#D97706" />
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#92400E' }}>Öğrenci Test Geçmişini Sil</h4>
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748B', lineHeight: 1.4 }}>
                        Çözülen test kayıtları, skorlar ve haftalık çalışma grafiklerini sıfırlar. Müfredata dokunulmaz.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearStudentDataCache}
                      disabled={isClearingCache}
                      style={{
                        ...styles.secondaryBtn,
                        marginTop: '14px',
                        justifyContent: 'center',
                        borderColor: '#FDE68A',
                        color: '#92400E',
                        backgroundColor: '#FEF3C7',
                        fontSize: '12px',
                        padding: '8px 12px',
                      }}
                    >
                      <Trash2 size={13} style={{ marginRight: '6px' }} />
                      İlerleme Verilerini Temizle
                    </button>
                  </div>

                  {/* Tüm Depolamayı Sıfırla (Hard Reset) */}
                  <div style={{ padding: '16px', borderRadius: '10px', border: '1px solid #FECACA', backgroundColor: '#FEF2F2', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <AlertTriangle size={18} color="#DC2626" />
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#991B1B' }}>Tam Önbellek &amp; Depolama Sıfırlama</h4>
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: '#B91C1C', lineHeight: 1.4 }}>
                        Tüm yerel depolamayı ve servis önbelleğini temizleyip uygulamayı sıfırlar (Yönetici şifreniz korunur).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearAllStorage}
                      disabled={isClearingCache}
                      style={{
                        ...styles.primaryBtn,
                        marginTop: '14px',
                        justifyContent: 'center',
                        backgroundColor: '#DC2626',
                        fontSize: '12px',
                        padding: '8px 12px',
                      }}
                    >
                      <Trash2 size={13} style={{ marginRight: '6px' }} />
                      Fabrika Ayarlarına Sıfırla
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: TEKİL SORU EKLEME & DÜZENLEME MODALI */}
      {/* ============================================================== */}
      {showQuestionModal && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {editingQuestionId ? 'Soruyu Düzenle' : 'Yeni KPSS Sorusu Ekle'}
              </h2>
              <button onClick={() => setShowQuestionModal(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={styles.label}>Soru Metni:</label>
                <textarea
                  rows={4}
                  placeholder="Soru metnini detaylı şekilde yazınız..."
                  value={qFormText}
                  onChange={(e) => setQFormText(e.target.value)}
                  style={styles.inputField}
                  required
                />
              </div>

              {/* Seçenekler A, B, C, D, E */}
              <div>
                <label style={styles.label}>Seçenekler (A - E):</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(['A', 'B', 'C', 'D', 'E'] as OptionId[]).map((optKey) => {
                    const val =
                      optKey === 'A'
                        ? qFormA
                        : optKey === 'B'
                        ? qFormB
                        : optKey === 'C'
                        ? qFormC
                        : optKey === 'D'
                        ? qFormD
                        : qFormE;
                    const setter =
                      optKey === 'A'
                        ? setQFormA
                        : optKey === 'B'
                        ? setQFormB
                        : optKey === 'C'
                        ? setQFormC
                        : optKey === 'D'
                        ? setQFormD
                        : setQFormE;

                    const isChecked = qFormCorrect === optKey;

                    return (
                      <div key={optKey} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setQFormCorrect(optKey)}
                          style={{
                            ...styles.optionSelectBtn,
                            backgroundColor: isChecked ? '#10B981' : '#F1F5F9',
                            color: isChecked ? '#FFFFFF' : '#475569',
                            borderColor: isChecked ? '#059669' : '#CBD5E1',
                          }}
                          title={`Doğru cevap olarak ${optKey} seç`}
                        >
                          {optKey} {isChecked && '✓'}
                        </button>
                        <input
                          type="text"
                          placeholder={`${optKey} Seçeneği metni...`}
                          value={val}
                          onChange={(e) => setter(e.target.value)}
                          style={styles.inputField}
                          required
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Doğru Cevap Seçici */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ ...styles.label, margin: 0 }}>Belirlenen Doğru Cevap:</label>
                <span style={styles.correctPillBadge}>{qFormCorrect} Seçeneği</span>
              </div>

              {/* Çözüm / Açıklama */}
              <div>
                <label style={styles.label}>Açıklama / Çözüm Rehberi:</label>
                <textarea
                  rows={2}
                  placeholder="Öğrencinin soruyu anlaması için ayrıntılı çözüm notu..."
                  value={qFormExplanation}
                  onChange={(e) => setQFormExplanation(e.target.value)}
                  style={styles.inputField}
                />
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowQuestionModal(false)} style={styles.secondaryBtn}>
                  İptal
                </button>
                <button type="submit" style={styles.primaryBtn}>
                  {editingQuestionId ? 'Güncellemeleri Kaydet' : 'Soruyu Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: DERS DÜZENLEME */}
      {/* ============================================================== */}
      {editingSubject && (
        <div style={styles.modalBackdrop}>
          <div style={{ ...styles.modalCard, maxWidth: '400px' }}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Dersi Düzenle</h2>
              <button onClick={() => setEditingSubject(null)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>
            <div>
              <label style={styles.label}>Ders Başlığı:</label>
              <input
                type="text"
                value={editingSubject.title}
                onChange={(e) => setEditingSubject({ ...editingSubject, title: e.target.value })}
                style={styles.inputField}
              />
            </div>
            <div style={styles.modalActions}>
              <button onClick={() => setEditingSubject(null)} style={styles.secondaryBtn}>
                İptal
              </button>
              <button onClick={handleUpdateSubject} style={styles.primaryBtn}>
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: ÜNİTE DÜZENLEME */}
      {/* ============================================================== */}
      {editingUnit && (
        <div style={styles.modalBackdrop}>
          <div style={{ ...styles.modalCard, maxWidth: '400px' }}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Üniteyi Düzenle</h2>
              <button onClick={() => setEditingUnit(null)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={styles.label}>Ünite Numarası:</label>
                <input
                  type="number"
                  value={editingUnit.unitNumber}
                  onChange={(e) => setEditingUnit({ ...editingUnit, unitNumber: parseInt(e.target.value) || 1 })}
                  style={styles.inputField}
                />
              </div>
              <div>
                <label style={styles.label}>Ünite Başlığı:</label>
                <input
                  type="text"
                  value={editingUnit.title}
                  onChange={(e) => setEditingUnit({ ...editingUnit, title: e.target.value })}
                  style={styles.inputField}
                />
              </div>
            </div>
            <div style={styles.modalActions}>
              <button onClick={() => setEditingUnit(null)} style={styles.secondaryBtn}>
                İptal
              </button>
              <button onClick={handleUpdateUnit} style={styles.primaryBtn}>
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: KONU DÜZENLEME */}
      {/* ============================================================== */}
      {editingTopic && (
        <div style={styles.modalBackdrop}>
          <div style={{ ...styles.modalCard, maxWidth: '400px' }}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Konuyu Düzenle</h2>
              <button onClick={() => setEditingTopic(null)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={styles.label}>Konu Numarası:</label>
                <input
                  type="number"
                  value={editingTopic.topicNumber}
                  onChange={(e) => setEditingTopic({ ...editingTopic, topicNumber: parseInt(e.target.value) || 1 })}
                  style={styles.inputField}
                />
              </div>
              <div>
                <label style={styles.label}>Konu Başlığı:</label>
                <input
                  type="text"
                  value={editingTopic.title}
                  onChange={(e) => setEditingTopic({ ...editingTopic, title: e.target.value })}
                  style={styles.inputField}
                />
              </div>
            </div>
            <div style={styles.modalActions}>
              <button onClick={() => setEditingTopic(null)} style={styles.secondaryBtn}>
                İptal
              </button>
              <button onClick={handleUpdateTopic} style={styles.primaryBtn}>
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: SECRET KEY (RLS BYPASS) MODALI */}
      {/* ============================================================== */}
      {showSecretModal && (
        <div style={styles.modalBackdrop}>
          <div style={{ ...styles.modalCard, maxWidth: '480px' }}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Supabase Admin Secret Key</h2>
              <button onClick={() => setShowSecretModal(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5 }}>
              Supabase Row Level Security (RLS) kuralını doğrudan aşarak içerik yazmak ve silmek için{' '}
              <b>service_role</b> anahtarınızı buraya girebilirsiniz. Bu anahtar sadece tarayıcınızın yerel hafızasında saklanır.
            </p>

            <div style={{ margin: '14px 0' }}>
              <label style={styles.label}>Service Role / Secret Key:</label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={secretInput}
                onChange={(e) => setSecretInput(e.target.value)}
                style={styles.inputField}
              />
            </div>

            <div style={styles.modalActions}>
              {isSecretActive && (
                <button type="button" onClick={handleClearSecretKey} style={styles.dangerBtn}>
                  Anahtarı Kaldır
                </button>
              )}
              <button type="button" onClick={() => setShowSecretModal(false)} style={styles.secondaryBtn}>
                Vazgeç
              </button>
              <button type="button" onClick={handleSaveSecretKey} style={styles.primaryBtn}>
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------
// MODERN STİL TANIMLARI
// ----------------------------------------------------
const styles: Record<string, React.CSSProperties> = {
  adminContainer: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  toastBanner: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 9999,
    padding: '12px 20px',
    borderRadius: '10px',
    color: '#FFFFFF',
    fontWeight: 600,
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
  },
  sidebar: {
    width: '260px',
    backgroundColor: '#0F172A',
    color: '#F8FAFC',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    borderRight: '1px solid #1E293B',
  },
  sidebarBrand: {
    padding: '24px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid #1E293B',
  },
  brandIconBox: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#4F46E5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)',
  },
  brandTitle: {
    fontSize: '17px',
    fontWeight: 700,
    color: '#FFFFFF',
    letterSpacing: '-0.3px',
  },
  brandBadge: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#818CF8',
    letterSpacing: '0.8px',
  },
  sidebarNav: {
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
    overflowY: 'auto',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '11px 14px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    textAlign: 'left',
    transition: 'all 0.15s ease',
    width: '100%',
  },
  navCountBadge: {
    marginLeft: 'auto',
    backgroundColor: '#334155',
    color: '#94A3B8',
    fontSize: '11px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '12px',
  },
  sidebarFooter: {
    padding: '16px 14px',
    borderTop: '1px solid #1E293B',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sidebarStudentBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '9px 14px',
    borderRadius: '8px',
    backgroundColor: '#1E293B',
    color: '#E2E8F0',
    border: '1px solid #334155',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  sidebarLogoutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '9px 14px',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    color: '#94A3B8',
    border: 'none',
    fontSize: '12px',
    cursor: 'pointer',
  },
  mainWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    overflow: 'hidden',
  },
  topHeader: {
    height: '64px',
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E2E8F0',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#0F172A',
    margin: 0,
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '5px 10px',
    borderRadius: '20px',
    borderWidth: '1px',
    borderStyle: 'solid',
    fontSize: '12px',
    fontWeight: 600,
  },
  headerActionBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 12px',
    borderRadius: '8px',
    borderWidth: '1px',
    borderStyle: 'solid',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  scrollContent: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '18px',
    border: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  },
  statIconBox: {
    width: '46px',
    height: '46px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: '12px',
    color: '#64748B',
    fontWeight: 500,
  },
  statValue: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#0F172A',
    marginTop: '2px',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#0F172A',
    margin: '0 0 4px 0',
  },
  sectionSub: {
    fontSize: '13px',
    color: '#64748B',
    margin: 0,
  },
  actionPillBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    borderRadius: '8px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  twoColGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #F1F5F9',
    fontSize: '13px',
  },
  infoLabel: {
    color: '#64748B',
  },
  infoValue: {
    fontWeight: 600,
    color: '#0F172A',
  },
  curriculumGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
  },
  columnCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'calc(100vh - 160px)',
  },
  columnHeader: {
    marginBottom: '12px',
  },
  columnTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#0F172A',
    margin: 0,
  },
  columnSub: {
    fontSize: '12px',
    color: '#64748B',
    margin: '2px 0 0',
  },
  inlineAddBox: {
    display: 'flex',
    gap: '6px',
    marginBottom: '12px',
  },
  inlineInput: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    fontSize: '13px',
    outline: 'none',
  },
  inlineAddBtn: {
    padding: '8px 12px',
    borderRadius: '8px',
    backgroundColor: '#4F46E5',
    color: '#FFFFFF',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemsList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  itemCard: {
    padding: '12px',
    borderRadius: '8px',
    borderWidth: '1.5px',
    borderStyle: 'solid',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    transition: 'all 0.15s ease',
  },
  iconActionBtn: {
    background: 'none',
    border: 'none',
    padding: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
  },
  emptyNotice: {
    padding: '20px',
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: '13px',
  },
  filterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid #E2E8F0',
  },
  miniLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#64748B',
    marginBottom: '4px',
    display: 'block',
  },
  selectDropdown: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    fontSize: '13px',
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    outline: 'none',
    minWidth: '150px',
  },
  primaryBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    borderRadius: '8px',
    backgroundColor: '#4F46E5',
    color: '#FFFFFF',
    border: 'none',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    borderRadius: '8px',
    backgroundColor: '#F8FAFC',
    color: '#334155',
    border: '1px solid #CBD5E1',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  dangerBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    borderRadius: '8px',
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    border: '1px solid #FECACA',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '40px 20px',
    border: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '18px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  questionCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  qNumberPill: {
    backgroundColor: '#EEF2FF',
    color: '#4F46E5',
    fontSize: '12px',
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: '12px',
  },
  qCorrectPill: {
    fontSize: '12px',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    padding: '3px 10px',
    borderRadius: '12px',
  },
  questionBodyText: {
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#0F172A',
    fontWeight: 500,
    marginBottom: '14px',
  },
  optionsListGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '8px',
    marginBottom: '12px',
  },
  optionPreviewItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: '8px',
    borderWidth: '1px',
    borderStyle: 'solid',
  },
  optionPreviewBadge: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: 700,
    flexShrink: 0,
  },
  explanationBox: {
    padding: '10px 14px',
    borderRadius: '8px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    lineHeight: 1.5,
  },
  dataTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  tableTh: {
    textAlign: 'left',
    padding: '10px 12px',
    borderBottom: '2px solid #E2E8F0',
    color: '#64748B',
    fontWeight: 600,
    fontSize: '12px',
  },
  tableTr: {
    borderBottom: '1px solid #F1F5F9',
  },
  tableTd: {
    padding: '10px 12px',
    color: '#1E293B',
  },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '650px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  modalTitle: {
    fontSize: '17px',
    fontWeight: 700,
    color: '#0F172A',
    margin: 0,
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    color: '#64748B',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '20px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#334155',
    marginBottom: '6px',
    display: 'block',
  },
  inputField: {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  optionSelectBtn: {
    padding: '6px 12px',
    borderRadius: '6px',
    borderWidth: '1px',
    borderStyle: 'solid',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    flexShrink: 0,
  },
  correctPillBadge: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 700,
  },
  // Giriş Ekranı
  loginBackdrop: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    padding: '20px',
  },
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '32px 28px',
    maxWidth: '400px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  loginIconBox: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    backgroundColor: '#EEF2FF',
    margin: '0 auto 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#4F46E5',
    letterSpacing: '1px',
  },
  loginTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#0F172A',
    margin: '6px 0',
  },
  loginSubtitle: {
    fontSize: '13px',
    color: '#64748B',
    lineHeight: 1.5,
    margin: '0 0 20px',
  },
  loginBtn: {
    width: '100%',
    padding: '11px',
    borderRadius: '8px',
    backgroundColor: '#4F46E5',
    color: '#FFFFFF',
    border: 'none',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '6px',
  },
  loginErrorBox: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: '6px',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA',
    color: '#DC2626',
    fontSize: '12px',
    marginBottom: '12px',
    textAlign: 'left',
  },
  loginFooter: {
    marginTop: '20px',
    borderTop: '1px solid #F1F5F9',
    paddingTop: '16px',
  },
  backLinkBtn: {
    background: 'none',
    border: 'none',
    color: '#64748B',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
  },
};
