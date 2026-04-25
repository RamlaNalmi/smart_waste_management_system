const express = require('express');
const mongoose = require('mongoose');
const { buildConditionAlerts } = require('../utils/binHelpers');
const { getSensorCollection } = require('../utils/sensorCollection');

const router = express.Router();

router.get('/', async (req, res) => {
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
      { $replaceRoot: { newRoot: '$latest' } }
    ]).toArray();
    const alerts = readings.flatMap(buildConditionAlerts);

    alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:alertId/acknowledge', async (req, res) => {
  res.status(400).json({
    message: 'Alerts are generated from current database sensor fields and clear when the condition is fixed.'
  });
});

router.delete('/:alertId', async (req, res) => {
  res.status(400).json({
    message: 'Alerts are generated from current database sensor fields and cannot be deleted separately.'
  });
});

module.exports = router;
