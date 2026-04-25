import React, { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, Gauge, Wind } from 'lucide-react';
import { fetchBinHistory, fetchBins } from '../services/api';

const HISTORY_RANGES = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' }
];

const getTodayInputValue = () => {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60000;
  return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10);
};

const formatTimeLabel = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getReadingDate = (reading) => {
  const value = reading.timestamp;
  if (!value) return new Date();
  return new Date(String(value).replace(' ', 'T'));
};

const getOrdinalDay = (day) => {
  if (day > 10 && day < 14) return `${day}th`;
  const lastDigit = day % 10;
  if (lastDigit === 1) return `${day}st`;
  if (lastDigit === 2) return `${day}nd`;
  if (lastDigit === 3) return `${day}rd`;
  return `${day}th`;
};

const getHourLabel = (hour) => {
  const suffix = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour % 12 || 12;
  return `${displayHour} ${suffix}`;
};

const getHistoryLabel = (reading, range) => {
  const date = getReadingDate(reading);

  if (range === 'day') {
    return getHourLabel(date.getHours());
  }

  if (range === 'week') {
    return date.toLocaleDateString([], { weekday: 'long' });
  }

  if (range === 'month') {
    return `${getOrdinalDay(date.getDate())} ${date.toLocaleDateString([], { month: 'long' })}`;
  }

  return formatTimeLabel(date);
};

const getWeekLabels = () => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const getMonthLabels = (anchorDate) => {
  const date = new Date(anchorDate);
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const monthName = date.toLocaleDateString([], { month: 'long' });

  return Array.from({ length: daysInMonth }, (_, index) => `${getOrdinalDay(index + 1)} ${monthName}`);
};

const getHistoryLabels = (range, selectedDate) => {
  if (range === 'day') return Array.from({ length: 24 }, (_, hour) => getHourLabel(hour));

  if (range === 'week') return getWeekLabels();

  if (range === 'month') {
    return getMonthLabels(`${selectedDate}T00:00:00`);
  }

  return [];
};

const groupHistoryByRange = (history, range, selectedDate) => {
  const labels = getHistoryLabels(range, selectedDate);
  const grouped = new Map(labels.map((label) => [
    label,
    {
      label,
      fillTotal: 0,
      gasTotal: 0,
      gasCount: 0,
      count: 0
    }
  ]));

  history.forEach((reading) => {
    const label = getHistoryLabel(reading, range);
    const current = grouped.get(label) || {
      label,
      fillTotal: 0,
      gasTotal: 0,
      gasCount: 0,
      count: 0
    };

    current.fillTotal += reading.fill_percentage;
    current.count += 1;

    if (reading.gas !== null && reading.gas !== undefined) {
      current.gasTotal += reading.gas;
      current.gasCount += 1;
    }

    grouped.set(label, current);
  });

  return Array.from(grouped.values()).map((item) => ({
    label: item.label,
    actualFill: item.count ? Math.round(item.fillTotal / item.count) : null,
    gas: item.gasCount ? Math.round(item.gasTotal / item.gasCount) : null
  }));
};

