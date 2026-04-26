const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const getDeviceId = (reading) => reading.device_id || '';

const getFillPercentage = (reading) => Math.max(
  0,
  Math.min(100, Math.round(toNumber(reading.fill_percentage)))
);

const getBinWeight = (reading) => {
  const value = reading.bin_weight ?? reading.weight ?? reading.binWeight;
  if (value === undefined || value === null || value === '') return null;
  return toNumber(value, null);
};

const getReceivedAt = (reading) => reading.received_at || reading.timestamp || reading.updatedAt || reading.createdAt || new Date();

const normalizeBinRecord = (reading) => {
  // Support multiple schemas: preferred sensor schema uses `device_id` and `fill_percentage`.
  // Legacy `bins` collection uses `binId` and `fillLevel` (and may include `sensorData` array).
  const record = { ...reading };

  // Device id mapping
  record.device_id = reading.device_id || reading.binId || reading.bin_id || '';

  // Fill percentage mapping: prefer explicit fill_percentage, otherwise map fillLevel or from sensorData
  if (reading.fill_percentage !== undefined && reading.fill_percentage !== null) {
    record.fill_percentage = Math.max(0, Math.min(100, Math.round(toNumber(reading.fill_percentage))));
  } else if (reading.fillLevel !== undefined && reading.fillLevel !== null) {
    record.fill_percentage = Math.max(0, Math.min(100, Math.round(toNumber(reading.fillLevel))));
  } else if (Array.isArray(reading.sensorData) && reading.sensorData.length > 0) {
    // Use latest sensorData entry if present (assume first entry is latest in seed)
    const sd = reading.sensorData[0] || reading.sensorData[reading.sensorData.length - 1];
    record.fill_percentage = sd && sd.fillLevel !== undefined ? Math.max(0, Math.min(100, Math.round(toNumber(sd.fillLevel)))) : 0;
  } else {
    record.fill_percentage = 0;
  }

  // Received at mapping: try sensorData timestamp, lastEmptied, or existing timestamps
  if (reading.received_at) record.received_at = reading.received_at;
  else if (reading.timestamp) record.received_at = reading.timestamp;
  else if (Array.isArray(reading.sensorData) && reading.sensorData.length > 0) record.received_at = reading.sensorData[0].timestamp || new Date();
  else if (reading.lastEmptied) record.received_at = reading.lastEmptied;
  else record.received_at = new Date();

  // Fill status: prefer existing, otherwise derive from fill_percentage
  if (reading.fill_status) record.fill_status = reading.fill_status;
  else {
    const p = record.fill_percentage;
    record.fill_status = p >= 80 ? 'HIGH' : p >= 40 ? 'MEDIUM' : 'LOW';
  }

  record.gas = reading.gas === undefined ? null : toNumber(reading.gas);
  record.bin_weight = getBinWeight(reading);
  record.gas_alert = Boolean(reading.gas_alert);
  record.angleX = reading.angleX === undefined ? null : toNumber(reading.angleX);
  record.angleY = reading.angleY === undefined ? null : toNumber(reading.angleY);
  record.fall_detected = Boolean(reading.fall_detected);

  return record;
};

const getSeverity = (alertType, reading) => {
  if (alertType === 'fall' || alertType === 'gas') return 'critical';
  if (alertType === 'fill' && reading.fill_percentage >= 90) return 'critical';
  if (alertType === 'fill') return 'warning';
  return 'info';
};

const makeDerivedAlert = (reading, alertType, message) => ({
  id: `derived-${reading._id || reading.device_id}-${alertType}`,
  device_id: reading.device_id,
  type: getSeverity(alertType, reading),
  alertType,
  message,
  timestamp: reading.received_at,
  acknowledged: false,
  fill_percentage: reading.fill_percentage,
  bin_weight: reading.bin_weight,
  fill_status: reading.fill_status,
  gas: reading.gas,
  gas_alert: reading.gas_alert,
  angleX: reading.angleX,
  angleY: reading.angleY,
  fall_detected: reading.fall_detected,
  derived: true
});

const buildConditionAlerts = (rawReading) => {
  const reading = normalizeBinRecord(rawReading);
  const alerts = [];

  if (reading.fall_detected) {
    alerts.push(makeDerivedAlert(
      reading,
      'fall',
      `Fall detected for ${reading.device_id}.`
    ));
  }

  if (reading.gas_alert) {
    alerts.push(makeDerivedAlert(
      reading,
      'gas',
      `Gas alert for ${reading.device_id}: gas level is ${reading.gas}.`
    ));
  }

  if (reading.fill_percentage >= 70) {
    alerts.push(makeDerivedAlert(
      reading,
      'fill',
      `${reading.device_id} fill percentage is ${reading.fill_percentage}%.`
    ));
  }

  return alerts;
};

module.exports = {
  buildConditionAlerts,
  normalizeBinRecord
};
