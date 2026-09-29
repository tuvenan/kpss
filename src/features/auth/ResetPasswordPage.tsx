import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../services/supabase';
import { ShieldCheck, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isValidSession, setIsValidSession] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsChecking(false);
      setError('Kimlik doğrulama servisi yapılandırılmamış.');
      return;
    }

    // Recovery session kontrolü
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsValidSession(true);
      } else {
        setError('Geçersiz veya süresi dolmuş sıfırlama bağlantısı. Lütfen yeni bir bağlantı talep ediniz.');
      }
      setIsChecking(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 8) {
      setError('Parola en az 8 karakter olmalıdır.');
      return;
    }
    if (password !== passwordConfirm) {
      setError('Parola ve parola tekrarı eşleşmiyor.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message || 'Parola güncellenemedi.');
      } else {
        setSuccess('Parolanız başarıyla güncellendi. Giriş sayfasına yönlendiriliyorsunuz...');
        setTimeout(() => {
          window.history.replaceState({}, '', '/login');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }, 2000);
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

  if (isChecking) {
    return (
      <div style={styles.pageContainer}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <Loader2 size={24} color="var(--kpss-text, #0F172A)" style={{ animation: 'kpss-spin 1s linear infinite' }} />
          <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--kpss-text, #0F172A)', margin: 0 }}>
            Sıfırlama oturumu doğrulanıyor...
          </p>
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
            <ShieldCheck size={24} color="var(--kpss-text, #0F172A)" />
          </div>
          <h1 style={styles.title}>Yeni Parola Belirle</h1>
          <p style={styles.subtitle}>Hesabınız için yeni bir parola oluşturunuz.</p>
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

        {isValidSession && !success && (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Yeni Parola</label>
              <div style={styles.inputWrapper}>
                <Lock size={16} color="#94A3B8" style={styles.inputIcon} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="En az 8 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  autoFocus
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

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Yeni Parola Tekrar</label>
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
              {isSubmitting ? 'Güncelleniyor...' : 'Parolayı Güncelle'}
            </button>
          </form>
        )}

        {!isValidSession && (
          <div style={styles.footer}>
            <button type="button" onClick={() => navigateTo('/forgot-password')} style={styles.linkBtn}>
              Yeni sıfırlama bağlantısı talep et
            </button>
          </div>
        )}
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
