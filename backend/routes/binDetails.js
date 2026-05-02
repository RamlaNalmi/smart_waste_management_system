const express = require('express');
const BinDetail = require('../models/BinDetail');

const router = express.Router();

const DEVICE_ID_PREFIX = 'esp32_';

const getDeviceNumber = (deviceId = '') => {
  const match = deviceId.match(/^esp32_(\d+)$/);
  return match ? Number(match[1]) : 0;
};

const generateDeviceId = async () => {
  const details = await BinDetail.find({ device_id: /^esp32_\d+$/ })
    .select('device_id')
    .lean();

  const latestNumber = details.reduce(
    (max, detail) => Math.max(max, getDeviceNumber(detail.device_id)),
    0
  );

  return `${DEVICE_ID_PREFIX}${String(latestNumber + 1).padStart(2, '0')}`;
};

// GET all bin details
router.get('/', async (req, res) => {
  try {
    const binDetails = await BinDetail.find().sort({ device_id: 1 }).lean();
    res.json(binDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET next device ID
router.get('/next-device-id', async (req, res) => {
  try {
    res.json({ device_id: await generateDeviceId() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create new bin detail
router.post('/', async (req, res) => {
  try {
    const { device_id, height, location } = req.body;

    // Basic validation
    if (!height || !location?.district || !location?.area || !location?.name || !location?.address) {
      return res.status(400).json({
        message: 'height, location.district, location.area, location.name, and location.address are required'
      });
    }

    // Create bin detail with full structure
    const binDetail = await BinDetail.create({
      device_id: device_id || await generateDeviceId(),
      height: Number(height),
      location: {
        district: location.district,
        area: location.area,
        name: location.name,
        address: location.address,
        latitude: Number(location.latitude),
        longitude: Number(location.longitude),
        waste_type: location.waste_type || 'Organic (Bio-Degradable) Waste',
        max_weight_kg: Number(location.max_weight_kg),
        current_weight_kg: Number(location.current_weight_kg) || 0,
        description: location.description || ''
      }
    });

    res.status(201).json(binDetail);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET bin detail by ID
router.get('/:id', async (req, res) => {
  try {
    const binDetail = await BinDetail.findById(req.params.id).lean();

    if (!binDetail) {
      return res.status(404).json({ message: 'Bin detail not found' });
    }

    res.json(binDetail);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT update bin detail
router.put('/:id', async (req, res) => {
  try {
    const binDetail = await BinDetail.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).lean();

    if (!binDetail) {
      return res.status(404).json({ message: 'Bin detail not found' });
    }

    res.json(binDetail);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE bin detail
router.delete('/:id', async (req, res) => {
  try {
    const binDetail = await BinDetail.findByIdAndDelete(req.params.id);

    if (!binDetail) {
      return res.status(404).json({ message: 'Bin detail not found' });
    }

    res.json({ message: 'Bin detail deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
