import React from 'react';
import { ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import { adminStyles } from '../AdminPanel.styles';
import { getRuntimeConfig } from '../../../config/runtimeConfig';

interface AdminLoginProps {
  passwordInput: string;
  setPasswordInput: (val: string) => void;
  authError: string;
  onLogin: (e: React.FormEvent) => void;
  onNavigateStudent: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
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
          <ShieldCheck size={36} color="#4F46E5" />
        </div>
        <div style={adminStyles.loginBadge}>KPSS YÖNETİCİ GİRİŞİ</div>
        {isDemoModeEnabled && (
          <div style={{ fontSize: '11px', color: '#64748B', backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', padding: '4px 8px', borderRadius: '6px', marginBottom: '12px', display: 'inline-block' }}>
            🛠️ Geliştirici Demo Modu (Varsayılan: admin2026)
          </div>
        )}
        <h2 style={adminStyles.loginTitle}>Admin Kontrol Merkezi</h2>
        <p style={adminStyles.loginSubtitle}>
          İçerik, soru bankası ve sınav müfredatını yönetmek için lütfen yetkili şifrenizi giriniz.
        </p>

        <form onSubmit={onLogin} style={{ width: '100%' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={adminStyles.label}>Yönetici Şifresi</label>
            <input
              type="password"
              placeholder="Şifrenizi giriniz..."
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              style={adminStyles.inputField}
              autoFocus
            />
          </div>

          {authError && (
            <div style={adminStyles.loginErrorBox}>
              <AlertCircle size={16} color="#DC2626" style={{ marginRight: '8px', flexShrink: 0 }} />
              <span>{authError}</span>
            </div>
          )}

          <button type="submit" style={adminStyles.loginBtn}>
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
