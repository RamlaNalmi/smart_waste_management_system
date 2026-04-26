import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Gauge, Scale, Trash2, Wind } from 'lucide-react';
import BinStatusTable from './BinStatusTable';
import RecentAlerts from './RecentAlerts';
import { useAuth } from '../contexts/AuthContext';
import { fetchBins, fetchRegisteredBins } from '../services/api';

const KPICard = ({ title, value, icon: Icon, color, unit = '', onClick, active = false }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full text-left bg-white rounded-lg shadow-card p-6 hover:shadow-lg transition-shadow ${
      onClick ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-steel-blue' : 'cursor-default'
    } ${active ? 'ring-2 ring-steel-blue' : ''}`}
  >
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
  </button>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [bins, setBins] = useState([]);
  const [readingFilter, setReadingFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBins = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setError('');
      const [readings, registrations] = await Promise.all([
        fetchBins(),
        fetchRegisteredBins()
      ]);
      const registrationByDevice = new Map(registrations.map((bin) => [bin.device_id, bin]));

      setBins(readings.map((reading) => ({
        ...reading,
        location: reading.location || registrationByDevice.get(reading.device_id)?.address || ''
      })));
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
    const weightReadings = bins.filter((reading) => reading.bin_weight !== null);

    return {
      highFill: bins.filter((reading) => reading.fill_status === 'HIGH').length,
      mediumFill: bins.filter((reading) => reading.fill_status === 'MEDIUM').length,
      lowFill: bins.filter((reading) => reading.fill_status === 'LOW').length,
      fallDetected: bins.filter((reading) => reading.fall_detected).length,
      gasDetected: bins.filter((reading) => reading.gas_alert).length,
      averageWeight: weightReadings.length
        ? Number((weightReadings.reduce((sum, reading) => sum + reading.bin_weight, 0) / weightReadings.length).toFixed(1))
        : 0
    };
  }, [bins]);

  const filteredBins = useMemo(() => {
    if (readingFilter === 'high') {
      return bins.filter((reading) => reading.fill_status === 'HIGH');
    }

    if (readingFilter === 'medium') {
      return bins.filter((reading) => reading.fill_status === 'MEDIUM');
    }

    if (readingFilter === 'low') {
      return bins.filter((reading) => reading.fill_status === 'LOW');
    }

    if (readingFilter === 'fall') {
      return bins.filter((reading) => reading.fall_detected);
    }

    if (readingFilter === 'gas') {
      return bins.filter((reading) => reading.gas_alert);
    }

    return bins;
  }, [bins, readingFilter]);

  const filterLabels = {
    high: 'Showing bins with high fill level',
    medium: 'Showing bins with medium fill level',
    low: 'Showing bins with low fill level',
    fall: 'Showing bins with fall detected',
    gas: 'Showing bins with gas detected'
  };

  const toggleFilter = (filter) => {
    setReadingFilter((current) => (current === filter ? 'all' : filter));
  };

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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
        <KPICard
          title="Fill Level High"
          value={metrics.highFill}
          icon={Trash2}
          color="bg-critical"
          active={readingFilter === 'high'}
          onClick={() => toggleFilter('high')}
        />
        <KPICard
          title="Fill Level Medium"
          value={metrics.mediumFill}
          icon={Gauge}
          color="bg-warning"
          active={readingFilter === 'medium'}
          onClick={() => toggleFilter('medium')}
        />
        <KPICard
          title="Fill Level Low"
          value={metrics.lowFill}
          icon={Gauge}
          color="bg-healthy"
          active={readingFilter === 'low'}
          onClick={() => toggleFilter('low')}
        />
        <KPICard
          title="Fall Detected"
          value={metrics.fallDetected}
          icon={AlertTriangle}
          color="bg-critical"
          active={readingFilter === 'fall'}
          onClick={() => toggleFilter('fall')}
        />
        <KPICard
          title="Gas Detected"
          value={metrics.gasDetected}
          icon={Wind}
          color="bg-warning"
          active={readingFilter === 'gas'}
          onClick={() => toggleFilter('gas')}
        />
        <KPICard
          title="Average Weight"
          value={metrics.averageWeight}
          unit=" kg"
          icon={Scale}
          color="bg-steel-blue"
        />
      </div>

      <div>
        {readingFilter !== 'all' && (
          <div className="mb-3 flex items-center justify-between rounded-lg border border-red-100 bg-red-50 px-4 py-3">
            <span className="text-sm font-medium text-red-700">
              {filterLabels[readingFilter]}
            </span>
            <button
              type="button"
              onClick={() => setReadingFilter('all')}
              className="text-sm font-medium text-steel-blue hover:text-civic-blue"
            >
              Show all
            </button>
          </div>
        )}
        <BinStatusTable limit={readingFilter === 'all' ? 5 : null} data={filteredBins} />
      </div>

      <div>
        {user?.role !== 'guest' && <RecentAlerts limit={4} />}
      </div>
    </div>
  );
};

export default Dashboard;
