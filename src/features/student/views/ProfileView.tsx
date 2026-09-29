import React from 'react';
import { User, Settings } from 'lucide-react';
import { UserProfile } from '../../../services/userProfileService';
import { studentProgressService } from '../../../services/studentProgressService';
import { CompetencyRadarCard } from '../../../components/CompetencyRadarCard';
import { StudentAnalyticsCards } from '../../../components/StudentAnalyticsCards';
import { StudyCalendarCard } from '../../../components/StudyCalendarCard';
import { DetailedTopicAnalysisCard } from '../../../components/DetailedTopicAnalysisCard';
import { styles } from '../../../pages/StudentQuiz.styles';

interface ProfileViewProps {
  userProfile: UserProfile;
  onNavigateSettings: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userProfile,
  onNavigateSettings,
}) => {
  const overallStats = studentProgressService.getOverallStats();
  const weeklyData = studentProgressService.getWeeklyActivity();

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', width: '100%' }}>
      <h1 style={styles.mainTitle}>Öğrenci Profili</h1>
      <div
        style={{
          backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
          borderRadius: '16px',
          border: '1px solid var(--kpss-border, #EFEFF2)',
          padding: '24px',
          marginBottom: '20px',
          boxShadow: 'var(--kpss-shadow, 0 2px 10px rgba(0,0,0,0.02))',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'var(--kpss-subtle-bg, #F2F2F5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={28} color="var(--kpss-text, #111)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2
                  style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    margin: '0 0 4px 0',
                    color: 'var(--kpss-text, #111)',
                  }}
                >
                  {userProfile.name || 'Öğrenci'}
                </h2>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                    border: '1px solid var(--kpss-border, #E2E8F0)',
                    color: '#64748B',
                  }}
                >
                  Üye
                </span>
              </div>
              <div style={{ fontSize: '14px', color: 'var(--kpss-text-muted, #64748B)' }}>
                {userProfile.examType} Adayı • Hedef: {userProfile.targetScore}+ Puan
                {userProfile.branch ? ` • ${userProfile.branch}` : ''}
              </div>
            </div>
          </div>
          <button
            onClick={onNavigateSettings}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '10px',
              border: '1px solid var(--kpss-border, #E5E7EB)',
              backgroundColor: 'var(--kpss-subtle-bg, #F9FAFB)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--kpss-text, #111827)',
              transition: 'background-color 0.15s',
            }}
          >
            <Settings size={16} color="var(--kpss-text-muted, #4B5563)" />
            <span>Ayarları Düzenle</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          <div
            style={{
              padding: '14px',
              backgroundColor: 'var(--kpss-subtle-bg, #F9F9FB)',
              borderRadius: '12px',
              border: '1px solid var(--kpss-border, #EFEFF2)',
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--kpss-text-muted, #64748B)', marginBottom: '4px' }}>
              Çözülen Soru
            </div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--kpss-text, #111)' }}>
              {overallStats.totalSolved}
            </div>
          </div>
          <div
            style={{
              padding: '14px',
              backgroundColor: 'var(--kpss-subtle-bg, #F9F9FB)',
              borderRadius: '12px',
              border: '1px solid var(--kpss-border, #EFEFF2)',
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--kpss-text-muted, #64748B)', marginBottom: '4px' }}>
              Başarı Oranı
            </div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10B981' }}>
              %{overallStats.percentage}
            </div>
          </div>
          <div
            style={{
              padding: '14px',
              backgroundColor: 'var(--kpss-subtle-bg, #F9F9FB)',
              borderRadius: '12px',
              border: '1px solid var(--kpss-border, #EFEFF2)',
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--kpss-text-muted, #64748B)', marginBottom: '4px' }}>
              Günlük Hedef
            </div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--kpss-primary, #6366F1)' }}>
              {userProfile.dailyGoal} Soru
            </div>
          </div>
        </div>
      </div>

      {/* 1. BLOK: YETERLİLİK RADARI & KAZANIM-KONU ANALİZİ */}
      <CompetencyRadarCard derslerData={studentProgressService.getRadarScores()} />

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
};
