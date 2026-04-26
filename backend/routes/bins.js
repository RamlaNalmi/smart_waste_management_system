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

const toIsoTimestampString = (date) => date.toISOString();

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
  const normalizedRange = String(range || 'day').toLowerCase();

  if (normalizedRange === 'day') {
    return {
      since: startOfDay(anchor),
      until: endOfDay(anchor)
    };
  }

  if (normalizedRange === 'week') {
    const start = startOfDay(anchor);
    const mondayOffset = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - mondayOffset);

    const end = endOfDay(start);
    end.setDate(start.getDate() + 6);

    return { since: start, until: end };
  }

  if (normalizedRange === 'month') {
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

  const dateRangeMatches = (field) => ({
    $or: [
      {
        [field]: {
          $gte: since,
          $lte: until
        }
      },
      {
        [field]: {
          $gte: toIsoTimestampString(since),
          $lte: toIsoTimestampString(until)
        }
      },
      {
        [field]: {
          $gte: toSensorTimestampString(since),
          $lte: toSensorTimestampString(until)
        }
      }
    ]
  });

  return {
    $or: [
      dateRangeMatches('timestamp'),
      dateRangeMatches('received_at'),
      dateRangeMatches('createdAt'),
      dateRangeMatches('updatedAt')
    ]
  };
};

const getSortDateExpression = () => ({
  $ifNull: [
    { $convert: { input: '$received_at', to: 'date', onError: null, onNull: null } },
    {
      $ifNull: [
        { $convert: { input: '$timestamp', to: 'date', onError: null, onNull: null } },
        {
          $ifNull: [
            { $convert: { input: '$updatedAt', to: 'date', onError: null, onNull: null } },
            { $convert: { input: '$createdAt', to: 'date', onError: null, onNull: null } }
          ]
        }
      ]
    }
  ]
});

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

router.get('/events', async (req, res) => {
  res.set({
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Content-Type': 'text/event-stream'
  });
  res.flushHeaders?.();
  res.write(': connected\n\n');

  let changeStream;
  const keepAlive = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 30000);

  const close = async () => {
    clearInterval(keepAlive);
    if (changeStream) {
      await changeStream.close().catch(() => {});
    }
    res.end();
  };

  req.on('close', close);

  try {
    const collection = await getSensorCollection(mongoose.connection);
    changeStream = collection.watch([], { fullDocument: 'updateLookup' });

    changeStream.on('change', (change) => {
      const document = change.fullDocument || change.documentKey || {};
      const payload = {
        operationType: change.operationType,
        device_id: document.device_id || document.binId || document.bin_id || null,
        documentId: change.documentKey?._id || document._id || null
      };

      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    });

    changeStream.on('error', (error) => {
      res.write(`event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`);
      close();
    });
  } catch (error) {
    res.write(`event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`);
    close();
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
    const range = req.query.range || req.query.view;
    const readings = await collection.aggregate([
      { $match: combineMatches(deviceMatch, getHistoryDateMatch(range, anchorDate)) },
      { $addFields: { sortDate: getSortDateExpression() } },
      { $sort: { sortDate: -1, _id: -1 } },
      { $limit: limit }
    ]).toArray();

    res.json(readings.reverse().map(normalizeBinRecord));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/history', async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 1000), 1), 5000);
    const collection = await getSensorCollection(mongoose.connection);
    const deviceId = req.query.device_id || req.query.deviceId;
    const deviceMatch = deviceId
      ? { $or: [{ device_id: deviceId }, { binId: deviceId }] }
      : {
          $or: [
            { device_id: { $exists: true, $nin: [null, ''] } },
            { binId: { $exists: true, $nin: [null, ''] } }
          ]
        };
    const anchorDate = parseDateParam(req.query.date);
    const range = req.query.range || req.query.view;
    const readings = await collection.aggregate([
      { $match: combineMatches(deviceMatch, getHistoryDateMatch(range, anchorDate)) },
      { $addFields: { sortDate: getSortDateExpression() } },
      { $sort: { sortDate: -1, _id: -1 } },
      { $limit: limit }
    ]).toArray();

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
