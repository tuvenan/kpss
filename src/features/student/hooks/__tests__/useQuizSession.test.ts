import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuizSession } from '../useQuizSession';
import { sampleQuestions } from '../../../../test/fixtures';

describe('useQuizSession', () => {
  const defaultProps = {
    isDenemeMode: true,
    activeExamAttemptId: 'test-attempt-1',
    selectedSubject: null,
    selectedUnit: null,
    selectedTopic: null,
    selectedBank: null,
    setViewState: vi.fn(),
    onRefreshLeitnerStats: vi.fn(),
    onAnswerSaved: vi.fn(),
    onCompleteExam: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('seçenek seçildiğinde stagedOption güncellenir ve cevaplanana kadar değiştirilebilir', () => {
    const { result } = renderHook(() => useQuizSession(defaultProps));

    act(() => {
      result.current.setQuestions(sampleQuestions);
    });

    // Başlangıçta stagedOption boştur
    expect(result.current.stagedOption).toBeNull();

    // A seçeneği seçilir
    act(() => {
      result.current.handleOptionSelect('A');
    });
    expect(result.current.stagedOption).toBe('A');

    // Onaylanmadan önce B seçeneğine değiştirilebilir
    act(() => {
      result.current.handleOptionSelect('B');
    });
    expect(result.current.stagedOption).toBe('B');
  });

  it('cevap onaylandığında doğruluk doğru hesaplanır ve geribildirim görünümüne geçilir', () => {
    const onAnswerSaved = vi.fn();
    const setViewState = vi.fn();
    const { result } = renderHook(() =>
      useQuizSession({
        ...defaultProps,
        onAnswerSaved,
        setViewState,
      })
    );

    act(() => {
      result.current.setQuestions(sampleQuestions);
    });

    // 1. Soru (Doğru cevap A): A seçilir ve onaylanır
    act(() => {
      result.current.handleOptionSelect('A');
    });
    act(() => {
      result.current.handleConfirmAnswer();
    });

    const q1Answer = result.current.userAnswers['q1'];
    expect(q1Answer).toBeDefined();
    expect(q1Answer.isCorrect).toBe(true);
    expect(q1Answer.selectedOption).toBe('A');
    expect(setViewState).toHaveBeenCalledWith('feedback');
    expect(onAnswerSaved).toHaveBeenCalledWith('q1', q1Answer, expect.objectContaining({ q1: q1Answer }));

    // Cevaplandıktan sonra tekrar seçenek değiştirilemez
    act(() => {
      result.current.handleOptionSelect('C');
    });
    expect(result.current.stagedOption).toBe('A');
  });

  it('sonraki soruya geçildiğinde currentIndex artar ve stagedOption sıfırlanır', () => {
    const { result } = renderHook(() => useQuizSession(defaultProps));

    act(() => {
      result.current.setQuestions(sampleQuestions);
    });
    act(() => {
      result.current.handleOptionSelect('A');
    });
    act(() => {
      result.current.handleConfirmAnswer();
    });

    expect(result.current.currentIndex).toBe(0);

    // Sonraki soruya geç
    act(() => {
      result.current.handleNext();
    });

    expect(result.current.currentIndex).toBe(1);
    expect(result.current.currentQ?.id).toBe('q2');
    expect(result.current.stagedOption).toBeNull();
    expect(result.current.isAnswered).toBe(false);
  });

  it('son soruda handleNext çağrıldığında quiz tamamlanır ve onCompleteExam tetiklenir', () => {
    const onCompleteExam = vi.fn();
    const { result } = renderHook(() =>
      useQuizSession({
        ...defaultProps,
        onCompleteExam,
      })
    );

    act(() => {
      result.current.setQuestions([sampleQuestions[0]]); // Tek soruluk sınav
    });
    act(() => {
      result.current.handleOptionSelect('A');
    });
    act(() => {
      result.current.handleConfirmAnswer();
    });

    expect(result.current.isCompleted).toBe(false);

    // Son soruda sonraki butonuna bas
    act(() => {
      result.current.handleNext();
    });

    expect(result.current.isCompleted).toBe(true);
    expect(onCompleteExam).toHaveBeenCalledTimes(1);

    // İkinci kez çağrıldığında mükerrer tamamlama engellenmeli (idempotency)
    act(() => {
      result.current.completeQuiz();
    });

    expect(onCompleteExam).toHaveBeenCalledTimes(1);
  });

  it('yeniden başlatıldığında tüm sınav state’i sıfırlanır', () => {
    const { result } = renderHook(() => useQuizSession(defaultProps));

    act(() => {
      result.current.setQuestions(sampleQuestions);
    });
    act(() => {
      result.current.handleOptionSelect('A');
    });
    act(() => {
      result.current.handleConfirmAnswer();
    });
    act(() => {
      result.current.handleNext();
    });

    expect(result.current.currentIndex).toBe(1);
    expect(Object.keys(result.current.userAnswers).length).toBe(1);

    // handleRestartQuiz çağrısı
    act(() => {
      result.current.handleRestartQuiz();
    });

    expect(result.current.currentIndex).toBe(0);
    expect(result.current.userAnswers).toEqual({});
    expect(result.current.stagedOption).toBeNull();
    expect(result.current.isCompleted).toBe(false);
  });
});
