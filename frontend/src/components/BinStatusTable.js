import React, { useMemo, useState, useCallback } from 'react';
import { 
  ArrowDown, 
  ArrowUp, 
  ArrowUpDown, 
  MapPin, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle, 
  Package, 
  Wind, 
  Gauge, 
  Clock, 
  MoreVertical,
  Eye,
  Edit,
  Trash,
  Bell,
  Truck,
  Settings
} from 'lucide-react';
import BinDetails from './BinDetails';
import { getBinLocationFromDetails } from '../services/api';

const EMPTY_TABLE_DATA = [];

const BinStatusTable = ({ limit = null, data = null, binDetails = [], sensorData = [] }) => {
  // Merge bin_details with sensor data for complete bin information
  const mergedBinData = useMemo(() => {
    return binDetails.map(binDetail => {
      const sensor = sensorData.find(sensor => sensor.device_id === binDetail.device_id);
      return {
        // Bin details data
        device_id: binDetail.device_id,
        height: binDetail.height,
        location: binDetail.location,
        createdAt: binDetail.createdAt,
        updatedAt: binDetail.updatedAt,
        
        // Essential sensor fields (from actual API structure)
        id: sensor?._id || binDetail.device_id,
        fill_percentage: sensor?.fill_percentage || 0,
        fill_status: sensor?.fill_status || 'LOW',
        fill_distance: sensor?.distance || 0,
        usage_count: sensor?.usage_count || 0, // may not exist in API
        odor_status: sensor?.odor_status || 'Fresh', // may not exist in API
        
        // Additional sensor data (from actual API)
        gas: sensor?.gas || 0,
        gas_alert: sensor?.gas_alert || false,
        angleX: sensor?.angleX || 0,
        angleY: sensor?.angleY || 0,
        fall_detected: sensor?.fall_detected || false,
        bin_weight: sensor?.bin_weight || 0,
        timestamp: sensor?.timestamp || new Date().toISOString(),
        received_at: sensor?.received_at || new Date().toISOString(),
        topic: sensor?.topic || 'iot/smartbin/data',
        
        // UI Status calculation
        uiStatus: sensor?.uiStatus || (
          (sensor?.fill_percentage || 0) >= 90 ? 'critical' :
          (sensor?.fill_percentage || 0) >= 70 ? 'warning' : 'normal'
        )
      };
    });
  }, [binDetails, sensorData]);

  const tableData = useMemo(() => data || mergedBinData, [data, mergedBinData]);
  const [sortConfig, setSortConfig] = useState({ key: 'received_at', direction: 'desc' });
  const [filters, setFilters] = useState({
    status: 'all',
    wasteType: 'all',
    district: 'all',
    fillLevel: 'all',
    search: ''
  });
  const [selectedBin, setSelectedBin] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [showActions, setShowActions] = useState(null);
  
  const itemsPerPage = limit || 10;

  const handleSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getStatusColor = (status) => {
    if (status === 'critical') return 'bg-critical';
    if (status === 'warning') return 'bg-warning';
    return 'bg-healthy';
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown className="w-4 h-4 text-grey" />;
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="w-4 h-4 text-steel-blue" />
      : <ArrowDown className="w-4 h-4 text-steel-blue" />;
  };

  const filteredAndSortedData = useMemo(() => {
    let filtered = tableData;
    
    // Apply filters
    if (filters.status !== 'all') {
      filtered = filtered.filter((reading) => (reading.uiStatus || 'normal') === filters.status);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((reading) => {
        const location = getBinLocationFromDetails(reading.device_id, binDetails);
        return (
          reading.device_id.toLowerCase().includes(searchLower) ||
          (location && location.name.toLowerCase().includes(searchLower)) ||
          (location && location.district.toLowerCase().includes(searchLower)) ||
          (location && location.area.toLowerCase().includes(searchLower))
        );
      });
    }
    
    if (filters.wasteType !== 'all') {
      filtered = filtered.filter((reading) => {
        const location = getBinLocationFromDetails(reading.device_id, binDetails);
        return location && location.waste_type === filters.wasteType;
      });
    }
    
    if (filters.district !== 'all') {
      filtered = filtered.filter((reading) => {
        const location = getBinLocationFromDetails(reading.device_id, binDetails);
        return location && location.district === filters.district;
      });
    }
    
    if (filters.fillLevel !== 'all') {
      filtered = filtered.filter((reading) => {
        const fill = reading.fill_percentage;
        switch (filters.fillLevel) {
          case 'low': return fill <= 30;
          case 'medium': return fill > 30 && fill <= 70;
          case 'high': return fill > 70 && fill <= 90;
          case 'critical': return fill > 90;
          default: return true;
        }
      });
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      const aValue = a[sortConfig.key] ?? '';
      const bValue = b[sortConfig.key] ?? '';

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filters, sortConfig, tableData]);

  const displayData = limit 
    ? filteredAndSortedData.slice(0, limit) 
    : filteredAndSortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  
  const availableFilters = useMemo(() => {
    const districts = [...new Set(tableData.map(item => {
      const location = getBinLocationFromDetails(item.device_id, binDetails);
      return location?.district || 'Unknown';
    }))].filter(Boolean);
    
    const wasteTypes = [...new Set(tableData.map(item => {
      const location = getBinLocationFromDetails(item.device_id, binDetails);
      return location?.waste_type || 'Unknown';
    }))].filter(Boolean);
    
    return { districts, wasteTypes };
  }, [tableData, binDetails]);
  
  const clearFilters = useCallback(() => {
    setFilters({
      status: 'all',
      wasteType: 'all',
      district: 'all',
      fillLevel: 'all',
      search: ''
    });
    setCurrentPage(1);
  }, []);
  
  const hasActiveFilters = Object.values(filters).some(value => value !== 'all' && value !== '');

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
      {selectedBin && <BinDetails bin={selectedBin} onClose={() => setSelectedBin(null)} />}

      {/* Enhanced Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Bin Overview</h3>
            <p className="text-sm text-gray-600 mt-1">Comprehensive bin monitoring and management</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
              <span className="font-medium">{filteredAndSortedData.length} bins</span>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span className="font-medium">Filters</span>
              {hasActiveFilters && (
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  {Object.values(filters).filter(v => v !== 'all' && v !== '').length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by device ID, location, district..."
            value={filters.search}
            onChange={(e) => {
              setFilters(prev => ({ ...prev, search: e.target.value }));
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Advanced Filters</h4>
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, status: e.target.value }));
                    setCurrentPage(1);
                  }}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="normal">Normal</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              
              {/* Waste Type Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Waste Type</label>
                <select
                  value={filters.wasteType}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, wasteType: e.target.value }));
                    setCurrentPage(1);
                  }}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  {availableFilters.wasteTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              {/* District Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">District</label>
                <select
                  value={filters.district}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, district: e.target.value }));
                    setCurrentPage(1);
                  }}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Districts</option>
                  {availableFilters.districts.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>
              
              {/* Fill Level Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Fill Level</label>
                <select
                  value={filters.fillLevel}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, fillLevel: e.target.value }));
                    setCurrentPage(1);
                  }}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Levels</option>
                  <option value="low">Low (0-30%)</option>
                  <option value="medium">Medium (31-70%)</option>
                  <option value="high">High (71-90%)</option>
                  <option value="critical">Critical (91-100%)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Clean Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {[
                ['device_id', 'Device ID', 'left'],
                ['location', 'Location', 'left'],
                ['waste_type', 'Waste Type', 'left'],
                ['fill_percentage', 'Fill Level', 'center'],
                ['predicted_next_fill', 'Next Fill', 'center'],
                ['fill_distance', 'Distance', 'center'],
                ['gas', 'Gas', 'center'],
                ['status', 'Status', 'center'],
                ['last_update', 'Last Update', 'left']
              ].map(([key, label, align]) => (
                <th key={key} className={`py-3 px-4 text-${align}`}>
                  <button
                    onClick={() => handleSort(key)}
                    className="flex items-center space-x-1 text-xs font-medium text-gray-700 uppercase tracking-wider hover:text-blue-600 transition-colors"
                  >
                    <span>{label}</span>
                    {getSortIcon(key)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {displayData.map((reading, index) => {
              const location = getBinLocationFromDetails(reading.device_id, binDetails);
              const hasGasAlert = reading.gas_alert;
              const hasFallAlert = reading.fall_detected;
              
              return (
                <tr
                  key={reading.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedBin(reading)}
                >
                  {/* Device ID */}
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`w-2 h-2 rounded-full ${
                          reading.uiStatus === 'critical' ? 'bg-red-500' :
                          reading.uiStatus === 'warning' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}></div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{reading.device_id}</div>
                        <div className="text-xs text-gray-500">{reading.height}cm</div>
                      </div>
                    </div>
                  </td>
                  
                  {/* Location */}
                  <td className="py-3 px-4">
                    {location ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">{location.name}</div>
                        <div className="text-xs text-gray-500">{location.address}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Unknown Location</span>
                    )}
                  </td>
                  
                  {/* Waste Type */}
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      location?.waste_type === 'Organic (Bio-Degradable) Waste' ? 'bg-green-100 text-green-800' :
                      location?.waste_type === 'Recyclable Waste' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {location?.waste_type || 'Unknown'}
                    </span>
                  </td>
                  
                  {/* Fill Level */}
                  <td className="py-3 px-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <span className={`text-sm font-medium ${
                          reading.fill_percentage >= 90 ? 'text-red-600' :
                          reading.fill_percentage >= 70 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {reading.fill_percentage}%
                        </span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              reading.fill_percentage >= 90 ? 'bg-red-500' :
                              reading.fill_percentage >= 70 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${reading.fill_percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">{reading.fill_status}</div>
                    </div>
                  </td>

                  {/* Predicted Next Fill */}
                  <td className="py-4 px-4">
                    <div className="text-center">
                      {Number.isFinite(reading.predicted_next_fill) ? (
                        <>
                          <div className={`text-lg font-bold ${
                            reading.predicted_next_fill >= 90 ? 'text-red-600' :
                            reading.predicted_next_fill >= 70 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {Math.round(reading.predicted_next_fill)}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {reading.predicted_fill_status || 'Predicted'}
                          </div>
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                  
                  {/* Distance */}
                  <td className="py-3 px-4">
                    <div className="text-center">
                      <span className="text-sm font-medium text-gray-900">
                        {reading.fill_distance} cm
                      </span>
                    </div>
                  </td>
                  
                  {/* Gas */}
                  <td className="py-3 px-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <span className="text-sm font-medium text-gray-900">
                          {reading.gas}
                        </span>
                        {hasGasAlert && (
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  {/* Status */}
                  <td className="py-3 px-4">
                    <div className="text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        reading.uiStatus === 'critical' ? 'bg-red-100 text-red-700' :
                        reading.uiStatus === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {(reading.uiStatus || 'normal').toUpperCase()}
                      </span>
                      {hasFallAlert && (
                        <div className="mt-1">
                          <AlertTriangle className="w-3 h-3 text-red-500 mx-auto" />
                        </div>
                      )}
                    </div>
                  </td>
                  
                  {/* Last Update */}
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-900">
                      {reading.received_at ? new Date(reading.received_at).toLocaleString() : '-'}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Enhanced Footer with Pagination */}
      {!limit && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)}
              </span>{' '}
              of <span className="font-medium">{filteredAndSortedData.length}</span> results
              {filteredAndSortedData.length !== tableData.length && (
                <span className="text-gray-500 ml-2">
                  (filtered from {tableData.length} total)
                </span>
              )}
            </div>
            
            {/* Pagination Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 text-sm border rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Items per page selector */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Items per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  const newItemsPerPage = parseInt(e.target.value);
                  // This would need to be passed up to parent component
                  console.log('Change items per page to:', newItemsPerPage);
                }}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Normal: {tableData.filter(b => b.uiStatus === 'normal').length}</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-600">Warning: {tableData.filter(b => b.uiStatus === 'warning').length}</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-gray-600">Critical: {tableData.filter(b => b.uiStatus === 'critical').length}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BinStatusTable;
