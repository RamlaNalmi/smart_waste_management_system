const express = require('express');
const mongoose = require('mongoose');
const { buildPredictionFeatures, formatPrediction, runPrediction } = require('../services/fillLevelPrediction');
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

router.get('/fill-level/:deviceId/forecast', async (req, res) => {
  try {
    const reading = await getLatestReading(req.params.deviceId);

    if (!reading) {
      return res.status(404).json({ message: 'Reading not found for device_id' });
    }

    const hoursAhead = Math.min(Math.max(Number(req.query.hoursAhead || req.query.hours || 7), 1), 24);
    const forecast = [];
    let currentFillPercentage = Number(req.query.fill_percentage ?? normalizeBinRecord(reading).fill_percentage);
    const startHour = Number(req.query.hour ?? new Date().getHours());

    for (let i = 1; i <= hoursAhead; i += 1) {
      const hour = (startHour + i) % 24;
      const features = buildPredictionFeatures({ fill_percentage: currentFillPercentage, hour }, reading);
      const prediction = await runPrediction(features);
      const formatted = formatPrediction(prediction, reading);

      forecast.push({
        ...formatted,
        step: i,
        hour
      });

      currentFillPercentage = formatted.predictedFillPercentage;
    }

    res.json(forecast);
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
