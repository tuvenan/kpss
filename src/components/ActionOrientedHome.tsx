import React, { useState, useEffect } from 'react';
import {
  Target,
  Zap,
  Play,
  RotateCcw,
  AlertTriangle,
  BookOpen,
  ChevronRight,
  Award,
  CheckCircle2,
  Clock,
  Sparkles,
  Calendar,
  Flame,
  BarChart2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { UserProfile } from '../services/userProfileService';
import { spacedRepetitionService } from '../services/spacedRepetitionService';
import { studentProgressService, TopicRecord } from '../services/studentProgressService';
import { offlineSyncService } from '../services/offlineSyncService';
import { examSessionService, ActiveExamSession } from '../services/examSessionService';

export interface LastActivityInfo {
  type: 'exam' | 'topic' | 'plan';
  title: string;
  subtitle: string;
  subjectTitle?: string;
  topicTitle?: string;
  topicId?: string;
  questionCount?: number;
  timestamp?: string;
}

export interface ActionOrientedHomeProps {
  userProfile: UserProfile;
  onStartQuick20: () => void;
  onStartPlan: (planIndex: number) => void;
  onStartMistakesBank: () => void;
  onStartLeitnerQuiz: () => void;
  onOpenDenemeSetup: () => void;
  onNavigateTab: (tab: 'home' | 'subjects' | 'errors' | 'profile' | 'settings') => void;
  onResumeExamSession?: (session: ActiveExamSession) => void;
  onPracticeTopic?: (topicTitle: string, subjectTitle?: string) => void;
  generalTalentSubjects: Array<{ id: string; title: string; unitCount: number; percentage: number; icon: string }>;
  generalCultureSubjects: Array<{ id: string; title: string; unitCount: number; percentage: number; icon: string }>;
  onSubjectClick: (subject: { id: string; title: string; unitCount: number; percentage: number; icon: string }) => void;
  mistakesBankCount: number;
}

export const ActionOrientedHome: React.FC<ActionOrientedHomeProps> = ({
  userProfile,
  onStartQuick20,
  onStartPlan,
  onStartMistakesBank,
  onStartLeitnerQuiz,
  onOpenDenemeSetup,
  onNavigateTab,
  onResumeExamSession,
  onPracticeTopic,
  generalTalentSubjects,
  generalCultureSubjects,
  onSubjectClick,
  mistakesBankCount,
}) => {
  // 1. Günlük Hedef & Bugün Çözülen Soru Sayısı
  const [todaySolved, setTodaySolved] = useState<number>(0);
  const dailyGoal = userProfile.dailyGoal && userProfile.dailyGoal > 0 ? userProfile.dailyGoal : 60;

  // 2. Leitner Aralıklı Tekrar İstatistikleri
  const [leitnerDueCount, setLeitnerDueCount] = useState<number>(0);

  // 3. Kaldığın Yerden Devam Et (Aktif Oturum veya Son Konu)
  const [activeSession, setActiveSession] = useState<ActiveExamSession | null>(null);
  const [lastActivity, setLastActivity] = useState<LastActivityInfo | null>(null);

  // 4. Zayıf Konu Önerisi
  const [weakTopic, setWeakTopic] = useState<{
    topicTitle: string;
    subjectTitle: string;
    reasonText: string;
    percentage: number;
    wrongCount: number;
  }>({
    topicTitle: 'Matematik — Sayı ve Kesir Problemleri',
    subjectTitle: 'Matematik',
    reasonText: 'KPSS sınavında her yıl en çok soru gelen ve en çok hata yapılan konu alanı',
    percentage: 58,
    wrongCount: 6,
  });

  // Verileri yükleme ve yerel event dinleyicileri
  useEffect(() => {
    loadDynamicData();

    const handleSync = () => loadDynamicData();
    const handleExamSession = () => loadDynamicData();
    const handleProfile = () => loadDynamicData();

    window.addEventListener('kpss_sync_completed', handleSync);
    window.addEventListener('kpss_spaced_repetition_updated', handleSync);
    window.addEventListener('kpss_exam_session_updated', handleExamSession);
    window.addEventListener('kpss_exam_session_cleared', handleExamSession);
    window.addEventListener('kpss_profile_updated', handleProfile);

    return () => {
      window.removeEventListener('kpss_sync_completed', handleSync);
      window.removeEventListener('kpss_spaced_repetition_updated', handleSync);
      window.removeEventListener('kpss_exam_session_updated', handleExamSession);
      window.removeEventListener('kpss_exam_session_cleared', handleExamSession);
      window.removeEventListener('kpss_profile_updated', handleProfile);
    };
  }, []);

  const loadDynamicData = () => {
    // A) Bugün çözülen soru sayısı
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const attempts = offlineSyncService.getLocalAttemptsHistory();
      const todayAttempts = attempts.filter((a) => a.answered_at && a.answered_at.startsWith(todayStr));
      
      // Eğer bugün hiç kayıt yoksa varsayılan taban aktiviteden ilham al
      if (todayAttempts.length > 0) {
        setTodaySolved(todayAttempts.length);
      } else {
        const weekly = studentProgressService.getWeeklyActivity();
        const dayMap: Record<number, string> = { 1: 'Pzt', 2: 'Sal', 3: 'Çar', 4: 'Per', 5: 'Cum', 6: 'Cmt', 0: 'Paz' };
        const currentDayKey = dayMap[new Date().getDay()] || 'Pzt';
        const found = weekly.find((w) => w.day === currentDayKey);
        setTodaySolved(found ? Math.min(found.count, dailyGoal) : 24);
      }
    } catch {
      setTodaySolved(24);
    }

    // B) Aralıklı Tekrar (Leitner)
    try {
      const summary = spacedRepetitionService.getSummaryStats();
      setLeitnerDueCount(summary.dueTodayCount);
    } catch {
      setLeitnerDueCount(0);
    }

    // C) Aktif Sınav Oturumu
    try {
      const session = examSessionService.getActiveSession();
      setActiveSession(session);
    } catch {
      setActiveSession(null);
    }

    // D) Son Aktivite
    try {
      const rawAct = localStorage.getItem('kpss_last_activity_v1');
      if (rawAct) {
        setLastActivity(JSON.parse(rawAct));
      } else {
        setLastActivity({
          type: 'topic',
          title: 'Tarih — İslamiyet Öncesi Türk Tarihi',
          subtitle: 'En son incelenen konu ünitesi',
          subjectTitle: 'Tarih',
          topicTitle: 'İslamiyet Öncesi Türk Tarihi',
          questionCount: 20,
        });
      }
    } catch {
      setLastActivity(null);
    }

    // E) Zayıf Konu Tespiti (Akıllı AI Önerisi)
    try {
      const topicList = studentProgressService.getTopicAnalysisList();
      // En çok yanlışı olan veya başarı oranı en düşük olan konuyu bul
      const withAttempts = topicList.filter((t) => t.solvedCount > 0);
      if (withAttempts.length > 0) {
        // En düşük yüzdeye sahip konuyu sırala
        const sorted = [...withAttempts].sort((a, b) => a.percentage - b.percentage);
        const worst = sorted[0];
        setWeakTopic({
          topicTitle: `${worst.subjectTitle} — ${worst.topicTitle}`,
          subjectTitle: worst.subjectTitle,
          reasonText: `Başarı oranınız %${worst.percentage} (${worst.wrongCount} yanlış cevap). Netinizi artırmak için önerilir.`,
          percentage: worst.percentage,
          wrongCount: worst.wrongCount,
        });
      } else {
        // Genel radar skorlarına göre en düşük puanlı dersin konusunu öner
        const radar = studentProgressService.getRadarScores();
        const lowestSubject = [...radar].sort((a, b) => a.score - b.score)[0];
        setWeakTopic({
          topicTitle: `${lowestSubject?.label || 'Matematik'} — Problemler`,
          subjectTitle: lowestSubject?.label || 'Matematik',
          reasonText: 'KPSS Genel Yetenek bölümünde en belirleyici ve pratik gerektiren alan.',
          percentage: lowestSubject?.score || 60,
          wrongCount: 5,
        });
      }
    } catch {
      // fallback
    }
  };

  const progressPercent = Math.min(100, Math.round((todaySolved / dailyGoal) * 100));
  const isGoalReached = todaySolved >= dailyGoal;

  // Tarih formatlama
  const todayDateStr = new Date().toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const todayDayStr = new Date().toLocaleDateString('tr-TR', { weekday: 'long' });

  return (
    <div className="action-home-wrapper" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 1. ÜST KARŞILAMA VE GÜN BİLGİSİ */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: 'var(--kpss-text, #0F172A)',
                margin: 0,
                letterSpacing: '-0.3px',
              }}
            >
              Merhaba, {userProfile.name.split(' ')[0] || 'Öğrenci'} 👋
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: 'rgba(79, 70, 229, 0.12)',
                color: 'var(--kpss-primary, #4F46E5)',
                padding: '2px 8px',
                borderRadius: '6px',
              }}
            >
              {userProfile.examType || 'KPSS Lisans'}
            </span>
          </div>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--kpss-text-muted, #64748B)',
              margin: '4px 0 0 0',
            }}
          >
            Bugün senin için hazırlanan çalışma panoroması ve hızlı aksiyonlar:
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
            border: '1px solid var(--kpss-border, #E2E8F0)',
            borderRadius: '12px',
            padding: '8px 14px',
            gap: '10px',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
          }}
        >
          <Calendar size={18} color="var(--kpss-primary, #4F46E5)" />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)' }}>
              {todayDateStr}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--kpss-text-muted, #64748B)' }}>
              {todayDayStr}
            </div>
          </div>
        </div>
      </div>

      {/* 2. HIZLI BAŞLA AKSİYON ÇUBUĞU (TEK TIKLA BAŞLATMA) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        {/* Hızlı 20'li Deneme */}
        <button
          onClick={onStartQuick20}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
            border: '1px solid var(--kpss-border, #E2E8F0)',
            borderRadius: '14px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: 'rgba(79, 70, 229, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Zap size={20} color="var(--kpss-primary, #4F46E5)" />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)' }}>
              20'li Hızlı Deneme
            </div>
            <div style={{ fontSize: '11px', color: 'var(--kpss-text-muted, #64748B)' }}>
              25 Dk • Karma Sınav
            </div>
          </div>
        </button>

        {/* Günlük Çalışma Planı */}
        <button
          onClick={() => onStartPlan(1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
            border: '1px solid var(--kpss-border, #E2E8F0)',
            borderRadius: '14px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Play size={18} color="#10B981" />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)' }}>
              Günün Planını Başlat
            </div>
            <div style={{ fontSize: '11px', color: 'var(--kpss-text-muted, #64748B)' }}>
              Tarih & Türkçe Üniteleri
            </div>
          </div>
        </button>

        {/* Hata Havuzunu Çöz */}
        <button
          onClick={onStartMistakesBank}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
            border: '1px solid var(--kpss-border, #E2E8F0)',
            borderRadius: '14px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={18} color="#EF4444" />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)' }}>
              Hata Havuzum
            </div>
            <div style={{ fontSize: '11px', color: 'var(--kpss-text-muted, #64748B)' }}>
              {mistakesBankCount > 0 ? `${mistakesBankCount} yanlış soru birikti` : 'Tüm yanlışları tekrar et'}
            </div>
          </div>
        </button>

        {/* Tam Deneme Sınavı Kur */}
        <button
          onClick={onOpenDenemeSetup}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
            border: '1px solid var(--kpss-border, #E2E8F0)',
            borderRadius: '14px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Clock size={18} color="#F59E0B" />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)' }}>
              Deneme Sınavı Kur
            </div>
            <div style={{ fontSize: '11px', color: 'var(--kpss-text-muted, #64748B)' }}>
              120 Soru / Branş Seç
            </div>
          </div>
        </button>
      </div>

      {/* 3. ANA AKSİYON PANOROMASI (2 SÜTUNLU KARTLAR) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '18px',
          marginBottom: '26px',
        }}
      >
        {/* A) GÜNLÜK HEDEF KARTI */}
        <div
          style={{
            backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
            border: '1px solid var(--kpss-border, #E2E8F0)',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Target size={18} color="var(--kpss-primary, #4F46E5)" />
                </div>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)' }}>
                  Günlük Soru Hedefi
                </span>
              </div>
              <button
                onClick={() => onNavigateTab('settings')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--kpss-primary, #4F46E5)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Hedefi Değiştir
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
              <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--kpss-text, #0F172A)' }}>
                {todaySolved}
              </span>
              <span style={{ fontSize: '16px', color: 'var(--kpss-text-muted, #64748B)', fontWeight: 600 }}>
                / {dailyGoal} Soru
              </span>
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: isGoalReached ? 'rgba(16, 185, 129, 0.15)' : 'rgba(79, 70, 229, 0.1)',
                  color: isGoalReached ? '#10B981' : 'var(--kpss-primary, #4F46E5)',
                }}
              >
                %{progressPercent} Tamamlandı
              </span>
            </div>

            {/* İlerleme Çubuğu */}
            <div
              style={{
                width: '100%',
                height: '10px',
                backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                borderRadius: '999px',
                overflow: 'hidden',
                marginBottom: '10px',
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  backgroundColor: isGoalReached ? '#10B981' : 'var(--kpss-primary, #4F46E5)',
                  borderRadius: '999px',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>

          <div
            style={{
              fontSize: '12px',
              color: 'var(--kpss-text-muted, #64748B)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '4px',
            }}
          >
            {isGoalReached ? (
              <span style={{ color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={14} /> Harika! Bugünün hedefine ulaştın 🎉
              </span>
            ) : (
              <span>Hedefe {dailyGoal - todaySolved} soru kaldı. Azimli çalışmaya devam et!</span>
            )}
            <button
              onClick={onStartQuick20}
              style={{
                backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--kpss-text, #0F172A)',
                cursor: 'pointer',
              }}
            >
              +20 Soru Çöz
            </button>
          </div>
        </div>

        {/* B) ARALIKLI TEKRAR (LEITNER) BİLDİRİMİ */}
        <div
          style={{
            backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
            border: '1px solid var(--kpss-border, #E2E8F0)',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: leitnerDueCount > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <RotateCcw size={18} color={leitnerDueCount > 0 ? '#F59E0B' : '#10B981'} />
                </div>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)' }}>
                  Aralıklı Tekrar (Leitner)
                </span>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  backgroundColor: leitnerDueCount > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: leitnerDueCount > 0 ? '#F59E0B' : '#10B981',
                }}
              >
                {leitnerDueCount > 0 ? `${leitnerDueCount} Soru Vadesi Geldi` : 'Tamamı Güncel'}
              </span>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--kpss-text-muted, #64748B)', margin: '0 0 14px 0', lineHeight: 1.4 }}>
              {leitnerDueCount > 0
                ? `Hafıza eğrisine göre unutulma eşiğine gelen ${leitnerDueCount} soruyu bugün tekrar ederek kalıcı hafızaya aktarın.`
                : 'Bugün için vadesi gelen tüm tekrar kartları tamamlandı. Hafıza taze tutuldu!'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {leitnerDueCount > 0 ? (
              <button
                onClick={onStartLeitnerQuiz}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: '#F59E0B',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(245, 158, 11, 0.25)',
                }}
              >
                <RotateCcw size={15} />
                <span>Tekrarları Başlat ({leitnerDueCount})</span>
              </button>
            ) : (
              <button
                onClick={() => onNavigateTab('errors')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                  color: 'var(--kpss-text, #0F172A)',
                  border: '1px solid var(--kpss-border, #E2E8F0)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <span>Hafıza Kutularını Gör</span>
                <ChevronRight size={15} />
              </button>
            )}
          </div>
        </div>

        {/* C) KALDIĞIN YERDEN DEVAM ET KARTI */}
        <div
          style={{
            backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
            border: activeSession ? '2px solid rgba(79, 70, 229, 0.35)' : '1px solid var(--kpss-border, #E2E8F0)',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(79, 70, 229, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Play size={17} color="var(--kpss-primary, #4F46E5)" />
                </div>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)' }}>
                  Kaldığın Yerden Devam Et
                </span>
              </div>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  backgroundColor: activeSession ? '#FEF2F2' : 'var(--kpss-subtle-bg, #F1F5F9)',
                  color: activeSession ? '#DC2626' : 'var(--kpss-text-muted, #64748B)',
                  border: activeSession ? '1px solid #FECACA' : undefined,
                }}
              >
                {activeSession ? '🔴 Devam Eden Sınav' : 'Son Çalışılan'}
              </span>
            </div>

            {activeSession ? (
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)', marginBottom: '4px' }}>
                  {activeSession.templateName || 'KPSS Deneme Sınavı'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--kpss-text-muted, #64748B)', marginBottom: '12px' }}>
                  Soru {activeSession.currentIndex + 1} / {activeSession.questions.length} • Kalan Süre:{' '}
                  {Math.floor(activeSession.timeRemainingSeconds / 60)} dk {activeSession.timeRemainingSeconds % 60} sn
                </div>
              </div>
            ) : lastActivity ? (
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)', marginBottom: '4px' }}>
                  {lastActivity.title}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--kpss-text-muted, #64748B)', marginBottom: '12px' }}>
                  {lastActivity.subtitle} • {lastActivity.questionCount || 20} Soru
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)', marginBottom: '4px' }}>
                  Tarih — İslamiyet Öncesi Türk Tarihi
                </div>
                <div style={{ fontSize: '12px', color: 'var(--kpss-text-muted, #64748B)', marginBottom: '12px' }}>
                  20 Soru • KPSS sınavında her yıl 2-3 soru gelen temel konu
                </div>
              </div>
            )}
          </div>

          <div>
            {activeSession && onResumeExamSession ? (
              <button
                onClick={() => onResumeExamSession(activeSession)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: 'var(--kpss-primary, #4F46E5)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
                }}
              >
                <Play size={15} fill="#FFFFFF" />
                <span>Sınava Devam Et ({activeSession.currentIndex + 1}. Soru)</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  if (onPracticeTopic && lastActivity?.topicTitle) {
                    onPracticeTopic(lastActivity.topicTitle, lastActivity.subjectTitle);
                  } else {
                    onStartPlan(1);
                  }
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: 'var(--kpss-primary, #4F46E5)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Play size={15} fill="#FFFFFF" />
                <span>Kaldığın Yerden Devam Et</span>
              </button>
            )}
          </div>
        </div>

        {/* D) AKILLI ZAYIF KONU ÖNERİSİ (AI RECOMMENDATION) */}
        <div
          style={{
            backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
            border: '1px solid var(--kpss-border, #E2E8F0)',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TrendingUp size={18} color="#EF4444" />
                </div>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)' }}>
                  Zayıf Konu Önerisi
                </span>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  color: '#DC2626',
                }}
              >
                Net Kazanım Fırsatı
              </span>
            </div>

            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)', marginBottom: '4px' }}>
              {weakTopic.topicTitle}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--kpss-text-muted, #64748B)', margin: '0 0 12px 0', lineHeight: 1.4 }}>
              {weakTopic.reasonText}
            </p>
          </div>

          <button
            onClick={() => {
              if (onPracticeTopic) {
                onPracticeTopic(weakTopic.topicTitle, weakTopic.subjectTitle);
              } else {
                onStartPlan(3);
              }
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
              color: 'var(--kpss-primary, #4F46E5)',
              border: '1px solid var(--kpss-border, #E2E8F0)',
              borderRadius: '10px',
              padding: '10px 14px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          >
            <Sparkles size={15} />
            <span>Bu Konuda Pratik Yap</span>
          </button>
        </div>
      </div>

      {/* 4. DERSLER & KONULAR ÖZETİ (KOMPAKT SEÇİM ALANI) */}
      <div style={{ marginBottom: '28px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: 'var(--kpss-text, #0F172A)',
                margin: 0,
              }}
            >
              Dersler & Konu İlerlemeleri
            </h2>
            <div style={{ fontSize: '12px', color: 'var(--kpss-text-muted, #64748B)' }}>
              Çözmek istediğin dersin üzerine tıklayarak üniteleri keşfet
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('subjects')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--kpss-primary, #4F46E5)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>Tüm Dersler</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Genel Yetenek Dersleri */}
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--kpss-text-muted, #64748B)', marginBottom: '8px' }}>
          KPSS Genel Yetenek
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          {generalTalentSubjects.map((sub) => (
            <div
              key={sub.id}
              onClick={() => onSubjectClick(sub)}
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
                border: '1px solid var(--kpss-border, #E2E8F0)',
                borderRadius: '14px',
                padding: '14px 16px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                gap: '12px',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <BookOpen size={18} color="var(--kpss-primary, #4F46E5)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)' }}>
                    {sub.title}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--kpss-primary, #4F46E5)' }}>
                    %{sub.percentage}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--kpss-text-muted, #64748B)', marginBottom: '6px' }}>
                  {sub.unitCount} Ünite
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '6px',
                    backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                    borderRadius: '999px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${sub.percentage}%`,
                      height: '100%',
                      backgroundColor: 'var(--kpss-primary, #4F46E5)',
                      borderRadius: '999px',
                    }}
                  />
                </div>
              </div>
              <ChevronRight size={16} color="var(--kpss-text-muted, #94A3B8)" />
            </div>
          ))}
        </div>

        {/* Genel Kültür Dersleri */}
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--kpss-text-muted, #64748B)', marginBottom: '8px' }}>
          KPSS Genel Kültür
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '12px',
          }}
        >
          {generalCultureSubjects.map((sub) => (
            <div
              key={sub.id}
              onClick={() => onSubjectClick(sub)}
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
                border: '1px solid var(--kpss-border, #E2E8F0)',
                borderRadius: '14px',
                padding: '14px 16px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                gap: '12px',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <BookOpen size={18} color="var(--kpss-primary, #4F46E5)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)' }}>
                    {sub.title}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--kpss-primary, #4F46E5)' }}>
                    %{sub.percentage}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--kpss-text-muted, #64748B)', marginBottom: '6px' }}>
                  {sub.unitCount} Ünite
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '6px',
                    backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                    borderRadius: '999px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${sub.percentage}%`,
                      height: '100%',
                      backgroundColor: 'var(--kpss-primary, #4F46E5)',
                      borderRadius: '999px',
                    }}
                  />
                </div>
              </div>
              <ChevronRight size={16} color="var(--kpss-text-muted, #94A3B8)" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
