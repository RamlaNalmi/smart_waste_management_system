const { spawn } = require('child_process');
const path = require('path');
const { normalizeBinRecord } = require('../utils/binHelpers');

const PYTHON_COMMAND = process.env.ML_PYTHON_COMMAND || 'python';
const PREDICT_SCRIPT = path.join(__dirname, '..', 'ml', 'predict_fill_level.py');

const clampPercentage = (value) => Math.max(0, Math.min(100, value));

const toFiniteNumber = (value, fallback = null) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const parsePredictionDate = (value) => {
  if (!value) return new Date();
  const date = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const getMondayBasedDayOfWeek = (date) => (date.getDay() + 6) % 7;

const getRisk = (fillPercentage) => {
  if (fillPercentage >= 90) return 'critical';
  if (fillPercentage >= 80) return 'high';
  if (fillPercentage >= 50) return 'medium';
  return 'low';
};

const getRecommendedAction = (fillPercentage) => {
  if (fillPercentage >= 90) return 'Collect immediately';
  if (fillPercentage >= 80) return 'Schedule collection soon';
  if (fillPercentage >= 50) return 'Monitor';
  return 'No action needed right now';
};

const runPrediction = (features) =>
  new Promise((resolve, reject) => {
    const child = spawn(PYTHON_COMMAND, [PREDICT_SCRIPT], {
      cwd: path.join(__dirname, '..')
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', reject);

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `Prediction script exited with code ${code}`));
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(new Error(`Invalid prediction output: ${stdout}`));
      }
    });

    child.stdin.write(JSON.stringify(features));
    child.stdin.end();
  });

const runPredictionSeries = (featureSeries) => {
  if (!Array.isArray(featureSeries) || featureSeries.length === 0) {
    return Promise.resolve([]);
  }

  return runPrediction({ points: featureSeries });
};

const buildPredictionFeatures = (input = {}, reading = null) => {
  const normalizedReading = reading ? normalizeBinRecord(reading) : null;
  const fillPercentage = Number(
    input.fill_percentage ??
    input.fill_level ??
    input.fillPercentage ??
    input.fillLevel ??
    normalizedReading?.fill_percentage
  );
  const hour = Number(input.hour ?? new Date().getHours());
  const predictionDate = parsePredictionDate(
    input.date ??
    input.predictionDate ??
    input.timestamp ??
    input.received_at ??
    normalizedReading?.timestamp ??
    normalizedReading?.received_at
  );
  const dayOfWeek = Number(input.day_of_week ?? input.dayOfWeek ?? getMondayBasedDayOfWeek(predictionDate));
  const dayOfMonth = Number(input.day_of_month ?? input.dayOfMonth ?? predictionDate.getDate());
  const month = Number(input.month ?? predictionDate.getMonth() + 1);
  const binId = input.bin_id ?? input.binId ?? input.device_id ?? input.deviceId ?? normalizedReading?.device_id ?? null;
  const lag1 = toFiniteNumber(input.lag_1 ?? input.lag1, fillPercentage);
  const lag2 = toFiniteNumber(input.lag_2 ?? input.lag2, lag1);
  const lag3 = toFiniteNumber(input.lag_3 ?? input.lag3, lag2);
  const rollingMean3 = toFiniteNumber(
    input.rolling_mean_3 ?? input.rollingMean3,
    (lag1 + lag2 + lag3) / 3
  );
  const fillDiff = toFiniteNumber(input.fill_diff ?? input.fillDiff, fillPercentage - lag1);

  if (!Number.isFinite(fillPercentage)) {
    throw new Error('fill_percentage is required when device_id is not provided');
  }

  if (!Number.isFinite(hour) || hour < 0 || hour > 23) {
    throw new Error('hour must be a number from 0 to 23');
  }

  if (!Number.isFinite(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    throw new Error('day_of_week must be a number from 0 to 6');
  }

  if (!Number.isFinite(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
    throw new Error('day_of_month must be a number from 1 to 31');
  }

  if (!Number.isFinite(month) || month < 1 || month > 12) {
    throw new Error('month must be a number from 1 to 12');
  }

  return {
    fill_level: clampPercentage(fillPercentage),
    timestamp: predictionDate.toISOString(),
    hour,
    day_of_week: dayOfWeek,
    day_of_month: dayOfMonth,
    month,
    lag_1: clampPercentage(lag1),
    lag_2: clampPercentage(lag2),
    lag_3: clampPercentage(lag3),
    rolling_mean_3: clampPercentage(rollingMean3),
    fill_diff: fillDiff,
    bin_id: binId
  };
};

const formatPrediction = (prediction, reading = null) => {
  const normalizedReading = reading ? normalizeBinRecord(reading) : null;
  const predictedFillPercentage = prediction.prediction;

  return {
    device_id: normalizedReading?.device_id || null,
    currentFillPercentage: prediction.features.fill_level,
    predictionHour: prediction.features.hour,
    predictionDayOfWeek: prediction.features.day_of_week,
    predictionDayOfMonth: prediction.features.day_of_month,
    predictionMonth: prediction.features.month,
    predictionBinId: prediction.features.bin_id,
    predictedFillPercentage,
    rawPrediction: prediction.rawPrediction,
    risk: getRisk(predictedFillPercentage),
    recommendedAction: getRecommendedAction(predictedFillPercentage),
    model: prediction.model
  };
};

const predictFillLevel = async (input = {}, reading = null) => {
  const features = buildPredictionFeatures(input, reading);
  const prediction = await runPrediction(features);
  return formatPrediction(prediction, reading);
};

module.exports = {
  buildPredictionFeatures,
  formatPrediction,
  predictFillLevel,
  runPrediction,
  runPredictionSeries
};
