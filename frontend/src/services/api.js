const API_BASE_URL = 'http://localhost:5000/api';

const getUiStatus = (reading) => {
  if (reading.fall_detected || reading.gas_alert || reading.fill_percentage >= 90) return 'critical';
  if (reading.fill_percentage >= 70 || reading.fill_status === 'MEDIUM') return 'warning';
  return 'normal';
};

export const normalizeBin = (reading) => {
  const fillPercentage = Number(reading.fill_percentage) || 0;
  const gas = reading.gas === undefined || reading.gas === null ? null : Number(reading.gas);
  const binWeight = reading.bin_weight === undefined || reading.bin_weight === null ? null : Number(reading.bin_weight);
  const fillDistance = reading.fill_distance === undefined || reading.fill_distance === null ? null : Number(reading.fill_distance);

  return {
    ...reading,
    id: reading._id,
    device_id: reading.device_id || '',
    event: reading.event || '',
    usage_count: reading.usage_count === undefined || reading.usage_count === null ? null : Number(reading.usage_count),
    fill_distance: fillDistance,
    odor_status: reading.odor_status || 'UNKNOWN',
    location: reading.location?.address || reading.location || reading.address || '',
    distance: reading.distance ?? null,
    bin_weight: Number.isFinite(binWeight) ? binWeight : null,
    fill_percentage: fillPercentage,
    fill_status: reading.fill_status || 'UNKNOWN',
    gas,
    gas_alert: Boolean(reading.gas_alert),
    angleX: reading.angleX === undefined || reading.angleX === null ? null : Number(reading.angleX),
    angleY: reading.angleY === undefined || reading.angleY === null ? null : Number(reading.angleY),
    fall_detected: Boolean(reading.fall_detected),
    timestamp: reading.timestamp || '',
    topic: reading.topic || '',
    received_at: reading.received_at || null,
    uiStatus: getUiStatus({
      ...reading,
      fill_percentage: fillPercentage,
      gas_alert: Boolean(reading.gas_alert),
      fall_detected: Boolean(reading.fall_detected)
    })
  };
};

export const fetchBins = async () => {
  const response = await fetch(`${API_BASE_URL}/bins`);
  if (!response.ok) throw new Error('Unable to load readings from database');
  const bins = await response.json();
  return bins.map(normalizeBin);
};

export const createBinUpdatesSource = () => new EventSource(`${API_BASE_URL}/bins/events`);

export const fetchBinHistory = async (deviceId = null, options = {}) => {
  const { limit = 1000, range = 'day', date } = typeof options === 'number' ? { limit: options } : options;
  const params = new URLSearchParams({
    limit: String(limit),
    view: range
  });
  if (deviceId) params.set('device_id', deviceId);
  if (date) params.set('date', date);
  const path = `${API_BASE_URL}/bin/history?${params.toString()}`;
  const response = await fetch(path);
  if (!response.ok) throw new Error('Unable to load historical readings');
  const bins = await response.json();
  return bins.map(normalizeBin);
};

export const fetchFillForecast = async (deviceId, hoursAhead = 7) => {
  const response = await fetch(`${API_BASE_URL}/predictions/fill-level/${encodeURIComponent(deviceId)}/forecast?hoursAhead=${hoursAhead}`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Unable to load predicted fill data');
  }
  return response.json();
};

export const fetchFillPredictionSeries = async (points) => {
  const response = await fetch(`${API_BASE_URL}/predictions/fill-level/series`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ points })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Unable to load predicted fill data');
  }

  return response.json();
};

export const fetchFillPrediction = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/predict-fill`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Unable to load predicted fill data');
  }

  return response.json();
};

export const normalizeRegisteredBin = (bin) => ({
  ...bin,
  id: bin._id,
  device_id: bin.device_id,
  height: Number(bin.height) || 0,
  address: bin.location?.address || '',
  latitude: Number(bin.location?.latitude) || 0,
  longitude: Number(bin.location?.longitude) || 0,
  coordinates: [Number(bin.location?.latitude) || 0, Number(bin.location?.longitude) || 0]
});

export const fetchRegisteredBins = async () => {
  const response = await fetch(`${API_BASE_URL}/bin-registrations`);
  if (!response.ok) throw new Error('Unable to load registered bins');
  const bins = await response.json();
  return bins.map(normalizeRegisteredBin);
};

export const fetchNextDeviceId = async () => {
  const response = await fetch(`${API_BASE_URL}/bin-registrations/next-device-id`);
  if (!response.ok) throw new Error('Unable to generate device ID');
  return response.json();
};

export const createRegisteredBin = async (bin) => {
  // Debug: Log the data being sent to backend
  console.log('API: Creating registered bin with data:', JSON.stringify(bin, null, 2));
  
  const response = await fetch(`${API_BASE_URL}/bin-registrations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bin)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('API Error Response:', error);
    throw new Error(error.message || 'Unable to register bin');
  }

  return normalizeRegisteredBin(await response.json());
};

