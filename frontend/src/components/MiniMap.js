import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { AlertTriangle, MapPin, CheckCircle } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MiniMap.css';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const COLORS = {
  normal: '#10b981',
  warning: '#f59e0b',
  critical: '#ef4444'
};

const createCustomIcon = (status, size = 'normal') => {
  const color = COLORS[status] || COLORS.normal;
  const sizes = {
    small: { width: 10, height: 10, border: 2, iconSize: 14, anchor: 7 },
    normal: { width: 16, height: 16, border: 3, iconSize: 22, anchor: 11 },
    large: { width: 20, height: 20, border: 3, iconSize: 26, anchor: 13 }
  };
  const s = sizes[size] || sizes.normal;
  
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: ${s.width}px;
        height: ${s.height}px;
        border-radius: 50%;
        border: ${s.border}px solid white;
        box-shadow: 0 3px 8px rgba(0,0,0,0.4);
        ${status === 'critical' ? 'animation: pulse 2s infinite;' : ''}
        position: relative;
      ">
        ${status === 'critical' ? '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 6px; height: 6px; background: white; border-radius: 50%;"></div>' : ''}
      </div>
    `,
    className: 'custom-marker',
    iconSize: [s.iconSize, s.iconSize],
    iconAnchor: [s.anchor, s.anchor],
    popupAnchor: [s.anchor, -s.anchor]
  });
};

const MiniMap = ({ bins, height = 400, showHeatmap = false }) => {
  const mapBounds = useMemo(() => {
    if (!bins || bins.length === 0) return null;
    
    const validCoordinates = bins
      .filter(bin => bin.location?.coordinates && bin.location.coordinates.length === 2)
      .map(bin => bin.location.coordinates);
    
    if (validCoordinates.length === 0) return null;
    
    const lats = validCoordinates.map(coord => coord[0]);
    const lngs = validCoordinates.map(coord => coord[1]);
    
    return [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    ];
  }, [bins]);

  const center = useMemo(() => {
    if (mapBounds) {
      return [
        (mapBounds[0][0] + mapBounds[1][0]) / 2,
        (mapBounds[0][1] + mapBounds[1][1]) / 2
      ];
    }
    return [6.9271, 79.8612]; // Default to Colombo center
  }, [mapBounds]);

  const statusCounts = useMemo(() => {
    const counts = { normal: 0, warning: 0, critical: 0 };
    bins.forEach(bin => {
      const status = bin.uiStatus || 'normal';
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [bins]);

  if (!bins || bins.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No bin locations available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Enhanced Status Legend */}
      <div className="absolute top-3 right-3 z-10 bg-white rounded-xl shadow-lg p-4 text-sm min-w-[180px]">
        <div className="font-semibold text-gray-800 mb-3 text-xs uppercase tracking-wide">Bin Status</div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-green-500 shadow-sm"></div>
              <span className="text-gray-700 font-medium">Normal</span>
            </div>
            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">{statusCounts.normal}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500 shadow-sm"></div>
              <span className="text-gray-700 font-medium">Warning</span>
            </div>
            <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-bold">{statusCounts.warning}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-red-500 shadow-sm animate-pulse"></div>
              <span className="text-gray-700 font-medium">Critical</span>
            </div>
            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold">{statusCounts.critical}</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Total Bins</span>
            <span className="font-bold text-gray-700">{bins.length}</span>
          </div>
        </div>
      </div>

      {/* Map */}
      <MapContainer
        center={center}
        bounds={mapBounds}
        boundsOptions={{ padding: [30, 30] }}
        style={{ height, width: '100%', borderRadius: '0.75rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
        zoom={13}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution=''
          opacity={0.3}
        />
        
        {bins.map((bin) => {
          if (!bin.location?.coordinates || bin.location.coordinates.length !== 2) {
            return null;
          }
          
          const status = bin.uiStatus || 'normal';
          
          return (
            <Marker
              key={bin.device_id}
              position={bin.location.coordinates}
              icon={createCustomIcon(status)}
            >
              <Popup maxWidth={320}>
                <div className="p-3 min-w-[300px]">
                  <div className="font-semibold text-gray-900 mb-2 text-base">{bin.location.name}</div>
                  <div className="text-gray-600 text-sm mb-3">{bin.location.address}</div>
                  
                  {/* Status Badge */}
                  <div className="mb-3">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                      status === 'critical' ? 'bg-red-100 text-red-700' :
                      status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {status.toUpperCase()}
                    </span>
                  </div>
                  
                  {/* Waste Type Badge */}
                  <div className="mb-3">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                      bin.waste_type === 'Organic (Bio-Degradable) Waste' ? 'bg-green-100 text-green-700' :
                      bin.waste_type === 'Recyclable Waste' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {bin.waste_type}
                    </span>
                  </div>
                  
                  
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-xs text-gray-500">Fill Level</div>
                      <div className={`text-lg font-bold ${
                        bin.fill_percentage >= 90 ? 'text-red-600' :
                        bin.fill_percentage >= 70 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {bin.fill_percentage}%
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className={`h-1.5 rounded-full ${
                            bin.fill_percentage >= 90 ? 'bg-red-500' :
                            bin.fill_percentage >= 70 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${bin.fill_percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-xs text-gray-500">Weight</div>
                      <div className="text-lg font-bold text-gray-700">
                        {bin.current_weight || 0} kg
                      </div>
                      <div className="text-xs text-gray-500">of {bin.max_weight} kg</div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{ width: `${Math.round(((bin.current_weight || 0) / bin.max_weight) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Device Info */}
                  <div className="bg-gray-50 rounded-lg p-2 mb-3">
                    <div className="text-xs text-gray-500">Device ID</div>
                    <div className="text-sm font-mono font-semibold text-gray-700">{bin.device_id}</div>
                  </div>
                  
                  {/* Alerts */}
                  {(bin.gas_alert || bin.fall_detected) && (
                    <div className="space-y-2 border-t pt-2">
                      {bin.gas_alert && (
                        <div className="flex items-center space-x-2 bg-red-50 rounded-lg p-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-medium text-red-700">Gas Alert Active</span>
                        </div>
                      )}
                      {bin.fall_detected && (
                        <div className="flex items-center space-x-2 bg-orange-50 rounded-lg p-2">
                          <AlertTriangle className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-medium text-orange-700">Fall Detected</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Last Update */}
                  <div className="text-xs text-gray-400 mt-3 pt-2 border-t">
                    Last updated: {bin.timestamp ? new Date(bin.timestamp).toLocaleString() : 'Unknown'}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MiniMap;
