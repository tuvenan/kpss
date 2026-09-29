import React from 'react';
import {
  BookOpen,
  Layers,
  FolderTree,
  HelpCircle,
  Plus,
  PackagePlus,
  Users,
} from 'lucide-react';
import { Subject, Unit } from '../../../types';
import { AdminTabType, ErrorPoolStats } from '../types';
import { adminStyles } from '../AdminPanel.styles';

interface DashboardViewProps {
  subjectsCount: number;
  unitsCount: number;
  topicsCount: number;
  questionsCount: number;
  currentSubject?: Subject;
  currentUnit?: Unit;
  isCloud: boolean;
  isSecretActive: boolean;
  errorPoolStats: ErrorPoolStats | null;
  onNavigateTab: (tab: AdminTabType) => void;
  onOpenNewQuestionModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  subjectsCount,
  unitsCount,
  topicsCount,
  questionsCount,
  currentSubject,
  currentUnit,
  isCloud,
  isSecretActive,
  errorPoolStats,
  onNavigateTab,
  onOpenNewQuestionModal,
}) => {
  return (
    <div>
      {/* İstatistik Kartları */}
      <div style={adminStyles.statsGrid}>
        <div style={adminStyles.statCard}>
          <div style={{ ...adminStyles.statIconBox, backgroundColor: '#EEF2FF' }}>
            <BookOpen size={22} color="#4F46E5" />
          </div>
          <div>
            <div style={adminStyles.statLabel}>Toplam Ders</div>
            <div style={adminStyles.statValue}>{subjectsCount}</div>
          </div>
        </div>

        <div style={adminStyles.statCard}>
          <div style={{ ...adminStyles.statIconBox, backgroundColor: '#F0FDF4' }}>
            <Layers size={22} color="#16A34A" />
          </div>
          <div>
            <div style={adminStyles.statLabel}>Aktif Ünite</div>
            <div style={adminStyles.statValue}>{unitsCount}</div>
          </div>
        </div>

        <div style={adminStyles.statCard}>
          <div style={{ ...adminStyles.statIconBox, backgroundColor: '#FEF3C7' }}>
            <FolderTree size={22} color="#D97706" />
          </div>
          <div>
            <div style={adminStyles.statLabel}>Aktif Konu</div>
            <div style={adminStyles.statValue}>{topicsCount}</div>
          </div>
        </div>

        <div style={adminStyles.statCard}>
          <div style={{ ...adminStyles.statIconBox, backgroundColor: '#F3E8FF' }}>
            <HelpCircle size={22} color="#9333EA" />
          </div>
          <div>
            <div style={adminStyles.statLabel}>Seçili Alandaki Soru</div>
            <div style={adminStyles.statValue}>{questionsCount}</div>
          </div>
        </div>
      </div>

      {/* Hızlı İşlemler Paneli */}
      <div style={adminStyles.sectionCard}>
        <h3 style={adminStyles.sectionTitle}>Hızlı Yönetim Kısayolları</h3>
        <p style={adminStyles.sectionSub}>Sık kullanılan yönetim işlemlerini tek tıkla başlatın.</p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
          <button
            onClick={() => onNavigateTab('curriculum')}
            style={adminStyles.actionPillBtn}
          >
            <Plus size={16} color="#4F46E5" style={{ marginRight: '8px' }} />
            Yeni Ders / Ünite Ekle
          </button>

          <button
            onClick={() => {
              onNavigateTab('questions');
              onOpenNewQuestionModal();
            }}
            style={adminStyles.actionPillBtn}
          >
            <HelpCircle size={16} color="#059669" style={{ marginRight: '8px' }} />
            Yeni Soru Yaz
          </button>

          <button
            onClick={() => onNavigateTab('bulk_packages')}
            style={adminStyles.actionPillBtn}
          >
            <PackagePlus size={16} color="#D97706" style={{ marginRight: '8px' }} />
            20 Soruluk Paket Yükle
          </button>

          <button
            onClick={() => onNavigateTab('student_data')}
            style={adminStyles.actionPillBtn}
          >
            <Users size={16} color="#7C3AED" style={{ marginRight: '8px' }} />
            Öğrenci Verilerini İncele
          </button>
        </div>
      </div>

      {/* Sistem Özeti */}
      <div style={adminStyles.twoColGrid}>
        <div style={adminStyles.sectionCard}>
          <h3 style={adminStyles.sectionTitle}>Veritabanı & Depolama</h3>
          <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={adminStyles.infoRow}>
              <span style={adminStyles.infoLabel}>Depolama Motoru:</span>
              <span style={adminStyles.infoValue}>{isCloud ? 'Supabase PostgreSQL' : 'Yerel Hafıza (LocalStorage)'}</span>
            </div>
            <div style={adminStyles.infoRow}>
              <span style={adminStyles.infoLabel}>RLS Secret Bypass:</span>
              <span style={adminStyles.infoValue}>{isSecretActive ? 'Etkin (Admin Yetkisi Var)' : 'Pasif'}</span>
            </div>
            <div style={adminStyles.infoRow}>
              <span style={adminStyles.infoLabel}>Seçili Ders:</span>
              <span style={adminStyles.infoValue}>{currentSubject?.title || 'Seçilmedi'}</span>
            </div>
            <div style={adminStyles.infoRow}>
              <span style={adminStyles.infoLabel}>Seçili Ünite:</span>
              <span style={adminStyles.infoValue}>{currentUnit ? `${currentUnit.unitNumber}. ${currentUnit.title}` : 'Seçilmedi'}</span>
            </div>
          </div>
        </div>

        <div style={adminStyles.sectionCard}>
          <h3 style={adminStyles.sectionTitle}>Hata Havuzu Özeti</h3>
          <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={adminStyles.infoRow}>
              <span style={adminStyles.infoLabel}>Çözülmemiş Hatalı Soru:</span>
              <span style={{ ...adminStyles.infoValue, color: '#DC2626', fontWeight: 700 }}>
                {errorPoolStats?.unresolvedCount || 0}
              </span>
            </div>
            <div style={adminStyles.infoRow}>
              <span style={adminStyles.infoLabel}>Çözülmüş Hatalar:</span>
              <span style={{ ...adminStyles.infoValue, color: '#16A34A', fontWeight: 700 }}>
                {errorPoolStats?.resolvedCount || 0}
              </span>
            </div>
            <div style={adminStyles.infoRow}>
              <span style={adminStyles.infoLabel}>Son Test Kontrolü:</span>
              <span style={adminStyles.infoValue}>Güncel</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
