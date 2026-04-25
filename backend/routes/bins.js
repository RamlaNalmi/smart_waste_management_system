const express = require('express');
const mongoose = require('mongoose');
const { normalizeBinRecord } = require('../utils/binHelpers');
const { getSensorCollection, getSensorCollectionDebug } = require('../utils/sensorCollection');

const router = express.Router();

const toSensorTimestampString = (date) => {
  const pad = (value) => String(value).padStart(2, '0');

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join('-') + ' ' + [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join(':');
};

const parseDateParam = (value) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date();
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfDay = (date) => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

const getHistoryRangeBounds = (range, anchorDate = new Date()) => {
  const anchor = new Date(anchorDate);

  if (range === 'day') {
    return {
      since: startOfDay(anchor),
      until: endOfDay(anchor)
    };
  }

  if (range === 'week') {
    const start = startOfDay(anchor);
    const mondayOffset = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - mondayOffset);

    const end = endOfDay(start);
    end.setDate(start.getDate() + 6);

    return { since: start, until: end };
  }

  if (range === 'month') {
    const start = startOfDay(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
    const end = endOfDay(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0));

    return { since: start, until: end };
  }

  return {
    since: startOfDay(anchor),
    until: endOfDay(anchor)
  };
};

const getHistoryDateMatch = (range, anchorDate = new Date()) => {
  const { since, until } = getHistoryRangeBounds(range, anchorDate);

  return {
    timestamp: {
      $gte: toSensorTimestampString(since),
      $lte: toSensorTimestampString(until)
    }
  };
};

const combineMatches = (...matches) => ({
  $and: matches.filter((match) => Object.keys(match).length > 0)
});

router.get('/debug/source', async (req, res) => {
  try {
    res.json(await getSensorCollectionDebug(mongoose.connection));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const collection = await getSensorCollection(mongoose.connection);

    // Aggregation that supports both sensor_data (device_id) and legacy bins (binId)
    const readings = await collection.aggregate([
      {
        $addFields: {
          canonicalId: { $ifNull: ['$device_id', '$binId'] }
        }
      },
      {
        $match: {
          canonicalId: { $exists: true, $nin: [null, ''] }
        }
      },
      { $sort: { received_at: -1, _id: -1 } },
      {
        $group: {
          _id: '$canonicalId',
          latest: { $first: '$$ROOT' }
        }
      },
      { $replaceRoot: { newRoot: '$latest' } },
      { $sort: { canonicalId: 1 } }
    ]).toArray();

    res.json(readings.map(normalizeBinRecord));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/history/:deviceId', async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 1000), 1), 5000);
    const collection = await getSensorCollection(mongoose.connection);
    const deviceId = req.params.deviceId;
    const deviceMatch = {
      $or: [
        { device_id: deviceId },
        { binId: deviceId }
      ]
    };
    const anchorDate = parseDateParam(req.query.date);
    const readings = await collection.find(combineMatches(deviceMatch, getHistoryDateMatch(req.query.range, anchorDate)))
      .sort({ timestamp: -1, _id: -1 })
      .limit(limit)
      .toArray();

    res.json(readings.reverse().map(normalizeBinRecord));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/history', async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 1000), 1), 5000);
    const collection = await getSensorCollection(mongoose.connection);
    const deviceMatch = {
      $or: [
        { device_id: { $exists: true, $nin: [null, ''] } },
        { binId: { $exists: true, $nin: [null, ''] } }
      ]
    };
    const anchorDate = parseDateParam(req.query.date);
    const readings = await collection.find(combineMatches(deviceMatch, getHistoryDateMatch(req.query.range, anchorDate)))
      .sort({ timestamp: -1, _id: -1 })
      .limit(limit)
      .toArray();

    res.json(readings.reverse().map(normalizeBinRecord));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/bin-id/:deviceId', async (req, res) => {
  try {
    const collection = await getSensorCollection(mongoose.connection);
    const reading = await collection.findOne(
      { $or: [{ device_id: req.params.deviceId }, { binId: req.params.deviceId }] },
      { sort: { received_at: -1, _id: -1 } }
    );

    if (!reading) {
      return res.status(404).json({ message: 'Reading not found' });
    }

    res.json(normalizeBinRecord(reading));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const collection = await getSensorCollection(mongoose.connection);
    const reading = await collection.findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
    if (!reading) {
      return res.status(404).json({ message: 'Reading not found' });
    }
    res.json(normalizeBinRecord(reading));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
