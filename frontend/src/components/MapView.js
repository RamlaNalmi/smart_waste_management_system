import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { binData } from '../data/dummyData';
import { Trash2, MapPin, Navigation } from 'lucide-react';

// Import Leaflet CSS dynamically to avoid CORS issues
const loadLeafletCSS = () => {
  if (!document.querySelector('link[href*="leaflet.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }
};

// Fix for default marker icon in Leaflet
/* global L */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createCustomIcon = (status) => {
  const color = status === 'critical' ? '#E74C3C' : 
                status === 'warning' ? '#F39C12' : '#2ECC71';
  
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
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
          font-size: 12px;
          font-weight: bold;
        ">🗑️</div>
      </div>
    `,
    className: 'custom-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
};

const MapController = ({ center, zoom }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

const MapView = () => {
  const [selectedBin, setSelectedBin] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLeafletReady, setIsLeafletReady] = useState(false);

  useEffect(() => {
    // Load Leaflet CSS dynamically
    loadLeafletCSS();
    
    // Set a timeout to ensure Leaflet is ready
    const timer = setTimeout(() => {
      setIsLeafletReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Initialize Leaflet icons when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined' && window.L) {
      delete window.L.Icon.Default.prototype._getIconUrl;
      window.L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
    }
  }, []);

  const filteredBins = filterStatus === 'all' 
    ? binData 
    : binData.filter(bin => bin.status === filterStatus);

  const getStatusColor = (status) => {
    switch (status) {
      case 'normal':
        return 'text-healthy bg-green-50 border-healthy';
      case 'warning':
        return 'text-warning bg-yellow-50 border-warning';
      case 'critical':
        return 'text-critical bg-red-50 border-critical';
      default:
        return 'text-grey bg-gray-50 border-grey';
    }
  };

  const BinPopup = ({ bin }) => (
    <div className="p-3 min-w-[200px]">
      <div className="flex items-center space-x-2 mb-2">
        <Trash2 className="w-4 h-4 text-steel-blue" />
        <h4 className="font-semibold text-dark-blue">{bin.id}</h4>
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(bin.status)}`}>
          {bin.status.charAt(0).toUpperCase() + bin.status.slice(1)}
        </span>
      </div>
      
      <div className="space-y-1 text-sm">
        <p className="text-grey"><strong>Location:</strong> {bin.location}</p>
        <div className="flex justify-between">
          <span className="text-grey">Fill Level:</span>
          <span className="font-medium text-dark-blue">{bin.fillLevel}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-grey">Weight:</span>
          <span className="font-medium text-dark-blue">{bin.weight} kg</span>
        </div>
        <div className="flex justify-between">
          <span className="text-grey">Odor Level:</span>
          <span className="font-medium text-dark-blue">{bin.odorLevel}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-grey">Temperature:</span>
          <span className="font-medium text-dark-blue">{bin.temperature}°C</span>
        </div>
        <div className="flex justify-between">
          <span className="text-grey">Last Collection:</span>
          <span className="font-medium text-dark-blue text-xs">{bin.lastCollection}</span>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200">
        <button className="w-full bg-steel-blue text-white text-sm py-2 rounded hover:bg-civic-blue transition-colors">
          View Details
        </button>
      </div>
    </div>
  );

  if (!isLeafletReady) {
    return (
      <div className="p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-blue">Map View</h1>
          <p className="text-grey mt-1">Interactive map showing all smart bin locations and status</p>
        </div>
        <div className="bg-white rounded-lg shadow-card p-8 text-center">
          <div className="w-12 h-12 border-4 border-steel-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-dark-blue">Loading map...</p>
        </div>
      </div>
    );
  }

  // Colombo center coordinates
  const centerPosition = [6.9271, 79.8612];
  const zoomLevel = 12;

  return (
    <div className="p-6 space-y-4">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-dark-blue">Map View</h1>
        <p className="text-grey mt-1">Interactive map showing all smart bin locations and status</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-steel-blue" />
              <span className="text-sm font-medium text-dark-blue">Filter by Status:</span>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-steel-blue"
            >
              <option value="all">All Bins ({binData.length})</option>
              <option value="normal">Normal ({binData.filter(b => b.status === 'normal').length})</option>
              <option value="warning">Warning ({binData.filter(b => b.status === 'warning').length})</option>
              <option value="critical">Critical ({binData.filter(b => b.status === 'critical').length})</option>
            </select>
          </div>

          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-healthy rounded-full"></div>
              <span className="text-grey">Normal</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-warning rounded-full"></div>
              <span className="text-grey">Warning</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-critical rounded-full"></div>
              <span className="text-grey">Critical</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <div style={{ height: '600px', width: '100%' }}>
          <MapContainer
            center={centerPosition}
            zoom={zoomLevel}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapController center={centerPosition} zoom={zoomLevel} />
            
            {filteredBins.map((bin) => (
              <Marker
                key={bin.id}
                position={bin.coordinates}
                icon={createCustomIcon(bin.status)}
                eventHandlers={{
                  click: () => setSelectedBin(bin),
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

      {/* Selected Bin Details */}
      {selectedBin && (
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-dark-blue">Selected Bin Details</h3>
            <button 
              onClick={() => setSelectedBin(null)}
              className="text-grey hover:text-dark-blue"
            >
              ×
            </button>
          </div>
          <BinPopup bin={selectedBin} />
        </div>
      )}

      {/* Map Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-steel-blue rounded-lg flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-grey">Total Bins</p>
              <p className="text-lg font-bold text-dark-blue">{filteredBins.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-healthy rounded-lg flex items-center justify-center">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-grey">Normal</p>
              <p className="text-lg font-bold text-dark-blue">
                {filteredBins.filter(b => b.status === 'normal').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-warning rounded-lg flex items-center justify-center">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-grey">Warning</p>
              <p className="text-lg font-bold text-dark-blue">
                {filteredBins.filter(b => b.status === 'warning').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-critical rounded-lg flex items-center justify-center">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-grey">Critical</p>
              <p className="text-lg font-bold text-dark-blue">
                {filteredBins.filter(b => b.status === 'critical').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
