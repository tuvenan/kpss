import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuizStore } from '@/store/useQuizStore';

export function FeedbackScreen() {
  const {
    questions,
    currentQuestionIndex,
    userAnswers,
    nextQuestion,
    finishUnit,
    setViewMode,
  } = useQuizStore();

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = currentQuestion ? userAnswers[currentQuestion.id] : undefined;
  const isCorrect = currentAnswer?.isCorrect ?? false;
  const isLastQuestion = currentQuestionIndex >= (questions.length || 20) - 1;

  const correctOptionLetter = currentQuestion?.correctOption || 'B';
  const explanationText =
    currentQuestion?.explanation ||
    "Osmanlı Devleti'nde ıslahat hareketlerinin hız kazanmasında, özellikle Avrupa'daki gelişmelerin etkisi ve devletin askeri alanda yaşadığı gerileme önemli rol oynamıştır.";

  const handleNext = () => {
    if (isLastQuestion) {
      finishUnit();
    } else {
      nextQuestion();
      setViewMode('quiz');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Üst Durum Alanı (Dairesel İkon, Başlık ve Alt Başlık) */}
        <View style={styles.topStatusSection}>
          <View style={[styles.statusIconCircle, isCorrect ? styles.correctCircle : styles.wrongCircle]}>
            <Ionicons 
              name={isCorrect ? "checkmark" : "close"} 
              size={38} 
              color="#FFFFFF" 
            />
          </View>
          <Text style={styles.statusTitle}>
            {isCorrect ? "Doğru Cevap" : "Yanlış Cevap"}
          </Text>
          <Text style={styles.statusSubtitle}>
            {isCorrect ? "Tebrikler, doğru cevapladınız." : "Maalesef, yanlış cevapladınız."}
          </Text>
        </View>

        {/* Açıklama ve Doğru Cevap Kartı */}
        <View style={[styles.infoCard, isCorrect ? styles.correctCardBg : styles.wrongCardBg]}>
          <Text style={[styles.correctAnswerHeading, isCorrect ? styles.correctAnswerTextGreen : styles.correctAnswerTextRed]}>
            Doğru cevap:  {correctOptionLetter}
          </Text>
          <Text style={styles.explanationLabel}>
            Açıklama:
          </Text>
          <Text style={styles.explanationBody}>
            {explanationText}
          </Text>
        </View>

      </ScrollView>

      {/* Sabit Alt Buton */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.nextButton} activeOpacity={0.85} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {isLastQuestion ? "Sonuçları Gör" : "Sonraki Soru"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 110,
    alignItems: 'stretch',
  },
  topStatusSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  statusIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  correctCircle: {
    backgroundColor: '#16A34A', // Canlı yeşil (görseldeki yeşil tonu)
  },
  wrongCircle: {
    backgroundColor: '#DC2626', // Hata durumunda kırmızı
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center',
  },
  statusSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '400',
    textAlign: 'center',
  },
  infoCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  correctCardBg: {
    backgroundColor: '#EDF7EE', // Görseldeki açık mint / pastel yeşil arka plan
  },
  wrongCardBg: {
    backgroundColor: '#FEE2E2', // Yanlış için açık pastel kırmızı
  },
  correctAnswerHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  correctAnswerTextGreen: {
    color: '#15803D', // Koyu yeşil
  },
  correctAnswerTextRed: {
    color: '#B91C1C', // Koyu kırmızı
  },
  explanationLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  explanationBody: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    fontWeight: '400',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  nextButton: {
    backgroundColor: '#18181B',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FeedbackScreen;
