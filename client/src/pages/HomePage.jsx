// HomePage.jsx
import React, { useEffect, useState, useContext } from 'react';
import API from '../utils/api';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import styles from '../styles/HomePage.module.css';

const HomePage = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [streak, setStreak] = useState({ currentStreak: 0, highestStreak: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  const loadStreak = async () => {
    try {
      const res = await API.get('/api/streak');
      setStreak(res.data.streak || { currentStreak: 0, highestStreak: 0 });
      setError(null);
    } catch (err) {
      console.error('Failed to fetch streak:', err);
      setStreak({ currentStreak: 0, highestStreak: 0 });
      setError('Could not load streak');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStreak();
    
    // Trigger visibility for animations
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  // Refresh streak when returning from other pages
  useEffect(() => {
    loadStreak();
  }, [location]);

  return (
    <div className={`${styles.container} ${isVisible ? styles.visible : ''}`}>
      <h1 className={styles.title}>
        Welcome to Progress Brain
      </h1>
      
      <p className={styles.subtitle}>
        Track your study sessions, streaks, and progress
      </p>

      {user && (
        <div className={styles.greeting}>
          <p>Hello, <strong>{user.username}</strong>! 👋</p>
        </div>
      )}

      {/* Streak Display */}
      <div className={styles.streakContainer}>
        <div className={styles.streakCard}>
          <div className={styles.streakHeader}>
            <span className={styles.fireIcon}>🔥</span>
            <h2 className={styles.streakTitle}>Current Streak</h2>
          </div>
          {loading ? (
            <p className={styles.streakLoading}>Loading...</p>
          ) : (
            <div className={styles.streakContent}>
              <p className={styles.streakValue}>{streak.currentStreak || 0}</p>
              <p className={styles.streakLabel}>days</p>
            </div>
          )}
        </div>

        <div className={styles.streakCard}>
          <div className={styles.streakHeader}>
            <span className={styles.starIcon}>⭐</span>
            <h2 className={styles.streakTitle}>Highest Streak</h2>
          </div>
          {loading ? (
            <p className={styles.streakLoading}>Loading...</p>
          ) : (
            <div className={styles.streakContent}>
              <p className={styles.streakValue}>{streak.highestStreak || 0}</p>
              <p className={styles.streakLabel}>days</p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className={styles.errorMessage} role="alert">
          ⚠️ {error}
        </p>
      )}

      <div className={styles.buttonGroup}>
        <Link to="/study" className={`${styles.button} ${styles.primary}`}>
          <span className={styles.buttonIcon}>▶</span> Start Studying
        </Link>
        <Link to="/reports" className={`${styles.button} ${styles.secondary}`}>
          <span className={styles.buttonIcon}>📊</span> View Reports
        </Link>
      </div>

      <div className={styles.encouragement}>
        <p>
          Keep studying consistently to build your streak and achieve your goals! 🚀
        </p>
      </div>

      {/* Floating particles effect */}
      <div className={styles.particles}>
        <div className={styles.particle}></div>
        <div className={styles.particle}></div>
        <div className={styles.particle}></div>
        <div className={styles.particle}></div>
        <div className={styles.particle}></div>
      </div>
    </div>
  );
};

export default HomePage;
