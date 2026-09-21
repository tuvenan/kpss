import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuizStore } from '@/store/useQuizStore';
import { Topic } from '@/types';

export const TopicListScreen: React.FC = () => {
  const {
    unitId,
    units,
    topics,
    loadTopicsForUnit,
    selectTopicForDetail,
    setViewMode,
  } = useQuizStore();

  useEffect(() => {
    if (unitId && topics.length === 0) {
      loadTopicsForUnit(unitId);
    }
  }, [unitId, topics.length, loadTopicsForUnit]);

  const currentUnit = units.find((u) => u.id === unitId) || {
    id: unitId || '1',
    title: 'Ünite',
    unitNumber: 1,
  };

  const defaultTopics: Topic[] = [
    { id: '1', unitId: currentUnit.id, title: 'Temel Kavramlar ve Genel Özellikler', topicNumber: 1, questionCount: 20 },
    { id: '2', unitId: currentUnit.id, title: 'Devlet Teşkilatı ve Yönetim', topicNumber: 2, questionCount: 20 },
    { id: '3', unitId: currentUnit.id, title: 'Kültür ve Medeniyet', topicNumber: 3, questionCount: 20 },
  ];

  const displayTopics = topics.length > 0 ? topics : defaultTopics;

  const handleTopicSelect = (topic: Topic) => {
    selectTopicForDetail(topic.id);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Üst Geri Tuşu ve Başlık */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => setViewMode('units')}
          >
            <Ionicons name="chevron-back" size={22} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {currentUnit.title}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Sayfa Alt Başlığı */}
        <Text style={styles.subTitle}>{currentUnit.title} Konuları</Text>

        {/* Konu Listesi Kartları */}
        {displayTopics.map((topic, index) => {
          const formattedNumber = String(topic.topicNumber || index + 1).padStart(2, '0');
          return (
            <TouchableOpacity
              key={topic.id}
              style={styles.topicCard}
              activeOpacity={0.7}
              onPress={() => handleTopicSelect(topic)}
            >
              <View style={styles.topicNumberBadge}>
                <Text style={styles.topicNumberText}>{formattedNumber}</Text>
              </View>
              <View style={styles.topicInfo}>
                <Text style={styles.topicName}>{topic.title}</Text>
                <Text style={styles.topicQuestionText}>{topic.questionCount || 20} soru • Test</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#666" />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

export default TopicListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9FB',
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
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  subTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 16,
  },
  topicCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEFF2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  topicNumberBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  topicNumberText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  topicInfo: {
    flex: 1,
  },
  topicName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  topicQuestionText: {
    fontSize: 13,
    color: '#777',
  },
});
