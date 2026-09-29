import React from 'react';
import { Check, X } from 'lucide-react';
import { Question, UserAnswer } from '../../../types';
import { styles } from '../../../pages/StudentQuiz.styles';

interface QuizFeedbackViewProps {
  currentQ: Question;
  currentAns: UserAnswer | undefined;
  currentIndex: number;
  totalQuestions: number;
  onNextFromFeedback: () => void;
}

export const QuizFeedbackView: React.FC<QuizFeedbackViewProps> = ({
  currentQ,
  currentAns,
  currentIndex,
  totalQuestions,
  onNextFromFeedback,
}) => {
  return (
    <div
      className="feedback-content-container"
      style={{ maxWidth: '440px', margin: '0 auto', width: '100%', padding: '36px 20px 160px' }}
    >
      {/* Üst Durum Alanı (Dairesel İkon, Başlık ve Alt Başlık) */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
        <div
          style={{
            width: '76px',
            height: '76px',
            borderRadius: '38px',
            backgroundColor: currentAns?.isCorrect ? '#16A34A' : '#DC2626',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '20px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          }}
        >
          {currentAns?.isCorrect ? (
            <Check size={38} color="#FFFFFF" strokeWidth={3} />
          ) : (
            <X size={38} color="#FFFFFF" strokeWidth={3} />
          )}
        </div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '6px', textAlign: 'center' }}>
          {currentAns?.isCorrect ? 'Doğru Cevap' : 'Yanlış Cevap'}
        </div>
        <div style={{ fontSize: '15px', color: '#6B7280', textAlign: 'center' }}>
          {currentAns?.isCorrect ? 'Tebrikler, doğru cevapladınız.' : 'Maalesef, yanlış cevapladınız.'}
        </div>
      </div>

      {/* Açıklama ve Doğru Cevap Kartı */}
      <div
        style={{
          backgroundColor: currentAns?.isCorrect ? '#EDF7EE' : '#FEE2E2',
          borderRadius: '16px',
          padding: '22px 24px',
          marginTop: '8px',
        }}
      >
        <div
          style={{
            fontSize: '16px',
            fontWeight: 700,
            color: currentAns?.isCorrect ? '#15803D' : '#B91C1C',
            marginBottom: '12px',
          }}
        >
          Doğru cevap: {currentQ.correctOption}
        </div>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '6px' }}>
          Açıklama:
        </div>
        <div style={{ fontSize: '14px', color: '#374151', lineHeight: '22px', whiteSpace: 'pre-line' }}>
          {currentQ.explanation ||
            "Osmanlı Devleti'nde ıslahat hareketleri, özellikle 18. yüzyıldan itibaren Avrupa'daki gelişmelerin etkisiyle hız kazanmıştır."}
        </div>
      </div>

      {/* Sabit Alt Buton */}
      <div style={styles.feedbackBottomBar} className="feedback-bottom-bar">
        <button
          onClick={onNextFromFeedback}
          style={styles.feedbackNextButton}
          className="feedback-next-button"
        >
          {currentIndex === totalQuestions - 1 ? 'Sonuçları Gör' : 'Sonraki Soru'}
        </button>
      </div>
    </div>
  );
};
