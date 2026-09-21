/**
 * KPSS Tasarım ve Boyut Standartları
 * Bütün buton ve şık alanları en az 52px yükseklikte, tam dokunulabilir alanlardır.
 */

export const dimensions = {
  /** Minimum dokunulabilir hit target alanı (52px) */
  minTouchTarget: 52,

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  borderRadius: {
    none: 0,
    sm: 6,
    md: 10,
    lg: 14,
    full: 9999,
  },

  borderWidth: {
    thin: 1,
    thick: 2,
  },
} as const;

export type Dimensions = typeof dimensions;
