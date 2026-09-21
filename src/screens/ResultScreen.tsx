import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuizStore } from '@/store/useQuizStore';

interface TestResultScreenProps {
  onReturnToUnits?: () => void;
}

export function TestResultScreen({ onReturnToUnits }: TestResultScreenProps) {
  const {
    getUnitResult,
    retryWrongQuestions,
    resetUnit,
    completeUnitAndUnlockNext,
    setViewMode,
  } = useQuizStore();

  const result = getUnitResult();
  const total = result.totalQuestions || 20;
  const correct = result.correctCount;
  const wrong = result.wrongCount;
  const empty = result.emptyCount;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  const handleReturn = () => {
    completeUnitAndUnlockNext();
    if (onReturnToUnits) {
      onReturnToUnits();
    } else {
      setViewMode('units');
    }
  };

  const handleRetryWrong = () => {
    if (wrong > 0) {
      retryWrongQuestions();
      setViewMode('quiz');
    } else {
      resetUnit();
      setViewMode('quiz');
    }
  };

  const handleRestart = () => {
    resetUnit();
    setViewMode('quiz');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Üst Geri Tuşu ve Başlık */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={handleReturn}>
            <Ionicons name="chevron-back" size={22} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Test Sonucu</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Sonuç Kartı / Başarı Halkası Alanı */}
        <View style={styles.resultCard}>
          <Text style={styles.resultMainTitle}>Test Tamamlandı</Text>
          
          {/* Başarı Halkası (Simüle Edilmiş) */}
          <View style={styles.circleContainer}>
            <Text style={styles.scoreText}>{correct} / {total}</Text>
            <Text style={styles.percentageText}>%{percentage} Başarı</Text>
          </View>

          {/* Doğru - Yanlış - Boş İstatistikleri */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: '#2E7D32' }]} />
              <Text style={styles.statLabel}>Doğru</Text>
              <Text style={styles.statValue}>{correct}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: '#D32F2F' }]} />
              <Text style={styles.statLabel}>Yanlış</Text>
              <Text style={styles.statValue}>{wrong}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: '#888' }]} />
              <Text style={styles.statLabel}>Boş</Text>
              <Text style={styles.statValue}>{empty}</Text>
            </View>
          </View>
        </View>

        {/* Hata Bilgilendirme Banner'ı */}
        <View style={styles.errorBanner}>
          <Ionicons name="information-circle-outline" size={18} color="#666" style={{ marginRight: 8 }} />
          <Text style={styles.errorBannerText}>
            {wrong > 0 ? `${wrong} soru hata havuzuna eklendi.` : 'Tebrikler! Hiç hata yapmadınız.'}
          </Text>
        </View>

        {/* Yönlendirme Butonları */}
        {wrong > 0 && (
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8} onPress={handleRetryWrong}>
            <Text style={styles.primaryButtonText}>Hatalarımı Çöz</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.8} onPress={handleRestart}>
          <Text style={styles.secondaryButtonText}>Testi Tekrarla</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.outlineButton} activeOpacity={0.8} onPress={handleReturn}>
          <Text style={styles.outlineButtonText}>Üniteye Dön</Text>
        </TouchableOpacity>

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
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EFEFF2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFEFF2',
  },
  resultMainTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 20,
  },
  circleContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 8,
    borderColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111',
  },
  percentageText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EFEFF2',
    paddingTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#EFEFF2',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EFEFF2',
    justifyContent: 'center',
  },
  errorBannerText: {
    fontSize: 13,
    color: '#555',
  },
  primaryButton: {
    backgroundColor: '#111',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  secondaryButton: {
    backgroundColor: '#EFEFF2',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEFF2',
  },
  outlineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
  },
});

export const ResultScreen = TestResultScreen;
export default TestResultScreen;
