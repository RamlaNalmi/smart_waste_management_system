const express = require('express');
const mongoose = require('mongoose');
const { buildPredictionFeatures, formatPrediction, runPrediction, runPredictionSeries } = require('../services/fillLevelPrediction');
const { normalizeBinRecord } = require('../utils/binHelpers');
const { getSensorCollection } = require('../utils/sensorCollection');

const router = express.Router();

const getLatestReading = async (deviceId) => {
  if (!deviceId) return null;
  const collection = await getSensorCollection(mongoose.connection);

  return collection.findOne(
    { device_id: deviceId },
    { sort: { received_at: -1, _id: -1 } }
  );
};

const getLags = (history) => {
  if (history.length >= 3) {
    return [
      history[history.length - 1],
      history[history.length - 2],
      history[history.length - 3]
    ];
  }

  if (history.length === 2) {
    return [
      history[history.length - 1],
      history[history.length - 2],
      history[history.length - 2]
    ];
  }

  if (history.length === 1) {
    return [history[0], history[0], history[0]];
  }

  return [50, 50, 50];
};

router.get('/fill-level/:deviceId/forecast', async (req, res) => {
  try {
    const reading = await getLatestReading(req.params.deviceId);

    if (!reading) {
      return res.status(404).json({ message: 'Reading not found for device_id' });
    }

    const hoursAhead = Math.min(Math.max(Number(req.query.hoursAhead || req.query.hours || 7), 1), 24);
    const forecast = [];
    let currentFillPercentage = Number(req.query.fill_percentage ?? normalizeBinRecord(reading).fill_percentage);
    const fillHistory = Number.isFinite(currentFillPercentage) ? [currentFillPercentage] : [];
    const startHour = Number(req.query.hour ?? new Date().getHours());

    for (let i = 1; i <= hoursAhead; i += 1) {
      const hour = (startHour + i) % 24;
      const [lag1, lag2, lag3] = getLags(fillHistory);
      const features = buildPredictionFeatures({
        fill_percentage: currentFillPercentage,
        hour,
        date: req.query.date,
        device_id: req.params.deviceId,
        lag_1: lag1,
        lag_2: lag2,
        lag_3: lag3,
        rolling_mean_3: (lag1 + lag2 + lag3) / 3,
        fill_diff: currentFillPercentage - lag1
      }, reading);
      const prediction = await runPrediction(features);
      const formatted = formatPrediction(prediction, reading);

      forecast.push({
        ...formatted,
        step: i,
        hour
      });

      currentFillPercentage = formatted.predictedFillPercentage;
      fillHistory.push(currentFillPercentage);
    }

    res.json(forecast);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/fill-level/series', async (req, res) => {
  try {
    const points = Array.isArray(req.body.points) ? req.body.points : [];
    const limitedPoints = points.slice(0, 31);
    const featureSeries = limitedPoints.map((point) => (
      buildPredictionFeatures({
        fill_percentage: point.fill_percentage,
        hour: point.hour,
        date: point.date,
        day_of_week: point.day_of_week,
        day_of_month: point.day_of_month,
        month: point.month,
        lag_1: point.lag_1,
        lag_2: point.lag_2,
        lag_3: point.lag_3,
        rolling_mean_3: point.rolling_mean_3,
        fill_diff: point.fill_diff,
        bin_id: point.bin_id,
        device_id: point.device_id
      })
    ));
    const predictionSeries = await runPredictionSeries(featureSeries);
    const predictions = predictionSeries.map((prediction, index) => {
      const point = limitedPoints[index];

      return {
        label: point.label,
        predictedFill: prediction.prediction,
        rawPrediction: prediction.rawPrediction,
        hour: prediction.features.hour,
        day_of_week: prediction.features.day_of_week,
        day_of_month: prediction.features.day_of_month,
        month: prediction.features.month,
        lag_1: prediction.features.lag_1,
        lag_2: prediction.features.lag_2,
        lag_3: prediction.features.lag_3,
        rolling_mean_3: prediction.features.rolling_mean_3,
        fill_diff: prediction.features.fill_diff,
        bin_id: prediction.features.bin_id,
        effective_bin_id: prediction.features.effective_bin_id,
        model: prediction.model
      };
    });

    res.json(predictions);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/predict-fill', async (req, res) => {
  try {
    const prediction = await runPrediction({
      device_id: req.body.device_id,
      bin_id: req.body.bin_id || req.body.device_id,
      timestamp: req.body.timestamp,
      fill_level: req.body.fill_level ?? req.body.fill_percentage,
      lag_1: req.body.lag_1,
      lag_2: req.body.lag_2,
      lag_3: req.body.lag_3,
      rolling_mean_3: req.body.rolling_mean_3,
      fill_diff: req.body.fill_diff
    });

    res.json({
      predicted_fill: prediction.prediction,
      raw_prediction: prediction.rawPrediction,
      features: prediction.features,
      model: prediction.model
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/fill-level', async (req, res) => {
  try {
    const collection = await getSensorCollection(mongoose.connection);
    const readings = await collection.aggregate([
      {
        $match: {
          device_id: { $exists: true, $nin: [null, ''] }
        }
      },
      { $sort: { received_at: -1, _id: -1 } },
      {
        $group: {
          _id: '$device_id',
          latest: { $first: '$$ROOT' }
        }
      },
      { $replaceRoot: { newRoot: '$latest' } },
      { $sort: { device_id: 1 } }
    ]).toArray();

    const predictions = await Promise.all(
      readings.map(async (reading) => {
        const features = buildPredictionFeatures(req.query, reading);
        const prediction = await runPrediction(features);
        return formatPrediction(prediction, reading);
      })
    );

    res.json(predictions);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
