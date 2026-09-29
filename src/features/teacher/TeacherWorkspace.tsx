import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { teacherService, TeacherClass, ClassStudent, TeacherAssignment } from '../../services/teacherService';
import { BookOpen, Users, Plus, Copy, Check, Clock, Calendar, ArrowLeft, RefreshCw, Send, AlertCircle } from 'lucide-react';

export const TeacherWorkspace: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'classes' | 'students' | 'assignments'>('classes');

  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // New Class Form State
  const [showNewClassModal, setShowNewClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassDescription, setNewClassDescription] = useState('');
  const [isSubmittingClass, setIsSubmittingClass] = useState(false);
  const [classFormError, setClassFormError] = useState<string | null>(null);

  // New Assignment Form State
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDescription, setAssignmentDescription] = useState('');
  const [assignmentType, setAssignmentType] = useState<'quiz' | 'mock_exam' | 'study_plan'>('quiz');
  const [dueDays, setDueDays] = useState(7);
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [assignmentSuccess, setAssignmentSuccess] = useState(false);

  // Load Classes
  const loadClasses = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await teacherService.getMyClasses(user.id);
      setClasses(data);
      if (data.length > 0 && !selectedClassId) {
        setSelectedClassId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load classes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, [user]);

  // Load Students and Assignments when selectedClassId changes
  useEffect(() => {
    if (!selectedClassId) {
      setStudents([]);
      setAssignments([]);
      return;
    }

    const loadClassDetails = async () => {
      try {
        const [studentList, assignmentList] = await Promise.all([
          teacherService.getClassStudents(selectedClassId),
          teacherService.getClassAssignments(selectedClassId),
        ]);
        setStudents(studentList);
        setAssignments(assignmentList);
      } catch (err) {
        console.error('Failed to load class details:', err);
      }
    };

    loadClassDetails();
  }, [selectedClassId]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newClassName.trim()) return;

    setIsSubmittingClass(true);
    setClassFormError(null);

    const res = await teacherService.createClass(user.id, newClassName, newClassDescription);
    setIsSubmittingClass(false);

    if (res.success && res.data) {
      setClasses([res.data, ...classes]);
      setSelectedClassId(res.data.id);
      setNewClassName('');
      setNewClassDescription('');
      setShowNewClassModal(false);
    } else {
      setClassFormError(res.error || 'Sınıf oluşturulamadı.');
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedClassId || !assignmentTitle.trim()) return;

    setIsSubmittingAssignment(true);
    setAssignmentError(null);
    setAssignmentSuccess(false);

    const res = await teacherService.createAssignment(
      user.id,
      selectedClassId,
      assignmentTitle,
      assignmentDescription,
      assignmentType,
      { targetDays: dueDays },
      dueDays
    );

    setIsSubmittingAssignment(false);

    if (res.success && res.data) {
      setAssignments([res.data, ...assignments]);
      setAssignmentTitle('');
      setAssignmentDescription('');
      setAssignmentSuccess(true);
      setTimeout(() => setAssignmentSuccess(false), 3000);
    } else {
      setAssignmentError(res.error || 'Ödev oluşturulamadı.');
    }
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);

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
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
              <h1 style={{ fontSize: '18px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                Öğretmen Çalışma Alanı
              </h1>
              <span style={{ fontSize: '12px', color: '#64748B' }}>
                Sınıflarınızı yönetin, ödev atayın ve öğrencilerin ilerlemelerini takip edin
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={loadClasses}
              disabled={isLoading}
              style={{
                padding: '8px 12px',
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
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              Yenile
            </button>
            <button
              onClick={() => setShowNewClassModal(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#111111',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Plus size={16} />
              Yeni Sınıf Aç
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
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
            onClick={() => setActiveTab('classes')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'classes' ? '#111111' : 'transparent',
              color: activeTab === 'classes' ? '#FFFFFF' : 'var(--kpss-text, #0F172A)',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <BookOpen size={16} />
            Sınıflarım ({classes.length})
          </button>
          <button
            onClick={() => setActiveTab('students')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'students' ? '#111111' : 'transparent',
              color: activeTab === 'students' ? '#FFFFFF' : 'var(--kpss-text, #0F172A)',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Users size={16} />
            Öğrencilerim & İlerleme
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'assignments' ? '#111111' : 'transparent',
              color: activeTab === 'assignments' ? '#FFFFFF' : 'var(--kpss-text, #0F172A)',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Calendar size={16} />
            Ödev / Deneme Ata
          </button>
        </div>

        {/* Tab 1: Sınıflarım */}
        {activeTab === 'classes' && (
          <div>
            {classes.length === 0 ? (
              <div
                style={{
                  backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
                  border: '1px solid var(--kpss-border, #E2E8F0)',
                  borderRadius: '12px',
                  padding: '48px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                    color: 'var(--kpss-text, #0F172A)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <BookOpen size={24} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px' }}>Henüz Bir Sınıf Oluşturmadınız</h3>
                <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '420px', margin: '0 auto 20px' }}>
                  Öğrencilerinizle deneme sonuçlarını takip etmek ve ödev atamak için ilk sınıfınızı açın.
                </p>
                <button
                  onClick={() => setShowNewClassModal(true)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#111111',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Yeni Sınıf Aç
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    style={{
                      backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
                      border: '1px solid var(--kpss-border, #E2E8F0)',
                      borderRadius: '12px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>{cls.name}</h3>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: '12px',
                            backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                            border: '1px solid var(--kpss-border, #E2E8F0)',
                            color: '#64748B',
                          }}
                        >
                          {cls.student_count || 0} Öğrenci
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 16px', minHeight: '36px' }}>
                        {cls.description || 'Açıklama belirtilmedi.'}
                      </p>
                    </div>

                    <div
                      style={{
                        backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                        border: '1px solid var(--kpss-border, #E2E8F0)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '12px',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748B', fontWeight: 700 }}>
                          Katılım Kodu
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '0.05em' }}>{cls.invite_code}</div>
                      </div>
                      <button
                        onClick={() => handleCopyCode(cls.invite_code)}
                        title="Kodu Kopyala"
                        style={{
                          backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
                          border: '1px solid var(--kpss-border, #E2E8F0)',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          color: 'var(--kpss-text, #0F172A)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {copiedCode === cls.invite_code ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
                        {copiedCode === cls.invite_code ? 'Kopyalandı' : 'Kopyala'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Öğrencilerim & İlerleme */}
        {activeTab === 'students' && (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px',
                backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid var(--kpss-border, #E2E8F0)',
              }}
            >
              <label style={{ fontSize: '13px', fontWeight: 700 }}>Sınıf Seçin:</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--kpss-border, #E2E8F0)',
                  backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
                  fontSize: '13px',
                  color: 'var(--kpss-text, #0F172A)',
                  fontWeight: 600,
                  outline: 'none',
                }}
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.student_count || 0} Öğrenci)
                  </option>
                ))}
              </select>
            </div>

            {students.length === 0 ? (
              <div
                style={{
                  backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
                  border: '1px solid var(--kpss-border, #E2E8F0)',
                  borderRadius: '12px',
                  padding: '40px',
                  textAlign: 'center',
                }}
              >
                <Users size={32} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px' }}>Bu Sınıfta Henüz Kayıtlı Öğrenci Yok</h4>
                <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
                  Öğrencilerinize sınıf davet kodunu (
                  <strong>{selectedClass ? selectedClass.invite_code : '...'}</strong>) ileterek sınıfa katılmalarını sağlayabilirsiniz.
                </p>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
                  border: '1px solid var(--kpss-border, #E2E8F0)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)', borderBottom: '1px solid var(--kpss-border, #E2E8F0)' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Öğrenci Adı</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Kullanıcı Adı</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Hedef Sınav</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Katılma Tarihi</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr
                        key={student.id}
                        style={{ borderBottom: '1px solid var(--kpss-border, #E2E8F0)' }}
                      >
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{student.full_name}</td>
                        <td style={{ padding: '12px 16px', color: '#64748B' }}>@{student.username || 'belirtilmedi'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                              border: '1px solid var(--kpss-border, #E2E8F0)',
                            }}
                          >
                            {student.exam_type || 'KPSS'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#64748B' }}>
                          {new Date(student.joined_at).toLocaleDateString('tr-TR')}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '12px',
                              backgroundColor: '#DCFCE7',
                              color: '#166534',
                            }}
                          >
                            Aktif
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Ödev / Deneme Ata */}
        {activeTab === 'assignments' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 420px) 1fr', gap: '24px' }}>
            {/* Form */}
            <div
              style={{
                backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
                border: '1px solid var(--kpss-border, #E2E8F0)',
                borderRadius: '12px',
                padding: '20px',
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px' }}>Yeni Görev / Ödev Ata</h3>

              {assignmentSuccess && (
                <div
                  style={{
                    backgroundColor: '#DCFCE7',
                    color: '#166534',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    marginBottom: '14px',
                  }}
                >
                  ✓ Ödev başarıyla sınıfa atandı.
                </div>
              )}

              {assignmentError && (
                <div
                  style={{
                    backgroundColor: '#FEE2E2',
                    color: '#991B1B',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <AlertCircle size={14} />
                  {assignmentError}
                </div>
              )}

              <form onSubmit={handleCreateAssignment}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Hedef Sınıf</label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--kpss-border, #E2E8F0)',
                      backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
                      fontSize: '13px',
                      color: 'var(--kpss-text, #0F172A)',
                      outline: 'none',
                    }}
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Ödev Türü</label>
                  <select
                    value={assignmentType}
                    onChange={(e) => setAssignmentType(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--kpss-border, #E2E8F0)',
                      backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
                      fontSize: '13px',
                      color: 'var(--kpss-text, #0F172A)',
                      outline: 'none',
                    }}
                  >
                    <option value="quiz">Konu Testi / Quiz</option>
                    <option value="mock_exam">KPSS Genel Deneme</option>
                    <option value="study_plan">Haftalık Çalışma Hedefi</option>
                  </select>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Ödev Başlığı</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Tarih - İnkılap Tarihi 50 Soru Testi"
                    value={assignmentTitle}
                    onChange={(e) => setAssignmentTitle(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--kpss-border, #E2E8F0)',
                      backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
                      fontSize: '13px',
                      color: 'var(--kpss-text, #0F172A)',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Açıklama / Talimatlar</label>
                  <textarea
                    rows={3}
                    placeholder="Öğrenciler için notlar ve tamamlama yönergeleri..."
                    value={assignmentDescription}
                    onChange={(e) => setAssignmentDescription(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--kpss-border, #E2E8F0)',
                      backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
                      fontSize: '13px',
                      color: 'var(--kpss-text, #0F172A)',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                    Son Teslim Süresi (Gün)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={dueDays}
                    onChange={(e) => setDueDays(parseInt(e.target.value) || 7)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--kpss-border, #E2E8F0)',
                      backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
                      fontSize: '13px',
                      color: 'var(--kpss-text, #0F172A)',
                      outline: 'none',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingAssignment || !assignmentTitle.trim()}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    backgroundColor: '#111111',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Send size={14} />
                  {isSubmittingAssignment ? 'Atanıyor...' : 'Ödevi Ata'}
                </button>
              </form>
            </div>

            {/* List of assignments */}
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px' }}>
                Atanan Ödevler ({assignments.length})
              </h3>

              {assignments.length === 0 ? (
                <div
                  style={{
                    backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
                    border: '1px solid var(--kpss-border, #E2E8F0)',
                    borderRadius: '12px',
                    padding: '36px',
                    textAlign: 'center',
                  }}
                >
                  <Calendar size={32} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
                    Bu sınıfa henüz bir ödev veya deneme atanmadı.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {assignments.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
                        border: '1px solid var(--kpss-border, #E2E8F0)',
                        borderRadius: '12px',
                        padding: '16px 20px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <div>
                          <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>{item.title}</h4>
                          <span style={{ fontSize: '11px', color: '#64748B' }}>
                            Tür: {item.assignment_type === 'quiz' ? 'Test' : item.assignment_type === 'mock_exam' ? 'Deneme Sınavı' : 'Çalışma Planı'}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: '12px',
                            backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                            border: '1px solid var(--kpss-border, #E2E8F0)',
                            color: '#64748B',
                          }}
                        >
                          {item.completed_count || 0} Tamamlanma
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 10px' }}>
                        {item.description || 'Açıklama yok.'}
                      </p>
                      <div style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        Son Tarih: {item.due_at ? new Date(item.due_at).toLocaleDateString('tr-TR') : 'Süresiz'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* New Class Modal */}
      {showNewClassModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 100,
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
              border: '1px solid var(--kpss-border, #E2E8F0)',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '460px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px' }}>Yeni Sınıf Oluştur</h3>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 16px' }}>
              Sınıfınızı oluşturduktan sonra öğrencileriniz için otomatik bir katılım kodu üretilecektir.
            </p>

            {classFormError && (
              <div
                style={{
                  backgroundColor: '#FEE2E2',
                  color: '#991B1B',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  marginBottom: '14px',
                }}
              >
                {classFormError}
              </div>
            )}

            <form onSubmit={handleCreateClass}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Sınıf Adı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: 2026 KPSS Lisans A Grubu"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--kpss-border, #E2E8F0)',
                    backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
                    fontSize: '13px',
                    color: 'var(--kpss-text, #0F172A)',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  Açıklama (İsteğe Bağlı)
                </label>
                <textarea
                  rows={3}
                  placeholder="Örn: Hafta sonu grubu deneme takip sınıfı"
                  value={newClassDescription}
                  onChange={(e) => setNewClassDescription(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--kpss-border, #E2E8F0)',
                    backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
                    fontSize: '13px',
                    color: 'var(--kpss-text, #0F172A)',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewClassModal(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                    border: '1px solid var(--kpss-border, #E2E8F0)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: 'var(--kpss-text, #0F172A)',
                  }}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingClass || !newClassName.trim()}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#111111',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {isSubmittingClass ? 'Oluşturuluyor...' : 'Sınıfı Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
