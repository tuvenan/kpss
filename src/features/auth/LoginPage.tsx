import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getDefaultRouteForRole, resolveActiveRole } from '../../types/auth';
import { LogIn, User, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { signInWithUsername, signInWithGoogle, isAuthenticated, roles, isLoading: authLoading } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Zaten giriş yapmışsa rolüne göre yönlendir
  useEffect(() => {
    if (isAuthenticated && roles.length > 0) {
      const route = getDefaultRouteForRole(resolveActiveRole(roles));
      window.history.replaceState({}, '', route);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, [isAuthenticated, roles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setError('Lütfen kullanıcı adınızı giriniz.');
      return;
    }
    if (!password) {
      setError('Lütfen parolanızı giriniz.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signInWithUsername(cleanUsername, password);
      if (!result.success) {
        setError(result.error || 'Kullanıcı adı veya parola hatalı.');
      }
      // Başarılıysa AuthContext oturumu yükler → useEffect yönlendirir
    } catch {
      setError('Beklenmedik bir hata oluştu. Lütfen tekrar deneyiniz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  if (authLoading) {
    return (
      <div style={styles.pageContainer}>
        <div style={styles.loadingBox}>
          <Loader2 size={24} color="var(--kpss-text, #0F172A)" style={{ animation: 'kpss-spin 1s linear infinite' }} />
          <p style={styles.loadingText}>Oturum kontrol ediliyor...</p>
          <style>{`@keyframes kpss-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      <div style={styles.card}>
        {/* Logo / Başlık */}
        <div style={styles.headerArea}>
          <div style={styles.iconBox}>
            <LogIn size={24} color="var(--kpss-text, #0F172A)" />
          </div>
          <h1 style={styles.title}>Giriş Yap</h1>
          <p style={styles.subtitle}>Çalışmalarına kaldığın yerden devam etmek için giriş yap.</p>
        </div>

        {/* Hata Mesajı */}
        {error && (
          <div style={styles.errorBox}>
            <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Kullanıcı Adı */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Kullanıcı Adı</label>
            <div style={styles.inputWrapper}>
              <User size={16} color="#94A3B8" style={styles.inputIcon} />
              <input
                type="text"
                placeholder="kullanici_adi"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                style={styles.input}
              />
            </div>
          </div>

          {/* Parola */}
          <div style={styles.fieldGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={styles.label}>Parola</label>
              <button
                type="button"
                onClick={() => navigateTo('/forgot-password')}
                style={styles.forgotLink}
              >
                Parolamı unuttum
              </button>
            </div>
            <div style={styles.inputWrapper}>
              <Lock size={16} color="#94A3B8" style={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                style={styles.input}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} color="#94A3B8" /> : <Eye size={16} color="#94A3B8" />}
              </button>
            </div>
          </div>

          {/* Beni Hatırla */}
          <label style={styles.rememberRow}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={styles.checkbox}
            />
            <span style={styles.rememberText}>Beni hatırla</span>
          </label>

          {/* Giriş Butonu */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              ...styles.submitBtn,
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        {/* Ayırıcı */}
        <div style={styles.dividerRow}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>veya</span>
          <div style={styles.dividerLine} />
        </div>

        {/* Google ile Giriş */}
        <button
          type="button"
          onClick={async () => {
            setError('');
            const res = await signInWithGoogle();
            if (!res.success && res.error) {
              setError(res.error);
            }
          }}
          disabled={isSubmitting}
          style={styles.googleBtn}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          <span>Google ile devam et</span>
        </button>

        {/* Alt Bağlantı */}
        <div style={styles.footer}>
          <span style={styles.footerText}>Hesabın yok mu? </span>
          <button
            type="button"
            onClick={() => navigateTo('/register')}
            style={styles.linkBtn}
          >
            Hesap Oluştur
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  pageContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    backgroundColor: 'var(--kpss-page-bg, #F8FAFC)',
    fontFamily: "var(--kpss-font, 'Plus Jakarta Sans', sans-serif)",
  },
  loadingBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  loadingText: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--kpss-text, #0F172A)',
    margin: 0,
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
    border: '1px solid var(--kpss-border, #E2E8F0)',
    borderRadius: '16px',
    padding: '32px 28px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
  },
  headerArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: '24px',
  },
  iconBox: {
    width: '52px',
    height: '52px',
    borderRadius: '14px',
    backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '14px',
  },
  title: {
    fontSize: '22px',
    fontWeight: 700,
    color: 'var(--kpss-text, #0F172A)',
    margin: '0 0 6px 0',
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748B',
    margin: 0,
    lineHeight: 1.5,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '10px',
    color: '#B91C1C',
    fontSize: '13px',
    fontWeight: 500,
    marginBottom: '16px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--kpss-text, #0F172A)',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    height: '44px',
    padding: '0 40px 0 38px',
    borderRadius: '10px',
    border: '1px solid var(--kpss-border, #E2E8F0)',
    fontSize: '14px',
    color: 'var(--kpss-text, #0F172A)',
    backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
    outline: 'none',
    boxSizing: 'border-box',
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: 0,
  },
  forgotLink: {
    background: 'none',
    border: 'none',
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748B',
    cursor: 'pointer',
    padding: 0,
  },
  rememberRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    accentColor: '#111111',
  },
  rememberText: {
    fontSize: '13px',
    color: '#64748B',
  },
  submitBtn: {
    width: '100%',
    height: '46px',
    backgroundColor: '#111111',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 600,
    marginTop: '4px',
  },
  footer: {
    marginTop: '20px',
    textAlign: 'center',
    paddingTop: '16px',
    borderTop: '1px solid var(--kpss-border, #E2E8F0)',
  },
  footerText: {
    fontSize: '13px',
    color: '#64748B',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--kpss-text, #0F172A)',
    fontWeight: 700,
    fontSize: '13px',
    cursor: 'pointer',
    padding: 0,
    textDecoration: 'underline',
  },
  dividerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '20px 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: 'var(--kpss-border, #E2E8F0)',
  },
  dividerText: {
    fontSize: '12px',
    color: '#94A3B8',
    fontWeight: 500,
  },
  googleBtn: {
    width: '100%',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
    border: '1px solid var(--kpss-border, #E2E8F0)',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--kpss-text, #0F172A)',
    cursor: 'pointer',
  },
};
