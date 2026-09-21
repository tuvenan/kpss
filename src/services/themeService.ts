export interface ThemeConfig {
  id: string;
  name: string;
  primaryColor: string;
  primaryHover: string;
  backgroundColor: string;
  cardBackground: string;
  textColor: string;
  textMuted: string;
  borderColor: string;
  accentColor: string;
  fontFamily: string;
  fontSizeScale: number; // 0.9 = Küçük, 1.0 = Normal, 1.15 = Büyük
  borderRadius: number;  // 0, 6, 12, 18, 24
  shadowStyle: 'none' | 'soft' | 'deep' | 'glow';
  isDark: boolean;
}

const THEME_STORAGE_KEY = 'kpss_active_theme_config_v1';

export const PRESET_THEMES: ThemeConfig[] = [
  {
    id: 'modern-kpss',
    name: 'Modern KPSS (Varsayılan)',
    primaryColor: '#4F46E5',
    primaryHover: '#4338CA',
    backgroundColor: '#F8FAFC',
    cardBackground: '#FFFFFF',
    textColor: '#0F172A',
    textMuted: '#64748B',
    borderColor: '#E2E8F0',
    accentColor: '#10B981',
    fontFamily: "'Plus Jakarta Sans', 'Roboto', sans-serif",
    fontSizeScale: 1.0,
    borderRadius: 12,
    shadowStyle: 'soft',
    isDark: false,
  },
  {
    id: 'dark-midnight',
    name: 'Gece / Koyu Mod (Göz Dinlendirici)',
    primaryColor: '#818CF8',
    primaryHover: '#6366F1',
    backgroundColor: '#0B0F19',
    cardBackground: '#111827',
    textColor: '#F9FAFB',
    textMuted: '#9CA3AF',
    borderColor: '#1F2937',
    accentColor: '#34D399',
    fontFamily: "'Plus Jakarta Sans', 'Roboto', sans-serif",
    fontSizeScale: 1.0,
    borderRadius: 12,
    shadowStyle: 'deep',
    isDark: true,
  },
  {
    id: 'forest-green',
    name: 'Zümrüt Yeşili (Odaklanma Modu)',
    primaryColor: '#059669',
    primaryHover: '#047857',
    backgroundColor: '#F0FDF4',
    cardBackground: '#FFFFFF',
    textColor: '#064E3B',
    textMuted: '#047857',
    borderColor: '#A7F3D0',
    accentColor: '#10B981',
    fontFamily: "'Plus Jakarta Sans', 'Roboto', sans-serif",
    fontSizeScale: 1.0,
    borderRadius: 14,
    shadowStyle: 'soft',
    isDark: false,
  },
  {
    id: 'reading-sepia',
    name: 'Kitap & Sepya (Uzun Paragraf Okuma)',
    primaryColor: '#854D0E',
    primaryHover: '#713F12',
    backgroundColor: '#FBF9F5',
    cardBackground: '#F5EFEB',
    textColor: '#451A03',
    textMuted: '#78350F',
    borderColor: '#E6DEC8',
    accentColor: '#D97706',
    fontFamily: "'Merriweather', Georgia, serif",
    fontSizeScale: 1.05,
    borderRadius: 10,
    shadowStyle: 'soft',
    isDark: false,
  },
  {
    id: 'sunset-rose',
    name: 'Gün Batımı & Sıcak Pembe',
    primaryColor: '#E11D48',
    primaryHover: '#BE123C',
    backgroundColor: '#FFF1F2',
    cardBackground: '#FFFFFF',
    textColor: '#881337',
    textMuted: '#9F1239',
    borderColor: '#FECDD3',
    accentColor: '#F43F5E',
    fontFamily: "'Poppins', sans-serif",
    fontSizeScale: 1.0,
    borderRadius: 16,
    shadowStyle: 'glow',
    isDark: false,
  },
  {
    id: 'deep-ocean',
    name: 'Derin Okyanus Mavisi',
    primaryColor: '#0284C7',
    primaryHover: '#0369A1',
    backgroundColor: '#F0F9FF',
    cardBackground: '#FFFFFF',
    textColor: '#0C4A6E',
    textMuted: '#0369A1',
    borderColor: '#BAE6FD',
    accentColor: '#0EA5E9',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSizeScale: 1.0,
    borderRadius: 12,
    shadowStyle: 'soft',
    isDark: false,
  },
];

export const themeService = {
  /** Aktif temayı getirir */
  getActiveTheme(): ThemeConfig {
    if (typeof window === 'undefined') return PRESET_THEMES[0];
    try {
      const raw = localStorage.getItem(THEME_STORAGE_KEY);
      if (raw) {
        return { ...PRESET_THEMES[0], ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn('getActiveTheme error:', e);
    }
    return PRESET_THEMES[0];
  },

  /** Temayı kaydeder ve CSS değişkenlerini DOM'a uygular */
  setActiveTheme(theme: ThemeConfig): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
      this.applyTheme(theme);
      window.dispatchEvent(new Event('kpss_theme_changed'));
    } catch (e) {
      console.warn('setActiveTheme error:', e);
    }
  },

  /** CSS Değişkenlerini document element'e enjekte eder */
  applyTheme(theme: ThemeConfig): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    root.style.setProperty('--kpss-primary', theme.primaryColor);
    root.style.setProperty('--kpss-primary-hover', theme.primaryHover);
    root.style.setProperty('--kpss-bg', theme.backgroundColor);
    root.style.setProperty('--kpss-card-bg', theme.cardBackground);
    root.style.setProperty('--kpss-text', theme.textColor);
    root.style.setProperty('--kpss-text-muted', theme.textMuted);
    root.style.setProperty('--kpss-border', theme.borderColor);
    root.style.setProperty('--kpss-accent', theme.accentColor);
    root.style.setProperty('--kpss-radius', `${theme.borderRadius}px`);
    root.style.setProperty('--kpss-font', theme.fontFamily);
    root.style.setProperty('--kpss-font-scale', `${theme.fontSizeScale}`);

    // Gölgelendirme stili
    const shadowMap = {
      none: 'none',
      soft: '0 2px 8px -2px rgba(0, 0, 0, 0.05)',
      deep: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
      glow: `0 4px 20px -2px ${theme.primaryColor}33`,
    };
    root.style.setProperty('--kpss-shadow', shadowMap[theme.shadowStyle] || shadowMap.soft);

    // Body arka plan rengini ve fontunu güncelle
    document.body.style.backgroundColor = theme.backgroundColor;
    document.body.style.color = theme.textColor;
    document.body.style.fontFamily = theme.fontFamily;
  },

  /** Varsayılan Modern KPSS temasına sıfırlar */
  resetToDefault(): ThemeConfig {
    this.setActiveTheme(PRESET_THEMES[0]);
    return PRESET_THEMES[0];
  },

  /** Temayı JSON olarak dışa aktarır */
  exportThemeJson(theme: ThemeConfig): string {
    return JSON.stringify(theme, null, 2);
  },

  /** JSON metninden temayı yükler */
  importThemeJson(raw: string): ThemeConfig | null {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.primaryColor && parsed.backgroundColor) {
        const full: ThemeConfig = {
          ...PRESET_THEMES[0],
          ...parsed,
          id: `custom-${Date.now()}`,
        };
        this.setActiveTheme(full);
        return full;
      }
    } catch {}
    return null;
  },
};
