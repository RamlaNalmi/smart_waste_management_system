import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, Gauge, Wind, ArrowLeft, ArrowRight, MapPin, TrendingUp, Activity } from 'lucide-react';
import { createBinUpdatesSource, fetchBinHistory, fetchBins, fetchFillPrediction, fetchLatestHealthData, fetchBinDetails, getBinLocationFromDetails } from '../services/api';

const HISTORY_RANGES = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Monthly' }
];

const WEEKDAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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

const formatTooltipDate = (timestamp, range) => {
  const date = new Date(String(timestamp).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return String(timestamp || '-');

  if (range === 'day') {
    return date.toLocaleString([], {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return date.toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const extractDateKey = (value) => {
  if (!value) return '';
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
};

const parseDateKey = (dateKey) => {
  const match = String(dateKey || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0, 0);
};

const toLocalTimestamp = (dateValue, hour = 12) => {
  const date = dateValue instanceof Date ? new Date(dateValue) : new Date(String(dateValue).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T${String(hour).padStart(2, '0')}:00:00`;
};

const getChartLabel = (dateValue, range) => {
  if (range === 'day') {
    const date = dateValue instanceof Date ? dateValue : new Date(String(dateValue).replace(' ', 'T'));
    if (Number.isNaN(date.getTime())) return '-';
    return getHourLabel(date.getHours());
  }

  const dateKey = extractDateKey(dateValue);
  const date = dateValue instanceof Date
    ? dateValue
    : (parseDateKey(dateKey) || new Date(String(dateValue).replace(' ', 'T')));
  if (Number.isNaN(date.getTime())) return '-';

  if (range === 'week') {
    return date.toLocaleDateString([], { weekday: 'long' });
  }

  if (range === 'month') {
    return getOrdinalDay(date.getDate());
  }

  return formatTimeLabel(date);
};

const getChartGroupKey = (reading, range) => {
  const dateKey = extractDateKey(reading.timestamp || reading.received_at);
  if (range !== 'day' && dateKey) return dateKey;

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

const getBucketTimestamp = (key, range, fallbackDate) => {
  if (range === 'day') {
    return fallbackDate.toISOString();
  }

  const parsed = parseDateKey(key);
  if (parsed) return parsed.toISOString();
  return fallbackDate.toISOString();
};

const groupHistoryForChart = (readings, range) => {
  const groups = new Map();

  readings.forEach((reading) => {
    const date = getReadingDate(reading);
    const key = getChartGroupKey(reading, range);
    const current = groups.get(key) || {
      groupKey: key,
      label: getChartLabel(date, range),
      timestamp: getBucketTimestamp(key, range, date),
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
      bucketKey: group.groupKey,
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

const getLagFeatures = (values) => {
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
  return 0;
};

const getDayStartDate = (selectedDate, fallbackTimestamp) => {
  if (selectedDate) {
    const parsed = new Date(`${selectedDate}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  if (fallbackTimestamp) {
    const fallback = new Date(String(fallbackTimestamp).replace(' ', 'T'));
    if (!Number.isNaN(fallback.getTime())) {
      fallback.setHours(0, 0, 0, 0);
      return fallback;
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const getMonthStartDate = (selectedDate, fallbackTimestamp) => {
  if (selectedDate) {
    const parsed = new Date(`${selectedDate}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      parsed.setDate(1);
      parsed.setHours(0, 0, 0, 0);
      return parsed;
    }
  }

  if (fallbackTimestamp) {
    const fallback = new Date(String(fallbackTimestamp).replace(' ', 'T'));
    if (!Number.isNaN(fallback.getTime())) {
      fallback.setDate(1);
      fallback.setHours(0, 0, 0, 0);
      return fallback;
    }
  }

  const today = new Date();
  today.setDate(1);
  today.setHours(0, 0, 0, 0);
  return today;
};

const getWeekStartDate = (selectedDate, fallbackTimestamp) => {
  const parseCandidate = (value) => {
    if (!value) return null;
    const parsed = new Date(String(value).replace(' ', 'T'));
    if (Number.isNaN(parsed.getTime())) return null;
    parsed.setHours(0, 0, 0, 0);
    return parsed;
  };

  const baseDate = parseCandidate(`${selectedDate || ''}T00:00:00`)
    || parseCandidate(fallbackTimestamp)
    || new Date();
  const mondayOffset = (baseDate.getDay() + 6) % 7;
  baseDate.setDate(baseDate.getDate() - mondayOffset);
  baseDate.setHours(0, 0, 0, 0);
  return baseDate;
};

const getHourBucketKey = (dateValue) => {
  const date = dateValue instanceof Date ? dateValue : new Date(String(dateValue).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return '';

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
    String(date.getHours()).padStart(2, '0')
  ].join('-');
};

const getDayBucketKey = (dateValue) => {
  const date = dateValue instanceof Date ? dateValue : new Date(String(dateValue).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return '';

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
};

const getPredictionTimeFeatures = (timestamp) => {
  const date = new Date(String(timestamp).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) {
    return {
      hour: 0,
      day_of_week: 0,
      day_of_month: 1,
      month: 1
    };
  }

  return {
    hour: date.getHours(),
    day_of_week: (date.getDay() + 6) % 7,
    day_of_month: date.getDate(),
    month: date.getMonth() + 1
  };
};

const Analytics = () => {
  const [bins, setBins] = useState([]);
  const [binDetails, setBinDetails] = useState([]);
  const [history, setHistory] = useState([]);
  const [predictedSeries, setPredictedSeries] = useState([]);
  const [healthData, setHealthData] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [historyRange, setHistoryRange] = useState('day');
  const [selectedDate, setSelectedDate] = useState(getTodayInputValue);
  const [loading, setLoading] = useState(true);
  const [predictionsLoading, setPredictionsLoading] = useState(false);
  const [predictionError, setPredictionError] = useState('');
  const [error, setError] = useState('');
  const [drillDownLevel, setDrillDownLevel] = useState('overview');
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [navigationHistory, setNavigationHistory] = useState([]);
  
  const userChangedDateRef = useRef(false);
  const selectedDeviceRef = useRef('');
  const loadDeviceSeriesRef = useRef(() => {});

  // Helper functions for bin_details data
  const getBinsByDistrictFromDetails = useMemo(() => {
    const districts = {};
    binDetails.forEach(bin => {
      if (bin.location?.district) {
        const districtKey = bin.location.district.toLowerCase().replace(/\s+/g, '-');
        if (!districts[districtKey]) {
          districts[districtKey] = {
            name: bin.location.district,
            areas: new Set()
          };
        }
        if (bin.location?.area) {
          districts[districtKey].areas.add(bin.location.area);
        }
      }
    });
    return districts;
  }, [binDetails]);

  const getBinsByAreaFromDetails = useMemo(() => {
    const areas = {};
    binDetails.forEach(bin => {
      if (bin.location?.area && bin.location?.district) {
        const areaKey = bin.location.area.toLowerCase().replace(/\s+/g, '-');
        if (!areas[areaKey]) {
          areas[areaKey] = {
            name: bin.location.area,
            district: bin.location.district
          };
        }
      }
    });
    return areas;
  }, [binDetails]);

  const loadLatestData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setError('');
      const [latest, healthDataResponse, detailsData] = await Promise.all([
        fetchBins(),
        fetchLatestHealthData().catch(() => []), // Health data is optional
        fetchBinDetails().catch(() => []) // Bin details is optional
      ]);
      setBins(latest);
      setHealthData(healthDataResponse);
      setBinDetails(detailsData);
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

  const createPredictionPayload = useCallback((timestamp, seededFillValues = []) => {
    const lagFeatures = getLagFeatures(seededFillValues);
    return {
      device_id: selectedDevice,
      bin_id: selectedDevice,
      timestamp,
      fill_level: lagFeatures.fill_level,
      fill_percentage: lagFeatures.fill_level,
      lag_1: lagFeatures.lag_1,
      lag_2: lagFeatures.lag_2,
      lag_3: lagFeatures.lag_3,
      rolling_mean_3: lagFeatures.rolling_mean_3,
      fill_diff: lagFeatures.fill_diff,
      ...getPredictionTimeFeatures(timestamp)
    };
  }, [selectedDevice]);

  const loadDeviceSeries = useCallback(async () => {
    if (!selectedDevice) {
      setHistory([]);
      setPredictedSeries([]);
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
      setPredictedSeries([]);
      return;
    }

    let isActive = true;

    const loadPredictions = async () => {
      try {
        setPredictionsLoading(true);
        setPredictionError('');
        const historicalPoints = groupHistoryForChart(history, historyRange);
        if (!historicalPoints.length) {
          if (isActive) setPredictedSeries([]);
          return;
        }

        const predictedPoints = [];
        const seededFillValues = [];

        if (historyRange === 'day') {
          const dayStart = getDayStartDate(selectedDate, historicalPoints[0]?.timestamp);
          const hourlyActuals = new Map();

          historicalPoints.forEach((point) => {
            const bucketKey = getHourBucketKey(point.timestamp);
            if (!bucketKey || !Number.isFinite(point.actualFill)) return;
            hourlyActuals.set(bucketKey, point.actualFill);
          });

          for (let hourIndex = 0; hourIndex < 24; hourIndex += 1) {
            const slotDate = new Date(dayStart);
            slotDate.setHours(hourIndex, 0, 0, 0);
            const slotTimestamp = slotDate.toISOString();

            const predictedReading = await fetchFillPrediction({
              ...createPredictionPayload(slotTimestamp, seededFillValues)
            });

            predictedPoints.push({
              timestamp: slotTimestamp,
              label: getHourLabel(hourIndex),
              fill_percentage: predictedReading.predicted_fill,
              isPrediction: true
            });

            const actualAtHour = hourlyActuals.get(getHourBucketKey(slotDate));
            if (Number.isFinite(actualAtHour)) {
              seededFillValues.push(actualAtHour);
            } else if (Number.isFinite(predictedReading.predicted_fill)) {
              seededFillValues.push(predictedReading.predicted_fill);
            }
          }

          if (isActive) {
            setPredictedSeries(predictedPoints);
          }

          return;
        }

        if (historyRange === 'week') {
          const weekStart = getWeekStartDate(selectedDate, historicalPoints[0]?.timestamp);
          const seededByDate = new Map();

          historicalPoints.forEach((point) => {
            if (!Number.isFinite(point.actualFill)) return;
            const dateKey = point.bucketKey || getDayBucketKey(point.timestamp);
            if (!dateKey) return;
            seededByDate.set(dateKey, point.actualFill);
          });

          for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
            const slotDate = new Date(weekStart);
            slotDate.setDate(slotDate.getDate() + dayIndex);
            const slotTimestamp = toLocalTimestamp(slotDate);
            const predictedReading = await fetchFillPrediction({
              ...createPredictionPayload(slotTimestamp, seededFillValues)
            });

            predictedPoints.push({
              timestamp: slotTimestamp,
              label: WEEKDAY_LABELS[dayIndex],
              fill_percentage: predictedReading.predicted_fill,
              isPrediction: true
            });

            const actualAtDay = seededByDate.get(getDayBucketKey(slotDate));
            if (Number.isFinite(actualAtDay)) {
              seededFillValues.push(actualAtDay);
            } else if (Number.isFinite(predictedReading.predicted_fill)) {
              seededFillValues.push(predictedReading.predicted_fill);
            }
          }

          if (isActive) {
            setPredictedSeries(predictedPoints);
          }

          return;
        }

        if (historyRange === 'month') {
          const monthStart = getMonthStartDate(selectedDate, historicalPoints[0]?.timestamp);
          const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
          const seededByDate = new Map();

          historicalPoints.forEach((point) => {
            if (!Number.isFinite(point.actualFill)) return;
            const dateKey = point.bucketKey || getDayBucketKey(point.timestamp);
            if (!dateKey) return;
            seededByDate.set(dateKey, point.actualFill);
          });

          for (let dayIndex = 0; dayIndex < daysInMonth; dayIndex += 1) {
            const slotDate = new Date(monthStart);
            slotDate.setDate(dayIndex + 1);
            const slotTimestamp = toLocalTimestamp(slotDate);
            const predictedReading = await fetchFillPrediction({
              ...createPredictionPayload(slotTimestamp, seededFillValues)
            });

            predictedPoints.push({
              timestamp: slotTimestamp,
              label: getChartLabel(slotDate, historyRange),
              fill_percentage: predictedReading.predicted_fill,
              isPrediction: true
            });

            const actualAtDay = seededByDate.get(getDayBucketKey(slotDate));
            if (Number.isFinite(actualAtDay)) {
              seededFillValues.push(actualAtDay);
            } else if (Number.isFinite(predictedReading.predicted_fill)) {
              seededFillValues.push(predictedReading.predicted_fill);
            }
          }

          if (isActive) {
            setPredictedSeries(predictedPoints);
          }

          return;
        }

        for (const point of historicalPoints) {
          const predictedReading = await fetchFillPrediction({
            ...createPredictionPayload(point.timestamp, seededFillValues)
          });

          predictedPoints.push({
            timestamp: point.timestamp,
            label: point.label,
            fill_percentage: predictedReading.predicted_fill,
            isPrediction: true
          });

          if (Number.isFinite(point.actualFill)) {
            seededFillValues.push(point.actualFill);
          } else if (Number.isFinite(predictedReading.predicted_fill)) {
            seededFillValues.push(predictedReading.predicted_fill);
          }
        }

        const lastPoint = historicalPoints[historicalPoints.length - 1];
        const steps = getPredictionSteps(historyRange);
        let nextTime = new Date(String(lastPoint.timestamp).replace(' ', 'T'));

        for (let index = 0; index < steps; index += 1) {
          nextTime = getNextTimestamp(nextTime.toISOString(), historyRange);
          const predictedReading = await fetchFillPrediction({
            ...createPredictionPayload(nextTime.toISOString(), seededFillValues)
          });

          const predictedPoint = {
            timestamp: nextTime.toISOString(),
            label: getChartLabel(nextTime, historyRange),
            fill_percentage: predictedReading.predicted_fill,
            isPrediction: true
          };

          predictedPoints.push(predictedPoint);
          if (Number.isFinite(predictedReading.predicted_fill)) {
            seededFillValues.push(predictedReading.predicted_fill);
          }
        }

        if (isActive) {
          setPredictedSeries(predictedPoints);
        }
      } catch (err) {
        if (isActive) {
          setPredictedSeries([]);
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
  }, [createPredictionPayload, history, historyRange, selectedDate, selectedDevice]);

  // Independent drill-down chart data
  const drillDownData = useMemo(() => {
    if (drillDownLevel === 'district') {
      // Show district-level average fill rates
      const binsByDistrict = getBinsByDistrictFromDetails;
      const districtData = [];

      Object.entries(binsByDistrict).forEach(([districtKey, districtInfo]) => {
        const districtBins = bins.filter(bin => {
          const location = getBinLocationFromDetails(bin.device_id, binDetails);
          return location && location.district === districtInfo.name;
        });

        if (districtBins.length > 0) {
          const avgFillRate = districtBins.reduce((sum, bin) => sum + bin.fill_percentage, 0) / districtBins.length;
          districtData.push({
            name: districtInfo.name,
            avgFillRate: Math.round(avgFillRate),
            binCount: districtBins.length,
            districtKey,
            districtData: districtInfo
          });
        }
      });

      return districtData.sort((a, b) => b.avgFillRate - a.avgFillRate);
    } else if (drillDownLevel === 'area' && selectedDistrict) {
      // Show area-level average fill rates for selected district
      const binsByArea = getBinsByAreaFromDetails;
      const areaData = [];

      Object.entries(binsByArea).forEach(([areaKey, areaInfo]) => {
        if (areaInfo.district === selectedDistrict.districtData.name) {
          const areaBins = bins.filter(bin => {
            const location = getBinLocationFromDetails(bin.device_id, binDetails);
            return location && location.area === areaInfo.name;
          });

          if (areaBins.length > 0) {
            const avgFillRate = areaBins.reduce((sum, bin) => sum + bin.fill_percentage, 0) / areaBins.length;
            areaData.push({
              name: areaInfo.name,
              avgFillRate: Math.round(avgFillRate),
              binCount: areaBins.length,
              areaKey,
              areaData: areaInfo
            });
          }
        }
      });

      return areaData.sort((a, b) => b.avgFillRate - a.avgFillRate);
    } else if (drillDownLevel === 'location' && selectedArea) {
      // Show location-level average fill rates for selected area
      const locationData = [];

      binDetails.forEach(bin => {
        if (bin.location?.area === selectedArea.areaData.name) {
          const locationBin = bins.find(binData => binData.device_id === bin.device_id);
          if (locationBin) {
            locationData.push({
              name: bin.location?.name || 'Unknown Location',
              avgFillRate: locationBin.fill_percentage,
              binCount: 1,
              deviceId: bin.device_id,
              locationData: bin
            });
          }
        }
      });

      return locationData.sort((a, b) => b.avgFillRate - a.avgFillRate);
    }
    return [];
  }, [bins, drillDownLevel, selectedDistrict, selectedArea]);

  // Drill-down navigation functions
  const handleDistrictClick = (data) => {
    if (data && data.districtData) {
      setNavigationHistory([...navigationHistory, { level: drillDownLevel, data: selectedDistrict }]);
      setSelectedDistrict(data);
      setSelectedArea(null);
      setDrillDownLevel('area');
    }
  };

  const handleAreaClick = (data) => {
    if (data && data.areaData) {
      setNavigationHistory([...navigationHistory, { level: drillDownLevel, data: selectedDistrict }]);
      setSelectedArea(data);
      setDrillDownLevel('location');
    }
  };

  const handleLocationClick = (data) => {
    // Could navigate to device details if needed
    console.log('Location clicked:', data);
  };

  const handleDrillDownClick = (data) => {
    if (drillDownLevel === 'district') {
      handleDistrictClick(data);
    } else if (drillDownLevel === 'area') {
      handleAreaClick(data);
    } else if (drillDownLevel === 'location') {
      handleLocationClick(data);
    }
  };

  const handleNavigateBack = () => {
    if (navigationHistory.length > 0) {
      const previousState = navigationHistory[navigationHistory.length - 1];
      setNavigationHistory(navigationHistory.slice(0, -1));
      setDrillDownLevel(previousState.level);
      
      if (previousState.level === 'district') {
        setSelectedDistrict(null);
        setSelectedArea(null);
      } else if (previousState.level === 'area') {
        setSelectedDistrict(previousState.data);
        setSelectedArea(null);
      }
    }
  };

  const handleNavigateToTop = () => {
    setNavigationHistory([]);
    setDrillDownLevel('district');
    setSelectedDistrict(null);
    setSelectedArea(null);
  };

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
    const historicalTimestamps = new Set(historicalPoints.map((point) => point.timestamp));
    const predictedByTimestamp = new Map(
      predictedSeries.map((prediction) => [prediction.timestamp, prediction.fill_percentage])
    );

    const combinedData = historicalPoints.map((point) => ({
      ...point,
      predictedFill: predictedByTimestamp.has(point.timestamp)
        ? predictedByTimestamp.get(point.timestamp)
        : null
    }));

    predictedSeries.forEach((prediction) => {
      if (historicalTimestamps.has(prediction.timestamp)) {
        return;
      }

      combinedData.push({
        label: prediction.label,
        timestamp: prediction.timestamp,
        bucketKey: getChartGroupKey({ timestamp: prediction.timestamp }, historyRange),
        actualFill: null,
        predictedFill: prediction.fill_percentage,
        weight: null,
        gas: null
      });
    });

    combinedData.sort((first, second) => new Date(first.timestamp) - new Date(second.timestamp));

    if (historyRange === 'day') {
      const dayStart = getDayStartDate(selectedDate, combinedData[0]?.timestamp);
      const hourlyData = new Map();

      combinedData.forEach((point) => {
        const bucketKey = point.bucketKey || getHourBucketKey(point.timestamp);
        if (!bucketKey) return;

        const current = hourlyData.get(bucketKey) || {
          actualFill: null,
          predictedFill: null,
          weight: null,
          gas: null
        };

        if (point.actualFill !== null) current.actualFill = point.actualFill;
        if (point.predictedFill !== null) current.predictedFill = point.predictedFill;
        if (point.weight !== null) current.weight = point.weight;
        if (point.gas !== null) current.gas = point.gas;

        hourlyData.set(bucketKey, current);
      });

      return Array.from({ length: 24 }, (_, hourIndex) => {
        const slotDate = new Date(dayStart);
        slotDate.setHours(hourIndex, 0, 0, 0);
        const bucketKey = getHourBucketKey(slotDate);
        const value = hourlyData.get(bucketKey) || {};

        return {
          label: getHourLabel(hourIndex),
          timestamp: slotDate.toISOString(),
          actualFill: value.actualFill ?? null,
          predictedFill: value.predictedFill ?? null,
          weight: value.weight ?? null,
          gas: value.gas ?? null
        };
      });
    }

    if (historyRange === 'month') {
      const monthStart = getMonthStartDate(selectedDate);
      const month = monthStart.getMonth();
      const year = monthStart.getFullYear();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const dailyData = new Map();

      combinedData.forEach((point) => {
        const bucketKey = point.bucketKey || getDayBucketKey(point.timestamp);
        if (!bucketKey) return;

        const current = dailyData.get(bucketKey) || {
          actualFill: null,
          predictedFill: null,
          weight: null,
          gas: null
        };

        if (point.actualFill !== null) current.actualFill = point.actualFill;
        if (point.predictedFill !== null) current.predictedFill = point.predictedFill;
        if (point.weight !== null) current.weight = point.weight;
        if (point.gas !== null) current.gas = point.gas;

        dailyData.set(bucketKey, current);
      });

      return Array.from({ length: daysInMonth }, (_, dayIndex) => {
        const slotDate = new Date(monthStart);
        slotDate.setDate(dayIndex + 1);
        const bucketKey = getDayBucketKey(slotDate);
        const value = dailyData.get(bucketKey) || {};

        return {
          label: getChartLabel(slotDate, historyRange),
          timestamp: toLocalTimestamp(slotDate),
          actualFill: value.actualFill ?? null,
          predictedFill: value.predictedFill ?? null,
          weight: value.weight ?? null,
          gas: value.gas ?? null
        };
      });
    }

    if (historyRange === 'week') {
      const weekStart = getWeekStartDate(selectedDate, combinedData[0]?.timestamp);
      const weekStartMs = weekStart.getTime();
      const oneDayMs = 24 * 60 * 60 * 1000;
      const weeklyData = Array.from({ length: 7 }, () => ({
        actualFill: null,
        predictedFill: null,
        weight: null,
        gas: null
      }));

      combinedData.forEach((point) => {
        const bucketKey = point.bucketKey || getDayBucketKey(point.timestamp);
        const pointDate = parseDateKey(bucketKey) || new Date(String(point.timestamp).replace(' ', 'T'));
        if (Number.isNaN(pointDate.getTime())) return;

        pointDate.setHours(0, 0, 0, 0);
        const dayIndex = Math.round((pointDate.getTime() - weekStartMs) / oneDayMs);
        if (dayIndex < 0 || dayIndex > 6) return;

        const current = weeklyData[dayIndex];
        if (point.actualFill !== null) current.actualFill = point.actualFill;
        if (point.predictedFill !== null) current.predictedFill = point.predictedFill;
        if (point.weight !== null) current.weight = point.weight;
        if (point.gas !== null) current.gas = point.gas;
      });

      return Array.from({ length: 7 }, (_, dayIndex) => {
        const slotDate = new Date(weekStart);
        slotDate.setDate(slotDate.getDate() + dayIndex);
        const value = weeklyData[dayIndex];

        return {
          label: WEEKDAY_LABELS[dayIndex],
          timestamp: toLocalTimestamp(slotDate),
          actualFill: value.actualFill,
          predictedFill: value.predictedFill,
          weight: value.weight,
          gas: value.gas
        };
      });
    }

    return combinedData;
  }, [history, historyRange, predictedSeries, selectedDate]);

  const trendChartMinWidth = useMemo(() => {
    if (historyRange === 'day') return 1440;
    if (historyRange === 'week') return 860;
    return Math.max(820, trendData.length * 42);
  }, [historyRange, trendData.length]);

  const xAxisInterval = 0;
  const xAxisDataKey = historyRange === 'week' ? 'label' : 'timestamp';

  const formatXAxisTick = useCallback((timestampValue) => getChartLabel(timestampValue, historyRange), [historyRange]);
  const formatTooltipLabel = useCallback((label, payload) => {
    const timestamp = payload?.[0]?.payload?.timestamp;
    return formatTooltipDate(timestamp || label, historyRange);
  }, [historyRange]);

  const axisProps = {
    interval: xAxisInterval,
    tick: { fontSize: 11, fill: '#7F8C8D' },
    angle: historyRange === 'month' ? -30 : 0,
    textAnchor: historyRange === 'month' ? 'end' : 'middle',
    height: historyRange === 'month' ? 70 : 45
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

      {/* Independent Drill-Down Chart for Average Fill Rate */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-dark-blue flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Average Fill Rate Analytics
            </h3>
            <p className="text-sm text-grey mt-1">
              {drillDownLevel === 'district' && 'Click on any district to explore its areas'}
              {drillDownLevel === 'area' && `Areas in ${selectedDistrict?.districtData.name || 'Selected District'} - Click to explore locations`}
              {drillDownLevel === 'location' && `Locations in ${selectedArea?.areaData.name || 'Selected Area'}`}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleNavigateBack}
              disabled={drillDownLevel === 'district'}
              className="flex items-center gap-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={handleNavigateToTop}
              disabled={drillDownLevel === 'district'}
              className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <MapPin className="w-4 h-4" />
              <span>Districts</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-gray-600">
              {drillDownLevel === 'district' && 'District Level'}
              {drillDownLevel === 'area' && `Area Level in ${selectedDistrict?.districtData.name}`}
              {drillDownLevel === 'location' && `Location Level in ${selectedArea?.areaData.name}`}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            {drillDownData.length} {drillDownLevel === 'district' ? 'districts' : drillDownLevel === 'area' ? 'areas' : 'locations'}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={350}>
          <BarChart 
            data={drillDownData} 
            onClick={(data) => data && data.activePayload && handleDrillDownClick(data.activePayload[0].payload)}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f8f9fa" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              label={{ value: 'Average Fill Rate (%)', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#ffffff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value, name) => [
                `${value}%`, 
                name === 'avgFillRate' ? 'Avg Fill Rate' : name
              ]}
            />
            <Bar 
              dataKey="avgFillRate" 
              name="Average Fill Rate"
              fill={drillDownLevel === 'district' ? '#8b5cf6' : drillDownLevel === 'area' ? '#6366f1' : '#3b82f6'}
              radius={[8, 8, 0, 0]}
              cursor={drillDownLevel !== 'location'}
              maxBarSize={60}
            />
          </BarChart>
        </ResponsiveContainer>
        
        {drillDownLevel !== 'district' && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Tip:</span> Click on any bar to drill down deeper into the hierarchy.
            </p>
          </div>
        )}
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

        <div className="overflow-x-auto">
          <div style={{ minWidth: `${trendChartMinWidth}px` }}>
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey={xAxisDataKey} tickFormatter={historyRange === 'week' ? undefined : formatXAxisTick} {...axisProps} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#7F8C8D' }} />
                <Tooltip labelFormatter={formatTooltipLabel} />
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
        </div>
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
          <div className="overflow-x-auto">
            <div style={{ minWidth: `${trendChartMinWidth}px` }}>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trendData.filter((item) => item.gas !== null || item.weight !== null)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey={xAxisDataKey} tickFormatter={historyRange === 'week' ? undefined : formatXAxisTick} {...axisProps} />
                  <YAxis tick={{ fontSize: 12, fill: '#7F8C8D' }} />
                  <Tooltip labelFormatter={formatTooltipLabel} />
                  <Legend />
                  <Line type="monotone" dataKey="weight" name="Bin Weight (kg)" stroke="#2ECC71" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
                  <Line type="monotone" dataKey="gas" name="Historical Gas" stroke="#F39C12" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
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
