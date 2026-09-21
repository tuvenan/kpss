import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuizStore } from '@/store/useQuizStore';

export function UnitDetailScreen() {
  const { units, unitId, topics, selectedTopic, selectedTopicId, setViewMode, startTopic, startUnit } = useQuizStore();

  const currentTopic = selectedTopic || topics.find((t) => t.id === selectedTopicId);
  const currentUnit = units.find((u) => u.id === unitId) || {
    id: '1',
    title: 'İslamiyet Öncesi Türk Tarihi',
    unitNumber: 1,
  };

  const displayTitle = currentTopic?.title || currentUnit.title;
  const displayNumber = currentTopic?.topicNumber || currentUnit.unitNumber || 1;
  const formattedNumber = String(displayNumber).padStart(2, '0');

  const handleStartQuiz = async () => {
    if (selectedTopicId) {
      await startTopic(selectedTopicId);
    } else {
      await startUnit(currentUnit.id);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Üst Geri Tuşu ve Başlık */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => setViewMode('topics')}
          >
            <Ionicons name="chevron-back" size={22} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{displayTitle}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Büyük Numara ve Konu/Ünite Başlık Kartı */}
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{formattedNumber}</Text>
          </View>
          <Text style={styles.heroTitle}>{displayTitle}</Text>
          <Text style={styles.heroQuestionCount}>20 Soru</Text>
        </View>

        {/* Test Kuralları / Bilgi Kutusu */}
        <View style={styles.rulesCard}>
          <Text style={styles.rulesCardTitle}>Bu testte:</Text>
          
          <View style={styles.ruleItem}>
            <View style={styles.ruleDot} />
            <Text style={styles.ruleText}>20 soru</Text>
          </View>
          
          <View style={styles.ruleItem}>
            <View style={styles.ruleDot} />
            <Text style={styles.ruleText}>Sıralı ilerleme (1'den 20'ye)</Text>
          </View>
          
          <View style={styles.ruleItem}>
            <View style={styles.ruleDot} />
            <Text style={styles.ruleText}>Soruları atlayamazsınız</Text>
          </View>
          
          <View style={styles.ruleItem}>
            <View style={styles.ruleDot} />
            <Text style={styles.ruleText}>Hatalar otomatik kaydedilir</Text>
          </View>
        </View>

      </ScrollView>

      {/* Sabit Alt Teste Başla Butonu */}
      <View style={styles.footerContainer}>
        <TouchableOpacity
          style={styles.startButton}
          activeOpacity={0.8}
          onPress={handleStartQuiz}
        >
          <Text style={styles.startButtonText}>Teste Başla</Text>
        </TouchableOpacity>
        
        <View style={styles.footerInfoRow}>
          <Ionicons name="information-circle-outline" size={16} color="#666" style={{ marginRight: 6 }} />
          <Text style={styles.footerInfoText}>Test sırasında soruları atlayamazsınız.</Text>
        </View>
      </View>
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
    paddingBottom: 110,
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
    maxWidth: 240,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFEFF2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  heroBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F2F2F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroBadgeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    textAlign: 'center',
    marginBottom: 6,
  },
  heroQuestionCount: {
    fontSize: 14,
    color: '#777',
  },
  rulesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EFEFF2',
  },
  rulesCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
    marginBottom: 14,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ruleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#111',
    marginRight: 10,
  },
  ruleText: {
    fontSize: 14,
    color: '#444',
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F9F9FB',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#EFEFF2',
  },
  startButton: {
    backgroundColor: '#111',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  footerInfoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerInfoText: {
    fontSize: 12,
    color: '#666',
  },
});

export default UnitDetailScreen;
