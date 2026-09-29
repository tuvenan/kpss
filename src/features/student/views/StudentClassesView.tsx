import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  ArrowRight,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { memberService, EnrolledClass, StudentAssignment } from '../../../services/memberService';
import { Question } from '../../../types';

interface StudentClassesViewProps {
  onStartAssignmentQuiz?: (questions: Question[], assignmentTitle: string, assignmentId: string) => void;
  onOpenAuthModal?: () => void;
}

export const StudentClassesView: React.FC<StudentClassesViewProps> = ({
  onStartAssignmentQuiz,
  onOpenAuthModal,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [classes, setClasses] = useState<EnrolledClass[]>([]);
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinMessage, setJoinMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [classList, assignList] = await Promise.all([
        memberService.getMyEnrolledClasses(user.id),
        memberService.getMyAssignments(user.id),
      ]);
      setClasses(classList);
      setAssignments(assignList);
    } catch (err) {
      console.warn('Failed to load classes or assignments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setIsJoining(true);
    setJoinMessage(null);

    const res = await memberService.joinClassByInviteCode(inviteCode.trim());
    setIsJoining(false);

    if (res.success) {
      setJoinMessage({ text: res.message || 'Sınıfa başarıyla katıldınız!', type: 'success' });
      setInviteCode('');
      loadData();
      setTimeout(() => {
        setShowJoinModal(false);
        setJoinMessage(null);
      }, 1500);
    } else {
      setJoinMessage({ text: res.message || 'Katılım başarısız.', type: 'error' });
    }
  };

  const handleLeaveClass = async (classId: string, className: string) => {
    if (!user) return;
    if (!window.confirm(`"${className}" sınıfından ayrılmak istediğinizden emin misiniz?`)) return;

    const res = await memberService.leaveClass(classId, user.id);
    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'Sınıftan çıkılamadı.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div
        style={{
          padding: '32px 16px',
          textAlign: 'center',
          maxWidth: '480px',
          margin: '40px auto',
          backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
          border: '1px solid var(--kpss-border, #E2E8F0)',
          borderRadius: '16px',
          fontFamily: "var(--kpss-font, 'Plus Jakarta Sans', sans-serif)",
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <GraduationCap size={28} color="var(--kpss-text, #0F172A)" />
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)', marginBottom: '8px' }}>
          Sınıf ve Ödev Sistemi
        </h3>
        <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.5, marginBottom: '20px' }}>
          Öğretmeninizin oluşturduğu sınıfa katılmak ve size özel atanan ödevleri görmek için lütfen giriş yapınız.
        </p>
        {onOpenAuthModal && (
          <button
            type="button"
            onClick={onOpenAuthModal}
            style={{
              padding: '10px 20px',
              backgroundColor: '#111111',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Giriş Yap / Üye Ol
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '24px 16px',
        maxWidth: '1100px',
        margin: '0 auto',
        fontFamily: "var(--kpss-font, 'Plus Jakarta Sans', sans-serif)",
      }}
    >
      {/* BAŞLIK & KATIL BUTONU */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--kpss-text, #0F172A)', margin: 0 }}>
            Sınıflarım & Ödevlerim
          </h1>
          <p style={{ fontSize: '14px', color: '#64748B', margin: '4px 0 0 0' }}>
            Öğretmenlerinizin atadığı çalışmaları çözün, sınıfınızdaki ilerlemenizi takip edin.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={loadData}
            title="Yenile"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
              border: '1px solid var(--kpss-border, #E2E8F0)',
              borderRadius: '10px',
              color: 'var(--kpss-text, #0F172A)',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={16} />
          </button>

          <button
            type="button"
            onClick={() => setShowJoinModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              backgroundColor: '#111111',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={16} />
            <span>Davet Koduyla Sınıfa Katıl</span>
          </button>
        </div>
      </div>

      {/* SINIFA KATILMA MODALI */}
      {showJoinModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
              border: '1px solid var(--kpss-border, #E2E8F0)',
              borderRadius: '16px',
              padding: '28px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)', marginBottom: '8px' }}>
              Sınıfa Katıl
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5, marginBottom: '20px' }}>
              Öğretmeninizden aldığınız 6 haneli davet kodunu giriniz (Örn: KPSS-123456).
            </p>

            {joinMessage && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: '16px',
                  backgroundColor: joinMessage.type === 'success' ? '#F0FDF4' : '#FEF2F2',
                  color: joinMessage.type === 'success' ? '#166534' : '#991B1B',
                  border: `1px solid ${joinMessage.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
                }}
              >
                {joinMessage.text}
              </div>
            )}

            <form onSubmit={handleJoinClass}>
              <input
                type="text"
                placeholder="Örn: KPSS-748921"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1px solid var(--kpss-border, #E2E8F0)',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 600,
                  letterSpacing: '1px',
                  backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                  color: 'var(--kpss-text, #0F172A)',
                  marginBottom: '20px',
                  boxSizing: 'border-box',
                }}
              />

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--kpss-border, #E2E8F0)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'var(--kpss-text, #0F172A)',
                    cursor: 'pointer',
                  }}
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isJoining || !inviteCode.trim()}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#111111',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: isJoining ? 'not-allowed' : 'pointer',
                    opacity: isJoining ? 0.7 : 1,
                  }}
                >
                  {isJoining ? 'Doğrulanıyor...' : 'Katıl'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. KAYITLI OLUNAN SINIFLAR */}
      <section style={{ marginBottom: '36px' }}>
        <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)', marginBottom: '16px' }}>
          Kayıtlı Sınıflarım ({classes.length})
        </h2>

        {classes.length === 0 ? (
          <div
            style={{
              padding: '28px',
              textAlign: 'center',
              backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
              border: '1px dashed var(--kpss-border, #CBD5E1)',
              borderRadius: '12px',
              color: '#64748B',
            }}
          >
            Henüz bir sınıfa kayıtlı değilsiniz. Yukarıdaki butona tıklayarak öğretmeninizin davet kodunu girebilirsiniz.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '16px',
            }}
          >
            {classes.map((c) => (
              <div
                key={c.id}
                style={{
                  backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
                  border: '1px solid var(--kpss-border, #E2E8F0)',
                  borderRadius: '14px',
                  padding: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <GraduationCap size={16} color="var(--kpss-text, #0F172A)" />
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)', margin: 0 }}>
                      {c.class_name}
                    </h3>
                  </div>

                  {c.class_description && (
                    <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.4, marginBottom: '12px' }}>
                      {c.class_description}
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B', marginTop: '10px' }}>
                    <User size={14} />
                    <span>Öğretmen: <strong>{c.teacher_name}</strong></span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
                    <Calendar size={13} />
                    <span>Katılım: {new Date(c.joined_at).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>

                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--kpss-border, #E2E8F0)', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => handleLeaveClass(c.class_id, c.class_name)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '12px',
                      color: '#EF4444',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                    }}
                  >
                    <LogOut size={12} />
                    <span>Sınıftan Ayrıl</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 2. ATANMIŞ ÇALIŞMALAR & ÖDEVLER */}
      <section>
        <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)', marginBottom: '16px' }}>
          Atanmış Çalışmalar ({assignments.length})
        </h2>

        {assignments.length === 0 ? (
          <div
            style={{
              padding: '32px',
              textAlign: 'center',
              backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
              border: '1px solid var(--kpss-border, #E2E8F0)',
              borderRadius: '12px',
              color: '#64748B',
            }}
          >
            Henüz size atanmış bir ödev veya çalışma bulunmamaktadır.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {assignments.map((a) => {
              const isCompleted = a.status === 'completed';
              const isOverdue = a.status === 'overdue';

              return (
                <div
                  key={a.id}
                  style={{
                    backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
                    border: '1px solid var(--kpss-border, #E2E8F0)',
                    borderRadius: '12px',
                    padding: '18px 20px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                  }}
                >
                  <div style={{ flex: '1 1 280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                          color: '#64748B',
                          border: '1px solid var(--kpss-border, #E2E8F0)',
                        }}
                      >
                        {a.class_name}
                      </span>

                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor:
                            a.assignment_type === 'quiz'
                              ? '#EEF2FF'
                              : a.assignment_type === 'mock_exam'
                              ? '#FEF3C7'
                              : '#F0FDF4',
                          color:
                            a.assignment_type === 'quiz'
                              ? '#4F46E5'
                              : a.assignment_type === 'mock_exam'
                              ? '#D97706'
                              : '#15803D',
                        }}
                      >
                        {a.assignment_type === 'quiz'
                          ? 'Konu Testi'
                          : a.assignment_type === 'mock_exam'
                          ? 'Deneme Sınavı'
                          : 'Çalışma Planı'}
                      </span>

                      {isCompleted ? (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: '#F0FDF4',
                            color: '#166534',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <CheckCircle size={11} />
                          <span>Tamamlandı ({a.score ? `%${a.score}` : 'Çözüldü'})</span>
                        </span>
                      ) : isOverdue ? (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: '#FEF2F2',
                            color: '#991B1B',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <AlertCircle size={11} />
                          <span>Süresi Geçti</span>
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                            color: 'var(--kpss-text, #0F172A)',
                          }}
                        >
                          Bekliyor
                        </span>
                      )}
                    </div>

                    <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)', margin: '0 0 4px 0' }}>
                      {a.title}
                    </h4>

                    {a.description && (
                      <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                        {a.description}
                      </p>
                    )}

                    {a.due_at && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748B' }}>
                        <Clock size={13} />
                        <span>Son Teslim: {new Date(a.due_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    {!isCompleted ? (
                      <button
                        type="button"
                        onClick={() => {
                          const customQuestions = a.configuration?.questions || [];
                          if (onStartAssignmentQuiz) {
                            onStartAssignmentQuiz(customQuestions, a.title, a.id);
                          }
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '9px 16px',
                          backgroundColor: '#111111',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <span>Ödevi Başlat</span>
                        <ArrowRight size={14} />
                      </button>
                    ) : (
                      <div style={{ fontSize: '13px', color: '#166534', fontWeight: 600 }}>
                        ✓ Teslim Edildi
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
