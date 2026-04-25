import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Database, Gauge, Wind } from 'lucide-react';
import BinStatusTable from './BinStatusTable';
import RecentAlerts from './RecentAlerts';
import { useAuth } from '../contexts/AuthContext';
import { fetchBins } from '../services/api';

const KPICard = ({ title, value, icon: Icon, color, unit = '' }) => (
  <div className="bg-white rounded-lg shadow-card p-6 hover:shadow-lg transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-grey font-medium">{title}</p>
        <p className="text-2xl font-bold text-dark-blue mt-1">
          {value}{unit}
        </p>
      </div>
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBins = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setError('');
      setBins(await fetchBins());
    } catch (err) {
      setError(err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadBins(true);
    const refreshTimer = setInterval(() => loadBins(false), 5000);
    return () => clearInterval(refreshTimer);
  }, []);

  const metrics = useMemo(() => {
    const total = bins.length;
    const averageFill = total
      ? Math.round(bins.reduce((sum, reading) => sum + reading.fill_percentage, 0) / total)
      : 0;

    return {
      total,
      averageFill,
      gasAlerts: bins.filter((reading) => reading.gas_alert).length,
      fallDetected: bins.filter((reading) => reading.fall_detected).length,
      normal: bins.filter((reading) => reading.uiStatus === 'normal').length,
      warning: bins.filter((reading) => reading.uiStatus === 'warning').length,
      critical: bins.filter((reading) => reading.uiStatus === 'critical').length
    };
  }, [bins]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-blue">Dashboard Overview</h1>
        <p className="text-grey mt-1">
          {user?.role === 'collector'
            ? 'Assigned access to database sensor readings'
            : 'Live values from MongoDB sensor documents'}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && <div className="text-sm text-grey">Loading database readings...</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Database Readings" value={metrics.total} icon={Database} color="bg-steel-blue" />
        <KPICard title="Average Fill" value={metrics.averageFill} icon={Gauge} color="bg-healthy" unit="%" />
        <KPICard title="Gas Alerts" value={metrics.gasAlerts} icon={Wind} color="bg-warning" />
        <KPICard title="Fall Detected" value={metrics.fallDetected} icon={AlertTriangle} color="bg-critical" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-card p-6">
          <h3 className="text-lg font-semibold text-dark-blue mb-4">Condition Level</h3>
          <div className="space-y-3">
            <StatusRow label="Normal" value={metrics.normal} color="bg-healthy" />
            <StatusRow label="Warning" value={metrics.warning} color="bg-warning" />
            <StatusRow label="Critical" value={metrics.critical} color="bg-critical" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-dark-blue mb-4">Latest Database Fields</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <FieldName name="device_id" />
            <FieldName name="distance" />
            <FieldName name="fill_percentage" />
            <FieldName name="fill_status" />
            <FieldName name="gas" />
            <FieldName name="gas_alert" />
            <FieldName name="fall_detected" />
            <FieldName name="timestamp" />
            <FieldName name="topic" />
            <FieldName name="received_at" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BinStatusTable limit={5} data={bins} />
        {user?.role !== 'guest' && <RecentAlerts limit={5} />}
      </div>
    </div>
  );
};

const StatusRow = ({ label, value, color }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center space-x-2">
      <div className={`w-3 h-3 ${color} rounded-full`} />
      <span className="text-sm text-grey">{label}</span>
    </div>
    <span className="text-sm font-medium text-dark-blue">{value}</span>
  </div>
);

const FieldName = ({ name }) => (
  <div className="rounded-lg bg-light-grey px-3 py-2 font-mono text-dark-blue">
    {name}
  </div>
);

export default Dashboard;
