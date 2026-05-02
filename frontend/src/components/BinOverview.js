import React, { useEffect, useMemo, useState } from 'react';
import { 
  Download, 
  Search, 
  Filter, 
  Package, 
  Gauge, 
  AlertTriangle, 
  Wind, 
  Activity, 
  TrendingUp, 
  BarChart3,
  RefreshCw,
  Settings,
  Bell,
  Truck
} from 'lucide-react';
import BinStatusTable from './BinStatusTable';
import BinRegistrationForm from './BinRegistrationForm';
import { fetchBins, fetchBinDetails, getBinLocationFromDetails } from '../services/api';

const BinOverview = () => {
  const [bins, setBins] = useState([]);
  const [binDetails, setBinDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showAddBinForm, setShowAddBinForm] = useState(false); // State for controlling bin registration form modal

  const loadBins = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setError('');
      const [sensorData, detailsData] = await Promise.all([
        fetchBins(),
        fetchBinDetails().catch(() => []) // Bin details is optional
      ]);
      setBins(sensorData);
      setBinDetails(detailsData);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadBins(true);
    const refreshTimer = setInterval(() => loadBins(false), 3000);
    return () => clearInterval(refreshTimer);
  }, []);

  // Enhanced metrics calculation
  const metrics = useMemo(() => {
    const total = bins.length;
    const averageFill = total
      ? Math.round(bins.reduce((sum, reading) => sum + reading.fill_percentage, 0) / total)
      : 0;
    const criticalBins = bins.filter((reading) => 
      (reading.uiStatus || (reading.fill_percentage >= 90 ? 'critical' : reading.fill_percentage >= 70 ? 'warning' : 'normal')) === 'critical'
    ).length;
    const warningBins = bins.filter((reading) => 
      (reading.uiStatus || (reading.fill_percentage >= 90 ? 'critical' : reading.fill_percentage >= 70 ? 'warning' : 'normal')) === 'warning'
    ).length;
    const normalBins = bins.filter((reading) => 
      (reading.uiStatus || (reading.fill_percentage >= 90 ? 'critical' : reading.fill_percentage >= 70 ? 'warning' : 'normal')) === 'normal'
    ).length;
    const gasAlerts = bins.filter((reading) => reading.gas_alert).length;
    const fallDetected = bins.filter((reading) => reading.fall_detected).length;
    
    // Weight calculations using bin details data
    const totalWeight = bins.reduce((sum, bin) => {
      const location = getBinLocationFromDetails(bin.device_id, binDetails);
      const currentWeight = bin.current_weight || Math.round((bin.fill_percentage / 100) * (location?.max_weight || 500));
      return sum + currentWeight;
    }, 0);
    
    // Waste type distribution using bin details data
    const organicBins = bins.filter(bin => {
      const location = getBinLocationFromDetails(bin.device_id, binDetails);
      return location?.waste_type === 'Organic (Bio-Degradable) Waste';
    }).length;
    const recyclableBins = bins.filter(bin => {
      const location = getBinLocationFromDetails(bin.device_id, binDetails);
      return location?.waste_type === 'Recyclable Waste';
    }).length;
    const nonRecyclableBins = bins.filter(bin => {
      const location = getBinLocationFromDetails(bin.device_id, binDetails);
      return location?.waste_type === 'Non-recyclable Waste';
    }).length;

    return {
      total,
      averageFill,
      critical: criticalBins,
      warning: warningBins,
      normal: normalBins,
      gasAlerts,
      fallDetected,
      totalWeight,
      organicBins,
      recyclableBins,
      nonRecyclableBins,
      efficiency: total > 0 ? Math.round((normalBins / total) * 100) : 0,
      healthScore: total > 0 ? Math.round(((normalBins * 100) + (warningBins * 50) + (criticalBins * 0)) / total) : 0
    };
  }, [bins]);

  const exportData = () => {
    const csvContent = [
      ['device_id', 'distance', 'fill_percentage', 'fill_status', 'predicted_next_fill', 'predicted_fill_status', 'gas', 'gas_alert', 'angleX', 'angleY', 'fall_detected', 'timestamp', 'topic', 'received_at'],
      ...bins.map((reading) => [
        reading.device_id,
        reading.distance ?? '',
        reading.fill_percentage,
        reading.fill_status,
        reading.predicted_next_fill ?? '',
        reading.predicted_fill_status ?? '',
        reading.gas ?? '',
        reading.gas_alert,
        reading.angleX ?? '',
        reading.angleY ?? '',
        reading.fall_detected,
        reading.timestamp,
        reading.topic,
        reading.received_at
      ])
    ].map((row) => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'smartbin_database_readings.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleBinRegistrationSuccess = () => {
    // Refresh the bins data after successful registration
    loadBins(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl">
                  <Package className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Bin Management</h1>
                  <p className="text-sm text-gray-600 mt-1">Real-time monitoring and comprehensive analytics</p>
                </div>
              </div>
              
              {/* Status Indicator */}
              <div className="flex items-center space-x-3 px-4 py-2 bg-green-50 border border-green-200 rounded-xl">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">System Online</span>
                <span className="text-xs text-green-600">{bins.length} active</span>
              </div>
            </div>
            
            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAddBinForm(true)}
                className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Package className="w-4 h-4" />
                <span className="font-medium">Add New Bin</span>
              </button>
              
              <div className="flex items-center space-x-2 text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                <Activity className="w-4 h-4" />
                <span className="font-medium">{lastUpdate.toLocaleTimeString()}</span>
              </div>
              <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                <span className="font-medium">Updated: {lastUpdate.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
            <div className="flex items-center justify-center space-x-3">
              <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
              <span className="text-gray-700 font-medium">Loading bin data...</span>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!loading && !error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Simple Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Bin Management</h2>
                <p className="text-sm text-gray-600 mt-1">Click on any bin to view detailed information</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">{bins.length} bins active</span>
                </div>
                <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                  <span className="font-medium">Updated: {lastUpdate.toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Bin Status Table */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
            <BinStatusTable limit={5} binDetails={binDetails} sensorData={bins} />
          </div>
        </div>
      )}
      
      {/* Bin Registration Form Modal */}
      {showAddBinForm && (
        <BinRegistrationForm
          onClose={() => setShowAddBinForm(false)}
          onSuccess={handleBinRegistrationSuccess}
        />
      )}
    </div>
  );
};

export default BinOverview;
