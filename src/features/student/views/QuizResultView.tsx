import React from 'react';
import {
  ChevronLeft,
  Award,
  Clock,
  Zap,
  Timer,
  BarChart2,
  Database,
  BookOpen,
  RotateCcw,
  Info,
} from 'lucide-react';
import { Question, UserAnswer, UnitResult } from '../../../types';
import { styles } from '../../../pages/StudentQuiz.styles';

interface QuizResultViewProps {
  isDenemeMode: boolean;
  questions: Question[];
  userAnswers: Record<string, UserAnswer>;
  denemeDurationMinutes: number;
  timeRemainingSeconds: number;
  denemeTotalElapsedSeconds: number;
  mistakesBankCount: number;
  result: UnitResult;
  onNavigateHome: () => void;
  onNavigateTopics: () => void;
  onStartDenemeExam: (duration: number) => void;
  onStartMistakesBankQuiz: () => void;
  onRetryWrong: () => void;
  onRestartQuiz: () => void;
}

export const QuizResultView: React.FC<QuizResultViewProps> = ({
  isDenemeMode,
  questions,
  userAnswers,
  denemeDurationMinutes,
  timeRemainingSeconds,
  denemeTotalElapsedSeconds,
  mistakesBankCount,
  result,
  onNavigateHome,
  onNavigateTopics,
  onStartDenemeExam,
  onStartMistakesBankQuiz,
  onRetryWrong,
  onRestartQuiz,
}) => {
  const total = result.totalQuestions || questions.length || 20;
  const correct = result.correctCount;
  const wrong = result.wrongCount;
  const empty = result.emptyCount;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  if (isDenemeMode) {
    const totalTime =
      denemeDurationMinutes > 0
        ? Math.max(1, denemeDurationMinutes * 60 - timeRemainingSeconds)
        : Math.max(1, denemeTotalElapsedSeconds);
    const spentMins = Math.floor(totalTime / 60);
    const spentSecs = totalTime % 60;
    const avgSecsPerQ = Math.round(totalTime / (total || 20));

    const subjectStats: Record<string, { correct: number; total: number }> = {};
    questions.forEach((q) => {
      const sub = q.subjectTitle || 'Karma Alan';
      if (!subjectStats[sub]) subjectStats[sub] = { correct: 0, total: 0 };
      subjectStats[sub].total++;
      if (userAnswers[q.id]?.isCorrect) {
        subjectStats[sub].correct++;
      }
    });

    return (
      <div>
        {/* Üst Geri Tuşu ve Başlık */}
        <div style={styles.unitHeader}>
          <button
            onClick={onNavigateHome}
            style={styles.unitBackButton}
            title="Ana Sayfaya Dön"
          >
            <ChevronLeft size={22} color="var(--kpss-text, #111)" />
          </button>
          <div style={styles.unitDetailHeaderTitle}>Deneme Sınavı Raporu</div>
          <div style={{ width: '40px' }} />
        </div>

        {/* Sonuç Kartı / Başarı Halkası Alanı */}
        <div style={styles.resultCardNew}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', backgroundColor: '#F1F5F9', color: '#334155', fontSize: '11px', fontWeight: 700, marginBottom: '8px' }}>
            <Award size={14} />
            <span>20 SORULUK GENEL DENEME</span>
          </div>
          <div style={styles.resultMainTitleNew}>Deneme Sınavı Tamamlandı!</div>

          {/* Başarı Halkası */}
          <div style={styles.circleContainerNew}>
            <div style={styles.scoreTextNew}>{correct} / {total}</div>
            <div style={styles.percentageTextNew}>%{percentage} Başarı</div>
          </div>

          {/* Doğru - Yanlış - Boş - Net İstatistikleri */}
          <div style={styles.statsRowNew}>
            <div style={styles.statItemNew}>
              <div style={{ ...styles.statDotNew, backgroundColor: '#2E7D32' }} />
              <div style={styles.statLabelNew}>Doğru</div>
              <div style={styles.statValueNew}>{correct}</div>
            </div>
            <div style={styles.statDividerNew} />
            <div style={styles.statItemNew}>
              <div style={{ ...styles.statDotNew, backgroundColor: '#D32F2F' }} />
              <div style={styles.statLabelNew}>Yanlış</div>
              <div style={styles.statValueNew}>{wrong}</div>
            </div>
            <div style={styles.statDividerNew} />
            <div style={styles.statItemNew}>
              <div style={{ ...styles.statDotNew, backgroundColor: '#888' }} />
              <div style={styles.statLabelNew}>Boş</div>
              <div style={styles.statValueNew}>{empty}</div>
            </div>
            <div style={styles.statDividerNew} />
            <div style={styles.statItemNew}>
              <div style={{ ...styles.statDotNew, backgroundColor: '#4F46E5' }} />
              <div style={styles.statLabelNew}>KPSS Net</div>
              <div style={{ ...styles.statValueNew, color: '#4F46E5' }}>
                {Math.max(0, correct - wrong * 0.25).toFixed(2).replace(/\.00$/, '')}
              </div>
            </div>
          </div>
        </div>

        {/* SÜRE VE HIZ ANALİZ KARTI */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '16px',
          marginBottom: '16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
          textAlign: 'center',
        }}>
          <div style={{ padding: '10px', backgroundColor: '#F8FAFC', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <Clock size={13} />
              Toplam Süre
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>
              {spentMins} dk {spentSecs} sn
            </div>
          </div>

          <div style={{ padding: '10px', backgroundColor: '#F8FAFC', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <Zap size={13} />
              Soru Başına
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>
              {avgSecsPerQ} sn
            </div>
          </div>

          <div style={{ padding: '10px', backgroundColor: '#F8FAFC', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <Timer size={13} />
              Sınav Temposu
            </div>
            <div style={{
              fontSize: '12px',
              fontWeight: 700,
              color: avgSecsPerQ <= 60 ? '#15803D' : avgSecsPerQ <= 75 ? '#2563EB' : '#D97706',
              marginTop: '5px',
            }}>
              {avgSecsPerQ <= 60 ? '⚡ Çok Hızlı' : avgSecsPerQ <= 75 ? '🎯 İdeal KPSS' : '⏳ Normal'}
            </div>
          </div>
        </div>

        {/* DERS BAZLI BAŞARI DAĞILIMI */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '16px',
          marginBottom: '16px',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BarChart2 size={16} color="#4F46E5" />
            <span>Ders Bazlı Performans Dağılımı</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(subjectStats).map(([subName, stat]) => {
              const subPct = Math.round((stat.correct / stat.total) * 100);
              return (
                <div key={subName} style={{ padding: '10px 12px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{subName}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: stat.correct === stat.total ? '#16A34A' : '#475569' }}>
                      {stat.correct} / {stat.total} Doğru (%{subPct})
                    </span>
                  </div>
                  <div style={{ height: '5px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${subPct}%`,
                        backgroundColor: subPct >= 75 ? '#16A34A' : subPct >= 50 ? '#F59E0B' : '#EF4444',
                        borderRadius: '3px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Yanlışlarım Özel Soru Bankası Bilgisi */}
        {wrong > 0 && (
          <div style={{
            backgroundColor: '#FEF2F2',
            borderRadius: '14px',
            border: '1px solid #FECACA',
            padding: '14px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Database size={20} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#991B1B' }}>
                  'Yanlışlarım' Soru Bankasına Kaydedildi
                </div>
                <div style={{ fontSize: '11.5px', color: '#B91C1C', marginTop: '2px' }}>
                  Bu denemedeki {wrong} yanlış soru otomatik olarak <b>'Yanlışlarım'</b> özel soru bankasına eklendi.
                </div>
              </div>
            </div>

            <button
              onClick={onStartMistakesBankQuiz}
              style={{
                padding: '8px 14px',
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)',
              }}
            >
              <BookOpen size={13} />
              <span>Yanlışlarım Bankasını Aç ({mistakesBankCount})</span>
            </button>
          </div>
        )}

        {/* Yönlendirme Butonları */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={() => onStartDenemeExam(denemeDurationMinutes)}
            style={{
              ...styles.resultPrimaryButton,
              backgroundColor: '#111111',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <RotateCcw size={16} />
            Yeni Deneme Sınavı Başlat (20 Soru)
          </button>

          {mistakesBankCount > 0 && (
            <button
              onClick={onStartMistakesBankQuiz}
              style={{
                ...styles.resultSecondaryButton,
                backgroundColor: '#FFF1F2',
                color: '#E11D48',
                border: '1px solid #FECDD3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Database size={16} />
              <span>'Yanlışlarım' Özel Soru Bankasını Çöz ({mistakesBankCount} Soru)</span>
            </button>
          )}

          {wrong > 0 && (
            <button
              onClick={onRetryWrong}
              style={styles.resultSecondaryButton}
            >
              Sadece Bu Denemedeki Hataları Çöz ({wrong} Soru)
            </button>
          )}

          <button
            onClick={onNavigateHome}
            style={styles.resultOutlineButton}
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Üst Geri Tuşu ve Başlık */}
      <div style={styles.unitHeader}>
        <button
          onClick={onNavigateTopics}
          style={styles.unitBackButton}
          title="Konulara Dön"
        >
          <ChevronLeft size={22} color="var(--kpss-text, #111)" />
        </button>
        <div style={styles.unitDetailHeaderTitle}>Test Sonucu</div>
        <div style={{ width: '40px' }} />
      </div>

      {/* Sonuç Kartı / Başarı Halkası Alanı */}
      <div style={styles.resultCardNew}>
        <div style={styles.resultMainTitleNew}>Test Tamamlandı</div>

        {/* Başarı Halkası */}
        <div style={styles.circleContainerNew}>
          <div style={styles.scoreTextNew}>{correct} / {total}</div>
          <div style={styles.percentageTextNew}>%{percentage} Başarı</div>
        </div>

        {/* Doğru - Yanlış - Boş - Net İstatistikleri */}
        <div style={styles.statsRowNew}>
          <div style={styles.statItemNew}>
            <div style={{ ...styles.statDotNew, backgroundColor: '#2E7D32' }} />
            <div style={styles.statLabelNew}>Doğru</div>
            <div style={styles.statValueNew}>{correct}</div>
          </div>
          <div style={styles.statDividerNew} />
          <div style={styles.statItemNew}>
            <div style={{ ...styles.statDotNew, backgroundColor: '#D32F2F' }} />
            <div style={styles.statLabelNew}>Yanlış</div>
            <div style={styles.statValueNew}>{wrong}</div>
          </div>
          <div style={styles.statDividerNew} />
          <div style={styles.statItemNew}>
            <div style={{ ...styles.statDotNew, backgroundColor: '#888' }} />
            <div style={styles.statLabelNew}>Boş</div>
            <div style={styles.statValueNew}>{empty}</div>
          </div>
          <div style={styles.statDividerNew} />
          <div style={styles.statItemNew}>
            <div style={{ ...styles.statDotNew, backgroundColor: '#4F46E5' }} />
            <div style={styles.statLabelNew}>KPSS Net</div>
            <div style={{ ...styles.statValueNew, color: '#4F46E5' }}>
              {Math.max(0, correct - wrong * 0.25).toFixed(2).replace(/\.00$/, '')}
            </div>
          </div>
        </div>
      </div>

      {/* Hata Bilgilendirme Banner'ı */}
      <div style={styles.errorBannerNew}>
        <Info size={18} color="#666" style={{ marginRight: '8px', flexShrink: 0 }} />
        <span style={styles.errorBannerTextNew}>
          {wrong > 0 ? `${wrong} soru hata havuzuna eklendi.` : 'Tebrikler! Hiç hata yapmadınız.'}
        </span>
      </div>

      {/* Yönlendirme Butonları */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {wrong > 0 && (
          <button
            onClick={onRetryWrong}
            style={styles.resultPrimaryButton}
          >
            Hatalarımı Çöz
          </button>
        )}

        <button
          onClick={onRestartQuiz}
          style={styles.resultSecondaryButton}
        >
          Testi Tekrarla
        </button>

        <button
          onClick={onNavigateTopics}
          style={styles.resultOutlineButton}
        >
          Konulara Dön
        </button>
      </div>
    </div>
  );
};
