import React, { useState } from 'react';
import { authService, AuthUser } from '../services/authService';
import { X, Mail, Lock, User, CheckCircle, AlertCircle, Eye, EyeOff, LogIn, UserPlus, KeyRound, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register' | 'forgot';
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [examType, setExamType] = useState('KPSS Lisans (GY-GK)');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const res = await authService.login(email, password);
        if (res.success && res.user) {
          onSuccess(res.user);
          onClose();
        } else {
          setErrorMessage(res.error || 'Giriş yapılamadı. Bilgilerinizi kontrol ediniz.');
        }
      } else if (mode === 'register') {
        const res = await authService.register(fullName, email, password, examType);
        if (res.success && res.user) {
          setSuccessMessage('Hesabınız başarıyla oluşturuldu!');
          setTimeout(() => {
            onSuccess(res.user!);
            onClose();
          }, 800);
        } else {
          setErrorMessage(res.error || 'Kayıt işlemi tamamlanamadı.');
        }
      } else if (mode === 'forgot') {
        const res = await authService.resetPassword(email);
        if (res.success) {
          setSuccessMessage(res.message);
        } else {
          setErrorMessage(res.message);
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Beklenmedik bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      {/* Arka plan tıklandığında kapatma */}
      <div style={styles.backdrop} onClick={onClose} />

      <div style={styles.modalCard}>
        {/* Üst Kapatma Butonu */}
        <button type="button" onClick={onClose} style={styles.closeBtn} title="Kapat">
          <X size={18} color="#64748B" />
        </button>

        {/* Modal Başlık ve İkon */}
        <div style={styles.headerArea}>
          <div style={styles.iconCircle}>
            {mode === 'login' ? (
              <LogIn size={22} color="#4F46E5" />
            ) : mode === 'register' ? (
              <UserPlus size={22} color="#10B981" />
            ) : (
              <KeyRound size={22} color="#F59E0B" />
            )}
          </div>
          <h2 style={styles.title}>
            {mode === 'login' && 'Öğrenci Girişi'}
            {mode === 'register' && 'KPSS Hesabı Oluştur'}
            {mode === 'forgot' && 'Şifremi Unuttum'}
          </h2>
          <p style={styles.subtitle}>
            {mode === 'login' && 'Çalışmalarına kaldığın yerden devam etmek için giriş yap.'}
            {mode === 'register' && 'KPSS hedefine ulaşmak için hemen ücretsiz kaydol.'}
            {mode === 'forgot' && 'Kayıtlı e-posta adresine şifre sıfırlama talimatı göndereceğiz.'}
          </p>
        </div>

        {/* Tab Seçimi (Giriş / Kayıt) */}
        {mode !== 'forgot' && (
          <div style={styles.tabContainer}>
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMessage(''); setSuccessMessage(''); }}
              style={{
                ...styles.tabBtn,
                ...(mode === 'login' ? styles.tabBtnActive : {}),
              }}
            >
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMessage(''); setSuccessMessage(''); }}
              style={{
                ...styles.tabBtn,
                ...(mode === 'register' ? styles.tabBtnActive : {}),
              }}
            >
              Kayıt Ol
            </button>
          </div>
        )}

        {/* Hata Bildirimi */}
        {errorMessage && (
          <div style={styles.errorAlert}>
            <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Başarı Bildirimi */}
        {successMessage && (
          <div style={styles.successAlert}>
            <CheckCircle size={16} color="#16A34A" style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Alanı */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {mode === 'register' && (
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Adınız Soyadınız</label>
              <div style={styles.inputWrapper}>
                <User size={16} color="#94A3B8" style={styles.inputIcon} />
                <input
                  type="text"
                  required
                  placeholder="Örn: Ayşe Yılmaz"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>
          )}

          <div style={styles.fieldGroup}>
            <label style={styles.label}>E-posta Adresi</label>
            <div style={styles.inputWrapper}>
              <Mail size={16} color="#94A3B8" style={styles.inputIcon} />
              <input
                type="email"
                required
                placeholder="ornek@kpss.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div style={styles.fieldGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={styles.label}>Şifre</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setErrorMessage(''); setSuccessMessage(''); }}
                    style={styles.forgotBtn}
                  >
                    Şifremi Unuttum?
                  </button>
                )}
              </div>
              <div style={styles.inputWrapper}>
                <Lock size={16} color="#94A3B8" style={styles.inputIcon} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={mode === 'register' ? 'En az 6 karakter' : 'Şifreniz'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  {showPassword ? <EyeOff size={16} color="#94A3B8" /> : <Eye size={16} color="#94A3B8" />}
                </button>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Hazırlandığınız KPSS Alanı</label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                style={styles.select}
              >
                <option value="KPSS Lisans (GY-GK)">KPSS Lisans (Genel Yetenek - Genel Kültür)</option>
                <option value="KPSS Ön Lisans">KPSS Ön Lisans</option>
                <option value="KPSS Ortaöğretim">KPSS Ortaöğretim (Lise Düzeyi)</option>
                <option value="KPSS EKPSS">EKPSS (Engelli Kamu Personeli)</option>
                <option value="KPSS Eğitim Bilimleri">KPSS Eğitim Bilimleri (Öğretmenlik)</option>
              </select>
            </div>
          )}

          {/* Gönder Butonu */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...styles.submitBtn,
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? (
              'İşleniyor...'
            ) : mode === 'login' ? (
              'Giriş Yap'
            ) : mode === 'register' ? (
              'Hesap Oluştur ve Başla'
            ) : (
              'Sıfırlama Bağlantısı Gönder'
            )}
          </button>
        </form>

        {/* Alt Bilgi / Mod Geçişleri */}
        <div style={styles.footer}>
          {mode === 'forgot' ? (
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMessage(''); setSuccessMessage(''); }}
              style={styles.switchModeBtn}
            >
              ← Giriş ekranına geri dön
            </button>
          ) : mode === 'login' ? (
            <div style={styles.footerText}>
              Hesabın yok mu?{' '}
              <button
                type="button"
                onClick={() => { setMode('register'); setErrorMessage(''); setSuccessMessage(''); }}
                style={styles.linkBtn}
              >
                Hemen Ücretsiz Kayıt Ol
              </button>
            </div>
          ) : (
            <div style={styles.footerText}>
              Zaten hesabın var mı?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMessage(''); setSuccessMessage(''); }}
                style={styles.linkBtn}
              >
                Giriş Yap
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
  },
  backdrop: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(4px)',
  },
  modalCard: {
    position: 'relative',
    width: '100%',
    maxWidth: '440px',
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
    padding: '32px 28px',
    zIndex: 2,
    border: '1px solid #E2E8F0',
  },
  closeBtn: {
    position: 'absolute',
    top: '18px',
    right: '18px',
    background: '#F1F5F9',
    border: 'none',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  headerArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: '20px',
  },
  iconCircle: {
    width: '52px',
    height: '52px',
    borderRadius: '16px',
    backgroundColor: '#EEF2FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#0F172A',
    margin: '0 0 6px 0',
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748B',
    margin: 0,
    lineHeight: 1.4,
  },
  tabContainer: {
    display: 'flex',
    backgroundColor: '#F1F5F9',
    borderRadius: '10px',
    padding: '4px',
    marginBottom: '20px',
  },
  tabBtn: {
    flex: 1,
    padding: '8px 0',
    border: 'none',
    background: 'none',
    fontSize: '13px',
    fontWeight: 600,
    color: '#64748B',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '10px',
    color: '#B91C1C',
    fontSize: '12px',
    fontWeight: 500,
    marginBottom: '16px',
  },
  successAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    backgroundColor: '#F0FDF4',
    border: '1px solid #BBF7D0',
    borderRadius: '10px',
    color: '#15803D',
    fontSize: '12px',
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
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#334155',
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
    height: '42px',
    padding: '0 38px 0 36px',
    borderRadius: '10px',
    border: '1px solid #CBD5E1',
    fontSize: '13px',
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s ease',
  },
  select: {
    width: '100%',
    height: '42px',
    padding: '0 12px',
    borderRadius: '10px',
    border: '1px solid #CBD5E1',
    fontSize: '13px',
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    outline: 'none',
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
  forgotBtn: {
    background: 'none',
    border: 'none',
    fontSize: '11px',
    fontWeight: 600,
    color: '#4F46E5',
    cursor: 'pointer',
    padding: 0,
  },
  submitBtn: {
    width: '100%',
    height: '46px',
    backgroundColor: '#111827',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 600,
    marginTop: '6px',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
    transition: 'all 0.15s ease',
  },
  footer: {
    marginTop: '20px',
    textAlign: 'center',
    paddingTop: '16px',
    borderTop: '1px solid #F1F5F9',
  },
  footerText: {
    fontSize: '12px',
    color: '#64748B',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: '#4F46E5',
    fontWeight: 600,
    fontSize: '12px',
    cursor: 'pointer',
    padding: 0,
  },
  switchModeBtn: {
    background: 'none',
    border: 'none',
    color: '#64748B',
    fontWeight: 600,
    fontSize: '12px',
    cursor: 'pointer',
    padding: 0,
  },
};
