import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getDefaultRouteForRole, resolveActiveRole } from '../../types/auth';
import { UserPlus, User, AtSign, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { signUpWithUsername, isAuthenticated, roles, isLoading: authLoading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isAuthenticated && roles.length > 0) {
      const route = getDefaultRouteForRole(resolveActiveRole(roles));
      window.history.replaceState({}, '', route);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, [isAuthenticated, roles]);

  const validate = (): string | null => {
    if (!fullName.trim()) return 'Ad soyad boş bırakılamaz.';
    const cleanUsername = username.trim();
    if (!cleanUsername) return 'Kullanıcı adı boş bırakılamaz.';
    if (cleanUsername.length < 3 || cleanUsername.length > 30) return 'Kullanıcı adı 3-30 karakter uzunluğunda olmalıdır.';
    if (!/^[a-zA-Z0-9._]+$/.test(cleanUsername)) return 'Kullanıcı adı yalnızca harf, sayı, nokta ve alt çizgi içerebilir.';
    if (cleanUsername.startsWith('.') || cleanUsername.endsWith('.')) return 'Kullanıcı adı nokta ile başlayamaz veya bitemez.';
    if (!email.trim()) return 'E-posta adresi boş bırakılamaz.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Geçerli bir e-posta adresi giriniz.';
    if (password.length < 8) return 'Parola en az 8 karakter olmalıdır.';
    if (password !== passwordConfirm) return 'Parola ve parola tekrarı eşleşmiyor.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signUpWithUsername(
        fullName.trim(),
        username.trim(),
        email.trim(),
        password,
      );

      if (result.success) {
        setSuccess('Hesabınız başarıyla oluşturuldu! Yönlendiriliyorsunuz...');
      } else {
        setError(result.error || 'Kayıt işlemi tamamlanamadı.');
      }
    } catch {
      setError('Beklenmedik bir hata oluştu.');
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <Loader2 size={24} color="var(--kpss-text, #0F172A)" style={{ animation: 'kpss-spin 1s linear infinite' }} />
          <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--kpss-text, #0F172A)', margin: 0 }}>Yükleniyor...</p>
          <style>{`@keyframes kpss-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      <div style={styles.card}>
        <div style={styles.headerArea}>
          <div style={styles.iconBox}>
            <UserPlus size={24} color="var(--kpss-text, #0F172A)" />
          </div>
          <h1 style={styles.title}>Hesap Oluştur</h1>
          <p style={styles.subtitle}>KPSS hedefine ulaşmak için hemen ücretsiz kaydol.</p>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={styles.successBox}>
            <CheckCircle size={16} color="#16A34A" style={{ flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Ad Soyad */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Ad Soyad</label>
            <div style={styles.inputWrapper}>
              <User size={16} color="#94A3B8" style={styles.inputIcon} />
              <input
                type="text"
                placeholder="Ayşe Yılmaz"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                autoFocus
                style={styles.input}
              />
            </div>
          </div>

          {/* Kullanıcı Adı */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Kullanıcı Adı</label>
            <div style={styles.inputWrapper}>
              <AtSign size={16} color="#94A3B8" style={styles.inputIcon} />
              <input
                type="text"
                placeholder="kullanici_adi"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                style={styles.input}
              />
            </div>
            <span style={styles.hint}>3-30 karakter. Harf, sayı, nokta ve alt çizgi.</span>
          </div>

          {/* E-posta */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>E-posta Adresi</label>
            <div style={styles.inputWrapper}>
              <Mail size={16} color="#94A3B8" style={styles.inputIcon} />
              <input
                type="email"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                style={styles.input}
              />
            </div>
          </div>

          {/* Parola */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Parola</label>
            <div style={styles.inputWrapper}>
              <Lock size={16} color="#94A3B8" style={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="En az 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
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

          {/* Parola Tekrar */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Parola Tekrar</label>
            <div style={styles.inputWrapper}>
              <Lock size={16} color="#94A3B8" style={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Parolayı tekrar giriniz"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                autoComplete="new-password"
                style={styles.input}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              ...styles.submitBtn,
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? 'Hesap oluşturuluyor...' : 'Hesap Oluştur'}
          </button>
        </form>

        <div style={styles.footer}>
          <span style={styles.footerText}>Zaten hesabın var mı? </span>
          <button
            type="button"
            onClick={() => navigateTo('/login')}
            style={styles.linkBtn}
          >
            Giriş Yap
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
  card: {
    width: '100%',
    maxWidth: '440px',
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
  successBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    backgroundColor: '#F0FDF4',
    border: '1px solid #BBF7D0',
    borderRadius: '10px',
    color: '#15803D',
    fontSize: '13px',
    fontWeight: 500,
    marginBottom: '16px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
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
  hint: {
    fontSize: '11px',
    color: '#94A3B8',
    marginTop: '2px',
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
};
