import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQuizStore } from '@/store/useQuizStore';
import { OptionId } from '@/types';

interface QuestionScreenProps {
  onExit?: () => void;
}

export const QuestionScreen: React.FC<QuestionScreenProps> = ({ onExit }) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedOption, setSelectedOption] = useState<OptionId | null>(null);

  const {
    questions,
    currentQuestionIndex,
    userAnswers,
    selectOption,
    nextQuestion,
    finishUnit,
    resetUnit,
    setViewMode,
    isLoading,
  } = useQuizStore();

  const totalQuestions = questions.length || 20;
  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = currentQuestion ? userAnswers[currentQuestion.id] : undefined;
  const isAnswered = currentAnswer !== undefined;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  // Soru değiştiğinde seçim ve scroll sıfırlanır
  useEffect(() => {
    setSelectedOption(null);
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  }, [currentQuestionIndex]);

  const triggerHaptic = (isCorrect: boolean) => {
    if (Platform.OS === 'web') return;
    try {
      if (isCorrect) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch {
      // Haptic desteklenmeyen cihazlarda sessizce devam eder
    }
  };

  const handleOptionSelect = (optionId: OptionId) => {
    if (isAnswered) return;
    setSelectedOption(optionId);
  };

  const handleConfirmAnswer = () => {
    if (!selectedOption || !currentQuestion || isAnswered) return;

    const isCorrect = selectedOption === currentQuestion.correctOption;
    selectOption(currentQuestion.id, selectedOption);
    triggerHaptic(isCorrect);
    setViewMode('feedback');
  };

  const handleNext = () => {
    if (isLastQuestion) {
      finishUnit();
    } else {
      nextQuestion();
    }
  };

  const handleBackPress = () => {
    Alert.alert(
      'Testten Çıkılsın mı?',
      'Mevcut testteki ilerlemeniz sıfırlanacaktır. Çıkmak istediğinize emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Çık',
          style: 'destructive',
          onPress: () => {
            resetUnit();
            if (onExit) onExit();
          },
        },
      ]
    );
  };

  if (isLoading || !currentQuestion) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Soru hazırlanıyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const questionNumStr = String(currentQuestionIndex + 1).padStart(2, '0');
  const totalQuestionsStr = String(totalQuestions).padStart(2, '0');
  const progressPercentage = `${Math.min(100, Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100))}%`;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Üst Navigasyon ve Sayaç */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={handleBackPress}
          >
            <Ionicons name="chevron-back" size={22} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerCounter}>
            {questionNumStr} / {totalQuestionsStr}
          </Text>
          <TouchableOpacity
            style={styles.menuButton}
            activeOpacity={0.7}
            onPress={handleBackPress}
          >
            <Ionicons name="ellipsis-vertical" size={18} color="#111" />
          </TouchableOpacity>
        </View>

        {/* İlerleme Çubuğu */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: progressPercentage as any }]} />
        </View>

        {/* Soru Kartı */}
        <View style={styles.questionCard}>
          <Text style={styles.questionLabel}>SORU {questionNumStr}</Text>
          <Text style={styles.questionText}>{currentQuestion.questionText}</Text>
        </View>

        {/* Şıklar Listesi */}
        {currentQuestion.options.map((opt) => {
          const isSelected = selectedOption === opt.id;
          const isCorrect = isAnswered && opt.id === currentQuestion.correctOption;
          const isWrong = isAnswered && isSelected && !isCorrect;

          let cardStyle = [styles.optionCard];
          let circleStyle = [styles.radioCircle];
          let keyStyle = [styles.optionKey];
          let textStyle = [styles.optionText];
          let dotColor = '#FFF';

          if (isAnswered) {
            if (isCorrect) {
              cardStyle.push(styles.optionCardCorrect as any);
              circleStyle.push(styles.radioCircleCorrect as any);
              keyStyle.push(styles.optionKeyCorrect as any);
              textStyle.push(styles.optionTextCorrect as any);
              dotColor = '#16A34A';
            } else if (isWrong) {
              cardStyle.push(styles.optionCardWrong as any);
              circleStyle.push(styles.radioCircleWrong as any);
              keyStyle.push(styles.optionKeyWrong as any);
              textStyle.push(styles.optionTextWrong as any);
              dotColor = '#DC2626';
            } else {
              cardStyle.push({ opacity: 0.5 } as any);
            }
          } else if (isSelected) {
            cardStyle.push(styles.optionCardSelected as any);
            circleStyle.push(styles.radioCircleSelected as any);
            keyStyle.push(styles.optionKeySelected as any);
            textStyle.push(styles.optionTextSelected as any);
          }

          return (
            <TouchableOpacity
              key={opt.id}
              style={cardStyle}
              activeOpacity={0.8}
              onPress={() => handleOptionSelect(opt.id as OptionId)}
            >
              <View style={circleStyle}>
                {(isSelected || isCorrect) && (
                  <View style={[styles.radioInnerDot, { backgroundColor: dotColor }]} />
                )}
              </View>
              <Text style={keyStyle}>{opt.id}</Text>
              <Text style={textStyle}>{opt.text}</Text>
            </TouchableOpacity>
          );
        })}

        {/* Çözüm Açıklaması */}
        {isAnswered && currentQuestion.explanation ? (
          <View style={styles.explanationCard}>
            <Text style={styles.explanationTitle}>
              {currentAnswer?.isCorrect ? '✅ Doğru Cevap!' : '❌ Yanlış Cevap!'} &bull; Çözüm ve Açıklama
            </Text>
            <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Sabit Alt Buton */}
      <View style={styles.footerContainer}>
        {!isAnswered ? (
          <TouchableOpacity
            style={[
              styles.actionButton,
              !selectedOption && { opacity: 0.5 },
            ]}
            activeOpacity={0.8}
            disabled={!selectedOption}
            onPress={handleConfirmAnswer}
          >
            <Text style={styles.actionButtonText}>Cevabı İşaretle</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.8}
            onPress={handleNext}
          >
            <Text style={styles.actionButtonText}>
              {isLastQuestion ? 'Sonuçları Gör' : 'Sonraki Soru →'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
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
    paddingBottom: 110,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EFEFF2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EFEFF2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCounter: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#EFEFF2',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#111',
    borderRadius: 3,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFEFF2',
  },
  questionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#777',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    lineHeight: 22,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EFEFF2',
  },
  optionCardSelected: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  optionCardCorrect: {
    backgroundColor: '#F0FDF4',
    borderColor: '#16A34A',
  },
  optionCardWrong: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioCircleSelected: {
    borderColor: '#FFF',
  },
  radioCircleCorrect: {
    borderColor: '#16A34A',
  },
  radioCircleWrong: {
    borderColor: '#DC2626',
  },
  radioInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  optionKey: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
    width: 16,
  },
  optionKeySelected: {
    color: '#FFF',
  },
  optionKeyCorrect: {
    color: '#16A34A',
  },
  optionKeyWrong: {
    color: '#DC2626',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  optionTextSelected: {
    color: '#FFF',
  },
  optionTextCorrect: {
    color: '#16A34A',
    fontWeight: '600',
  },
  optionTextWrong: {
    color: '#DC2626',
    fontWeight: '600',
  },
  explanationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  explanationTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#111',
    marginBottom: 6,
  },
  explanationText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#4B5563',
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
  actionButton: {
    backgroundColor: '#111',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default QuestionScreen;
