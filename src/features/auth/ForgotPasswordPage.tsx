import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { KeyRound, Mail, AlertCircle, CheckCircle } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Lütfen e-posta adresinizi giriniz.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await resetPassword(cleanEmail);
      if (result.success) {
        // Hesap varlığını ifşa etmeyen genel mesaj
        setSuccess('Bu e-posta sistemde kayıtlıysa parola sıfırlama bağlantısı gönderildi.');
      } else {
        // Hata olsa bile hesap varlığını ifşa etme
        setSuccess('Bu e-posta sistemde kayıtlıysa parola sıfırlama bağlantısı gönderildi.');
      }
    } catch {
      setSuccess('Bu e-posta sistemde kayıtlıysa parola sıfırlama bağlantısı gönderildi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.card}>
        <div style={styles.headerArea}>
          <div style={styles.iconBox}>
            <KeyRound size={24} color="var(--kpss-text, #0F172A)" />
          </div>
          <h1 style={styles.title}>Parolamı Unuttum</h1>
          <p style={styles.subtitle}>Kayıtlı e-posta adresinize parola sıfırlama bağlantısı göndereceğiz.</p>
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
                autoFocus
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
            {isSubmitting ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
          </button>
        </form>

        <div style={styles.footer}>
          <button type="button" onClick={() => navigateTo('/login')} style={styles.linkBtn}>
            ← Giriş ekranına geri dön
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
    padding: '0 14px 0 38px',
    borderRadius: '10px',
    border: '1px solid var(--kpss-border, #E2E8F0)',
    fontSize: '14px',
    color: 'var(--kpss-text, #0F172A)',
    backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
    outline: 'none',
    boxSizing: 'border-box',
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
    color: '#64748B',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
    padding: 0,
  },
};
