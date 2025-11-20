// useTimer.js
import { useState, useEffect, useRef, useCallback } from "react";

export const useTimer = (initialSeconds = 0, onFinish = null) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef(null);
  const onFinishRef = useRef(onFinish);

  // Keep callback updated without re-triggering timer
  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  // When parent changes the initial time → sync internally
  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  const toggle = useCallback(() => {
    setIsActive((prev) => !prev);
  }, []);

  const stop = useCallback(() => {
    setIsActive(false);
  }, []);

  const reset = useCallback(() => {
    setSeconds(initialSeconds);
    setIsActive(false);
  }, [initialSeconds]);

  const setCustomTime = useCallback((time) => {
    setSeconds(Math.max(0, time));
  }, []);

  // --- Timer logic ---
  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setIsActive(false);

          if (onFinishRef.current) {
            onFinishRef.current();
          }

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isActive]);

  const minutes = Math.floor(seconds / 60);
  const displaySeconds = seconds % 60;

  return {
    seconds,
    minutes,
    displaySeconds,
    isActive,
    toggle,
    stop,
    reset,
    setCustomTime,
  };
};

export default useTimer;
