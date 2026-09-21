import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { Subject, Unit, Topic } from '../types';
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

  // Seçili Hiyerarşi
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');

  // Görünüm Modu: 3 Kolonlu veya Ağaç (Tree) Görünümü
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

      if (subs.length > 0) {
        setSelectedSubjectId(subs[0].id);
        const subUnits = allUnits.filter((u) => u.subjectId === subs[0].id);
        if (subUnits.length > 0) {
          setSelectedUnitId(subUnits[0].id);
          const unitTopics = allTopics.filter((t) => t.unitId === subUnits[0].id);
          if (unitTopics.length > 0) {
            setSelectedTopicId(unitTopics[0].id);
          }
        }
      }
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

  // ----------------------------------------------------
  // DEĞİŞİKLİK SAYACI TETİKLEYİCİSİ
  // ----------------------------------------------------
  const markAsDraft = () => {
    setDraftChangesCount((prev) => prev + 1);
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
    if (!confirm(`"${title}" dersini ve altındaki tüm ünite/konuları taslaktan silmek istediğinize emin misiniz?`)) {
      return;
    }
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    setUnits((prev) => prev.filter((u) => u.subjectId !== id));
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
    if (!confirm(`"${title}" ünitesini taslaktan silmek istediğinize emin misiniz?`)) return;
    setUnits((prev) => prev.filter((u) => u.id !== id));
    setTopics((prev) => prev.filter((t) => t.unitId !== id));
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
    if (!confirm(`"${title}" alt konusunu taslaktan silmek istediğinize emin misiniz?`)) return;
    setTopics((prev) => prev.filter((t) => t.id !== id));
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
            3 Kolonlu Hiyerarşi Modu
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
      {/* 3. GÖRÜNÜM 1: 3 KOLONLU HİYERARŞİ DÜZENLEYİCİ */}
      {/* ============================================================== */}
      {viewMode === 'columns' && (
        <div style={styles.columnsContainer}>
          {/* 1. KOLON: DERSLER */}
          <div style={styles.columnCard}>
            <div style={styles.columnHeader}>
              <div>
                <h3 style={styles.columnTitle}>1. Dersler ({subjects.length})</h3>
                <p style={styles.columnSub}>Ana KPSS alanları</p>
              </div>
              <button onClick={openNewSubjectModal} style={styles.colAddBtn} title="Yeni Ders Ekle">
                <Plus size={16} />
              </button>
            </div>

            <div style={styles.itemsList}>
              {subjects.map((sub, idx) => {
                const isSelected = sub.id === selectedSubjectId;
                const subUnitCount = units.filter((u) => u.subjectId === sub.id).length;

                return (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedSubjectId(sub.id)}
                    style={{
                      ...styles.itemBox,
                      borderColor: isSelected ? '#4F46E5' : '#E2E8F0',
                      backgroundColor: isSelected ? '#EEF2FF' : '#FFFFFF',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: isSelected ? 700 : 600, color: '#0F172A' }}>
                        {sub.title}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                        {subUnitCount} Ünite
                      </div>
                    </div>

                    {/* Sıralama & Düzenleme Butonları */}
                    <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveSubject(idx, 'UP');
                        }}
                        disabled={idx === 0}
                        style={{ ...styles.microBtn, opacity: idx === 0 ? 0.3 : 1 }}
                        title="Yukarı Taşı"
                      >
                        <ArrowUp size={13} />
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
                        <ArrowDown size={13} />
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
              })}
            </div>
          </div>

          {/* 2. KOLON: ÜNİTELER */}
          <div style={styles.columnCard}>
            <div style={styles.columnHeader}>
              <div>
                <h3 style={styles.columnTitle}>2. Üniteler ({currentUnits.length})</h3>
                <p style={styles.columnSub}>
                  {subjects.find((s) => s.id === selectedSubjectId)?.title || 'Ders Seçiniz'}
                </p>
              </div>
              <button
                onClick={openNewUnitModal}
                disabled={!selectedSubjectId}
                style={{ ...styles.colAddBtn, opacity: selectedSubjectId ? 1 : 0.5 }}
                title="Yeni Ünite Ekle"
              >
                <Plus size={16} />
              </button>
            </div>

            <div style={styles.itemsList}>
              {currentUnits.length === 0 ? (
                <div style={styles.emptyNotice}>Bu derse ait ünite bulunamadı.</div>
              ) : (
                currentUnits.map((unit, idx) => {
                  const isSelected = unit.id === selectedUnitId;
                  const unitTopicCount = topics.filter((t) => t.unitId === unit.id).length;

                  return (
                    <div
                      key={unit.id}
                      onClick={() => setSelectedUnitId(unit.id)}
                      style={{
                        ...styles.itemBox,
                        borderColor: isSelected ? '#4F46E5' : '#E2E8F0',
                        backgroundColor: isSelected ? '#EEF2FF' : '#FFFFFF',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: isSelected ? 700 : 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={styles.orderPill}>{unit.unitNumber || idx + 1}</span>
                          <span>{unit.title}</span>
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
                      <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveUnit(idx, 'UP');
                          }}
                          disabled={idx === 0}
                          style={{ ...styles.microBtn, opacity: idx === 0 ? 0.3 : 1 }}
                          title="Yukarı Taşı"
                        >
                          <ArrowUp size={13} />
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
                          <ArrowDown size={13} />
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
          </div>

          {/* 3. KOLON: ALT KONULAR & KAZANIMLAR */}
          <div style={styles.columnCard}>
            <div style={styles.columnHeader}>
              <div>
                <h3 style={styles.columnTitle}>3. Alt Konular / Kazanımlar ({currentTopics.length})</h3>
                <p style={styles.columnSub}>
                  {units.find((u) => u.id === selectedUnitId)?.title || 'Ünite Seçiniz'}
                </p>
              </div>
              <button
                onClick={openNewTopicModal}
                disabled={!selectedUnitId}
                style={{ ...styles.colAddBtn, opacity: selectedUnitId ? 1 : 0.5 }}
                title="Yeni Alt Konu Ekle"
              >
                <Plus size={16} />
              </button>
            </div>

            <div style={styles.itemsList}>
              {currentTopics.length === 0 ? (
                <div style={styles.emptyNotice}>Bu üniteye ait alt konu (kazanım) bulunamadı.</div>
              ) : (
                currentTopics.map((topic, idx) => {
                  const isSelected = topic.id === selectedTopicId;

                  return (
                    <div
                      key={topic.id}
                      onClick={() => setSelectedTopicId(topic.id)}
                      style={{
                        ...styles.itemBox,
                        borderColor: isSelected ? '#4F46E5' : '#E2E8F0',
                        backgroundColor: isSelected ? '#EEF2FF' : '#FFFFFF',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: isSelected ? 700 : 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={styles.orderPill}>{topic.topicNumber || idx + 1}</span>
                          <span>{topic.title}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '3px' }}>
                          🎯 {topic.questionCount || 20} Soru Hedefi
                        </div>
                      </div>

                      {/* Sıralama & Düzenleme Butonları */}
                      <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveTopic(idx, 'UP');
                          }}
                          disabled={idx === 0}
                          style={{ ...styles.microBtn, opacity: idx === 0 ? 0.3 : 1 }}
                          title="Yukarı Taşı"
                        >
                          <ArrowUp size={13} />
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
                          <ArrowDown size={13} />
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
                                  <div key={t.id} style={styles.treeTopicItem}>
                                    <span style={styles.orderPill}>{t.topicNumber}</span>
                                    <span style={{ fontSize: '13px', color: '#334155', flex: 1 }}>{t.title}</span>
                                    <span style={{ fontSize: '11px', color: '#64748B' }}>
                                      {t.questionCount || 20} Soru
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
