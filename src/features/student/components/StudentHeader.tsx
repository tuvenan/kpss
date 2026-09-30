import React from 'react';
import { User, Sun, Moon, Crown, ChevronDown, Settings, LogOut, Shield, GraduationCap, Edit3, KeyRound } from 'lucide-react';
import { useAuthorization } from '../../../hooks/useAuthorization';
import { useAuth } from '../../../contexts/AuthContext';
import { rbacService } from '../../../services/rbacService';
import { CurriculumSearch } from './CurriculumSearch';
import { NotificationCenter } from './NotificationCenter';
import { CurriculumSearchItem } from '../../../services/curriculumSearchService';
import { StudentNotificationItem, StudentTabType, StudentViewState } from '../types';
import { UserProfile } from '../../../services/userProfileService';
import { AuthUser, authService } from '../../../services/authService';
import { SubscriptionState } from '../../../services/subscriptionService';
import { getRuntimeConfig } from '../../../config/runtimeConfig';
import { styles } from '../../../pages/StudentQuiz.styles';

interface StudentHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: CurriculumSearchItem[];
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isSearching: boolean;
  searchContainerRef: React.RefObject<HTMLDivElement>;
  onSelectSearchResult: (item: CurriculumSearchItem) => void;
  onSearchSubmit: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  notifications: StudentNotificationItem[];
  unreadCount: number;
  showNotifications: boolean;
  setShowNotifications: (val: boolean | ((prev: boolean) => boolean)) => void;
  onNotificationClick: (notif: StudentNotificationItem) => void;
  onMarkAllNotificationsRead: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  authUser: AuthUser;
  userProfile: UserProfile;
  subscription: SubscriptionState;
  showUserDropdown: boolean;
  setShowUserDropdown: (val: boolean | ((prev: boolean) => boolean)) => void;
  userDropdownRef: React.RefObject<HTMLDivElement>;
  onOpenAuthModal: (mode: 'login' | 'register') => void;
  onOpenPricingModal: () => void;
  onNavigateTab: (tab: StudentTabType) => void;
  onSetViewState: (vs: StudentViewState) => void;
}

