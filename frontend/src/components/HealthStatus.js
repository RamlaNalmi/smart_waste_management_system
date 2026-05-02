import React, { useState, useEffect } from 'react';
import { Activity, Wifi, WifiOff, AlertTriangle, CheckCircle, XCircle, RefreshCw, Clock } from 'lucide-react';
import { fetchLatestHealthData, fetchHealthData, createHealthUpdatesSource } from '../services/api';

const HealthStatus = ({ deviceId = null }) => {
  const [healthData, setHealthData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const loadHealthData = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setError('');
      const data = deviceId ? await fetchHealthData(deviceId) : await fetchLatestHealthData();
      setHealthData(data);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadHealthData(true);
    
    // Set up real-time updates
    const eventSource = createHealthUpdatesSource();
    eventSource.onmessage = (event) => {
      try {
        const newHealthData = JSON.parse(event.data);
        setHealthData(prev => {
          const existingIndex = prev.findIndex(item => item.device_id === newHealthData.device_id);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = newHealthData;
            return updated;
          }
          return [...prev, newHealthData];
        });
        setLastUpdate(new Date());
      } catch (err) {
        console.error('Error parsing health update:', err);
      }
    };

    eventSource.onerror = () => {
      console.error('Health updates event source error');
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [deviceId]);

  const getHealthIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getHealthColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getSensorStatusIcon = (status) => {
    switch (status) {
      case 'OK':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'DISCONNECTED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getWifiIcon = (rssi) => {
    if (rssi === null || rssi === undefined) {
      return <WifiOff className="w-4 h-4 text-gray-400" />;
    }
    if (rssi > -50) {
      return <Wifi className="w-4 h-4 text-green-500" />;
    } else if (rssi > -70) {
      return <Wifi className="w-4 h-4 text-yellow-500" />;
    } else {
      return <Wifi className="w-4 h-4 text-red-500" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
          <span className="ml-2 text-gray-600">Loading health data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="flex items-center text-red-600">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <span>Error loading health data: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Activity className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-dark-blue">Device Health Status</h3>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>{lastUpdate.toLocaleTimeString()}</span>
          </div>
          <button
            onClick={() => loadHealthData(true)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {healthData.map((device) => (
          <div
            key={device.id}
            className={`border rounded-lg p-4 ${getHealthColor(device.healthStatus)}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                {getHealthIcon(device.healthStatus)}
                <div>
                  <h4 className="font-medium">{device.device_id}</h4>
                  <p className="text-sm opacity-75">
                    {device.disconnectedSensors} sensor{device.disconnectedSensors !== 1 ? 's' : ''} disconnected
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getWifiIcon(device.wifi_rssi)}
                <span className="text-sm font-medium">
                  {device.wifi_rssi !== null ? `${device.wifi_rssi} dBm` : 'No Signal'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <div className="flex items-center space-x-2">
                {getSensorStatusIcon(device.sensor1_open_close)}
                <span className="font-medium">Open/Close:</span>
                <span>{device.sensor1_open_close}</span>
              </div>
              <div className="flex items-center space-x-2">
                {getSensorStatusIcon(device.sensor2_fill_level)}
                <span className="font-medium">Fill Level:</span>
                <span>{device.sensor2_fill_level}</span>
              </div>
              <div className="flex items-center space-x-2">
                {getSensorStatusIcon(device.gas_sensor)}
                <span className="font-medium">Gas:</span>
                <span>{device.gas_sensor}</span>
              </div>
              <div className="flex items-center space-x-2">
                {getSensorStatusIcon(device.mpu6050)}
                <span className="font-medium">Motion:</span>
                <span>{device.mpu6050}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">Bin:</span>
                <span>{device.bin_status}</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-current border-opacity-20 text-xs opacity-75">
              Last update: {new Date(device.timestamp).toLocaleString()}
            </div>
          </div>
        ))}

        {healthData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No health data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthStatus;
