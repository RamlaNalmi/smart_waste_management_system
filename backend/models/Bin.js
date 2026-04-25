const mongoose = require('mongoose');


const binSchema = new mongoose.Schema({
  device_id: { type: String, required: true },

  distance: Number,
  fill_percentage: Number,
  fill_status: {
    type: String,
    enum: ["LOW", "MEDIUM", "HIGH"]
  },

  gas: Number,
  gas_alert: Boolean,

  angleX: Number,
  angleY: Number,
  fall_detected: Boolean,

  timestamp: { type: Date },   // FIXED
  topic: String,

  received_at: {
    type: Date,
    default: Date.now
  }

}, {
  strict: true   // FIXED
});

module.exports = mongoose.model("sensor_data", binSchema);

