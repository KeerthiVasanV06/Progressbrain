// SingleReportPage.jsx
import React, { useEffect, useState } from 'react';
import { getReportById } from '../utils/api';
import { useParams } from 'react-router-dom';
import styles from '../styles/SingleReportPage.module.css';

const SingleReportPage = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReport = async () => {
      try {
        const res = await getReportById(id);
        setReport(res.data.report || res.data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load report:', err);
        setLoading(false);
      }
    };
    loadReport();
  }, [id]);

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (!report) return <div className="text-center mt-10">Report not found.</div>;

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4 text-blue-600">Report Details</h2>
      <div className="mb-4">
        <span className="font-semibold">Generated At:</span> {new Date(report.generatedAt).toLocaleString()}
      </div>
      <div className="mb-4">
        <span className="font-semibold">Date Range:</span> {report.dateRange}
      </div>
      <div className="mb-4">
        <span className="font-semibold">Total Study Time:</span> {report.totalStudyTime} min
      </div>
      <div className="mb-4">
        <span className="font-semibold">Sessions Completed:</span> {report.sessionsCompleted}
      </div>
      <div className="mb-4">
        <span className="font-semibold">Streak at Generation:</span> {report.streakAtGeneration}
      </div>
      <div className="mb-4">
        <span className="font-semibold">Subjects Breakdown:</span>
        <ul className="list-disc ml-6">
          {report.subjectsBreakdown && Object.entries(report.subjectsBreakdown).map(([subject, value]) => (
            <li key={subject}>{subject}: {value} min</li>
          ))}
        </ul>
      </div>
      {/* Optional: Pie/bar chart for subjectsBreakdown can be added here */}
    </div>
  );
};

export default SingleReportPage;
