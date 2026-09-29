import React from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  FileCheck,
  FolderPlus,
  ArrowLeft,
  LogOut,
  Shield,
} from 'lucide-react';
import { TeacherTabType } from '../types';

interface TeacherSidebarProps {
  activeTab: TeacherTabType;
  onSelectTab: (tab: TeacherTabType) => void;
  onNavigateStudent: () => void;
  onLogout: () => void;
  classesCount?: number;
  studentsCount?: number;
}

export const TeacherSidebar: React.FC<TeacherSidebarProps> = ({
  activeTab,
  onSelectTab,
  onNavigateStudent,
  onLogout,
  classesCount = 0,
  studentsCount = 0,
}) => {
  const navItems: { id: TeacherTabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'overview',
      label: 'Genel Bakış',
      icon: <LayoutDashboard size={18} />,
    },
    {
      id: 'classes',
      label: 'Sınıflarım',
      icon: <GraduationCap size={18} />,
      badge: classesCount,
    },
    {
      id: 'students',
      label: 'Öğrenciler',
      icon: <Users size={18} />,
      badge: studentsCount,
    },
    {
      id: 'assignments',
      label: 'Ödevler & Çalışmalar',
      icon: <FileCheck size={18} />,
    },
    {
      id: 'question_sets',
      label: 'Özel Soru Setleri',
      icon: <FolderPlus size={18} />,
    },
  ];

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
        borderRight: '1px solid var(--kpss-border, #E2E8F0)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 16px',
        fontFamily: "var(--kpss-font, 'Plus Jakarta Sans', sans-serif)",
      }}
    >
      <div>
        {/* LOGO & BRAND */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px', padding: '0 8px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#111111',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '18px',
            }}
          >
            Ö
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--kpss-text, #0F172A)' }}>
              Öğretmen Paneli
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>
              KPSS Sınıf Yönetimi
            </div>
          </div>
        </div>

        {/* NAVIGATION ITEMS */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: isActive ? '#111111' : 'transparent',
                  color: isActive ? '#FFFFFF' : 'var(--kpss-text, #0F172A)',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '10px',
                      backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'var(--kpss-subtle-bg, #F1F5F9)',
                      color: isActive ? '#FFFFFF' : '#64748B',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* FOOTER ACTIONS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '16px', borderTop: '1px solid var(--kpss-border, #E2E8F0)' }}>
        <button
          type="button"
          onClick={onNavigateStudent}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: '10px',
            border: '1px solid var(--kpss-border, #E2E8F0)',
            backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
            color: 'var(--kpss-text, #0F172A)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={16} />
          <span>Öğrenci Görünümüne Dön</span>
        </button>

        <button
          type="button"
          onClick={onLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: 'transparent',
            color: '#EF4444',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <LogOut size={16} />
          <span>Çıkış Yap</span>
        </button>
      </div>
    </aside>
  );
};
