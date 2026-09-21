import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { errorPoolService } from '@/services/errorPoolService';

export interface ErrorItem {
  id: string;
  subject: string;
  unit: string;
  qNumber: string;
  wrong: string;
  correct: string;
  icon: string;
}

export function ErrorPoolScreen({ onBack }: { onBack?: () => void }) {
  const [selectedFilter, setSelectedFilter] = useState('Tümü');

  const defaultErrorQuestions: ErrorItem[] = [
    { id: '1', subject: 'Tarih', unit: 'İslamiyet Öncesi Türk Tarihi', qNumber: 'Soru 07', wrong: 'C', correct: 'B', icon: 'bookmark-outline' },
    { id: '2', subject: 'Türkçe', unit: 'Sözcükte Anlam', qNumber: 'Soru 13', wrong: 'D', correct: 'A', icon: 'book-outline' },
    { id: '3', subject: 'Matematik', unit: 'Problemler', qNumber: 'Soru 05', wrong: 'B', correct: 'C', icon: 'calculator-outline' },
    { id: '4', subject: 'Coğrafya', unit: "Türkiye'nin Fiziki Yapısı", qNumber: 'Soru 11', wrong: 'A', correct: 'D', icon: 'earth-outline' },
  ];

  const [errorQuestions, setErrorQuestions] = useState<ErrorItem[]>(defaultErrorQuestions);

  useEffect(() => {
    errorPoolService.getLocalCache().then((cached) => {
      if (cached && cached.length > 0) {
        const unresolved = cached.filter((c) => !c.isResolved);
        if (unresolved.length > 0) {
          const mapped: ErrorItem[] = unresolved.map((err, idx) => ({
            id: err.questionId || String(idx + 1),
            subject: 'KPSS',
            unit: err.unitId || 'Genel Soru',
            qNumber: `Soru ${String(idx + 1).padStart(2, '0')}`,
            wrong: err.selectedOption || 'C',
            correct: err.correctOption || 'B',
            icon: 'bookmark-outline',
          }));
          setErrorQuestions(mapped);
        }
      }
    }).catch(() => {});
  }, []);

  const filteredQuestions = selectedFilter === 'Tümü'
    ? errorQuestions
    : errorQuestions.filter((q) => q.subject.toLowerCase() === selectedFilter.toLowerCase());

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Üst Başlık ve Filtre */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.mainTitle}>Hatalarım</Text>
            <Text style={styles.subCountText}>{filteredQuestions.length} hata sorusu</Text>
          </View>
          
          <TouchableOpacity style={styles.filterButton} activeOpacity={0.7}>
            <Text style={styles.filterButtonText}>{selectedFilter}</Text>
            <Ionicons name="chevron-down" size={14} color="#333" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>

        {/* Hatalı Sorular Listesi */}
        {filteredQuestions.map((item) => (
          <TouchableOpacity key={item.id} style={styles.errorCard} activeOpacity={0.7}>
            <View style={styles.cardLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name={item.icon as any} size={18} color="#111" />
              </View>
              <View style={styles.infoContainer}>
                <Text style={styles.subjectName}>{item.subject}</Text>
                <Text style={styles.unitName}>{item.unit}</Text>
                <Text style={styles.qNumberText}>{item.qNumber}</Text>
              </View>
            </View>

            <View style={styles.cardRight}>
              <View style={styles.badgeRow}>
                <Text style={styles.wrongBadge}>Yanlış: {item.wrong}</Text>
                <Text style={styles.correctBadge}>Doğru: {item.correct}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#666" style={{ alignSelf: 'flex-end', marginTop: 8 }} />
            </View>
          </TouchableOpacity>
        ))}

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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 2,
  },
  subCountText: {
    fontSize: 14,
    color: '#666',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EFEFF2',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  errorCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#EFEFF2',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F2F2F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 2,
  },
  unitName: {
    fontSize: 13,
    color: '#555',
    marginBottom: 2,
  },
  qNumberText: {
    fontSize: 12,
    color: '#777',
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  wrongBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D32F2F',
    backgroundColor: '#FFDCDC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  correctBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2E7D32',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
});

export default ErrorPoolScreen;
