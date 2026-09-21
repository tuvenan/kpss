import React from 'react';
import {
  Text as RNText,
  TextProps as RNTextProps,
  StyleSheet,
  StyleProp,
  TextStyle,
} from 'react-native';
import { colors } from '@/theme/colors';
import {
  fontFamilies,
  fontSizes,
  lineHeights,
  FontFamilyType,
  FontSizeKey,
} from '@/theme/typography';

export interface AppTextProps extends RNTextProps {
  weight?: FontFamilyType;
  size?: FontSizeKey;
  color?: string;
  style?: StyleProp<TextStyle>;
}

/**
 * KPSS uygulaması genelinde varsayılan Roboto tipografisini ve
 * matematik/sembol uyumlu ferah satır aralığını sağlayan Text bileşeni.
 */
export const AppText: React.FC<AppTextProps> = ({
  children,
  weight = 'regular',
  size = 'base',
  color = colors.text,
  style,
  ...rest
}) => {
  return (
    <RNText
      style={[
        styles.base,
        {
          fontFamily: fontFamilies[weight],
          fontSize: fontSizes[size],
          lineHeight: lineHeights[size],
          color,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

export default AppText;
