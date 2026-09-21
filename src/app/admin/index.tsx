import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/common/AppText';
import { colors } from '@/theme/colors';
import { dimensions } from '@/theme/dimensions';
import { adminService, AdminOverviewStats } from '@/services/adminService';

export default function AdminOverviewScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const data = await adminService.getOverviewStats();
    setStats(data);
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    setSeedMessage(null);
    const result = await adminService.seedAllDataToSupabase();
    setIsSeeding(false);
    setSeedMessage(result.message);
    loadStats();
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Sayfa Başlığı */}
      <View style={styles.header}>
        <AppText weight="bold" size="xl" color={colors.selected}>
          Sistem Genel Bakış &bull; Yönetim Özeti
        </AppText>
        <AppText weight="regular" size="sm" color={colors.textSecondary}>
          Mobil, Web ve Veritabanı bileşenlerinin merkezi durumu
        </AppText>
      </View>

      <View style={styles.divider} />

      {/* 1. İstatistik Sayaç Kartları */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <AppText weight="regular" size="sm" color={colors.textSecondary}>
            Toplam Ders
          </AppText>
          <AppText weight="bold" size="title" color={colors.selected}>
            {stats?.totalSubjects ?? '...'}
          </AppText>
          <AppText weight="regular" size="xs" color={colors.textMuted}>
            Tarih, Coğrafya, Vatandaşlık
          </AppText>
        </View>

        <View style={styles.statCard}>
          <AppText weight="regular" size="sm" color={colors.textSecondary}>
            Toplam Ünite
          </AppText>
          <AppText weight="bold" size="title" color={colors.selected}>
            {stats?.totalUnits ?? '...'}
          </AppText>
          <AppText weight="regular" size="xs" color={colors.textMuted}>
            Sıralı Kilit Mimarisi
          </AppText>
        </View>

        <View style={styles.statCard}>
          <AppText weight="regular" size="sm" color={colors.textSecondary}>
            Soru Bankası Havuzu
          </AppText>
          <AppText weight="bold" size="title" color={colors.correct}>
            {stats?.totalQuestions ?? '...'}
          </AppText>
          <AppText weight="regular" size="xs" color={colors.textMuted}>
            MEB / ÖSYM Standardı
          </AppText>
        </View>

        <View style={styles.statCard}>
          <AppText weight="regular" size="sm" color={colors.textSecondary}>
            Hata Havuzu Kaydı
          </AppText>
          <AppText weight="bold" size="title" color={colors.wrong}>
            {stats?.totalErrorsInPool ?? '0'}
          </AppText>
          <AppText weight="regular" size="xs" color={colors.textMuted}>
            Çözüm Bekleyen Yanlışlar
          </AppText>
        </View>
      </View>

      {/* 2. Supabase Bulut Veritabanı Yönetimi & Tohumlama */}
      <View style={styles.sectionCard}>
        <AppText weight="bold" size="lg" color={colors.selected} style={styles.cardTitle}>
          Supabase Bulut Veritabanı Eşitleme
        </AppText>
        <AppText weight="regular" size="sm" color={colors.textSecondary} style={styles.cardDescription}>
          Tüm başlangıç derslerini, ünitelerini ve 20 adet KPSS sorusunu Supabase veritabanındaki
          `subjects`, `units` ve `questions` tablolarına tek tıkla aktarabilirsiniz.
        </AppText>

        {seedMessage && (
          <View style={styles.messageBox}>
            <AppText weight="medium" size="sm" color={colors.selected}>
              {seedMessage}
            </AppText>
          </View>
        )}

        <View style={styles.actionRow}>
          <Pressable
            onPress={handleSeedData}
            disabled={isSeeding}
            style={[
              styles.primaryButton,
              { backgroundColor: isSeeding ? colors.border : colors.selected },
            ]}
          >
            {isSeeding ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <AppText weight="medium" size="sm" color="#FFFFFF">
                Supabase Verilerini Tohumla (Seed) →
              </AppText>
            )}
          </Pressable>

          <Pressable onPress={loadStats} style={styles.secondaryButton}>
            <AppText weight="medium" size="sm" color={colors.text}>
              Yenile
            </AppText>
          </Pressable>
        </View>
      </View>

      {/* 3. Hızlı Erişim Kartları */}
      <View style={styles.quickAccessGrid}>
        <Pressable
          onPress={() => router.push('/admin/questions')}
          style={styles.quickCard}
        >
          <AppText weight="bold" size="base" color={colors.selected}>
            Soru Yönetimi
          </AppText>
          <AppText weight="regular" size="xs" color={colors.textSecondary}>
            Soru ekle, düzenle, şıkları incele veya soru sil.
          </AppText>
          <AppText weight="bold" size="sm" color={colors.selected} style={styles.arrowLink}>
            Sorulara Git →
          </AppText>
        </Pressable>

        <Pressable
          onPress={() => router.push('/admin/error-pool')}
          style={styles.quickCard}
        >
          <AppText weight="bold" size="base" color={colors.wrong}>
            Hata Havuzu Analitiği
          </AppText>
          <AppText weight="regular" size="xs" color={colors.textSecondary}>
            Öğrencilerin en çok zorlandığı soruları raporla.
          </AppText>
          <AppText weight="bold" size="sm" color={colors.wrong} style={styles.arrowLink}>
            Analizi Gör →
          </AppText>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: dimensions.spacing.xl,
    gap: dimensions.spacing.lg,
  },
  header: {
    gap: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: dimensions.spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: colors.surface,
    padding: dimensions.spacing.lg,
    borderRadius: dimensions.borderRadius.md,
    borderWidth: dimensions.borderWidth.thin,
    borderColor: colors.border,
    gap: 6,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    padding: dimensions.spacing.xl,
    borderRadius: dimensions.borderRadius.md,
    borderWidth: dimensions.borderWidth.thin,
    borderColor: colors.border,
    gap: dimensions.spacing.md,
  },
  cardTitle: {
    letterSpacing: 0.1,
  },
  cardDescription: {
    lineHeight: 22,
  },
  messageBox: {
    padding: dimensions.spacing.md,
    backgroundColor: '#F0FDF4',
    borderWidth: dimensions.borderWidth.thin,
    borderColor: colors.correct,
    borderRadius: dimensions.borderRadius.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: dimensions.spacing.md,
  },
  primaryButton: {
    minHeight: 44,
    paddingHorizontal: dimensions.spacing.lg,
    borderRadius: dimensions.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    minHeight: 44,
    paddingHorizontal: dimensions.spacing.lg,
    borderRadius: dimensions.borderRadius.sm,
    borderWidth: dimensions.borderWidth.thin,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    gap: dimensions.spacing.md,
  },
  quickCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: dimensions.spacing.lg,
    borderRadius: dimensions.borderRadius.md,
    borderWidth: dimensions.borderWidth.thin,
    borderColor: colors.border,
    gap: 8,
  },
  arrowLink: {
    marginTop: 8,
  },
});
