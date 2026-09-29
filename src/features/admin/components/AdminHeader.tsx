import React from 'react';
import { Key } from 'lucide-react';
import { AdminTabType } from '../types';
import { adminStyles } from '../AdminPanel.styles';

interface AdminHeaderProps {
  activeTab: AdminTabType;
  isCloud: boolean;
  isSecretActive: boolean;
  onOpenSecretModal: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTab,
  isCloud,
  isSecretActive,
  onOpenSecretModal,
}) => {
  const getTabTitle = (tab: AdminTabType) => {
    switch (tab) {
      case 'dashboard':
        return 'Genel Bakış & İstatistikler';
      case 'curriculum':
        return 'Müfredat & İçerik Düzenleyici';
      case 'questions':
        return 'Soru Bankası & Yönetimi';
      case 'bulk_packages':
        return 'Toplu Paket Yükleme & JSON';
      case 'error_pool':
        return 'Hata Havuzu & Raporlama';
      case 'student_data':
        return 'Öğrenci & Test İlerleme Yönetimi';
      case 'theme_editor':
        return 'Görsel Stil & Tema Editörü';
      case 'system_settings':
        return 'Sistem & Depolama Ayarları';
      default:
        return '';
    }
  };

  return (
    <header style={adminStyles.topHeader}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h1 style={adminStyles.headerTitle}>{getTabTitle(activeTab)}</h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Supabase Bulut Durumu Rozeti */}
        <div
          style={{
            ...adminStyles.statusBadge,
            backgroundColor: isCloud ? '#ECFDF5' : '#FEF9C3',
            borderColor: isCloud ? '#A7F3D0' : '#FDE047',
            color: isCloud ? '#065F46' : '#854D0E',
          }}
          title={isCloud ? 'Supabase Bulut Veritabanı Aktif' : 'Tarayıcı Yerel Depolama (LocalStorage) Aktif'}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isCloud ? '#10B981' : '#EAB308',
            }}
          />
          <span>{isCloud ? 'Bulut Bağlı' : 'Yerel Mod'}</span>
        </div>

        {/* Secret Key Butonu */}
        <button
          onClick={onOpenSecretModal}
          style={{
            ...adminStyles.headerActionBtn,
            backgroundColor: isSecretActive ? '#EEF2FF' : '#F8FAFC',
            borderColor: isSecretActive ? '#C7D2FE' : '#E2E8F0',
            color: isSecretActive ? '#4338CA' : '#475569',
          }}
        >
          <Key size={14} style={{ marginRight: '6px' }} />
          {isSecretActive ? 'Secret Key Aktif' : 'Secret Key Ekle'}
        </button>
      </div>
    </header>
  );
};
