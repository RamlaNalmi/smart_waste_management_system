import React, { useState, useEffect, useCallback } from 'react';
import { 
  AlertTriangle, 
  Database, 
  X, 
  MapPin, 
  Package, 
  Wind, 
  Gauge, 
  Clock, 
  Activity, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Info,
  Settings,
  Bell,
  Truck,
  Calendar,
  BarChart3,
  Zap,
  Shield,
  RefreshCw,
  Wifi,
  WifiOff,
  ChevronDown,
  History,
  LineChart as LineChartIcon
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getBinLocationFromDetails, fetchBinHistory, createBinUpdatesSource } from '../services/api';

const DetailRow = ({ label, value, icon, status = 'normal' }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-white hover:shadow-md transition-all duration-200">
      <div className="flex items-center space-x-3">
        {icon && <div className={`p-2 rounded-lg ${getStatusColor(status)}`}>{icon}</div>}
        <div>
          <div className="text-sm font-medium text-gray-900">{label}</div>
          {typeof value === 'string' && value.length > 50 && (
            <div className="text-xs text-gray-500 mt-1">Click to expand</div>
          )}
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold text-gray-900 break-all max-w-xs">
          {value ?? '-'}
        </div>
      </div>
    </div>
  );
};

const BinDetails = ({ bin, onClose }) => {
  const [liveBin, setLiveBin] = useState(bin);
  const [isLive, setIsLive] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showHistorical, setShowHistorical] = useState(false);
  const [historicalData, setHistoricalData] = useState([]);
  const [dateRange, setDateRange] = useState('day');
  const [isLoadingHistorical, setIsLoadingHistorical] = useState(false);

  // Function to load historical data
  const loadHistoricalData = useCallback(async () => {
    if (!bin?.device_id) return;
    
    try {
      setIsLoadingHistorical(true);
      setError(null);
      
      const history = await fetchBinHistory(bin.device_id, { 
        limit: 100, 
        range: dateRange 
      });
      setHistoricalData(history);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsLoadingHistorical(false);
    }
  }, [bin?.device_id, dateRange]);

  // Load historical data when showHistorical is toggled
  useEffect(() => {
    if (showHistorical) {
      loadHistoricalData();
    }
  }, [showHistorical, loadHistoricalData]);

  // Function to refresh bin data
  const refreshBinData = useCallback(async () => {
    if (!bin?.device_id) return;
    
    try {
      setIsRefreshing(true);
      setError(null);
      
      // Fetch latest data for this specific bin
      const history = await fetchBinHistory(bin.device_id, { limit: 1 });
      if (history.length > 0) {
        setLiveBin(history[0]);
        setLastUpdate(new Date());
      }
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsRefreshing(false);
    }
  }, [bin?.device_id]);

  // Set up live updates
  useEffect(() => {
    if (!bin?.device_id) return;

    const eventSource = createBinUpdatesSource();
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Check if this update is for our bin
        if (data.device_id === bin.device_id) {
          setLiveBin(prev => ({ ...prev, ...data }));
          setLastUpdate(new Date());
          setIsLive(true);
        }
      } catch (err) {
        console.error('Error parsing live update:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('Live connection error:', err);
      setIsLive(false);
      setError('Live connection lost. Using cached data.');
      setTimeout(() => setError(null), 3000);
    };

    return () => {
      eventSource.close();
    };
  }, [bin?.device_id]);

  // Initialize with provided bin data
  useEffect(() => {
    setLiveBin(bin);
  }, [bin]);

  if (!liveBin) return null;

  const location = getBinLocationFromDetails(liveBin.device_id);
  const currentWeight = liveBin.current_weight || Math.round((liveBin.fill_percentage / 100) * (location?.max_weight || 500));
  const hasAlerts = liveBin.gas_alert || liveBin.fall_detected || liveBin.fill_percentage >= 90;
  const status = liveBin.uiStatus || (liveBin.fill_percentage >= 90 ? 'critical' : liveBin.fill_percentage >= 70 ? 'warning' : 'normal');

  const getStatusConfig = (status) => {
    switch (status) {
      case 'critical':
        return {
          bg: 'bg-gradient-to-r from-red-500 to-red-600',
          text: 'Critical - Immediate Action Required',
          icon: AlertTriangle,
          color: 'text-red-600'
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-r from-yellow-500 to-orange-500',
          text: 'Warning - Attention Needed',
          icon: AlertCircle,
          color: 'text-yellow-600'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
          text: 'Normal - Operating Properly',
          icon: CheckCircle,
          color: 'text-green-600'
        };
    }
  };

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-200">
        {/* Enhanced Header */}
        <div className={`${statusConfig.bg} text-white p-6 relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
          
          {/* Error Display */}
          {error && (
            <div className="absolute top-4 left-4 right-4 bg-red-600 text-white p-3 rounded-lg shadow-lg z-20">
              <div className="flex items-center space-x-2">
                <WifiOff className="w-4 h-4" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                <Database className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{liveBin.device_id}</h2>
                <p className="text-white text-opacity-90 mt-1">{location?.name || 'Unknown Location'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Live Status Indicator */}
              {isLive && (
                <div className="flex items-center space-x-2 bg-white bg-opacity-20 px-3 py-2 rounded-lg backdrop-blur-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">LIVE</span>
                </div>
              )}
              
              {/* Refresh Button */}
              <button
                onClick={refreshBinData}
                disabled={isRefreshing}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-xl p-3 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh data"
              >
                <RefreshCw className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-xl p-3 transition-all duration-200 transform hover:scale-105"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          {/* Status Banner */}
          <div className="relative z-10 mt-4 flex items-center space-x-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-3">
            <StatusIcon className="w-5 h-5" />
            <span className="font-medium">{statusConfig.text}</span>
          </div>
        </div>

        {/* Alert Banner */}
        {hasAlerts && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900">Active Alerts Detected</h3>
                <div className="mt-2 space-y-1">
                  {bin.fill_percentage >= 90 && (
                    <div className="text-sm text-red-700">• Fill level critical ({bin.fill_percentage}%)</div>
                  )}
                  {bin.gas_alert && (
                    <div className="text-sm text-red-700">• Gas alert detected</div>
                  )}
                  {bin.fall_detected && (
                    <div className="text-sm text-red-700">• Fall detected - bin may be damaged</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <Gauge className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">Fill Level</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">{liveBin.fill_percentage}%</div>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${liveBin.fill_percentage}%` }}
                ></div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-5 h-5 text-green-600" />
                <span className="text-xs font-medium text-green-600 uppercase tracking-wide">Weight</span>
              </div>
              <div className="text-2xl font-bold text-green-900">{currentWeight} kg</div>
              <div className="text-xs text-green-700 mt-1">of {location?.max_weight || 500} kg capacity</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-5 h-5 text-purple-600" />
                <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">Status</span>
              </div>
              <div className="text-2xl font-bold text-purple-900 capitalize">{status}</div>
              <div className="text-xs text-purple-700 mt-1">Current operating status</div>
            </div>
          </div>

          {/* Live Update Status */}
          <div className="mb-6">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2">
                {isLive ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-600">Live Updates Active</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">Live Updates Inactive</span>
                  </>
                )}
              </div>
              <div className="text-xs text-gray-500">
                Last update: {lastUpdate.toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>Location Information</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailRow 
                label="Device ID" 
                value={liveBin.device_id} 
                icon={<Database className="w-4 h-4" />}
              />
              <DetailRow 
                label="Location Name" 
                value={location?.name || 'Unknown'} 
                icon={<MapPin className="w-4 h-4" />}
              />
              <DetailRow 
                label="District" 
                value={location?.district || 'Unknown'} 
                icon={<MapPin className="w-4 h-4" />}
              />
              <DetailRow 
                label="Area" 
                value={location?.area || 'Unknown'} 
                icon={<MapPin className="w-4 h-4" />}
              />
              <DetailRow 
                label="Waste Type" 
                value={location?.waste_type || 'Unknown'} 
                icon={<Package className="w-4 h-4" />}
                status={location?.waste_type === 'Organic (Bio-Degradable) Waste' ? 'success' : 
                       location?.waste_type === 'Recyclable Waste' ? 'normal' : 'warning'}
              />
              <DetailRow 
                label="Address" 
                value={location?.address || 'Not specified'} 
                icon={<MapPin className="w-4 h-4" />}
              />
            </div>
          </div>

          {/* Technical Details */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Technical Details</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailRow 
                label="Fill Percentage" 
                value={`${liveBin.fill_percentage}%`} 
                icon={<Gauge className="w-4 h-4" />}
                status={liveBin.fill_percentage >= 90 ? 'critical' : liveBin.fill_percentage >= 70 ? 'warning' : 'success'}
              />
              <DetailRow 
                label="Fill Status" 
                value={liveBin.fill_status || 'Unknown'} 
                icon={<BarChart3 className="w-4 h-4" />}
              />
              <DetailRow 
                label="Distance" 
                value={liveBin.distance ? `${liveBin.distance} units` : 'Not available'} 
                icon={<Activity className="w-4 h-4" />}
              />
              <DetailRow 
                label="Gas Level" 
                value={liveBin.gas ? `${liveBin.gas} ppm` : 'Normal'} 
                icon={<Wind className="w-4 h-4" />}
                status={liveBin.gas_alert ? 'critical' : 'normal'}
              />
              <DetailRow 
                label="Angle X" 
                value={liveBin.angleX ? `${liveBin.angleX}°` : '0°'} 
                icon={<Activity className="w-4 h-4" />}
              />
              <DetailRow 
                label="Angle Y" 
                value={liveBin.angleY ? `${liveBin.angleY}°` : '0°'} 
                icon={<Activity className="w-4 h-4" />}
              />
            </div>
          </div>

          {/* Alerts and Status */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Alerts & Status</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailRow 
                label="Gas Alert" 
                value={liveBin.gas_alert ? 'Active' : 'None'} 
                icon={<Wind className="w-4 h-4" />}
                status={liveBin.gas_alert ? 'critical' : 'success'}
              />
              <DetailRow 
                label="Fall Detected" 
                value={liveBin.fall_detected ? 'Yes - Check bin' : 'No'} 
                icon={<AlertTriangle className="w-4 h-4" />}
                status={liveBin.fall_detected ? 'critical' : 'success'}
              />
              <DetailRow 
                label="System Status" 
                value={status} 
                icon={<Shield className="w-4 h-4" />}
                status={status === 'critical' ? 'critical' : status === 'warning' ? 'warning' : 'success'}
              />
              <DetailRow 
                label="Priority Level" 
                value={status === 'critical' ? 'High' : status === 'warning' ? 'Medium' : 'Low'} 
                icon={<Zap className="w-4 h-4" />}
                status={status === 'critical' ? 'critical' : status === 'warning' ? 'warning' : 'normal'}
              />
            </div>
          </div>

          {/* Timestamp Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Timestamp Information</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailRow 
                label="Last Update" 
                value={liveBin.received_at ? new Date(liveBin.received_at).toLocaleString() : 'Unknown'} 
                icon={<Clock className="w-4 h-4" />}
              />
              <DetailRow 
                label="Device Timestamp" 
                value={liveBin.timestamp ? new Date(liveBin.timestamp).toLocaleString() : 'Unknown'} 
                icon={<Clock className="w-4 h-4" />}
              />
              <DetailRow 
                label="MQTT Topic" 
                value={liveBin.topic || 'Not specified'} 
                icon={<Info className="w-4 h-4" />}
              />
              <DetailRow 
                label="Database ID" 
                value={liveBin.id || 'Not assigned'} 
                icon={<Database className="w-4 h-4" />}
              />
            </div>
          </div>

          {/* Historical Data Toggle */}
          <div className="mb-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                <History className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Historical Data</h3>
              </div>
              <div className="flex items-center space-x-3">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="day">Last 24 Hours</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                </select>
                <button
                  onClick={() => setShowHistorical(!showHistorical)}
                  className="flex items-center space-x-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {showHistorical ? (
                    <>
                      <BarChart3 className="w-4 h-4" />
                      <span className="text-sm font-medium">Hide Historical Data</span>
                    </>
                  ) : (
                    <>
                      <LineChartIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">Show Historical Data</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Historical Data Chart */}
            {showHistorical && (
              <div className="mt-4">
                {isLoadingHistorical ? (
                  <div className="flex items-center justify-center p-8">
                    <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                    <span className="text-gray-600 ml-2">Loading historical data...</span>
                  </div>
                ) : historicalData.length > 0 ? (
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Fill Level History</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={historicalData.map(item => ({
                        time: new Date(item.received_at).toLocaleTimeString(),
                        fillLevel: item.fill_percentage
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis 
                          dataKey="time" 
                          stroke="#6b7280" 
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          stroke="#6b7280" 
                          tick={{ fontSize: 12 }}
                          domain={[0, 100]}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                          labelStyle={{ color: '#f3f4f6' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="fillLevel" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center p-8 text-gray-500">
                    <Database className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>No historical data available</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button className="flex items-center justify-center space-x-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Bell className="w-4 h-4" />
                <span className="text-sm font-medium">Set Alert</span>
              </button>
              <button className="flex items-center justify-center space-x-2 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Truck className="w-4 h-4" />
                <span className="text-sm font-medium">Schedule</span>
              </button>
              <button className="flex items-center justify-center space-x-2 p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                <Settings className="w-4 h-4" />
                <span className="text-sm font-medium">Configure</span>
              </button>
              <button className="flex items-center justify-center space-x-2 p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm font-medium">History</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BinDetails;
