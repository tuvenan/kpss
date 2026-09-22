import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { Subject, Unit, Topic, Question, OptionId, QuestionBank } from '../types';
import { SAMPLE_20_QUESTIONS } from '../data/samplePackage';
import {
  HelpCircle,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Search,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  Eye,
  Sparkles,
  ArrowRightLeft,
  X,
  Check,
  Filter,
  BarChart2,
  SlidersHorizontal,
  ChevronDown,
  FileText,
  Clock,
  Tag,
  AlertTriangle,
  MoveRight,
  Database,
} from 'lucide-react';

interface AdvancedQuestionManagerProps {
  subjects: Subject[];
  selectedSubjectId: string;
  onSelectSubjectId: (id: string) => void;

  units: Unit[];
  selectedUnitId: string;
  onSelectUnitId: (id: string) => void;

  topics: Topic[];
  selectedTopicId: string;
  onSelectTopicId: (id: string) => void;

  questions: Question[];
  onReloadQuestions: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdvancedQuestionManager: React.FC<AdvancedQuestionManagerProps> = ({
  subjects,
  selectedSubjectId,
  onSelectSubjectId,
  units,
  selectedUnitId,
  onSelectUnitId,
  topics,
  selectedTopicId,
  onSelectTopicId,
  questions,
  onReloadQuestions,
  onNotify,
}) => {
  // ----------------------------------------------------
  // FİLTRE VE ARAMA DURUMLARI
  // ----------------------------------------------------
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCorrectOption, setFilterCorrectOption] = useState<'ALL' | OptionId>('ALL');
  const [filterExplanation, setFilterExplanation] = useState<'ALL' | 'HAS_EXP' | 'NO_EXP'>('ALL');
  const [filterDifficulty, setFilterDifficulty] = useState<'ALL' | 'Kolay' | 'Orta' | 'Zor'>('ALL');
  const [sortBy, setSortBy] = useState<'NUM_ASC' | 'NUM_DESC' | 'TEXT_ASC'>('NUM_ASC');
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // ----------------------------------------------------
  // ÇOKLU SEÇİM (BULK ACTIONS)
  // ----------------------------------------------------
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  // ----------------------------------------------------
  // MODAL DURUMLARI
  // ----------------------------------------------------
  // Soru Ekle / Düzenle Modalı
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Form alanları
  const [formText, setFormText] = useState('');
  const [formA, setFormA] = useState('');
  const [formB, setFormB] = useState('');
  const [formC, setFormC] = useState('');
  const [formD, setFormD] = useState('');
  const [formE, setFormE] = useState('');
  const [formCorrect, setFormCorrect] = useState<OptionId>('A');
  const [formExplanation, setFormExplanation] = useState('');
  const [formDifficulty, setFormDifficulty] = useState<'Kolay' | 'Orta' | 'Zor'>('Orta');
  const [formYear, setFormYear] = useState('');
  const [editorPreviewActive, setEditorPreviewActive] = useState(false);

  // Modal Hiyerarşik Konu Seçimi (Ders -> Ünite -> Konu)
  const [modalSubjectId, setModalSubjectId] = useState('');
  const [modalUnitId, setModalUnitId] = useState('');
  const [modalTopicId, setModalTopicId] = useState('');
  const [modalUnitsList, setModalUnitsList] = useState<Unit[]>([]);
  const [modalTopicsList, setModalTopicsList] = useState<Topic[]>([]);

  // Öğrenci Canlı Önizleme Modalı
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [studentSimulatedAnswer, setStudentSimulatedAnswer] = useState<OptionId | null>(null);

  // Akıllı Metin Ayrıştırıcı Modalı (Smart Text/Word Parser)
  const [showSmartParserModal, setShowSmartParserModal] = useState(false);
  const [parserRawText, setParserRawText] = useState('');
  const [parserError, setParserError] = useState('');

  // Taşıma / Kopyalama Modalı
  const [showMoveCopyModal, setShowMoveCopyModal] = useState(false);
  const [targetMoveUnitId, setTargetMoveUnitId] = useState('');
  const [targetMoveTopicId, setTargetMoveTopicId] = useState('');
  const [targetMoveTopicsList, setTargetMoveTopicsList] = useState<Topic[]>([]);
  const [targetMoveBankId, setTargetMoveBankId] = useState('');
  const [targetMoveBanksList, setTargetMoveBanksList] = useState<QuestionBank[]>([]);
  const [moveActionType, setMoveActionType] = useState<'MOVE' | 'COPY'>('MOVE');

  // 4. Seviye: Soru Bankaları Durumu
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [isLoadingBanks, setIsLoadingBanks] = useState<boolean>(false);

  // Soru Bankası Oluşturma Modalı
  const [showNewBankModal, setShowNewBankModal] = useState<boolean>(false);
  const [bankTitleInput, setBankTitleInput] = useState<string>('');
  const [bankTypeInput, setBankTypeInput] = useState<string>('Standart Konu Testi');

  // Modal Soru Bankası Seçimi (4. Seviye)
  const [modalBankId, setModalBankId] = useState('');
  const [modalBanksList, setModalBanksList] = useState<QuestionBank[]>([]);

  // Konu değiştiğinde o konuya bağlı Soru Bankalarını yükle
  useEffect(() => {
    if (selectedTopicId) {
      loadBanksForTopic(selectedTopicId, selectedUnitId);
    } else {
      setBanks([]);
      setSelectedBankId('');
    }
  }, [selectedTopicId, selectedUnitId]);

  const loadBanksForTopic = async (tId: string, uId?: string) => {
    setIsLoadingBanks(true);
    try {
      const bankList = await api.getQuestionBanks(tId, uId);
      setBanks(bankList);
      if (bankList.length > 0) {
        setSelectedBankId((prev) => {
          if (prev && bankList.some((b) => b.id === prev)) return prev;
          return bankList[0].id;
        });
      } else {
        setSelectedBankId('');
      }
    } catch {
      setBanks([]);
      setSelectedBankId('');
    } finally {
      setIsLoadingBanks(false);
    }
  };

  // Aktif Soru Bankası nesnesi
  const selectedBank = useMemo(() => {
    return banks.find((b) => b.id === selectedBankId) || banks[0];
  }, [banks, selectedBankId]);

  // Seçili Soru Bankasına ait sorular
  const activeBankQuestions = useMemo(() => {
    if (!selectedBankId) return questions;
    return questions.filter((q) => q.bankId === selectedBankId || (!q.bankId && banks.length === 1));
  }, [questions, selectedBankId, banks]);

  // ----------------------------------------------------
  // İSTATİSTİKLER & KALİTE KONTROL
  // ----------------------------------------------------
  const stats = useMemo(() => {
    const total = activeBankQuestions.length;
    const countA = activeBankQuestions.filter((q) => q.correctOption === 'A').length;
    const countB = activeBankQuestions.filter((q) => q.correctOption === 'B').length;
    const countC = activeBankQuestions.filter((q) => q.correctOption === 'C').length;
    const countD = activeBankQuestions.filter((q) => q.correctOption === 'D').length;
    const countE = activeBankQuestions.filter((q) => q.correctOption === 'E').length;
    const noExpCount = activeBankQuestions.filter((q) => !q.explanation || q.explanation.trim() === '').length;
    const hasExpCount = total - noExpCount;

    return {
      total,
      countA,
      countB,
      countC,
      countD,
      countE,
      noExpCount,
      hasExpCount,
      percentExp: total > 0 ? Math.round((hasExpCount / total) * 100) : 100,
    };
  }, [activeBankQuestions]);

  // ----------------------------------------------------
  // FİLTRELEME & SIRALAMA & SAYFALAMA
  // ----------------------------------------------------
  const filteredAndSortedQuestions = useMemo(() => {
    let list = [...activeBankQuestions];

    // Metin Arama
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.questionText.toLowerCase().includes(q) ||
          item.options.some((o) => o.text.toLowerCase().includes(q)) ||
          (item.explanation && item.explanation.toLowerCase().includes(q)) ||
          (item.year && item.year.toLowerCase().includes(q))
      );
    }

    // Doğru Şık Filtresi
    if (filterCorrectOption !== 'ALL') {
      list = list.filter((item) => item.correctOption === filterCorrectOption);
    }

    // Açıklama Filtresi
    if (filterExplanation === 'HAS_EXP') {
      list = list.filter((item) => item.explanation && item.explanation.trim() !== '');
    } else if (filterExplanation === 'NO_EXP') {
      list = list.filter((item) => !item.explanation || item.explanation.trim() === '');
    }

    // Zorluk Filtresi
    if (filterDifficulty !== 'ALL') {
      list = list.filter((item) => item.difficulty === filterDifficulty);
    }

    // Sıralama
    list.sort((a, b) => {
      if (sortBy === 'NUM_ASC') {
        return (a.questionNumber || 0) - (b.questionNumber || 0);
      }
      if (sortBy === 'NUM_DESC') {
        return (b.questionNumber || 0) - (a.questionNumber || 0);
      }
      if (sortBy === 'TEXT_ASC') {
        return a.questionText.localeCompare(b.questionText, 'tr');
      }
      return 0;
    });

