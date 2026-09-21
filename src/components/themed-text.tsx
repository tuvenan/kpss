import React from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';
import { fontFamilies } from '@/theme/typography';
import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        styles.base,
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: fontFamilies.regular,
  },
  small: {
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    lineHeight: 22,
  },
  smallBold: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
    lineHeight: 22,
  },
  default: {
    fontFamily: fontFamilies.regular,
    fontSize: 16,
    lineHeight: 26,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 28,
    lineHeight: 36,
  },
  subtitle: {
    fontFamily: fontFamilies.medium,
    fontSize: 20,
    lineHeight: 30,
  },
  link: {
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    lineHeight: 22,
  },
  linkPrimary: {
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    lineHeight: 22,
    color: '#16A34A',
  },
  code: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    lineHeight: 20,
  },
});
