import React, { useCallback, useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';
import { Gauge, MapPin, Navigation, Scale, Trash2, Wind } from 'lucide-react';
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

const isValidCoordinate = (bin) => (
  Array.isArray(bin.coordinates) &&
  bin.coordinates.length === 2 &&
  bin.coordinates.every((value) => Number.isFinite(Number(value)))
);

const getPriorityBand = (bin) => {
  if (bin.fill_percentage >= 90) return 3;
  if (bin.fill_percentage >= 80) return 2;
  if (bin.fill_percentage >= 70) return 1;
  return 0;
};

const getPriorityLabel = (bin) => {
  if (bin.fill_percentage >= 90) return 'Immediate';
  if (bin.fill_percentage >= 80) return 'High';
  return 'Soon';
};

const buildPriorityStops = (bins) => {
  return bins
    .filter((bin) => isValidCoordinate(bin) && bin.fill_percentage >= 70)
    .sort((first, second) => (
      getPriorityBand(second) - getPriorityBand(first) ||
      second.fill_percentage - first.fill_percentage ||
      String(first.device_id).localeCompare(String(second.device_id))
    ))
    .map((bin, index) => ({
      ...bin,
      routeOrder: index + 1,
      priorityLabel: getPriorityLabel(bin),
      routeDistanceFromPrevious: null
    }));
};

const formatOsrmCoordinate = ([latitude, longitude]) => (
  `${Number(longitude).toFixed(6)},${Number(latitude).toFixed(6)}`
);

const getRoadRoute = async (startPoint, stops) => {
  const osrmCoordinates = [startPoint, ...stops.map((bin) => bin.coordinates)]
    .map(formatOsrmCoordinate)
    .join(';');
  const response = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${osrmCoordinates}?overview=full&geometries=geojson&steps=false`
  );

  if (!response.ok) {
    throw new Error('Road route service is not available right now');
  }

  const data = await response.json();
  const route = data.routes?.[0];

  if (!route) {
    throw new Error('Could not calculate a road route for these bins');
  }

  return {
    distanceMeters: route.distance || 0,
    geometry: (route.geometry?.coordinates || []).map(([longitude, latitude]) => [latitude, longitude]),
    legs: route.legs || []
  };
};

const MapView = () => {
  const [bins, setBins] = useState([]);
  const [selectedBin, setSelectedBin] = useState(null);
  const [error, setError] = useState('');
  const [routePlan, setRoutePlan] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');

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

  const routeCandidates = useMemo(() => buildPriorityStops(bins), [bins]);

  const routePositions = useMemo(() => (
    routePlan?.geometry?.length ? routePlan.geometry : []
  ), [routePlan]);

  const optimizedRoute = routePlan?.stops || [];
  const routeDistanceKm = (routePlan?.distanceMeters || 0) / 1000;

  const handleOptimizeRoute = useCallback(async () => {
    try {
      setRouteError('');
      setRoutePlan(null);

      if (!routeCandidates.length) {
        setRouteError('No bins are currently at or above 70% fill, so no collection route is needed.');
        return;
      }

      setRouteLoading(true);
      const roadRoute = await getRoadRoute(center, routeCandidates);
      const stopsWithRoadDistances = routeCandidates.map((bin, index) => ({
        ...bin,
        routeDistanceFromPrevious: (roadRoute.legs[index]?.distance || 0) / 1000
      }));

      setRoutePlan({
        ...roadRoute,
        stops: stopsWithRoadDistances
      });
    } catch (err) {
      setRouteError(err.message);
    } finally {
      setRouteLoading(false);
    }
  }, [center, routeCandidates]);

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

            {routePositions.length > 1 && (
              <Polyline
                positions={routePositions}
                pathOptions={{
                  color: '#2563EB',
                  weight: 5,
                  opacity: 0.8,
                  dashArray: '10 8'
                }}
              />
            )}

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

      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="text-lg font-semibold text-dark-blue flex items-center gap-2">
              <Navigation className="w-5 h-5 text-steel-blue" />
              Route Optimisation
            </h3>
            <p className="text-sm text-grey mt-1">Collection order prioritises high fill bins and draws the route on roads using driving distance.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleOptimizeRoute}
              disabled={routeLoading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-steel-blue px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-dark-blue disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Navigation className="w-4 h-4" />
              {routeLoading ? 'Optimising...' : 'Optimize route'}
            </button>
            <div className="rounded-lg border border-gray-200 px-4 py-2 text-sm">
              <span className="text-grey">Stops</span>
              <span className="ml-2 font-bold text-dark-blue">{routePlan ? optimizedRoute.length : routeCandidates.length}</span>
            </div>
            <div className="rounded-lg border border-gray-200 px-4 py-2 text-sm">
              <span className="text-grey">Road distance</span>
              <span className="ml-2 font-bold text-dark-blue">{routePlan ? `${routeDistanceKm.toFixed(2)} km` : '-'}</span>
            </div>
          </div>
        </div>

        {routeError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {routeError}
          </div>
        )}

        {optimizedRoute.length ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {optimizedRoute.map((bin) => {
              const fillLevel = getFillLevel(bin);
              const fillStyle = FILL_LEVEL_STYLES[fillLevel] || FILL_LEVEL_STYLES.unknown;

              return (
                <button
                  key={bin.id || bin.device_id}
                  type="button"
                  onClick={() => setSelectedBin(bin)}
                  className="text-left rounded-lg border border-gray-200 p-4 hover:border-steel-blue hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-steel-blue text-white flex items-center justify-center text-sm font-bold">
                        {bin.routeOrder}
                      </div>
                      <div>
                        <div className="font-semibold text-dark-blue">{bin.device_id}</div>
                        <div className="text-sm text-grey">{bin.address || 'Location unavailable'}</div>
                      </div>
                    </div>
                    <span className="rounded-full px-2.5 py-1 text-xs font-semibold text-white" style={{ backgroundColor: fillStyle.color }}>
                      {bin.priorityLabel}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <div className="text-grey">Fill</div>
                      <div className="font-bold text-dark-blue">{bin.fill_percentage}%</div>
                    </div>
                    <div>
                      <div className="text-grey">Gas</div>
                      <div className="font-bold text-dark-blue">{Number.isFinite(bin.gas) ? bin.gas : '-'}</div>
                    </div>
                    <div>
                      <div className="text-grey">From prev.</div>
                      <div className="font-bold text-dark-blue">{Number(bin.routeDistanceFromPrevious || 0).toFixed(2)} km</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            {routeCandidates.length
              ? 'Click Optimize route to calculate the road route for high-fill bins.'
              : 'No bins are currently at or above 70% fill, so no collection route is needed.'}
          </div>
        )}
      </div>

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
