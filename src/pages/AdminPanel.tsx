import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { isSupabaseConfigured, hasAdminSecretKey, setAdminSecretKey } from '../services/supabase';
import { Subject, Unit, Topic, Question, OptionId } from '../types';
import { SAMPLE_20_QUESTIONS } from '../data/samplePackage';

export const AdminPanel: React.FC<{ onNavigateStudent: () => void }> = ({ onNavigateStudent }) => {
  // Yetki Durumu (Sadece Yetkililerin Eri┼şimi)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('kpss_admin_auth') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Veri Durumlar─▒
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeTab, setActiveTab] = useState<'packages' | 'subjects_units' | 'error_pool'>('packages');

  // Form Durumlar─▒
  const [newSubjectTitle, setNewSubjectTitle] = useState('');
  const [newUnitTitle, setNewUnitTitle] = useState('');
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [packageMessage, setPackageMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errorPoolStats, setErrorPoolStats] = useState<any>(null);

  // Tekil Soru Formu
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [formText, setFormText] = useState('');
  const [formA, setFormA] = useState('');
  const [formB, setFormB] = useState('');
  const [formC, setFormC] = useState('');
  const [formD, setFormD] = useState('');
  const [formE, setFormE] = useState('');
  const [formCorrect, setFormCorrect] = useState<OptionId>('A');
  const [formExplanation, setFormExplanation] = useState('');

  const isCloud = isSupabaseConfigured();
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [secretInput, setSecretInput] = useState('');
  const [isSecretActive, setIsSecretActive] = useState(() => hasAdminSecretKey());

  useEffect(() => {
    if (isAuthenticated) {
      loadSubjects();
      loadErrorStats();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedSubjectId) {
      loadUnits(selectedSubjectId);
    }
  }, [selectedSubjectId]);

  useEffect(() => {
    if (selectedUnitId) {
      loadTopics(selectedUnitId);
    }
  }, [selectedUnitId]);

  useEffect(() => {
    if (selectedTopicId) {
      loadQuestions(selectedTopicId);
    } else if (selectedUnitId) {
      loadQuestions(selectedUnitId);
    }
  }, [selectedTopicId]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // G├╝venlik kap─▒s─▒: Varsay─▒lan admin yetki ┼şifresi
    if (passwordInput === 'admin2026' || passwordInput === 'kpss') {
      setIsAuthenticated(true);
      sessionStorage.setItem('kpss_admin_auth', 'true');
      setAuthError('');
    } else {
      setAuthError('Hatal─▒ yetkili ┼şifresi! (Varsay─▒lan: admin2026 veya kpss)');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('kpss_admin_auth');
  };

  const loadSubjects = async () => {
    const list = await api.getSubjects();
    setSubjects(list);
    if (list.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(list[0].id);
    }
  };

  const loadUnits = async (subId: string) => {
    const list = await api.getUnits(subId);
    setUnits(list);
    if (list.length > 0) {
      setSelectedUnitId(list[0].id);
      loadTopics(list[0].id);
    } else {
      setSelectedUnitId('');
      setTopics([]);
      setSelectedTopicId('');
      setQuestions([]);
    }
  };

  const loadTopics = async (uId: string) => {
    const list = await api.getTopics(uId);
    setTopics(list);
    if (list.length > 0) {
      setSelectedTopicId(list[0].id);
      loadQuestions(list[0].id);
    } else {
      setSelectedTopicId('');
      loadQuestions(uId);
    }
  };

  const loadQuestions = async (uId: string) => {
    const list = await api.getQuestions(uId);
    setQuestions(list);
  };

  const loadErrorStats = async () => {
    const data = await api.adminGetErrorPoolStats();
    setErrorPoolStats(data);
  };

  // 20 Soruluk ├ûrnek Paketi Y├╝kle
  const handleUploadSample20Package = async () => {
    const targetId = selectedTopicId || selectedUnitId;
    if (!targetId) {
      alert('L├╝tfen ├Ânce bir ├╝nite veya konu se├ğiniz.');
      return;
    }

    setPackageMessage(null);
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
      setPackageMessage({
        type: 'success',
        text: `Tebrikler! ${res.count} soruluk soru paketi ba┼şar─▒yla y├╝klendi.`,
      });
      loadQuestions(targetId);
    } else {
      setPackageMessage({
        type: 'error',
        text: `Hata: ${res.error || 'Paket y├╝klenemedi.'}`,
      });
    }
  };

  const handleDeleteAllUnitQuestions = async () => {
    if (!confirm('Bu alandaki t├╝m sorular silinecektir. Emin misiniz?')) return;
    for (const q of questions) {
      await api.adminDeleteQuestion(q.id);
    }
    const targetId = selectedTopicId || selectedUnitId;
    loadQuestions(targetId);
  };

  const handleDeleteSingleQuestion = async (qId: string) => {
    await api.adminDeleteQuestion(qId);
    const targetId = selectedTopicId || selectedUnitId;
    loadQuestions(targetId);
  };

  const handleAddSingleQuestion = async () => {
    if (!formText.trim()) return;
    const targetId = selectedTopicId || selectedUnitId;
    const newQ: Question = {
      id: `${targetId}-q${questions.length + 1}_${Date.now()}`,
      unitId: selectedUnitId,
      topicId: selectedTopicId || undefined,
      questionNumber: questions.length + 1,
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
    };

    await api.adminCreateQuestion(newQ);
    setShowQuestionModal(false);
    loadQuestions(targetId);
  };

  const handleCreateSubject = async () => {
    try {
      const title = newSubjectTitle.trim();
      if (!title) return;

      console.log('­şÜÇ [AdminPanel] Yeni ders ekleniyor:', { title });
      const res = await api.adminCreateSubject(title);

      setNewSubjectTitle('');
      await loadSubjects();

      if (res.isLocal) {
        setPackageMessage({
          type: 'success',
          text: `"${title}" dersi ba┼şar─▒yla eklendi! (Yerel veritaban─▒na kaydedildi)`,
        });
      } else {
        setPackageMessage({
          type: 'success',
          text: `"${title}" dersi Supabase bulut veritaban─▒na ba┼şar─▒yla eklendi!`,
        });
      }
    } catch (err) {
      console.error('­şÆÑ [AdminPanel] handleCreateSubject i├ğerisinde beklenmeyen hata:', err);
      alert('Ders ekleme i┼şlemi s─▒ras─▒nda beklenmeyen bir hata meydana geldi.');
    }
  };

  const handleDeleteSubject = async (id: string) => {
    try {
      if (!confirm('Bu dersi silmek istedi─şinize emin misiniz?')) return;
      console.log('­şùæ´©Å [AdminPanel] Ders siliniyor:', { id });
      await api.adminDeleteSubject(id);
      await loadSubjects();
    } catch (err) {
      console.error('­şÆÑ [AdminPanel] handleDeleteSubject hatas─▒:', err);
    }
  };

  const handleCreateUnit = async () => {
    try {
      const title = newUnitTitle.trim();
      if (!title || !selectedSubjectId) {
        alert('L├╝tfen ├╝nite ba┼şl─▒─ş─▒ giriniz ve bir dersin se├ğili oldu─şundan emin olunuz.');
        return;
      }

      const unitNumber = units.length + 1;
      console.log('­şÜÇ [AdminPanel] Yeni ├╝nite ekleniyor:', {
        subjectId: selectedSubjectId,
        title,
        unitNumber,
      });

      const res = await api.adminCreateUnit(selectedSubjectId, title, unitNumber);

      setNewUnitTitle('');
      await loadUnits(selectedSubjectId);

      if (res.isLocal) {
        setPackageMessage({
          type: 'success',
          text: `"${title}" ├╝nitesi ba┼şar─▒yla eklendi! (Yerel veritaban─▒na kaydedildi)`,
        });
      } else {
        setPackageMessage({
          type: 'success',
          text: `"${title}" ├╝nitesi Supabase bulut veritaban─▒na ba┼şar─▒yla eklendi!`,
        });
      }
    } catch (err) {
      console.error('­şÆÑ [AdminPanel] handleCreateUnit i├ğerisinde beklenmeyen hata:', err);
      alert('├£nite ekleme i┼şlemi s─▒ras─▒nda beklenmeyen bir hata meydana geldi.');
    }
  };

  const handleDeleteUnit = async (id: string) => {
    try {
      if (!confirm('Bu ├╝niteyi silmek istedi─şinize emin misiniz?')) return;
      console.log('­şùæ´©Å [AdminPanel] ├£nite siliniyor:', { id });
      const res = await api.adminDeleteUnit(id);
      if (!res.success) {
        console.error('ÔØî [AdminPanel] ├£nite silinemedi:', res.error);
        alert(`├£nite silinemedi: ${res.error}`);
        return;
      }
      await loadUnits(selectedSubjectId);
    } catch (err) {
      console.error('­şÆÑ [AdminPanel] handleDeleteUnit hatas─▒:', err);
    }
  };

  const handleCreateTopic = async () => {
    try {
      const title = newTopicTitle.trim();
      if (!title || !selectedUnitId) {
        alert('L├╝tfen konu ba┼şl─▒─ş─▒ giriniz ve bir ├╝nitenin se├ğili oldu─şundan emin olunuz.');
        return;
      }

      const topicNumber = topics.length + 1;
      const res = await api.adminCreateTopic(selectedUnitId, title, topicNumber);

      setNewTopicTitle('');
      await loadTopics(selectedUnitId);

      if (res.isLocal) {
        setPackageMessage({
          type: 'success',
          text: `"${title}" konusu ba┼şar─▒yla eklendi! (Yerel veritaban─▒na kaydedildi)`,
        });
      } else {
        setPackageMessage({
          type: 'success',
          text: `"${title}" konusu Supabase bulut veritaban─▒na ba┼şar─▒yla eklendi!`,
        });
      }
    } catch (err) {
      console.error('­şÆÑ [AdminPanel] handleCreateTopic hatas─▒:', err);
      alert('Konu ekleme s─▒ras─▒nda bir hata meydana geldi.');
    }
  };

  const handleDeleteTopic = async (id: string) => {
    try {
      if (!confirm('Bu konuyu silmek istedi─şinize emin misiniz?')) return;
      const res = await api.adminDeleteTopic(id);
      if (!res.success) {
        alert(`Konu silinemedi: ${res.error}`);
        return;
      }
      await loadTopics(selectedUnitId);
    } catch (err) {
      console.error('­şÆÑ [AdminPanel] handleDeleteTopic hatas─▒:', err);
    }
  };

  // YETK─░ G─░R─░┼Ş EKRANI
  if (!isAuthenticated) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <div style={styles.loginBadge}>­şöÆ YETK─░L─░ G─░R─░┼Ş─░</div>
          <h2 style={{ fontSize: '20px', margin: '12px 0 6px', color: '#111827' }}>KPSS Y├Ânetici Paneli</h2>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 20px' }}>
            Bu alana sadece yetkili e─şitim ve i├ğerik y├Âneticileri eri┼şebilir.
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="password"
              placeholder="Yetkili Giri┼ş ┼Şifresi"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              style={styles.loginInput}
              autoFocus
            />

            {authError && <div style={styles.loginError}>{authError}</div>}

            <button type="submit" style={styles.loginButton}>
              Giri┼ş Yap ÔåÆ
            </button>
          </form>

          <button onClick={onNavigateStudent} style={styles.backToStudentBtn}>
            ÔåÉ ├û─şrenci Aray├╝z├╝ne D├Ân
          </button>
        </div>
      </div>
    );
  }

  // ADM─░N PANEL─░ ANA G├ûR├£N├£M├£
  return (
    <div style={styles.adminOuter}>
      {/* ├£st Y├Ânetim ├çubu─şu */}
      <header style={styles.adminHeader}>
        <div style={styles.adminHeaderInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={styles.adminTag}>ADM─░N</span>
            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>KPSS ─░├ğerik & Soru Y├Ânetim Paneli</span>
            <span style={{ ...styles.cloudDot, backgroundColor: isCloud ? '#16A34A' : '#EAB308' }}></span>
            <span style={{ fontSize: '12px', color: '#6B7280' }}>
              {isCloud ? 'Supabase Ba─şl─▒' : 'Yerel Mod'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => setShowSecretModal(true)}
              style={{
                ...styles.headerBtn,
                backgroundColor: isSecretActive ? '#DCFCE7' : '#F3F4F6',
                color: isSecretActive ? '#15803D' : '#374151',
                borderColor: isSecretActive ? '#86EFAC' : '#E5E7EB',
                fontWeight: isSecretActive ? 'bold' : 'normal',
              }}
            >
              {isSecretActive ? '­şöæ Secret Key Aktif' : '­şöæ Secret Key (RLS Bypass)'}
            </button>
            <button onClick={onNavigateStudent} style={styles.headerBtn}>
              ├û─şrenci G├Âr├╝n├╝m├╝ ÔåÆ
            </button>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              ├ç─▒k─▒┼ş
            </button>
          </div>
        </div>
      </header>

      {/* Sekmeler */}
      <div style={styles.tabsNav}>
        <div style={styles.tabsNavInner}>
          <button
            onClick={() => setActiveTab('packages')}
            style={{ ...styles.tabBtn, borderBottomColor: activeTab === 'packages' ? '#111827' : 'transparent', fontWeight: activeTab === 'packages' ? 'bold' : 'normal' }}
          >
            ­şôĞ 20 Soruluk Paket Y├Ânetimi
          </button>
          <button
            onClick={() => setActiveTab('subjects_units')}
            style={{ ...styles.tabBtn, borderBottomColor: activeTab === 'subjects_units' ? '#111827' : 'transparent', fontWeight: activeTab === 'subjects_units' ? 'bold' : 'normal' }}
          >
            ­şôÜ Ders, ├£nite & Konu D├╝zenleyici
          </button>
          <button
            onClick={() => setActiveTab('error_pool')}
            style={{ ...styles.tabBtn, borderBottomColor: activeTab === 'error_pool' ? '#111827' : 'transparent', fontWeight: activeTab === 'error_pool' ? 'bold' : 'normal' }}
          >
            ÔÜá´©Å Hata Havuzu Analiti─şi
          </button>
        </div>
      </div>

      {/* ─░├ğerik Alan─▒ */}
      <main style={styles.adminMain}>
        {/* 1. 20 SORULUK PAKET Y├ûNET─░M─░ */}
        {activeTab === 'packages' && (
          <div style={styles.tabContent}>
            {/* ├£nite Se├ğim Bar─▒ */}
            <div style={styles.selectorCard}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div>
                  <label style={styles.label}>Ders:</label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    style={styles.selectInput}
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={styles.label}>├£nite:</label>
                  <select
                    value={selectedUnitId}
                    onChange={(e) => setSelectedUnitId(e.target.value)}
                    style={styles.selectInput}
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>{u.unitNumber}. {u.title}</option>
                    ))}
                  </select>
                </div>

                {topics.length > 0 && (
                  <div>
                    <label style={styles.label}>Konu:</label>
                    <select
                      value={selectedTopicId}
                      onChange={(e) => setSelectedTopicId(e.target.value)}
                      style={styles.selectInput}
                    >
                      {topics.map((t) => (
                        <option key={t.id} value={t.id}>{t.topicNumber}. {t.title}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* H─▒zl─▒ Paket Aksiyonlar─▒ */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleUploadSample20Package} style={styles.uploadPackageBtn}>
                  ÔÜí 20 Soruluk Haz─▒r Paketi Y├╝kle
                </button>
                <button onClick={() => setShowQuestionModal(true)} style={styles.addQuestionBtn}>
                  + Tekil Soru Ekle
                </button>
                {questions.length > 0 && (
                  <button onClick={handleDeleteAllUnitQuestions} style={styles.deleteAllBtn}>
                    T├╝m├╝n├╝ Sil
                  </button>
                )}
              </div>
            </div>

            {packageMessage && (
              <div style={{ ...styles.alertBox, backgroundColor: packageMessage.type === 'success' ? '#F0FDF4' : '#FEF2F2', borderColor: packageMessage.type === 'success' ? '#16A34A' : '#DC2626' }}>
                {packageMessage.text}
              </div>
            )}

            {/* Soru Listesi Tablosu */}
            <div style={styles.tableBox}>
              <div style={styles.tableHeaderRow}>
                <div style={{ fontWeight: 'bold', fontSize: '15px' }}>
                  {selectedTopicId ? 'Se├ğili Konudaki Sorular' : 'Se├ğili ├£nitedeki Sorular'} ({questions.length} / 20 Soru)
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>
                  Supabase tablosu: questions &bull; {selectedTopicId ? `topic_id: ${selectedTopicId}` : `unit_id: ${selectedUnitId}`}
                </div>
              </div>

              {questions.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', color: '#9CA3AF' }}>
                  Bu alanda hen├╝z soru bulunmuyor. Yukar─▒daki butonu kullanarak 20 soruluk paket y├╝kleyebilirsiniz.
                </div>
              ) : (
                <div style={styles.questionRowsList}>
                  {questions.map((q) => (
                    <div key={q.id} style={styles.qRow}>
                      <div style={styles.qNumber}>#{q.questionNumber}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: '4px' }}>{q.questionText}</div>
                        <div style={{ fontSize: '12px', color: '#16A34A', fontWeight: 'bold' }}>
                          Do─şru ┼Ş─▒k: {q.correctOption} &bull; A├ğ─▒klama: {q.explanation}
                        </div>
                      </div>
                      <button onClick={() => handleDeleteSingleQuestion(q.id)} style={styles.deleteSmallBtn}>
                        Sil
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. DERS, ├£N─░TE & KONU Y├ûNET─░M─░ */}
        {activeTab === 'subjects_units' && (
          <div style={styles.tabContent}>
            <div style={styles.tripleGrid}>
              {/* Dersler */}
              <div style={styles.panelCard}>
                <h3 style={styles.cardHeading}>Dersler ({subjects.length})</h3>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <input
                    type="text"
                    placeholder="Yeni Ders Ad─▒"
                    value={newSubjectTitle}
                    onChange={(e) => setNewSubjectTitle(e.target.value)}
                    style={styles.textInput}
                  />
                  <button onClick={handleCreateSubject} style={styles.saveBtn}>
                    Ekle
                  </button>
                </div>

                <div style={styles.itemsList}>
                  {subjects.map((sub) => (
                    <div
                      key={sub.id}
                      onClick={() => setSelectedSubjectId(sub.id)}
                      style={{
                        ...styles.itemRow,
                        cursor: 'pointer',
                        backgroundColor: selectedSubjectId === sub.id ? '#F3F4F6' : '#FFFFFF',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 600 }}>{sub.title}</span>
                        <span style={{ fontSize: '12px', color: '#6B7280', marginLeft: '6px' }}>({sub.id})</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSubject(sub.id);
                        }}
                        style={styles.deleteSmallBtn}
                      >
                        Sil
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* ├£niteler */}
              <div style={styles.panelCard}>
                <h3 style={styles.cardHeading}>
                  ├£niteler ({units.length})
                  {selectedSubjectId && (
                    <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#6B7280', display: 'block', marginTop: '2px' }}>
                      Se├ğili Ders: {subjects.find((s) => s.id === selectedSubjectId)?.title || selectedSubjectId}
                    </span>
                  )}
                </h3>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <input
                    type="text"
                    placeholder="Yeni ├£nite Ad─▒"
                    value={newUnitTitle}
                    onChange={(e) => setNewUnitTitle(e.target.value)}
                    style={styles.textInput}
                  />
                  <button onClick={handleCreateUnit} style={styles.saveBtn}>
                    Ekle
                  </button>
                </div>

                <div style={styles.itemsList}>
                  {units.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => setSelectedUnitId(u.id)}
                      style={{
                        ...styles.itemRow,
                        cursor: 'pointer',
                        backgroundColor: selectedUnitId === u.id ? '#F3F4F6' : '#FFFFFF',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 600 }}>{u.unitNumber}. {u.title}</span>
                        <span style={{ fontSize: '11px', color: u.isCompleted ? '#16A34A' : '#6B7280', marginLeft: '6px' }}>
                          {u.isCompleted ? 'Ô£ô Tamamland─▒' : u.isLocked ? 'Kilitli' : 'A├ğ─▒k'}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteUnit(u.id);
                        }}
                        style={styles.deleteSmallBtn}
                      >
                        Sil
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Konular */}
              <div style={styles.panelCard}>
                <h3 style={styles.cardHeading}>
                  Konular ({topics.length})
                  {selectedUnitId && (
                    <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#6B7280', display: 'block', marginTop: '2px' }}>
                      Se├ğili ├£nite: {units.find((u) => u.id === selectedUnitId)?.title || selectedUnitId}
                    </span>
                  )}
                </h3>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <input
                    type="text"
                    placeholder="Yeni Konu Ad─▒"
                    value={newTopicTitle}
                    onChange={(e) => setNewTopicTitle(e.target.value)}
                    style={styles.textInput}
                  />
                  <button onClick={handleCreateTopic} style={styles.saveBtn}>
                    Ekle
                  </button>
                </div>

                <div style={styles.itemsList}>
                  {topics.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTopicId(t.id)}
                      style={{
                        ...styles.itemRow,
                        cursor: 'pointer',
                        backgroundColor: selectedTopicId === t.id ? '#F3F4F6' : '#FFFFFF',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 600 }}>{t.topicNumber}. {t.title}</span>
                        <span style={{ fontSize: '11px', color: '#6B7280', marginLeft: '6px' }}>
                          ({t.questionCount || 20} soru)
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTopic(t.id);
                        }}
                        style={styles.deleteSmallBtn}
                      >
                        Sil
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. HATA HAVUZU ANAL─░T─░─Ş─░ */}
        {activeTab === 'error_pool' && (
          <div style={styles.tabContent}>
            <div style={styles.panelCard}>
              <h3 style={styles.cardHeading}>├û─şrenci Hata Analiti─şi (Supabase 'error_pool')</h3>
              <div style={{ display: 'flex', gap: '20px', margin: '14px 0' }}>
                <div style={styles.statBox}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#DC2626' }}>
                    {errorPoolStats?.unresolvedCount ?? 0}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>Bekleyen Hatalar</div>
                </div>
                <div style={styles.statBox}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16A34A' }}>
                    {errorPoolStats?.resolvedCount ?? 0}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>D├╝zeltilen Sorular</div>
                </div>
              </div>

              {errorPoolStats?.list?.length > 0 ? (
                <div style={styles.questionRowsList}>
                  {errorPoolStats.list.map((item: any, i: number) => (
                    <div key={i} style={styles.qRow}>
                      <div style={{ ...styles.qNumber, color: '#DC2626' }}>{item.wrong_count}x</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>
                          {item.questions?.question_text || `Soru ID: ${item.question_id}`}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6B7280' }}>
                          Se├ğilen: {item.selected_option} &bull; Do─şru: {item.correct_option} &bull; Durum: {item.is_resolved ? '├ç├Âz├╝ld├╝' : 'Bekliyor'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF' }}>
                  Kay─▒tl─▒ ├Â─şrenci hatas─▒ bulunmuyor.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* TEK─░L SORU EKLEME MODALI */}
      {showQuestionModal && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <h3 style={{ margin: '0 0 12px' }}>
              Yeni Soru Ekle
              <span style={{ display: 'block', fontSize: '13px', fontWeight: 'normal', color: '#6B7280', marginTop: '4px' }}>
                {units.find((u) => u.id === selectedUnitId)?.title || 'Se├ğili ├£nite'}
                {selectedTopicId && ` > ${topics.find((t) => t.id === selectedTopicId)?.title || ''}`}
              </span>
            </h3>
            <textarea
              placeholder="Soru Metni"
              value={formText}
              onChange={(e) => setFormText(e.target.value)}
              style={styles.modalTextarea}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '12px 0' }}>
              <input type="text" placeholder="A ┼Ş─▒kk─▒" value={formA} onChange={(e) => setFormA(e.target.value)} style={styles.modalInput} />
              <input type="text" placeholder="B ┼Ş─▒kk─▒" value={formB} onChange={(e) => setFormB(e.target.value)} style={styles.modalInput} />
              <input type="text" placeholder="C ┼Ş─▒kk─▒" value={formC} onChange={(e) => setFormC(e.target.value)} style={styles.modalInput} />
              <input type="text" placeholder="D ┼Ş─▒kk─▒" value={formD} onChange={(e) => setFormD(e.target.value)} style={styles.modalInput} />
              <input type="text" placeholder="E ┼Ş─▒kk─▒" value={formE} onChange={(e) => setFormE(e.target.value)} style={styles.modalInput} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <label style={styles.label}>Do─şru ┼Ş─▒k:</label>
              {(['A', 'B', 'C', 'D', 'E'] as OptionId[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setFormCorrect(opt)}
                  style={{
                    ...styles.optSelectBtn,
                    backgroundColor: formCorrect === opt ? '#16A34A' : '#F3F4F6',
                    color: formCorrect === opt ? '#FFFFFF' : '#000000',
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>

            <textarea
              placeholder="Detayl─▒ ├ç├Âz├╝m A├ğ─▒klamas─▒"
              value={formExplanation}
              onChange={(e) => setFormExplanation(e.target.value)}
              style={styles.modalTextarea}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button onClick={() => setShowQuestionModal(false)} style={styles.modalCancelBtn}>
                Vazge├ğ
              </button>
              <button onClick={handleAddSingleQuestion} style={styles.modalSaveBtn}>
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECRET KEY AYARLAMA MODALI */}
      {showSecretModal && (
        <div style={styles.modalBackdrop}>
          <div style={{ ...styles.modalCard, maxWidth: '480px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '18px' }}>­şöæ Supabase Secret / Service Role Key</h3>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 16px', lineHeight: 1.5 }}>
              Supabase Dashboard &gt; <strong>Project Settings &rarr; API</strong> sayfas─▒ndaki <code>service_role / secret</code> anahtar─▒n─▒z─▒ buraya yap─▒┼şt─▒rarak RLS g├╝venlik kurallar─▒na tak─▒lmadan do─şrudan veritaban─▒na s─▒n─▒rs─▒z yazma yetkisi kazand─▒rabilirsiniz.
            </p>
            <input
              type="password"
              placeholder="sb_secret_... veya service_role key"
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
              style={{ ...styles.modalInput, marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowSecretModal(false)}
                style={styles.modalCancelBtn}
              >
                Kapat
              </button>
              {isSecretActive && (
                <button
                  onClick={() => {
                    setAdminSecretKey('');
                    setIsSecretActive(false);
                    setShowSecretModal(false);
                    setPackageMessage({ type: 'success', text: 'Secret key temizlendi.' });
                  }}
                  style={{ ...styles.modalCancelBtn, color: '#DC2626', borderColor: '#FECACA' }}
                >
                  Kald─▒r
                </button>
              )}
              <button
                onClick={() => {
                  if (secretInput.trim()) {
                    setAdminSecretKey(secretInput.trim());
                    setIsSecretActive(true);
                    setShowSecretModal(false);
                    setPackageMessage({
                      type: 'success',
                      text: 'Supabase Secret Key ba┼şar─▒yla kaydedildi! RLS engeli a┼ş─▒ld─▒.',
                    });
                    loadSubjects();
                  }
                }}
                style={styles.modalSaveBtn}
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  loginContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9F9FB',
    padding: '16px',
  },
  loginCard: {
    width: '100%',
    maxWidth: '380px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    padding: '28px',
    textAlign: 'center',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
  },
  loginBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  loginInput: {
    height: '44px',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    padding: '0 12px',
    fontSize: '14px',
    outline: 'none',
  },
  loginButton: {
    height: '44px',
    backgroundColor: '#111827',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px',
  },
  loginError: {
    color: '#DC2626',
    fontSize: '12px',
  },
  backToStudentBtn: {
    background: 'none',
    border: 'none',
    color: '#6B7280',
    fontSize: '13px',
    marginTop: '16px',
    cursor: 'pointer',
  },
  adminOuter: {
    minHeight: '100vh',
    backgroundColor: '#F9F9FB',
  },
  adminHeader: {
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E5E7EB',
    padding: '12px 24px',
  },
  adminHeaderInner: {
    maxWidth: '1100px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adminTag: {
    backgroundColor: '#111827',
    color: '#FFFFFF',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  cloudDot: {
    width: '8px',
    height: '8px',
    borderRadius: '4px',
    display: 'inline-block',
    marginLeft: '6px',
  },
  headerBtn: {
    padding: '6px 12px',
    backgroundColor: '#F3F4F6',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  logoutBtn: {
    padding: '6px 12px',
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    border: '1px solid #FCA5A5',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  tabsNav: {
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E5E7EB',
  },
  tabsNavInner: {
    maxWidth: '1100px',
    margin: '0 auto',
    display: 'flex',
    gap: '24px',
    padding: '0 24px',
  },
  tabBtn: {
    padding: '12px 4px',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    fontSize: '14px',
    cursor: 'pointer',
  },
  adminMain: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '24px',
  },
  tabContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  selectorCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '10px',
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    marginRight: '6px',
  },
  selectInput: {
    height: '38px',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    padding: '0 10px',
    fontSize: '13px',
    backgroundColor: '#F9F9FB',
    outline: 'none',
  },
  uploadPackageBtn: {
    backgroundColor: '#16A34A',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  addQuestionBtn: {
    backgroundColor: '#111827',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  deleteAllBtn: {
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    border: '1px solid #FCA5A5',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  alertBox: {
    padding: '12px 16px',
    borderRadius: '6px',
    border: '1px solid',
    fontSize: '13px',
    fontWeight: 500,
  },
  tableBox: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    padding: '14px 20px',
    borderBottom: '1px solid #E5E7EB',
    backgroundColor: '#F9F9FB',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionRowsList: {
    display: 'flex',
    flexDirection: 'column',
  },
  qRow: {
    padding: '12px 20px',
    borderBottom: '1px solid #E5E7EB',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  qNumber: {
    width: '32px',
    height: '32px',
    borderRadius: '4px',
    backgroundColor: '#F3F4F6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '12px',
    flexShrink: 0,
  },
  deleteSmallBtn: {
    padding: '4px 8px',
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    border: '1px solid #FCA5A5',
    borderRadius: '4px',
    fontSize: '11px',
    cursor: 'pointer',
  },
  dualGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  tripleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
  },
  panelCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '10px',
    padding: '20px',
  },
  cardHeading: {
    margin: '0 0 12px',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  textInput: {
    flex: 1,
    height: '38px',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    padding: '0 10px',
    fontSize: '13px',
    outline: 'none',
  },
  saveBtn: {
    padding: '0 16px',
    backgroundColor: '#111827',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
    fontSize: '13px',
    cursor: 'pointer',
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  itemRow: {
    padding: '10px 12px',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statBox: {
    padding: '16px 24px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    backgroundColor: '#F9F9FB',
  },
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 1000,
  },
  modalCard: {
    width: '100%',
    maxWidth: '560px',
    backgroundColor: '#FFFFFF',
    borderRadius: '10px',
    padding: '20px',
  },
  modalTextarea: {
    width: '100%',
    height: '60px',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    padding: '8px',
    fontSize: '13px',
    boxSizing: 'border-box',
    outline: 'none',
  },
  modalInput: {
    width: '100%',
    height: '34px',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    padding: '0 8px',
    fontSize: '13px',
    boxSizing: 'border-box',
    outline: 'none',
  },
  optSelectBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '4px',
    border: '1px solid #E5E7EB',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  modalCancelBtn: {
    padding: '8px 16px',
    backgroundColor: '#F3F4F6',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  modalSaveBtn: {
    padding: '8px 18px',
    backgroundColor: '#111827',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
};

export default AdminPanel;
