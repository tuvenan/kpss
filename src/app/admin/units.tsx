import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { colors } from '@/theme/colors';
import { dimensions } from '@/theme/dimensions';
import { Subject, Unit } from '@/types';
import { subjectService } from '@/services/subjectService';

export default function AdminUnitsScreen() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('tarih');
  const [units, setUnits] = useState<Unit[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedSubjectId) {
      loadUnits(selectedSubjectId);
    }
  }, [selectedSubjectId]);

  const loadData = async () => {
    const list = await subjectService.getSubjects();
    setSubjects(list);
    if (list.length > 0) {
      setSelectedSubjectId(list[0].id);
    }
  };

  const loadUnits = async (subId: string) => {
    const unitList = await subjectService.getUnitsBySubject(subId);
    setUnits(unitList);
  };

  return (
    <View style={styles.container}>
      {/* Üst Başlık */}
      <View style={styles.topBar}>
        <AppText weight="bold" size="xl" color={colors.selected}>
          Ders ve Ünite Hiyerarşisi
        </AppText>
        <AppText weight="regular" size="sm" color={colors.textSecondary}>
          Müfredat hiyerarşisi ve ünite kilit akışı
        </AppText>
      </View>

      {/* Ders Sekmeleri */}
      <View style={styles.tabsRow}>
        {subjects.map((sub) => {
          const isSelected = sub.id === selectedSubjectId;
          return (
            <Pressable
              key={sub.id}
              onPress={() => setSelectedSubjectId(sub.id)}
              style={[
                styles.tabButton,
                {
                  backgroundColor: isSelected ? colors.selected : colors.surface,
                  borderColor: isSelected ? colors.selected : colors.border,
                },
              ]}
            >
              <AppText
                weight={isSelected ? 'bold' : 'medium'}
                size="sm"
                color={isSelected ? '#FFFFFF' : colors.text}
              >
                {sub.title} ({sub.totalUnits} Ünite)
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {/* Ünite Listesi Tablosu */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <AppText weight="bold" size="xs" color={colors.textSecondary} style={{ width: 60 }}>
              SIRA
            </AppText>
            <AppText weight="bold" size="xs" color={colors.textSecondary} style={{ flex: 1 }}>
              ÜNİTE ADI
            </AppText>
            <AppText weight="bold" size="xs" color={colors.textSecondary} style={{ width: 140 }}>
              KİLİT DURUMU
            </AppText>
          </View>

          {units.map((u) => (
            <View key={u.id} style={styles.tableRow}>
              <View style={styles.unitNumberBadge}>
                <AppText weight="bold" size="xs" color={colors.selected}>
                  #{u.unitNumber}
                </AppText>
              </View>

              <View style={{ flex: 1 }}>
                <AppText weight="medium" size="sm" color={colors.text}>
                  {u.title}
                </AppText>
                <AppText weight="regular" size="xs" color={colors.textSecondary}>
                  ID: {u.id}
                </AppText>
              </View>

              <View style={{ width: 140 }}>
                <View
                  style={[
                    styles.lockStatusBadge,
                    {
                      backgroundColor: u.isCompleted
                        ? '#F0FDF4'
                        : !u.isLocked
                        ? '#EFF6FF'
                        : '#F3F4F6',
                      borderColor: u.isCompleted
                        ? colors.correct
                        : !u.isLocked
                        ? '#3B82F6'
                        : colors.border,
                    },
                  ]}
                >
                  <AppText
                    weight="bold"
                    size="xs"
                    color={
                      u.isCompleted
                        ? colors.correct
                        : !u.isLocked
                        ? '#2563EB'
                        : colors.textMuted
                    }
                  >
                    {u.isCompleted
                      ? '✓ Tamamlandı'
                      : !u.isLocked
                      ? 'Açık (Sıradaki)'
                      : 'Kilitli'}
                  </AppText>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    padding: dimensions.spacing.lg,
    borderBottomWidth: dimensions.borderWidth.thin,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabsRow: {
    flexDirection: 'row',
    padding: dimensions.spacing.md,
    gap: dimensions.spacing.sm,
    borderBottomWidth: dimensions.borderWidth.thin,
    borderBottomColor: colors.border,
  },
  tabButton: {
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: 8,
    borderRadius: dimensions.borderRadius.sm,
    borderWidth: dimensions.borderWidth.thin,
  },
  scrollContent: {
    padding: dimensions.spacing.lg,
  },
  tableCard: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.md,
    borderWidth: dimensions.borderWidth.thin,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    padding: dimensions.spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: dimensions.borderWidth.thin,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    padding: dimensions.spacing.md,
    borderBottomWidth: dimensions.borderWidth.thin,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  unitNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.background,
    borderWidth: dimensions.borderWidth.thin,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: dimensions.spacing.md,
  },
  lockStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
  },
});
