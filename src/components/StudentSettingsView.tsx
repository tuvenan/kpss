import React, { useState, useRef, useEffect } from 'react';
import { userProfileService, UserProfile, ALL_BADGES } from '../services/userProfileService';
import {
  User,
  Mail,
  Phone,
  Target,
  Clock,
  Lock,
  RotateCcw,
  Check,
  Save,
} from 'lucide-react';

export const StudentSettingsView: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>(userProfileService.getProfile());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(profile.photoUrl || '');
  const [activeAvatarTab, setActiveAvatarTab] = useState<'photo' | 'avatar'>('photo');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Şifre Formu
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const p = userProfileService.getProfile();
    setProfile(p);
    setPhotoPreview(p.photoUrl || '');
  }, []);

  // Fotoğraf yükleme
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Dosya boyutu 2 MB\'ı aşamaz.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setPhotoPreview(base64);
      setProfile(prev => ({ ...prev, photoUrl: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview('');
    setProfile(prev => ({ ...prev, photoUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    userProfileService.saveProfile(profile);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3500);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordMessage({ type: 'error', text: 'Lütfen mevcut şifrenizi giriniz.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Yeni şifre en az 6 karakter olmalıdır.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Yeni şifreler birbiriyle eşleşmiyor.' });
      return;
    }

    setPasswordMessage({ type: 'success', text: 'Şifreniz başarıyla güncellendi!' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordMessage(null), 4000);
  };

  const handleResetData = () => {
    userProfileService.resetProgressData();
    setResetConfirmOpen(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const avatarOptions = [
    { id: 'user-1', label: 'Klasik', emoji: '🎓' },
    { id: 'user-2', label: 'Kitapkurdu', emoji: '📚' },
    { id: 'user-3', label: 'Hedef 90+', emoji: '🎯' },
    { id: 'user-4', label: 'Azimli', emoji: '🔥' },
    { id: 'user-5', label: 'Şampiyon', emoji: '⭐' },
  ];

  return (
    <div style={styles.container}>
      {/* ÜST BAŞLIK ALANI */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.heading}>Ayarlar &amp; Profil Düzenleme</h1>
          <p style={styles.subheading}>
            Kişisel bilgilerinizi, KPSS sınav hedeflerinizi ve çalışma tercihlerinizi buradan özelleştirin.
          </p>
        </div>

        <button type="button" onClick={handleSave} style={styles.saveTopBtn}>
          <Save size={16} style={{ marginRight: '8px' }} />
          Değişiklikleri Kaydet
        </button>
      </div>

      {/* BAŞARI BİLDİRİMİ */}
      {saveSuccess && (
        <div style={styles.successBanner}>
          <Check size={18} color="#16A34A" style={{ marginRight: '10px', flexShrink: 0 }} />
          <span style={styles.successText}>Profil ve sınav ayarlarınız başarıyla kaydedildi!</span>
        </div>
      )}

      {/* 1. BÖLÜM: KİŞİSEL BİLGİLER & PROFİL FOTOĞRAFI */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.cardIconBox}>
            <User size={18} color="#0F172A" />
          </div>
          <div>
            <h2 style={styles.cardTitle}>Kişisel Bilgiler &amp; Profil</h2>
            <p style={styles.cardSubtitle}>Görünüm ve iletişim bilgilerinizi güncelleyin.</p>
          </div>
        </div>


        {/* === PROFİL FOTOĞRAFI & AVATAR === */}
        <div style={{ marginBottom: '24px' }}>
          {/* Sekme Seçimi */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {(['photo', 'avatar'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveAvatarTab(tab)}
                style={{
                  padding: '7px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                  border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  backgroundColor: activeAvatarTab === tab ? '#0F172A' : '#F1F5F9',
                  color: activeAvatarTab === tab ? '#fff' : '#475569',
                }}
              >
                {tab === 'photo' ? '📷 Fotoğraf Yükle' : '🎨 Avatar Seç'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
            {/* Sol: Önizleme */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '90px', height: '90px', borderRadius: '50%',
                border: '3px solid #E2E8F0', overflow: 'hidden',
                backgroundColor: '#F8FAFC',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {photoPreview ? (
                  <img src={photoPreview} alt="Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '38px' }}>
                    {avatarOptions.find(a => a.id === profile.avatarIcon)?.emoji || '🎓'}
                  </span>
                )}
              </div>
              {photoPreview && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  style={{ fontSize: '11px', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  Fotoğrafı Kaldır
                </button>
              )}
            </div>

            {/* Sağ: İçerik */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              {activeAvatarTab === 'photo' ? (
                <>
                  {/* Fotoğraf Yükleme Alanı */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed #CBD5E1', borderRadius: '12px',
                      padding: '20px 16px', textAlign: 'center',
                      cursor: 'pointer', backgroundColor: '#F8FAFC',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <div style={{ fontSize: '28px', marginBottom: '6px' }}>📸</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Tıkla veya fotoğraf sürükle
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                      JPG, PNG, WEBP · Maks. 2 MB
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoUpload}
                    style={{ display: 'none' }}
                  />
                  <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '8px' }}>
                    Fotoğraf cihazınızda saklanır, sunucuya yüklenmez.
                  </p>
                </>
              ) : (
                <>
                  <label style={styles.inputLabel}>Emoji Avatar Seç</label>
                  <div style={styles.avatarPills}>
                    {avatarOptions.map((opt) => {
                      const isSelected = !photoPreview && profile.avatarIcon === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setProfile({ ...profile, avatarIcon: opt.id });
                            handleRemovePhoto();
                          }}
                          style={{
                            ...styles.avatarPillBtn,
                            backgroundColor: isSelected ? '#0F172A' : '#F1F5F9',
                            color: isSelected ? '#FFFFFF' : '#334155',
                            border: isSelected ? '1.5px solid #0F172A' : '1.5px solid transparent',
                          }}
                        >
                          <span style={{ marginRight: '6px' }}>{opt.emoji}</span>
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* === ROZETLER (Pasif Altyapı) === */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <label style={{ ...styles.inputLabel, margin: 0 }}>🏅 Rozetlerim</label>
            <span style={{
              fontSize: '10px', padding: '2px 8px', borderRadius: '20px',
              backgroundColor: '#FEF3C7', color: '#D97706', fontWeight: 700, letterSpacing: '0.3px'
            }}>YAKINDA</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {ALL_BADGES.map(badge => {
              const earned = profile.earnedBadgeIds?.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  title={badge.description}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 12px', borderRadius: '20px',
                    border: `1.5px solid ${earned ? '#C7D2FE' : '#E2E8F0'}`,
                    backgroundColor: earned ? '#EEF2FF' : '#F8FAFC',
                    opacity: earned ? 1 : 0.5,
                    cursor: 'default', fontSize: '12px',
                    fontWeight: earned ? 700 : 400,
                    color: earned ? '#3730A3' : '#94A3B8',
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: '16px', filter: earned ? 'none' : 'grayscale(1)' }}>{badge.emoji}</span>
                  <span>{badge.label}</span>
                  {!earned && <span style={{ fontSize: '10px' }}>🔒</span>}
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '10px' }}>
            Rozetler çalışma aktivitenize göre otomatik olarak kazanılacak.
          </p>
        </div>

        {/* İsim & Kullanıcı Adı */}
        <div style={styles.twoColGrid}>
          <div>
            <label style={styles.inputLabel}>Ad Soyad</label>
            <div style={styles.inputGroup}>
              <User size={16} color="#94A3B8" style={styles.groupIcon} />
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Adınız Soyadınız"
                style={styles.textInput}
              />
            </div>
          </div>

          <div>
            <label style={styles.inputLabel}>Kullanıcı Adı</label>
            <div style={styles.inputGroup}>
              <span style={{ color: '#94A3B8', fontWeight: 600, paddingLeft: '12px', fontSize: '14px' }}>@</span>
              <input
                type="text"
                value={profile.username}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                placeholder="kullaniciadi"
                style={{ ...styles.textInput, paddingLeft: '6px' }}
              />
            </div>
          </div>
        </div>

        {/* E-posta & Telefon */}
        <div style={styles.twoColGrid}>
          <div>
            <label style={styles.inputLabel}>E-Posta Adresi</label>
            <div style={styles.inputGroup}>
              <Mail size={16} color="#94A3B8" style={styles.groupIcon} />
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                placeholder="ornek@kpss.com"
                style={styles.textInput}
              />
            </div>
          </div>

          <div>
            <label style={styles.inputLabel}>Telefon Numarası</label>
            <div style={styles.inputGroup}>
              <Phone size={16} color="#94A3B8" style={styles.groupIcon} />
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="+90 (555) 000 00 00"
                style={styles.textInput}
              />
            </div>
          </div>
        </div>

        {/* Biyografi / Hedef Notu */}
        <div style={{ marginTop: '16px' }}>
          <label style={styles.inputLabel}>Biyografi &amp; Motivasyon Notu</label>
          <textarea
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            placeholder="KPSS çalışma hedefinizi veya motivasyon cümlenizi yazın..."
            rows={3}
            style={styles.textareaInput}
          />
        </div>
      </div>

      {/* 2. BÖLÜM: KPSS HEDEF & SINAV TERCİHLERİ */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.cardIconBox}>
            <Target size={18} color="#0F172A" />
          </div>
          <div>
            <h2 style={styles.cardTitle}>KPSS Sınavı &amp; Hedef Ayarları</h2>
            <p style={styles.cardSubtitle}>Hazırlandığınız sınav türüne göre analitikleri ve planları şekillendirin.</p>
          </div>
        </div>

        <div style={styles.twoColGrid}>
          {/* Sınav Türü */}
          <div>
            <label style={styles.inputLabel}>Hazırlandığınız Sınav Türü</label>
            <select
              value={profile.examType}
              onChange={(e) => setProfile({ ...profile, examType: e.target.value })}
              style={styles.selectInput}
            >
              <option value="KPSS Lisans (GY-GK)">KPSS Lisans (Genel Yetenek - Genel Kültür)</option>
              <option value="KPSS Ön Lisans">KPSS Ön Lisans</option>
              <option value="KPSS Ortaöğretim">KPSS Ortaöğretim (Lise Düzeyi)</option>
              <option value="KPSS EKPSS">EKPSS (Engelli Kamu Personeli Seçme Sınavı)</option>
              <option value="KPSS Eğitim Bilimleri">KPSS Eğitim Bilimleri (Öğretmenlik)</option>
            </select>
          </div>

          {/* Branş / Kadro */}
          <div>
            <label style={styles.inputLabel}>Hedeflenen Kadro / Alan</label>
            <select
              value={profile.branch}
              onChange={(e) => setProfile({ ...profile, branch: e.target.value })}
              style={styles.selectInput}
            >
              <option value="Memurluk (B Grubu)">Memurluk (B Grubu Kadrolar)</option>
              <option value="Öğretmenlik (MEB)">Öğretmenlik (MEB Atamaları)</option>
              <option value="Uzmanlık / Müfettişlik (A Grubu)">Uzmanlık / Müfettişlik (A Grubu Kariyer)</option>
              <option value="Sağlık / Teknik Kadrolar">Sağlık &amp; Teknik Hizmetler</option>
            </select>
          </div>
        </div>

        {/* Hedef Puan ve Günlük Soru Hedefi */}
        <div style={{ ...styles.twoColGrid, marginTop: '20px' }}>
          {/* Hedef Puan Slider */}
          <div style={styles.goalBox}>
            <div style={styles.goalHeaderRow}>
              <span style={styles.goalLabel}>Hedef Puan:</span>
              <span style={styles.goalValueBadge}>{profile.targetScore}+ Puan</span>
            </div>
            <input
              type="range"
              min={60}
              max={100}
              value={profile.targetScore}
              onChange={(e) => setProfile({ ...profile, targetScore: Number(e.target.value) })}
              style={styles.rangeInput}
            />
            <div style={styles.rangeLabels}>
              <span>60</span>
              <span>75</span>
              <span>85</span>
              <span>100</span>
            </div>
          </div>

          {/* Günlük Soru Hedefi */}
          <div style={styles.goalBox}>
            <div style={styles.goalHeaderRow}>
              <span style={styles.goalLabel}>Günlük Soru Hedefi:</span>
              <span style={styles.goalValueBadge}>{profile.dailyGoal} Soru/Gün</span>
            </div>
            <div style={styles.pillOptionsRow}>
              {[30, 40, 60, 80, 100].map((goal) => {
                const isSelected = profile.dailyGoal === goal;
                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => setProfile({ ...profile, dailyGoal: goal })}
                    style={{
                      ...styles.pillOptionBtn,
                      backgroundColor: isSelected ? '#0F172A' : '#F1F5F9',
                      color: isSelected ? '#FFFFFF' : '#334155',
                      fontWeight: isSelected ? 700 : 500,
                    }}
                  >
                    {goal}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. BÖLÜM: ÇALIŞMA & UYGULAMA TERCİHLERİ */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.cardIconBox}>
            <Clock size={18} color="#0F172A" />
          </div>
          <div>
            <h2 style={styles.cardTitle}>Çalışma &amp; Uygulama Tercihleri</h2>
            <p style={styles.cardSubtitle}>Test deneyiminizi ve hatırlatıcıları yapılandırın.</p>
          </div>
        </div>

        {/* Switch 1: Çözüm Açıklamaları */}
        <div style={styles.switchRow}>
          <div>
            <div style={styles.switchTitle}>Çözüm Açıklamalarını Otomatik Göster</div>
            <div style={styles.switchDesc}>Cevap verdikten sonra doğru şıkkı ve detaylı konu açıklamasını hemen gösterir.</div>
          </div>
          <input
            type="checkbox"
            checked={profile.autoShowExplanation}
            onChange={(e) => setProfile({ ...profile, autoShowExplanation: e.target.checked })}
            style={styles.checkboxInput}
          />
        </div>

        {/* Switch 2: Süre Sayacı */}
        <div style={styles.switchRow}>
          <div>
            <div style={styles.switchTitle}>Testlerde Kronometre / Süre Sayacı</div>
            <div style={styles.switchDesc}>Soru çözerken harcanan zamanı ölçerek zaman yönetimini destekler.</div>
          </div>
          <input
            type="checkbox"
            checked={profile.showTimer}
            onChange={(e) => setProfile({ ...profile, showTimer: e.target.checked })}
            style={styles.checkboxInput}
          />
        </div>

        {/* Switch 3: Günlük Hatırlatıcı */}
        <div style={styles.switchRow}>
          <div>
            <div style={styles.switchTitle}>Günlük Çalışma Bildirimi</div>
            <div style={styles.switchDesc}>Her gün belirlediğiniz saatte soru çözme hedefinizi hatırlatır.</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {profile.dailyReminder && (
              <input
                type="time"
                value={profile.reminderTime}
                onChange={(e) => setProfile({ ...profile, reminderTime: e.target.value })}
                style={styles.timeInput}
              />
            )}
            <input
              type="checkbox"
              checked={profile.dailyReminder}
              onChange={(e) => setProfile({ ...profile, dailyReminder: e.target.checked })}
              style={styles.checkboxInput}
            />
          </div>
        </div>
      </div>

      {/* 4. BÖLÜM: GÜVENLİK & VERİ YÖNETİMİ */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.cardIconBox}>
            <Lock size={18} color="#0F172A" />
          </div>
          <div>
            <h2 style={styles.cardTitle}>Güvenlik &amp; Hesap Yönetimi</h2>
            <p style={styles.cardSubtitle}>Giriş şifrenizi güncelleyin ve veri geçmişinizi kontrol edin.</p>
          </div>
        </div>

        {/* Şifre Değiştirme */}
        <form onSubmit={handlePasswordChange} style={{ marginBottom: '28px' }}>
          <div style={styles.threeColGrid}>
            <div>
              <label style={styles.inputLabel}>Mevcut Şifre</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                style={styles.textInput}
              />
            </div>
            <div>
              <label style={styles.inputLabel}>Yeni Şifre</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="En az 6 karakter"
                style={styles.textInput}
              />
            </div>
            <div>
              <label style={styles.inputLabel}>Yeni Şifre (Tekrar)</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Yeni şifreyi onaylayın"
                style={styles.textInput}
              />
            </div>
          </div>

          {passwordMessage && (
            <div
              style={{
                ...styles.messageBox,
                backgroundColor: passwordMessage.type === 'success' ? '#F0FDF4' : '#FEF2F2',
                color: passwordMessage.type === 'success' ? '#16A34A' : '#DC2626',
                borderColor: passwordMessage.type === 'success' ? '#BBF7D0' : '#FECACA',
              }}
            >
              {passwordMessage.text}
            </div>
          )}

          <button type="submit" style={styles.passwordSubmitBtn}>
            Şifreyi Güncelle
          </button>
        </form>

        <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '20px 0' }} />

        {/* İstatistikleri Sıfırlama */}
        <div style={styles.dangerRow}>
          <div>
            <div style={styles.dangerTitle}>Çözülen Soru ve Analitik Verilerini Sıfırla</div>
            <div style={styles.dangerDesc}>
              Tüm çözülen soru sayılarını, başarı grafiğini ve haftalık analitik kayıtlarını temizler. Bu işlem geri alınamaz.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setResetConfirmOpen(true)}
            style={styles.dangerBtn}
          >
            <RotateCcw size={15} style={{ marginRight: '6px' }} />
            Verileri Sıfırla
          </button>
        </div>

        {/* Sıfırlama Onay Modalı */}
        {resetConfirmOpen && (
          <div style={styles.modalBackdrop}>
            <div style={styles.modalCard}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#111' }}>Verileri Sıfırlamak İstiyor Musunuz?</h3>
              <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.5, margin: '0 0 20px 0' }}>
                Bu işlemle profil sayfanızdaki soru çözme sayıları, haftalık aktivite ve konu analizi sıfırlanacaktır.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setResetConfirmOpen(false)}
                  style={styles.modalCancelBtn}
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={handleResetData}
                  style={styles.modalConfirmBtn}
                >
                  Evet, Sıfırla
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ALT SABİT KAYDET BUTONU */}
      <div style={styles.footerSaveRow}>
        <button type="button" onClick={handleSave} style={styles.saveBottomBtn}>
          <Save size={18} style={{ marginRight: '8px' }} />
          Tüm Değişiklikleri Kaydet
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '980px',
    margin: '0 auto',
    width: '100%',
    paddingBottom: '60px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  heading: {
    fontFamily: "'Playfair Display', 'Merriweather', Georgia, serif",
    fontSize: '28px',
    fontWeight: 700,
    color: '#0F172A',
    margin: '0 0 6px 0',
  },
  subheading: {
    fontSize: '14px',
    color: '#64748B',
    margin: 0,
  },
  saveTopBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    padding: '10px 20px',
    borderRadius: '10px',
    border: 'none',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.15)',
    transition: 'background-color 0.15s ease',
  },
  successBanner: {
    backgroundColor: '#F0FDF4',
    border: '1px solid #BBF7D0',
    borderRadius: '12px',
    padding: '14px 18px',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px',
  },
  successText: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#15803D',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    border: '1px solid #E5E7EB',
    padding: '28px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
    marginBottom: '24px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '24px',
  },
  cardIconBox: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#F1F5F9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#0F172A',
    margin: '0 0 4px 0',
  },
  cardSubtitle: {
    fontSize: '13px',
    color: '#64748B',
    margin: 0,
  },
  avatarRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    paddingBottom: '20px',
    marginBottom: '20px',
    borderBottom: '1px solid #F1F5F9',
    flexWrap: 'wrap',
  },
  currentAvatarBig: {
    width: '68px',
    height: '68px',
    borderRadius: '50%',
    backgroundColor: '#F1F5F9',
    border: '2px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  avatarPills: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  avatarPillBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 14px',
    borderRadius: '9999px',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  twoColGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '18px',
    marginBottom: '16px',
  },
  threeColGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '14px',
  },
  inputLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
    marginBottom: '8px',
  },
  inputGroup: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
  },
  groupIcon: {
    marginLeft: '12px',
    flexShrink: 0,
  },
  textInput: {
    width: '100%',
    height: '42px',
    padding: '0 12px',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '14px',
    color: '#0F172A',
    outline: 'none',
    boxSizing: 'border-box',
  },
  textareaInput: {
    width: '100%',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
    fontSize: '14px',
    color: '#0F172A',
    outline: 'none',
    resize: 'vertical',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  selectInput: {
    width: '100%',
    height: '42px',
    padding: '0 12px',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
    fontSize: '14px',
    color: '#0F172A',
    outline: 'none',
    boxSizing: 'border-box',
  },
  goalBox: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '14px',
    padding: '16px',
  },
  goalHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  goalLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
  },
  goalValueBadge: {
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 700,
  },
  rangeInput: {
    width: '100%',
    accentColor: '#0F172A',
    cursor: 'pointer',
  },
  rangeLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: '#94A3B8',
    marginTop: '4px',
  },
  pillOptionsRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  pillOptionBtn: {
    padding: '6px 14px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  switchRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 0',
    borderBottom: '1px solid #F1F5F9',
  },
  switchTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#0F172A',
    marginBottom: '2px',
  },
  switchDesc: {
    fontSize: '12px',
    color: '#64748B',
  },
  checkboxInput: {
    width: '18px',
    height: '18px',
    accentColor: '#0F172A',
    cursor: 'pointer',
  },
  timeInput: {
    height: '32px',
    padding: '0 8px',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#0F172A',
  },
  passwordSubmitBtn: {
    marginTop: '8px',
    backgroundColor: '#F1F5F9',
    color: '#0F172A',
    border: '1px solid #E2E8F0',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  messageBox: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '13px',
    margin: '10px 0',
  },
  dangerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '14px',
  },
  dangerTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#DC2626',
    marginBottom: '2px',
  },
  dangerDesc: {
    fontSize: '12px',
    color: '#64748B',
    maxWidth: '560px',
  },
  dangerBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    border: '1px solid #FECACA',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0,
  },
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '420px',
    width: '90%',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
  },
  modalCancelBtn: {
    backgroundColor: '#F1F5F9',
    color: '#334155',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
  },
  modalConfirmBtn: {
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
  },
  footerSaveRow: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '12px',
  },
  saveBottomBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    padding: '12px 32px',
    borderRadius: '12px',
    border: 'none',
    fontWeight: 700,
    fontSize: '15px',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.2)',
  },
};
