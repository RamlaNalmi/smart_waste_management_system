const mongoose = require('mongoose');

const binDetailSchema = new mongoose.Schema({
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
    district: {
      type: String,
      required: true,
      trim: true
    },
    area: {
      type: String,
      required: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
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
    },
    waste_type: {
      type: String,
      required: true,
      enum: ['Organic (Bio-Degradable) Waste', 'Recyclable Waste', 'Non-recyclable Waste']
    },
    max_weight_kg: {
      type: Number,
      required: true,
      min: 1
    },
    current_weight_kg: {
      type: Number,
      default: 0,
      min: 0
    },
    description: {
      type: String,
      trim: true,
      default: ''
    }
  }
}, {
  timestamps: true,
  collection: 'bin_details'
});

module.exports = mongoose.model('BinDetail', binDetailSchema);
