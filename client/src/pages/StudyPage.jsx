import React, { useState, useContext, useEffect, useCallback } from 'react';
import { SessionContext } from '../context/SessionContext';
import { AuthContext } from '../context/AuthContext';
import Timer from '../components/Timer';
import ChatBot from '../components/ChatBot';
import styles from '../styles/StudyPage.module.css';

const StudyPage = () => {
  const { user } = useContext(AuthContext);
  const {
    startSession,
    endSession,
    sessions,
    fetchSessions,
    activeSession,
    loading,
    error,
    saveReport,
  } = useContext(SessionContext);

  const [form, setForm] = useState({ subject: '', topic: '', plannedTime: 30 });

  const [sessionActive, setSessionActive] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // report UI state
  const [reportText, setReportText] = useState('');
  const [reportSaved, setReportSaved] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');
  const [savingReport, setSavingReport] = useState(false);

  // Fetch sessions once on mount
  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync active session state and prefill report if present
  useEffect(() => {
    if (activeSession) {
      setSessionActive(true);
      setTimerRunning(true);
      // prefer notes from session
      setReportText(activeSession.notes || '');
      setReportSaved(Boolean(activeSession.notes && activeSession.notes.trim() !== ''));
      // reset elapsed when a new active session appears
      setElapsedTime(0);
    } else {
      setSessionActive(false);
      setTimerRunning(false);
      setReportText('');
      setReportSaved(false);
      setElapsedTime(0);
    }
  }, [activeSession]);

  const validateForm = () => {
    if (!form.subject.trim()) {
      setFormError('Subject is required');
      return false;
    }
    if (!form.topic.trim()) {
      setFormError('Topic is required');
      return false;
    }
    if (form.plannedTime < 1 || form.plannedTime > 480) {
      setFormError('Planned time must be between 1 and 480 minutes');
      return false;
    }
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'plannedTime' ? parseInt(value, 10) || 0 : value,
    }));
    setFormError('');
  };

  const handleStartSession = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (!validateForm()) return;

    try {
      await startSession({
        subject: form.subject,
        topic: form.topic,
        plannedDuration: form.plannedTime * 60,
      });
      setSuccessMessage('Study session started! Timer is ready.');
      setElapsedTime(0);
      // fetchSessions will populate activeSession
      await fetchSessions();
    } catch (err) {
      const msg = err.message || 'Failed to start session';
      setFormError(msg);
    }
  };

  const handleTimerUpdate = ({ minutes, seconds, displaySeconds }) => {
    const totalSeconds = minutes * 60 + displaySeconds;
    setElapsedTime(totalSeconds);
  };

  const handleSaveReport = async () => {
    setReportError('');
    setReportSuccess('');
    if (!activeSession) {
      setReportError('No active session to attach the report to.');
      return;
    }
    if (!reportText || reportText.trim() === '') {
      setReportError('Report cannot be empty.');
      return;
    }

    setSavingReport(true);
    try {
      await saveReport(activeSession._id, reportText);
      setReportSaved(true);
      setReportSuccess('Report saved successfully!');
      await fetchSessions();
    } catch (err) {
      const msg = err.message || 'Failed to save report';
      setReportError(msg);
      console.error('Save report failed:', err);
    } finally {
      setSavingReport(false);
    }
  };

  // Manual end (requires saved report)
  const handleEndSession = async () => {
    setFormError('');
    setSuccessMessage('');

    if (!activeSession) {
      setFormError('No active session to end');
      return;
    }

    if (!reportSaved) {
      setFormError('Please save your study report before ending the session.');
      return;
    }

    try {
      await endSession({ sessionId: activeSession._id, elapsedTime });
      setSuccessMessage('Session ended successfully!');
      // reset local UI state
      setSessionActive(false);
      setTimerRunning(false);
      setElapsedTime(0);
      setForm({ subject: '', topic: '', plannedTime: 30 });
      setReportText('');
      setReportSaved(false);
      await fetchSessions();
    } catch (err) {
      const msg = err.message || 'Failed to end session';
      setFormError(msg);
    }
  };

  // Auto end when timer finishes — DO NOT require saved report
  const handleSessionComplete = useCallback(async () => {
    if (!activeSession) return;
    try {
      // if user has typed a report but not saved it, try to save it first
      if (!reportSaved && reportText && reportText.trim() !== '') {
        try {
          await saveReport(activeSession._id, reportText);
          setReportSaved(true);
          setReportSuccess('Report auto-saved.');
        } catch (e) {
          console.warn('Auto-save report failed:', e.message || e);
        }
      }

      await endSession({ sessionId: activeSession._id, elapsedTime });
      setSuccessMessage('Session ended automatically.');
      setSessionActive(false);
      setTimerRunning(false);
      setElapsedTime(0);
      setReportText('');
      setReportSaved(false);
      await fetchSessions();
    } catch (err) {
      console.error('Auto end failed:', err);
      setFormError('Auto-ending session failed. Please try to end session manually.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession, elapsedTime, reportSaved, reportText]);

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <p className={styles.errorMessage}>Please log in to start studying.</p>
        </div>
      </div>
    );
  }

  // compute timer minutes from activeSession if available, otherwise from form
  const timerMinutes = activeSession
    ? Math.ceil((activeSession.plannedDuration || 0) / 60)
    : Math.floor(form.plannedTime);

  return (
    <div className={styles.pageWrapper}>
      {/* Start Session Form */}
      {!sessionActive && (
        <div className={styles.formContainer}>
          <div className={styles.header}>
            <h1 className={styles.title}>📚 Study Session</h1>
            <p className={styles.subtitle}>Track your study progress and stay focused</p>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Start New Session</h2>
            <form onSubmit={handleStartSession} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="e.g., Mathematics, History"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Topic</label>
                <input
                  type="text"
                  name="topic"
                  value={form.topic}
                  onChange={handleChange}
                  placeholder="e.g., Calculus, World War II"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Planned Duration (minutes)</label>
                <div className={styles.timeInputGroup}>
                  <input
                    type="number"
                    name="plannedTime"
                    value={form.plannedTime}
                    onChange={handleChange}
                    min="1"
                    max="480"
                    className={styles.input}
                  />
                  <span className={styles.timeHint}>
                    {form.plannedTime} min = {Math.floor(form.plannedTime / 60)}h {form.plannedTime % 60}m
                  </span>
                </div>
              </div>

              {formError && <div className={styles.errorMessage}>{formError}</div>}
              {successMessage && <div className={styles.successMessage}>{successMessage}</div>}

              <button type="submit" className={styles.startBtn} disabled={loading}>
                {loading ? 'Starting...' : '▶ Start Session'}
              </button>
            </form>
          </div>

          {/* Past Sessions Table */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>📋 Past Sessions</h2>

            {loading && <p className={styles.loadingText}>Loading sessions...</p>}

            {sessions && sessions.length > 0 ? (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Topic</th>
                      <th>Duration</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session) => (
                      <tr key={session._id} className={styles.tableRow}>
                        <td className={styles.tableCell}>{session.subject}</td>
                        <td className={styles.tableCell}>{session.topic}</td>
                        <td className={styles.tableCell}>{Math.floor((session.actualDuration || 0) / 60)}m</td>
                        <td className={styles.tableCell}>{new Date(session.startTime).toLocaleDateString()}</td>
                        <td className={styles.tableCell}>
                          <span
                            className={`${styles.badge} ${
                              session.status === 'completed' ? styles.badgeSuccess : styles.badgeActive
                            }`}
                          >
                            {session.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className={styles.emptyMessage}>No sessions yet. Start studying!</p>
            )}
          </div>
        </div>
      )}

      {/* Active Session Layout */}
      {sessionActive && (
        <div className={styles.sessionContainer}>
          <div className={styles.sessionHeader}>
            <h1 className={styles.sessionTitle}>📚 Active Study Session</h1>
            <div className={styles.sessionDetails}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Subject:</span>
                <span className={styles.detailValue}>{activeSession?.subject}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Topic:</span>
                <span className={styles.detailValue}>{activeSession?.topic}</span>
              </div>
            </div>
          </div>

          <div className={styles.sessionContent}>
            {/* Left: Timer + End + Save Report */}
            <div className={styles.timerSection}>
              <Timer
                initialMinutes={Math.floor(form.plannedTime)}
                initialSeconds={0}
                isRunning={timerRunning}
                onSessionEnd={handleSessionComplete}
                onTimerUpdate={handleTimerUpdate}
              />

              <button onClick={handleEndSession} className={styles.endBtn} disabled={!reportSaved || loading}>
                ⏹ End Session
              </button>

              {successMessage && <div className={styles.successMessage}>{successMessage}</div>}
              {formError && <div className={styles.errorMessage}>{formError}</div>}

              {/* Save Report block below the timer */}
              <div className={styles.card} style={{ marginTop: 20 }}>
                <h3 className={styles.cardTitle}>📄 Paste Your Study Report</h3>

                <textarea
                  value={reportText}
                  onChange={(e) => {
                    setReportText(e.target.value);
                    setReportSaved(false);
                    setReportError('');
                    setReportSuccess('');
                  }}
                  placeholder="Paste the chatbot-generated report here..."
                  className={styles.input}
                  style={{ height: 140, resize: 'vertical' }}
                />

                {reportError && <div className={styles.errorMessage}>{reportError}</div>}
                {reportSuccess && <div className={styles.successMessage}>{reportSuccess}</div>}

                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button
                    onClick={handleSaveReport}
                    className={styles.startBtn}
                    disabled={savingReport || !reportText || reportText.trim() === ''}
                  >
                    {savingReport ? 'Saving...' : 'Save Report'}
                  </button>

                  <button
                    onClick={() => {
                      // quick clear
                      setReportText('');
                      setReportSaved(false);
                      setReportError('');
                      setReportSuccess('');
                    }}
                    className="px-4 py-2 rounded border"
                  >
                    Clear
                  </button>
                </div>

                {!reportSaved && <p style={{ marginTop: 8, color: '#666', fontSize: 13 }}>You must save the report before ending the session.</p>}
                {reportSaved && <p style={{ marginTop: 8, color: '#2d8a2d', fontSize: 13 }}>Report saved. You may end the session.</p>}
              </div>
            </div>

            {/* Right: ChatBot */}
            <div className={styles.chatbotSection}>
              <ChatBot subject={activeSession?.subject} topic={activeSession?.topic} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyPage;
