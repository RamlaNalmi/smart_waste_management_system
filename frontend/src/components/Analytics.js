import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, Gauge, Wind } from 'lucide-react';
import { createBinUpdatesSource, fetchBinHistory, fetchBins, fetchFillPrediction } from '../services/api';

const HISTORY_RANGES = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Monthly' }
];

const getTodayInputValue = () => {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60000;
  return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10);
};

const getDateInputValue = (value) => {
  if (!value) return '';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return '';
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
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

const getChartLabel = (dateValue, range) => {
  const date = dateValue instanceof Date ? dateValue : new Date(String(dateValue).replace(' ', 'T'));

  if (range === 'day') {
    return getHourLabel(date.getHours());
  }

  if (range === 'week') {
    return date.toLocaleDateString([], { weekday: 'short', month: 'numeric', day: 'numeric' });
  }

  if (range === 'month') {
    return `${getOrdinalDay(date.getDate())} ${date.toLocaleDateString([], { month: 'short' })}`;
  }

  return formatTimeLabel(date);
};

const getChartGroupKey = (reading, range) => {
  const date = getReadingDate(reading);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  if (range === 'day') {
    return `${year}-${month}-${day}-${String(date.getHours()).padStart(2, '0')}`;
  }

  return `${year}-${month}-${day}`;
};

const averageNullable = (total, count) => (count ? Number((total / count).toFixed(2)) : null);

const groupHistoryForChart = (readings, range) => {
  const groups = new Map();

  readings.forEach((reading) => {
    const date = getReadingDate(reading);
    const key = getChartGroupKey(reading, range);
    const current = groups.get(key) || {
      label: getChartLabel(date, range),
      timestamp: date.toISOString(),
      fillTotal: 0,
      fillCount: 0,
      weightTotal: 0,
      weightCount: 0,
      gasTotal: 0,
      gasCount: 0
    };

    if (Number.isFinite(reading.fill_percentage)) {
      current.fillTotal += reading.fill_percentage;
      current.fillCount += 1;
    }

    if (Number.isFinite(reading.bin_weight)) {
      current.weightTotal += reading.bin_weight;
      current.weightCount += 1;
    }

    if (Number.isFinite(reading.gas)) {
      current.gasTotal += reading.gas;
      current.gasCount += 1;
    }

    groups.set(key, current);
  });

  return Array.from(groups.values())
    .sort((first, second) => new Date(first.timestamp) - new Date(second.timestamp))
    .map((group) => ({
      label: group.label,
      timestamp: group.timestamp,
      actualFill: averageNullable(group.fillTotal, group.fillCount),
      predictedFill: null,
      weight: averageNullable(group.weightTotal, group.weightCount),
      gas: averageNullable(group.gasTotal, group.gasCount)
    }));
};

const getNextTimestamp = (lastTimestamp, view) => {
  const next = new Date(String(lastTimestamp).replace(' ', 'T'));

  if (view === 'day') {
    next.setHours(next.getHours() + 1);
  } else {
    next.setDate(next.getDate() + 1);
  }

  return next;
};

const getLagFeatures = (historyData) => {
  const values = historyData
    .map((item) => item.fill_percentage)
    .filter(Number.isFinite);
  const current = values.at(-1) ?? 50;
  const lag1 = values.at(-2) ?? current;
  const lag2 = values.at(-3) ?? lag1;
  const lag3 = values.at(-4) ?? lag2;
  const rollingMean3 = (lag1 + lag2 + lag3) / 3;

  return {
    fill_level: current,
    lag_1: lag1,
    lag_2: lag2,
    lag_3: lag3,
    rolling_mean_3: rollingMean3,
    fill_diff: current - lag1
  };
};

const getPredictionSteps = (view) => {
  if (view === 'day') return 6;
  if (view === 'week') return 7;
  return 15;
};

const Analytics = () => {
  const [bins, setBins] = useState([]);
  const [history, setHistory] = useState([]);
  const [futurePredictions, setFuturePredictions] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [historyRange, setHistoryRange] = useState('day');
  const [selectedDate, setSelectedDate] = useState(getTodayInputValue);
  const [loading, setLoading] = useState(true);
  const [predictionsLoading, setPredictionsLoading] = useState(false);
  const [predictionError, setPredictionError] = useState('');
  const [error, setError] = useState('');
  const userChangedDateRef = useRef(false);
  const selectedDeviceRef = useRef('');
  const loadDeviceSeriesRef = useRef(() => {});

  const loadLatestData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setError('');
      const latest = await fetchBins();
      setBins(latest);
      setSelectedDevice((current) => current || latest[0]?.device_id || '');
      setSelectedDate((current) => {
        if (userChangedDateRef.current) return current;
        const latestReadingDate = getDateInputValue(latest[0]?.timestamp || latest[0]?.received_at);
        return latestReadingDate || current;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  const loadDeviceSeries = useCallback(async () => {
    if (!selectedDevice) {
      setHistory([]);
      setFuturePredictions([]);
      setPredictionError('');
      return;
    }

    try {
      const historicalReadings = await fetchBinHistory(selectedDevice, { range: historyRange, date: selectedDate, limit: 1000 });
      setHistory(historicalReadings);
    } catch (err) {
      setError(err.message);
    }
  }, [historyRange, selectedDate, selectedDevice]);

  useEffect(() => {
    selectedDeviceRef.current = selectedDevice;
  }, [selectedDevice]);

  useEffect(() => {
    loadDeviceSeriesRef.current = loadDeviceSeries;
  }, [loadDeviceSeries]);

  useEffect(() => {
    loadLatestData(true);
  }, [loadLatestData]);

  useEffect(() => {
    loadDeviceSeries();
  }, [loadDeviceSeries]);

  useEffect(() => {
    const updates = createBinUpdatesSource();

    updates.onmessage = (event) => {
      const change = JSON.parse(event.data || '{}');
      const changedDevice = change.device_id;

      loadLatestData(false);

      if (!changedDevice || changedDevice === selectedDeviceRef.current) {
        loadDeviceSeriesRef.current();
      }
    };

    updates.onerror = () => {
      setError('Live database updates disconnected. Restart the backend if this keeps happening.');
      updates.close();
    };

    return () => updates.close();
  }, [loadLatestData]);

  useEffect(() => {
    if (!history.length || !selectedDevice) {
      setFuturePredictions([]);
      return;
    }

    let isActive = true;

    const loadPredictions = async () => {
      try {
        setPredictionsLoading(true);
        setPredictionError('');
        const lastActual = history[history.length - 1];
        const lastTimestamp = lastActual.timestamp || lastActual.received_at;
        const steps = getPredictionSteps(historyRange);
        const predictionHistory = [...history];
        const predictedPoints = [];
        let nextTime = new Date(String(lastTimestamp).replace(' ', 'T'));

        for (let index = 0; index < steps; index += 1) {
          nextTime = getNextTimestamp(nextTime.toISOString(), historyRange);
          const predictedReading = await fetchFillPrediction({
            device_id: selectedDevice,
            timestamp: nextTime.toISOString(),
            ...getLagFeatures(predictionHistory)
          });

          const predictedPoint = {
            timestamp: nextTime.toISOString(),
            label: getChartLabel(nextTime, historyRange),
            fill_percentage: predictedReading.predicted_fill,
            isPrediction: true
          };

          predictedPoints.push(predictedPoint);
          predictionHistory.push(predictedPoint);
        }

        if (isActive) {
          setFuturePredictions(predictedPoints);
        }
      } catch (err) {
        if (isActive) {
          setFuturePredictions([]);
          setPredictionError(err.message);
        }
      } finally {
        if (isActive) setPredictionsLoading(false);
      }
    };

    loadPredictions();

    return () => {
      isActive = false;
    };
  }, [history, historyRange, selectedDevice]);

  const latestChartData = useMemo(
    () => bins.map((reading) => ({
      device: reading.device_id,
      fill_percentage: reading.fill_percentage,
      bin_weight: reading.bin_weight ?? 0,
      gas: reading.gas ?? 0,
      distance: reading.distance ?? 0
    })),
    [bins]
  );

  const trendData = useMemo(() => {
    const historicalPoints = groupHistoryForChart(history, historyRange);

    return [
      ...historicalPoints,
      ...futurePredictions.map((prediction) => ({
        label: prediction.label,
        timestamp: prediction.timestamp,
        actualFill: null,
        predictedFill: prediction.fill_percentage,
        weight: null,
        gas: null
      }))
    ];
  }, [futurePredictions, history, historyRange]);

  const xAxisInterval = historyRange === 'month'
    ? Math.max(0, Math.ceil(trendData.length / 14) - 1)
    : 0;

  const axisProps = {
    interval: xAxisInterval,
    tick: { fontSize: 11, fill: '#7F8C8D' },
    angle: historyRange === 'day' ? 0 : -30,
    textAnchor: historyRange === 'day' ? 'middle' : 'end',
    height: historyRange === 'day' ? 40 : 70
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
      {predictionError && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Prediction unavailable: {predictionError}
        </div>
      )}
      {loading && <div className="text-sm text-grey">Loading readings from database...</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          label="Average Current Fill"
          value={`${bins.length ? Math.round(bins.reduce((sum, reading) => sum + reading.fill_percentage, 0) / bins.length) : 0}%`}
          icon={<Gauge className="w-5 h-5 text-white" />}
          color="bg-steel-blue"
        />
        <MetricCard
          label="Average Bin Weight"
          value={`${bins.filter((reading) => reading.bin_weight !== null).length ? Number((bins.reduce((sum, reading) => sum + (reading.bin_weight ?? 0), 0) / bins.filter((reading) => reading.bin_weight !== null).length).toFixed(1)) : 0} kg`}
          icon={<Gauge className="w-5 h-5 text-white" />}
          color="bg-healthy"
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
            <h3 className="text-lg font-semibold text-dark-blue">Historical and Predicted Fill Level</h3>
            <p className="text-sm text-grey mt-1">Historical values come from MongoDB. Predicted values use the model and align to the same timestamp groups.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => {
                userChangedDateRef.current = true;
                setSelectedDate(event.target.value);
              }}
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

        {predictionsLoading && (
          <div className="mb-4 text-sm text-grey">
            Loading model predictions for the selected {historyRange === 'month' ? 'month' : historyRange}...
          </div>
        )}

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
            <Line
              type="monotone"
              dataKey="predictedFill"
              name="Predicted Fill %"
              stroke="#2ECC71"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow-card p-6">
        <h3 className="text-lg font-semibold text-dark-blue mb-1">Current Fill, Weight, and Gas</h3>
        <p className="text-sm text-grey mb-6">Latest reading per device_id.</p>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={latestChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="device" tick={{ fontSize: 12, fill: '#7F8C8D' }} />
            <YAxis tick={{ fontSize: 12, fill: '#7F8C8D' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="fill_percentage" name="Current Fill %" fill="#3A6EA5" radius={[8, 8, 0, 0]} />
            <Bar dataKey="bin_weight" name="Bin Weight (kg)" fill="#2ECC71" radius={[8, 8, 0, 0]} />
            <Bar dataKey="gas" name="Current Gas" fill="#F39C12" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-card p-6">
          <h3 className="text-lg font-semibold text-dark-blue mb-1">Historical Weight and Gas for {selectedDevice || '-'}</h3>
          <p className="text-sm text-grey mb-6">Uses MongoDB readings from the selected history window.</p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData.filter((item) => item.gas !== null || item.weight !== null)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis tick={{ fontSize: 12, fill: '#7F8C8D' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="weight" name="Bin Weight (kg)" stroke="#2ECC71" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
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
