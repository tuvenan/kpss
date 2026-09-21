import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuizStore } from '@/store/useQuizStore';
import { HomeScreen as HomeScreenComponent } from '@/screens/HomeScreen';
import { SubjectsScreen as SubjectsScreenComponent } from '@/screens/SubjectsScreen';
import { UnitListScreen } from '@/screens/UnitListScreen';
import { TopicListScreen } from '@/screens/TopicListScreen';
import { UnitDetailScreen } from '@/screens/UnitDetailScreen';
import { QuestionScreen } from '@/screens/QuestionScreen';
import { FeedbackScreen } from '@/screens/FeedbackScreen';
import { ResultScreen } from '@/screens/ResultScreen';
import { ErrorPoolScreen } from '@/screens/ErrorPoolScreen';
import { ResponsiveContainer } from '@/components/common/ResponsiveContainer';
import { AppText } from '@/components/common/AppText';
import { colors } from '@/theme/colors';

export default function AppEntry() {
  const router = useRouter();
  const { viewMode, setViewMode } = useQuizStore();
  const [activeTab, setActiveTab] = useState<'subjects' | 'home'>('subjects');

  const renderContent = () => {
    if (viewMode === 'subjects') {
      return activeTab === 'subjects' ? <SubjectsScreenComponent /> : <HomeScreenComponent />;
    }
    if (viewMode === 'units') {
      return <UnitListScreen />;
    }
    if (viewMode === 'topics') {
      return <TopicListScreen />;
    }
    if (viewMode === 'unit-detail') {
      return <UnitDetailScreen />;
    }
    if (viewMode === 'feedback') {
      return <FeedbackScreen />;
    }
    if (viewMode === 'result') {
      return <ResultScreen onReturnToUnits={() => setViewMode('topics')} />;
    }
    if (viewMode === 'error-pool') {
      return <ErrorPoolScreen onBack={() => setViewMode('subjects')} />;
    }
    return <QuestionScreen onExit={() => setViewMode('topics')} />;
  };

  return (
    <ResponsiveContainer maxWidth={720}>
      <View style={styles.container}>
        <View style={styles.mainContent}>{renderContent()}</View>

        {/* Ana Ekran için Alt Sekme Çubuğu */}
        {viewMode === 'subjects' && (
          <View style={styles.bottomTabBar}>
            <Pressable
              onPress={() => setActiveTab('subjects')}
              style={[styles.tabButton, activeTab === 'subjects' && styles.activeTabButton]}
            >
              <Ionicons
                name={activeTab === 'subjects' ? 'book' : 'book-outline'}
                size={22}
                color={activeTab === 'subjects' ? '#111827' : '#9CA3AF'}
              />
              <AppText
                weight={activeTab === 'subjects' ? 'bold' : 'medium'}
                size="xs"
                color={activeTab === 'subjects' ? '#111827' : '#9CA3AF'}
              >
                Dersler
              </AppText>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('home')}
              style={[styles.tabButton, activeTab === 'home' && styles.activeTabButton]}
            >
              <Ionicons
                name={activeTab === 'home' ? 'home' : 'home-outline'}
                size={22}
                color={activeTab === 'home' ? '#111827' : '#9CA3AF'}
              />
              <AppText
                weight={activeTab === 'home' ? 'bold' : 'medium'}
                size="xs"
                color={activeTab === 'home' ? '#111827' : '#9CA3AF'}
              >
                Ana Sayfa
              </AppText>
            </Pressable>
          </View>
        )}

        {/* Web Sürümü için Alt Yönetici Paneli Geçiş Çubuğu */}
        {Platform.OS === 'web' && viewMode === 'subjects' && (
          <View style={styles.webFooter}>
            <Pressable
              onPress={() => router.push('/admin' as any)}
              style={styles.adminLink}
            >
              <AppText weight="medium" size="xs" color={colors.textSecondary}>
                ⚙️ Web Yönetici Paneline Geçiş Yap →
              </AppText>
            </Pressable>
          </View>
        )}
      </View>
    </ResponsiveContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mainContent: {
    flex: 1,
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EFEFF2',
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 4,
  },
  activeTabButton: {
    opacity: 1,
  },
  webFooter: {
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  adminLink: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
  },
});
