import React, { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { MapPin, Ruler, Trash2 } from 'lucide-react';
import { fetchRegisteredBins } from '../services/api';
import 'leaflet/dist/leaflet.css';

const createBinIcon = () => L.divIcon({
  html: `
    <div style="
      background-color: #3A6EA5;
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

const MapView = () => {
  const [bins, setBins] = useState([]);
  const [selectedBin, setSelectedBin] = useState(null);
  const [error, setError] = useState('');
  const binIcon = useMemo(() => createBinIcon(), []);

  useEffect(() => {
    const loadBins = async () => {
      try {
        setError('');
        setBins(await fetchRegisteredBins());
      } catch (err) {
        setError(err.message);
      }
    };

    loadBins();
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

  const BinPopup = ({ bin }) => (
    <div className="p-3 min-w-[220px]">
      <div className="flex items-center space-x-2 mb-3">
        <Trash2 className="w-4 h-4 text-steel-blue" />
        <h4 className="font-semibold text-dark-blue">{bin.device_id}</h4>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-grey mt-0.5" />
          <span className="text-dark-blue">{bin.address}</span>
        </div>
        <div className="flex items-center gap-2">
          <Ruler className="w-4 h-4 text-grey" />
          <span className="text-dark-blue">{bin.height} cm</span>
        </div>
        <div className="text-xs text-grey">
          {bin.latitude}, {bin.longitude}
        </div>
      </div>
    </div>
  );

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
                icon={binIcon}
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
        <MetricCard label="Registered Bins" value={bins.length} />
        <MetricCard label="Average Height" value={`${bins.length ? Math.round(bins.reduce((sum, bin) => sum + bin.height, 0) / bins.length) : 0} cm`} />
        <MetricCard label="Mapped Locations" value={bins.filter((bin) => bin.latitude && bin.longitude).length} />
      </div>
    </div>
  );
};

const MetricCard = ({ label, value }) => (
  <div className="bg-white rounded-lg shadow-card p-4">
    <p className="text-sm text-grey">{label}</p>
    <p className="text-2xl font-bold text-dark-blue mt-1">{value}</p>
  </div>
);

export default MapView;
