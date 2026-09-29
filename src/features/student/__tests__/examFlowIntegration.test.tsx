import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { useQuizSession } from '../hooks/useQuizSession';
import { useExamTimer } from '../hooks/useExamTimer';
import { useExamPersistence } from '../hooks/useExamPersistence';
import { sampleQuestions } from '../../../test/fixtures';
import { examSessionService } from '../../../services/examSessionService';
import { getMistakesBankQuestions } from '../../../services/mockExamService';

// Test Harness Component that connects the 3 hooks identically to StudentQuizPage
const ExamFlowTestContainer: React.FC<{ initialAttemptId?: string }> = ({ initialAttemptId }) => {
  const [isDenemeMode, setIsDenemeMode] = useState<boolean>(Boolean(initialAttemptId));
  const [viewState, setViewState] = useState<string>('quiz');

  // 1. Quiz Session
  const quiz = useQuizSession({
    isDenemeMode,
    getActiveExamAttemptId: () => persistence.activeExamAttemptId,
    selectedSubject: null,
    selectedUnit: null,
    selectedTopic: null,
    selectedBank: null,
    setViewState: (vs) => setViewState(vs),
    onRefreshLeitnerStats: () => {},
    onAnswerSaved: () => {
      persistence.saveSessionNow();
    },
    onCompleteExam: (questions, answers) => {
      persistence.completeExamSession(questions, answers);
    },
  });

  // 2. Exam Timer
  const timer = useExamTimer({
    isDenemeMode,
    viewState,
    isCompleted: quiz.isCompleted,
    onTimeout: () => {
      quiz.completeQuiz();
    },
  });

  // 3. Exam Persistence
  const persistence = useExamPersistence({
    isDenemeMode,
    isCompleted: quiz.isCompleted,
    questions: quiz.questions,
    userAnswers: quiz.userAnswers,
    currentIndex: quiz.currentIndex,
    startTime: quiz.startTime,
    timeRemainingSeconds: timer.timeRemainingSeconds,
    denemeTotalElapsedSeconds: timer.denemeTotalElapsedSeconds,
    denemeDurationMinutes: timer.denemeDurationMinutes,
  });

  const handleStartExam = () => {
    const attemptId = 'attempt-integration-' + Date.now();
    setIsDenemeMode(true);
    setViewState('quiz');
    quiz.resetCompletionStatus();
    quiz.setQuestions(sampleQuestions);
    quiz.setCurrentIndex(0);
    quiz.setUserAnswers({});
    quiz.setStagedOption(null);
    quiz.setStartTime(Date.now());

    timer.resetTimer(20); // 20 dk = 1200 sn
    persistence.setActiveExamAttemptId(attemptId);

    examSessionService.saveActiveSession({
      examAttemptId: attemptId,
      templateCode: 'quick_20',
      templateName: 'Hızlı 20 Soru Denemesi',
      durationMinutes: 20,
      timeRemainingSeconds: 1200,
      totalElapsedSeconds: 0,
      currentIndex: 0,
      questions: sampleQuestions,
      userAnswers: {},
      startedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      status: 'in_progress',
    });
  };

  const handleResumeExam = () => {
    const session = persistence.recoveredSession;
    if (!session) return;

    setIsDenemeMode(true);
    setViewState('quiz');
    quiz.resetCompletionStatus();
    quiz.setQuestions(session.questions);
    quiz.setCurrentIndex(session.currentIndex);
    quiz.setUserAnswers(session.userAnswers);
    quiz.setStagedOption(null);

    timer.setDenemeDurationMinutes(session.durationMinutes);
    timer.setTimeRemainingSeconds(session.timeRemainingSeconds);
    timer.setDenemeTotalElapsedSeconds(session.totalElapsedSeconds);
    timer.setIsTimerPaused(false);

    persistence.setActiveExamAttemptId(session.examAttemptId);
  };

  return (
    <div>
      <div data-testid="view-state">{viewState}</div>
      <div data-testid="is-completed">{quiz.isCompleted ? 'COMPLETED' : 'IN_PROGRESS'}</div>
      <div data-testid="current-index">{quiz.currentIndex}</div>
      <div data-testid="question-text">{quiz.currentQ?.questionText}</div>
      <div data-testid="time-remaining">{timer.timeRemainingSeconds}</div>
      <div data-testid="answers-count">{Object.keys(quiz.userAnswers).length}</div>
      <div data-testid="has-recovered">{persistence.recoveredSession ? 'YES' : 'NO'}</div>

      <button onClick={handleStartExam}>Deneme Başlat</button>
      {persistence.recoveredSession && (
        <button onClick={handleResumeExam}>Sınava Devam Et</button>
      )}

      {quiz.currentQ && !quiz.isCompleted && (
        <div>
          {quiz.currentQ.options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => quiz.handleOptionSelect(opt.id)}
              data-testid={`opt-${opt.id}`}
            >
              {opt.text}
            </button>
          ))}
          <button onClick={quiz.handleConfirmAnswer}>Cevabı Onayla</button>
          <button onClick={quiz.handleNext}>Sonraki Soru</button>
          <button onClick={() => quiz.completeQuiz()}>Sınavı Bitir</button>
        </div>
      )}
    </div>
  );
};

