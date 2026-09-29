import { useState, useEffect, useRef } from 'react';
import { userProfileService, UserProfile } from '../../../services/userProfileService';
import { authService, AuthUser } from '../../../services/authService';
import { subscriptionService, SubscriptionState } from '../../../services/subscriptionService';
import { spacedRepetitionService } from '../../../services/spacedRepetitionService';
import { themeService, PRESET_THEMES } from '../../../services/themeService';
import { useOnlineStatus } from '../../../services/networkService';
import { getMistakesBankQuestions } from '../../../services/mockExamService';

export const useStudentSession = () => {
  const [userProfile, setUserProfile] = useState<UserProfile>(() => userProfileService.getProfile());
  const [authUser, setAuthUser] = useState<AuthUser>(() => authService.getCurrentUser());
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const [subscription, setSubscription] = useState<SubscriptionState>(() => subscriptionService.getSubscription());
  const [showPricingModal, setShowPricingModal] = useState<boolean>(false);

  const isOnline = useOnlineStatus();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => themeService.getActiveTheme().isDark);
  const [leitnerStats, setLeitnerStats] = useState(() => spacedRepetitionService.getSummaryStats());

  const [mistakesBankCount, setMistakesBankCount] = useState<number>(() => {
    return getMistakesBankQuestions().length;
  });

  useEffect(() => {
    const handleAuthChange = (e: any) => {
      setAuthUser(e?.detail?.user ?? authService.getCurrentUser());
    };
    const handleSubChange = (e: any) => {
      setSubscription(e?.detail?.subscription ?? subscriptionService.getSubscription());
    };
    const handleThemeChange = () => {
      setIsDarkMode(themeService.getActiveTheme().isDark);
    };
    const handleSrChange = () => {
      setLeitnerStats(spacedRepetitionService.getSummaryStats());
    };
    const handleOpenAuthModal = (e: any) => {
      setAuthModalMode(e?.detail?.mode || 'login');
      setShowAuthModal(true);
    };
    const handleMistakesUpdate = (e: any) => {
      const count = e?.detail?.totalCount ?? getMistakesBankQuestions().length;
      setMistakesBankCount(count);
    };
    const handleProfileUpdate = () => {
      setUserProfile(userProfileService.getProfile());
    };

    // Apply active theme on first load
    themeService.applyTheme(themeService.getActiveTheme());

    window.addEventListener('kpss_auth_changed', handleAuthChange);
    window.addEventListener('kpss_subscription_changed', handleSubChange);
    window.addEventListener('kpss_theme_changed', handleThemeChange);
    window.addEventListener('kpss_spaced_repetition_updated', handleSrChange);
    window.addEventListener('kpss_open_auth_modal', handleOpenAuthModal);
    window.addEventListener('kpss_mistakes_bank_updated', handleMistakesUpdate);
    window.addEventListener('kpss_profile_updated', handleProfileUpdate);

    return () => {
      window.removeEventListener('kpss_auth_changed', handleAuthChange);
      window.removeEventListener('kpss_subscription_changed', handleSubChange);
      window.removeEventListener('kpss_theme_changed', handleThemeChange);
      window.removeEventListener('kpss_spaced_repetition_updated', handleSrChange);
      window.removeEventListener('kpss_open_auth_modal', handleOpenAuthModal);
      window.removeEventListener('kpss_mistakes_bank_updated', handleMistakesUpdate);
      window.removeEventListener('kpss_profile_updated', handleProfileUpdate);
    };
  }, []);

  const handleToggleDarkMode = () => {
    const current = themeService.getActiveTheme();
    if (current.isDark) {
      const light = PRESET_THEMES.find((t) => !t.isDark) || PRESET_THEMES[0];
      themeService.setActiveTheme(light);
      setIsDarkMode(false);
    } else {
      const dark = PRESET_THEMES.find((t) => t.isDark) || PRESET_THEMES[1];
      themeService.setActiveTheme(dark);
      setIsDarkMode(true);
    }
  };

  const refreshLeitnerStats = () => {
    setLeitnerStats(spacedRepetitionService.getSummaryStats());
  };

  return {
    userProfile,
    setUserProfile,
    authUser,
    setAuthUser,
    showAuthModal,
    setShowAuthModal,
    authModalMode,
    setAuthModalMode,
    showUserDropdown,
    setShowUserDropdown,
    userDropdownRef,
    subscription,
    setSubscription,
    showPricingModal,
    setShowPricingModal,
    isOnline,
    isDarkMode,
    handleToggleDarkMode,
    leitnerStats,
    setLeitnerStats,
    refreshLeitnerStats,
    mistakesBankCount,
    setMistakesBankCount,
  };
};
