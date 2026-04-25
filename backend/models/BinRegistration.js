const mongoose = require('mongoose');

const binRegistrationSchema = new mongoose.Schema({
  device_id: {
    type: String,
    required: true,
    unique: true
  },
  height: {
    type: Number,
    required: true,
    min: 1
  },
  location: {
    address: {
      type: String,
      required: true,
      trim: true
    },
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    }
  }
}, {
  timestamps: true,
  collection: 'bin_registrations'
});

module.exports = mongoose.model('BinRegistration', binRegistrationSchema);
