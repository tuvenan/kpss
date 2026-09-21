import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { colors } from '@/theme/colors';
import { dimensions } from '@/theme/dimensions';
import { adminService, FailedQuestionStat } from '@/services/adminService';
import { errorPoolService } from '@/services/errorPoolService';

export default function AdminErrorPoolScreen() {
  const [stats, setStats] = useState<{ totalUnresolved: number; totalResolved: number }>({
    totalUnresolved: 0,
    totalResolved: 0,
  });
  const [failedQuestions, setFailedQuestions] = useState<FailedQuestionStat[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const errorStats = await errorPoolService.getErrorPoolStats();
    setStats(errorStats);

    const mostFailed = await adminService.getMostFailedQuestions();
    setFailedQuestions(mostFailed);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Üst Başlık */}
      <View style={styles.header}>
        <AppText weight="bold" size="xl" color={colors.selected}>
          Hata Havuzu Analitiği (Error Pool Analytics)
        </AppText>
        <AppText weight="regular" size="sm" color={colors.textSecondary}>
          Öğrencilerin en çok yanlış yaptığı kritik KPSS soruları
        </AppText>
      </View>

      <View style={styles.divider} />

      {/* İstatistik Sayaçları */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <AppText weight="regular" size="sm" color={colors.textSecondary}>
            Bekleyen Yanlışlar
          </AppText>
          <AppText weight="bold" size="title" color={colors.wrong}>
            {stats.totalUnresolved}
          </AppText>
          <AppText weight="regular" size="xs" color={colors.textMuted}>
            Henüz telafi edilmemiş
          </AppText>
        </View>

        <View style={styles.statCard}>
          <AppText weight="regular" size="sm" color={colors.textSecondary}>
            Başarıyla Çözülen Yanlışlar
          </AppText>
          <AppText weight="bold" size="title" color={colors.correct}>
            {stats.totalResolved}
          </AppText>
          <AppText weight="regular" size="xs" color={colors.textMuted}>
            Tekrar pratiğinde öğrenilmiş
          </AppText>
        </View>
      </View>

      {/* En Çok Yanlış Yapılan Sorular Listesi */}
      <View style={styles.sectionCard}>
        <AppText weight="bold" size="lg" color={colors.selected} style={styles.cardTitle}>
          En Çok Hata Yapılan Sorular
        </AppText>
        <AppText weight="regular" size="sm" color={colors.textSecondary} style={styles.cardDesc}>
          Öğrencilerin sınav hazırlığında en sık zorlandığı konuları ve soru dağılımını gösterir.
        </AppText>

        {failedQuestions.length === 0 ? (
          <View style={styles.emptyBox}>
            <AppText weight="medium" size="sm" color={colors.textSecondary}>
              Henüz Supabase bulut veritabanında kayıtlı öğrenci hatası bulunmuyor.
            </AppText>
          </View>
        ) : (
          <View style={styles.list}>
            {failedQuestions.map((item, index) => (
              <View key={item.questionId} style={styles.failedRow}>
                <View style={styles.rankBadge}>
                  <AppText weight="bold" size="sm" color={colors.wrong}>
                    #{index + 1}
                  </AppText>
                </View>

                <View style={{ flex: 1, gap: 4 }}>
                  <AppText weight="medium" size="sm" color={colors.text}>
                    {item.questionText}
                  </AppText>
                  <View style={styles.metaRow}>
                    <AppText weight="regular" size="xs" color={colors.textSecondary}>
                      Ünite: {item.unitId} &bull; Doğru Şık: {item.correctOption}
                    </AppText>
                  </View>
                </View>

                <View style={styles.countBadge}>
                  <AppText weight="bold" size="sm" color={colors.wrong}>
                    {item.wrongCount} Hata
                  </AppText>
                </View>
              </View>
            ))}
          </View>
        )}
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
  statsRow: {
    flexDirection: 'row',
    gap: dimensions.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: dimensions.spacing.lg,
    borderRadius: dimensions.borderRadius.md,
    borderWidth: dimensions.borderWidth.thin,
    borderColor: colors.border,
    gap: 4,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    padding: dimensions.spacing.lg,
    borderRadius: dimensions.borderRadius.md,
    borderWidth: dimensions.borderWidth.thin,
    borderColor: colors.border,
    gap: dimensions.spacing.md,
  },
  cardTitle: {
    letterSpacing: 0.1,
  },
  cardDesc: {
    lineHeight: 20,
  },
  emptyBox: {
    padding: dimensions.spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: dimensions.borderRadius.sm,
  },
  list: {
    gap: dimensions.spacing.sm,
  },
  failedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: dimensions.spacing.md,
    borderWidth: dimensions.borderWidth.thin,
    borderColor: colors.border,
    borderRadius: dimensions.borderRadius.sm,
    gap: dimensions.spacing.md,
    backgroundColor: colors.background,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.wrong,
  },
  metaRow: {
    flexDirection: 'row',
    gap: dimensions.spacing.xs,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: colors.wrong,
  },
});
