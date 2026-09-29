import React from 'react';
import { ShieldCheck, HardDrive, RefreshCw, Zap, Database, Users, Trash2, AlertTriangle } from 'lucide-react';
import { StorageBreakdown } from '../types';
import { adminStyles } from '../AdminPanel.styles';

interface SystemSettingsViewProps {
  isCloud: boolean;
  newAdminPassword: string;
  setNewAdminPassword: (val: string) => void;
  adminPasswordMsg: string;
  onChangeAdminPassword: (e: React.FormEvent) => void;
  storageInfo: StorageBreakdown;
  isClearingCache: boolean;
  onUpdateStorageInfo: () => void;
  onClearBrowserCache: () => void;
  onClearCurriculumCache: () => void;
  onClearStudentDataCache: () => void;
  onClearAllStorage: () => void;
}

export const SystemSettingsView: React.FC<SystemSettingsViewProps> = ({
  isCloud,
  newAdminPassword,
  setNewAdminPassword,
  adminPasswordMsg,
  onChangeAdminPassword,
  storageInfo,
  isClearingCache,
  onUpdateStorageInfo,
  onClearBrowserCache,
  onClearCurriculumCache,
  onClearStudentDataCache,
  onClearAllStorage,
}) => {
  return (
    <div>
      <div style={adminStyles.twoColGrid}>
        {/* Supabase Ayarları & Güvenlik */}
        <div style={adminStyles.sectionCard}>
          <h3 style={adminStyles.sectionTitle}>Supabase Bulut & Güvenlik Durumu</h3>
          <p style={adminStyles.sectionSub}>PostgreSQL veritabanı bağlantısı ve güvenli Row Level Security (RLS) durumu.</p>

          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={adminStyles.infoRow}>
              <span style={adminStyles.infoLabel}>Bağlantı Durumu:</span>
              <span style={{ ...adminStyles.infoValue, color: isCloud ? '#16A34A' : '#D97706', fontWeight: 600 }}>
                {isCloud ? 'Supabase Bulut Aktif' : 'Çevrimdışı / Yerel Mod'}
              </span>
            </div>
            <div style={adminStyles.infoRow}>
              <span style={adminStyles.infoLabel}>Güvenlik Mimarisi:</span>
              <span style={{ ...adminStyles.infoValue, color: '#16A34A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={14} /> Row Level Security (RLS Korumalı)
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '6px', lineHeight: 1.4 }}>
              Frontend üzerinden gizli service_role anahtarı saklanmaz. İstemci yalnızca güvenli anon anahtarı ve yetkili oturumlarla iletişim kurar.
            </div>
          </div>
        </div>

        {/* Yönetici Şifresini Değiştir */}
        <div style={adminStyles.sectionCard}>
          <h3 style={adminStyles.sectionTitle}>Yönetici Giriş Şifresi</h3>
          <p style={adminStyles.sectionSub}>Admin paneline giriş için kullanılan güvenlik şifresini değiştirin.</p>

          <form onSubmit={onChangeAdminPassword} style={{ marginTop: '16px' }}>
            <label style={adminStyles.label}>Yeni Yönetici Şifresi</label>
            <input
              type="password"
              placeholder="Yeni şifrenizi yazınız..."
              value={newAdminPassword}
              onChange={(e) => setNewAdminPassword(e.target.value)}
              style={adminStyles.inputField}
            />

            {adminPasswordMsg && (
              <div
                style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  color: adminPasswordMsg.includes('başarıyla') ? '#16A34A' : '#DC2626',
                  fontWeight: 600,
                }}
              >
                {adminPasswordMsg}
              </div>
            )}

            <button type="submit" style={{ ...adminStyles.secondaryBtn, marginTop: '12px' }}>
              Şifreyi Güncelle
            </button>
          </form>
        </div>
      </div>

      {/* 3. BÖLÜM: ÖNBELLEK & DEPOLAMA YÖNETİMİ (CACHE CLEANER) */}
      <div style={{ ...adminStyles.sectionCard, marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HardDrive size={22} color="#4F46E5" />
            </div>
            <div>
              <h3 style={{ ...adminStyles.sectionTitle, margin: 0, fontSize: '16px' }}>Önbellek & Depolama Yönetimi (Cache Cleaner)</h3>
              <p style={{ ...adminStyles.sectionSub, margin: '2px 0 0' }}>Tarayıcıda saklanan yerel önbelleği, müfredat ve geçici verileri inceleyin ve güvenle temizleyin.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onUpdateStorageInfo}
            style={{ ...adminStyles.secondaryBtn, padding: '6px 12px', fontSize: '12px' }}
            title="Depolama kullanımını tekrar tara"
          >
            <RefreshCw size={13} style={{ marginRight: '6px' }} />
            Kullanımı Yenile
          </button>
        </div>

        {/* Bellek Göstergesi & İstatistik Kartları */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '18px' }}>
          <div style={{ padding: '12px 14px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>TOPLAM ÖNBELLEK</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', marginTop: '4px' }}>
              {storageInfo.totalFormatted}
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
              {storageInfo.keyCount} Adet Veri Anahtarı
            </div>
          </div>

          <div style={{ padding: '12px 14px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>MÜFREDAT & SORU</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#4F46E5', marginTop: '4px' }}>
              {storageInfo.curriculumFormatted}
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
              Ders, Ünite, Konu & Bankalar
            </div>
          </div>

          <div style={{ padding: '12px 14px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>ÖĞRENCİ & TEST</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
              {storageInfo.studentFormatted}
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
              Profil & Çözüm Geçmişi
            </div>
          </div>

          <div style={{ padding: '12px 14px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>TEMA & DİĞER</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#D97706', marginTop: '4px' }}>
              {storageInfo.themeFormatted}
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
              Aktif Renk & Tasarım Ayarları
            </div>
          </div>
        </div>

        {/* Depolama Barı */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748B', marginBottom: '6px' }}>
            <span>Tarayıcı Depolama Kotası (Standart ~5 MB)</span>
            <span style={{ fontWeight: 600, color: '#1E293B' }}>
              {((storageInfo.totalBytes / (5 * 1024 * 1024)) * 100).toFixed(2)}% Kullanılıyor
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, Math.max(1, (storageInfo.curriculumBytes / (5 * 1024 * 1024)) * 100))}%`,
                backgroundColor: '#4F46E5',
              }}
              title={`Müfredat: ${storageInfo.curriculumFormatted}`}
            />
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, (storageInfo.studentBytes / (5 * 1024 * 1024)) * 100)}%`,
                backgroundColor: '#059669',
              }}
              title={`Öğrenci: ${storageInfo.studentFormatted}`}
            />
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, (storageInfo.themeBytes / (5 * 1024 * 1024)) * 100)}%`,
                backgroundColor: '#D97706',
              }}
              title={`Tema: ${storageInfo.themeFormatted}`}
            />
          </div>
        </div>

        {/* Temizleme Butonları Kartları */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
          {/* Hızlı Önbellek Temizle */}
          <div style={{ padding: '16px', borderRadius: '10px', border: '1px solid #E0E7FF', backgroundColor: '#EEF2FF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Zap size={18} color="#4F46E5" />
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#312E81' }}>Hızlı Önbellek Temizle</h4>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#4338CA', lineHeight: 1.4 }}>
                Tarayıcı CacheStorage ve geçici oturumları temizler. Öğrenci verilerine veya sorulara dokunmaz, sistemi hızlandırır.
              </p>
            </div>
            <button
              type="button"
              onClick={onClearBrowserCache}
              disabled={isClearingCache}
              style={{
                ...adminStyles.primaryBtn,
                marginTop: '14px',
                justifyContent: 'center',
                backgroundColor: '#4F46E5',
                fontSize: '12px',
                padding: '8px 12px',
              }}
            >
              <RefreshCw size={13} style={{ marginRight: '6px' }} />
              Hızlı Önbelleği Temizle
            </button>
          </div>

          {/* Müfredat & Soru Önbelleğini Sıfırla */}
          <div style={{ padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Database size={18} color="#059669" />
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#065F46' }}>Müfredat Önbelleğini Yenile</h4>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748B', lineHeight: 1.4 }}>
                Yerel müfredat, ünite, konu ve soru kopyalarını silip veritabanından veya varsayılan paketlerden taze olarak yükler.
              </p>
            </div>
            <button
              type="button"
              onClick={onClearCurriculumCache}
              disabled={isClearingCache}
              style={{
                ...adminStyles.secondaryBtn,
                marginTop: '14px',
                justifyContent: 'center',
                borderColor: '#A7F3D0',
                color: '#065F46',
                backgroundColor: '#F0FDF4',
                fontSize: '12px',
                padding: '8px 12px',
              }}
            >
              <Database size={13} style={{ marginRight: '6px' }} />
              Müfredat Önbelleğini Sıfırla
            </button>
          </div>

          {/* Öğrenci İlerleme Önbelleğini Temizle */}
          <div style={{ padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Users size={18} color="#D97706" />
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#92400E' }}>Öğrenci Test Geçmişini Sil</h4>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748B', lineHeight: 1.4 }}>
                Çözülen test kayıtları, skorlar ve haftalık çalışma grafiklerini sıfırlar. Müfredata dokunulmaz.
              </p>
            </div>
            <button
              type="button"
              onClick={onClearStudentDataCache}
              disabled={isClearingCache}
              style={{
                ...adminStyles.secondaryBtn,
                marginTop: '14px',
                justifyContent: 'center',
                borderColor: '#FDE68A',
                color: '#92400E',
                backgroundColor: '#FEF3C7',
                fontSize: '12px',
                padding: '8px 12px',
              }}
            >
              <Trash2 size={13} style={{ marginRight: '6px' }} />
              İlerleme Verilerini Temizle
            </button>
          </div>

          {/* Tüm Depolamayı Sıfırla (Hard Reset) */}
          <div style={{ padding: '16px', borderRadius: '10px', border: '1px solid #FECACA', backgroundColor: '#FEF2F2', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <AlertTriangle size={18} color="#DC2626" />
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#991B1B' }}>Tam Önbellek & Depolama Sıfırlama</h4>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#B91C1C', lineHeight: 1.4 }}>
                Tüm yerel depolamayı ve servis önbelleğini temizleyip uygulamayı sıfırlar (Yönetici şifreniz korunur).
              </p>
            </div>
            <button
              type="button"
              onClick={onClearAllStorage}
              disabled={isClearingCache}
              style={{
                ...adminStyles.primaryBtn,
                marginTop: '14px',
                justifyContent: 'center',
                backgroundColor: '#DC2626',
                fontSize: '12px',
                padding: '8px 12px',
              }}
            >
              <Trash2 size={13} style={{ marginRight: '6px' }} />
              Fabrika Ayarlarına Sıfırla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
