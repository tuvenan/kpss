import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuizStore } from '@/store/useQuizStore';
import { errorPoolService } from '@/services/errorPoolService';
import { Subject } from '@/types';

export function HomeScreen() {
  const { subjects, loadSubjects, selectSubject, startErrorPoolPractice } = useQuizStore();
  const [totalPoolErrors, setTotalPoolErrors] = useState<number>(0);

  useEffect(() => {
    loadSubjects();
    errorPoolService.getErrorPoolStats().then((stats) => {
      setTotalPoolErrors(stats.totalUnresolved);
    });
  }, [loadSubjects]);

  // Günlük İlerleme Verileri
  const dailyProgress = {
    current: 42,
    target: 60,
  };

  // Derslerin varsayılan ilerleme istatistikleri
  const defaultProgressMap: Record<string, { progress: string; percentage: number }> = {
    turkce: { progress: '12 / 20 soru', percentage: 60 },
    matematik: { progress: '8 / 20 soru', percentage: 40 },
    tarih: { progress: '5 / 20 soru', percentage: 25 },
    cografya: { progress: '0 / 20 soru', percentage: 0 },
    vatandaslik: { progress: '0 / 20 soru', percentage: 0 },
  };

  const progressPercentage = Math.min(100, Math.round((dailyProgress.current / dailyProgress.target) * 100));

  const handleSubjectPress = (subject: Subject) => {
    selectSubject(subject.id);
  };

  const handleStartGlobalErrorPool = async () => {
    if (totalPoolErrors > 0) {
      await startErrorPoolPractice();
    }
  };

  // Eğer store'daki subjects doluysa onları kullan, boşsa varsayılan listeyi göster
  const displaySubjects = subjects.length > 0 ? subjects : [
    { id: 'turkce', title: 'Türkçe', totalUnits: 10 },
    { id: 'matematik', title: 'Matematik', totalUnits: 10 },
    { id: 'tarih', title: 'Tarih', totalUnits: 12 },
    { id: 'cografya', title: 'Coğrafya', totalUnits: 8 },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Üst Karşılama Alanı */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingSub}>Merhaba,</Text>
            <Text style={styles.greetingName}>Ali</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} activeOpacity={0.8}>
            <Ionicons name="person-outline" size={22} color="#111" />
          </TouchableOpacity>
        </View>

        <Text style={styles.subQuestion}>Bugün ne çalışalım?</Text>

        {/* Günlük Hedef Kartı */}
        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalTitle}>Günlük İlerleme</Text>
            <Text style={styles.goalTargetText}>Hedef: {dailyProgress.target} soru</Text>
          </View>
          
          <Text style={styles.goalNumbers}>
            {dailyProgress.current} <Text style={styles.goalTotal}>/ {dailyProgress.target} soru</Text>
          </Text>

          {/* İlerleme Çubuğu */}
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
          </View>
          
          <Text style={styles.goalFooterText}>{dailyProgress.current} soru çözüldü</Text>
        </View>

        {/* Global Hata Havuzu Kartı (Eğer hata varsa) */}
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

        {/* Dersler Listesi Başlığı */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dersler</Text>
        </View>

        {/* Ders Kartları */}
        {displaySubjects.map((subject) => {
          const stats = defaultProgressMap[subject.id.toLowerCase()] || {
            progress: `0 / ${subject.totalUnits || 20} soru`,
            percentage: 0,
          };

          return (
            <TouchableOpacity
              key={subject.id}
              style={styles.subjectCard}
              activeOpacity={0.7}
              onPress={() => handleSubjectPress(subject as Subject)}
            >
              <View style={styles.subjectIconContainer}>
                <Ionicons name="book-outline" size={20} color="#111" />
              </View>
              <View style={styles.subjectInfo}>
                <View style={styles.subjectRow}>
                  <Text style={styles.subjectName}>{subject.title}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#666" />
                </View>
                <Text style={styles.subjectProgressText}>{stats.progress}</Text>
                
                {/* Küçük İlerleme Çubuğu */}
                <View style={styles.miniProgressBarBg}>
                  <View style={[styles.miniProgressBarFill, { width: `${stats.percentage}%` }]} />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9FB', // Tasarımdaki ana arka plan
  },
  scrollContent: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  greetingSub: {
    fontSize: 16,
    color: '#666',
  },
  greetingName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111',
  },
  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFEFF2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subQuestion: {
    fontSize: 15,
    color: '#555',
    marginBottom: 20,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EFEFF2',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  goalTargetText: {
    fontSize: 13,
    color: '#777',
  },
  goalNumbers: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 12,
  },
  goalTotal: {
    fontSize: 16,
    fontWeight: 'normal',
    color: '#777',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#EFEFF2',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#111',
    borderRadius: 4,
  },
  goalFooterText: {
    fontSize: 12,
    color: '#666',
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
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
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
  },
  subjectIconContainer: {
    width: 40,
    height: 40,
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
    marginBottom: 4,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  subjectProgressText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  miniProgressBarBg: {
    height: 4,
    backgroundColor: '#EFEFF2',
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniProgressBarFill: {
    height: '100%',
    backgroundColor: '#111',
    borderRadius: 2,
  },
});

export default HomeScreen;
