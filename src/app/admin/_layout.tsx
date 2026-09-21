import React from 'react';
import { View, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/common/AppText';
import { colors } from '@/theme/colors';
import { dimensions } from '@/theme/dimensions';
import { isSupabaseConfigured } from '@/services/supabase';

interface NavItem {
  id: string;
  label: string;
  path: string;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Genel Bakış', path: '/admin' },
  { id: 'questions', label: 'Soru Bankası', path: '/admin/questions' },
  { id: 'units', label: 'Dersler & Üniteler', path: '/admin/units' },
  { id: 'error-pool', label: 'Hata Havuzu Analitiği', path: '/admin/error-pool' },
];

export default function AdminLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const isCloud = isSupabaseConfigured();

  const handleNavPress = (path: string) => {
    router.push(path as any);
  };

  const handleReturnToStudent = () => {
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 1. ÜST HEADER: Admin Başlığı + Supabase Durumu + Öğrenciye Dönüş */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.adminLogoBadge}>
            <AppText weight="bold" size="sm" color="#FFFFFF">
              ADM
            </AppText>
          </View>
          <View>
            <AppText weight="bold" size="base" color={colors.selected}>
              KPSS Yönetici Paneli
            </AppText>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isCloud ? colors.correct : '#EAB308' },
                ]}
              />
              <AppText weight="regular" size="xs" color={colors.textSecondary}>
                {isCloud ? 'Supabase Bulut Bağlantısı Aktif' : 'Yerel Veri Modu (Çevrimdışı)'}
              </AppText>
            </View>
          </View>
        </View>

        <Pressable
          onPress={handleReturnToStudent}
          style={styles.studentReturnButton}
        >
          <AppText weight="medium" size="sm" color={colors.selected}>
            ← Öğrenci Görünümüne Dön
          </AppText>
        </Pressable>
      </View>

      {/* 2. ANA ALAN: Web Sidebar + Sayfa İçeriği */}
      <View style={styles.body}>
        {/* Sol Menü (Sidebar) */}
        <View style={styles.sidebar}>
          <AppText weight="bold" size="xs" color={colors.textMuted} style={styles.sidebarSectionTitle}>
            YÖNETİM MENÜSÜ
          </AppText>

          {NAV_ITEMS.map((item) => {
            const isActive =
              item.path === '/admin'
                ? pathname === '/admin' || pathname === '/admin/'
                : pathname.startsWith(item.path);

            return (
              <Pressable
                key={item.id}
                onPress={() => handleNavPress(item.path)}
                style={[
                  styles.navButton,
                  {
                    backgroundColor: isActive ? colors.selected : 'transparent',
                  },
                ]}
              >
                <AppText
                  weight={isActive ? 'bold' : 'medium'}
                  size="sm"
                  color={isActive ? '#FFFFFF' : colors.text}
                >
                  {item.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {/* Sağ İçerik Alanı */}
        <View style={styles.contentArea}>
          <Slot />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 60,
    backgroundColor: colors.surface,
    borderBottomWidth: dimensions.borderWidth.thin,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: dimensions.spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: dimensions.spacing.md,
  },
  adminLogoBadge: {
    width: 38,
    height: 38,
    borderRadius: dimensions.borderRadius.sm,
    backgroundColor: colors.selected,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  studentReturnButton: {
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.sm,
    backgroundColor: colors.background,
    borderWidth: dimensions.borderWidth.thin,
    borderColor: colors.border,
  },
  body: {
    flex: 1,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
  },
  sidebar: {
    width: Platform.OS === 'web' ? 240 : '100%',
    backgroundColor: colors.surface,
    borderRightWidth: dimensions.borderWidth.thin,
    borderRightColor: colors.border,
    paddingVertical: dimensions.spacing.lg,
    paddingHorizontal: dimensions.spacing.md,
    gap: dimensions.spacing.xs,
  },
  sidebarSectionTitle: {
    paddingHorizontal: dimensions.spacing.sm,
    marginBottom: dimensions.spacing.xs,
    letterSpacing: 0.5,
  },
  navButton: {
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: 10,
    borderRadius: dimensions.borderRadius.sm,
  },
  contentArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