const Analytics = () => {
  const [bins, setBins] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [historyRange, setHistoryRange] = useState('day');
  const [selectedDate, setSelectedDate] = useState(getTodayInputValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLatestData = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setError('');
      const latest = await fetchBins();
      setBins(latest);
      setSelectedDevice((current) => current || latest[0]?.device_id || '');
    } catch (err) {
      setError(err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadLatestData(true);
    const refreshTimer = setInterval(() => loadLatestData(false), 5000);
    return () => clearInterval(refreshTimer);
  }, []);

  useEffect(() => {
    if (!selectedDevice) {
      setHistory([]);
      return undefined;
    }

    const loadDeviceSeries = async () => {
      try {
        const historicalReadings = await fetchBinHistory(selectedDevice, { range: historyRange, date: selectedDate, limit: 1000 });
        setHistory(historicalReadings);
      } catch (err) {
        setError(err.message);
      }
    };

    loadDeviceSeries();
    const refreshTimer = setInterval(loadDeviceSeries, 5000);
    return () => clearInterval(refreshTimer);
  }, [selectedDevice, historyRange, selectedDate]);

  const latestChartData = useMemo(
    () => bins.map((reading) => ({
      device: reading.device_id,
      fill_percentage: reading.fill_percentage,
      gas: reading.gas ?? 0,
      distance: reading.distance ?? 0
    })),
    [bins]
  );

  const trendData = useMemo(() => {
    return groupHistoryByRange(history, historyRange, selectedDate);
  }, [history, historyRange, selectedDate]);

  const axisProps = {
    interval: 0,
    tick: { fontSize: 12, fill: '#7F8C8D' },
    angle: historyRange === 'month' ? -35 : 0,
    textAnchor: historyRange === 'month' ? 'end' : 'middle',
    height: historyRange === 'month' ? 72 : 40
  };

  const fillStatusData = useMemo(() => {
    const counts = history.reduce((result, reading) => {
      const status = reading.fill_status || 'UNKNOWN';
      result[status] = (result[status] || 0) + 1;
      return result;
    }, {});

    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [history]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-blue">Analytics</h1>
        <p className="text-grey mt-1">Historical MongoDB readings with fill-level predictions from the model</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {loading && <div className="text-sm text-grey">Loading readings from database...</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          label="Average Current Fill"
          value={`${bins.length ? Math.round(bins.reduce((sum, reading) => sum + reading.fill_percentage, 0) / bins.length) : 0}%`}
          icon={<Gauge className="w-5 h-5 text-white" />}
          color="bg-steel-blue"
        />
        <MetricCard
          label="Current Gas Alerts"
          value={bins.filter((reading) => reading.gas_alert).length}
          icon={<Wind className="w-5 h-5 text-white" />}
          color="bg-warning"
        />
        <MetricCard
          label="Current Fall Detected"
          value={bins.filter((reading) => reading.fall_detected).length}
          icon={<AlertTriangle className="w-5 h-5 text-white" />}
          color="bg-critical"
        />
      </div>

      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-dark-blue">Historical Fill Level</h3>
            <p className="text-sm text-grey mt-1">Historical values come from MongoDB and are grouped by the selected date range.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
            />
            <select
              value={historyRange}
              onChange={(event) => setHistoryRange(event.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
            >
              {HISTORY_RANGES.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
            <select
              value={selectedDevice}
              onChange={(event) => setSelectedDevice(event.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
            >
              {bins.map((reading) => (
                <option key={reading.device_id} value={reading.device_id}>
                  {reading.device_id}
                </option>
              ))}
            </select>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" {...axisProps} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#7F8C8D' }} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="actualFill"
              name="Historical Fill %"
              stroke="#3A6EA5"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow-card p-6">
        <h3 className="text-lg font-semibold text-dark-blue mb-1">Current Fill Percentage and Gas</h3>
        <p className="text-sm text-grey mb-6">Latest reading per device_id.</p>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={latestChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="device" tick={{ fontSize: 12, fill: '#7F8C8D' }} />
            <YAxis tick={{ fontSize: 12, fill: '#7F8C8D' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="fill_percentage" name="Current Fill %" fill="#3A6EA5" radius={[8, 8, 0, 0]} />
            <Bar dataKey="gas" name="Current Gas" fill="#F39C12" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-card p-6">
          <h3 className="text-lg font-semibold text-dark-blue mb-1">Historical Gas for {selectedDevice || '-'}</h3>
          <p className="text-sm text-grey mb-6">Uses MongoDB readings from the selected history window.</p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData.filter((item) => item.gas !== null)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis tick={{ fontSize: 12, fill: '#7F8C8D' }} />
              <Tooltip />
              <Line type="monotone" dataKey="gas" name="Historical Gas" stroke="#F39C12" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <h3 className="text-lg font-semibold text-dark-blue mb-1">Historical Fill Status for {selectedDevice || '-'}</h3>
          <p className="text-sm text-grey mb-6">Counts statuses from the selected device and history window.</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={fillStatusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="status" tick={{ fontSize: 12, fill: '#7F8C8D' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#7F8C8D' }} />
              <Tooltip />
              <Bar dataKey="count" name="Readings" fill="#3A6EA5" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, icon, color }) => (
  <div className="bg-white rounded-lg shadow-card p-5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-grey">{label}</p>
        <p className="text-2xl font-bold text-dark-blue mt-1">{value}</p>
      </div>
      <div className={`w-11 h-11 ${color} rounded-lg flex items-center justify-center`}>
        {icon}
      </div>
    </div>
  </div>
);

export default Analytics;
