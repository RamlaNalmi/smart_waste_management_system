const API_BASE_URL = 'http://localhost:5000/api';

const getUiStatus = (reading) => {
  if (reading.fall_detected || reading.gas_alert || reading.fill_percentage >= 90) return 'critical';
  if (reading.fill_percentage >= 70 || reading.fill_status === 'MEDIUM') return 'warning';
  return 'normal';
};

export const normalizeBin = (reading) => {
  const fillPercentage = Number(reading.fill_percentage) || 0;
  const gas = reading.gas === undefined || reading.gas === null ? null : Number(reading.gas);

  return {
    ...reading,
    id: reading._id,
    device_id: reading.device_id || '',
    distance: reading.distance ?? null,
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

export const fetchBinHistory = async (deviceId = null, options = {}) => {
  const { limit = 1000, range = 'day', date } = typeof options === 'number' ? { limit: options } : options;
  const params = new URLSearchParams({
    limit: String(limit),
    range
  });
  if (date) params.set('date', date);
  const path = deviceId
    ? `${API_BASE_URL}/bins/history/${encodeURIComponent(deviceId)}?${params.toString()}`
    : `${API_BASE_URL}/bins/history?${params.toString()}`;
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
  const response = await fetch(`${API_BASE_URL}/bin-registrations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bin)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Unable to register bin');
  }

  return normalizeRegisteredBin(await response.json());
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
