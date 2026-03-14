import React from 'react';
import { Trash2, MapPin, Navigation } from 'lucide-react';
import { binData } from '../data/dummyData';

const MapPlaceholder = () => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'normal':
        return 'bg-healthy';
      case 'warning':
        return 'bg-warning';
      case 'critical':
        return 'bg-critical';
      default:
        return 'bg-grey';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-dark-blue">Map View</h1>
        <p className="text-grey mt-1">Smart bin locations and status overview</p>
      </div>

      {/* Map Placeholder */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="bg-light-grey rounded-lg h-96 flex items-center justify-center border-2 border-dashed border-gray-300">
          <div className="text-center">
            <MapPin className="w-16 h-16 text-steel-blue mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-dark-blue mb-2">Interactive Map</h3>
            <p className="text-grey mb-4">Map view is loading or unavailable</p>
            <div className="text-sm text-grey">
              <p>Bin locations will be displayed here</p>
              <p>with real-time status indicators</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bin Location Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {binData.slice(0, 6).map((bin) => (
          <div key={bin.id} className="bg-white rounded-lg shadow-card p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Trash2 className="w-5 h-5 text-steel-blue" />
                <h4 className="font-semibold text-dark-blue">{bin.id}</h4>
                <span className={`w-2 h-2 rounded-full ${getStatusColor(bin.status)}`}></span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-grey">
                <strong>Location:</strong> {bin.location}
              </p>
              <div className="flex justify-between">
                <span className="text-grey">Fill Level:</span>
                <span className="font-medium text-dark-blue">{bin.fillLevel}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-grey">Status:</span>
                <span className={`px-2 py-1 rounded text-xs text-white ${getStatusColor(bin.status)}`}>
                  {bin.status.charAt(0).toUpperCase() + bin.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-grey">Total Bins</p>
              <p className="text-xl font-bold text-dark-blue">{binData.length}</p>
            </div>
            <MapPin className="w-8 h-8 text-steel-blue" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-grey">Normal</p>
              <p className="text-xl font-bold text-healthy">
                {binData.filter(b => b.status === 'normal').length}
              </p>
            </div>
            <div className="w-8 h-8 bg-healthy rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-grey">Warning</p>
              <p className="text-xl font-bold text-warning">
                {binData.filter(b => b.status === 'warning').length}
              </p>
            </div>
            <div className="w-8 h-8 bg-warning rounded-full flex items-center justify-center">
              <span className="text-white text-xs">!</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-grey">Critical</p>
              <p className="text-xl font-bold text-critical">
                {binData.filter(b => b.status === 'critical').length}
              </p>
            </div>
            <div className="w-8 h-8 bg-critical rounded-full flex items-center justify-center">
              <span className="text-white text-xs">!!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPlaceholder;
