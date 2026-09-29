import React from 'react';
import {
  LayoutDashboard,
  FolderTree,
  HelpCircle,
  PackagePlus,
  AlertTriangle,
  Users,
  Palette,
  Settings,
  ArrowLeft,
  LogOut,
  Layers,
  Shield,
  FileText,
} from 'lucide-react';
import { AdminTabType } from '../types';
import { adminStyles } from '../AdminPanel.styles';

interface AdminSidebarProps {
  activeTab: AdminTabType;
  setActiveTab: (tab: AdminTabType) => void;
  questionsCount: number;
  onNavigateStudent: () => void;
  onLogout: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  questionsCount,
  onNavigateStudent,
  onLogout,
}) => {
  return (
    <aside style={adminStyles.sidebar}>
      {/* Logo & Başlık */}
      <div style={adminStyles.sidebarBrand}>
        <div style={adminStyles.brandIconBox}>
          <Layers size={22} color="#FFFFFF" />
        </div>
        <div>
          <div style={adminStyles.brandTitle}>KPSS Panel</div>
          <div style={adminStyles.brandBadge}>YÖNETİCİ MERKEZİ</div>
        </div>
      </div>

      {/* Menü Öğeleri */}
      <nav style={adminStyles.sidebarNav}>
        <button
          onClick={() => setActiveTab('dashboard')}
          style={{
            ...adminStyles.navItem,
            backgroundColor: activeTab === 'dashboard' ? '#1E293B' : 'transparent',
            color: activeTab === 'dashboard' ? '#FFFFFF' : '#94A3B8',
            fontWeight: activeTab === 'dashboard' ? 600 : 400,
          }}
        >
          <LayoutDashboard size={18} color={activeTab === 'dashboard' ? '#818CF8' : '#64748B'} />
          <span>Genel Bakış</span>
        </button>

        <button
          onClick={() => setActiveTab('curriculum')}
          style={{
            ...adminStyles.navItem,
            backgroundColor: activeTab === 'curriculum' ? '#1E293B' : 'transparent',
            color: activeTab === 'curriculum' ? '#FFFFFF' : '#94A3B8',
            fontWeight: activeTab === 'curriculum' ? 600 : 400,
          }}
        >
          <FolderTree size={18} color={activeTab === 'curriculum' ? '#818CF8' : '#64748B'} />
          <span>Müfredat & İçerik</span>
        </button>

        <button
          onClick={() => setActiveTab('questions')}
          style={{
            ...adminStyles.navItem,
            backgroundColor: activeTab === 'questions' ? '#1E293B' : 'transparent',
            color: activeTab === 'questions' ? '#FFFFFF' : '#94A3B8',
            fontWeight: activeTab === 'questions' ? 600 : 400,
          }}
        >
          <HelpCircle size={18} color={activeTab === 'questions' ? '#818CF8' : '#64748B'} />
          <span>Soru Bankası</span>
          {questionsCount > 0 && <span style={adminStyles.navCountBadge}>{questionsCount}</span>}
        </button>

        <button
          onClick={() => setActiveTab('bulk_packages')}
          style={{
            ...adminStyles.navItem,
            backgroundColor: activeTab === 'bulk_packages' ? '#1E293B' : 'transparent',
            color: activeTab === 'bulk_packages' ? '#FFFFFF' : '#94A3B8',
            fontWeight: activeTab === 'bulk_packages' ? 600 : 400,
          }}
        >
          <PackagePlus size={18} color={activeTab === 'bulk_packages' ? '#818CF8' : '#64748B'} />
          <span>Toplu Paket & JSON</span>
        </button>

        <button
          onClick={() => setActiveTab('error_pool')}
          style={{
            ...adminStyles.navItem,
            backgroundColor: activeTab === 'error_pool' ? '#1E293B' : 'transparent',
            color: activeTab === 'error_pool' ? '#FFFFFF' : '#94A3B8',
            fontWeight: activeTab === 'error_pool' ? 600 : 400,
          }}
        >
          <AlertTriangle size={18} color={activeTab === 'error_pool' ? '#818CF8' : '#64748B'} />
          <span>Hata Havuzu Analizi</span>
        </button>

        <button
          onClick={() => setActiveTab('student_data')}
          style={{
            ...adminStyles.navItem,
            backgroundColor: activeTab === 'student_data' ? '#1E293B' : 'transparent',
            color: activeTab === 'student_data' ? '#FFFFFF' : '#94A3B8',
            fontWeight: activeTab === 'student_data' ? 600 : 400,
          }}
        >
          <Users size={18} color={activeTab === 'student_data' ? '#818CF8' : '#64748B'} />
          <span>Öğrenci & Veri</span>
        </button>

        <button
          onClick={() => setActiveTab('users_roles')}
          style={{
            ...adminStyles.navItem,
            backgroundColor: activeTab === 'users_roles' ? '#1E293B' : 'transparent',
            color: activeTab === 'users_roles' ? '#FFFFFF' : '#94A3B8',
            fontWeight: activeTab === 'users_roles' ? 600 : 400,
          }}
        >
          <Shield size={18} color={activeTab === 'users_roles' ? '#818CF8' : '#64748B'} />
          <span>Kullanıcılar & Roller</span>
        </button>

        <button
          onClick={() => setActiveTab('audit_logs')}
          style={{
            ...adminStyles.navItem,
            backgroundColor: activeTab === 'audit_logs' ? '#1E293B' : 'transparent',
            color: activeTab === 'audit_logs' ? '#FFFFFF' : '#94A3B8',
            fontWeight: activeTab === 'audit_logs' ? 600 : 400,
          }}
        >
          <FileText size={18} color={activeTab === 'audit_logs' ? '#818CF8' : '#64748B'} />
          <span>Denetim Kayıtları</span>
        </button>

        <button
          onClick={() => setActiveTab('theme_editor')}
          style={{
            ...adminStyles.navItem,
            backgroundColor: activeTab === 'theme_editor' ? '#1E293B' : 'transparent',
            color: activeTab === 'theme_editor' ? '#FFFFFF' : '#94A3B8',
            fontWeight: activeTab === 'theme_editor' ? 600 : 400,
          }}
        >
          <Palette size={18} color={activeTab === 'theme_editor' ? '#818CF8' : '#64748B'} />
          <span>Tema & Görsel Stil</span>
        </button>

        <button
          onClick={() => setActiveTab('system_settings')}
          style={{
            ...adminStyles.navItem,
            backgroundColor: activeTab === 'system_settings' ? '#1E293B' : 'transparent',
            color: activeTab === 'system_settings' ? '#FFFFFF' : '#94A3B8',
            fontWeight: activeTab === 'system_settings' ? 600 : 400,
          }}
        >
          <Settings size={18} color={activeTab === 'system_settings' ? '#818CF8' : '#64748B'} />
          <span>Sistem & Depolama</span>
        </button>
      </nav>

      {/* Sidebar Alt Butonlar */}
      <div style={adminStyles.sidebarFooter}>
        <button onClick={onNavigateStudent} style={adminStyles.sidebarStudentBtn}>
          <ArrowLeft size={16} style={{ marginRight: '8px' }} />
          Öğrenci Görünümü
        </button>
        <button onClick={onLogout} style={adminStyles.sidebarLogoutBtn}>
          <LogOut size={16} style={{ marginRight: '8px' }} />
          Oturumu Kapat
        </button>
      </div>
    </aside>
  );
};
