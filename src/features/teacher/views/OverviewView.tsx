import React from 'react';
import {
  GraduationCap,
  Users,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { TeacherOverviewMetrics } from '../../../services/teacherService';
import { TeacherTabType } from '../types';

interface OverviewViewProps {
  metrics: TeacherOverviewMetrics;
  onNavigateTab: (tab: any) => void;
  onOpenNewClass: () => void;
  onOpenNewAssignment: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  metrics,
  onNavigateTab,
  onOpenNewClass,
  onOpenNewAssignment,
}) => {
  const cards = [
    {
      title: 'Toplam Sınıf',
      value: metrics.totalClasses,
      sub: 'Aktif derslikler',
      icon: <GraduationCap size={22} color="var(--kpss-text, #0F172A)" />,
      tab: 'classes',
    },
    {
      title: 'Bağlı Öğrenci',
      value: metrics.activeStudentsCount,
      sub: 'Aktif sınıf üyeleri',
      icon: <Users size={22} color="var(--kpss-text, #0F172A)" />,
      tab: 'students',
    },
    {
      title: 'Yayındaki Ödevler',
      value: metrics.pendingAssignmentsCount,
      sub: 'Çözülmeyi bekleyen',
      icon: <FileCheck size={22} color="var(--kpss-text, #0F172A)" />,
      tab: 'assignments',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* 1. ÜST İSTATİSTİK KARTLARI */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
        }}
      >
        {cards.map((c, i) => (
          <div
            key={i}
            onClick={() => onNavigateTab(c.tab)}
            style={{
              backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
              border: '1px solid var(--kpss-border, #E2E8F0)',
              borderRadius: '14px',
              padding: '22px 20px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              transition: 'transform 0.15s, border-color 0.15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>
                {c.title}
              </span>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {c.icon}
              </div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--kpss-text, #0F172A)', marginBottom: '4px' }}>
              {c.value}
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* HIZLI AKSİYONLAR */}
      <div
        style={{
          backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
          border: '1px solid var(--kpss-border, #E2E8F0)',
          borderRadius: '14px',
          padding: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)', margin: 0 }}>
            Hızlı Eğitmen İşlemleri
          </h3>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0 0' }}>
            Yeni bir sınıf başlatın veya öğrencilerinize anında çalışma atayın.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={onOpenNewClass}
            style={{
              padding: '9px 16px',
              backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
              border: '1px solid var(--kpss-border, #E2E8F0)',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--kpss-text, #0F172A)',
              cursor: 'pointer',
            }}
          >
            + Sınıf Oluştur
          </button>
          <button
            type="button"
            onClick={onOpenNewAssignment}
            style={{
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
            + Ödev Ata
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* 2. DÜŞÜK PERFORMANS UYARILARI */}
        <div
          style={{
            backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
            border: '1px solid var(--kpss-border, #E2E8F0)',
            borderRadius: '14px',
            padding: '22px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <AlertTriangle size={18} color="#D97706" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)', margin: 0 }}>
              Düşük Performans Uyarıları ({metrics.lowPerformanceAlerts.length})
            </h3>
          </div>

          {metrics.lowPerformanceAlerts.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#166534', fontSize: '13px', backgroundColor: '#F0FDF4', borderRadius: '8px' }}>
              ✓ Tüm öğrencileriniz mevcut çalışmalarda başarı eşiğinin üzerinde.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {metrics.lowPerformanceAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#FEF3C7',
                    border: '1px solid #FDE68A',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#92400E' }}>
                      {alert.studentName}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#B45309', backgroundColor: '#FDE68A', padding: '2px 6px', borderRadius: '4px' }}>
                      %{alert.recentScore} Başarı
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#78350F' }}>
                    {alert.issue}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. SON TAMAMLANAN ÇALIŞMALAR */}
        <div
          style={{
            backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
            border: '1px solid var(--kpss-border, #E2E8F0)',
            borderRadius: '14px',
            padding: '22px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <CheckCircle size={18} color="#166534" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)', margin: 0 }}>
              Son Tamamlanan Çalışmalar ({metrics.recentSubmissions.length})
            </h3>
          </div>

          {metrics.recentSubmissions.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
              Henüz tamamlanan bir çalışma kaydı bulunmuyor.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {metrics.recentSubmissions.map((sub, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--kpss-subtle-bg, #F8FAFC)',
                    border: '1px solid var(--kpss-border, #E2E8F0)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)' }}>
                      {sub.studentName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>
                      {sub.assignmentTitle}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: sub.score >= 50 ? '#166534' : '#DC2626' }}>
                      %{sub.score}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                      {new Date(sub.completedAt).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
