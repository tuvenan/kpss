/**
 * KPSS Tipografi Standartları
 * Google Fonts 'Roboto' ailesi ve matematik/sembollerin bozulmaması için
 * geniş ve ferah satır aralıkları (line-height).
 */

export const fontFamilies = {
  regular: 'Roboto_400Regular',
  medium: 'Roboto_500Medium',
  bold: 'Roboto_700Bold',
} as const;

export type FontFamilyType = keyof typeof fontFamilies;

export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  title: 28,
} as const;

export type FontSizeKey = keyof typeof fontSizes;

/**
 * Matematiksel formüller, kesirler ve özel sembollerin
 * birbirine çarpmaması için ferah line-height (yaklaşık 1.5x - 1.6x)
 */
export const lineHeights = {
  xs: 18,
  sm: 22,
  base: 26,
  lg: 28,
  xl: 32,
  xxl: 36,
  title: 40,
} as const;
