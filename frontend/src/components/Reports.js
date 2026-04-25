import React, { useEffect, useMemo, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { fetchAlerts, fetchBins } from '../services/api';

const Reports = () => {
  const [bins, setBins] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadReportData = async () => {
      try {
        setError('');
        const [binData, alertData] = await Promise.all([
          fetchBins(),
          fetchAlerts()
        ]);
        setBins(binData);
        setAlerts(alertData);
      } catch (err) {
        setError(err.message);
      }
    };

    loadReportData();
  }, []);

  const reportStats = useMemo(() => ({
    totalReadings: bins.length,
    averageFill: bins.length ? Math.round(bins.reduce((sum, reading) => sum + reading.fill_percentage, 0) / bins.length) : 0,
    gasAlerts: bins.filter((reading) => reading.gas_alert).length,
    fallDetected: bins.filter((reading) => reading.fall_detected).length,
    conditionAlerts: alerts.length
  }), [alerts, bins]);

  const generateReport = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      sourceFields: [
        '_id',
        'device_id',
        'distance',
        'fill_percentage',
        'fill_status',
        'gas',
        'gas_alert',
        'angleX',
        'angleY',
        'fall_detected',
        'timestamp',
        'topic',
        'received_at'
      ],
      stats: reportStats,
      readings: bins,
      conditionAlerts: alerts
    };

    const content = JSON.stringify(reportData, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `smartbin-database-report-${Date.now()}.json`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-blue">Reports</h1>
        <p className="text-grey mt-1">Generate reports from database fields only</p>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-steel-blue rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-dark-blue">Database JSON Report</h2>
              <p className="text-sm text-grey">Includes only raw sensor readings and derived condition alerts.</p>
            </div>
          </div>
          <button onClick={generateReport} className="flex items-center space-x-2 px-4 py-2 bg-steel-blue text-white rounded-lg hover:bg-civic-blue transition-colors">
            <Download className="w-4 h-4" />
            <span>Generate</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <ReportMetric label="Readings" value={reportStats.totalReadings} />
        <ReportMetric label="Average Fill" value={`${reportStats.averageFill}%`} />
        <ReportMetric label="Gas Alerts" value={reportStats.gasAlerts} />
        <ReportMetric label="Fall Detected" value={reportStats.fallDetected} />
        <ReportMetric label="Condition Alerts" value={reportStats.conditionAlerts} />
      </div>

      <div className="bg-white rounded-lg shadow-card p-6">
        <h2 className="text-lg font-semibold text-dark-blue mb-4">Database Field Coverage</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {['_id', 'device_id', 'distance', 'fill_percentage', 'fill_status', 'gas', 'gas_alert', 'angleX', 'angleY', 'fall_detected', 'timestamp', 'topic', 'received_at'].map((field) => (
            <div key={field} className="rounded-lg bg-light-grey px-3 py-2 font-mono text-sm text-dark-blue">
              {field}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ReportMetric = ({ label, value }) => (
  <div className="bg-white rounded-lg shadow-card p-4">
    <p className="text-sm text-grey">{label}</p>
    <p className="text-2xl font-bold text-dark-blue mt-1">{value}</p>
  </div>
);

export default Reports;
