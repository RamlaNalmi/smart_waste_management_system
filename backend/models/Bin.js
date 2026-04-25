const mongoose = require('mongoose');

const binSchema = new mongoose.Schema({
  binId: {
    type: String,
    required: true,
    unique: true
  },
  location: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    address: String
  },
  capacity: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  fillLevel: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'offline'],
    default: 'active'
  },
  lastEmptied: {
    type: Date,
    default: Date.now
  },
  sensorData: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    fillLevel: Number,
    temperature: Number,
    humidity: Number
  }],
  alerts: [{
    type: {
      type: String,
      enum: ['full', 'maintenance', 'offline']
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    resolved: {
      type: Boolean,
      default: false
    }
  }]
});

module.exports = mongoose.model('Bin', binSchema);