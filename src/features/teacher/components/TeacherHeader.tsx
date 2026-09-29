import React from 'react';
import { User, Bell } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { TeacherTabType } from '../types';

interface TeacherHeaderProps {
  activeTab: TeacherTabType;
}

const TAB_TITLES: Record<TeacherTabType, { title: string; subtitle: string }> = {
  overview: {
    title: 'Genel Bakış',
    subtitle: 'Sınıflarınızın ve öğrencilerinizin genel akademik durumu',
  },
  classes: {
    title: 'Sınıf Yönetimi',
    subtitle: 'Sınıflarınızı oluşturun, düzenleyin ve öğrenci davet kodlarını yönetin',
  },
  students: {
    title: 'Bağlı Öğrenciler',
    subtitle: 'Yalnızca sizin sınıflarınıza kayıtlı öğrencilerin performans ve deneme analizi',
  },
  assignments: {
    title: 'Ödev ve Çalışma Atama',
    subtitle: 'Sınıflarınıza veya belirli öğrencilere quiz, deneme ve çalışma planı atayın',
  },
  question_sets: {
    title: 'Özel Soru Setleri',
    subtitle: 'Yalnızca kendi sınıflarınızın görebileceği özel soru havuzları oluşturun',
  },
};

export const TeacherHeader: React.FC<TeacherHeaderProps> = ({ activeTab }) => {
  const { user, profile } = useAuth();
  const info = TAB_TITLES[activeTab] || { title: 'Öğretmen Paneli', subtitle: '' };

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 32px',
        backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
        borderBottom: '1px solid var(--kpss-border, #E2E8F0)',
        fontFamily: "var(--kpss-font, 'Plus Jakarta Sans', sans-serif)",
      }}
    >
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--kpss-text, #0F172A)', margin: 0 }}>
          {info.title}
        </h1>
        <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
          {info.subtitle}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
              border: '1px solid var(--kpss-border, #E2E8F0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <User size={18} color="var(--kpss-text, #0F172A)" />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)' }}>
              {profile?.fullName || user?.email?.split('@')[0] || 'Öğretmen'}
            </div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>
              Eğitmen Hesabı
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