describe('Sınav Akışı Entegrasyon Testi (Integration Test)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Deneme başlatma -> Cevap verme -> Süre ilerletme -> Oturum kaydetme -> Sayfa yenileme -> Kaldığı yerden devam etme -> Sınavı tamamlama akışı', async () => {
    // 1. Sınav bileşeni mount edilir ve deneme başlatılır
    const { unmount } = render(<ExamFlowTestContainer />);

    expect(screen.getByTestId('is-completed')).toHaveTextContent('IN_PROGRESS');

    act(() => {
      fireEvent.click(screen.getByText('Deneme Başlat'));
    });

    expect(screen.getByTestId('question-text')).toHaveTextContent('Türkiye Selçuklu Devleti kurucusu kimdir?');
    expect(screen.getByTestId('current-index')).toHaveTextContent('0');
    expect(screen.getByTestId('time-remaining')).toHaveTextContent('1200');

    // 2. 1. Soruya cevap verilir (Doğru cevap A)
    act(() => {
      fireEvent.click(screen.getByTestId('opt-A'));
    });
    act(() => {
      fireEvent.click(screen.getByText('Cevabı Onayla'));
    });

    expect(screen.getByTestId('answers-count')).toHaveTextContent('1');

    // 3. Timer ilerletilir (15 saniye)
    act(() => {
      vi.advanceTimersByTime(15000);
    });

    expect(screen.getByTestId('time-remaining')).toHaveTextContent('1185');

    // 2. soruya geçilir
    act(() => {
      fireEvent.click(screen.getByText('Sonraki Soru'));
    });

    expect(screen.getByTestId('current-index')).toHaveTextContent('1');
    expect(screen.getByTestId('question-text')).toHaveTextContent('Aşağıdakilerden hangisi bir eylemsi (fiilimsi) değildir?');

    // 4. Oturumu kaydetme simülasyonu (Zamanlayıcı veya periyodik kayıt)
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // LocalStorage'da aktif oturumun güncellendiğini doğrula
    const savedBeforeReload = examSessionService.getActiveSession();
    expect(savedBeforeReload).not.toBeNull();
    expect(savedBeforeReload?.currentIndex).toBe(1);
    expect(savedBeforeReload?.userAnswers['q1'].isCorrect).toBe(true);

    // 5. Sayfa yenileme simülasyonu (Unmount & Remount)
    unmount();

    // Yeni bileşen yüklenir
    render(<ExamFlowTestContainer />);

    // Hafızada kurtarılabilir bir sınav olduğunu doğrula
    expect(screen.getByTestId('has-recovered')).toHaveTextContent('YES');
    expect(screen.getByText('Sınava Devam Et')).toBeInTheDocument();

    // 6. Kaldığı yerden devam etme butonuna tıklanır
    act(() => {
      fireEvent.click(screen.getByText('Sınava Devam Et'));
    });

    // 2. sorudan ve kalan 1180 saniyeden devam ettiğini doğrula
    expect(screen.getByTestId('current-index')).toHaveTextContent('1');
    expect(screen.getByTestId('question-text')).toHaveTextContent('Aşağıdakilerden hangisi bir eylemsi (fiilimsi) değildir?');
    expect(screen.getByTestId('answers-count')).toHaveTextContent('1');

    // 7. 2. Soruya YANLIŞ cevap verilir (Doğru D, öğrenci A seçer)
    act(() => {
      fireEvent.click(screen.getByTestId('opt-A'));
    });
    act(() => {
      fireEvent.click(screen.getByText('Cevabı Onayla'));
    });

    // 3. soruya geçilir
    act(() => {
      fireEvent.click(screen.getByText('Sonraki Soru'));
    });

    expect(screen.getByTestId('current-index')).toHaveTextContent('2');
    expect(screen.getByTestId('question-text')).toHaveTextContent('Türkiye’nin en yüksek dağı hangisidir?');

    // 3. Soruya DOĞRU cevap verilir (Doğru B, öğrenci B seçer)
    act(() => {
      fireEvent.click(screen.getByTestId('opt-B'));
    });
    act(() => {
      fireEvent.click(screen.getByText('Cevabı Onayla'));
    });

    // 8. Sınavı tamamla (Son soruda Sonraki veya Sınavı Bitir)
    act(() => {
      fireEvent.click(screen.getByText('Sonraki Soru'));
    });

    expect(screen.getByTestId('is-completed')).toHaveTextContent('COMPLETED');

    // 9. Aktif oturumun temizlendiğini ve Yanlışlar Bankasına yalnızca yanlış sorunun eklendiğini doğrula
    const afterCompletionSession = examSessionService.getActiveSession();
    expect(afterCompletionSession).toBeNull();

    const mistakeQuestions = getMistakesBankQuestions();
    const wrongQuestionRecorded = mistakeQuestions.some((q) => q.questionText.includes('fiilimsi'));
    const correctQuestionRecorded = mistakeQuestions.some((q) => q.questionText.includes('Selçuklu'));

    expect(wrongQuestionRecorded).toBe(true);
    expect(correctQuestionRecorded).toBe(false);
  });
});
