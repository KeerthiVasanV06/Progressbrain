import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import styles from '../styles/ReportsPage.module.css';

const ReportsPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState('all');
  const [expandedReport, setExpandedReport] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchReports();
  }, [user, navigate]);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get('/api/reports');
      setReports(res.data.reports || []);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to fetch reports';
      setError(msg);
      console.error('Fetch reports error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (type) => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.post(`/api/reports/generate/${type}`);
      setReports([res.data.report, ...reports]);
      setSelectedType('all');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to generate report';
      setError(msg);
      console.error('Generate report error:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      await API.delete(`/api/reports/${reportId}`);
      setReports(reports.filter(r => r._id !== reportId));
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete report';
      setError(msg);
      console.error('Delete report error:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0h 0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getReportIcon = (type) => {
    const icons = {
      session: '📝',
      weekly: '📊',
      monthly: '📈',
      custom: '⚙️'
    };
    return icons[type] || '📄';
  };

  const filteredReports = selectedType === 'all' 
    ? reports 
    : reports.filter(r => r.reportType === selectedType);


  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <p className={styles.errorMessage}>Please log in to view reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>📊 Study Reports</h1>
          <p className={styles.subtitle}>Review your learning progress and achievements</p>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}


        {/* Filter Tabs */}
        <div className={styles.filterTabs}>
          <button 
            className={`${styles.tab} ${selectedType === 'all' ? styles.activeTab : ''}`}
            onClick={() => setSelectedType('all')}
          >
            All ({reports.length})
          </button>
          <button 
            className={`${styles.tab} ${selectedType === 'session' ? styles.activeTab : ''}`}
            onClick={() => setSelectedType('session')}
          >
            Sessions ({reports.filter(r => r.reportType === 'session').length})
          </button>
          <button 
            className={`${styles.tab} ${selectedType === 'weekly' ? styles.activeTab : ''}`}
            onClick={() => setSelectedType('weekly')}
          >
            Weekly ({reports.filter(r => r.reportType === 'weekly').length})
          </button>
          <button 
            className={`${styles.tab} ${selectedType === 'monthly' ? styles.activeTab : ''}`}
            onClick={() => setSelectedType('monthly')}
          >
            Monthly ({reports.filter(r => r.reportType === 'monthly').length})
          </button>
        </div>

        {/* Reports Grid */}
        {loading && !reports.length ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading your reports...</p>
          </div>
        ) : filteredReports.length > 0 ? (
          <div className={styles.reportsGrid}>
            {filteredReports.map((report) => (
              <div 
                key={report._id} 
                className={`${styles.reportCard} ${expandedReport === report._id ? styles.expanded : ''}`}
              >
                <div className={styles.reportHeader}>
                  <div className={styles.reportTitleSection}>
                    <span className={styles.reportIcon}>{getReportIcon(report.reportType)}</span>
                    <div className={styles.titleGroup}>
                      <h3 className={styles.reportTitle}>
                        {report.reportType === 'session' 
                          ? report.title || 'Session Report'
                          : `${report.reportType.charAt(0).toUpperCase() + report.reportType.slice(1)} Report`
                        }
                      </h3>
                      <span className={`${styles.badge} ${styles[`badge${report.reportType}`]}`}>
                        {report.reportType}
                      </span>
                    </div>
                  </div>
                  <button 
                    className={styles.deleteBtn}
                    onClick={() => deleteReport(report._id)}
                    title="Delete report"
                  >
                    ✕
                  </button>
                </div>

                <div className={styles.reportBody}>
                  <div className={styles.reportDate}>
                    📅 {formatDate(report.createdAt)}
                  </div>

                  {report.reportType === 'session' ? (
                    <div className={styles.sessionContent}>
                      <p className={styles.contentLabel}>Notes:</p>
                      <p className={styles.contentText}>{report.content || 'No notes'}</p>
                    </div>
                  ) : (
                    <div className={styles.statsGrid}>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>Sessions</span>
                        <span className={styles.statValue}>{report.sessionsCompleted || 0}</span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>Study Time</span>
                        <span className={styles.statValue}>{formatTime(report.totalStudyTime)}</span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>Streak</span>
                        <span className={styles.statValue}>{report.streakAtGeneration || 0}🔥</span>
                      </div>
                      {report.startDate && (
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>Period</span>
                          <span className={styles.statValue}>{new Date(report.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(report.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {report.reportType !== 'session' && report.subjectsBreakdown && Object.keys(report.subjectsBreakdown).length > 0 && (
                    <div className={styles.subjectsList}>
                      <p className={styles.contentLabel}>Subject Breakdown:</p>
                      <div className={styles.subjectsGrid}>
                        {Object.entries(report.subjectsBreakdown).map(([subject, time]) => (
                          <div key={subject} className={styles.subjectItem}>
                            <span className={styles.subjectName}>{subject}</span>
                            <span className={styles.subjectTime}>{formatTime(time)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.reportFooter}>
                  <button 
                    className={styles.expandBtn}
                    onClick={() => setExpandedReport(expandedReport === report._id ? null : report._id)}
                  >
                    {expandedReport === report._id ? '▲ Show Less' : '▼ Show More'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyIcon}>📭</p>
            <p className={styles.emptyText}>
              {selectedType === 'all' 
                ? 'No reports yet. Start studying and generate your first report!'
                : `No ${selectedType} reports found.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