// New API functions for 'bin_details' collection with full flat structure
export const createBinDetail = async (bin) => {
  // Debug: Log the data being sent to backend
  console.log('API: Creating bin detail with full structure:', JSON.stringify(bin, null, 2));
  
  const response = await fetch(`${API_BASE_URL}/bin-details`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bin)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('API Error Response:', error);
    throw new Error(error.message || 'Unable to create bin detail');
  }

  return response.json();
};

export const fetchBinDetails = async () => {
  const response = await fetch(`${API_BASE_URL}/bin-details`);
  if (!response.ok) throw new Error('Unable to load bin details');
  return response.json();
};

export const fetchAlerts = async () => {
  const response = await fetch(`${API_BASE_URL}/alerts`);
  if (!response.ok) throw new Error('Unable to load alerts from database');
  return response.json();
};

export const acknowledgeAlert = async (alertId) => {
  const response = await fetch(`${API_BASE_URL}/alerts/${alertId}/acknowledge`, {
    method: 'PUT'
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Unable to acknowledge alert');
  }
  return response.json();
};

export const deleteAlert = async (alertId) => {
  const response = await fetch(`${API_BASE_URL}/alerts/${alertId}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Unable to delete alert');
  }
  return response.json();
};

export const apiBaseUrl = API_BASE_URL;

// Health data related functions
export const normalizeHealthData = (healthReading) => {
  return {
    ...healthReading,
    id: healthReading._id,
    device_id: healthReading.device_id || '',
    event: healthReading.event || '',
    sensor1_open_close: healthReading.sensor1_open_close || 'UNKNOWN',
    sensor2_fill_level: healthReading.sensor2_fill_level || 'UNKNOWN',
    gas_sensor: healthReading.gas_sensor || 'UNKNOWN',
    mpu6050: healthReading.mpu6050 || 'UNKNOWN',
    bin_status: healthReading.bin_status || 'UNKNOWN',
    wifi_rssi: healthReading.wifi_rssi === undefined || healthReading.wifi_rssi === null ? null : Number(healthReading.wifi_rssi),
    timestamp: healthReading.timestamp || '',
    topic: healthReading.topic || '',
    received_at: healthReading.received_at || null,
    // Overall health status calculation
    healthStatus: getHealthStatus(healthReading),
    // Count of disconnected sensors
    disconnectedSensors: countDisconnectedSensors(healthReading)
  };
};

const getHealthStatus = (healthReading) => {
  const disconnectedCount = countDisconnectedSensors(healthReading);
  if (disconnectedCount >= 3) return 'critical';
  if (disconnectedCount >= 1) return 'warning';
  return 'healthy';
};

const countDisconnectedSensors = (healthReading) => {
  const sensors = [
    healthReading.sensor1_open_close,
    healthReading.sensor2_fill_level, 
    healthReading.gas_sensor,
    healthReading.mpu6050
  ];
  return sensors.filter(sensor => sensor === 'DISCONNECTED').length;
};

export const fetchHealthData = async (deviceId = null) => {
  const params = new URLSearchParams();
  if (deviceId) params.set('device_id', deviceId);
  const path = `${API_BASE_URL}/health?${params.toString()}`;
  const response = await fetch(path);
  if (!response.ok) throw new Error('Unable to load health data');
  const healthData = await response.json();
  return healthData.map(normalizeHealthData);
};

export const fetchLatestHealthData = async () => {
  const response = await fetch(`${API_BASE_URL}/health/latest`);
  if (!response.ok) throw new Error('Unable to load latest health data');
  const healthData = await response.json();
  return healthData.map(normalizeHealthData);
};

export const createHealthUpdatesSource = () => new EventSource(`${API_BASE_URL}/health/events`);

// Location data functions for bin registration
export const fetchDistricts = async () => {
  const response = await fetch(`${API_BASE_URL}/districts`);
  if (!response.ok) throw new Error('Unable to load districts');
  return response.json();
};

export const fetchAreasByDistrict = async (districtName) => {
  const response = await fetch(`${API_BASE_URL}/districts/${encodeURIComponent(districtName)}/areas`);
  if (!response.ok) throw new Error('Unable to load areas for district');
  return response.json();
};

// Get bin location data from bin_details collection instead of bin_registrations
export const getBinLocationFromDetails = (deviceId, binDetails = []) => {
  const bin = binDetails.find(bin => bin.device_id === deviceId);
  if (!bin) return null;
  
  return {
    device_id: bin.device_id,
    name: bin.location?.name || 'Unknown Location',
    address: bin.location?.address || 'Address not available',
    coordinates: [bin.location?.latitude || 6.9271, bin.location?.longitude || 79.8612],
    description: bin.location?.description || 'No description available',
    district: bin.location?.district || 'Unknown',
    area: bin.location?.area || 'Unknown',
    waste_type: bin.location?.waste_type || 'Mixed Waste',
    max_weight: bin.location?.max_weight_kg || 500,
    current_weight: bin.location?.current_weight_kg || 0
  };
};

// Legacy function for backward compatibility
export const getBinLocationFromRegistration = getBinLocationFromDetails;
