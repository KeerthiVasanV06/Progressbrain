import React, { useEffect, useState, useRef } from 'react';
import { useTimer } from '../hooks/useTimer';
import styles from '../styles/Timer.module.css';

const Timer = ({
  initialMinutes = 0,
  initialSeconds = 0,
  onSessionEnd = null,
  isRunning = false,
  onTimerUpdate = null,
}) => {
  const initialTotalSeconds = initialMinutes * 60 + initialSeconds;
  const { seconds, minutes, displaySeconds, isActive, toggle, reset, setCustomTime } =
    useTimer(initialTotalSeconds, onSessionEnd);

  const [displayMode, setDisplayMode] = useState('timer');
  const hasStartedRef = useRef(false);

  // Update parent with current time
  useEffect(() => {
    if (onTimerUpdate) {
      onTimerUpdate({ minutes, seconds, displaySeconds });
    }
  }, [minutes, seconds, displaySeconds, onTimerUpdate]);

  // Start timer if isRunning prop becomes true (only once)
  useEffect(() => {
    if (isRunning && !isActive && !hasStartedRef.current) {
      hasStartedRef.current = true;
      toggle();
    }
  }, [isRunning, isActive, toggle]);

  const formatTime = (m, s) => {
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleReset = () => {
    reset();
  };

  return (
    <div className={styles.container}>
      <div className={styles.timerDisplay}>
        <div className={styles.time}>{formatTime(minutes, displaySeconds)}</div>
        <p className={styles.label}>
          {displayMode === 'timer' ? 'Time Remaining' : 'Elapsed Time'}
        </p>
      </div>

      <div className={styles.controls}>
        <button
          onClick={toggle}
          className={`${styles.btn} ${isActive ? styles.pause : styles.play}`}
        >
          {isActive ? '⏸ Pause' : '▶ Start'}
        </button>

        <button onClick={handleReset} className={`${styles.btn} ${styles.reset}`}>
          🔄 Reset
        </button>
      </div>

      <div className={styles.progress}>
        <div
          className={styles.progressBar}
          style={{
            width: initialTotalSeconds > 0 
              ? `${((initialTotalSeconds - seconds) / initialTotalSeconds) * 100}%` 
              : '0%',
          }}
        ></div>
      </div>

      {seconds === 0 && initialTotalSeconds > 0 && (
        <div className={styles.completionMessage}>
          ✅ Session completed!
        </div>
      )}
    </div>
  );
};

export default Timer;
