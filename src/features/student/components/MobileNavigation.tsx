import React from 'react';
import { Home, BookOpen, AlertTriangle, User, Settings } from 'lucide-react';
import { StudentTabType, StudentViewState } from '../types';
import { styles } from '../../../pages/StudentQuiz.styles';

interface MobileNavigationProps {
  activeTab: StudentTabType;
  viewState: StudentViewState;
  onNavigateTab: (tab: StudentTabType) => void;
  onSetViewState: (vs: StudentViewState) => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeTab,
  viewState,
  onNavigateTab,
  onSetViewState,
}) => {
  return (
    <nav className="web-mobile-bottom-nav" style={styles.mobileBottomNav}>
      <button
        onClick={() => {
          onNavigateTab('home');
          onSetViewState('subjects');
        }}
        style={{
          ...styles.mobileBottomNavItem,
          ...(activeTab === 'home' && viewState === 'subjects' ? styles.mobileBottomNavItemActive : {}),
        }}
      >
        <Home
          size={20}
          color={
            activeTab === 'home' && viewState === 'subjects'
              ? 'var(--kpss-primary, #4F46E5)'
              : 'var(--kpss-text-muted, #64748B)'
          }
        />
        <span
          style={{
            ...styles.mobileBottomNavLabel,
            color:
              activeTab === 'home' && viewState === 'subjects'
                ? 'var(--kpss-primary, #4F46E5)'
                : 'var(--kpss-text-muted, #64748B)',
            fontWeight: activeTab === 'home' && viewState === 'subjects' ? 700 : 500,
          }}
        >
          Ana Sayfa
        </span>
      </button>

      <button
        onClick={() => {
          onNavigateTab('subjects');
          onSetViewState('subjects');
        }}
        style={{
          ...styles.mobileBottomNavItem,
          ...(activeTab === 'subjects' && viewState === 'subjects' ? styles.mobileBottomNavItemActive : {}),
        }}
      >
        <BookOpen
          size={20}
          color={
            activeTab === 'subjects' && viewState === 'subjects'
              ? 'var(--kpss-primary, #4F46E5)'
              : 'var(--kpss-text-muted, #64748B)'
          }
        />
        <span
          style={{
            ...styles.mobileBottomNavLabel,
            color:
              activeTab === 'subjects' && viewState === 'subjects'
                ? 'var(--kpss-primary, #4F46E5)'
                : 'var(--kpss-text-muted, #64748B)',
            fontWeight: activeTab === 'subjects' && viewState === 'subjects' ? 700 : 500,
          }}
        >
          Dersler
        </span>
      </button>

      <button
        onClick={() => {
          onNavigateTab('errors');
          onSetViewState('subjects');
        }}
        style={{
          ...styles.mobileBottomNavItem,
          ...(activeTab === 'errors' && viewState === 'subjects' ? styles.mobileBottomNavItemActive : {}),
        }}
      >
        <AlertTriangle
          size={20}
          color={
            activeTab === 'errors' && viewState === 'subjects'
              ? 'var(--kpss-primary, #4F46E5)'
              : 'var(--kpss-text-muted, #64748B)'
          }
        />
        <span
          style={{
            ...styles.mobileBottomNavLabel,
            color:
              activeTab === 'errors' && viewState === 'subjects'
                ? 'var(--kpss-primary, #4F46E5)'
                : 'var(--kpss-text-muted, #64748B)',
            fontWeight: activeTab === 'errors' && viewState === 'subjects' ? 700 : 500,
          }}
        >
          Hatalarım
        </span>
      </button>

      <button
        onClick={() => {
          onNavigateTab('profile');
          onSetViewState('subjects');
        }}
        style={{
          ...styles.mobileBottomNavItem,
          ...(activeTab === 'profile' && viewState === 'subjects' ? styles.mobileBottomNavItemActive : {}),
        }}
      >
        <User
          size={20}
          color={
            activeTab === 'profile' && viewState === 'subjects'
              ? 'var(--kpss-primary, #4F46E5)'
              : 'var(--kpss-text-muted, #64748B)'
          }
        />
        <span
          style={{
            ...styles.mobileBottomNavLabel,
            color:
              activeTab === 'profile' && viewState === 'subjects'
                ? 'var(--kpss-primary, #4F46E5)'
                : 'var(--kpss-text-muted, #64748B)',
            fontWeight: activeTab === 'profile' && viewState === 'subjects' ? 700 : 500,
          }}
        >
          Profil
        </span>
      </button>

      <button
        onClick={() => {
          onNavigateTab('settings');
          onSetViewState('subjects');
        }}
        style={{
          ...styles.mobileBottomNavItem,
          ...(activeTab === 'settings' && viewState === 'subjects' ? styles.mobileBottomNavItemActive : {}),
        }}
      >
        <Settings
          size={20}
          color={
            activeTab === 'settings' && viewState === 'subjects'
              ? 'var(--kpss-primary, #4F46E5)'
              : 'var(--kpss-text-muted, #64748B)'
          }
        />
        <span
          style={{
            ...styles.mobileBottomNavLabel,
            color:
              activeTab === 'settings' && viewState === 'subjects'
                ? 'var(--kpss-primary, #4F46E5)'
                : 'var(--kpss-text-muted, #64748B)',
            fontWeight: activeTab === 'settings' && viewState === 'subjects' ? 700 : 500,
          }}
        >
          Ayarlar
        </span>
      </button>
    </nav>
  );
};
