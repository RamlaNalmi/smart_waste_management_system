import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { AlertTriangle, Database, Gauge, MapPin, TrendingUp, Clock, RefreshCw, AlertCircle, CheckCircle2, Calendar, Search, Download, ChevronRight, Volume2, Maximize2, Home, BarChart3, Activity, Users, Navigation, Wind, Droplets, Trash2, Package, X } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, AreaChart, Area } from 'recharts';
import HealthStatus from './HealthStatus';
import { useAuth } from '../contexts/AuthContext';
import { fetchBins, fetchAlerts, fetchLatestHealthData, fetchBinDetails, getBinLocationFromDetails } from '../services/api';

const COLORS = {
  primary: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  light: '#f8fafc',
  dark: '#1e293b',
  gradient: {
    blue: 'from-blue-400 to-indigo-600',
    green: 'from-emerald-400 to-teal-600',
    yellow: 'from-yellow-400 to-orange-500',
    red: 'from-red-400 to-pink-600',
    purple: 'from-purple-400 to-indigo-600'
  }
};

const KPICard = ({ title, value, icon: Icon, color, unit = '', trend = null, subtitle = '', status = 'normal', onClick, description = '' }) => {
  const getCardStyling = () => {
    switch (status) {
      case 'critical':
        return {
          border: 'border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-100',
          icon: 'bg-red-500 text-white',
          value: 'text-red-700',
          accent: 'bg-red-500'
        };
      case 'warning':
        return {
          border: 'border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100',
          icon: 'bg-yellow-500 text-white',
          value: 'text-yellow-700',
          accent: 'bg-yellow-500'
        };
      case 'safe':
        return {
          border: 'border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100',
          icon: 'bg-green-500 text-white',
          value: 'text-green-700',
          accent: 'bg-green-500'
        };
      default:
        return {
          border: 'border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100',
          icon: 'bg-gray-500 text-white',
          value: 'text-gray-700',
          accent: 'bg-gray-500'
        };
    }
  };

  const styling = getCardStyling();

  return (
    <div 
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl ${styling.border} p-6 transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer`}
    >
      {/* Status Indicator Bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${styling.accent}`}></div>
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{title}</h3>
            {subtitle && (
              <p className="text-xs text-gray-600 mt-1 font-medium">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${styling.icon} transition-transform duration-300 group-hover:scale-110 shadow-lg`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        
        {/* Value */}
        <div className="mb-3">
          <div className="flex items-baseline">
            <span className={`text-4xl font-bold ${styling.value} transition-colors`}>
              {typeof value === 'object' ? value.name || Object.keys(value)[0] : value}
            </span>
            {unit && <span className={`text-xl ${styling.value} ml-1 font-semibold`}>{unit}</span>}
          </div>
          {description && (
            <p className="text-sm text-gray-600 mt-2 font-medium">{description}</p>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between">
          {trend && (
            <div className="flex items-center space-x-1">
              {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
              {trend === 'down' && <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />}
              <span className="text-xs text-gray-500 font-medium">
                {trend === 'up' ? 'Increasing' : trend === 'down' ? 'Decreasing' : 'Stable'}
              </span>
            </div>
          )}
          {onClick && (
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          )}
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [bins, setBins] = useState([]);
  const [binDetails, setBinDetails] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [healthData, setHealthData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [fullScreenMode, setFullScreenMode] = useState(false);
  const [realTimeUpdates, setRealTimeUpdates] = useState([]);
  const [detailsModal, setDetailsModal] = useState(null);
  const [dismissedFallAlertKey, setDismissedFallAlertKey] = useState('');

  // Sound notification for critical alerts
  const playAlertSound = useCallback((criticalCount) => {
    if (soundEnabled && criticalCount > 0) {
      // Play a subtle notification sound
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE');
      audio.volume = 0.3;
      audio.play().catch(e => console.log('Audio play failed:', e));
    }
  }, [soundEnabled]);

  const loadBins = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setError('');
      const [binsData, alertsData, healthDataResponse, detailsData] = await Promise.all([
        fetchBins(), 
        fetchAlerts(),
        fetchLatestHealthData().catch(() => []), // Health data is optional
        fetchBinDetails().catch(() => []) // Bin details is optional
      ]);
      setBins(binsData);
      setAlerts(alertsData);
      setHealthData(healthDataResponse);
      setBinDetails(detailsData);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const binsWithLocations = useMemo(() => {
    return bins.map(bin => {
      const location = getBinLocationFromDetails(bin.device_id, binDetails);
      const binData = {
        ...bin,
        location: location || {
          device_id: bin.device_id,
          name: 'Unknown Location',
          address: 'Location not mapped',
          coordinates: [6.9271, 79.8612], // Default Colombo center
          description: 'No location data available',
          district: 'Unknown',
          area: 'Unknown',
          waste_type: 'Mixed Waste',
          max_weight: 500,
          current_weight: 0
        },
        // Add waste type and weight from location data
        waste_type: location?.waste_type || 'Mixed Waste',
        max_weight: location?.max_weight || 500,
        current_weight: bin.current_weight || Math.round((bin.fill_percentage / 100) * (location?.max_weight || 500)),
        // Ensure uiStatus is properly calculated
        uiStatus: bin.uiStatus || (
          bin.fill_percentage >= 90 ? 'critical' :
          bin.fill_percentage >= 70 ? 'warning' : 'normal'
        )
      };
      return binData;
    });
  }, [bins, binDetails]);

  const metrics = useMemo(() => {
    const total = bins.length;
    const averageFill = total
      ? Math.round(bins.reduce((sum, reading) => sum + reading.fill_percentage, 0) / total)
      : 0;
    const criticalBins = bins.filter((reading) => reading.uiStatus === 'critical').length;
    const warningBins = bins.filter((reading) => reading.uiStatus === 'warning').length;
    const normalBins = bins.filter((reading) => reading.uiStatus === 'normal').length;
    const efficiency = total > 0 ? Math.round((normalBins / total) * 100) : 0;
    const activeAlerts = alerts.filter(alert => !alert.acknowledged).length;
    const gasAlerts = bins.filter((reading) => reading.gas_alert).length;
    const fallDetected = bins.filter((reading) => reading.fall_detected).length;
    const fillLevel = averageFill;
    
    // Weight and waste type metrics
    const totalWeight = binsWithLocations.reduce((sum, bin) => sum + (bin.current_weight || 0), 0);
    const organicBins = binsWithLocations.filter(bin => bin.waste_type === 'Organic (Bio-Degradable) Waste').length;
    const recyclableBins = binsWithLocations.filter(bin => bin.waste_type === 'Recyclable Waste').length;
    const nonRecyclableBins = binsWithLocations.filter(bin => bin.waste_type === 'Non-recyclable Waste').length;
    
    // Health metrics
    const healthyDevices = healthData.filter(device => device.healthStatus === 'healthy').length;
    const warningDevices = healthData.filter(device => device.healthStatus === 'warning').length;
    const criticalDevices = healthData.filter(device => device.healthStatus === 'critical').length;
    const totalHealthDevices = healthData.length;
    const deviceHealthScore = totalHealthDevices > 0 ? Math.round(((healthyDevices * 100) + (warningDevices * 50)) / totalHealthDevices) : 0;

    return {
      total,
      averageFill,
      gasAlerts,
      fallDetected,
      normal: normalBins,
      warning: warningBins,
      critical: criticalBins,
      efficiency,
      activeAlerts,
      collectionUrgency: criticalBins > 5 ? 'high' : warningBins > 10 ? 'medium' : 'low',
      healthScore: Math.round(((normalBins * 100) + (warningBins * 50) + (criticalBins * 0)) / total) || 0,
      fillLevel,
      totalWeight,
      organicBins,
      recyclableBins,
      nonRecyclableBins,
      // Health metrics
      healthyDevices,
      warningDevices,
      criticalDevices,
      totalHealthDevices,
      deviceHealthScore
    };
  }, [bins, alerts, binsWithLocations, healthData]);

  useEffect(() => {
    loadBins(true);
    const refreshTimer = setInterval(() => {
      loadBins(false);
    }, 3000); // 3 second refresh interval
    return () => clearInterval(refreshTimer);
  }, []);

  useEffect(() => {
    playAlertSound(metrics.critical);
  }, [metrics.critical, playAlertSound]);

  const districtMetrics = useMemo(() => {
    // Create districts from binDetails data
    const districts = {};
    binDetails.forEach(bin => {
      if (bin.location?.district) {
        const districtKey = bin.location.district.toLowerCase().replace(/\s+/g, '-');
        if (!districts[districtKey]) {
          districts[districtKey] = {
            name: bin.location.district
          };
        }
      }
    });
    
    const result = {};
    
    Object.keys(districts).forEach(districtKey => {
      const districtData = districts[districtKey];
      const districtBins = binsWithLocations.filter(bin => 
        bin.location?.district === districtData.name
      );
      
      result[districtKey] = {
        name: districtData.name,
        count: districtBins.length,
        averageFill: districtBins.length > 0 
          ? Math.round(districtBins.reduce((sum, bin) => sum + bin.fill_percentage, 0) / districtBins.length)
          : 0
      };
    });
    
    return result;
  }, [binsWithLocations, binDetails]);

  const fallenBins = useMemo(
    () => binsWithLocations.filter((bin) => bin.fall_detected),
    [binsWithLocations]
  );

  const fallenAlertKey = useMemo(
    () => fallenBins.map((bin) => bin.device_id).sort().join('|'),
    [fallenBins]
  );

  const showFallenDashboardAlert = fallenBins.length > 0 && dismissedFallAlertKey !== fallenAlertKey;

  const openDetailsModal = (type) => {
    const modalConfig = {
      total: {
        title: 'Total Bins',
        subtitle: 'All smart bins currently monitored',
        bins: binsWithLocations
      },
      averageFill: {
        title: 'Average Fill Rate',
        subtitle: 'Fill level details for all monitored bins',
        bins: [...binsWithLocations].sort((first, second) => second.fill_percentage - first.fill_percentage)
      },
      critical: {
        title: 'Critical Bins',
        subtitle: 'Bins that need urgent action',
        bins: binsWithLocations.filter((bin) => bin.uiStatus === 'critical' || bin.fill_percentage >= 90)
      },
      gas: {
        title: 'Gas Alerts',
        subtitle: 'Bins with high odour or gas alerts',
        bins: binsWithLocations.filter((bin) => bin.gas_alert)
      },
      fallen: {
        title: 'Fallen Bins',
        subtitle: 'Bins reporting fall detection',
        bins: fallenBins
      }
    };

    setDetailsModal(modalConfig[type]);
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
                  <Home className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Smart Waste Management</h1>
                  <p className="text-sm text-gray-600 mt-1">Real-time monitoring and analytics dashboard</p>
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
              <div className="flex items-center space-x-2 text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                <Clock className="w-4 h-4" />
                <span className="font-medium">{lastUpdate.toLocaleTimeString()}</span>
              </div>
              <button
                onClick={() => loadBins(true)}
                className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="font-medium">Refresh Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl p-8 text-center">
            <div className="inline-flex items-center space-x-3">
              <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
              <span className="text-gray-600 font-medium">Loading dashboard data...</span>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!loading && !error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {showFallenDashboardAlert && (
            <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-5 shadow-lg">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-red-500 p-3 text-white shadow-lg">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-red-800">Fallen bin alert</h3>
                    <p className="text-sm text-red-700 mt-1">
                      {fallenBins.length} bin{fallenBins.length === 1 ? '' : 's'} reported fall detection and need inspection.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {fallenBins.slice(0, 4).map((bin) => (
                        <span key={bin._id || bin.device_id} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-red-700 border border-red-200">
                          {bin.device_id}
                        </span>
                      ))}
                      {fallenBins.length > 4 && (
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-red-700 border border-red-200">
                          +{fallenBins.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setDismissedFallAlertKey(fallenAlertKey)}
                    className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50 transition-colors"
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    onClick={() => openDetailsModal('fallen')}
                    className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-700 transition-colors"
                  >
                    View fallen bins
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Key Metrics Overview */}
          <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">System Overview</h2>
                <p className="text-sm text-gray-600 mt-1">Real-time performance metrics and alerts</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">Live Data</span>
                </div>
                <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                  <span className="font-medium">Updated: {lastUpdate.toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
            
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              <KPICard 
                title="Total Bins" 
                value={metrics.total} 
                icon={Package} 
                subtitle="Monitored"
                description="All smart bins in system"
                status="safe"
                onClick={() => openDetailsModal('total')}
              />
              <KPICard 
                title="Avg Fill Rate" 
                value={metrics.averageFill} 
                icon={Gauge} 
                unit="%"
                subtitle="Current Level"
                description="Average fill percentage"
                status={metrics.averageFill >= 80 ? 'warning' : metrics.averageFill >= 60 ? 'safe' : 'safe'}
                trend={metrics.averageFill >= 80 ? 'up' : 'stable'}
                onClick={() => openDetailsModal('averageFill')}
              />
              <KPICard 
                title="Critical Bins" 
                value={metrics.critical} 
                icon={AlertTriangle} 
                subtitle="Urgent Action"
                description="Bins over 90% full"
                status={metrics.critical > 0 ? 'critical' : 'safe'}
                onClick={() => openDetailsModal('critical')}
              />
              <KPICard 
                title="Gas Alerts" 
                value={metrics.gasAlerts} 
                icon={Wind} 
                subtitle="Odour Detected"
                description="High odour levels"
                status={metrics.gasAlerts > 0 ? 'critical' : 'safe'}
                onClick={() => openDetailsModal('gas')}
              />
              <KPICard 
                title="Fallen Bins" 
                value={metrics.fallDetected} 
                icon={AlertTriangle} 
                subtitle="Fall Detected"
                description="Bins that have fallen"
                status={metrics.fallDetected > 0 ? 'critical' : 'safe'}
                onClick={() => openDetailsModal('fallen')}
              />
            </div>

            {/* Performance Summary Bar */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">System Performance</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Activity className="w-4 h-4" />
                  <span>Live Metrics</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{metrics.healthScore}%</div>
                  <div className="text-sm text-gray-600 mb-3">System Health</div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${
                        metrics.healthScore >= 80 ? 'bg-green-500' :
                        metrics.healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${metrics.healthScore}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{metrics.efficiency}%</div>
                  <div className="text-sm text-gray-600 mb-3">Operational Efficiency</div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${metrics.efficiency}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{metrics.totalWeight} kg</div>
                  <div className="text-sm text-gray-600 mb-3">Total Waste Weight</div>
                  <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full inline-block">
                    Across all bins
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-3xl font-bold mb-2 ${
                    metrics.collectionUrgency === 'high' ? 'text-red-600' :
                    metrics.collectionUrgency === 'medium' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {metrics.collectionUrgency.toUpperCase()}
                  </div>
                  <div className="text-sm text-gray-600 mb-3">Collection Priority</div>
                  <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                    metrics.collectionUrgency === 'high' ? 'bg-red-100 text-red-700' :
                    metrics.collectionUrgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {metrics.collectionUrgency === 'high' ? 'Immediate action required' :
                     metrics.collectionUrgency === 'medium' ? 'Schedule collection soon' :
                     'Normal operation'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Analytics Dashboard */}
          <div className="space-y-8">
            {/* Analytics Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Analytics & Insights</h2>
                <p className="text-sm text-gray-600 mt-1">Comprehensive data analysis and trends</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                  <span className="font-medium">{bins.length} bins analyzed</span>
                </div>
              </div>
            </div>

            {/* Top Analytics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Enhanced Status Overview Chart */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Status Distribution</h3>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Live</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Normal', value: metrics.normal, fill: COLORS.success },
                        { name: 'Warning', value: metrics.warning, fill: COLORS.warning },
                        { name: 'Critical', value: metrics.critical, fill: COLORS.danger }
                      ].filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      innerRadius={45}
                      dataKey="value"
                      label={({name, value, percent}) => {
                        const percentage = (percent * 100).toFixed(0);
                        return `${percentage}%`;
                      }}
                      labelLine={false}
                      labelPosition="outside"
                    >
                      {[
                        { name: 'Normal', value: metrics.normal, fill: COLORS.success },
                        { name: 'Warning', value: metrics.warning, fill: COLORS.warning },
                        { name: 'Critical', value: metrics.critical, fill: COLORS.danger }
                      ].filter(item => item.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({active, payload}) => {
                        if (active && payload && payload[0]) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                              <p className="font-semibold text-gray-900">{data.name}</p>
                              <p className="text-sm text-gray-600">Count: {data.value}</p>
                              <p className="text-sm text-gray-600">Percentage: {((data.value / (metrics.normal + metrics.warning + metrics.critical)) * 100).toFixed(1)}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Enhanced Legend */}
                <div className="mt-4 space-y-2">
                  {[
                    { name: 'Normal', value: metrics.normal, fill: COLORS.success, icon: '✓' },
                    { name: 'Warning', value: metrics.warning, fill: COLORS.warning, icon: '!' },
                    { name: 'Critical', value: metrics.critical, fill: COLORS.danger, icon: '⚠' }
                  ].filter(item => item.value > 0).map((item) => (
                    <div key={item.name} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{item.icon}</span>
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
                        <span className="text-sm font-medium text-gray-700">{item.name}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enhanced Alert Summary */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Alert Summary</h3>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Priority</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-gray-700">Critical</span>
                    </div>
                    <span className="text-lg font-bold text-red-600">{metrics.critical}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Warning</span>
                    </div>
                    <span className="text-lg font-bold text-yellow-600">{metrics.warning}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Normal</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">{metrics.normal}</span>
                  </div>
                  
                  {/* Special Alerts */}
                  {(metrics.gasAlerts > 0 || metrics.fallDetected > 0) && (
                    <div className="pt-3 border-t border-gray-200 space-y-2">
                      {metrics.gasAlerts > 0 && (
                        <div className="flex items-center justify-between p-2 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Wind className="w-4 h-4 text-orange-600" />
                            <span className="text-sm font-medium text-gray-700">Gas Alerts</span>
                          </div>
                          <span className="text-sm font-bold text-orange-600">{metrics.gasAlerts}</span>
                        </div>
                      )}
                      {metrics.fallDetected > 0 && (
                        <div className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-medium text-gray-700">Fall Detected</span>
                          </div>
                          <span className="text-sm font-bold text-red-600">{metrics.fallDetected}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Total */}
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Total Bins</span>
                      <span className="text-lg font-bold text-gray-900">{metrics.total}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Waste Type Distribution Chart */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Waste Type Distribution</h3>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Package className="w-3 h-3" />
                    <span>Categories</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Organic', value: metrics.organicBins, fill: '#10b981', description: 'Bio-degradable waste' },
                        { name: 'Recyclable', value: metrics.recyclableBins, fill: '#3b82f6', description: 'Reusable materials' },
                        { name: 'Non-Recyclable', value: metrics.nonRecyclableBins, fill: '#ef4444', description: 'Landfill waste' }
                      ].filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      innerRadius={45}
                      dataKey="value"
                      label={({name, value, percent}) => {
                        const percentage = (percent * 100).toFixed(0);
                        return `${percentage}%`;
                      }}
                      labelLine={false}
                      labelPosition="outside"
                    >
                      {[
                        { name: 'Organic', value: metrics.organicBins, fill: '#10b981' },
                        { name: 'Recyclable', value: metrics.recyclableBins, fill: '#3b82f6' },
                        { name: 'Non-Recyclable', value: metrics.nonRecyclableBins, fill: '#ef4444' }
                      ].filter(item => item.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({active, payload}) => {
                        if (active && payload && payload[0]) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                              <p className="font-semibold text-gray-900">{data.name}</p>
                              <p className="text-xs text-gray-500">{data.description}</p>
                              <p className="text-sm text-gray-600">Bins: {data.value}</p>
                              <p className="text-sm text-gray-600">Percentage: {((data.value / (metrics.organicBins + metrics.recyclableBins + metrics.nonRecyclableBins)) * 100).toFixed(1)}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Waste Type Legend */}
                <div className="mt-4 space-y-2">
                  {[
                    { name: 'Organic', value: metrics.organicBins, fill: '#10b981', icon: '🌱', description: 'Bio-degradable' },
                    { name: 'Recyclable', value: metrics.recyclableBins, fill: '#3b82f6', icon: '♻️', description: 'Reusable' },
                    { name: 'Non-Recyclable', value: metrics.nonRecyclableBins, fill: '#ef4444', icon: '🗑️', description: 'Landfill' }
                  ].filter(item => item.value > 0).map((item) => (
                    <div key={item.name} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{item.icon}</span>
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">{item.name}</span>
                          <p className="text-xs text-gray-500">{item.description}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Additional Analytics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Fill Level Distribution */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Fill Level Distribution</h3>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Gauge className="w-3 h-3" />
                    <span>Capacity</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[
                    { range: '0-30%', count: bins.filter(b => b.fill_percentage <= 30).length, fill: '#10b981' },
                    { range: '31-60%', count: bins.filter(b => b.fill_percentage > 30 && b.fill_percentage <= 60).length, fill: '#3b82f6' },
                    { range: '61-80%', count: bins.filter(b => b.fill_percentage > 60 && b.fill_percentage <= 80).length, fill: '#f59e0b' },
                    { range: '81-90%', count: bins.filter(b => b.fill_percentage > 80 && b.fill_percentage <= 90).length, fill: '#f59e0b' },
                    { range: '91-100%', count: bins.filter(b => b.fill_percentage > 90).length, fill: '#ef4444' }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="range" tick={{fontSize: 11}} />
                    <YAxis tick={{fontSize: 11}} />
                    <Tooltip 
                      content={({active, payload}) => {
                        if (active && payload && payload[0]) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                              <p className="font-semibold text-gray-900">{data.range}</p>
                              <p className="text-sm text-gray-600">Bins: {data.count}</p>
                              <p className="text-sm text-gray-600">Percentage: {((data.count / bins.length) * 100).toFixed(1)}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Weight Analysis */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Weight Analysis</h3>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Package className="w-3 h-3" />
                    <span>kg</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-700">{metrics.totalWeight}</div>
                      <div className="text-sm text-blue-600">Total Weight (kg)</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-700">
                        {bins.length > 0 ? Math.round(metrics.totalWeight / bins.length) : 0}
                      </div>
                      <div className="text-sm text-green-600">Avg Weight per Bin (kg)</div>
                    </div>
                  </div>
                  
                  {/* Weight by Waste Type */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">Weight by Waste Type</div>
                    {[
                      { type: 'Organic', weight: Math.round(metrics.totalWeight * 0.4), color: 'bg-green-500' },
                      { type: 'Recyclable', weight: Math.round(metrics.totalWeight * 0.35), color: 'bg-blue-500' },
                      { type: 'Non-Recyclable', weight: Math.round(metrics.totalWeight * 0.25), color: 'bg-red-500' }
                    ].map((item) => (
                      <div key={item.type} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                          <span className="text-sm text-gray-700">{item.type}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-gray-900">{item.weight} kg</span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`${item.color} h-2 rounded-full`}
                              style={{ width: `${(item.weight / metrics.totalWeight) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            </div>

            {/* District-wise Analysis Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">District Analysis</h2>
                  <p className="text-sm text-gray-600 mt-1">Geographic breakdown and performance by district</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                    <span className="font-medium">{Object.keys(districtMetrics).length} districts</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* District Performance Chart */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">District Fill Rates</h3>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      <span>Geographic</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={Object.entries(districtMetrics).map(([key, district]) => ({
                      name: district.name,
                      avgFill: district.averageFill,
                      count: district.count,
                      critical: binsWithLocations.filter(bin => 
                        bin.location?.district === district.name && bin.uiStatus === 'critical'
                      ).length
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        tick={{fontSize: 10, angle: -45, textAnchor: 'end', height: 60}} 
                        interval={0}
                      />
                      <YAxis tick={{fontSize: 11}} />
                      <Tooltip 
                        content={({active, payload}) => {
                          if (active && payload && payload[0]) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                                <p className="font-semibold text-gray-900">{data.name}</p>
                                <p className="text-sm text-gray-600">Avg Fill: {data.avgFill}%</p>
                                <p className="text-sm text-gray-600">Bins: {data.count}</p>
                                {data.critical > 0 && (
                                  <p className="text-sm text-red-600 font-medium">Critical: {data.critical}</p>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="avgFill" 
                        fill={COLORS.primary} 
                        radius={[6, 6, 0, 0]}
                        label={{ position: 'top', fontSize: 10, fill: '#666' }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* District Details Table */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">District Performance Details</h3>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <BarChart3 className="w-3 h-3" />
                      <span>Metrics</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(districtMetrics).map(([key, district]) => {
                      const districtBins = binsWithLocations.filter(bin => bin.location?.district === district.name);
                      const criticalCount = districtBins.filter(bin => bin.uiStatus === 'critical').length;
                      const warningCount = districtBins.filter(bin => bin.uiStatus === 'warning').length;
                      const normalCount = districtBins.filter(bin => bin.uiStatus === 'normal').length;
                      const fillStatus = district.averageFill >= 80 ? 'critical' : district.averageFill >= 60 ? 'warning' : 'safe';
                      
                      return (
                        <div 
                          key={key}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                            fillStatus === 'critical' ? 'border-red-200 bg-red-50' :
                            fillStatus === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                            'border-green-200 bg-green-50'
                          }`}
                          onClick={() => {
                            // TODO: Add drill-down functionality
                            console.log(`Drill down to ${district.name}`);
                          }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${
                                fillStatus === 'critical' ? 'bg-red-500' :
                                fillStatus === 'warning' ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}></div>
                              <h4 className="font-semibold text-gray-900">{district.name}</h4>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">{district.count} bins</span>
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-3">
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-900">{district.averageFill}%</div>
                              <div className="text-xs text-gray-500">Avg Fill</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-green-600">{normalCount}</div>
                              <div className="text-xs text-gray-500">Normal</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-yellow-600">{warningCount}</div>
                              <div className="text-xs text-gray-500">Warning</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-red-600">{criticalCount}</div>
                              <div className="text-xs text-gray-500">Critical</div>
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="mt-3">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  district.averageFill >= 80 ? 'bg-red-500' :
                                  district.averageFill >= 60 ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}
                                style={{ width: `${district.averageFill}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 gap-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <Clock className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">System operating normally</p>
                    <p className="text-xs text-gray-500">2 minutes ago</p>
                  </div>
                </div>
                {metrics.activeAlerts > 0 && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 animate-pulse"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{metrics.activeAlerts} alerts need attention</p>
                      <p className="text-xs text-gray-500">Just now</p>
                    </div>
                  </div>
                )}
                {metrics.critical > 0 && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 animate-pulse"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{metrics.critical} bins critical</p>
                      <p className="text-xs text-gray-500">Immediate action required</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Data refreshed</p>
                    <p className="text-xs text-gray-500">{lastUpdate.toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Health Status Section */}
          <div className="grid grid-cols-1 gap-6">
            <HealthStatus />
          </div>

          {/* Advanced Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Metrics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">System Performance</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Activity className="w-4 h-4" />
                  <span>Live Metrics</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{metrics.healthScore}%</div>
                  <div className="text-sm text-gray-500">System Health</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        metrics.healthScore >= 80 ? 'bg-green-500' :
                        metrics.healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${metrics.healthScore}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{metrics.collectionUrgency}</div>
                  <div className="text-sm text-gray-500">Collection Priority</div>
                  <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                    metrics.collectionUrgency === 'high' ? 'bg-red-100 text-red-700' :
                    metrics.collectionUrgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {metrics.collectionUrgency.toUpperCase()}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{metrics.efficiency}%</div>
                  <div className="text-sm text-gray-500">Operational Efficiency</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${metrics.efficiency}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fill Level Trends */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Fill Level Distribution</h3>
                <Gauge className="w-5 h-5 text-gray-400" />
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { range: '0-30%', count: bins.filter(b => b.fill_percentage <= 30).length, fill: COLORS.success },
                  { range: '31-60%', count: bins.filter(b => b.fill_percentage > 30 && b.fill_percentage <= 60).length, fill: COLORS.info },
                  { range: '61-80%', count: bins.filter(b => b.fill_percentage > 60 && b.fill_percentage <= 80).length, fill: COLORS.warning },
                  { range: '81-90%', count: bins.filter(b => b.fill_percentage > 80 && b.fill_percentage <= 90).length, fill: COLORS.warning },
                  { range: '91-100%', count: bins.filter(b => b.fill_percentage > 90).length, fill: COLORS.danger }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="range" tick={{fontSize: 11}} />
                  <YAxis tick={{fontSize: 11}} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {detailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-5xl max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-200">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-5">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{detailsModal.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{detailsModal.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetailsModal(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                aria-label="Close bin details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-xl bg-white border border-gray-200 px-4 py-3">
                  <p className="text-xs font-medium text-gray-500">Bins</p>
                  <p className="text-2xl font-bold text-gray-900">{detailsModal.bins.length}</p>
                </div>
                <div className="rounded-xl bg-white border border-gray-200 px-4 py-3">
                  <p className="text-xs font-medium text-gray-500">Avg Fill</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {detailsModal.bins.length
                      ? Math.round(detailsModal.bins.reduce((sum, bin) => sum + bin.fill_percentage, 0) / detailsModal.bins.length)
                      : 0}%
                  </p>
                </div>
                <div className="rounded-xl bg-white border border-gray-200 px-4 py-3">
                  <p className="text-xs font-medium text-gray-500">Gas Alerts</p>
                  <p className="text-2xl font-bold text-red-600">{detailsModal.bins.filter((bin) => bin.gas_alert).length}</p>
                </div>
                <div className="rounded-xl bg-white border border-gray-200 px-4 py-3">
                  <p className="text-xs font-medium text-gray-500">Fallen</p>
                  <p className="text-2xl font-bold text-red-600">{detailsModal.bins.filter((bin) => bin.fall_detected).length}</p>
                </div>
              </div>
            </div>

            <div className="overflow-auto max-h-[52vh]">
              {detailsModal.bins.length ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-white sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Device</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Fill</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Predicted</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Gas</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {detailsModal.bins.map((bin) => {
                      const fillColor = bin.fill_percentage >= 90
                        ? 'text-red-700 bg-red-50'
                        : bin.fill_percentage >= 70
                          ? 'text-yellow-700 bg-yellow-50'
                          : 'text-green-700 bg-green-50';

                      return (
                        <tr key={bin._id || bin.device_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">{bin.device_id}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <div className="font-medium text-gray-800">{bin.location?.name || bin.location?.address || 'Unknown Location'}</div>
                            <div className="text-xs text-gray-500">{bin.location?.district || bin.location?.area || 'Location not mapped'}</div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${fillColor}`}>
                              {bin.fill_percentage}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {Number.isFinite(bin.predicted_next_fill) ? `${Math.round(bin.predicted_next_fill)}%` : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {bin.gas ?? '-'} {bin.gas_alert && <span className="ml-2 text-xs font-bold text-red-600">Alert</span>}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            <div>{bin.fill_status || 'UNKNOWN'}</div>
                            {bin.fall_detected && <div className="text-xs font-bold text-red-600">Fall detected</div>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm font-medium text-gray-700">No bins found for this card.</p>
                  <p className="text-sm text-gray-500 mt-1">Live data will appear here when matching readings arrive.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatusRow = ({ label, value, color, total = null }) => (
  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
    <div className="flex items-center space-x-3">
      <div className={`w-3 h-3 ${color} rounded-full shadow-sm`} />
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </div>
    <div className="flex items-center space-x-2">
      <span className="text-sm font-bold text-gray-800">
        {(() => {
          if (typeof value === 'string' || typeof value === 'number') {
            return value;
          }
          if (typeof value === 'object' && value !== null) {
            if (value.name) return value.name;
            if (value.text) return value.text;
            if (Array.isArray(value)) return value.length;
            return String(Object.keys(value)[0] || 'Object');
          }
          return String(value || '0');
        })()}
      </span>
      {total && typeof value === 'number' && (
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {Math.round((value / total) * 100)}%
        </span>
      )}
    </div>
  </div>
);

export default Dashboard;
