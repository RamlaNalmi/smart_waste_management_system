const express = require('express');
const BinRegistration = require('../models/BinRegistration');

const router = express.Router();

const DEVICE_ID_PREFIX = 'esp32_';

const getDeviceNumber = (deviceId = '') => {
  const match = deviceId.match(/^esp32_(\d+)$/);
  return match ? Number(match[1]) : 0;
};

const generateDeviceId = async () => {
  const registrations = await BinRegistration.find({ device_id: /^esp32_\d+$/ })
    .select('device_id')
    .lean();

  const latestNumber = registrations.reduce(
    (max, registration) => Math.max(max, getDeviceNumber(registration.device_id)),
    0
  );

  return `${DEVICE_ID_PREFIX}${String(latestNumber + 1).padStart(2, '0')}`;
};

router.get('/', async (req, res) => {
  try {
    const registrations = await BinRegistration.find().sort({ device_id: 1 }).lean();
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/next-device-id', async (req, res) => {
  try {
    res.json({ device_id: await generateDeviceId() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { height, location } = req.body;

    if (!height || !location?.address || location.latitude === undefined || location.longitude === undefined) {
      return res.status(400).json({
        message: 'height, location.address, location.latitude, and location.longitude are required'
      });
    }

    const registration = await BinRegistration.create({
      device_id: await generateDeviceId(),
      height: Number(height),
      location: {
        address: location.address,
        latitude: Number(location.latitude),
        longitude: Number(location.longitude)
      }
    });

    res.status(201).json(registration);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const registration = await BinRegistration.findById(req.params.id).lean();

    if (!registration) {
      return res.status(404).json({ message: 'Registered bin not found' });
    }

    res.json(registration);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
