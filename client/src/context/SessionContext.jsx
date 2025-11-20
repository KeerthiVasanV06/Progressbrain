// SessionContext.jsx
import React, { createContext, useState, useCallback, useEffect } from 'react';
import API from '../utils/api';

export const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
  const [activeSession, setActiveSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/study-sessions');
      setSessions(res.data.sessions || []);

      // Check if there's an active session
      const active = res.data.sessions?.find(s => s.status === 'active');
      if (active) {
        setActiveSession(active);
      } else {
        setActiveSession(null);
      }
      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to fetch sessions';
      setError(errorMsg);
      console.error('Fetch sessions error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const startSession = useCallback(async (data) => {
    setLoading(true);
    try {
      const res = await API.post('/api/study-sessions/start', data);
      setActiveSession(res.data.session);
      setError(null);
      return res.data.session;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to start session';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const endSession = useCallback(async (data) => {
    setLoading(true);
    try {
      const res = await API.patch('/api/study-sessions/end', data);
      setActiveSession(null);
      await fetchSessions();
      setError(null);
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to end session';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [fetchSessions]);

  // NEW: saveReport - patch notes for a session
  const saveReport = useCallback(async (sessionId, notes) => {
    setLoading(true);
    try {
      const res = await API.patch(`/api/study-sessions/${sessionId}/report`, { notes });
      
      // Update activeSession with the returned session data (which includes the saved notes)
      if (res.data.session) {
        setActiveSession(res.data.session);
        // Update the sessions list with the updated session
        setSessions(prevSessions => 
          prevSessions.map(s => s._id === sessionId ? res.data.session : s)
        );
      }
      
      setError(null);
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to save report';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch active session only on first render
  useEffect(() => {
    const initializeSessions = async () => {
      setLoading(true);
      try {
        const res = await API.get('/api/study-sessions');
        setSessions(res.data.sessions || []);
        const active = res.data.sessions?.find(s => s.status === 'active');
        if (active) {
          setActiveSession(active);
        } else {
          setActiveSession(null);
        }
        setError(null);
      } catch (err) {
        const errorMsg = err.response?.data?.message || 'Failed to fetch sessions';
        setError(errorMsg);
        console.error('Fetch sessions error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SessionContext.Provider
      value={{
        activeSession,
        sessions,
        startSession,
        endSession,
        fetchSessions,
        saveReport,      // <-- exported here
        loading,
        error,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};
