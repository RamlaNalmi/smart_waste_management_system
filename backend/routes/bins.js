const express = require('express');
const Bin = require('../models/Bin');

const router = express.Router();

// Get all bins
router.get('/', async (req, res) => {
  try {
    const bins = await Bin.find();
    res.json(bins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get bin by ID
router.get('/:id', async (req, res) => {
  try {
    const bin = await Bin.findById(req.params.id);
    if (!bin) {
      return res.status(404).json({ message: 'Bin not found' });
    }
    res.json(bin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new bin
router.post('/', async (req, res) => {
  try {
    const bin = new Bin(req.body);
    await bin.save();
    res.status(201).json(bin);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update bin
router.put('/:id', async (req, res) => {
  try {
    const bin = await Bin.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!bin) {
      return res.status(404).json({ message: 'Bin not found' });
    }
    res.json(bin);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete bin
router.delete('/:id', async (req, res) => {
  try {
    const bin = await Bin.findByIdAndDelete(req.params.id);
    if (!bin) {
      return res.status(404).json({ message: 'Bin not found' });
    }
    res.json({ message: 'Bin deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update bin sensor data
router.post('/:id/sensor', async (req, res) => {
  try {
    const { fillLevel, temperature, humidity } = req.body;
    const bin = await Bin.findById(req.params.id);
    if (!bin) {
      return res.status(404).json({ message: 'Bin not found' });
    }

    bin.fillLevel = fillLevel;
    bin.sensorData.push({
      fillLevel,
      temperature,
      humidity
    });

    // Check if bin is full
    if (fillLevel >= 90) {
      bin.alerts.push({
        type: 'full',
        message: `Bin ${bin.binId} is ${fillLevel}% full`
      });
    }

    await bin.save();
    res.json(bin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;