import React from 'react';
import { BookOpen, Home, Timer, AlertCircle, User, Settings } from 'lucide-react';
import { StudentTabType, StudentViewState } from '../types';
import { styles } from '../../../pages/StudentQuiz.styles';

interface StudentSidebarProps {
  activeTab: StudentTabType;
  viewState: StudentViewState;
  isDenemeMode: boolean;
  onNavigateTab: (tab: StudentTabType) => void;
  onSetViewState: (vs: StudentViewState) => void;
  onOpenDenemeSetup: () => void;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({
  activeTab,
  viewState,
  isDenemeMode,
  onNavigateTab,
  onSetViewState,
  onOpenDenemeSetup,
}) => {
  return (
    <aside className="web-sidebar-desktop" style={styles.webSidebar}>
      <div>
        <div style={styles.sidebarBrand}>
          <BookOpen size={24} color="var(--kpss-text, #111)" style={{ marginRight: '10px', flexShrink: 0 }} />
          <div>
            <div style={styles.sidebarLogoTitle}>KPSS</div>
            <div style={styles.sidebarLogoSubtitle}>Hedefine Odaklan</div>
          </div>
        </div>

        <nav style={styles.sidebarNav}>
          <button
            onClick={() => {
              onNavigateTab('home');
              onSetViewState('subjects');
            }}
            style={activeTab === 'home' && viewState === 'subjects' && !isDenemeMode ? styles.sidebarNavItemActive : styles.sidebarNavItem}
          >
            <Home size={18} style={{ marginRight: '12px' }} />
            <span>Ana Sayfa</span>
          </button>

          <button
            onClick={onOpenDenemeSetup}
            style={isDenemeMode && viewState === 'quiz' ? styles.sidebarNavItemActive : styles.sidebarNavItem}
          >
            <Timer
              size={18}
              color={isDenemeMode && viewState === 'quiz' ? 'var(--kpss-text, #111)' : 'var(--kpss-text-muted, #666)'}
              style={{ marginRight: '12px', flexShrink: 0 }}
            />
            <span>Deneme Sınavı</span>
          </button>

          <button
            onClick={() => {
              onNavigateTab('subjects');
              onSetViewState('subjects');
            }}
            style={activeTab === 'subjects' && viewState === 'subjects' ? styles.sidebarNavItemActive : styles.sidebarNavItem}
          >
            <BookOpen size={18} style={{ marginRight: '12px' }} />
            <span>Dersler</span>
          </button>

          <button
            onClick={() => {
              onNavigateTab('errors');
              onSetViewState('subjects');
            }}
            style={activeTab === 'errors' && viewState === 'subjects' ? styles.sidebarNavItemActive : styles.sidebarNavItem}
          >
            <AlertCircle size={18} style={{ marginRight: '12px' }} />
            <span>Hatalarım</span>
          </button>

          <button
            onClick={() => {
              onNavigateTab('profile');
              onSetViewState('subjects');
            }}
            style={activeTab === 'profile' && viewState === 'subjects' ? styles.sidebarNavItemActive : styles.sidebarNavItem}
          >
            <User size={18} style={{ marginRight: '12px' }} />
            <span>Profil</span>
          </button>

          <button
            onClick={() => {
              onNavigateTab('settings');
              onSetViewState('subjects');
            }}
            style={activeTab === 'settings' && viewState === 'subjects' ? styles.sidebarNavItemActive : styles.sidebarNavItem}
          >
            <Settings size={18} style={{ marginRight: '12px' }} />
            <span>Ayarlar</span>
          </button>
        </nav>
      </div>

      {/* Sol Alt Motivasyon Alanı */}
      <div style={styles.sidebarQuoteBox}>
        <div style={styles.quoteMark}>66</div>
        <div style={styles.quoteContent}>Küçük adımlar büyük hedeflere götürür.</div>
        <div style={styles.quoteFooter}>Başarı seninle.</div>
      </div>
    </aside>
  );
};