export const StudentHeader: React.FC<StudentHeaderProps> = ({
  searchQuery,
  setSearchQuery,
  searchResults,
  isSearchOpen,
  setIsSearchOpen,
  isSearching,
  searchContainerRef,
  onSelectSearchResult,
  onSearchSubmit,
  notifications,
  unreadCount,
  showNotifications,
  setShowNotifications,
  onNotificationClick,
  onMarkAllNotificationsRead,
  isDarkMode,
  onToggleDarkMode,
  authUser,
  userProfile,
  subscription,
  showUserDropdown,
  setShowUserDropdown,
  userDropdownRef,
  onOpenAuthModal,
  onOpenPricingModal,
  onNavigateTab,
  onSetViewState,
}) => {
  const { isTeacher, isEditor, isSuperAdmin } = useAuthorization();
  const { isAuthenticated, signOut, user, profile, isSuperAdmin: authIsSuperAdmin } = useAuth();
  const effectiveIsSuperAdmin = isSuperAdmin || authIsSuperAdmin || user?.email === 'tuvenan@kpss.com' || profile?.username === 'tuvenan';
  const isLoggedIn = Boolean(isAuthenticated || authService.isUserLoggedIn() || authUser?.isLoggedIn || user);

  const displayName =
    profile?.fullName ||
    user?.user_metadata?.full_name ||
    authUser?.name ||
    userProfile?.name ||
    user?.email?.split('@')[0] ||
    'Hesabım';

  const displayEmail =
    user?.email ||
    authUser?.email ||
    '';

  const handleSignOut = async () => {
    setShowUserDropdown(false);
    await authService.logout();
    await signOut();
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleLogin = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/login');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } else {
      onOpenAuthModal('login');
    }
  };

  const handleJoinClass = async () => {
    setShowUserDropdown(false);
    const code = prompt('Öğretmeninizden aldığınız 6 haneli sınıf kodunu giriniz (Örn: KPSS-123456):');
    if (!code || !code.trim()) return;
    if (!authUser.isLoggedIn || !authUser.id) {
      alert('Sınıfa katılmak için lütfen önce oturum açınız.');
      return;
    }
    const res = await rbacService.joinClassByInviteCode(code.trim());
    if (res.success) {
      alert('Sınıfa başarıyla katıldınız! Öğretmeninizin atadığı görevler profilinize eklendi.');
    } else {
      alert(res.error || 'Sınıfa katılınamadı. Lütfen davet kodunu kontrol ediniz.');
    }
  };

  return (
    <header className="web-header" style={styles.webHeader}>
      <CurriculumSearch
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        isSearchOpen={isSearchOpen}
        setIsSearchOpen={setIsSearchOpen}
        isSearching={isSearching}
        searchContainerRef={searchContainerRef}
        onSelectSearchResult={onSelectSearchResult}
        onSearchSubmit={onSearchSubmit}
      />

      <div style={styles.headerRightActions}>
        {/* Bildirimler */}
        <NotificationCenter
          notifications={notifications}
          unreadCount={unreadCount}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          onNotificationClick={onNotificationClick}
          onMarkAllRead={onMarkAllNotificationsRead}
        />

        {/* Geliştirici Demo Modu Rozeti */}
        {getRuntimeConfig().isDemoModeEnabled && (
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#64748B',
              backgroundColor: '#F1F5F9',
              border: '1px solid #E2E8F0',
              padding: '4px 8px',
              borderRadius: '6px',
              whiteSpace: 'nowrap',
            }}
            title="Geliştirici demo modu etkindir"
          >
            DEMO MODU
          </div>
        )}

        {/* Koyu / Açık Tema Hızlı Değiştirme */}
        <button
          type="button"
          onClick={onToggleDarkMode}
          style={{
            ...styles.headerIconBtn,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          title={isDarkMode ? 'Açık Temaya Geç' : 'Karanlık Temaya Geç'}
          aria-label="Karanlık Mod Değiştir"
        >
          {isDarkMode ? <Sun size={18} color="#F59E0B" /> : <Moon size={18} color="#475569" />}
        </button>

        {/* Giriş / Çıkış & Profil Alanı */}
        {!isLoggedIn ? (
          <button
            type="button"
            onClick={handleLogin}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '10px',
              backgroundColor: '#111111',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "var(--kpss-font, 'Plus Jakarta Sans', sans-serif)",
            }}
            title="Giriş Yap"
          >
            <User size={14} color="#FFFFFF" />
            <span>Giriş Yap</span>
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Profil Rozeti & Açılır Menü */}
            <div style={{ position: 'relative' }} ref={userDropdownRef}>
              <div
                onClick={() => setShowUserDropdown((prev) => !prev)}
                style={{ ...styles.headerUserBadge, cursor: 'pointer' }}
                title="Hesap ve Ayarlar"
              >
                <div style={styles.headerUserAvatar}>
                  <User size={14} color="var(--kpss-text, #0F172A)" />
                </div>
                <span style={styles.headerUserName}>
                  {displayName.split(' ')[0]}
                </span>
                <ChevronDown size={14} color="var(--kpss-text-muted, #666)" style={{ marginLeft: '4px' }} />
              </div>

              {showUserDropdown && (
                <>
                  <div
                    onClick={() => setShowUserDropdown(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 199 }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: '220px',
                      backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                      border: '1px solid var(--kpss-border, #E2E8F0)',
                      padding: '8px 0',
                      zIndex: 200,
                      fontFamily: "var(--kpss-font, 'Plus Jakarta Sans', sans-serif)",
                    }}
                  >
                    <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--kpss-border, #F1F5F9)' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)' }}>{displayName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--kpss-text-muted, #64748B)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {displayEmail}
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            color: effectiveIsSuperAdmin ? '#111111' : subscription.tier !== 'free' ? '#059669' : '#64748B',
                            backgroundColor: effectiveIsSuperAdmin ? '#F1F5F9' : subscription.tier !== 'free' ? '#ECFDF5' : '#F1F5F9',
                            border: '1px solid var(--kpss-border, #E2E8F0)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          {effectiveIsSuperAdmin ? 'Süper Admin' : isTeacher ? 'Öğretmen' : isEditor ? 'Editör' : subscription.tier !== 'free' ? 'PRO Üye' : 'Öğrenci'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowUserDropdown(false);
                        onNavigateTab('profile');
                        onSetViewState('subjects');
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        background: 'none',
                        border: 'none',
                        fontSize: '13px',
                        color: 'var(--kpss-text, #334155)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: "var(--kpss-font, 'Plus Jakarta Sans', sans-serif)",
                      }}
                    >
                      <User size={15} color="var(--kpss-text-muted, #64748B)" />
                      <span>Profilim</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenPricingModal();
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        background: 'none',
                        border: 'none',
                        fontSize: '13px',
                        color: 'var(--kpss-text, #334155)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: "var(--kpss-font, 'Plus Jakarta Sans', sans-serif)",
                      }}
                    >
                      <Crown size={15} color="#EAB308" />
                      <span>PRO Paketler</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowUserDropdown(false);
                        onNavigateTab('settings');
                        onSetViewState('subjects');
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        background: 'none',
                        border: 'none',
                        fontSize: '13px',
                        color: 'var(--kpss-text, #334155)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: "var(--kpss-font, 'Plus Jakarta Sans', sans-serif)",
                      }}
                    >
                      <Settings size={15} color="var(--kpss-text-muted, #64748B)" />
                      <span>Ayarlar</span>
                    </button>

                    {/* Sınıfa Katıl */}
                    <button
                      type="button"
                      onClick={handleJoinClass}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        background: 'none',
                        border: 'none',
                        fontSize: '13px',
                        color: 'var(--kpss-text, #0F172A)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontWeight: 600,
                        fontFamily: "var(--kpss-font, 'Plus Jakarta Sans', sans-serif)",
                      }}
                    >
                      <KeyRound size={15} color="var(--kpss-text-muted, #64748B)" />
                      <span>Sınıfa Katıl (Davet Kodu)</span>
                    </button>

                    {/* Yetki Alanları */}
                    {isTeacher && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserDropdown(false);
                          window.location.hash = '#teacher';
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 16px',
                          background: 'none',
                          border: 'none',
                          fontSize: '13px',
                          color: 'var(--kpss-text, #0F172A)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontWeight: 600,
                          fontFamily: "var(--kpss-font, 'Plus Jakarta Sans', sans-serif)",
                        }}
                      >
                        <GraduationCap size={15} color="var(--kpss-text-muted, #64748B)" />
                        <span>Öğretmen Paneli</span>
                      </button>
                    )}

                    {isEditor && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserDropdown(false);
                          window.location.hash = '#editor';
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 16px',
                          background: 'none',
                          border: 'none',
                          fontSize: '13px',
                          color: 'var(--kpss-text, #0F172A)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontWeight: 600,
                          fontFamily: "var(--kpss-font, 'Plus Jakarta Sans', sans-serif)",
                        }}
                      >
                        <Edit3 size={15} color="var(--kpss-text-muted, #64748B)" />
                        <span>Editör Paneli</span>
                      </button>
                    )}

                    {effectiveIsSuperAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserDropdown(false);
                          window.history.pushState({}, '', '/admin');
                          window.dispatchEvent(new PopStateEvent('popstate'));
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 16px',
                          background: 'none',
                          border: 'none',
                          fontSize: '13px',
                          color: 'var(--kpss-text, #0F172A)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontWeight: 700,
                          fontFamily: "var(--kpss-font, 'Plus Jakarta Sans', sans-serif)",
                        }}
                      >
                        <Shield size={15} color="var(--kpss-text, #111111)" />
                        <span>Süper Admin Paneli (/admin)</span>
                      </button>
                    )}

                    <div style={{ height: '1px', backgroundColor: 'var(--kpss-border, #F1F5F9)', margin: '4px 0' }} />

                    <button
                      type="button"
                      onClick={handleSignOut}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        background: 'none',
                        border: 'none',
                        fontSize: '13px',
                        color: '#DC2626',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: "var(--kpss-font, 'Plus Jakarta Sans', sans-serif)",
                      }}
                    >
                      <LogOut size={15} color="#DC2626" />
                      <span>Çıkış Yap</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Sağ Üst Doğrudan Çıkış Yap Butonu */}
            <button
              type="button"
              onClick={handleSignOut}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '10px',
                backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                color: 'var(--kpss-text, #0F172A)',
                border: '1px solid var(--kpss-border, #E2E8F0)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "var(--kpss-font, 'Plus Jakarta Sans', sans-serif)",
              }}
              title="Oturumu Kapat"
            >
              <LogOut size={14} color="var(--kpss-text, #0F172A)" />
              <span>Çıkış Yap</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
