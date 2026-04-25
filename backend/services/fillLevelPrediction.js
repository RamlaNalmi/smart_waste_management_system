const { spawn } = require('child_process');
const path = require('path');
const { normalizeBinRecord } = require('../utils/binHelpers');

const PYTHON_COMMAND = process.env.ML_PYTHON_COMMAND || 'python';
const PREDICT_SCRIPT = path.join(__dirname, '..', 'ml', 'predict_fill_level.py');

const clampPercentage = (value) => Math.max(0, Math.min(100, value));

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

const buildPredictionFeatures = (input = {}, reading = null) => {
  const normalizedReading = reading ? normalizeBinRecord(reading) : null;
  const fillPercentage = Number(
    input.fill_percentage ??
    input.fillPercentage ??
    input.fillLevel ??
    normalizedReading?.fill_percentage
  );
  const hour = Number(input.hour ?? new Date().getHours());

  if (!Number.isFinite(fillPercentage)) {
    throw new Error('fill_percentage is required when device_id is not provided');
  }

  if (!Number.isFinite(hour) || hour < 0 || hour > 23) {
    throw new Error('hour must be a number from 0 to 23');
  }

  return {
    fill_level: clampPercentage(fillPercentage),
    hour
  };
};

const formatPrediction = (prediction, reading = null) => {
  const normalizedReading = reading ? normalizeBinRecord(reading) : null;
  const predictedFillPercentage = prediction.prediction;

  return {
    device_id: normalizedReading?.device_id || null,
    currentFillPercentage: prediction.features.fill_level,
    predictionHour: prediction.features.hour,
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
  runPrediction
};
