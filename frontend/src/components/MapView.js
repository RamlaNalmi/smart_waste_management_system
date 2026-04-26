import React, { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { Gauge, MapPin, Scale, Trash2, Wind } from 'lucide-react';
import { createBinUpdatesSource, fetchBins, fetchRegisteredBins } from '../services/api';
import 'leaflet/dist/leaflet.css';

const FILL_LEVEL_STYLES = {
  low: { label: 'Low', color: '#2ECC71' },
  medium: { label: 'Medium', color: '#F39C12' },
  high: { label: 'High', color: '#E74C3C' },
  unknown: { label: 'Unknown', color: '#7F8C8D' }
};

const getFillLevel = (bin) => {
  const status = String(bin.fill_status || '').toLowerCase();

  if (status === 'high' || bin.fill_percentage >= 70) return 'high';
  if (status === 'medium' || bin.fill_percentage >= 40) return 'medium';
  if (status === 'low' || Number.isFinite(bin.fill_percentage)) return 'low';
  return 'unknown';
};

const createBinIcon = (fillLevel) => {
  const markerColor = FILL_LEVEL_STYLES[fillLevel]?.color || FILL_LEVEL_STYLES.unknown.color;

  return L.divIcon({
  html: `
    <div style="
      background-color: ${markerColor};
      width: 30px;
      height: 30px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        transform: rotate(45deg);
        color: white;
      font-size: 14px;
      font-weight: bold;
    ">B</div>
    </div>
  `,
  className: 'registered-bin-marker',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
  });
};

const MapView = () => {
  const [bins, setBins] = useState([]);
  const [selectedBin, setSelectedBin] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadBins = async () => {
      try {
        setError('');
        const [registeredBins, latestReadings] = await Promise.all([
          fetchRegisteredBins(),
          fetchBins()
        ]);
        const readingsByDevice = new Map(latestReadings.map((reading) => [reading.device_id, reading]));

        setBins(registeredBins.map((bin) => ({
          ...bin,
          ...readingsByDevice.get(bin.device_id),
          id: bin.id,
          device_id: bin.device_id,
          address: bin.address,
          latitude: bin.latitude,
          longitude: bin.longitude,
          coordinates: bin.coordinates
        })));
      } catch (err) {
        setError(err.message);
      }
    };

    loadBins();

    const updates = createBinUpdatesSource();
    updates.onmessage = loadBins;
    updates.onerror = () => updates.close();

    return () => updates.close();
  }, []);

  const center = useMemo(() => {
    if (bins.length === 0) return [6.9271, 79.8612];
    const totals = bins.reduce(
      (result, bin) => ({
        latitude: result.latitude + bin.latitude,
        longitude: result.longitude + bin.longitude
      }),
      { latitude: 0, longitude: 0 }
    );
    return [totals.latitude / bins.length, totals.longitude / bins.length];
  }, [bins]);

  const BinPopup = ({ bin }) => {
    const fillLevel = getFillLevel(bin);
    const fillStyle = FILL_LEVEL_STYLES[fillLevel] || FILL_LEVEL_STYLES.unknown;

    return (
    <div className="p-3 min-w-[220px]">
      <div className="flex items-center space-x-2 mb-3">
        <Trash2 className="w-4 h-4" style={{ color: fillStyle.color }} />
        <h4 className="font-semibold text-dark-blue">{bin.device_id}</h4>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-grey mt-0.5" />
          <span className="text-dark-blue">{bin.address || '-'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-grey" />
          <span className="text-dark-blue">
            {Number.isFinite(bin.fill_percentage) ? `${bin.fill_percentage}%` : '-'} fill
            <span className="ml-2 rounded-full px-2 py-0.5 text-xs text-white" style={{ backgroundColor: fillStyle.color }}>
              {fillStyle.label}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-grey" />
          <span className="text-dark-blue">Gas: {Number.isFinite(bin.gas) ? bin.gas : '-'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-grey" />
          <span className="text-dark-blue">Weight: {Number.isFinite(bin.bin_weight) ? `${bin.bin_weight} kg` : '-'}</span>
        </div>
        <div className="text-xs text-grey">
          {bin.latitude}, {bin.longitude}
        </div>
      </div>
    </div>
    );
  };

  const fillLevelCounts = useMemo(() => bins.reduce((counts, bin) => {
    const level = getFillLevel(bin);
    counts[level] = (counts[level] || 0) + 1;
    return counts;
  }, {}), [bins]);

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-dark-blue">Map View</h1>
        <p className="text-grey mt-1">Registered bins from the bin registration collection</p>
        {error && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      </div>

      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <div style={{ height: '600px', width: '100%' }}>
          <MapContainer
            key={`${center[0]}-${center[1]}-${bins.length}`}
            center={center}
            zoom={bins.length ? 14 : 12}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {bins.map((bin) => (
              <Marker
                key={bin.id}
                position={bin.coordinates}
                icon={createBinIcon(getFillLevel(bin))}
                eventHandlers={{
                  click: () => setSelectedBin(bin)
                }}
              >
                <Popup>
                  <BinPopup bin={bin} />
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {bins.length === 0 && (
        <div className="bg-white rounded-lg shadow-card p-6">
          <p className="text-sm text-grey">No registered bins yet. Add one from Bin Overview to show it on the map.</p>
        </div>
      )}

      {selectedBin && (
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-dark-blue">Selected Registered Bin</h3>
            <button onClick={() => setSelectedBin(null)} className="text-grey hover:text-dark-blue">
              x
            </button>
          </div>
          <BinPopup bin={selectedBin} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard label="Low Fill" value={fillLevelCounts.low || 0} color={FILL_LEVEL_STYLES.low.color} />
        <MetricCard label="Medium Fill" value={fillLevelCounts.medium || 0} color={FILL_LEVEL_STYLES.medium.color} />
        <MetricCard label="High Fill" value={fillLevelCounts.high || 0} color={FILL_LEVEL_STYLES.high.color} />
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, color }) => (
  <div className="bg-white rounded-lg shadow-card p-4">
    <div className="flex items-center gap-2">
      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
      <p className="text-sm text-grey">{label}</p>
    </div>
    <p className="text-2xl font-bold text-dark-blue mt-1">{value}</p>
  </div>
);

export default MapView;
