import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { Subject, Unit, Topic, Question, OptionId, QuestionBank } from '../types';
import { studentProgressService } from '../services/studentProgressService';
import {
  FolderTree,
  Plus,
  Trash2,
  Edit3,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Layers,
  BookOpen,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  RefreshCw,
  Eye,
  Columns,
  ListTree,
  Lock,
  Unlock,
  Target,
  FileCheck,
  Send,
  Database,
  Sliders,
  Settings,
  HelpCircle,
  FileText,
  PackagePlus,
  LayoutGrid,
} from 'lucide-react';

interface AdvancedCurriculumManagerProps {
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onCurriculumChanged?: () => void;
}

export const AdvancedCurriculumManager: React.FC<AdvancedCurriculumManagerProps> = ({
  onNotify,
  onCurriculumChanged,
}) => {
  // ----------------------------------------------------
  // VERİ DURUMLARI (CANLI & TASLAK)
  // ----------------------------------------------------
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  // Seçili Hiyerarşi (Ders -> Ünite -> Konu -> Soru Bankası)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');

  // 4 Kolon İçin Hızlı Satır İçi (Inline) Ekleme Girişleri
  const [quickSubjectInput, setQuickSubjectInput] = useState('');
  const [quickUnitInput, setQuickUnitInput] = useState('');
  const [quickTopicInput, setQuickTopicInput] = useState('');
  const [quickBankInput, setQuickBankInput] = useState('');

  // 4. Kolon: Seçili Konuya Ait Soru Bankaları Listesi
  const [topicBanks, setTopicBanks] = useState<QuestionBank[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState<boolean>(false);

  // Bir Soru Bankasının Sorularını Yönetme Durumu
  const [managingBank, setManagingBank] = useState<QuestionBank | null>(null);
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [isLoadingBankQuestions, setIsLoadingBankQuestions] = useState<boolean>(false);

  // Görünüm Modu: 4 Kolonlu veya Ağaç (Tree) Görünümü
  const [viewMode, setViewMode] = useState<'columns' | 'tree'>('columns');

  // Taslak Değişiklik Sayacı & Yayınlanma Durumu
  const [draftChangesCount, setDraftChangesCount] = useState<number>(0);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [lastPublishedTime, setLastPublishedTime] = useState<string>(() => {
    return localStorage.getItem('kpss_curriculum_last_published') || 'Yakın zamanda';
  });

  // Genişletilmiş Ağaç Düğümleri
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // ----------------------------------------------------
  // MODAL & FORM DURUMLARI
  // ----------------------------------------------------
  // Ders Ekle / Düzenle
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectFormTitle, setSubjectFormTitle] = useState('');

  // Ünite Ekle / Düzenle
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [unitFormTitle, setUnitFormTitle] = useState('');
  const [unitFormLocked, setUnitFormLocked] = useState(false);

  // Alt Konu / Kazanım Ekle / Düzenle
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [topicFormTitle, setTopicFormTitle] = useState('');
  const [topicFormQuestionCount, setTopicFormQuestionCount] = useState(20);

  // 4. Kolon: Soru Bankası Oluştur / Düzenle Modalı (+ butonuna basınca açılır)
  const [showBankModal, setShowBankModal] = useState(false);
  const [editingBank, setEditingBank] = useState<QuestionBank | null>(null);
  const [bankFormTitle, setBankFormTitle] = useState('');
  const [bankFormDescription, setBankFormDescription] = useState('');
  const [bankFormTargetCount, setBankFormTargetCount] = useState(20);
  const [bankFormType, setBankFormType] = useState('Standart Konu Testi');
  const [bankFormLocked, setBankFormLocked] = useState(false);

  // Soru Ekle / Düzenle Modalı
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [qFormText, setQFormText] = useState('');
  const [qFormA, setQFormA] = useState('');
  const [qFormB, setQFormB] = useState('');
  const [qFormC, setQFormC] = useState('');
  const [qFormD, setQFormD] = useState('');
  const [qFormE, setQFormE] = useState('');
  const [qFormCorrect, setQFormCorrect] = useState<OptionId>('A');
  const [qFormExplanation, setQFormExplanation] = useState('');
  const [qFormDifficulty, setQFormDifficulty] = useState<'Kolay' | 'Orta' | 'Zor'>('Orta');
  const [qFormYear, setQFormYear] = useState('');

  // ----------------------------------------------------
  // VERİLERİ İLK YÜKLEME
  // ----------------------------------------------------
  useEffect(() => {
    loadAllCurriculumData();
  }, []);

  const loadAllCurriculumData = async () => {
    try {
      const subs = await api.getSubjects();
      setSubjects(subs);

      // Tüm üniteleri ve konuları topla
      let allUnits: Unit[] = [];
      let allTopics: Topic[] = [];

      for (const s of subs) {
        const uList = await api.getUnits(s.id);
        allUnits = [...allUnits, ...uList];
        for (const u of uList) {
          const tList = await api.getTopics(u.id);
          allTopics = [...allTopics, ...tList];
        }
      }

      setUnits(allUnits);
      setTopics(allTopics);

      // İlk yüklemede seçim yapılmaz; kullanıcı referans görseldeki gibi temiz boş panelle karşılanır
    } catch (e) {
      console.warn('Müfredat verisi yükleme hatası:', e);
    }
  };

  // Seçili derse ait üniteler
  const currentUnits = useMemo(() => {
    return units
      .filter((u) => u.subjectId === selectedSubjectId)
      .sort((a, b) => (a.unitNumber || 0) - (b.unitNumber || 0));
  }, [units, selectedSubjectId]);

  // Seçili üniteye ait alt konular
  const currentTopics = useMemo(() => {
    return topics
      .filter((t) => t.unitId === selectedUnitId)
      .sort((a, b) => (a.topicNumber || 0) - (b.topicNumber || 0));
  }, [topics, selectedUnitId]);

  // Seçili konuya ait soru bankalarını yükle
  useEffect(() => {
    if (selectedTopicId) {
      loadTopicBanks(selectedTopicId);
    } else {
      setTopicBanks([]);
    }
  }, [selectedTopicId, selectedUnitId]);

  const loadTopicBanks = async (tId: string) => {
    setIsLoadingBanks(true);
    try {
      const banks = await api.getQuestionBanks(tId, selectedUnitId);
      setTopicBanks(banks);
    } catch (e) {
      console.warn('Soru bankaları yükleme hatası:', e);
    } finally {
      setIsLoadingBanks(false);
    }
  };

  // Seçili aktif konu nesnesi
  const currentTopic = useMemo(() => {
    return topics.find((t) => t.id === selectedTopicId);
  }, [topics, selectedTopicId]);

  // Kademeli seçim fonksiyonları (Cascading)
  const handleSelectSubject = (subId: string) => {
    setSelectedSubjectId(subId);
    setSelectedUnitId('');
    setSelectedTopicId('');
    setTopicBanks([]);
  };

  const handleSelectUnit = (unitId: string) => {
    setSelectedUnitId(unitId);
    setSelectedTopicId('');
    setTopicBanks([]);
  };

  const handleSelectTopic = (topicId: string) => {
    setSelectedTopicId(topicId);
  };

  // ----------------------------------------------------
  // HIZLI SATIR İÇİ (INLINE) EKLEME FONKSİYONLARI (KOLON ÜSTÜ)
  // ----------------------------------------------------
  const handleQuickAddSubject = () => {
    if (!quickSubjectInput.trim()) return;
    const newSub: Subject = {
      id: `sub-${Date.now()}`,
      title: quickSubjectInput.trim(),
      totalUnits: 0,
    };
    setSubjects((prev) => [...prev, newSub]);
    setSelectedSubjectId(newSub.id);
    setSelectedUnitId('');
    setSelectedTopicId('');
    setQuickSubjectInput('');
    markAsDraft();
    onNotify(`"${newSub.title}" dersi başarıyla eklendi (Taslak).`, 'success');
  };

  const handleQuickAddUnit = () => {
    if (!selectedSubjectId) {
      alert('Lütfen önce bir ders seçiniz.');
      return;
    }
    if (!quickUnitInput.trim()) return;
    const newUnit: Unit = {
      id: `unit-${Date.now()}`,
      subjectId: selectedSubjectId,
      title: quickUnitInput.trim(),
      unitNumber: currentUnits.length + 1,
      isLocked: false,
      isCompleted: false,
    };
    setUnits((prev) => [...prev, newUnit]);
    setSelectedUnitId(newUnit.id);
    setSelectedTopicId('');
    setQuickUnitInput('');
    markAsDraft();
    onNotify(`"${newUnit.title}" ünitesi başarıyla eklendi (Taslak).`, 'success');
  };

  const handleQuickAddTopic = async () => {
    if (!selectedUnitId) {
      alert('Lütfen önce bir ünite seçiniz.');
      return;
    }
    if (!quickTopicInput.trim()) return;
    const newTopic: Topic = {
      id: `topic-${Date.now()}`,
      unitId: selectedUnitId,
      title: quickTopicInput.trim(),
      topicNumber: currentTopics.length + 1,
      questionCount: 0,
      isLocked: false,
      isCompleted: false,
    };
    setTopics((prev) => [...prev, newTopic]);
    setSelectedTopicId(newTopic.id);
    setQuickTopicInput('');

    // Otomatik olarak bu konuya ait 1. varsayılan Soru Bankasını da oluştur
    const defaultBank: QuestionBank = {
      id: `${newTopic.id}-bank-1`,
      topicId: newTopic.id,
      unitId: selectedUnitId,
      title: `${newTopic.title} Testi 1`,
      bankType: 'Standart Konu Testi',
      targetQuestionCount: 20,
      questionCount: 0,
      orderNumber: 1,
      isLocked: false,
    };
    await api.adminCreateQuestionBank(defaultBank);
    setTopicBanks([defaultBank]);

    markAsDraft();
    onNotify(`"${newTopic.title}" alt konusu ve soru bankası eklendi (Taslak).`, 'success');
  };

  const handleQuickAddBank = async () => {
    if (!selectedTopicId) {
      alert('Lütfen önce bir alt konu seçiniz.');
      return;
    }
    if (!quickBankInput.trim()) return;
    const newBank: QuestionBank = {
      id: `${selectedTopicId}-bank-${Date.now()}`,
      topicId: selectedTopicId,
      unitId: selectedUnitId,
      title: quickBankInput.trim(),
      description: '',
      targetQuestionCount: 20,
      questionCount: 0,
      bankType: 'Standart Konu Testi',
      isLocked: false,
      orderNumber: topicBanks.length + 1,
    };
    await api.adminCreateQuestionBank(newBank);
    setTopicBanks((prev) => [...prev, newBank]);
    setQuickBankInput('');
    markAsDraft();
    onNotify(`"${newBank.title}" soru bankası başarıyla eklendi (Taslak).`, 'success');
  };

  // ----------------------------------------------------
  // DEĞİŞİKLİK SAYACI TETİKLEYİCİSİ
  // ----------------------------------------------------
  const markAsDraft = () => {
    setDraftChangesCount((prev) => prev + 1);
  };

  // ----------------------------------------------------
  // 4. KOLON: SORU BANKASI OLUŞTURMA / YÖNETME AKSİYONLARI
  // ----------------------------------------------------
  const openNewBankModal = () => {
    if (!selectedTopicId) {
      onNotify('Lütfen önce 3. kolondan bir alt konu seçiniz.', 'error');
      return;
    }
    setEditingBank(null);
    setBankFormTitle(`${currentTopic?.title || 'Konu'} Testi ${topicBanks.length + 1}`);
    setBankFormDescription('');
    setBankFormTargetCount(20);
    setBankFormType('Standart Konu Testi');
    setBankFormLocked(false);
    setShowBankModal(true);
  };

  const openEditBankModal = (b: QuestionBank) => {
    setEditingBank(b);
    setBankFormTitle(b.title);
    setBankFormDescription(b.description || '');
    setBankFormTargetCount(b.targetQuestionCount || 20);
    setBankFormType(b.bankType || 'Standart Konu Testi');
    setBankFormLocked(Boolean(b.isLocked));
    setShowBankModal(true);
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopicId) return;
    if (!bankFormTitle.trim()) {
      alert('Lütfen soru bankası başlığını giriniz.');
      return;
    }

    try {
      if (editingBank) {
        const updated: QuestionBank = {
          ...editingBank,
          title: bankFormTitle.trim(),
          description: bankFormDescription.trim(),
          targetQuestionCount: bankFormTargetCount,
          bankType: bankFormType,
          isLocked: bankFormLocked,
        };
        await api.adminUpdateQuestionBank(updated);
        setTopicBanks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
        if (managingBank && managingBank.id === updated.id) {
          setManagingBank(updated);
        }
        onNotify(`"${updated.title}" soru bankası güncellendi.`);
      } else {
        const newBank: QuestionBank = {
          id: `${selectedTopicId}-bank-${Date.now()}`,
          topicId: selectedTopicId,
          unitId: selectedUnitId,
          title: bankFormTitle.trim(),
          description: bankFormDescription.trim(),
          targetQuestionCount: bankFormTargetCount,
          questionCount: 0,
          bankType: bankFormType,
          isLocked: bankFormLocked,
          orderNumber: topicBanks.length + 1,
        };
        await api.adminCreateQuestionBank(newBank);
        setTopicBanks((prev) => [...prev, newBank]);
        onNotify(`Yeni soru bankası "${newBank.title}" başarıyla oluşturuldu.`);
      }
      markAsDraft();
      setShowBankModal(false);
    } catch {
      onNotify('Soru bankası kaydedilemedi', 'error');
    }
  };

  const handleDeleteBank = async (bankId: string, title: string) => {
    if (!confirm(`"${title}" soru bankasını ve içindeki soruları silmek istediğinize emin misiniz?`)) return;
    try {
      await api.adminDeleteQuestionBank(bankId);
      setTopicBanks((prev) => prev.filter((b) => b.id !== bankId));
      if (managingBank && managingBank.id === bankId) {
        setManagingBank(null);
      }
      markAsDraft();
      onNotify(`"${title}" soru bankası silindi.`);
    } catch {
      onNotify('Soru bankası silinemedi', 'error');
    }
  };

  const handleMoveBank = async (idx: number, direction: 'UP' | 'DOWN') => {
    const targetIdx = direction === 'UP' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= topicBanks.length) return;

    const newBanks = [...topicBanks];
    const [moved] = newBanks.splice(idx, 1);
    newBanks.splice(targetIdx, 0, moved);

    newBanks.forEach((b, i) => {
      b.orderNumber = i + 1;
    });

    setTopicBanks(newBanks);
    markAsDraft();

    for (const b of newBanks) {
      await api.adminUpdateQuestionBank(b);
    }
  };

  // ----------------------------------------------------
  // BİR SORU BANKASININ SORULARINI YÖNETME AKSİYONLARI
  // ----------------------------------------------------
  const openManageBankQuestions = async (bank: QuestionBank) => {
    setManagingBank(bank);
    setIsLoadingBankQuestions(true);
    try {
      const allQ = await api.getQuestions(bank.topicId);
      // Bu bankId ile eşleşen veya tek banka varsa tüm sorular
      const filtered = allQ.filter(
        (q) => q.bankId === bank.id || (!q.bankId && topicBanks.length === 1)
      );
      setBankQuestions(filtered);
    } catch (e) {
      console.warn('Bank soruları yükleme hatası:', e);
    } finally {
      setIsLoadingBankQuestions(false);
    }
  };

  const openNewQuestionModal = () => {
    if (!managingBank) return;
    setEditingQuestion(null);
    setQFormText('');
    setQFormA('');
    setQFormB('');
    setQFormC('');
    setQFormD('');
    setQFormE('');
    setQFormCorrect('A');
    setQFormExplanation('');
    setQFormDifficulty('Orta');
    setQFormYear('');
    setShowQuestionModal(true);
  };

  const openEditQuestionModal = (q: Question) => {
    setEditingQuestion(q);
    setQFormText(q.questionText);
    const getOpt = (id: OptionId) => q.options.find((o) => o.id === id)?.text || '';
    setQFormA(getOpt('A'));
    setQFormB(getOpt('B'));
    setQFormC(getOpt('C'));
    setQFormD(getOpt('D'));
    setQFormE(getOpt('E'));
    setQFormCorrect(q.correctOption);
    setQFormExplanation(q.explanation || '');
    setQFormDifficulty(q.difficulty || 'Orta');
    setQFormYear(q.year || '');
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingBank) return;
    if (!qFormText.trim()) {
      alert('Lütfen soru metnini yazınız.');
      return;
    }
    if (!qFormA.trim() || !qFormB.trim() || !qFormC.trim() || !qFormD.trim() || !qFormE.trim()) {
      alert('Lütfen 5 seçeneğin (A, B, C, D, E) tamamını doldurunuz.');
      return;
    }

    const questionData: Question = {
      id: editingQuestion ? editingQuestion.id : `${managingBank.id}-q${Date.now()}`,
      bankId: managingBank.id,
      topicId: managingBank.topicId,
      unitId: managingBank.unitId,
      questionNumber: editingQuestion ? editingQuestion.questionNumber : bankQuestions.length + 1,
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
      difficulty: qFormDifficulty,
      year: qFormYear.trim() || undefined,
    };

    try {
      if (editingQuestion) {
        await api.adminUpdateQuestion(questionData);
        setBankQuestions((prev) =>
          prev.map((q) => (q.id === questionData.id ? questionData : q))
        );
        onNotify('Soru başarıyla güncellendi.');
      } else {
        await api.adminCreateQuestion(questionData);
        const newQuestions = [...bankQuestions, questionData];
        setBankQuestions(newQuestions);

        // Bankadaki soru sayısını güncelle
        const updatedBank = { ...managingBank, questionCount: newQuestions.length };
        setManagingBank(updatedBank);
        setTopicBanks((prev) => prev.map((b) => (b.id === managingBank.id ? updatedBank : b)));
        await api.adminUpdateQuestionBank(updatedBank);
        onNotify('Yeni soru soru bankasına eklendi.');
      }
      markAsDraft();
      setShowQuestionModal(false);
    } catch {
      onNotify('Soru kaydedilemedi', 'error');
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm('Bu soruyu soru bankasından silmek istediğinize emin misiniz?')) return;
    if (!managingBank) return;
    try {
      await api.adminDeleteQuestion(qId);
      const newQuestions = bankQuestions.filter((q) => q.id !== qId);
      setBankQuestions(newQuestions);

      const updatedBank = { ...managingBank, questionCount: newQuestions.length };
      setManagingBank(updatedBank);
      setTopicBanks((prev) => prev.map((b) => (b.id === managingBank.id ? updatedBank : b)));
      await api.adminUpdateQuestionBank(updatedBank);

      markAsDraft();
      onNotify('Soru silindi.');
    } catch {
      onNotify('Soru silinemedi', 'error');
    }
  };

  const handleMoveQuestion = async (idx: number, direction: 'UP' | 'DOWN') => {
    const targetIdx = direction === 'UP' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= bankQuestions.length) return;

    const newQuestions = [...bankQuestions];
    const [moved] = newQuestions.splice(idx, 1);
    newQuestions.splice(targetIdx, 0, moved);

    newQuestions.forEach((q, i) => {
      q.questionNumber = i + 1;
    });

    setBankQuestions(newQuestions);
    markAsDraft();

    for (const q of newQuestions) {
      await api.adminUpdateQuestion(q);
    }
  };

  const handleLoadSample20ForBank = async (bank: QuestionBank) => {
    try {
      const res = await api.adminLoadSamplePackage(bank.topicId, bank.unitId, bank.id);
      if (res.success) {
        const allQ = await api.getQuestions(bank.topicId);
        const filtered = allQ.filter(
          (q) => q.bankId === bank.id || (!q.bankId && topicBanks.length === 1)
        );
        setBankQuestions(filtered);

        const newCount = (bank.questionCount || 0) + res.count;
        const updatedBank = { ...bank, questionCount: newCount };
        if (managingBank && managingBank.id === bank.id) {
          setManagingBank(updatedBank);
        }
        setTopicBanks((prev) => prev.map((b) => (b.id === bank.id ? updatedBank : b)));
        await api.adminUpdateQuestionBank(updatedBank);
        markAsDraft();
        onNotify(`"${bank.title}" için 20 soruluk paket yüklendi ve yayına hazırlandı!`, 'success');
      }
    } catch {
      onNotify('Örnek paket yüklenemedi', 'error');
    }
  };

  // ----------------------------------------------------
  // SİTEDE YAYINLA & GÜNCELLE BUTONU (PUBLISH)
  // ----------------------------------------------------
  const handlePublishCurriculum = async () => {
    setIsPublishing(true);
    try {
      const res = await api.adminPublishCurriculum(subjects, units, topics);
      if (res.success) {
        const nowStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString('tr-TR');
        setLastPublishedTime(nowStr);
        localStorage.setItem('kpss_curriculum_last_published', nowStr);
        setDraftChangesCount(0);
        onNotify('Tüm müfredat hiyerarşisi başarıyla yayınlandı ve sitede anında aktif edildi!', 'success');
        if (onCurriculumChanged) onCurriculumChanged();
      } else {
        onNotify('Yayınlama sırasında hata oluştu: ' + res.error, 'error');
      }
    } catch (err: any) {
      onNotify('Yayınlama hatası: ' + err.message, 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  // ----------------------------------------------------
  // DERS (SUBJECT) İŞLEMLERİ & SIRALAMA
  // ----------------------------------------------------
  const openNewSubjectModal = () => {
    setEditingSubject(null);
    setSubjectFormTitle('');
    setShowSubjectModal(true);
  };

  const openEditSubjectModal = (s: Subject) => {
    setEditingSubject(s);
    setSubjectFormTitle(s.title);
    setShowSubjectModal(true);
  };

  const handleSaveSubject = () => {
    if (!subjectFormTitle.trim()) return;
    if (editingSubject) {
      if (editingSubject.title !== subjectFormTitle.trim()) {
        studentProgressService.renameTopicKey(editingSubject.title, subjectFormTitle.trim());
      }
      setSubjects((prev) =>
        prev.map((s) => (s.id === editingSubject.id ? { ...s, title: subjectFormTitle.trim() } : s))
      );
      onNotify(`"${subjectFormTitle}" dersi güncellendi (Taslak).`);
    } else {
      const newSub: Subject = {
        id: `sub-${Date.now()}`,
        title: subjectFormTitle.trim(),
        totalUnits: 0,
      };
      setSubjects((prev) => [...prev, newSub]);
      setSelectedSubjectId(newSub.id);
      onNotify(`"${subjectFormTitle}" yeni ders olarak eklendi (Taslak).`);
    }
    markAsDraft();
    setShowSubjectModal(false);
  };

  const handleDeleteSubject = (id: string, title: string) => {
    const subUnits = units.filter((u) => u.subjectId === id);
    const subTopics = topics.filter((t) => subUnits.some((u) => u.id === t.unitId));
    if (!confirm(`"${title}" dersini silmek altındaki ${subUnits.length} ünite ve ${subTopics.length} alt konuyu silecektir. Bu işlemi onaylıyor musunuz?`)) {
      return;
    }
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    setUnits((prev) => prev.filter((u) => u.subjectId !== id));
    setTopics((prev) => prev.filter((t) => !subUnits.some((u) => u.id === t.unitId)));
    if (selectedSubjectId === id) {
      setSelectedSubjectId('');
      setSelectedUnitId('');
      setSelectedTopicId('');
      setTopicBanks([]);
    }
    markAsDraft();
    onNotify(`"${title}" dersi silindi (Taslak).`);
  };

  const handleMoveSubject = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= subjects.length) return;
    const newArr = [...subjects];
    const temp = newArr[index];
    newArr[index] = newArr[targetIdx];
    newArr[targetIdx] = temp;
    setSubjects(newArr);
    markAsDraft();
  };

  // ----------------------------------------------------
  // ÜNİTE (UNIT) İŞLEMLERİ & SIRALAMA
  // ----------------------------------------------------
  const openNewUnitModal = () => {
    if (!selectedSubjectId) {
      alert('Lütfen önce bir ders seçiniz.');
      return;
    }
    setEditingUnit(null);
    setUnitFormTitle('');
    setUnitFormLocked(false);
    setShowUnitModal(true);
  };

  const openEditUnitModal = (u: Unit) => {
    setEditingUnit(u);
    setUnitFormTitle(u.title);
    setUnitFormLocked(!!u.isLocked);
    setShowUnitModal(true);
  };

  const handleSaveUnit = () => {
    if (!unitFormTitle.trim()) return;
    if (editingUnit) {
      setUnits((prev) =>
        prev.map((u) =>
          u.id === editingUnit.id
            ? { ...u, title: unitFormTitle.trim(), isLocked: unitFormLocked }
            : u
        )
      );
      onNotify(`"${unitFormTitle}" ünitesi güncellendi (Taslak).`);
    } else {
      const newUnit: Unit = {
        id: `unit-${Date.now()}`,
        subjectId: selectedSubjectId,
        title: unitFormTitle.trim(),
        unitNumber: currentUnits.length + 1,
        isLocked: unitFormLocked,
        isCompleted: false,
      };
      setUnits((prev) => [...prev, newUnit]);
      setSelectedUnitId(newUnit.id);
      onNotify(`"${unitFormTitle}" yeni ünite olarak eklendi (Taslak).`);
    }
    markAsDraft();
    setShowUnitModal(false);
  };

  const handleDeleteUnit = (id: string, title: string) => {
    const unitTopics = topics.filter((t) => t.unitId === id);
    if (!confirm(`"${title}" ünitesini silmek altındaki ${unitTopics.length} alt konuyu ve bağlı soru bankalarını silecektir. Bu işlemi onaylıyor musunuz?`)) return;
    setUnits((prev) => prev.filter((u) => u.id !== id));
    setTopics((prev) => prev.filter((t) => t.unitId !== id));
    if (selectedUnitId === id) {
      setSelectedUnitId('');
      setSelectedTopicId('');
      setTopicBanks([]);
    }
    markAsDraft();
    onNotify(`"${title}" ünitesi silindi (Taslak).`);
  };

  const handleMoveUnit = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= currentUnits.length) return;

    // Sıralamayı değiştir ve unitNumber alanlarını 1..N olarak yeniden numaralandır
    const reordered = [...currentUnits];
    const temp = reordered[index];
    reordered[index] = reordered[targetIdx];
    reordered[targetIdx] = temp;

    const updatedUnitsMap = new Map<string, Unit>();
    reordered.forEach((u, i) => {
      updatedUnitsMap.set(u.id, { ...u, unitNumber: i + 1 });
    });

    setUnits((prev) => prev.map((u) => (updatedUnitsMap.has(u.id) ? updatedUnitsMap.get(u.id)! : u)));
    markAsDraft();
  };

  // ----------------------------------------------------
  // ALT KONU / KAZANIM (TOPIC) İŞLEMLERİ & SIRALAMA
  // ----------------------------------------------------
  const openNewTopicModal = () => {
    if (!selectedUnitId) {
      alert('Lütfen önce bir ünite seçiniz.');
      return;
    }
    setEditingTopic(null);
    setTopicFormTitle('');
    setTopicFormQuestionCount(20);
    setShowTopicModal(true);
  };

  const openEditTopicModal = (t: Topic) => {
    setEditingTopic(t);
    setTopicFormTitle(t.title);
    setTopicFormQuestionCount(t.questionCount || 20);
    setShowTopicModal(true);
  };

  const handleSaveTopic = () => {
    if (!topicFormTitle.trim()) return;
    if (editingTopic) {
      if (editingTopic.title !== topicFormTitle.trim()) {
        studentProgressService.renameTopicKey(editingTopic.title, topicFormTitle.trim());
      }
      setTopics((prev) =>
        prev.map((t) =>
          t.id === editingTopic.id
            ? { ...t, title: topicFormTitle.trim(), questionCount: topicFormQuestionCount }
            : t
        )
      );
      onNotify(`"${topicFormTitle}" alt konusu güncellendi (Taslak).`);
    } else {
      const newTopic: Topic = {
        id: `topic-${Date.now()}`,
        unitId: selectedUnitId,
        title: topicFormTitle.trim(),
        topicNumber: currentTopics.length + 1,
        questionCount: topicFormQuestionCount,
        isLocked: false,
        isCompleted: false,
      };
      setTopics((prev) => [...prev, newTopic]);
      setSelectedTopicId(newTopic.id);
      onNotify(`"${topicFormTitle}" yeni alt konu olarak eklendi (Taslak).`);
    }
    markAsDraft();
    setShowTopicModal(false);
  };

  const handleDeleteTopic = (id: string, title: string) => {
    if (!confirm(`"${title}" alt konusunu ve bağlı soru bankalarını silmek istediğinize emin misiniz?`)) return;
    setTopics((prev) => prev.filter((t) => t.id !== id));
    if (selectedTopicId === id) {
      setSelectedTopicId('');
      setTopicBanks([]);
    }
    markAsDraft();
    onNotify(`"${title}" alt konusu silindi (Taslak).`);
  };

  const handleMoveTopic = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= currentTopics.length) return;

    const reordered = [...currentTopics];
    const temp = reordered[index];
    reordered[index] = reordered[targetIdx];
    reordered[targetIdx] = temp;

    const updatedTopicsMap = new Map<string, Topic>();
    reordered.forEach((t, i) => {
      updatedTopicsMap.set(t.id, { ...t, topicNumber: i + 1 });
    });

    setTopics((prev) => prev.map((t) => (updatedTopicsMap.has(t.id) ? updatedTopicsMap.get(t.id)! : t)));
    markAsDraft();
  };

  // Ağaç Düğümü Aç/Kapa
  const toggleNodeExpand = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  // ----------------------------------------------------
  // RENDER
  // ----------------------------------------------------
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* 1. SİTEDE YAYINLA & GÜNCELLE BARI (PUBLISH HEADER BAR) */}
      <div style={styles.publishHeaderCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={styles.publishIconBox}>
            <Layers size={22} color="#4F46E5" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={styles.publishTitle}>Hiyerarşik Müfredat Yönetim Merkezi</h2>
              {draftChangesCount > 0 ? (
                <span style={styles.draftBadge}>
                  <AlertCircle size={13} style={{ marginRight: '4px' }} />
                  {draftChangesCount} Yayınlanmamış Değişiklik (Taslak)
                </span>
              ) : (
                <span style={styles.liveBadge}>
                  <CheckCircle size={13} style={{ marginRight: '4px' }} />
                  Tüm Müfredat Yayında &amp; Güncel
                </span>
              )}
            </div>

            <p style={styles.publishSub}>
              Dersler, Üniteler ve Alt Konular (Kazanımlar) üzerinde yaptığınız ekleme, silme ve sıralamaları
              aşağıdaki butona basarak sitede tek seferde anında aktif edebilirsiniz.
            </p>
          </div>
        </div>

        {/* Canlı Yayın Butonu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '11px', color: '#64748B' }}>Son Yayın:</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>{lastPublishedTime}</span>
          </div>

          <button
            onClick={handlePublishCurriculum}
            disabled={isPublishing}
            style={{
              ...styles.publishBtn,
              opacity: isPublishing ? 0.7 : 1,
              boxShadow: draftChangesCount > 0 ? '0 4px 14px rgba(79, 70, 229, 0.4)' : 'none',
            }}
          >
            <Send size={16} style={{ marginRight: '8px' }} />
            {isPublishing ? 'Sitede Güncelleniyor...' : 'Sitede Yayınla & Güncelle 🚀'}
          </button>
        </div>
      </div>

      {/* 2. GÖRÜNÜM MODU SEÇİCİ (3 KOLON vs AĞAÇ) */}
      <div style={styles.viewToggleRow}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setViewMode('columns')}
            style={{
              ...styles.viewToggleBtn,
              backgroundColor: viewMode === 'columns' ? '#0F172A' : '#FFFFFF',
              color: viewMode === 'columns' ? '#FFFFFF' : '#475569',
              borderColor: viewMode === 'columns' ? '#0F172A' : '#E2E8F0',
            }}
          >
            <Columns size={15} style={{ marginRight: '6px' }} />
            4 Kolonlu Hiyerarşi Modu
          </button>

          <button
            onClick={() => setViewMode('tree')}
            style={{
              ...styles.viewToggleBtn,
              backgroundColor: viewMode === 'tree' ? '#0F172A' : '#FFFFFF',
              color: viewMode === 'tree' ? '#FFFFFF' : '#475569',
              borderColor: viewMode === 'tree' ? '#0F172A' : '#E2E8F0',
            }}
          >
            <ListTree size={15} style={{ marginRight: '6px' }} />
            Tam Ağaç (Tree) Görünümü
          </button>
        </div>

        <div style={{ fontSize: '12px', color: '#64748B' }}>
          Toplam <b>{subjects.length}</b> Ders • <b>{units.length}</b> Ünite • <b>{topics.length}</b> Alt Konu (Kazanım)
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. GÖRÜNÜM 1: 4 KOLONLU HİYERARŞİ DÜZENLEYİCİ */}
      {/* ============================================================== */}
      {viewMode === 'columns' && (
        <div style={styles.columnsContainer}>
          {/* 1. KOLON: DERS LİSTESİ */}
          <div style={styles.columnCard}>
            <div style={styles.columnHeader}>
              <h3 style={styles.columnTitle}>1. DERS LİSTESİ</h3>
              <span style={styles.columnBadge}>{subjects.length} DERS</span>
            </div>

            {/* Hızlı Ders Ekleme */}
            <div style={styles.quickAddBox}>
              <label style={styles.quickAddLabel}>YENİ DERS EKLE</label>
              <div style={styles.quickAddInputRow}>
                <input
                  type="text"
                  placeholder="Ders adı giriniz..."
                  value={quickSubjectInput}
                  onChange={(e) => setQuickSubjectInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickAddSubject()}
                  style={styles.quickAddInput}
                />
                <button
                  type="button"
                  onClick={handleQuickAddSubject}
                  style={styles.quickAddBtn}
                  title="Dersi Ekle"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div style={styles.itemsList}>
              {subjects.length === 0 ? (
                <div style={styles.emptyNotice}>Henüz ders eklenmedi.</div>
              ) : (
                subjects.map((sub, idx) => {
                  const isSelected = sub.id === selectedSubjectId;
                  const subUnitCount = units.filter((u) => u.subjectId === sub.id).length;

                  return (
                    <div
                      key={sub.id}
                      onClick={() => handleSelectSubject(sub.id)}
                      style={{
                        ...styles.itemBox,
                        borderColor: isSelected ? '#10B981' : '#E2E8F0',
                        backgroundColor: isSelected ? '#ECFDF5' : '#FFFFFF',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13.5px', fontWeight: isSelected ? 700 : 600, color: '#0F172A' }}>
                          {sub.title}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                          {subUnitCount} Ünite
                        </div>
                      </div>

                      {/* Sıralama & Düzenleme Butonları */}
                      <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveSubject(idx, 'UP');
                          }}
                          disabled={idx === 0}
                          style={{ ...styles.microBtn, opacity: idx === 0 ? 0.3 : 1 }}
                          title="Yukarı Taşı"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveSubject(idx, 'DOWN');
                          }}
                          disabled={idx === subjects.length - 1}
                          style={{ ...styles.microBtn, opacity: idx === subjects.length - 1 ? 0.3 : 1 }}
                          title="Aşağı Taşı"
                        >
                          <ChevronDown size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditSubjectModal(sub);
                          }}
                          style={styles.microBtn}
                          title="Düzenle"
                        >
                          <Edit3 size={13} color="#4F46E5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSubject(sub.id, sub.title);
                          }}
                          style={{ ...styles.microBtn, color: '#EF4444' }}
                          title="Sil"
                        >
                          <Trash2 size={13} color="#EF4444" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 2. KOLON: ÜNİTELER */}
          <div style={styles.columnCard}>
            <div style={styles.columnHeader}>
              <h3 style={styles.columnTitle}>2. ÜNİTELER</h3>
              <span style={styles.columnBadge}>{currentUnits.length} ÜNİTE</span>
            </div>

            {!selectedSubjectId ? (
              <div style={styles.emptyDashedBox}>
                <LayoutGrid size={32} color="#94A3B8" strokeWidth={1.5} />
                <div style={styles.emptyDashedTitle}>Lütfen soldan bir Ders seçin.</div>
                <p style={styles.emptyDashedSub}>Seçtiğiniz derse ait üniteleri yönetebilirsiniz.</p>
              </div>
            ) : (
              <>
                {/* Hızlı Ünite Ekleme */}
                <div style={styles.quickAddBox}>
                  <label style={styles.quickAddLabel}>YENİ ÜNİTE EKLE</label>
                  <div style={styles.quickAddInputRow}>
                    <input
                      type="text"
                      placeholder="Ünite adı giriniz..."
                      value={quickUnitInput}
                      onChange={(e) => setQuickUnitInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleQuickAddUnit()}
                      style={styles.quickAddInput}
                    />
                    <button
                      type="button"
                      onClick={handleQuickAddUnit}
                      style={styles.quickAddBtn}
                      title="Üniteyi Ekle"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div style={styles.itemsList}>
                  {currentUnits.length === 0 ? (
                    <div style={styles.emptyNotice}>Bu derse ait ünite bulunamadı. Yukarıdan yeni ünite ekleyebilirsiniz.</div>
                  ) : (
                    currentUnits.map((unit, idx) => {
                      const isSelected = unit.id === selectedUnitId;
                      const unitTopicCount = topics.filter((t) => t.unitId === unit.id).length;

                      return (
                        <div
                          key={unit.id}
                          onClick={() => handleSelectUnit(unit.id)}
                          style={{
                            ...styles.itemBox,
                            borderColor: isSelected ? '#10B981' : '#E2E8F0',
                            backgroundColor: isSelected ? '#ECFDF5' : '#FFFFFF',
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: isSelected ? 700 : 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={styles.orderPill}>{unit.unitNumber || idx + 1}</span>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{unit.title}</span>
                              {unit.isLocked && (
                                <span title="Kilitli Ünite">
                                  <Lock size={12} color="#D97706" />
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '3px' }}>
                              {unitTopicCount} Alt Konu
                            </div>
                          </div>

                          {/* Sıralama & Düzenleme Butonları */}
                          <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveUnit(idx, 'UP');
                              }}
                              disabled={idx === 0}
                              style={{ ...styles.microBtn, opacity: idx === 0 ? 0.3 : 1 }}
                              title="Yukarı Taşı"
                            >
                              <ChevronUp size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveUnit(idx, 'DOWN');
                              }}
                              disabled={idx === currentUnits.length - 1}
                              style={{ ...styles.microBtn, opacity: idx === currentUnits.length - 1 ? 0.3 : 1 }}
                              title="Aşağı Taşı"
                            >
                              <ChevronDown size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditUnitModal(unit);
                              }}
                              style={styles.microBtn}
                              title="Düzenle"
                            >
                              <Edit3 size={13} color="#4F46E5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteUnit(unit.id, unit.title);
                              }}
                              style={{ ...styles.microBtn, color: '#EF4444' }}
                              title="Sil"
                            >
                              <Trash2 size={13} color="#EF4444" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>

          {/* 3. KOLON: ALT KONULAR */}
          <div style={styles.columnCard}>
            <div style={styles.columnHeader}>
              <h3 style={styles.columnTitle}>3. ALT KONULAR</h3>
              <span style={styles.columnBadge}>{currentTopics.length} KONU</span>
            </div>

            {!selectedSubjectId || !selectedUnitId ? (
              <div style={styles.emptyDashedBox}>
                <LayoutGrid size={32} color="#94A3B8" strokeWidth={1.5} />
                <div style={styles.emptyDashedTitle}>Lütfen soldan Ders ve Ünite seçin.</div>
                <p style={styles.emptyDashedSub}>Grup altındaki alt konu kazanımlarını silebilir veya ekleyebilirsiniz.</p>
              </div>
            ) : (
              <>
                {/* Hızlı Alt Konu Ekleme */}
                <div style={styles.quickAddBox}>
                  <label style={styles.quickAddLabel}>YENİ ALT KONU EKLE</label>
                  <div style={styles.quickAddInputRow}>
                    <input
                      type="text"
                      placeholder="Alt konu / kazanım adı giriniz..."
                      value={quickTopicInput}
                      onChange={(e) => setQuickTopicInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleQuickAddTopic()}
                      style={styles.quickAddInput}
                    />
                    <button
                      type="button"
                      onClick={handleQuickAddTopic}
                      style={styles.quickAddBtn}
                      title="Alt Konuyu Ekle"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div style={styles.itemsList}>
                  {currentTopics.length === 0 ? (
                    <div style={styles.emptyNotice}>Bu üniteye ait alt konu (kazanım) bulunamadı. Yukarıdan yeni alt konu ekleyebilirsiniz.</div>
                  ) : (
                    currentTopics.map((topic, idx) => {
                      const isSelected = topic.id === selectedTopicId;

                      return (
                        <div
                          key={topic.id}
                          onClick={() => handleSelectTopic(topic.id)}
                          style={{
                            ...styles.itemBox,
                            borderColor: isSelected ? '#10B981' : '#E2E8F0',
                            backgroundColor: isSelected ? '#ECFDF5' : '#FFFFFF',
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: isSelected ? 700 : 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={styles.orderPill}>{topic.topicNumber || idx + 1}</span>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topic.title}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                              <span style={{ fontSize: '11px', color: '#64748B' }}>
                                🎯 {topic.questionCount || 0} Soru
                              </span>
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '1px 5px',
                                borderRadius: '4px',
                                backgroundColor: (topic.questionCount || 0) >= 20 ? '#DCFCE7' : '#FEE2E2',
                                color: (topic.questionCount || 0) >= 20 ? '#166534' : '#991B1B',
                              }}>
                                {(topic.questionCount || 0) >= 20 ? 'Yayında 🟢' : 'Hazırlıkta 🔴'}
                              </span>
                            </div>
                          </div>

                          {/* Sıralama & Düzenleme Butonları */}
                          <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveTopic(idx, 'UP');
                              }}
                              disabled={idx === 0}
                              style={{ ...styles.microBtn, opacity: idx === 0 ? 0.3 : 1 }}
                              title="Yukarı Taşı"
                            >
                              <ChevronUp size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveTopic(idx, 'DOWN');
                              }}
                              disabled={idx === currentTopics.length - 1}
                              style={{ ...styles.microBtn, opacity: idx === currentTopics.length - 1 ? 0.3 : 1 }}
                              title="Aşağı Taşı"
                            >
                              <ChevronDown size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditTopicModal(topic);
                              }}
                              style={styles.microBtn}
                              title="Düzenle"
                            >
                              <Edit3 size={13} color="#4F46E5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTopic(topic.id, topic.title);
                              }}
                              style={{ ...styles.microBtn, color: '#EF4444' }}
                              title="Sil"
                            >
                              <Trash2 size={13} color="#EF4444" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>

          {/* 4. KOLON: SORU BANKALARI */}
          <div style={styles.columnCard}>
            <div style={styles.columnHeader}>
              <h3 style={styles.columnTitle}>4. SORU BANKALARI</h3>
              <span style={styles.columnBadge}>{topicBanks.length} BANKA</span>
            </div>

            {!selectedTopicId ? (
              <div style={styles.emptyDashedBox}>
                <LayoutGrid size={32} color="#94A3B8" strokeWidth={1.5} />
                <div style={styles.emptyDashedTitle}>Lütfen soldan Alt Konu seçin.</div>
                <p style={styles.emptyDashedSub}>Seçtiğiniz kazanımın altındaki soru bankalarını yönetebilirsiniz.</p>
              </div>
            ) : (
              <>
                {/* Hızlı Soru Bankası Ekleme */}
                <div style={styles.quickAddBox}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={styles.quickAddLabel}>YENİ SORU BANKASI EKLE</label>
                    <button
                      type="button"
                      onClick={openNewBankModal}
                      style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: '11px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                    >
                      + Detaylı Ekle
                    </button>
                  </div>
                  <div style={styles.quickAddInputRow}>
                    <input
                      type="text"
                      placeholder="Soru bankası adı giriniz..."
                      value={quickBankInput}
                      onChange={(e) => setQuickBankInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleQuickAddBank()}
                      style={styles.quickAddInput}
                    />
                    <button
                      type="button"
                      onClick={handleQuickAddBank}
                      style={styles.quickAddBtn}
                      title="Soru Bankasını Ekle"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div style={styles.itemsList}>
                  {isLoadingBanks ? (
                    <div style={styles.emptyNotice}>Soru bankaları yükleniyor...</div>
                  ) : topicBanks.length === 0 ? (
                    <div style={{ ...styles.emptyNotice, padding: '24px 12px' }}>
                      <Database size={28} color="#94A3B8" style={{ marginBottom: '8px' }} />
                      <div>Bu alt konuya ait henüz bir soru bankası oluşturulmadı.</div>
                      <button
                        onClick={openNewBankModal}
                        style={{ ...styles.btnPrimary, marginTop: '12px', fontSize: '12px' }}
                      >
                        <Plus size={14} style={{ marginRight: '4px' }} />
                        + Yeni Soru Bankası Oluştur
                      </button>
                    </div>
                  ) : (
                    topicBanks.map((bank, idx) => {
                      const qCount = bank.questionCount || 0;
                      const isPublished = qCount >= 20;

                      return (
                        <div
                          key={bank.id}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '10px',
                            border: '1.5px solid #E2E8F0',
                            backgroundColor: '#FFFFFF',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                          }}
                        >
                          {/* Üst Satır: İsim, Tür, Rozetler & Sıralama/Aksiyon */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={styles.orderPill}>#{bank.orderNumber || idx + 1}</span>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {bank.title}
                                </span>
                                {bank.isLocked && (
                                  <span title="Kilitli Soru Bankası">
                                    <Lock size={12} color="#D97706" />
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                                Tür: <b>{bank.bankType || 'Standart Konu Testi'}</b>
                              </div>
                            </div>

                            {/* Sıralama & Düzenleme Butonları */}
                            <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                              <button
                                onClick={() => handleMoveBank(idx, 'UP')}
                                disabled={idx === 0}
                                style={{ ...styles.microBtn, opacity: idx === 0 ? 0.3 : 1 }}
                                title="Yukarı Taşı"
                              >
                                <ChevronUp size={13} />
                              </button>
                              <button
                                onClick={() => handleMoveBank(idx, 'DOWN')}
                                disabled={idx === topicBanks.length - 1}
                                style={{ ...styles.microBtn, opacity: idx === topicBanks.length - 1 ? 0.3 : 1 }}
                                title="Aşağı Taşı"
                              >
                                <ChevronDown size={13} />
                              </button>
                              <button
                                onClick={() => openEditBankModal(bank)}
                                style={styles.microBtn}
                                title="Soru Bankasını Düzenle"
                              >
                                <Edit3 size={12} color="#4F46E5" />
                              </button>
                              <button
                                onClick={() => handleDeleteBank(bank.id, bank.title)}
                                style={{ ...styles.microBtn, color: '#EF4444' }}
                                title="Soru Bankasını Sil"
                              >
                                <Trash2 size={12} color="#EF4444" />
                              </button>
                            </div>
                          </div>

                          {bank.description && (
                            <div style={{ fontSize: '11px', color: '#64748B', fontStyle: 'italic', backgroundColor: '#F8FAFC', padding: '4px 8px', borderRadius: '6px' }}>
                              "{bank.description}"
                            </div>
                          )}

                          {/* 20 Soru Yayınlanma Kuralı Rozeti & İlerleme Çubuğu */}
                          <div
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              backgroundColor: isPublished ? '#F0FDF4' : '#FEF2F2',
                              border: `1px solid ${isPublished ? '#BBF7D0' : '#FECACA'}`,
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                              <span style={{ fontSize: '10.5px', fontWeight: 700, color: isPublished ? '#15803D' : '#B91C1C' }}>
                                {isPublished ? '🟢 Yayında (Aktif)' : '🔴 Yayınlanamaz (Hazırlıkta)'}
                              </span>
                              <span style={{ fontSize: '10.5px', fontWeight: 700, color: isPublished ? '#15803D' : '#B91C1C' }}>
                                {qCount} / 20 Soru
                              </span>
                            </div>

                            {/* Mini İlerleme Çubuğu */}
                            <div style={{ height: '4px', backgroundColor: '#E2E8F0', borderRadius: '2px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  height: '100%',
                                  width: `${Math.min(100, Math.round((qCount / 20) * 100))}%`,
                                  backgroundColor: isPublished ? '#22C55E' : '#EF4444',
                                  borderRadius: '2px',
                                  transition: 'width 0.3s ease',
                                }}
                              />
                            </div>
                          </div>

                          {/* Alt Aksiyon Butonları */}
                          <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                            <button
                              onClick={() => openManageBankQuestions(bank)}
                              style={{
                                flex: 1,
                                backgroundColor: '#EEF2FF',
                                color: '#4F46E5',
                                border: '1px solid #C7D2FE',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                              }}
                            >
                              <HelpCircle size={13} />
                              Soruları Yönet ({qCount})
                            </button>

                            {!isPublished && (
                              <button
                                onClick={() => handleLoadSample20ForBank(bank)}
                                style={{
                                  backgroundColor: '#4F46E5',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '6px 8px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '4px',
                                }}
                                title="Tek tıkla bu soru bankasına 20 soru doldur"
                              >
                                <PackagePlus size={13} /> 20 Soru Ekle
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. GÖRÜNÜM 2: TAM AĞAÇ (TREE) HİYERARŞİSİ */}
      {/* ============================================================== */}
      {viewMode === 'tree' && (
        <div style={styles.treeCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={styles.columnTitle}>Tam Müfredat Ağacı</h3>
            <button onClick={openNewSubjectModal} style={styles.btnPrimary}>
              <Plus size={15} style={{ marginRight: '6px' }} />
              + Yeni Ders Ekle
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {subjects.map((sub) => {
              const isSubExpanded = expandedNodes[sub.id] !== false; // Varsayılan açık
              const subUnits = units.filter((u) => u.subjectId === sub.id);

              return (
                <div key={sub.id} style={styles.treeSubjectNode}>
                  {/* Ders Düğümü */}
                  <div style={styles.treeNodeHeader} onClick={() => toggleNodeExpand(sub.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isSubExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <BookOpen size={16} color="#4F46E5" />
                      <span style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>{sub.title}</span>
                      <span style={styles.treeCountBadge}>{subUnits.length} Ünite</span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSubjectId(sub.id);
                          openNewUnitModal();
                        }}
                        style={styles.microBtn}
                        title="Bu Derse Ünite Ekle"
                      >
                        <Plus size={13} color="#4F46E5" /> Ünite Ekle
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditSubjectModal(sub);
                        }}
                        style={styles.microBtn}
                      >
                        <Edit3 size={13} color="#64748B" />
                      </button>
                    </div>
                  </div>

                  {/* Üniteler Ağacı */}
                  {isSubExpanded && (
                    <div style={styles.treeSubUnitsContainer}>
                      {subUnits.map((u) => {
                        const isUnitExpanded = expandedNodes[u.id] !== false;
                        const uTopics = topics.filter((t) => t.unitId === u.id);

                        return (
                          <div key={u.id} style={styles.treeUnitNode}>
                            <div style={styles.treeNodeHeader} onClick={() => toggleNodeExpand(u.id)}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {isUnitExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                <Layers size={15} color="#059669" />
                                <span style={{ fontWeight: 600, fontSize: '13px', color: '#1E293B' }}>
                                  {u.unitNumber}. {u.title}
                                </span>
                                <span style={styles.treeCountBadge}>{uTopics.length} Alt Konu</span>
                              </div>

                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedUnitId(u.id);
                                    openNewTopicModal();
                                  }}
                                  style={styles.microBtn}
                                  title="Bu Üniteye Alt Konu Ekle"
                                >
                                  <Plus size={13} color="#059669" /> Konu Ekle
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditUnitModal(u);
                                  }}
                                  style={styles.microBtn}
                                >
                                  <Edit3 size={13} color="#64748B" />
                                </button>
                              </div>
                            </div>

                            {/* Alt Konular */}
                            {isUnitExpanded && (
                              <div style={styles.treeTopicsContainer}>
                                {uTopics.map((t) => (
                                  <div key={t.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={styles.treeTopicItem}>
                                      <span style={styles.orderPill}>{t.topicNumber}</span>
                                      <span style={{ fontSize: '13px', color: '#334155', flex: 1, fontWeight: 600 }}>{t.title}</span>
                                      <span style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: (t.questionCount || 0) >= 20 ? '#16A34A' : '#DC2626',
                                        backgroundColor: (t.questionCount || 0) >= 20 ? '#DCFCE7' : '#FEE2E2',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                      }}>
                                        {t.questionCount || 0} Soru • {(t.questionCount || 0) >= 20 ? 'Yayında 🟢' : 'Hazırlıkta 🔴'}
                                      </span>
                                      <button
                                        onClick={() => openEditTopicModal(t)}
                                        style={styles.microBtn}
                                        title="Konuyu Düzenle"
                                      >
                                        <Edit3 size={12} color="#64748B" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteTopic(t.id, t.title)}
                                        style={{ ...styles.microBtn, color: '#EF4444' }}
                                        title="Konuyu Sil"
                                      >
                                        <Trash2 size={12} color="#EF4444" />
                                      </button>
                                    </div>

                                    {/* 4. DÜZEY: SORU BANKASI GÖRÜNÜMÜ */}
                                    <div
                                      style={{
                                        marginLeft: '24px',
                                        padding: '6px 12px',
                                        backgroundColor: '#FFFFFF',
                                        borderRadius: '6px',
                                        border: '1px dashed #CBD5E1',
                                        borderLeft: '3px solid #6366F1',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '8px',
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Database size={13} color="#4F46E5" />
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#1E293B' }}>
                                          {t.bankTitle || `${t.title} Soru Bankası`}
                                        </span>
                                        <span style={{ fontSize: '11px', color: '#64748B' }}>
                                          ({t.bankType || 'Standart Test'})
                                        </span>
                                      </div>

                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span
                                          style={{
                                            fontSize: '10px',
                                            fontWeight: 700,
                                            padding: '1px 6px',
                                            borderRadius: '4px',
                                            backgroundColor: (t.questionCount || 0) >= 20 ? '#DCFCE7' : '#FEE2E2',
                                            color: (t.questionCount || 0) >= 20 ? '#166534' : '#991B1B',
                                          }}
                                        >
                                          {(t.questionCount || 0) >= 20 ? 'Yayında 🟢' : 'Hazırlıkta (Yayınlanamaz) 🔴'}
                                        </span>

                                        <button
                                          onClick={() => {
                                            setSelectedSubjectId(sub.id);
                                            setSelectedUnitId(u.id);
                                            setSelectedTopicId(t.id);
                                            setViewMode('columns');
                                          }}
                                          style={{ ...styles.microBtn, color: '#4F46E5' }}
                                          title="Soru Bankalarını Yönet (4. Kolona Git)"
                                        >
                                          <Database size={12} color="#4F46E5" />
                                        </button>
                                        <button
                                          onClick={() => {
                                            setSelectedSubjectId(sub.id);
                                            setSelectedUnitId(u.id);
                                            setSelectedTopicId(t.id);
                                            openNewBankModal();
                                          }}
                                          style={{ ...styles.microBtn, color: '#059669' }}
                                          title="Yeni Soru Bankası Ekle"
                                        >
                                          <Plus size={12} color="#059669" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: DERS EKLE / DÜZENLE */}
      {/* ============================================================== */}
      {showSubjectModal && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{editingSubject ? 'Dersi Düzenle' : 'Yeni Ders Ekle'}</h3>
              <button onClick={() => setShowSubjectModal(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <div>
              <label style={styles.fieldLabel}>Ders Adı:</label>
              <input
                type="text"
                placeholder="Örn: Tarih, Coğrafya, Türkçe..."
                value={subjectFormTitle}
                onChange={(e) => setSubjectFormTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveSubject()}
                style={styles.textInput}
                autoFocus
              />
            </div>

            <div style={styles.modalActionsRow}>
              <button onClick={() => setShowSubjectModal(false)} style={styles.btnSecondary}>
                Vazgeç
              </button>
              <button onClick={handleSaveSubject} style={styles.btnPrimary}>
                {editingSubject ? 'Güncelle' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: ÜNİTE EKLE / DÜZENLE */}
      {/* ============================================================== */}
      {showUnitModal && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{editingUnit ? 'Üniteyi Düzenle' : 'Yeni Ünite Ekle'}</h3>
              <button onClick={() => setShowUnitModal(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={styles.fieldLabel}>Ünite Başlığı:</label>
                <input
                  type="text"
                  placeholder="Örn: İslamiyet Öncesi Türk Tarihi..."
                  value={unitFormTitle}
                  onChange={(e) => setUnitFormTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveUnit()}
                  style={styles.textInput}
                  autoFocus
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={unitFormLocked}
                  onChange={(e) => setUnitFormLocked(e.target.checked)}
                />
                <span>Bu ünite başlangıçta öğrencilere kilitli olsun</span>
              </label>
            </div>

            <div style={styles.modalActionsRow}>
              <button onClick={() => setShowUnitModal(false)} style={styles.btnSecondary}>
                Vazgeç
              </button>
              <button onClick={handleSaveUnit} style={styles.btnPrimary}>
                {editingUnit ? 'Güncelle' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: ALT KONU / KAZANIM EKLE / DÜZENLE */}
      {/* ============================================================== */}
      {showTopicModal && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{editingTopic ? 'Alt Konuyu Düzenle' : 'Yeni Alt Konu (Kazanım) Ekle'}</h3>
              <button onClick={() => setShowTopicModal(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={styles.fieldLabel}>Alt Konu / Kazanım Başlığı:</label>
                <input
                  type="text"
                  placeholder="Örn: İlk Türk Devletlerinde Kültür ve Medeniyet..."
                  value={topicFormTitle}
                  onChange={(e) => setTopicFormTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTopic()}
                  style={styles.textInput}
                  autoFocus
                />
              </div>

              <div>
                <label style={styles.fieldLabel}>Hedef Soru Sayısı:</label>
                <input
                  type="number"
                  value={topicFormQuestionCount}
                  onChange={(e) => setTopicFormQuestionCount(parseInt(e.target.value) || 20)}
                  style={styles.textInput}
                />
              </div>
            </div>

            <div style={styles.modalActionsRow}>
              <button onClick={() => setShowTopicModal(false)} style={styles.btnSecondary}>
                Vazgeç
              </button>
              <button onClick={handleSaveTopic} style={styles.btnPrimary}>
                {editingTopic ? 'Güncelle' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: SORU BANKASI OLUŞTUR / DÜZENLE */}
      {/* ============================================================== */}
      {showBankModal && (
        <div style={styles.modalBackdrop}>
          <div style={{ ...styles.modalCard, maxWidth: '480px' }}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={18} color="#4F46E5" />
                <h3 style={styles.modalTitle}>
                  {editingBank ? 'Soru Bankasını Düzenle' : 'Yeni Soru Bankası Oluştur'}
                </h3>
              </div>
              <button onClick={() => setShowBankModal(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBank} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={styles.fieldLabel}>Soru Bankası Başlığı:</label>
                <input
                  type="text"
                  placeholder="Örn: İslamiyet Öncesi Kültür Testi..."
                  value={bankFormTitle}
                  onChange={(e) => setBankFormTitle(e.target.value)}
                  style={styles.textInput}
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={styles.fieldLabel}>Test / Paket Türü:</label>
                  <select
                    value={bankFormType}
                    onChange={(e) => setBankFormType(e.target.value)}
                    style={styles.textInput}
                  >
                    <option value="Standart Konu Testi">Standart Konu Testi</option>
                    <option value="Kazanım Pekiştirme">Kazanım Pekiştirme</option>
                    <option value="ÖSYM Çıkmış Sorular">ÖSYM Çıkmış Sorular</option>
                    <option value="Zorlaştırılmış Deneme">Zorlaştırılmış Deneme</option>
                    <option value="Karma Hızlı Tarama">Karma Hızlı Tarama</option>
                  </select>
                </div>

                <div>
                  <label style={styles.fieldLabel}>Hedef Soru Kapasitesi:</label>
                  <input
                    type="number"
                    min={20}
                    value={bankFormTargetCount}
                    onChange={(e) => setBankFormTargetCount(parseInt(e.target.value) || 20)}
                    style={styles.textInput}
                  />
                </div>
              </div>

              <div>
                <label style={styles.fieldLabel}>Açıklama / Öğrenci Bilgi Notu:</label>
                <textarea
                  placeholder="Örn: Bu test ilk Türk devletlerinin devlet teşkilatı ve sanat yapısını kapsar."
                  value={bankFormDescription}
                  onChange={(e) => setBankFormDescription(e.target.value)}
                  rows={3}
                  style={{ ...styles.textInput, resize: 'vertical' }}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={bankFormLocked}
                  onChange={(e) => setBankFormLocked(e.target.checked)}
                />
                <span>Bu soru bankası öğrencilere kilitli olsun (VIP / Şartlı Erişim)</span>
              </label>

              <div style={{ padding: '8px 12px', backgroundColor: '#FEF3C7', borderRadius: '8px', border: '1px solid #FDE68A', fontSize: '12px', color: '#92400E' }}>
                💡 <b>Kural:</b> Her soru bankasının sitede yayına çıkabilmesi için en az <b>20 adet soru</b> barındırması zorunludur.
              </div>

              <div style={styles.modalActionsRow}>
                <button type="button" onClick={() => setShowBankModal(false)} style={styles.btnSecondary}>
                  Vazgeç
                </button>
                <button type="submit" style={styles.btnPrimary}>
                  {editingBank ? 'Güncelle' : 'Soru Bankası Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: BİR SORU BANKASININ SORULARINI YÖNETME MERKEZİ */}
      {/* ============================================================== */}
      {managingBank && (
        <div style={styles.modalBackdrop}>
          <div style={{ ...styles.modalCard, maxWidth: '820px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            {/* Modal Başlığı */}
            <div style={styles.modalHeader}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={18} color="#4F46E5" />
                  <h3 style={styles.modalTitle}>{managingBank.title} — Soru Yönetimi</h3>
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  {managingBank.bankType || 'Standart Test'} • Toplam {bankQuestions.length} Soru
                </div>
              </div>
              <button onClick={() => setManagingBank(null)} style={styles.modalCloseBtn}>
                <X size={20} />
              </button>
            </div>

            {/* Durum & 20 Soru Kuralı Barı */}
            <div
              style={{
                backgroundColor: bankQuestions.length >= 20 ? '#F0FDF4' : '#FEF2F2',
                border: `1px solid ${bankQuestions.length >= 20 ? '#BBF7D0' : '#FECACA'}`,
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: bankQuestions.length >= 20 ? '#DCFCE7' : '#FEE2E2',
                      color: bankQuestions.length >= 20 ? '#15803D' : '#DC2626',
                    }}
                  >
                    {bankQuestions.length >= 20 ? 'YAYINDA 🟢' : 'HAZIRLIKTA (YAYINLANAMAZ) 🔴'}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>
                    {bankQuestions.length >= 20
                      ? '20 Soru barajı tamamlandı! Sitede öğrenciler tarafından çözülebilir.'
                      : `Sitede yayınlanabilmesi için en az 20 soru olmalıdır. (Kalan: ${20 - bankQuestions.length} soru)`}
                  </span>
                </div>

                {/* İlerleme Çubuğu */}
                <div style={{ width: '220px', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, (bankQuestions.length / 20) * 100)}%`,
                      backgroundColor: bankQuestions.length >= 20 ? '#22C55E' : '#EAB308',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>

              {/* Aksiyon Butonları */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleLoadSample20ForBank(managingBank)}
                  style={{
                    ...styles.btnSecondary,
                    fontSize: '12px',
                    gap: '4px',
                    backgroundColor: '#FEF3C7',
                    borderColor: '#FDE68A',
                    color: '#92400E',
                  }}
                  title="Tek tıkla bu soru bankasına 20 adet hazır KPSS sorusu ekler"
                >
                  <Sparkles size={14} color="#D97706" />
                  +20 Soru Paketi Doldur
                </button>
                <button
                  type="button"
                  onClick={openNewQuestionModal}
                  style={{ ...styles.btnPrimary, fontSize: '12px', gap: '4px' }}
                >
                  <Plus size={14} />
                  Yeni Soru Ekle
                </button>
              </div>
            </div>

            {/* Sorular Listesi */}
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '55vh', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
              {isLoadingBankQuestions ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#64748B' }}>
                  Sorular yükleniyor...
                </div>
              ) : bankQuestions.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px dashed #CBD5E1' }}>
                  <FileText size={36} color="#94A3B8" style={{ margin: '0 auto 8px', display: 'block' }} />
                  <div style={{ fontWeight: 600, fontSize: '14px', color: '#334155' }}>Bu Soru Bankasında Henüz Soru Yok</div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                    Yukarıdaki "Yeni Soru Ekle" butonuna tıklayarak kendi sorularınızı ekleyebilir veya "+20 Soru Paketi Doldur" butonuyla anında 20 soru yükleyebilirsiniz.
                  </div>
                </div>
              ) : (
                bankQuestions.map((q, qIdx) => {
                  return (
                    <div
                      key={q.id}
                      style={{
                        padding: '10px 14px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                        <span style={{ ...styles.orderPill, minWidth: '26px', textAlign: 'center' }}>
                          #{q.questionNumber || qIdx + 1}
                        </span>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '13px',
                              fontWeight: 600,
                              color: '#1E293B',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={q.questionText}
                          >
                            {q.questionText}
                          </div>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '3px' }}>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                backgroundColor:
                                  q.difficulty === 'Zor' ? '#FEE2E2' : q.difficulty === 'Kolay' ? '#DCFCE7' : '#FEF3C7',
                                color:
                                  q.difficulty === 'Zor' ? '#DC2626' : q.difficulty === 'Kolay' ? '#16A34A' : '#D97706',
                              }}
                            >
                              {q.difficulty || 'Orta'}
                            </span>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                backgroundColor: '#E0E7FF',
                                color: '#4338CA',
                              }}
                            >
                              Doğru: {q.correctOption}
                            </span>
                            {q.year && (
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: '#F1F5F9',
                                  color: '#475569',
                                }}
                              >
                                {q.year}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Sıralama ve İşlem Butonları */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(qIdx, 'UP')}
                          disabled={qIdx === 0}
                          style={{
                            ...styles.microBtn,
                            opacity: qIdx === 0 ? 0.3 : 1,
                            cursor: qIdx === 0 ? 'not-allowed' : 'pointer',
                          }}
                          title="Yukarı Taşı"
                        >
                          <ChevronUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(qIdx, 'DOWN')}
                          disabled={qIdx === bankQuestions.length - 1}
                          style={{
                            ...styles.microBtn,
                            opacity: qIdx === bankQuestions.length - 1 ? 0.3 : 1,
                            cursor: qIdx === bankQuestions.length - 1 ? 'not-allowed' : 'pointer',
                          }}
                          title="Aşağı Taşı"
                        >
                          <ChevronDown size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditQuestionModal(q)}
                          style={styles.microBtn}
                          title="Soruyu Düzenle"
                        >
                          <Edit3 size={13} color="#64748B" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.id)}
                          style={{ ...styles.microBtn, color: '#EF4444' }}
                          title="Soruyu Sil"
                        >
                          <Trash2 size={13} color="#EF4444" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Alt Kapatma Çubuğu */}
            <div style={{ ...styles.modalActionsRow, marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #E2E8F0' }}>
              <button type="button" onClick={() => setManagingBank(null)} style={styles.btnSecondary}>
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 6: SORU EKLE / DÜZENLE */}
      {/* ============================================================== */}
      {showQuestionModal && (
        <div style={styles.modalBackdrop}>
          <div style={{ ...styles.modalCard, maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#4F46E5" />
                <h3 style={styles.modalTitle}>{editingQuestion ? 'Soruyu Düzenle' : 'Yeni Soru Ekle'}</h3>
              </div>
              <button onClick={() => setShowQuestionModal(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={styles.fieldLabel}>Soru Metni:</label>
                <textarea
                  placeholder="Soru kökünü ve metnini buraya yazınız..."
                  value={qFormText}
                  onChange={(e) => setQFormText(e.target.value)}
                  rows={3}
                  style={{ ...styles.textInput, resize: 'vertical' }}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={styles.fieldLabel}>Seçenekler (Doğru cevabı radyo butonundan işaretleyiniz):</label>
                {(['A', 'B', 'C', 'D', 'E'] as OptionId[]).map((opt) => {
                  const val =
                    opt === 'A' ? qFormA :
                    opt === 'B' ? qFormB :
                    opt === 'C' ? qFormC :
                    opt === 'D' ? qFormD : qFormE;
                  const setVal =
                    opt === 'A' ? setQFormA :
                    opt === 'B' ? setQFormB :
                    opt === 'C' ? setQFormC :
                    opt === 'D' ? setQFormD : setQFormE;

                  const isCorrect = qFormCorrect === opt;

                  return (
                    <div
                      key={opt}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        backgroundColor: isCorrect ? '#F0FDF4' : '#FFFFFF',
                        border: `1.5px solid ${isCorrect ? '#22C55E' : '#E2E8F0'}`,
                      }}
                    >
                      <input
                        type="radio"
                        name="correctOption"
                        checked={isCorrect}
                        onChange={() => setQFormCorrect(opt)}
                        style={{ cursor: 'pointer', accentColor: '#22C55E' }}
                        id={`opt-radio-${opt}`}
                      />
                      <label
                        htmlFor={`opt-radio-${opt}`}
                        style={{
                          fontWeight: 700,
                          fontSize: '13px',
                          color: isCorrect ? '#15803D' : '#475569',
                          width: '20px',
                          cursor: 'pointer',
                        }}
                      >
                        {opt})
                      </label>
                      <input
                        type="text"
                        placeholder={`${opt} seçeneği metni...`}
                        value={val}
                        onChange={(e) => setVal(e.target.value)}
                        style={{
                          ...styles.textInput,
                          borderColor: isCorrect ? '#86EFAC' : '#CBD5E1',
                          flex: 1,
                        }}
                        required
                      />
                      {isCorrect && (
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#15803D', whiteSpace: 'nowrap' }}>
                          ✓ Doğru
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div>
                <label style={styles.fieldLabel}>Çözüm / Açıklama:</label>
                <textarea
                  placeholder="Sorunun çözümünü ve öğrencilere gösterilecek açıklamayı yazınız..."
                  value={qFormExplanation}
                  onChange={(e) => setQFormExplanation(e.target.value)}
                  rows={2}
                  style={{ ...styles.textInput, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={styles.fieldLabel}>Zorluk Derecesi:</label>
                  <select
                    value={qFormDifficulty}
                    onChange={(e) => setQFormDifficulty(e.target.value as 'Kolay' | 'Orta' | 'Zor')}
                    style={styles.textInput}
                  >
                    <option value="Kolay">Kolay</option>
                    <option value="Orta">Orta</option>
                    <option value="Zor">Zor</option>
                  </select>
                </div>

                <div>
                  <label style={styles.fieldLabel}>Çıkmış Soru Yılı (Opsiyonel):</label>
                  <input
                    type="text"
                    placeholder="Örn: 2022 KPSS Lisans"
                    value={qFormYear}
                    onChange={(e) => setQFormYear(e.target.value)}
                    style={styles.textInput}
                  />
                </div>
              </div>

              <div style={styles.modalActionsRow}>
                <button type="button" onClick={() => setShowQuestionModal(false)} style={styles.btnSecondary}>
                  Vazgeç
                </button>
                <button type="submit" style={styles.btnPrimary}>
                  {editingQuestion ? 'Soruyu Güncelle' : 'Soruyu Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------
// STİL TANIMLARI
// ----------------------------------------------------
const styles: Record<string, React.CSSProperties> = {
  publishHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    border: '1.5px solid #C7D2FE',
    padding: '18px 22px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '14px',
    boxShadow: '0 2px 8px -2px rgba(79, 70, 229, 0.08)',
  },
  publishIconBox: {
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    backgroundColor: '#EEF2FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  publishTitle: {
    fontSize: '17px',
    fontWeight: 700,
    color: '#0F172A',
    margin: 0,
  },
  publishSub: {
    fontSize: '12px',
    color: '#64748B',
    margin: '4px 0 0',
    maxWidth: '620px',
    lineHeight: 1.4,
  },
  draftBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    color: '#B45309',
    fontSize: '11px',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: '12px',
    border: '1px solid #FDE68A',
  },
  liveBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    fontSize: '11px',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: '12px',
    border: '1px solid #BBF7D0',
  },
  publishBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '11px 20px',
    borderRadius: '10px',
    backgroundColor: '#4F46E5',
    color: '#FFFFFF',
    border: 'none',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  viewToggleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
  },
  viewToggleBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '7px 14px',
    borderRadius: '8px',
    borderWidth: '1px',
    borderStyle: 'solid',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  columnsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(240px, 1fr))',
    gap: '14px',
    overflowX: 'auto',
    paddingBottom: '8px',
  },
  columnCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'calc(100vh - 220px)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  columnHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '10px',
    borderBottom: '1px solid #F1F5F9',
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
  columnBadge: {
    fontSize: '11px',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: '6px',
    backgroundColor: '#ECFDF5',
    color: '#059669',
    border: '1px solid #A7F3D0',
    whiteSpace: 'nowrap',
    letterSpacing: '0.4px',
  },
  quickAddBox: {
    marginBottom: '12px',
    paddingBottom: '12px',
    borderBottom: '1px solid #F1F5F9',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  quickAddLabel: {
    fontSize: '10.5px',
    fontWeight: 700,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  quickAddInputRow: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  quickAddInput: {
    flex: 1,
    minWidth: 0,
    padding: '8px 10px',
    fontSize: '12.5px',
    borderRadius: '8px',
    border: '1.5px solid #E2E8F0',
    outline: 'none',
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s ease',
  },
  quickAddBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'background-color 0.15s ease',
  },
  emptyDashedBox: {
    border: '2px dashed #CBD5E1',
    borderRadius: '12px',
    padding: '32px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    minHeight: '220px',
    backgroundColor: '#F8FAFC',
    margin: 'auto 0',
  },
  emptyDashedTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
    marginTop: '12px',
    marginBottom: '4px',
  },
  emptyDashedSub: {
    fontSize: '11.5px',
    color: '#94A3B8',
    lineHeight: '1.4',
    maxWidth: '200px',
    margin: 0,
  },
  colAddBtn: {
    width: '30px',
    height: '30px',
    borderRadius: '8px',
    backgroundColor: '#EEF2FF',
    color: '#4F46E5',
    border: '1px solid #C7D2FE',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  itemsList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  itemBox: {
    padding: '10px 12px',
    borderRadius: '8px',
    borderWidth: '1.5px',
    borderStyle: 'solid',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    transition: 'all 0.15s ease',
  },
  orderPill: {
    backgroundColor: '#EEF2FF',
    color: '#4F46E5',
    fontWeight: 700,
    fontSize: '11px',
    padding: '2px 6px',
    borderRadius: '6px',
  },
  microBtn: {
    background: 'none',
    border: 'none',
    padding: '4px',
    cursor: 'pointer',
    color: '#64748B',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    fontSize: '11px',
  },
  emptyNotice: {
    padding: '24px 12px',
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: '13px',
  },
  // Ağaç Görünümü
  treeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    border: '1px solid #E2E8F0',
    padding: '20px',
  },
  treeSubjectNode: {
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  treeNodeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#F8FAFC',
    cursor: 'pointer',
  },
  treeCountBadge: {
    fontSize: '11px',
    color: '#64748B',
    backgroundColor: '#E2E8F0',
    padding: '2px 8px',
    borderRadius: '10px',
  },
  treeSubUnitsContainer: {
    padding: '10px 14px 14px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    backgroundColor: '#FFFFFF',
  },
  treeUnitNode: {
    border: '1px solid #F1F5F9',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  treeTopicsContainer: {
    padding: '8px 12px 12px 28px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  treeTopicItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    backgroundColor: '#F8FAFC',
    borderRadius: '6px',
    border: '1px solid #E2E8F0',
  },
  // Modal
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    padding: '22px',
    maxWidth: '420px',
    width: '100%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#0F172A',
    margin: 0,
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    padding: '4px',
    cursor: 'pointer',
    color: '#64748B',
  },
  fieldLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#475569',
    marginBottom: '6px',
    display: 'block',
  },
  textInput: {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  modalActionsRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '16px',
  },
  btnPrimary: {
    display: 'inline-flex',
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
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 14px',
    borderRadius: '8px',
    backgroundColor: '#F8FAFC',
    color: '#334155',
    border: '1px solid #CBD5E1',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
