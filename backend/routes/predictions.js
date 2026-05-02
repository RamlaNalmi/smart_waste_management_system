const express = require('express');
const mongoose = require('mongoose');
const { normalizeBinRecord } = require('../utils/binHelpers');
const { getSensorCollection } = require('../utils/sensorCollection');

const router = express.Router();

const toNumberOrNull = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const getStoredPredictedFill = (reading) => (
  toNumberOrNull(reading?.predicted_next_fill ?? reading?.predicted_fill ?? reading?.predictedFill)
);

const getFillStatus = (fillPercentage) => {
  if (fillPercentage >= 80) return 'HIGH';
  if (fillPercentage >= 40) return 'MEDIUM';
  return 'LOW';
};

const getRisk = (fillPercentage) => {
  if (fillPercentage >= 90) return 'critical';
  if (fillPercentage >= 70) return 'high';
  if (fillPercentage >= 40) return 'medium';
  return 'low';
};

const getRecommendedAction = (fillPercentage) => {
  if (fillPercentage >= 90) return 'Collect immediately';
  if (fillPercentage >= 70) return 'Schedule collection soon';
  if (fillPercentage >= 40) return 'Monitor';
  return 'No immediate action';
};

const getSortDateExpression = () => ({
  $ifNull: [
    { $convert: { input: '$received_at', to: 'date', onError: null, onNull: null } },
    { $convert: { input: '$timestamp', to: 'date', onError: null, onNull: null } }
  ]
});

const formatStoredPrediction = (rawReading, fallback = {}) => {
  const reading = normalizeBinRecord(rawReading);
  const predictedFill = getStoredPredictedFill(rawReading);

  return {
    device_id: reading.device_id || fallback.device_id || null,
    currentFillPercentage: reading.fill_percentage,
    predictedFillPercentage: predictedFill,
    predicted_fill: predictedFill,
    predictedFill: predictedFill,
    predicted_fill_status: rawReading.predicted_fill_status || (predictedFill == null ? null : getFillStatus(predictedFill)),
    risk: predictedFill == null ? null : getRisk(predictedFill),
    recommendedAction: predictedFill == null ? 'Prediction not available in database' : getRecommendedAction(predictedFill),
    timestamp: rawReading.timestamp || rawReading.received_at || fallback.timestamp || null,
    received_at: rawReading.received_at || null,
    source: 'database'
  };
};

const getLatestReading = async (deviceId) => {
  if (!deviceId) return null;
  const collection = await getSensorCollection(mongoose.connection);

  return collection.findOne(
    { device_id: deviceId },
    { sort: { received_at: -1, _id: -1 } }
  );
};

const getReadingForPredictionRequest = async (body = {}) => {
  const collection = await getSensorCollection(mongoose.connection);
  const deviceId = body.device_id || body.bin_id || body.deviceId || body.binId;
  const match = deviceId ? { device_id: deviceId } : {};

  if (body.timestamp) {
    const target = new Date(String(body.timestamp).replace(' ', 'T'));

    if (!Number.isNaN(target.getTime())) {
      const nextHour = new Date(target);
      nextHour.setHours(nextHour.getHours() + 1);

      const reading = await collection.aggregate([
        { $match: match },
        { $addFields: { sortDate: getSortDateExpression() } },
        {
          $match: {
            sortDate: {
              $gte: target,
              $lt: nextHour
            }
          }
        },
        { $sort: { sortDate: -1, _id: -1 } },
        { $limit: 1 }
      ]).next();

      if (reading) return reading;
    }
  }

  return collection.findOne(match, { sort: { received_at: -1, _id: -1 } });
};

router.get('/fill-level/:deviceId/forecast', async (req, res) => {
  try {
    const hoursAhead = Math.min(Math.max(Number(req.query.hoursAhead || req.query.hours || 7), 1), 24);
    const collection = await getSensorCollection(mongoose.connection);
    const readings = await collection
      .find({
        device_id: req.params.deviceId,
        $or: [
          { predicted_next_fill: { $exists: true, $ne: null } },
          { predicted_fill: { $exists: true, $ne: null } },
          { predictedFill: { $exists: true, $ne: null } }
        ]
      })
      .sort({ received_at: -1, _id: -1 })
      .limit(hoursAhead)
      .toArray();

    if (!readings.length) {
      const latest = await getLatestReading(req.params.deviceId);
      if (!latest) return res.status(404).json({ message: 'Reading not found for device_id' });
      return res.json([formatStoredPrediction(latest, { device_id: req.params.deviceId })]);
    }

    res.json(readings.reverse().map((reading, index) => ({
      ...formatStoredPrediction(reading, { device_id: req.params.deviceId }),
      step: index + 1,
      hour: toNumberOrNull(reading.hour)
    })));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/fill-level/series', async (req, res) => {
  try {
    const points = Array.isArray(req.body.points) ? req.body.points : [];
    const limitedPoints = points.slice(0, 31);
    const predictions = await Promise.all(
      limitedPoints.map(async (point) => {
        const reading = await getReadingForPredictionRequest(point);
        const formatted = reading
          ? formatStoredPrediction(reading, point)
          : {
              device_id: point.device_id || point.bin_id || null,
              predictedFillPercentage: null,
              predicted_fill: null,
              predictedFill: null,
              predicted_fill_status: null,
              source: 'database'
            };

        return {
          label: point.label,
          ...formatted
        };
      })
    );

    res.json(predictions);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/predict-fill', async (req, res) => {
  try {
    const reading = await getReadingForPredictionRequest(req.body);

    if (!reading) {
      return res.status(404).json({ message: 'Stored prediction not found in database' });
    }

    res.json(formatStoredPrediction(reading, req.body));
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

    res.json(readings.map(formatStoredPrediction));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
