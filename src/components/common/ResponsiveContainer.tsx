import React from 'react';
import { View, StyleSheet, Platform, ViewProps } from 'react-native';
import { colors } from '@/theme/colors';

interface ResponsiveContainerProps extends ViewProps {
  maxWidth?: number;
  children: React.ReactNode;
}

/**
 * Web ve Mobil için duyarlı (Responsive) kapsayıcı bileşen.
 * Web üzerinde geniş masaüstü ekranlarında odaklanmayı dağıtmamak için
 * içeriği maksimum 720px genişlikte ortalar; mobil cihazlarda ise %100 genişlik kullanır.
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  maxWidth = 720,
  style,
  children,
  ...props
}) => {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webOuter}>
        <View style={[styles.webInner, { maxWidth }, style]} {...props}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.mobileContainer, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  webOuter: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  webInner: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.background,
  },
  mobileContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

export default ResponsiveContainer;
