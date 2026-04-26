// Simple seed script for quick testing
const mongoose = require('mongoose');
const Bin = require('./models/Bin');

const bins = [
  {
    device_id: 'BIN-TEST-01',
    distance: 10,
    fill_percentage: 92,
    fill_status: 'HIGH',
    gas: 20,
    gas_alert: false,
    fall_detected: false,
    timestamp: new Date(),
    topic: 'iot/smartbin/data',
    received_at: new Date()
  },
  {
    device_id: 'BIN-TEST-02',
    distance: 15,
    fill_percentage: 45,
    fill_status: 'LOW',
    gas: 18,
    gas_alert: false,
    fall_detected: false,
    timestamp: new Date(),
    topic: 'iot/smartbin/data',
    received_at: new Date()
  }
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartbin');
  await Bin.deleteMany({ device_id: /BIN-TEST/ });
  await Bin.insertMany(bins);
  console.log('Test bins seeded!');
  await mongoose.disconnect();
}

seed();
