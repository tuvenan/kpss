import React from 'react';
import { ChevronLeft, Clock, Play, Pause, MoreVertical, BookOpen } from 'lucide-react';
import { Question, OptionId, UserAnswer, UnitResult } from '../../../types';
import { styles } from '../../../pages/StudentQuiz.styles';
import { QuizResultView } from './QuizResultView';

interface QuizViewProps {
  isCompleted: boolean;
  questions: Question[];
  userAnswers: Record<string, UserAnswer>;
  currentQ: Question | undefined;
  currentAns: UserAnswer | undefined;
  currentIndex: number;
  stagedOption: OptionId | null;
  isAnswered: boolean;
  isDenemeMode: boolean;
  denemeDurationMinutes: number;
  timeRemainingSeconds: number;
  denemeTotalElapsedSeconds: number;
  isTimerPaused: boolean;
  mistakesBankCount: number;
  result: UnitResult;
  formatTime: (seconds: number) => string;
  onOptionSelect: (id: OptionId) => void;
  onConfirmAnswer: () => void;
  onNext: () => void;
  onToggleTimerPause: () => void;
  onExitQuiz: () => void;
  onFinishDenemeEarly: () => void;
  onNavigateHome: () => void;
  onNavigateTopics: () => void;
  onStartDenemeExam: (duration: number) => void;
  onStartMistakesBankQuiz: () => void;
  onRetryWrong: () => void;
  onRestartQuiz: () => void;
  onBackToTopicDetail: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  isCompleted,
  questions,
  userAnswers,
  currentQ,
  currentAns,
  currentIndex,
  stagedOption,
  isAnswered,
  isDenemeMode,
  denemeDurationMinutes,
  timeRemainingSeconds,
  denemeTotalElapsedSeconds,
  isTimerPaused,
  mistakesBankCount,
  result,
  formatTime,
  onOptionSelect,
  onConfirmAnswer,
  onNext,
  onToggleTimerPause,
  onExitQuiz,
  onFinishDenemeEarly,
  onNavigateHome,
  onNavigateTopics,
  onStartDenemeExam,
  onStartMistakesBankQuiz,
  onRetryWrong,
  onRestartQuiz,
  onBackToTopicDetail,
}) => {
  if (isCompleted) {
    return (
      <QuizResultView
        isDenemeMode={isDenemeMode}
        questions={questions}
        userAnswers={userAnswers}
        denemeDurationMinutes={denemeDurationMinutes}
        timeRemainingSeconds={timeRemainingSeconds}
        denemeTotalElapsedSeconds={denemeTotalElapsedSeconds}
        mistakesBankCount={mistakesBankCount}
        result={result}
        onNavigateHome={onNavigateHome}
        onNavigateTopics={onNavigateTopics}
        onStartDenemeExam={onStartDenemeExam}
        onStartMistakesBankQuiz={onStartMistakesBankQuiz}
        onRetryWrong={onRetryWrong}
        onRestartQuiz={onRestartQuiz}
      />
    );
  }

  if (questions.length === 0 || !currentQ) {
    return (
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '48px 24px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
          }}
        >
          <BookOpen size={28} color="#64748B" />
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
          Bu Testte Henüz Soru Bulunmuyor
        </h3>
        <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '360px', margin: '0 auto 24px auto', lineHeight: 1.5 }}>
          Seçilen konu veya soru bankasına ait soru henüz eklenmemiş. Lütfen başka bir test seçiniz.
        </p>
        <button
          onClick={onBackToTopicDetail}
          style={{
            padding: '10px 24px',
            backgroundColor: '#111111',
            color: '#FFFFFF',
            borderRadius: '10px',
            border: 'none',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Geri Dön
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Duraklatma Katmanı (Overlay) */}
      {isTimerPaused && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.88)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            color: '#FFFFFF',
            textAlign: 'center',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <Pause size={32} color="#F59E0B" />
          </div>
          <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>Sınav Duraklatıldı</h3>
          <p style={{ fontSize: '14px', color: '#94A3B8', maxWidth: '340px', marginBottom: '24px', lineHeight: 1.5 }}>
            Süre sayacı durduruldu. Dinlendikten sonra sınavınıza kaldığınız yerden devam edebilirsiniz.
          </p>
          <button
            onClick={onToggleTimerPause}
            style={{
              padding: '12px 28px',
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
            }}
          >
            <Play size={16} />
            Sınava Devam Et
          </button>
        </div>
      )}

      {/* Üst Navigasyon ve Sayaç */}
      <div style={styles.quizNavHeader}>
        <button
          onClick={onExitQuiz}
          style={styles.quizBackButton}
          title={isDenemeMode ? 'Denemeden Çık' : 'Testten Çık'}
        >
          <ChevronLeft size={22} color="var(--kpss-text, #111)" />
        </button>

        {isDenemeMode ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Canlı Süre Sayacı Rozeti */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '20px',
                backgroundColor:
                  denemeDurationMinutes > 0 && timeRemainingSeconds <= 60
                    ? '#FEF2F2'
                    : denemeDurationMinutes > 0 && timeRemainingSeconds <= 300
                    ? '#FFFBEB'
                    : '#0F172A',
                color:
                  denemeDurationMinutes > 0 && timeRemainingSeconds <= 60
                    ? '#DC2626'
                    : denemeDurationMinutes > 0 && timeRemainingSeconds <= 300
                    ? '#D97706'
                    : '#FFFFFF',
                fontWeight: 700,
                fontSize: '13px',
                border:
                  denemeDurationMinutes > 0 && timeRemainingSeconds <= 60
                    ? '1px solid #FECACA'
                    : denemeDurationMinutes > 0 && timeRemainingSeconds <= 300
                    ? '1px solid #FDE68A'
                    : 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              <Clock size={15} />
              <span>
                {denemeDurationMinutes > 0
                  ? formatTime(timeRemainingSeconds)
                  : formatTime(denemeTotalElapsedSeconds)}
              </span>
              {denemeDurationMinutes > 0 && (
                <span style={{ fontSize: '11px', opacity: 0.85 }}>kaldı</span>
              )}
              <button
                type="button"
                onClick={onToggleTimerPause}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'inherit',
                  padding: '0 0 0 4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title={isTimerPaused ? 'Süreyi Devam Ettir' : 'Süreyi Duraklat'}
              >
                {isTimerPaused ? <Play size={13} /> : <Pause size={13} />}
              </button>
            </div>

            <div style={styles.quizHeaderCounter}>
              {String(currentIndex + 1).padStart(2, '0')} / {String(questions.length).padStart(2, '0')}
            </div>
          </div>
        ) : (
          <div style={styles.quizHeaderCounter}>
            {String(currentIndex + 1).padStart(2, '0')} / {String(questions.length).padStart(2, '0')}
          </div>
        )}

        {isDenemeMode ? (
          <button
            onClick={onFinishDenemeEarly}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              border: '1px solid #FECACA',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
            title="Denemeyi Bitir"
          >
            Bitir
          </button>
        ) : (
          <button style={styles.quizMenuButton} title="Seçenekler">
            <MoreVertical size={18} color="var(--kpss-text, #111)" />
          </button>
        )}
      </div>

      {/* İlerleme Çubuğu */}
      <div style={styles.progressBarBg}>
        <div
          style={{
            ...styles.cardProgressBarFill,
            backgroundColor: 'var(--kpss-primary, #4F46E5)',
            width: `${questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0}%`,
          }}
        />
      </div>

      {/* Soru Kartı */}
      <div style={styles.questionCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
          <div style={styles.questionLabel}>
            {isDenemeMode
              ? `DENEME SORUSU ${String(currentIndex + 1).padStart(2, '0')}`
              : `SORU ${String(currentIndex + 1).padStart(2, '0')}`}
          </div>
          {currentQ?.subjectTitle && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 9px',
                borderRadius: '6px',
                backgroundColor: '#EEF2FF',
                color: '#4F46E5',
                border: '1px solid #C7D2FE',
              }}
            >
              {currentQ.subjectTitle} • {currentQ.topicTitle || 'Karma'}
            </span>
          )}
        </div>
        <div style={styles.questionText}>{currentQ?.questionText}</div>
      </div>

      {/* Şıklar Listesi */}
      <div>
        {(currentQ?.options || []).map((opt) => {
          const isSelected = stagedOption === opt.id;
          const isCorrect = isAnswered && opt.id === currentQ.correctOption;
          const isWrong = isAnswered && isSelected && !currentAns?.isCorrect;

          let cardStyle: React.CSSProperties = { ...styles.optionCard };
          let circleStyle: React.CSSProperties = { ...styles.radioCircle };
          let keyStyle: React.CSSProperties = { ...styles.optionKey };
          let textStyle: React.CSSProperties = { ...styles.optionText };

          if (isAnswered) {
            if (isCorrect) {
              cardStyle = { ...cardStyle, backgroundColor: '#F0FDF4', borderColor: '#16A34A' };
              circleStyle = { ...circleStyle, borderColor: '#16A34A' };
              keyStyle = { ...keyStyle, color: '#16A34A' };
              textStyle = { ...textStyle, color: '#16A34A', fontWeight: 600 };
            } else if (isWrong) {
              cardStyle = { ...cardStyle, backgroundColor: '#FEF2F2', borderColor: '#DC2626' };
              circleStyle = { ...circleStyle, borderColor: '#DC2626' };
              keyStyle = { ...keyStyle, color: '#DC2626' };
              textStyle = { ...textStyle, color: '#DC2626', fontWeight: 600 };
            } else {
              cardStyle = { ...cardStyle, opacity: 0.5 };
            }
          } else if (isSelected) {
            cardStyle = { ...cardStyle, ...styles.optionCardSelected };
            circleStyle = { ...circleStyle, ...styles.radioCircleSelected };
            keyStyle = { ...keyStyle, ...styles.optionKeySelected };
            textStyle = { ...textStyle, ...styles.optionTextSelected };
          }

          return (
            <div
              key={opt.id}
              onClick={() => onOptionSelect(opt.id)}
              style={cardStyle}
            >
              <div style={circleStyle}>
                {(isSelected || isCorrect) && (
                  <div
                    style={{
                      ...styles.radioInnerDot,
                      backgroundColor: isAnswered
                        ? isCorrect
                          ? '#16A34A'
                          : '#DC2626'
                        : '#FFFFFF',
                    }}
                  />
                )}
              </div>
              <span style={keyStyle}>{opt.id}</span>
              <span style={textStyle}>{opt.text}</span>
            </div>
          );
        })}
      </div>

      {/* Çözüm Açıklaması */}
      {isAnswered && (
        <div style={styles.explanationBox}>
          <div style={styles.explanationTitle}>
            {currentAns?.isCorrect ? '✅ Doğru Cevap!' : '❌ Yanlış Cevap!'} &bull; Çözüm ve Açıklama
          </div>
          <div style={styles.explanationText}>{currentQ?.explanation}</div>
        </div>
      )}

      {/* Sabit Alt Buton */}
      <div style={styles.footerContainer} className="quiz-footer-container">
        {!isAnswered ? (
          <button
            disabled={!stagedOption}
            onClick={onConfirmAnswer}
            style={{
              ...styles.actionButton,
              opacity: stagedOption ? 1 : 0.5,
              cursor: stagedOption ? 'pointer' : 'not-allowed',
            }}
          >
            Cevabı İşaretle
          </button>
        ) : (
          <button onClick={onNext} style={styles.actionButton}>
            {currentIndex === questions.length - 1 ? 'Sonuçları Gör' : 'Sonraki Soru →'}
          </button>
        )}
      </div>
    </div>
  );
};
