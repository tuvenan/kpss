/**
 * KPSS Odaklı Minimalist Tema Renkleri
 * Sıfır dikkat dağıtıcı öğe prensibiyle tasarlanmıştır.
 */
export const colors = {
  /** Arka plan: Göz yormayan, ferah kırık beyaz */
  background: '#F9F9FB',
  /** Birincil Metin: Tam siyah */
  text: '#000000',
  /** Kenarlık ve Ayraçlar: Net ve sade gri */
  border: '#E5E7EB',
  /** Doğru Cevap Vurgusu: Sade zümrüt yeşili */
  correct: '#16A34A',
  /** Yanlış Cevap Vurgusu: Sade mat kırmızı */
  wrong: '#DC2626',
  /** Seçili Şık / Nötr Vurgu: Odaklanmayı artıran koyu grafit */
  selected: '#111827',
  /** Yüzey / Kart Arka Planı: Saf beyaz */
  surface: '#FFFFFF',
  /** İkincil Metin: Yardımcı ve soru numarası gibi öğeler için */
  textSecondary: '#4B5563',
  /** Pasif / Muted Metin */
  textMuted: '#9CA3AF',
} as const;

export type ThemeColors = typeof colors;
