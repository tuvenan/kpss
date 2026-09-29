import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExamPersistence } from '../useExamPersistence';
import { examSessionService, ActiveExamSession } from '../../../../services/examSessionService';
import { sampleQuestions } from '../../../../test/fixtures';
import { UserAnswer } from '../../../../types';

describe('useExamPersistence', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('gerçek questions, userAnswers ve currentIndex değerleri aktif oturuma kaydedilir', () => {
    const mockUserAnswers: Record<string, UserAnswer> = {
      q1: {
        questionId: 'q1',
        selectedOption: 'A',
        isCorrect: true,
        timeSpentSeconds: 5,
      },
    };

    const { result } = renderHook(() =>
      useExamPersistence({
        isDenemeMode: true,
        isCompleted: false,
        questions: sampleQuestions,
        userAnswers: mockUserAnswers,
        currentIndex: 1,
        startTime: Date.now() - 30000,
        timeRemainingSeconds: 1200,
        denemeTotalElapsedSeconds: 30,
        denemeDurationMinutes: 20,
      })
    );

    act(() => {
      result.current.setActiveExamAttemptId('attempt-123');
    });

    act(() => {
      result.current.saveSessionNow();
    });

    const saved = examSessionService.getActiveSession();
    expect(saved).not.toBeNull();
    expect(saved?.examAttemptId).toBe('attempt-123');
    expect(saved?.currentIndex).toBe(1);
    expect(saved?.questions.length).toBe(sampleQuestions.length);
    expect(saved?.userAnswers['q1']).toEqual(mockUserAnswers['q1']);
    expect(saved?.timeRemainingSeconds).toBe(1200);
  });

  it('hafızadaki kayıtlı sınav oturumu (recoveredSession) başarıyla yüklenir', () => {
    const existingSession: ActiveExamSession = {
      examAttemptId: 'attempt-recovered-999',
      templateCode: 'quick_20',
      templateName: 'Hızlı 20 Soru Denemesi',
      durationMinutes: 20,
      timeRemainingSeconds: 850,
      totalElapsedSeconds: 350,
      currentIndex: 2,
      questions: sampleQuestions,
      userAnswers: {
        q1: { questionId: 'q1', selectedOption: 'A', isCorrect: true, timeSpentSeconds: 10 },
      },
      startedAt: new Date(Date.now() - 350000).toISOString(),
      lastActiveAt: new Date().toISOString(),
      status: 'in_progress',
    };

    examSessionService.saveActiveSession(existingSession);

    const { result } = renderHook(() =>
      useExamPersistence({
        isDenemeMode: true,
        isCompleted: false,
        questions: [],
        userAnswers: {},
        currentIndex: 0,
        startTime: Date.now(),
        timeRemainingSeconds: 0,
        denemeTotalElapsedSeconds: 0,
        denemeDurationMinutes: 20,
      })
    );

    expect(result.current.activeExamAttemptId).toBe('attempt-recovered-999');
    expect(result.current.recoveredSession).not.toBeNull();
    expect(result.current.recoveredSession?.currentIndex).toBe(2);
    expect(result.current.recoveredSession?.questions.length).toBe(3);
    expect(result.current.recoveredSession?.userAnswers['q1'].selectedOption).toBe('A');
  });

  it('tamamlanmış (isCompleted: true) sınav oturumu tekrar kaydedilmez', () => {
    const { result } = renderHook(() =>
      useExamPersistence({
        isDenemeMode: true,
        isCompleted: true, // Sınav tamamlanmış
        questions: sampleQuestions,
        userAnswers: {},
        currentIndex: 0,
        startTime: Date.now(),
        timeRemainingSeconds: 100,
        denemeTotalElapsedSeconds: 50,
        denemeDurationMinutes: 20,
      })
    );

    act(() => {
      result.current.setActiveExamAttemptId('attempt-done');
    });

    act(() => {
      result.current.saveSessionNow();
    });

    const saved = examSessionService.getActiveSession();
    expect(saved).toBeNull();
  });

  it('aynı oturum birden fazla kez tamamlanmaz (idempotency)', async () => {
    const completeSpy = vi.spyOn(examSessionService, 'completeActiveSession').mockResolvedValue();

    const existingSession: ActiveExamSession = {
      examAttemptId: 'attempt-idempotent-1',
      templateCode: 'quick_20',
      templateName: 'Hızlı 20',
      durationMinutes: 20,
      timeRemainingSeconds: 600,
      totalElapsedSeconds: 600,
      currentIndex: 2,
      questions: sampleQuestions,
      userAnswers: {
        q1: { questionId: 'q1', selectedOption: 'A', isCorrect: true, timeSpentSeconds: 5 },
        q2: { questionId: 'q2', selectedOption: 'A', isCorrect: false, timeSpentSeconds: 5 }, // Yanlış
      },
      startedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      status: 'in_progress',
    };
    examSessionService.saveActiveSession(existingSession);

    const { result } = renderHook(() =>
      useExamPersistence({
        isDenemeMode: true,
        isCompleted: false,
        questions: sampleQuestions,
        userAnswers: existingSession.userAnswers,
        currentIndex: 2,
        startTime: Date.now(),
        timeRemainingSeconds: 600,
        denemeTotalElapsedSeconds: 600,
        denemeDurationMinutes: 20,
      })
    );

    // İlk tamamlama çağrısı
    act(() => {
      result.current.completeExamSession(sampleQuestions, existingSession.userAnswers);
    });

    expect(completeSpy).toHaveBeenCalledTimes(1);
    expect(completeSpy).toHaveBeenCalledWith(
      expect.objectContaining({ examAttemptId: 'attempt-idempotent-1' }),
      expect.objectContaining({
        correctCount: 1,
        wrongCount: 1,
        netScore: 0.75,
      })
    );

    // İkinci tamamlama çağrısı (örn. timeout + manuel buton veya çift tıklama)
    act(() => {
      result.current.completeExamSession(sampleQuestions, existingSession.userAnswers);
    });

    // Mükerrer çağrı engellenmeli
    expect(completeSpy).toHaveBeenCalledTimes(1);

    completeSpy.mockRestore();
  });

  it('unmount/cleanup sırasında event listener ve periyodik interval kaldırılır', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');

    const { result, unmount } = renderHook(() =>
      useExamPersistence({
        isDenemeMode: true,
        isCompleted: false,
        questions: sampleQuestions,
        userAnswers: {},
        currentIndex: 0,
        startTime: Date.now(),
        timeRemainingSeconds: 500,
        denemeTotalElapsedSeconds: 50,
        denemeDurationMinutes: 10,
      })
    );

    act(() => {
      result.current.setActiveExamAttemptId('attempt-cleanup-test');
    });

    // Unmount çağrısı
    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

    removeEventListenerSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });
});
