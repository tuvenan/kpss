import React from 'react';
import { ShieldCheck, AlertCircle, ArrowLeft, User, Lock } from 'lucide-react';
import { adminStyles } from '../AdminPanel.styles';
import { getRuntimeConfig } from '../../../config/runtimeConfig';

interface AdminLoginProps {
  usernameInput: string;
  setUsernameInput: (val: string) => void;
  passwordInput: string;
  setPasswordInput: (val: string) => void;
  authError: string;
  onLogin: (e: React.FormEvent) => void;
  onNavigateStudent: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  usernameInput,
  setUsernameInput,
  passwordInput,
  setPasswordInput,
  authError,
  onLogin,
  onNavigateStudent,
}) => {
  const { isDemoModeEnabled } = getRuntimeConfig();

  return (
    <div style={adminStyles.loginBackdrop}>
      <div style={adminStyles.loginCard}>
        <div style={adminStyles.loginIconBox}>
          <ShieldCheck size={36} color="#0F172A" />
        </div>
        <div style={adminStyles.loginBadge}>KPSS YÖNETİCİ GİRİŞİ</div>
        {isDemoModeEnabled && (
          <div
            style={{
              fontSize: '11px',
              color: '#64748B',
              backgroundColor: '#F1F5F9',
              border: '1px solid #E2E8F0',
              padding: '4px 8px',
              borderRadius: '6px',
              marginBottom: '12px',
              display: 'inline-block',
            }}
          >
            🛠️ Yönetici Hesabı: <strong>tuvenan</strong>
          </div>
        )}
        <h2 style={adminStyles.loginTitle}>Admin Kontrol Merkezi</h2>
        <p style={adminStyles.loginSubtitle}>
          İçerik, soru bankası ve yönetim merkezine erişmek için lütfen yönetici giriş bilgilerinizi giriniz.
        </p>

        <form onSubmit={onLogin} style={{ width: '100%' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={adminStyles.label}>Kullanıcı Adı</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                required
                placeholder="Örn: tuvenan"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                style={adminStyles.inputField}
                autoFocus
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={adminStyles.label}>Yönetici Şifresi</label>
            <input
              type="password"
              required
              placeholder="Şifrenizi giriniz..."
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              style={adminStyles.inputField}
            />
          </div>

          {authError && (
            <div style={adminStyles.loginErrorBox}>
              <AlertCircle size={16} color="#DC2626" style={{ marginRight: '8px', flexShrink: 0 }} />
              <span>{authError}</span>
            </div>
          )}

          <button
            type="submit"
            style={{
              ...adminStyles.loginBtn,
              backgroundColor: '#111111',
              color: '#FFFFFF',
              fontWeight: 700,
            }}
          >
            Giriş Yap →
          </button>
        </form>

        <div style={adminStyles.loginFooter}>
          <button onClick={onNavigateStudent} style={adminStyles.backLinkBtn}>
            <ArrowLeft size={15} style={{ marginRight: '6px' }} />
            Öğrenci Arayüzüne Dön
          </button>
        </div>
      </div>
    </div>
  );
};
