import React, { useState, useEffect } from 'react';
import { X, Package, MapPin, Save, AlertTriangle, CheckCircle } from 'lucide-react';
import { createBinDetail, fetchNextDeviceId, fetchDistricts, fetchAreasByDistrict } from '../services/api';

const BinRegistrationForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    device_id: '',
    height: 100,
    location: {
      district: '',
      area: '',
      name: '',
      address: '',
      latitude: 6.9319,      // Flat structure
      longitude: 79.8478,    // Flat structure
      waste_type: 'Organic (Bio-Degradable) Waste',
      max_weight_kg: 500,
      current_weight_kg: 0,
      description: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generatedDeviceId, setGeneratedDeviceId] = useState('');

  // Fixed districts as requested - 4 districts for each zone including suburban zones
  const fixedDistricts = [
    // Colombo Central
    'Colombo Central',
    
    // Colombo North
    'Colombo North',
    'Colombo North Suburban Zone',
    'Colombo North Industrial Zone',
    'Colombo North Commercial Zone',
    
    // Colombo West
    'Colombo West',
    'Colombo West Suburban Zone',
    'Colombo West Residential Zone',
    'Colombo West Business Zone',
    
    // Colombo East
    'Colombo East',
    'Colombo East Suburban Zone',
    'Colombo East Educational Zone',
    'Colombo East Medical Zone'
  ];

  useEffect(() => {
    const generateDeviceId = async () => {
      try {
        const response = await fetchNextDeviceId();
        setGeneratedDeviceId(response.device_id);
        setFormData(prev => ({
          ...prev,
          device_id: response.device_id
        }));
      } catch (err) {
        console.error('Failed to generate device ID:', err);
      }
    };
    generateDeviceId();
  }, []);

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (child.includes('.')) {
        const [grandParent, parent, grandChild] = field.split('.');
        setFormData(prev => ({
          ...prev,
          [grandParent]: {
            ...prev[grandParent],
            [parent]: {
              ...prev[grandParent][parent],
              [grandChild]: value
            }
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Debug: Log the form data being sent
      console.log('Submitting bin registration with data:', JSON.stringify(formData, null, 2));
      
      await createBinDetail(formData);
      setSuccess('Bin registered successfully!');
      
      // Reset form after success
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);

    } catch (err) {
      setError(err.message || 'Failed to register bin');
    } finally {
      setLoading(false);
    }
  };

  const wasteTypes = [
    'Organic (Bio-Degradable) Waste',
    'Recyclable Waste',
    'Non-recyclable Waste'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Register New Bin</h2>
              <p className="text-sm text-gray-600">Add a new smart bin to the system</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Device Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Package className="w-5 h-5 text-blue-600" />
              <span>Device Information</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Device ID *
                </label>
                <input
                  type="text"
                  value={formData.device_id}
                  onChange={(e) => handleInputChange('device_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., esp32_01"
                  required
                />
                {generatedDeviceId && (
                  <p className="text-xs text-gray-500 mt-1">Suggested: {generatedDeviceId}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bin Height (cm) *
                </label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => handleInputChange('height', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  required
                />
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <span>Location Information</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  District *
                </label>
                <select
                  value={formData.location.district}
                  onChange={(e) => {
                    handleInputChange('location.district', e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select District</option>
                  {fixedDistricts.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Area *
                </label>
                <input
                  type="text"
                  value={formData.location.area}
                  onChange={(e) => handleInputChange('location.area', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Fort Area"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location Name *
                </label>
                <input
                  type="text"
                  value={formData.location.name}
                  onChange={(e) => handleInputChange('location.name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Colombo Fort Railway Station"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <input
                  type="text"
                  value={formData.location.address}
                  onChange={(e) => handleInputChange('location.address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Colombo Fort Railway Station, Colombo 01"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude *
                  <span className="text-xs text-gray-500 block">GPS latitude (e.g., 6.9319)</span>
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.location.latitude}
                  onChange={(e) => {
                    const value = e.target.value;
                    const parsedValue = value === '' ? '' : parseFloat(value);
                    handleInputChange('location.latitude', isNaN(parsedValue) ? '' : parsedValue);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="6.9319"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude *
                  <span className="text-xs text-gray-500 block">GPS longitude (e.g., 79.8478)</span>
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.location.longitude}
                  onChange={(e) => {
                    const value = e.target.value;
                    const parsedValue = value === '' ? '' : parseFloat(value);
                    handleInputChange('location.longitude', isNaN(parsedValue) ? '' : parsedValue);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="79.8478"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Weight (kg) *
                </label>
                <input
                  type="number"
                  value={formData.location.max_weight_kg}
                  onChange={(e) => handleInputChange('location.max_weight_kg', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-900">About GPS Coordinates</h4>
                  <p className="text-xs text-blue-800 mt-1">
                    GPS coordinates help locate bins on maps. You can find coordinates using Google Maps: 
                    right-click on a location → select coordinates, or search for the address and copy the latitude/longitude values.
                  </p>
                  <p className="text-xs text-blue-700 mt-2">
                    <strong>Colombo example:</strong> Latitude: 6.9319, Longitude: 79.8478
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Waste Type *
              </label>
              <select
                value={formData.location.waste_type}
                onChange={(e) => handleInputChange('location.waste_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {wasteTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.location.description}
                onChange={(e) => handleInputChange('location.description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                placeholder="Additional details about this bin location..."
              />
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-green-700">{success}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50"
              disabled={loading}
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Registering...' : 'Register Bin'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BinRegistrationForm;
