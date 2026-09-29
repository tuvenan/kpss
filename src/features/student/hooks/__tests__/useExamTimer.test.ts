import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExamTimer } from '../useExamTimer';

describe('useExamTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('süreli sınavda sayaç her saniye azalır', () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() =>
      useExamTimer({
        isDenemeMode: true,
        viewState: 'quiz',
        isCompleted: false,
        onTimeout,
      })
    );

    // Başlangıçta 25 dk (1500 saniye) ve geçen süre 0
    expect(result.current.timeRemainingSeconds).toBe(1500);
    expect(result.current.denemeTotalElapsedSeconds).toBe(0);

    // 5 saniye ilerlet
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.timeRemainingSeconds).toBe(1495);
    expect(result.current.denemeTotalElapsedSeconds).toBe(5);
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('süresiz sınavda (0 dk) sayaç ileri doğru artar', () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() =>
      useExamTimer({
        isDenemeMode: true,
        viewState: 'quiz',
        isCompleted: false,
        onTimeout,
      })
    );

    act(() => {
      result.current.resetTimer(0);
    });

    expect(result.current.timeRemainingSeconds).toBe(0);
    expect(result.current.denemeTotalElapsedSeconds).toBe(0);

    // 7 saniye ilerlet
    act(() => {
      vi.advanceTimersByTime(7000);
    });

    expect(result.current.timeRemainingSeconds).toBe(7);
    expect(result.current.denemeTotalElapsedSeconds).toBe(7);
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('duraklatıldığında sayaç değişmez', () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() =>
      useExamTimer({
        isDenemeMode: true,
        viewState: 'quiz',
        isCompleted: false,
        onTimeout,
      })
    );

    // 3 saniye çalıştır
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.timeRemainingSeconds).toBe(1497);

    // Duraklat
    act(() => {
      result.current.setIsTimerPaused(true);
    });

    // Duraklatılmışken 10 saniye ilerlet
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    // Süreler aynı kalmalı
    expect(result.current.timeRemainingSeconds).toBe(1497);
    expect(result.current.denemeTotalElapsedSeconds).toBe(3);
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('devam ettirildiğinde sayaç çalışmaya devam eder', () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() =>
      useExamTimer({
        isDenemeMode: true,
        viewState: 'quiz',
        isCompleted: false,
        onTimeout,
      })
    );

    // Duraklat
    act(() => {
      result.current.setIsTimerPaused(true);
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.timeRemainingSeconds).toBe(1500);

    // Devam ettir
    act(() => {
      result.current.setIsTimerPaused(false);
    });
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(result.current.timeRemainingSeconds).toBe(1496);
    expect(result.current.denemeTotalElapsedSeconds).toBe(4);
  });

  it('süre sıfıra ulaştığında onTimeout yalnızca bir kez çağrılır', () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() =>
      useExamTimer({
        isDenemeMode: true,
        viewState: 'quiz',
        isCompleted: false,
        onTimeout,
      })
    );

    // Süreyi 3 saniye kalacak şekilde ayarla
    act(() => {
      result.current.setTimeRemainingSeconds(3);
    });

    // 3 saniye ilerlet
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.timeRemainingSeconds).toBe(0);
    expect(onTimeout).toHaveBeenCalledTimes(1);

    // Fazladan 10 saniye daha ilerletildiğinde onTimeout tekrar tetiklenmemeli
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(onTimeout).toHaveBeenCalledTimes(1);
    expect(result.current.timeRemainingSeconds).toBe(0);
  });
});
