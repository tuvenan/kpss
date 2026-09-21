import { colors } from '@/theme/colors';
import { fontFamilies } from '@/theme/typography';
import { dimensions } from '@/theme/dimensions';
import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: colors.text,
    background: colors.background,
    border: colors.border,
    correct: colors.correct,
    wrong: colors.wrong,
    selected: colors.selected,
    surface: colors.surface,
    textSecondary: colors.textSecondary,
    textMuted: colors.textMuted,
  },
  dark: {
    text: colors.text,
    background: colors.background,
    border: colors.border,
    correct: colors.correct,
    wrong: colors.wrong,
    selected: colors.selected,
    surface: colors.surface,
    textSecondary: colors.textSecondary,
    textMuted: colors.textMuted,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const Fonts = {
  sans: fontFamilies.regular,
  serif: fontFamilies.regular,
  rounded: fontFamilies.regular,
  mono: fontFamilies.regular,
};

export const Spacing = {
  half: dimensions.spacing.xs / 2,
  one: dimensions.spacing.xs,
  two: dimensions.spacing.sm,
  three: dimensions.spacing.md,
  four: dimensions.spacing.lg,
  five: dimensions.spacing.xl,
  six: dimensions.spacing.xxl,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export { colors, fontFamilies, dimensions };
export const MinTouchTarget = dimensions.minTouchTarget;
