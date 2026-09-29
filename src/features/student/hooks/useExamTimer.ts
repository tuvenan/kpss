import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseExamTimerProps {
  isDenemeMode: boolean;
  viewState: string;
  isCompleted: boolean;
  onTimeout: () => void;
}

export const useExamTimer = ({
  isDenemeMode,
  viewState,
  isCompleted,
  onTimeout,
}: UseExamTimerProps) => {
  const [denemeDurationMinutes, setDenemeDurationMinutes] = useState<number>(25);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(25 * 60);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);
  const [denemeTotalElapsedSeconds, setDenemeTotalElapsedSeconds] = useState<number>(0);

  const onTimeoutRef = useRef(onTimeout);
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  // Timer interval effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    const isExamRunning =
      isDenemeMode &&
      (viewState === 'quiz' || viewState === 'feedback') &&
      !isCompleted &&
      !isTimerPaused;

    if (isExamRunning) {
      interval = setInterval(() => {
        setDenemeTotalElapsedSeconds((prev) => prev + 1);
        setTimeRemainingSeconds((prev) => {
          if (denemeDurationMinutes > 0) {
            if (prev <= 1) {
              if (interval) clearInterval(interval);
              // Süre dolduğunda zaman aşımı callback'ini tetikle
              onTimeoutRef.current();
              return 0;
            }
            return prev - 1;
          } else {
            // Süresiz deneme modunda geçen süre ileri doğru artar
            return prev + 1;
          }
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isDenemeMode, viewState, isCompleted, isTimerPaused, denemeDurationMinutes]);

  const resetTimer = useCallback((durationMinutes: number) => {
    setDenemeDurationMinutes(durationMinutes);
    const initialSeconds = durationMinutes > 0 ? durationMinutes * 60 : 0;
    setTimeRemainingSeconds(initialSeconds);
    setDenemeTotalElapsedSeconds(0);
    setIsTimerPaused(false);
  }, []);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, []);

  return {
    isDenemeMode,
    denemeDurationMinutes,
    setDenemeDurationMinutes,
    timeRemainingSeconds,
    setTimeRemainingSeconds,
    isTimerPaused,
    setIsTimerPaused,
    denemeTotalElapsedSeconds,
    setDenemeTotalElapsedSeconds,
    resetTimer,
    formatTime,
  };
};
