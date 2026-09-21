import React, { useState, useEffect } from 'react';
import { themeService, ThemeConfig, PRESET_THEMES } from '../services/themeService';
import {
  Palette,
  Sparkles,
  Sun,
  Moon,
  Type,
  Maximize2,
  Check,
  RefreshCw,
  Download,
  Upload,
  Eye,
  Sliders,
  Copy,
  Layers,
  Box,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

interface AdvancedThemeEditorProps {
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdvancedThemeEditor: React.FC<AdvancedThemeEditorProps> = ({ onNotify }) => {
  const [theme, setTheme] = useState<ThemeConfig>(() => themeService.getActiveTheme());
  const [importJsonText, setImportJsonText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  // Tema değiştiğinde anında DOM'a ve servise uygula
  const handleUpdateTheme = (updated: ThemeConfig) => {
    setTheme(updated);
    themeService.setActiveTheme(updated);
  };

  const handleSelectPreset = (preset: ThemeConfig) => {
    handleUpdateTheme(preset);
    onNotify(`"${preset.name}" teması başarıyla uygulandı!`);
  };

  const handleReset = () => {
    if (!confirm('Tüm görsel stil ayarları varsayılan Modern KPSS temasına sıfırlanacaktır. Emin misiniz?')) return;
    const def = themeService.resetToDefault();
    setTheme(def);
    onNotify('Tema varsayılan ayarlara sıfırlandı.');
  };

  const handleExportJson = () => {
    const jsonStr = themeService.exportThemeJson(theme);
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonStr);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `kpss_tema_${theme.id || 'ozel'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onNotify('Tema ayarları JSON dosyası olarak indirildi.');
  };

  const handleImportJson = () => {
    if (!importJsonText.trim()) return;
    const imported = themeService.importThemeJson(importJsonText);
    if (imported) {
      setTheme(imported);
      setShowImportModal(false);
      setImportJsonText('');
      onNotify('Özel tema JSON üzerinden başarıyla yüklendi ve uygulandı!');
    } else {
      alert('Geçersiz tema JSON formatı. Lütfen kontrol edip tekrar deneyiniz.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. ÜST BAŞLIK VE HIZLI AKSİYONLAR */}
      <div style={styles.topCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={styles.headerIconBox}>
              <Palette size={22} color="#4F46E5" />
            </div>
            <div>
              <h2 style={styles.headerTitle}>Görsel Stil &amp; Tema Editörü</h2>
              <p style={styles.headerSub}>
                Uygulamanın renk paletini, karanlık modunu, yazı tipini ve arayüz geometrisini anlık olarak özelleştirin.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={handleReset} style={styles.btnSecondary} title="Varsayılan Temaya Dön">
              <RefreshCw size={14} style={{ marginRight: '6px' }} />
              Sıfırla
            </button>

            <button onClick={handleExportJson} style={styles.btnSecondary} title="Temayı JSON İndir">
              <Download size={14} style={{ marginRight: '6px' }} />
              Dışa Aktar (JSON)
            </button>

            <button onClick={() => setShowImportModal(true)} style={styles.btnSecondary} title="Tema JSON Yapıştır">
              <Upload size={14} style={{ marginRight: '6px' }} />
              İçe Aktar
            </button>
          </div>
        </div>
      </div>

      {/* 2. HAZIR TEMA ÖNAYARLARI GALERİSİ (PRESET THEMES) */}
      <div style={styles.sectionCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Sparkles size={18} color="#D97706" />
          <h3 style={styles.sectionTitle}>Hazır Tema Şablonları</h3>
        </div>

        <div style={styles.presetsGrid}>
          {PRESET_THEMES.map((preset) => {
            const isSelected = theme.id === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                style={{
                  ...styles.presetCard,
                  borderColor: isSelected ? '#4F46E5' : '#E2E8F0',
                  backgroundColor: preset.backgroundColor,
                  color: preset.textColor,
                  boxShadow: isSelected ? '0 0 0 2px #4F46E5' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>{preset.name}</span>
                  {isSelected && (
                    <span style={styles.activeCheckBadge}>
                      <Check size={12} color="#FFFFFF" />
                    </span>
                  )}
                </div>

                {/* Renk Paleti Minyatür Önizlemesi */}
                <div style={styles.presetPaletteRow}>
                  <div style={{ ...styles.paletteDot, backgroundColor: preset.primaryColor }} title="Ana Renk" />
                  <div style={{ ...styles.paletteDot, backgroundColor: preset.cardBackground }} title="Kart Rengi" />
                  <div style={{ ...styles.paletteDot, backgroundColor: preset.textColor }} title="Metin Rengi" />
                  <div style={{ ...styles.paletteDot, backgroundColor: preset.accentColor }} title="Vurgu Rengi" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. İKİ KOLON: SOLDA RENK & TİPOGRAFİ AYARLARI, SAĞDA CANLI BİLEŞEN VİTRİNİ */}
      <div style={styles.twoColGrid}>
        {/* SOL: AYARLAR PANELİ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Renk Paleti Editörü */}
          <div style={styles.sectionCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Palette size={17} color="#4F46E5" />
              <h3 style={styles.sectionTitle}>Renk Paleti Özelleştirme</h3>
            </div>

            <div style={styles.colorFieldsGrid}>
              {/* Ana Renk */}
              <div style={styles.colorPickerField}>
                <label style={styles.colorLabel}>Ana Renk (Primary):</label>
                <div style={styles.colorInputRow}>
                  <input
                    type="color"
                    value={theme.primaryColor}
                    onChange={(e) => handleUpdateTheme({ ...theme, primaryColor: e.target.value, id: 'custom' })}
                    style={styles.colorPickerThumb}
                  />
                  <input
                    type="text"
                    value={theme.primaryColor}
                    onChange={(e) => handleUpdateTheme({ ...theme, primaryColor: e.target.value, id: 'custom' })}
                    style={styles.colorHexInput}
                  />
                </div>
              </div>

              {/* Arka Plan Rengi */}
              <div style={styles.colorPickerField}>
                <label style={styles.colorLabel}>Sayfa Arka Planı:</label>
                <div style={styles.colorInputRow}>
                  <input
                    type="color"
                    value={theme.backgroundColor}
                    onChange={(e) => handleUpdateTheme({ ...theme, backgroundColor: e.target.value, id: 'custom' })}
                    style={styles.colorPickerThumb}
                  />
                  <input
                    type="text"
                    value={theme.backgroundColor}
                    onChange={(e) => handleUpdateTheme({ ...theme, backgroundColor: e.target.value, id: 'custom' })}
                    style={styles.colorHexInput}
                  />
                </div>
              </div>

              {/* Kart Arka Planı */}
              <div style={styles.colorPickerField}>
                <label style={styles.colorLabel}>Kart / Blok Arka Planı:</label>
                <div style={styles.colorInputRow}>
                  <input
                    type="color"
                    value={theme.cardBackground}
                    onChange={(e) => handleUpdateTheme({ ...theme, cardBackground: e.target.value, id: 'custom' })}
                    style={styles.colorPickerThumb}
                  />
                  <input
                    type="text"
                    value={theme.cardBackground}
                    onChange={(e) => handleUpdateTheme({ ...theme, cardBackground: e.target.value, id: 'custom' })}
                    style={styles.colorHexInput}
                  />
                </div>
              </div>

              {/* Metin Rengi */}
              <div style={styles.colorPickerField}>
                <label style={styles.colorLabel}>Metin Rengi (Text):</label>
                <div style={styles.colorInputRow}>
                  <input
                    type="color"
                    value={theme.textColor}
                    onChange={(e) => handleUpdateTheme({ ...theme, textColor: e.target.value, id: 'custom' })}
                    style={styles.colorPickerThumb}
                  />
                  <input
                    type="text"
                    value={theme.textColor}
                    onChange={(e) => handleUpdateTheme({ ...theme, textColor: e.target.value, id: 'custom' })}
                    style={styles.colorHexInput}
                  />
                </div>
              </div>

              {/* Kenarlık Rengi */}
              <div style={styles.colorPickerField}>
                <label style={styles.colorLabel}>Kenarlık Rengi (Border):</label>
                <div style={styles.colorInputRow}>
                  <input
                    type="color"
                    value={theme.borderColor}
                    onChange={(e) => handleUpdateTheme({ ...theme, borderColor: e.target.value, id: 'custom' })}
                    style={styles.colorPickerThumb}
                  />
                  <input
                    type="text"
                    value={theme.borderColor}
                    onChange={(e) => handleUpdateTheme({ ...theme, borderColor: e.target.value, id: 'custom' })}
                    style={styles.colorHexInput}
                  />
                </div>
              </div>

              {/* Vurgu Rengi */}
              <div style={styles.colorPickerField}>
                <label style={styles.colorLabel}>Vurgu / Başarı Rengi:</label>
                <div style={styles.colorInputRow}>
                  <input
                    type="color"
                    value={theme.accentColor}
                    onChange={(e) => handleUpdateTheme({ ...theme, accentColor: e.target.value, id: 'custom' })}
                    style={styles.colorPickerThumb}
                  />
                  <input
                    type="text"
                    value={theme.accentColor}
                    onChange={(e) => handleUpdateTheme({ ...theme, accentColor: e.target.value, id: 'custom' })}
                    style={styles.colorHexInput}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tipografi & Font Ayarları */}
          <div style={styles.sectionCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Type size={17} color="#4F46E5" />
              <h3 style={styles.sectionTitle}>Tipografi &amp; Yazı Tipi</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Yazı Tipi Ailesi */}
              <div>
                <label style={styles.fieldLabel}>Yazı Tipi (Font Family):</label>
                <select
                  value={theme.fontFamily}
                  onChange={(e) => handleUpdateTheme({ ...theme, fontFamily: e.target.value, id: 'custom' })}
                  style={styles.dropdown}
                >
                  <option value="'Plus Jakarta Sans', 'Roboto', sans-serif">Plus Jakarta Sans (Modern &amp; Okunaklı)</option>
                  <option value="'Roboto', sans-serif">Roboto (Klasik &amp; Standart)</option>
                  <option value="'Poppins', sans-serif">Poppins (Geometrik &amp; Şık)</option>
                  <option value="'Merriweather', Georgia, serif">Merriweather (Serif - Kitap / Paragraf Hissi)</option>
                  <option value="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif">Sistem Varsayılanı</option>
                </select>
              </div>

              {/* Yazı Boyutu Ölçeği */}
              <div>
                <label style={styles.fieldLabel}>Metin Boyutu Ölçeği:</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { label: 'Küçük (%90)', scale: 0.9 },
                    { label: 'Normal (%100)', scale: 1.0 },
                    { label: 'Büyük (%115)', scale: 1.15 },
                  ].map((s) => (
                    <button
                      key={s.scale}
                      type="button"
                      onClick={() => handleUpdateTheme({ ...theme, fontSizeScale: s.scale, id: 'custom' })}
                      style={{
                        ...styles.pillBtn,
                        backgroundColor: theme.fontSizeScale === s.scale ? '#0F172A' : '#F1F5F9',
                        color: theme.fontSizeScale === s.scale ? '#FFFFFF' : '#475569',
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Kenarlık Yuvarlaklığı & Gölgelendirme */}
          <div style={styles.sectionCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Box size={17} color="#4F46E5" />
              <h3 style={styles.sectionTitle}>Kenar Yuvarlaklığı &amp; Gölgeler</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Border Radius */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={styles.fieldLabel}>Kenar Yuvarlaklığı (Radius):</label>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#4F46E5' }}>{theme.borderRadius}px</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[0, 6, 12, 16, 22].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleUpdateTheme({ ...theme, borderRadius: r, id: 'custom' })}
                      style={{
                        ...styles.pillBtn,
                        backgroundColor: theme.borderRadius === r ? '#0F172A' : '#F1F5F9',
                        color: theme.borderRadius === r ? '#FFFFFF' : '#475569',
                      }}
                    >
                      {r === 0 ? 'Keskin (0)' : r === 6 ? 'Hafif (6)' : r === 12 ? 'Standart (12)' : r === 16 ? 'Yuvarlak (16)' : 'Oval (22)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gölge Efekti */}
              <div>
                <label style={styles.fieldLabel}>Kart Gölgelendirmesi:</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['none', 'soft', 'deep', 'glow'] as const).map((sh) => (
                    <button
                      key={sh}
                      type="button"
                      onClick={() => handleUpdateTheme({ ...theme, shadowStyle: sh, id: 'custom' })}
                      style={{
                        ...styles.pillBtn,
                        backgroundColor: theme.shadowStyle === sh ? '#0F172A' : '#F1F5F9',
                        color: theme.shadowStyle === sh ? '#FFFFFF' : '#475569',
                      }}
                    >
                      {sh === 'none' ? 'Gölgesiz' : sh === 'soft' ? 'Hafif' : sh === 'deep' ? 'Derin' : 'Işıltılı'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SAĞ: CANLI BİLEŞEN VİTRİNİ (LIVE DEMO SHOWCASE) */}
        <div>
          <div style={{ ...styles.sectionCard, position: 'sticky', top: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Eye size={18} color="#4F46E5" />
              <h3 style={styles.sectionTitle}>Canlı Arayüz Vitrini (Canlı Önizleme)</h3>
            </div>

            <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 16px' }}>
              Yapılan tüm değişiklikler aşağıdaki vitrinde ve tüm sitede gerçek zamanlı olarak görüntülenir.
            </p>

            {/* Vitrin Konteyneri */}
            <div
              style={{
                backgroundColor: theme.backgroundColor,
                color: theme.textColor,
                fontFamily: theme.fontFamily,
                padding: '20px',
                borderRadius: `${theme.borderRadius}px`,
                border: `1px solid ${theme.borderColor}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Örnek Soru Kartı */}
              <div
                style={{
                  backgroundColor: theme.cardBackground,
                  borderRadius: `${theme.borderRadius}px`,
                  border: `1px solid ${theme.borderColor}`,
                  padding: '16px',
                  boxShadow:
                    theme.shadowStyle === 'none'
                      ? 'none'
                      : theme.shadowStyle === 'deep'
                      ? '0 10px 25px -5px rgba(0,0,0,0.2)'
                      : theme.shadowStyle === 'glow'
                      ? `0 4px 20px -2px ${theme.primaryColor}33`
                      : '0 2px 8px -2px rgba(0,0,0,0.06)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span
                    style={{
                      backgroundColor: `${theme.primaryColor}1A`,
                      color: theme.primaryColor,
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: `${theme.borderRadius / 2}px`,
                    }}
                  >
                    Örnek Soru #1
                  </span>
                  <span style={{ fontSize: '11px', color: theme.textMuted }}>KPSS Genel Kültür</span>
                </div>

                <div style={{ fontSize: `${14 * theme.fontSizeScale}px`, fontWeight: 600, lineHeight: 1.5, marginBottom: '14px' }}>
                  Aşağıdakilerden hangisi Osmanlı Devleti'nde doğrudan padişaha bağlı kapıkulu ordusu süvarilerinden biridir?
                </div>

                {/* Şıklar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { id: 'A', text: 'Tımarlı Sipahiler' },
                    { id: 'B', text: 'Sipahiler ve Silahtarlar', correct: true },
                    { id: 'C', text: 'Azaplar' },
                  ].map((opt) => (
                    <div
                      key={opt.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: `${theme.borderRadius / 1.5}px`,
                        border: `1.5px solid ${opt.correct ? theme.accentColor : theme.borderColor}`,
                        backgroundColor: opt.correct ? `${theme.accentColor}1A` : theme.cardBackground,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: `${13 * theme.fontSizeScale}px`,
                      }}
                    >
                      <span
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          backgroundColor: opt.correct ? theme.accentColor : theme.borderColor,
                          color: opt.correct ? '#FFFFFF' : theme.textColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        {opt.id}
                      </span>
                      <span>{opt.text}</span>
                      {opt.correct && <Check size={14} color={theme.accentColor} style={{ marginLeft: 'auto' }} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Buton Vitrini */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  style={{
                    backgroundColor: theme.primaryColor,
                    color: '#FFFFFF',
                    borderRadius: `${theme.borderRadius / 1.5}px`,
                    border: 'none',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Birincil Buton
                </button>

                <button
                  style={{
                    backgroundColor: theme.accentColor,
                    color: '#FFFFFF',
                    borderRadius: `${theme.borderRadius / 1.5}px`,
                    border: 'none',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Vurgu Butonu
                </button>

                <button
                  style={{
                    backgroundColor: theme.cardBackground,
                    color: theme.textColor,
                    borderRadius: `${theme.borderRadius / 1.5}px`,
                    border: `1px solid ${theme.borderColor}`,
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  İkincil Buton
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: TEMA JSON İÇE AKTARMA */}
      {/* ============================================================== */}
      {showImportModal && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <h3 style={styles.modalTitle}>Özel Tema JSON İçe Aktar</h3>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '6px 0 12px' }}>
              Daha önce dışa aktardığınız veya paylaşılan bir tema JSON metnini buraya yapıştırınız.
            </p>

            <textarea
              rows={8}
              placeholder="Tema JSON metnini buraya yapıştırın..."
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              style={styles.textAreaField}
            />

            <div style={styles.modalActionsRow}>
              <button onClick={() => setShowImportModal(false)} style={styles.btnSecondary}>
                Vazgeç
              </button>
              <button onClick={handleImportJson} style={styles.btnPrimary}>
                Temayı Yükle ve Uygula
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------
// STİL TANIMLARI
// ----------------------------------------------------
const styles: Record<string, React.CSSProperties> = {
  topCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    border: '1px solid #E2E8F0',
    padding: '18px 20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  headerIconBox: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    backgroundColor: '#EEF2FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: '17px',
    fontWeight: 700,
    color: '#0F172A',
    margin: 0,
  },
  headerSub: {
    fontSize: '12px',
    color: '#64748B',
    margin: '2px 0 0',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    border: '1px solid #E2E8F0',
    padding: '18px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#0F172A',
    margin: 0,
  },
  presetsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
  },
  presetCard: {
    borderRadius: '12px',
    borderWidth: '1.5px',
    borderStyle: 'solid',
    padding: '14px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  activeCheckBadge: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    backgroundColor: '#4F46E5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetPaletteRow: {
    display: 'flex',
    gap: '6px',
    marginTop: '6px',
  },
  paletteDot: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    border: '1px solid rgba(0,0,0,0.15)',
  },
  twoColGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
  },
  colorFieldsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '12px',
  },
  colorPickerField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  colorLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#475569',
  },
  colorInputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  colorPickerThumb: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    border: '1px solid #CBD5E1',
    cursor: 'pointer',
    padding: 0,
    backgroundColor: 'transparent',
  },
  colorHexInput: {
    flex: 1,
    padding: '6px 8px',
    borderRadius: '6px',
    border: '1px solid #CBD5E1',
    fontSize: '12px',
    fontFamily: 'monospace',
    outline: 'none',
  },
  fieldLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#475569',
    marginBottom: '6px',
    display: 'block',
  },
  dropdown: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    fontSize: '13px',
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    outline: 'none',
  },
  pillBtn: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 16px',
    borderRadius: '8px',
    backgroundColor: '#4F46E5',
    color: '#FFFFFF',
    border: 'none',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '7px 12px',
    borderRadius: '8px',
    backgroundColor: '#F8FAFC',
    color: '#334155',
    border: '1px solid #CBD5E1',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: '17px',
    fontWeight: 700,
    color: '#0F172A',
    margin: 0,
  },
  textAreaField: {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    fontFamily: 'monospace',
    fontSize: '12px',
    boxSizing: 'border-box',
    outline: 'none',
    resize: 'vertical',
  },
  modalActionsRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '16px',
  },
};
