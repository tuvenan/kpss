import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/common/AppText';
import { colors } from '@/theme/colors';
import { dimensions } from '@/theme/dimensions';
import { useQuizStore } from '@/store/useQuizStore';
import { errorPoolService } from '@/services/errorPoolService';
import { Subject } from '@/types';

export const SubjectListScreen: React.FC = () => {
  const { subjects, loadSubjects, selectSubject, startErrorPoolPractice } = useQuizStore();
  const [totalPoolErrors, setTotalPoolErrors] = useState<number>(0);

  useEffect(() => {
    loadSubjects();
    errorPoolService.getErrorPoolStats().then((stats) => {
      setTotalPoolErrors(stats.totalUnresolved);
    });
  }, [loadSubjects]);

  const handleSubjectPress = (subject: Subject) => {
    selectSubject(subject.id);
  };

  const handleStartGlobalErrorPool = async () => {
    if (totalPoolErrors > 0) {
      await startErrorPoolPractice();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Minimalist Başlık */}
        <View style={styles.header}>
          <AppText weight="bold" size="title" color={colors.selected}>
            KPSS Soru Bankası
          </AppText>
          <AppText weight="regular" size="sm" color={colors.textSecondary} style={styles.subtitle}>
            Sıfır dikkat dağınıklığı &bull; Odaklan ve ilerle
          </AppText>
        </View>

        <View style={styles.divider} />

        {/* Global Hata Havuzu Kartı (Eğer hata varsa belirir) */}
        {totalPoolErrors > 0 && (
          <Pressable
            onPress={handleStartGlobalErrorPool}
            style={styles.errorPoolCard}
          >
            <View style={styles.errorPoolIcon}>
              <AppText weight="bold" size="base" color={colors.wrong}>
                !
              </AppText>
            </View>
            <View style={styles.errorPoolInfo}>
              <AppText weight="bold" size="base" color={colors.selected}>
                Hata Havuzu ({totalPoolErrors} Soru)
              </AppText>
              <AppText weight="regular" size="xs" color={colors.textSecondary}>
                Daha önce yanlış yaptığın soruları tekrar çöz
              </AppText>
            </View>
            <AppText weight="medium" size="sm" color={colors.wrong}>
              Pratik Yap →
            </AppText>
          </Pressable>
        )}

        <AppText weight="bold" size="base" color={colors.selected} style={styles.sectionLabel}>
          Dersler
        </AppText>

        {/* Dersler Listesi */}
        <View style={styles.subjectList}>
          {subjects.map((subject) => {
            const initial = subject.title.charAt(0).toUpperCase();

            return (
              <Pressable
                key={subject.id}
                onPress={() => handleSubjectPress(subject)}
                style={styles.subjectCard}
              >
                {/* Ders Baş Harf Rozeti */}
                <View style={styles.subjectBadge}>
                  <AppText weight="bold" size="lg" color={colors.selected}>
                    {initial}
                  </AppText>
                </View>

                {/* Ders Bilgisi */}
                <View style={styles.subjectInfo}>
                  <AppText weight="bold" size="lg" color={colors.text}>
                    {subject.title}
                  </AppText>
                  <AppText weight="regular" size="sm" color={colors.textSecondary}>
                    {subject.totalUnits} Ünite &bull; MEB KPSS Müfredatı
                  </AppText>
                </View>

                {/* Ok Simgesi */}
                <View style={styles.chevronContainer}>
                  <View style={styles.chevronRight} />
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.md,
    flexGrow: 1,
  },
  header: {
    paddingVertical: dimensions.spacing.xs,
    gap: 4,
  },
  subtitle: {
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: dimensions.spacing.md,
  },
  sectionLabel: {
    marginBottom: dimensions.spacing.sm,
  },
  errorPoolCard: {
    minHeight: dimensions.minTouchTarget,
    backgroundColor: '#FEF2F2',
    borderColor: colors.wrong,
    borderWidth: dimensions.borderWidth.thin,
    borderRadius: dimensions.borderRadius.md,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: dimensions.spacing.md,
    marginBottom: dimensions.spacing.lg,
  },
  errorPoolIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorPoolInfo: {
    flex: 1,
  },
  subjectList: {
    gap: dimensions.spacing.sm,
  },
  subjectCard: {
    minHeight: 64, // Geniş ve ferah dokunma alanı (en az 52px kuralı)
    backgroundColor: colors.surface,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    borderWidth: dimensions.borderWidth.thin,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: dimensions.spacing.md,
  },
  subjectBadge: {
    width: 44,
    height: 44,
    borderRadius: dimensions.borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: dimensions.borderWidth.thin,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectInfo: {
    flex: 1,
    gap: 2,
  },
  chevronContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronRight: {
    width: 9,
    height: 9,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderColor: colors.textSecondary,
    transform: [{ rotate: '45deg' }],
  },
});

export default SubjectListScreen;