    return list;
  }, [questions, searchQuery, filterCorrectOption, filterExplanation, filterDifficulty, sortBy]);

  // Sayfalama
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedQuestions.length / pageSize));
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedQuestions.slice(start, start + pageSize);
  }, [filteredAndSortedQuestions, currentPage, pageSize]);

  // ----------------------------------------------------
  // ÇOKLU SEÇİM FONKSİYONLARI
  // ----------------------------------------------------
  const isAllSelected =
    filteredAndSortedQuestions.length > 0 &&
    filteredAndSortedQuestions.every((q) => selectedQuestionIds.includes(q.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedQuestionIds([]);
    } else {
      setSelectedQuestionIds(filteredAndSortedQuestions.map((q) => q.id));
    }
  };

  const handleToggleSelectQuestion = (id: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toplu Silme
  const handleBulkDelete = async () => {
    if (selectedQuestionIds.length === 0) return;
    if (
      !confirm(
        `Seçili ${selectedQuestionIds.length} soruyu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
      )
    ) {
      return;
    }

    try {
      for (const qId of selectedQuestionIds) {
        await api.adminDeleteQuestion(qId);
      }
      onNotify(`${selectedQuestionIds.length} soru başarıyla silindi.`);
      setSelectedQuestionIds([]);
      onReloadQuestions();
    } catch (e) {
      onNotify('Toplu silme işleminde hata oluştu', 'error');
    }
  };

  // Seçilenleri JSON Olarak Dışa Aktarma
  const handleExportSelected = () => {
    const listToExport = questions.filter((q) => selectedQuestionIds.includes(q.id));
    if (listToExport.length === 0) {
      onNotify('Dışa aktarılacak soru seçilmedi', 'error');
      return;
    }
    const cleanList = listToExport.map(({ questionNumber, questionText, options, correctOption, explanation, difficulty, year }) => ({
      questionNumber,
      questionText,
      options,
      correctOption,
      explanation,
      difficulty,
      year,
    }));
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(cleanList, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `kpss_secili_${listToExport.length}_soru.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onNotify(`${listToExport.length} soru JSON dosyası olarak indirildi.`);
  };

  // ----------------------------------------------------
  // TAŞIMA / KOPYALAMA İŞLEMİ (DERS -> ÜNİTE -> KONU -> BANKA)
  // ----------------------------------------------------
  const openMoveCopyModal = async (type: 'MOVE' | 'COPY') => {
    setMoveActionType(type);
    setTargetMoveUnitId(selectedUnitId);
    if (selectedUnitId) {
      try {
        const tList = await api.getTopics(selectedUnitId);
        setTargetMoveTopicsList(tList);
      } catch {
        setTargetMoveTopicsList([]);
      }
    } else {
      setTargetMoveTopicsList([]);
    }
    setTargetMoveTopicId(selectedTopicId);
    if (selectedTopicId) {
      try {
        const bList = await api.getQuestionBanks(selectedTopicId, selectedUnitId);
        setTargetMoveBanksList(bList);
        setTargetMoveBankId(selectedBankId || (bList.length > 0 ? bList[0].id : ''));
      } catch {
        setTargetMoveBanksList([]);
        setTargetMoveBankId('');
      }
    } else {
      setTargetMoveBanksList([]);
      setTargetMoveBankId('');
    }
    setShowMoveCopyModal(true);
  };

  const handleTargetMoveUnitChange = async (unitId: string) => {
    setTargetMoveUnitId(unitId);
    setTargetMoveTopicId('');
    setTargetMoveBankId('');
    setTargetMoveBanksList([]);
    if (unitId) {
      try {
        const tList = await api.getTopics(unitId);
        setTargetMoveTopicsList(tList);
      } catch {
        setTargetMoveTopicsList([]);
      }
    } else {
      setTargetMoveTopicsList([]);
    }
  };

  const handleTargetMoveTopicChange = async (topicId: string) => {
    setTargetMoveTopicId(topicId);
    setTargetMoveBankId('');
    if (topicId) {
      try {
        const bList = await api.getQuestionBanks(topicId, targetMoveUnitId);
        setTargetMoveBanksList(bList);
        setTargetMoveBankId(bList.length > 0 ? bList[0].id : '');
      } catch {
        setTargetMoveBanksList([]);
        setTargetMoveBankId('');
      }
    } else {
      setTargetMoveBanksList([]);
      setTargetMoveBankId('');
    }
  };

  const handleExecuteMoveCopy = async () => {
    const targetId = targetMoveBankId || targetMoveTopicId || targetMoveUnitId;
    if (!targetId) {
      onNotify('Lütfen hedef ünite, konu veya soru bankası seçiniz.', 'error');
      return;
    }
    const selectedQuestions = questions.filter((q) => selectedQuestionIds.includes(q.id));
    if (selectedQuestions.length === 0) return;

    try {
      for (const [idx, q] of selectedQuestions.entries()) {
        const newQ: Question = {
          ...q,
          id: moveActionType === 'COPY' ? `${targetId}-copy-${Date.now()}-${idx}` : q.id,
          unitId: targetMoveUnitId || q.unitId,
          topicId: targetMoveTopicId || q.topicId,
          bankId: targetMoveBankId || q.bankId,
        };

        if (moveActionType === 'MOVE') {
          await api.adminDeleteQuestion(q.id);
        }
        await api.adminCreateQuestion(newQ);
      }

      onNotify(
        `${selectedQuestions.length} soru başarıyla ${
          moveActionType === 'MOVE' ? 'taşındı' : 'kopyalandı'
        }.`
      );
      setShowMoveCopyModal(false);
      setSelectedQuestionIds([]);
      onReloadQuestions();
    } catch (e) {
      onNotify('Taşıma/Kopyalama sırasında hata oluştu', 'error');
    }
  };

  // ----------------------------------------------------
  // HİYERARŞİK SORU EKLE / DÜZENLE MODALI (4 SEVİYE)
  // ----------------------------------------------------
  const handleModalSubjectChange = async (subId: string) => {
    setModalSubjectId(subId);
    try {
      const uList = await api.getUnits(subId);
      setModalUnitsList(uList);
      const firstUnitId = uList.length > 0 ? uList[0].id : '';
      setModalUnitId(firstUnitId);
      if (firstUnitId) {
        const tList = await api.getTopics(firstUnitId);
        setModalTopicsList(tList);
        const firstTopicId = tList.length > 0 ? tList[0].id : '';
        setModalTopicId(firstTopicId);
        if (firstTopicId) {
          const bList = await api.getQuestionBanks(firstTopicId, firstUnitId);
          setModalBanksList(bList);
          setModalBankId(bList.length > 0 ? bList[0].id : '');
        } else {
          setModalBanksList([]);
          setModalBankId('');
        }
      } else {
        setModalTopicsList([]);
        setModalTopicId('');
        setModalBanksList([]);
        setModalBankId('');
      }
    } catch {
      setModalUnitsList([]);
      setModalTopicsList([]);
      setModalTopicId('');
      setModalBanksList([]);
      setModalBankId('');
    }
  };

  const handleModalUnitChange = async (unitId: string) => {
    setModalUnitId(unitId);
    try {
      const tList = await api.getTopics(unitId);
      setModalTopicsList(tList);
      const firstTopicId = tList.length > 0 ? tList[0].id : '';
      setModalTopicId(firstTopicId);
      if (firstTopicId) {
        const bList = await api.getQuestionBanks(firstTopicId, unitId);
        setModalBanksList(bList);
        setModalBankId(bList.length > 0 ? bList[0].id : '');
      } else {
        setModalBanksList([]);
        setModalBankId('');
      }
    } catch {
      setModalTopicsList([]);
      setModalTopicId('');
      setModalBanksList([]);
      setModalBankId('');
    }
  };

  const handleModalTopicChange = async (topicId: string) => {
    setModalTopicId(topicId);
    try {
      const bList = await api.getQuestionBanks(topicId, modalUnitId);
      setModalBanksList(bList);
      setModalBankId(bList.length > 0 ? bList[0].id : '');
    } catch {
      setModalBanksList([]);
      setModalBankId('');
    }
  };

  const openCreateModal = async () => {
    setEditingQuestion(null);
    setFormText('');
    setFormA('');
    setFormB('');
    setFormC('');
    setFormD('');
    setFormE('');
    setFormCorrect('A');
    setFormExplanation('');
    setFormDifficulty('Orta');
    setFormYear('');
    setEditorPreviewActive(false);

    // Hiyerarşi durumunu başlat (Ders -> Ünite -> Konu -> Soru Bankası)
    const initSubId = selectedSubjectId || (subjects.length > 0 ? subjects[0].id : '');
    setModalSubjectId(initSubId);

    if (initSubId) {
      const uList = await api.getUnits(initSubId);
      setModalUnitsList(uList);
      const initUnitId = selectedUnitId && uList.some((u) => u.id === selectedUnitId)
        ? selectedUnitId
        : (uList.length > 0 ? uList[0].id : '');
      setModalUnitId(initUnitId);

      if (initUnitId) {
        const tList = await api.getTopics(initUnitId);
        setModalTopicsList(tList);
        const initTopicId = selectedTopicId && tList.some((t) => t.id === selectedTopicId)
          ? selectedTopicId
          : (tList.length > 0 ? tList[0].id : '');
        setModalTopicId(initTopicId);

        if (initTopicId) {
          const bList = await api.getQuestionBanks(initTopicId, initUnitId);
          setModalBanksList(bList);
          const initBankId = selectedBankId && bList.some((b) => b.id === selectedBankId)
            ? selectedBankId
            : (bList.length > 0 ? bList[0].id : '');
          setModalBankId(initBankId);
        } else {
          setModalBanksList([]);
          setModalBankId('');
        }
      } else {
        setModalTopicsList([]);
        setModalTopicId('');
        setModalBanksList([]);
        setModalBankId('');
      }
    } else {
      setModalUnitsList([]);
      setModalTopicsList([]);
      setModalTopicId('');
      setModalBanksList([]);
      setModalBankId('');
    }

    setShowEditorModal(true);
  };

  const openEditModal = async (q: Question) => {
    setEditingQuestion(q);
    setFormText(q.questionText);
    const getOpt = (id: OptionId) => q.options.find((o) => o.id === id)?.text || '';
    setFormA(getOpt('A'));
    setFormB(getOpt('B'));
    setFormC(getOpt('C'));
    setFormD(getOpt('D'));
    setFormE(getOpt('E'));
    setFormCorrect(q.correctOption);
    setFormExplanation(q.explanation || '');
    setFormDifficulty(q.difficulty || 'Orta');
    setFormYear(q.year || '');
    setEditorPreviewActive(false);

    // Sorunun hiyerarşik konumunu (Ders, Ünite, Konu, Banka) tespit et
    let targetSubId = selectedSubjectId || (subjects.length > 0 ? subjects[0].id : '');
    let targetUnitId = q.unitId || selectedUnitId;
    let targetTopicId = q.topicId || selectedTopicId;
    let targetBankId = q.bankId || selectedBankId;

    if (targetUnitId) {
      for (const s of subjects) {
        const uList = await api.getUnits(s.id);
        if (uList.some((u) => u.id === targetUnitId)) {
          targetSubId = s.id;
          break;
        }
      }
    }

    setModalSubjectId(targetSubId);
    const uList = targetSubId ? await api.getUnits(targetSubId) : [];
    setModalUnitsList(uList);
    if (!targetUnitId && uList.length > 0) {
      targetUnitId = uList[0].id;
    }
    setModalUnitId(targetUnitId);

    const tList = targetUnitId ? await api.getTopics(targetUnitId) : [];
    setModalTopicsList(tList);
    if (!targetTopicId && tList.length > 0) {
      targetTopicId = tList[0].id;
    }
    setModalTopicId(targetTopicId);

    if (targetTopicId) {
      const bList = await api.getQuestionBanks(targetTopicId, targetUnitId);
      setModalBanksList(bList);
      if (!targetBankId || !bList.some((b) => b.id === targetBankId)) {
        targetBankId = bList.length > 0 ? bList[0].id : '';
      }
    } else {
      setModalBanksList([]);
      targetBankId = '';
    }
    setModalBankId(targetBankId);

    setShowEditorModal(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    // Zorunlu kural: Her soru mutlaka bir konuya ve soru bankasına bağlı olmalı
    if (!modalTopicId) {
      onNotify('Lütfen sorunun ait olduğu alt konuyu seçiniz!', 'error');
      return;
    }
    if (!modalBankId) {
      onNotify('Her soru mutlaka bir Soru Bankasına bağlı olmalıdır! Lütfen bir soru bankası seçiniz.', 'error');
      return;
    }
    if (!formText.trim()) {
      onNotify('Lütfen soru metnini yazınız.', 'error');
      return;
    }
    if (!formA.trim() || !formB.trim() || !formC.trim() || !formD.trim() || !formE.trim()) {
      onNotify('Lütfen 5 seçeneğin (A, B, C, D, E) tamamını doldurunuz.', 'error');
      return;
    }

    const questionData: Question = {
      id: editingQuestion ? editingQuestion.id : `${modalBankId}-q${Date.now()}`,
      unitId: modalUnitId,
      topicId: modalTopicId,
      bankId: modalBankId,
      questionNumber: editingQuestion ? editingQuestion.questionNumber : activeBankQuestions.length + 1,
      questionText: formText.trim(),
      options: [
        { id: 'A', text: formA.trim() },
        { id: 'B', text: formB.trim() },
        { id: 'C', text: formC.trim() },
        { id: 'D', text: formD.trim() },
        { id: 'E', text: formE.trim() },
      ],
      correctOption: formCorrect,
      explanation: formExplanation.trim(),
      difficulty: formDifficulty,
      year: formYear.trim() || undefined,
    };

    try {
      if (editingQuestion) {
        await api.adminUpdateQuestion(questionData);
        onNotify('Soru başarıyla güncellendi.');
      } else {
        await api.adminCreateQuestion(questionData);
        onNotify('Yeni soru başarıyla eklendi.');
      }
      if (selectedTopicId) {
        await loadBanksForTopic(selectedTopicId, selectedUnitId);
      }
      setShowEditorModal(false);
      onReloadQuestions();
    } catch (e) {
      onNotify('Soru kaydedilemedi', 'error');
    }
  };

  // Yeni Soru Bankası Oluşturma
  const handleCreateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopicId) {
      onNotify('Lütfen önce 3. adımdan bir alt konu seçiniz.', 'error');
      return;
    }
    if (!bankTitleInput.trim()) {
      onNotify('Lütfen soru bankası başlığı giriniz.', 'error');
      return;
    }
    try {
      const newBank: QuestionBank = {
        id: `${selectedTopicId}-bank-${Date.now()}`,
        topicId: selectedTopicId,
        unitId: selectedUnitId,
        title: bankTitleInput.trim(),
        bankType: bankTypeInput,
        targetQuestionCount: 20,
        questionCount: 0,
        orderNumber: banks.length + 1,
        isLocked: false,
      };
      await api.adminCreateQuestionBank(newBank);
      const updated = [...banks, newBank];
      setBanks(updated);
      setSelectedBankId(newBank.id);
      setShowNewBankModal(false);
      setBankTitleInput('');
      onNotify(`"${newBank.title}" soru bankası başarıyla oluşturuldu!`, 'success');
    } catch {
      onNotify('Soru bankası oluşturulamadı', 'error');
    }
  };

  // 20 Soru Barajını Doldurma Paketi
  const handleLoadSamplePackage = async () => {
    if (!selectedTopicId) {
      onNotify('Lütfen önce bir konu seçiniz.', 'error');
      return;
    }
    try {
      const res = await api.adminLoadSamplePackage(selectedTopicId, selectedUnitId, selectedBankId);
      if (res.success) {
        onNotify(`Soru bankası için 20 soruluk paket yüklendi ve yayına hazırlandı! (${res.count} soru)`, 'success');
        if (selectedTopicId) {
          await loadBanksForTopic(selectedTopicId, selectedUnitId);
        }
        onReloadQuestions();
      }
    } catch (e) {
      onNotify('Örnek paket yüklenirken hata oluştu', 'error');
    }
  };

  // Soru Klonla / Çoğalt (Duplicate)
  const handleDuplicateQuestion = async (q: Question) => {
    const targetTopicId = q.topicId || selectedTopicId;
    if (!targetTopicId) {
      onNotify('Sorunun bağlı olduğu bir konu bulunamadı.', 'error');
      return;
    }
    const duplicated: Question = {
      ...q,
      id: `${targetTopicId}-dup-${Date.now()}`,
      topicId: targetTopicId,
      unitId: q.unitId || selectedUnitId,
      questionNumber: questions.length + 1,
      questionText: `${q.questionText} (Kopya)`,
    };

    try {
      await api.adminCreateQuestion(duplicated);
      onNotify('Soru başarıyla çoğaltıldı.');
      onReloadQuestions();
    } catch (e) {
      onNotify('Soru çoğaltılamadı', 'error');
    }
  };

  // Tekil Soru Sil
  const handleDeleteSingle = async (id: string) => {
    if (!confirm('Bu soruyu silmek istediğinize emin misiniz?')) return;
    try {
      await api.adminDeleteQuestion(id);
      onNotify('Soru silindi.');
      onReloadQuestions();
    } catch (e) {
      onNotify('Soru silinemedi', 'error');
    }
  };

  // ----------------------------------------------------
  // AKILLI METİN AYRIŞTIRICI (WORD/PDF PARSER)
  // ----------------------------------------------------
  const handleParseSmartText = () => {
    setParserError('');
    if (!parserRawText.trim()) {
      setParserError('Lütfen ayrıştırılacak metni yapıştırınız.');
      return;
    }

    try {
      const text = parserRawText.trim();

      // Regex ile seçenekleri yakala: A), B), C), D), E) veya A., B., C., D., E.
      const optMatchA = text.match(/(?:^|\n)\s*[A|a][\)\.\-]\s*([\s\S]*?)(?=(?:\n\s*[B|b][\)\.\-]))/);
      const optMatchB = text.match(/(?:^|\n)\s*[B|b][\)\.\-]\s*([\s\S]*?)(?=(?:\n\s*[C|c][\)\.\-]))/);
      const optMatchC = text.match(/(?:^|\n)\s*[C|c][\)\.\-]\s*([\s\S]*?)(?=(?:\n\s*[D|d][\)\.\-]))/);
      const optMatchD = text.match(/(?:^|\n)\s*[D|d][\)\.\-]\s*([\s\S]*?)(?=(?:\n\s*[E|e][\)\.\-]))/);
      const optMatchE = text.match(
        /(?:^|\n)\s*[E|e][\)\.\-]\s*([\s\S]*?)(?=(?:\n\s*(?:Cevap|Yanıt|Açıklama|Doğru)|$))/i
      );

      // Soru kökünü yakala: A) seçeneğinden önceki kısım
      const questionRoot = text.split(/(?:^|\n)\s*[A|a][\)\.\-]/)[0].trim();

      // Cevap ve Açıklama yakala
      const answerMatch = text.match(/(?:Cevap|Yanıt|Doğru Seçenek)\s*[:=\-]?\s*([A-Ea-e])/i);
      const explanationMatch = text.match(/(?:Açıklama|Çözüm)\s*[:=\-]?\s*([\s\S]*?)$/i);

      if (!questionRoot || !optMatchA || !optMatchB || !optMatchC || !optMatchD || !optMatchE) {
        setParserError(
          'Metin tam ayrıştırılamadı. Lütfen A), B), C), D), E) seçeneklerinin düzgün sırada olduğundan emin olunuz.'
        );
        return;
      }

      // Form alanlarını doldur ve Editor modalına aktar
      setEditingQuestion(null);
      setFormText(questionRoot.replace(/^\d+[\.\)]\s*/, '')); // Baştaki 1. gibi numaraları temizle
      setFormA(optMatchA[1].trim());
      setFormB(optMatchB[1].trim());
      setFormC(optMatchC[1].trim());
      setFormD(optMatchD[1].trim());
      setFormE(optMatchE[1].trim());

      if (answerMatch && answerMatch[1]) {
        setFormCorrect(answerMatch[1].toUpperCase() as OptionId);
      } else {
        setFormCorrect('A');
      }

      if (explanationMatch && explanationMatch[1]) {
        setFormExplanation(explanationMatch[1].trim());
      } else {
        setFormExplanation('');
      }

      setShowSmartParserModal(false);
      setParserRawText('');
      setShowEditorModal(true);
      onNotify('Metin başarıyla ayrıştırıldı ve soru editörüne aktarıldı!');
    } catch (e: any) {
      setParserError('Ayrıştırma hatası: ' + e.message);
    }
  };

  const sampleParserText = `Aşağıdakilerden hangisi İslamiyet öncesi Türk devletlerinde hükümdarlık sembollerinden biri değildir?
A) Otağ (Hükümdar Çadırı)
B) Tuğ (Sancak)
C) Nevbet (Davul)
D) Hilat (Hükümdar Giysisi)
E) Kotuz (Sorguç)
Cevap: D
Açıklama: Hilat, İslamiyetin kabulünden sonra Abbasi halifeleri tarafından hükümdarlara hediye edilen sembolik bir elbisedir.`;

  // ----------------------------------------------------
  // RENDER
  // ----------------------------------------------------
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. ÜST İSTATİSTİK & KALİTE KONTROL BARI */}
      <div style={styles.metricsBar}>
        <div style={styles.metricPill}>
          <HelpCircle size={15} color="#4F46E5" />
          <span>Toplam Soru:</span>
          <b>{stats.total}</b>
        </div>

        <div style={styles.metricPill}>
          <BarChart2 size={15} color="#059669" />
          <span>Şık Dengesi:</span>
          <span style={styles.optionMiniDist}>
            <span>A:{stats.countA}</span>
            <span>B:{stats.countB}</span>
            <span>C:{stats.countC}</span>
            <span>D:{stats.countD}</span>
            <span>E:{stats.countE}</span>
          </span>
        </div>

        <div
          style={{
            ...styles.metricPill,
            backgroundColor: stats.noExpCount > 0 ? '#FEF2F2' : '#F0FDF4',
            borderColor: stats.noExpCount > 0 ? '#FECACA' : '#BBF7D0',
            color: stats.noExpCount > 0 ? '#991B1B' : '#166534',
          }}
        >
          {stats.noExpCount > 0 ? (
            <>
              <AlertTriangle size={15} color="#DC2626" />
              <span>Açıklamasız Soru:</span>
              <b>{stats.noExpCount}</b>
            </>
          ) : (
            <>
              <CheckCircle size={15} color="#16A34A" />
              <span>Çözüm Oranı: %100 Tam</span>
            </>
          )}
        </div>
      </div>

      {/* 2. FİLTRELEME & AKSİYON PANELİ */}
      <div style={styles.panelCard}>
        {/* Kademeli Seçiciler */}
        <div style={styles.selectorsRow}>
          {/* Ders */}
          <div style={styles.selectGroup}>
            <label style={styles.fieldLabel}>Ders:</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => onSelectSubjectId(e.target.value)}
              style={styles.dropdown}
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          {/* Ünite */}
          <div style={styles.selectGroup}>
            <label style={styles.fieldLabel}>Ünite:</label>
            <select
              value={selectedUnitId}
              onChange={(e) => onSelectUnitId(e.target.value)}
              style={styles.dropdown}
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unitNumber}. {u.title}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Alt Konu / Kazanım Seçimi */}
          <div style={styles.selectGroup}>
            <label style={styles.fieldLabel}>3. Alt Konu / Kazanım:</label>
            <select
              value={selectedTopicId}
              onChange={(e) => onSelectTopicId(e.target.value)}
              style={{
                ...styles.dropdown,
                borderColor: selectedTopicId ? '#4F46E5' : '#EF4444',
                fontWeight: 600,
              }}
            >
              {topics.length === 0 ? (
                <option value="">(Bu ünitede henüz konu yok)</option>
              ) : (
                topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.topicNumber}. {t.title}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* 4. Soru Bankası Seçimi */}
          <div style={styles.selectGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={styles.fieldLabel}>4. Soru Bankası:</label>
              {selectedTopicId && (
                <button
                  type="button"
                  onClick={() => setShowNewBankModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4F46E5',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                    marginBottom: '2px',
                  }}
                  title="Bu alt konuya yeni soru bankası ekle"
                >
                  + Yeni Banka
                </button>
              )}
            </div>
            <select
              value={selectedBankId}
              onChange={(e) => setSelectedBankId(e.target.value)}
              style={{
                ...styles.dropdown,
                borderColor: selectedBankId ? '#4F46E5' : '#EF4444',
                fontWeight: 600,
              }}
              disabled={banks.length === 0 || isLoadingBanks}
            >
              {isLoadingBanks ? (
                <option value="">Yükleniyor...</option>
              ) : banks.length === 0 ? (
                <option value="">(Bu konuda henüz soru bankası yok)</option>
              ) : (
                banks.map((b) => {
                  const qCount = questions.filter(
                    (q) => q.bankId === b.id || (!q.bankId && banks.length === 1)
                  ).length;
                  const isPub = qCount >= 20;
                  return (
                    <option key={b.id} value={b.id}>
                      {b.title} ({qCount} Soru - {isPub ? 'Yayında 🟢' : 'Hazırlıkta 🔴'})
                    </option>
                  );
                })
              )}
            </select>
          </div>

          {/* Soru Arama */}
          <div style={{ ...styles.selectGroup, flex: 1, minWidth: '220px' }}>
            <label style={styles.fieldLabel}>Soru Metninde & Şıklarda Ara:</label>
            <div style={{ position: 'relative' }}>
              <Search
                size={15}
                color="#94A3B8"
                style={{ position: 'absolute', left: '10px', top: '9px' }}
              />
              <input
                type="text"
                placeholder="Örn: Selçuklu, İkta, ses bilgisi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ ...styles.textInput, paddingLeft: '32px' }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={styles.clearSearchBtn}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Konu Yok Uyarısı */}
        {topics.length === 0 && (
          <div style={{
            marginTop: '12px',
            padding: '12px 16px',
            backgroundColor: '#FEF2F2',
            borderRadius: '10px',
            border: '1px solid #FECACA',
            color: '#991B1B',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <AlertCircle size={20} color="#DC2626" />
            <div>
              <b>Bu ünitede henüz bir konu bulunmuyor!</b> Her soru bankası mutlaka bir alt konuya bağlı olmalıdır. Soru ekleyebilmek veya soru bankasını yönetebilmek için lütfen önce <b>Müfredat Yönetimi</b> sekmesinden bir alt konu ekleyin.
            </div>
          </div>
        )}

        {/* Soru Bankası Yayın Durumu ve 20 Soru Kuralı Kartı */}
        {selectedTopicId && (
          <div style={{
            marginTop: '14px',
            padding: '14px 18px',
            borderRadius: '12px',
            backgroundColor: activeBankQuestions.length >= 20 ? '#F0FDF4' : '#FEF2F2',
            border: `1px solid ${activeBankQuestions.length >= 20 ? '#BBF7D0' : '#FECACA'}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {activeBankQuestions.length >= 20 ? (
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle size={22} color="#16A34A" />
                  </div>
                ) : (
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertTriangle size={22} color="#DC2626" />
                  </div>
                )}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: activeBankQuestions.length >= 20 ? '#166534' : '#991B1B' }}>
                      {selectedBank ? selectedBank.title : 'Soru Bankası'}: {activeBankQuestions.length >= 20 ? 'Yayında (Öğrencilere Açık)' : 'Yayınlanamaz (Hazırlık Aşamasında)'}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: activeBankQuestions.length >= 20 ? '#16A34A' : '#DC2626',
                      color: '#FFFFFF'
                    }}>
                      {activeBankQuestions.length >= 20 ? `YAYINDA • ${activeBankQuestions.length} SORU` : `YAYINLANAMAZ • ${activeBankQuestions.length}/20 SORU`}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: activeBankQuestions.length >= 20 ? '#15803D' : '#B91C1C', marginTop: '2px' }}>
                    {activeBankQuestions.length >= 20
                      ? `Bu soru bankası 20 soru barajını tamamlamıştır. Öğrenciler sınav modunda bu testi çözebilir.`
                      : `KPSS kuralı: 20 sorunun altındaki soru bankaları öğrencilere YAYINLANMAZ. (Yayına açılması için gereken: ${Math.max(0, 20 - activeBankQuestions.length)} soru daha)`}
                  </div>
                </div>
              </div>

              {activeBankQuestions.length < 20 && (
                <button
                  type="button"
                  onClick={handleLoadSamplePackage}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#4F46E5',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  title="Bu soru bankasını 20 soruya tamamlamak için örnek paketi yükleyin"
                >
                  <Sparkles size={14} />
                  Tek Tıkla 20 Soru Paketi Doldur
                </button>
              )}
            </div>

            {/* 20 Soru İlerleme Çubuğu */}
            <div style={{ width: '100%', height: '8px', backgroundColor: activeBankQuestions.length >= 20 ? '#DCFCE7' : '#FEE2E2', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, Math.round((activeBankQuestions.length / 20) * 100))}%`,
                backgroundColor: activeBankQuestions.length >= 20 ? '#16A34A' : (activeBankQuestions.length >= 10 ? '#F59E0B' : '#DC2626'),
                borderRadius: '999px',
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        )}

        {/* İkincil Filtreler (Doğru Şık, Açıklama, Zorluk, Sıralama) */}
        <div style={styles.secondaryFiltersRow}>
          {/* Doğru Şık Filtresi */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={styles.filterTagLabel}>Doğru Cevap:</span>
            {(['ALL', 'A', 'B', 'C', 'D', 'E'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setFilterCorrectOption(opt)}
                style={{
                  ...styles.pillBtn,
                  backgroundColor: filterCorrectOption === opt ? '#0F172A' : '#F1F5F9',
                  color: filterCorrectOption === opt ? '#FFFFFF' : '#475569',
                }}
              >
                {opt === 'ALL' ? 'Tümü' : opt}
              </button>
            ))}
          </div>

          {/* Açıklama Durumu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={styles.filterTagLabel}>Açıklama:</span>
            <select
              value={filterExplanation}
              onChange={(e) => setFilterExplanation(e.target.value as any)}
              style={styles.miniSelect}
            >
              <option value="ALL">Tümü</option>
              <option value="HAS_EXP">Açıklamalı Olanlar</option>
              <option value="NO_EXP">Açıklaması Eksik Olanlar</option>
            </select>
          </div>

          {/* Sıralama */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
            <span style={styles.filterTagLabel}>Sıralama:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={styles.miniSelect}
            >
              <option value="NUM_ASC">Soru No (1 ➔ 20)</option>
              <option value="NUM_DESC">Soru No (20 ➔ 1)</option>
              <option value="TEXT_ASC">Metne Göre (A ➔ Z)</option>
            </select>
          </div>
        </div>

        {/* Ana Butonlar Barı */}
        <div style={styles.toolbarActionsRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={openCreateModal} style={styles.btnPrimary}>
              <Plus size={16} style={{ marginRight: '6px' }} />
              + Yeni Soru Ekle
            </button>

            <button
              onClick={() => setShowSmartParserModal(true)}
              style={styles.btnSparkle}
              title="Word veya PDF'ten kopyaladığınız soru metnini otomatik ayrıştırın"
            >
              <Sparkles size={16} style={{ marginRight: '6px' }} />
              Metinden Soru Ayrıştır
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', color: '#64748B' }}>
              <b>{filteredAndSortedQuestions.length}</b> soru filtrelendi
            </span>
          </div>
        </div>
      </div>

      {/* 3. ÇOKLU İŞLEM BARI (BULK ACTIONS BAR) */}
      {selectedQuestionIds.length > 0 && (
        <div style={styles.bulkActionBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={styles.bulkCountBadge}>{selectedQuestionIds.length} soru seçildi</span>
            <button
              onClick={() => setSelectedQuestionIds([])}
              style={{ ...styles.btnGhost, fontSize: '12px' }}
            >
              Seçimi Temizle
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => openMoveCopyModal('MOVE')}
              style={styles.btnSecondary}
            >
              <ArrowRightLeft size={14} style={{ marginRight: '6px' }} />
              Taşı
            </button>

            <button
              onClick={() => openMoveCopyModal('COPY')}
              style={styles.btnSecondary}
            >
              <Copy size={14} style={{ marginRight: '6px' }} />
              Kopyala
            </button>

            <button onClick={handleExportSelected} style={styles.btnSecondary}>
              <Download size={14} style={{ marginRight: '6px' }} />
              Seçilenleri İndir (JSON)
            </button>

            <button onClick={handleBulkDelete} style={styles.btnDanger}>
              <Trash2 size={14} style={{ marginRight: '6px' }} />
              Seçilenleri Sil
            </button>
          </div>
        </div>
      )}

      {/* 4. SORU LİSTESİ BAŞLIĞI VE TÜMÜNÜ SEÇ */}
      <div style={styles.listHeaderRow}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={handleToggleSelectAll}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
            {isAllSelected ? 'Tüm Seçimleri Kaldır' : 'Bu Sayfadaki Tümünü Seç'}
          </span>
        </label>

        {/* Sayfa Başına Gösterim */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#64748B' }}>Sayfa başına:</span>
          {[10, 20, 50].map((size) => (
            <button
              key={size}
              onClick={() => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              style={{
                ...styles.pillBtn,
                padding: '3px 8px',
                fontSize: '11px',
                backgroundColor: pageSize === size ? '#4F46E5' : '#F1F5F9',
                color: pageSize === size ? '#FFFFFF' : '#475569',
              }}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* 5. SORU LİSTESİ (KARTLAR) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {paginatedQuestions.length === 0 ? (
          <div style={styles.emptyCard}>
            <HelpCircle size={44} color="#94A3B8" style={{ marginBottom: '12px' }} />
            <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#1E293B', margin: 0 }}>
              Kriterlere Uygun Soru Bulunamadı
            </h4>
            <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '420px', margin: '8px 0 16px' }}>
              Arama kriterlerinizi değiştirebilir veya "+ Yeni Soru Ekle" butonuna basarak ilk sorunuzu yazabilirsiniz.
            </p>
            <button onClick={openCreateModal} style={styles.btnPrimary}>
              <Plus size={16} style={{ marginRight: '6px' }} />
              Yeni Soru Ekle
            </button>
          </div>
        ) : (
          paginatedQuestions.map((q, idx) => {
            const isSelected = selectedQuestionIds.includes(q.id);
            const displayNum = (currentPage - 1) * pageSize + idx + 1;

            return (
              <div
                key={q.id}
                style={{
                  ...styles.questionItemCard,
                  borderColor: isSelected ? '#4F46E5' : '#E2E8F0',
                  backgroundColor: isSelected ? '#F8FAFC' : '#FFFFFF',
                }}
              >
                {/* Kart Üst Barı */}
                <div style={styles.cardTopRow}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelectQuestion(q.id)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span style={styles.badgeNum}>#{q.questionNumber || displayNum}</span>
                    <span style={styles.badgeCorrect}>Doğru: {q.correctOption}</span>

                    {/* Zorluk Rozeti */}
                    <span
                      style={{
                        ...styles.badgeDifficulty,
                        backgroundColor:
                          q.difficulty === 'Kolay'
                            ? '#DCFCE7'
                            : q.difficulty === 'Zor'
                            ? '#FEE2E2'
                            : '#FEF3C7',
                        color:
                          q.difficulty === 'Kolay'
                            ? '#15803D'
                            : q.difficulty === 'Zor'
                            ? '#B91C1C'
                            : '#B45309',
                      }}
                    >
                      {q.difficulty || 'Orta'}
                    </span>

                    {/* Çıkmış Soru Yılı / Etiket */}
                    {q.year && <span style={styles.badgeTag}>{q.year}</span>}
                  </div>

                  {/* Sağ Aksiyon Butonları */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => {
                        setPreviewQuestion(q);
                        setStudentSimulatedAnswer(null);
                      }}
                      style={styles.actionIconBtn}
                      title="Öğrenci Arayüzünde Canlı Simülasyon"
                    >
                      <Eye size={15} color="#4F46E5" />
                    </button>

                    <button
                      onClick={() => handleDuplicateQuestion(q)}
                      style={styles.actionIconBtn}
                      title="Soruyu Klonla (Çoğalt)"
                    >
                      <Copy size={15} color="#059669" />
                    </button>

                    <button
                      onClick={() => openEditModal(q)}
                      style={styles.actionIconBtn}
                      title="Soruyu Düzenle"
                    >
                      <Edit3 size={15} color="#475569" />
                    </button>

                    <button
                      onClick={() => handleDeleteSingle(q.id)}
                      style={{ ...styles.actionIconBtn, color: '#EF4444' }}
                      title="Soruyu Sil"
                    >
                      <Trash2 size={15} color="#EF4444" />
                    </button>
                  </div>
                </div>

                {/* Soru Kökü */}
                <div style={styles.questionTextBody}>{q.questionText}</div>

                {/* Seçenekler (A - E) */}
                <div style={styles.optionsGrid}>
                  {q.options.map((opt) => {
                    const isCorrect = opt.id === q.correctOption;
                    return (
                      <div
                        key={opt.id}
                        style={{
                          ...styles.optionCardItem,
                          backgroundColor: isCorrect ? '#ECFDF5' : '#F8FAFC',
                          borderColor: isCorrect ? '#34D399' : '#E2E8F0',
                          borderWidth: isCorrect ? '1.5px' : '1px',
                        }}
                      >
                        <span
                          style={{
                            ...styles.optionCircleBadge,
                            backgroundColor: isCorrect ? '#10B981' : '#E2E8F0',
                            color: isCorrect ? '#FFFFFF' : '#475569',
                          }}
                        >
                          {opt.id}
                        </span>
                        <span style={{ fontSize: '13px', color: '#1E293B', lineHeight: 1.4 }}>
                          {opt.text}
                        </span>
                        {isCorrect && (
                          <Check size={14} color="#10B981" style={{ marginLeft: 'auto' }} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Çözüm / Açıklama */}
                {q.explanation ? (
                  <div style={styles.explanationBox}>
                    <div style={{ fontWeight: 600, color: '#4F46E5', fontSize: '12px', marginBottom: '2px' }}>
                      💡 Soru Çözümü & Açıklaması:
                    </div>
                    <div style={{ fontSize: '12px', color: '#334155', lineHeight: 1.5 }}>
                      {q.explanation}
                    </div>
                  </div>
                ) : (
                  <div style={styles.noExplanationNotice}>
                    <AlertTriangle size={13} color="#D97706" style={{ marginRight: '6px' }} />
                    <span>Bu soru için henüz bir çözüm açıklaması girilmemiş.</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 6. SAYFALAMA KONTROLLERİ */}
      {totalPages > 1 && (
        <div style={styles.paginationRow}>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{ ...styles.btnSecondary, opacity: currentPage === 1 ? 0.5 : 1 }}
          >
            ← Önceki Sayfa
          </button>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
            Sayfa {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{ ...styles.btnSecondary, opacity: currentPage === totalPages ? 0.5 : 1 }}
          >
            Sonraki Sayfa →
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: GELİŞMİŞ SORU EDİTÖRÜ (EKLE / DÜZENLE) */}
      {/* ============================================================== */}
      {showEditorModal && (
        <div style={styles.modalBackdrop}>
          <div style={styles.editorModalCard}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={styles.modalHeaderIcon}>
                  <Edit3 size={18} color="#4F46E5" />
                </div>
                <div>
                  <h3 style={styles.modalTitle}>
                    {editingQuestion ? 'Soruyu Düzenle' : 'Yeni Soru Oluştur'}
                  </h3>
                  <div style={styles.modalSub}>
                    {editingQuestion ? 'Sorunun ait olduğu müfredat hiyerarşisini ve soru bankasını değiştirebilirsiniz' : 'Yeni sorunun kaydedileceği ders, ünite ve alt konu soru bankasını belirleyin'}
                  </div>
                </div>
              </div>

              {/* Önizleme Sekmesi */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setEditorPreviewActive(!editorPreviewActive)}
                  style={{
                    ...styles.pillBtn,
                    backgroundColor: editorPreviewActive ? '#4F46E5' : '#F1F5F9',
                    color: editorPreviewActive ? '#FFFFFF' : '#475569',
                  }}
                >
                  <Eye size={14} style={{ marginRight: '6px' }} />
                  {editorPreviewActive ? 'Forma Dön' : 'Canlı Önizleme'}
                </button>
                <button onClick={() => setShowEditorModal(false)} style={styles.modalCloseBtn}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {editorPreviewActive ? (
              /* Canlı Önizleme Ekranı */
              <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, marginBottom: '8px' }}>
                  ÖĞRENCİ SİMÜLASYONU
                </div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', marginBottom: '16px', lineHeight: 1.5 }}>
                  {formText || 'Soru metni henüz yazılmadı...'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { id: 'A', text: formA },
                    { id: 'B', text: formB },
                    { id: 'C', text: formC },
                    { id: 'D', text: formD },
                    { id: 'E', text: formE },
                  ].map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        backgroundColor: item.id === formCorrect ? '#ECFDF5' : '#FFFFFF',
                        borderColor: item.id === formCorrect ? '#10B981' : '#CBD5E1',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <b>{item.id})</b> {item.text || '(Boş şık)'}
                      {item.id === formCorrect && (
                        <span style={{ marginLeft: 'auto', color: '#10B981', fontWeight: 700, fontSize: '11px' }}>
                          DOĞRU CEVAP
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                {formExplanation && (
                  <div style={{ marginTop: '16px', padding: '10px', backgroundColor: '#EEF2FF', borderRadius: '8px', fontSize: '12px', color: '#334155' }}>
                    <b>Çözüm:</b> {formExplanation}
                  </div>
                )}
              </div>
            ) : (
              /* Soru Formu */
              <form onSubmit={handleSaveQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Hiyerarşi Seçimi (Ders ➔ Ünite ➔ Konu / Soru Bankası) */}
                <div style={{
                  padding: '14px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <SlidersHorizontal size={14} color="#4F46E5" />
                      HEDEF SORU BANKASI VE HİYERARŞİ (ZORUNLU)
                    </span>
                    {modalBankId && modalBanksList.find(b => b.id === modalBankId) && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '6px',
                        backgroundColor: ((modalBanksList.find(b => b.id === modalBankId)?.questionCount || 0) >= 20) ? '#DCFCE7' : '#FEE2E2',
                        color: ((modalBanksList.find(b => b.id === modalBankId)?.questionCount || 0) >= 20) ? '#166534' : '#991B1B',
                      }}>
                        {((modalBanksList.find(b => b.id === modalBankId)?.questionCount || 0) >= 20)
                          ? `Banka Yayında (${modalBanksList.find(b => b.id === modalBankId)?.questionCount || 0} Soru)`
                          : `Banka Hazırlıkta (${modalBanksList.find(b => b.id === modalBankId)?.questionCount || 0}/20 Soru)`}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                    {/* 1. Ders */}
                    <div style={{ minWidth: 0 }}>
                      <label style={styles.fieldLabel}>1. Ders:</label>
                      <select
                        value={modalSubjectId}
                        onChange={(e) => handleModalSubjectChange(e.target.value)}
                        style={{ ...styles.dropdown, width: '100%', maxWidth: '100%' }}
                      >
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Ünite */}
                    <div style={{ minWidth: 0 }}>
                      <label style={styles.fieldLabel}>2. Ünite:</label>
                      <select
                        value={modalUnitId}
                        onChange={(e) => handleModalUnitChange(e.target.value)}
                        style={{ ...styles.dropdown, width: '100%', maxWidth: '100%' }}
                        disabled={modalUnitsList.length === 0}
                      >
                        {modalUnitsList.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.unitNumber}. {u.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 3. Alt Konu / Kazanım */}
                    <div style={{ minWidth: 0 }}>
                      <label style={styles.fieldLabel}>3. Alt Konu / Kazanım:</label>
                      <select
                        value={modalTopicId}
                        onChange={(e) => handleModalTopicChange(e.target.value)}
                        style={{
                          ...styles.dropdown,
                          width: '100%',
                          maxWidth: '100%',
                          borderColor: !modalTopicId ? '#EF4444' : '#CBD5E1',
                          backgroundColor: !modalTopicId ? '#FEF2F2' : '#FFFFFF',
                        }}
                        disabled={modalTopicsList.length === 0}
                      >
                        {modalTopicsList.length === 0 ? (
                          <option value="">(Bu ünitede konu yok)</option>
                        ) : (
                          modalTopicsList.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.topicNumber}. {t.title}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* 4. Soru Bankası */}
                    <div style={{ minWidth: 0 }}>
                      <label style={styles.fieldLabel}>4. Soru Bankası:</label>
                      <select
                        value={modalBankId}
                        onChange={(e) => setModalBankId(e.target.value)}
                        style={{
                          ...styles.dropdown,
                          width: '100%',
                          maxWidth: '100%',
                          borderColor: !modalBankId ? '#EF4444' : '#CBD5E1',
                          backgroundColor: !modalBankId ? '#FEF2F2' : '#FFFFFF',
                          fontWeight: 600,
                        }}
                        disabled={modalBanksList.length === 0}
                      >
                        {modalBanksList.length === 0 ? (
                          <option value="">(Bu konuda soru bankası yok)</option>
                        ) : (
                          modalBanksList.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.title} ({(b.questionCount || 0) >= 20 ? '🟢 Yayında' : '🔴 Hazırlıkta'})
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>

                  {modalTopicsList.length === 0 && (
                    <div style={{ padding: '8px 12px', backgroundColor: '#FEF2F2', borderRadius: '6px', color: '#991B1B', fontSize: '12px' }}>
                      ⚠️ Bu ünitede henüz bir konu bulunmuyor! Her soru bankası mutlaka bir konuya bağlı olmalıdır. Lütfen önce Müfredat sekmesinden bir alt konu ekleyin.
                    </div>
                  )}

                  {modalTopicsList.length > 0 && modalBanksList.length === 0 && (
                    <div style={{ padding: '8px 12px', backgroundColor: '#FEF2F2', borderRadius: '6px', color: '#991B1B', fontSize: '12px' }}>
                      ⚠️ Bu konuya ait bir soru bankası bulunamadı! Lütfen önce bu konuya ait bir soru bankası oluşturun.
                    </div>
                  )}
                </div>

                {/* Meta Bilgiler (Zorluk, Çıkmış Soru Yılı) */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <label style={styles.fieldLabel}>Zorluk Seviyesi:</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {(['Kolay', 'Orta', 'Zor'] as const).map((diff) => (
                        <button
                          key={diff}
                          type="button"
                          onClick={() => setFormDifficulty(diff)}
                          style={{
                            ...styles.pillBtn,
                            backgroundColor: formDifficulty === diff ? '#0F172A' : '#F1F5F9',
                            color: formDifficulty === diff ? '#FFFFFF' : '#475569',
                          }}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: '160px' }}>
                    <label style={styles.fieldLabel}>Sınav Yılı / Etiket (Opsiyonel):</label>
                    <input
                      type="text"
                      placeholder="Örn: 2024 KPSS, ÖSYM Benzeri..."
                      value={formYear}
                      onChange={(e) => setFormYear(e.target.value)}
                      style={styles.textInput}
                    />
                  </div>
                </div>

                {/* Soru Kökü */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <label style={styles.fieldLabel}>Soru Metni:</label>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>{formText.length} karakter</span>
                  </div>
                  <textarea
                    rows={4}
                    placeholder="Soru metnini net, açık ve anlaşılır biçimde yazınız..."
                    value={formText}
                    onChange={(e) => setFormText(e.target.value)}
                    style={{ ...styles.textInput, resize: 'vertical' }}
                    required
                  />
                </div>

                {/* 5 Seçenek Girişi (A, B, C, D, E) */}
                <div>
                  <label style={styles.fieldLabel}>
                    Seçenekler (Doğru seçeneği belirlemek için harfe tıklayın):
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(['A', 'B', 'C', 'D', 'E'] as OptionId[]).map((opt) => {
                      const val =
                        opt === 'A'
                          ? formA
                          : opt === 'B'
                          ? formB
                          : opt === 'C'
                          ? formC
                          : opt === 'D'
                          ? formD
                          : formE;
                      const setter =
                        opt === 'A'
                          ? setFormA
                          : opt === 'B'
                          ? setFormB
                          : opt === 'C'
                          ? setFormC
                          : opt === 'D'
                          ? setFormD
                          : setFormE;
                      const isCorrect = formCorrect === opt;

                      return (
                        <div key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => setFormCorrect(opt)}
                            style={{
                              ...styles.optionSelectorBtn,
                              backgroundColor: isCorrect ? '#10B981' : '#F1F5F9',
                              borderColor: isCorrect ? '#059669' : '#CBD5E1',
                              color: isCorrect ? '#FFFFFF' : '#334155',
                            }}
                            title={`Doğru cevap olarak ${opt} seç`}
                          >
                            {opt} {isCorrect && '✓'}
                          </button>
                          <input
                            type="text"
                            placeholder={`${opt} Seçeneği...`}
                            value={val}
                            onChange={(e) => setter(e.target.value)}
                            style={{
                              ...styles.textInput,
                              borderColor: isCorrect ? '#6EE7B7' : '#CBD5E1',
                              backgroundColor: isCorrect ? '#F0FDF4' : '#FFFFFF',
                            }}
                            required
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Çözüm ve Açıklama Metni */}
                <div>
                  <label style={styles.fieldLabel}>
                    Detaylı Çözüm & Açıklama (Öğrencinin öğrenmesi için önerilir):
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Bu sorunun doğru cevabının neden bu şık olduğunu, konunun püf noktasını açıklayınız..."
                    value={formExplanation}
                    onChange={(e) => setFormExplanation(e.target.value)}
                    style={{ ...styles.textInput, resize: 'vertical' }}
                  />
                </div>

                {/* Butonlar */}
                <div style={styles.modalActionsRow}>
                  <button
                    type="button"
                    onClick={() => setShowEditorModal(false)}
                    style={styles.btnSecondary}
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    disabled={!modalTopicId}
                    style={{
                      ...styles.btnPrimary,
                      opacity: !modalTopicId ? 0.5 : 1,
                      cursor: !modalTopicId ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {editingQuestion ? 'Güncellemeleri Kaydet' : 'Soruyu Sisteme Ekle'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: ÖĞRENCİ ARAYÜZÜ CANLI ÖNİZLEME MODALI */}
      {/* ============================================================== */}
      {previewQuestion && (
        <div style={styles.modalBackdrop}>
          <div style={{ ...styles.editorModalCard, maxWidth: '580px' }}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={18} color="#4F46E5" />
                <h3 style={styles.modalTitle}>Öğrenci Test Ekranı Simülasyonu</h3>
              </div>
              <button onClick={() => setPreviewQuestion(null)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '16px', backgroundColor: '#FFFFFF', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#4F46E5', backgroundColor: '#EEF2FF', padding: '4px 10px', borderRadius: '8px' }}>
                  Soru {previewQuestion.questionNumber}
                </span>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  {previewQuestion.difficulty || 'Orta'} Düzey
                </span>
              </div>

              {/* Soru Kökü */}
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', lineHeight: 1.6, marginBottom: '20px' }}>
                {previewQuestion.questionText}
              </div>

              {/* İnteraktif Şıklar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {previewQuestion.options.map((opt) => {
                  const isSelected = studentSimulatedAnswer === opt.id;
                  const isCorrectAnswer = opt.id === previewQuestion.correctOption;
                  const hasAnswered = studentSimulatedAnswer !== null;

                  let bgColor = '#FFFFFF';
                  let borderColor = '#E2E8F0';
                  let textColor = '#1E293B';

                  if (hasAnswered) {
                    if (isCorrectAnswer) {
                      bgColor = '#ECFDF5';
                      borderColor = '#10B981';
                      textColor = '#065F46';
                    } else if (isSelected && !isCorrectAnswer) {
                      bgColor = '#FEF2F2';
                      borderColor = '#EF4444';
                      textColor = '#991B1B';
                    }
                  }

                  return (
                    <div
                      key={opt.id}
                      onClick={() => setStudentSimulatedAnswer(opt.id)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        borderWidth: '1.5px',
                        borderStyle: 'solid',
                        borderColor,
                        backgroundColor: bgColor,
                        color: textColor,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '12px',
                          backgroundColor: isSelected ? '#4F46E5' : '#F1F5F9',
                          color: isSelected ? '#FFFFFF' : '#475569',
                        }}
                      >
                        {opt.id}
                      </span>
                      <span style={{ fontSize: '14px', flex: 1 }}>{opt.text}</span>
                      {hasAnswered && isCorrectAnswer && <Check size={16} color="#10B981" />}
                    </div>
                  );
                })}
              </div>

              {/* Çözüm Kartı (Cevaplandıktan Sonra Açılır) */}
              {studentSimulatedAnswer && (
                <div style={{ marginTop: '20px', padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#4F46E5', marginBottom: '4px' }}>
                    {studentSimulatedAnswer === previewQuestion.correctOption
                      ? '🎉 Tebrikler, Doğru Cevap!'
                      : '❌ Yanlış Cevap!'}
                  </div>
                  <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
                    {previewQuestion.explanation || 'Bu soru için açıklama girilmemiştir.'}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button onClick={() => setPreviewQuestion(null)} style={styles.btnSecondary}>
                Simülasyonu Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: AKILLI METİN / WORD AYRIŞTIRICI (SMART PARSER) */}
      {/* ============================================================== */}
      {showSmartParserModal && (
        <div style={styles.modalBackdrop}>
          <div style={{ ...styles.editorModalCard, maxWidth: '620px' }}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="#8B5CF6" />
                <h3 style={styles.modalTitle}>Metinden Otomatik Soru Ayrıştırıcı</h3>
              </div>
              <button onClick={() => setShowSmartParserModal(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 12px' }}>
              Word, PDF veya notlarınızdan kopyaladığınız soru metnini aşağıya yapıştırın. Sistemimiz
              soru kökünü, 5 şıkkı, doğru cevabı ve çözümü otomatik olarak tanıyacaktır.
            </p>

            <textarea
              rows={8}
              placeholder={sampleParserText}
              value={parserRawText}
              onChange={(e) => setParserRawText(e.target.value)}
              style={{ ...styles.textInput, fontFamily: 'monospace', fontSize: '12px' }}
            />

            {parserError && (
              <div style={styles.errorNoticeBox}>
                <AlertCircle size={15} color="#DC2626" style={{ marginRight: '6px' }} />
                <span>{parserError}</span>
              </div>
            )}

            <div style={styles.modalActionsRow}>
              <button
                type="button"
                onClick={() => setParserRawText(sampleParserText)}
                style={styles.btnGhost}
              >
                Örnek Metin Yapıştır
              </button>
              <button onClick={handleParseSmartText} style={styles.btnSparkle}>
                <Sparkles size={16} style={{ marginRight: '6px' }} />
                Ayrıştır ve Editöre Aktar →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: TOPLU TAŞIMA / KOPYALAMA MODALI */}
      {/* ============================================================== */}
      {showMoveCopyModal && (
        <div style={styles.modalBackdrop}>
          <div style={{ ...styles.editorModalCard, maxWidth: '480px' }}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {moveActionType === 'MOVE' ? 'Soruları Taşı' : 'Soruları Kopyala'}
              </h3>
              <button onClick={() => setShowMoveCopyModal(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#64748B' }}>
              Seçili <b>{selectedQuestionIds.length}</b> adet sorunun aktarılacağı hedef ünite veya konuyu seçiniz.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '16px 0' }}>
              <div>
                <label style={styles.fieldLabel}>Hedef Ünite:</label>
                <select
                  value={targetMoveUnitId}
                  onChange={(e) => handleTargetMoveUnitChange(e.target.value)}
                  style={styles.dropdown}
                >
                  <option value="">-- Ünite Seçiniz --</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.unitNumber}. {u.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.fieldLabel}>Hedef Alt Konu (Kazanım):</label>
                <select
                  value={targetMoveTopicId}
                  onChange={(e) => handleTargetMoveTopicChange(e.target.value)}
                  style={styles.dropdown}
                  disabled={targetMoveTopicsList.length === 0}
                >
                  <option value="">-- Konu Seçiniz --</option>
                  {targetMoveTopicsList.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.topicNumber}. {t.title}
                    </option>
                  ))}
                </select>
              </div>

              {targetMoveTopicId && (
                <div>
                  <label style={styles.fieldLabel}>Hedef Soru Bankası (Opsiyonel):</label>
                  <select
                    value={targetMoveBankId}
                    onChange={(e) => setTargetMoveBankId(e.target.value)}
                    style={styles.dropdown}
                  >
                    <option value="">-- Soru Bankası Seçiniz --</option>
                    {targetMoveBanksList.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title} ({b.questionCount || 0} Soru)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div style={styles.modalActionsRow}>
              <button onClick={() => setShowMoveCopyModal(false)} style={styles.btnSecondary}>
                Vazgeç
              </button>
              <button onClick={handleExecuteMoveCopy} style={styles.btnPrimary}>
                {moveActionType === 'MOVE' ? 'Taşı ve Tamamla' : 'Kopyala ve Tamamla'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: YENİ SORU BANKASI OLUŞTURMA MODALI */}
      {/* ============================================================== */}
      {showNewBankModal && (
        <div style={styles.modalBackdrop}>
          <div style={{ ...styles.editorModalCard, maxWidth: '480px' }}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={20} color="#4F46E5" />
                <h3 style={styles.modalTitle}>Yeni Soru Bankası Oluştur</h3>
              </div>
              <button onClick={() => setShowNewBankModal(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBank} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
              <div style={{ fontSize: '13px', color: '#64748B' }}>
                Konu: <b>{topics.find((t) => t.id === selectedTopicId)?.title || 'Seçili Konu'}</b>
              </div>

              <div>
                <label style={styles.fieldLabel}>Soru Bankası Başlığı / Adı:</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Konu Testi 1, Çıkmış Sorular Bankası..."
                  value={bankTitleInput}
                  onChange={(e) => setBankTitleInput(e.target.value)}
                  style={styles.textInput}
                  autoFocus
                />
              </div>

              <div>
                <label style={styles.fieldLabel}>Banka Türü:</label>
                <select
                  value={bankTypeInput}
                  onChange={(e) => setBankTypeInput(e.target.value)}
                  style={styles.dropdown}
                >
                  <option value="Standart Konu Testi">Standart Konu Testi (20 Soru)</option>
                  <option value="Pekiştirme Testi">Pekiştirme Testi</option>
                  <option value="ÖSYM Çıkmış Sorular">ÖSYM Çıkmış Sorular</option>
                  <option value="Hızlı Tarama Testi">Hızlı Tarama Testi</option>
                </select>
              </div>

              <div style={{ padding: '10px 12px', backgroundColor: '#F8FAFC', borderRadius: '8px', fontSize: '12px', color: '#475569' }}>
                💡 <b>Kural:</b> Oluşturulan soru bankası öğrencilere yayına açılabilmek için en az <b>20 soru</b> barajına ulaşmalıdır.
              </div>

              <div style={styles.modalActionsRow}>
                <button type="button" onClick={() => setShowNewBankModal(false)} style={styles.btnSecondary}>
                  Vazgeç
                </button>
                <button type="submit" style={styles.btnPrimary}>
                  <Plus size={16} style={{ marginRight: '6px' }} />
                  Oluştur
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
  metricsBar: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  metricPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    fontSize: '13px',
    color: '#334155',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
  },
  optionMiniDist: {
    display: 'flex',
    gap: '6px',
    fontSize: '11px',
    fontWeight: 700,
    color: '#059669',
  },
  panelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    border: '1px solid #E2E8F0',
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  selectorsRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  selectGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  fieldLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#475569',
  },
  dropdown: {
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    fontSize: '13px',
    color: '#0F172A',
    outline: 'none',
  },
  textInput: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  clearSearchBtn: {
    position: 'absolute',
    right: '8px',
    top: '8px',
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer',
    fontSize: '12px',
  },
  secondaryFiltersRow: {
    display: 'flex',
    gap: '14px',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingTop: '10px',
    borderTop: '1px solid #F1F5F9',
  },
  filterTagLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748B',
  },
  pillBtn: {
    padding: '4px 10px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  miniSelect: {
    padding: '4px 8px',
    borderRadius: '6px',
    border: '1px solid #CBD5E1',
    fontSize: '12px',
    backgroundColor: '#FFFFFF',
    color: '#334155',
  },
  toolbarActionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
    paddingTop: '10px',
    borderTop: '1px solid #F1F5F9',
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
  btnSparkle: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 16px',
    borderRadius: '8px',
    backgroundColor: '#8B5CF6',
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
  btnDanger: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 14px',
    borderRadius: '8px',
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    border: '1px solid #FECACA',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnGhost: {
    background: 'none',
    border: 'none',
    color: '#64748B',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
  },
  bulkActionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    backgroundColor: '#EEF2FF',
    borderRadius: '10px',
    border: '1px solid #C7D2FE',
    flexWrap: 'wrap',
    gap: '10px',
  },
  bulkCountBadge: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#3730A3',
  },
  listHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 2px',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    border: '1px solid #E2E8F0',
    padding: '40px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  questionItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    borderWidth: '1px',
    borderStyle: 'solid',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    transition: 'border-color 0.15s ease',
  },
  cardTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
  },
  badgeNum: {
    backgroundColor: '#EEF2FF',
    color: '#4F46E5',
    fontWeight: 700,
    fontSize: '12px',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  badgeCorrect: {
    backgroundColor: '#ECFDF5',
    color: '#059669',
    fontWeight: 700,
    fontSize: '12px',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  badgeDifficulty: {
    fontSize: '11px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '6px',
  },
  badgeTag: {
    fontSize: '11px',
    color: '#475569',
    backgroundColor: '#F1F5F9',
    padding: '2px 8px',
    borderRadius: '6px',
  },
  actionIconBtn: {
    background: 'none',
    border: 'none',
    padding: '6px',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionTextBody: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#0F172A',
    lineHeight: 1.6,
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '8px',
  },
  optionCardItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    borderRadius: '8px',
    borderStyle: 'solid',
  },
  optionCircleBadge: {
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
  },
  noExplanationNotice: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: '6px',
    backgroundColor: '#FFFBEB',
    color: '#B45309',
    fontSize: '12px',
  },
  paginationRow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    marginTop: '12px',
  },
  // Modallar
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
  editorModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '840px',
    width: '100%',
    boxSizing: 'border-box',
    maxHeight: '92vh',
    overflowY: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #E2E8F0',
  },
  modalHeaderIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: '#EEF2FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: '17px',
    fontWeight: 700,
    color: '#0F172A',
    margin: 0,
  },
  modalSub: {
    fontSize: '12px',
    color: '#64748B',
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    padding: '4px',
    cursor: 'pointer',
    color: '#64748B',
  },
  optionSelectorBtn: {
    padding: '6px 12px',
    borderRadius: '6px',
    borderWidth: '1px',
    borderStyle: 'solid',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    flexShrink: 0,
  },
  modalActionsRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '16px',
    paddingTop: '12px',
    borderTop: '1px solid #F1F5F9',
  },
  errorNoticeBox: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: '6px',
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    fontSize: '12px',
    marginTop: '10px',
  },
};
