import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuizStore } from '@/store/useQuizStore';
import { errorPoolService } from '@/services/errorPoolService';
import { Subject } from '@/types';

interface SubjectItem {
  id: string;
  title: string;
  unitCount: number;
  percentage: number;
  icon: keyof typeof Ionicons.glyphMap;
  category: 'talent' | 'culture';
}

export function SubjectsScreen() {
  const { subjects, loadSubjects, selectSubject, startErrorPoolPractice } = useQuizStore();
  const [totalPoolErrors, setTotalPoolErrors] = useState<number>(0);

  useEffect(() => {
    loadSubjects();
    errorPoolService.getErrorPoolStats().then((stats) => {
      setTotalPoolErrors(stats.totalUnresolved);
    });
  }, [loadSubjects]);

  const handleSubjectPress = (subjectId: string) => {
    selectSubject(subjectId);
  };

  const handleStartGlobalErrorPool = async () => {
    if (totalPoolErrors > 0) {
      await startErrorPoolPractice();
    }
  };

  // Standart Genel Yetenek Dersleri
  const generalTalentSubjects: SubjectItem[] = [
    { id: 'turkce', title: 'Türkçe', unitCount: 12, percentage: 58, icon: 'book-outline', category: 'talent' },
    { id: 'matematik', title: 'Matematik', unitCount: 14, percentage: 42, icon: 'calculator-outline', category: 'talent' },
  ];

  // Standart Genel Kültür Dersleri
  const generalCultureSubjects: SubjectItem[] = [
    { id: 'tarih', title: 'Tarih', unitCount: 16, percentage: 71, icon: 'library-outline', category: 'culture' },
    { id: 'cografya', title: 'Coğrafya', unitCount: 10, percentage: 50, icon: 'earth-outline', category: 'culture' },
    { id: 'vatandaslik', title: 'Vatandaşlık', unitCount: 8, percentage: 38, icon: 'shield-outline', category: 'culture' },
    { id: 'guncel', title: 'Güncel Bilgiler', unitCount: 6, percentage: 25, icon: 'newspaper-outline', category: 'culture' },
  ];

  // Eğer Supabase'den veya yerelden yeni eklenen özel dersler varsa listeye dahil et
  const knownIds = new Set([...generalTalentSubjects, ...generalCultureSubjects].map(s => s.id.toLowerCase()));
  const extraSubjects: SubjectItem[] = subjects
    .filter(s => !knownIds.has(s.id.toLowerCase()) && !knownIds.has(s.title.toLowerCase()))
    .map((s, idx) => ({
      id: s.id,
      title: s.title,
      unitCount: s.totalUnits || 10,
      percentage: 0,
      icon: (s.iconName as any) || 'book-outline',
      category: 'culture' as const,
    }));

  const allCultureSubjects = [...generalCultureSubjects, ...extraSubjects];

  const renderSubjectCard = (subject: SubjectItem) => (
    <TouchableOpacity
      key={subject.id}
      style={styles.subjectCard}
      activeOpacity={0.7}
      onPress={() => handleSubjectPress(subject.id)}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={subject.icon} size={20} color="#111" />
      </View>
      <View style={styles.subjectInfo}>
        <View style={styles.subjectRow}>
          <Text style={styles.subjectTitle}>{subject.title}</Text>
          <Ionicons name="chevron-forward" size={18} color="#666" />
        </View>
        <Text style={styles.unitText}>{subject.unitCount} Ünite</Text>

        {/* İlerleme Çubuğu ve Yüzde */}
        <View style={styles.progressRow}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${subject.percentage}%` }]} />
          </View>
          <Text style={styles.percentageText}>%{subject.percentage}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Üst Başlık */}
        <Text style={styles.mainTitle}>Dersler</Text>

        {/* Global Hata Havuzu Kartı */}
        {totalPoolErrors > 0 && (
          <Pressable onPress={handleStartGlobalErrorPool} style={styles.errorPoolCard}>
            <View style={styles.errorPoolIcon}>
              <Ionicons name="alert-circle-outline" size={22} color="#DC2626" />
            </View>
            <View style={styles.errorPoolInfo}>
              <Text style={styles.errorPoolTitle}>Hata Havuzu ({totalPoolErrors} Soru)</Text>
              <Text style={styles.errorPoolSubtitle}>Daha önce yanlış yaptığın soruları tekrar çöz</Text>
            </View>
            <Text style={styles.errorPoolAction}>Pratik Yap →</Text>
          </Pressable>
        )}

        {/* KPSS Genel Yetenek Grubu */}
        <Text style={styles.categoryTitle}>KPSS Genel Yetenek</Text>
        {generalTalentSubjects.map(renderSubjectCard)}

        {/* KPSS Genel Kültür Grubu */}
        <Text style={[styles.categoryTitle, { marginTop: 12 }]}>KPSS Genel Kültür</Text>
        {allCultureSubjects.map(renderSubjectCard)}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9FB', // Tasarımdaki arka plan rengi
  },
  scrollContent: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    marginTop: 4,
  },
  subjectCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEFF2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F2F2F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  subjectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  unitText: {
    fontSize: 13,
    color: '#777',
    marginBottom: 8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#EFEFF2',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#111',
    borderRadius: 3,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
    width: 32,
    textAlign: 'right',
  },
  errorPoolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorPoolIcon: {
    marginRight: 12,
  },
  errorPoolInfo: {
    flex: 1,
  },
  errorPoolTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111',
  },
  errorPoolSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  errorPoolAction: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
});

export default SubjectsScreen;
