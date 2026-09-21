import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuizStore } from '@/store/useQuizStore';
import { Unit } from '@/types';

export const UnitListScreen: React.FC = () => {
  const {
    units,
    activeSubjectId,
    subjects,
    startUnit,
    selectUnitForDetail,
    setViewMode,
    loadUnitsForSubject,
  } = useQuizStore();

  useEffect(() => {
    if (activeSubjectId) {
      loadUnitsForSubject(activeSubjectId);
    }
  }, [activeSubjectId, loadUnitsForSubject]);

  const currentSubject = subjects.find((s) => s.id === activeSubjectId) || {
    id: activeSubjectId || 'tarih',
    title: 'Tarih',
    totalUnits: 6,
  };

  // Standart Tarih Üniteleri (Kullanıcı tasarımına tam uyumlu başlangıç verisi)
  const defaultUnits: Unit[] = [
    { id: '1', subjectId: 'tarih', title: 'İslamiyet Öncesi Türk Tarihi', unitNumber: 1, isLocked: false, isCompleted: false },
    { id: '2', subjectId: 'tarih', title: 'İlk Türk-İslam Devletleri', unitNumber: 2, isLocked: false, isCompleted: false },
    { id: '3', subjectId: 'tarih', title: 'Anadolu Selçukluları', unitNumber: 3, isLocked: false, isCompleted: false },
    { id: '4', subjectId: 'tarih', title: 'Osmanlı Tarihi', unitNumber: 4, isLocked: false, isCompleted: false },
    { id: '5', subjectId: 'tarih', title: 'Türkiye Cumhuriyeti Tarihi', unitNumber: 5, isLocked: false, isCompleted: false },
    { id: '6', subjectId: 'tarih', title: 'Çağdaş Türk ve Dünya Tarihi', unitNumber: 6, isLocked: false, isCompleted: false },
  ];

  const displayUnits = units.length > 0 ? units : defaultUnits;

  const handleUnitSelect = (unit: Unit) => {
    selectUnitForDetail(unit.id);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Üst Geri Tuşu ve Başlık */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => setViewMode('subjects')}
          >
            <Ionicons name="chevron-back" size={22} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{currentSubject.title}</Text>
          <View style={{ width: 40 }} /> {/* Dengeleme boşluğu */}
        </View>

        {/* Sayfa Alt Başlığı */}
        <Text style={styles.subTitle}>{currentSubject.title} Üniteleri</Text>

        {/* Ünite Listesi Kartları */}
        {displayUnits.map((unit, index) => {
          const formattedNumber = String(unit.unitNumber || index + 1).padStart(2, '0');
          return (
            <TouchableOpacity
              key={unit.id}
              style={styles.unitCard}
              activeOpacity={0.7}
              onPress={() => handleUnitSelect(unit)}
            >
              <View style={styles.unitNumberBadge}>
                <Text style={styles.unitNumberText}>{formattedNumber}</Text>
              </View>
              <View style={styles.unitInfo}>
                <Text style={styles.unitName}>{unit.title}</Text>
                <Text style={styles.unitQuestionText}>{unit.topicCount || 3} konu • Testler</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#666" />
            </TouchableOpacity>
          );
        })}

      </ScrollView>
    </SafeAreaView>
  );
};

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
    fontSize: 17,
    fontWeight: '600',
    color: '#111',
  },
  subTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 16,
  },
  unitCard: {
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
  unitNumberBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F2F2F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  unitNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  unitInfo: {
    flex: 1,
  },
  unitName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
    marginBottom: 3,
  },
  unitQuestionText: {
    fontSize: 13,
    color: '#777',
  },
});

export default UnitListScreen;
