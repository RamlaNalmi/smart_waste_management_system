import React, { useState } from 'react';
import { binData } from '../data/dummyData';
import { Search, Filter, Download, Eye, EyeOff, Calendar, MapPin, TrendingUp, AlertTriangle, Package, Settings } from 'lucide-react';
import BinStatusTable from './BinStatusTable';

const BinOverview = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    fillRange: 'all',
    location: 'all'
  });

  const filteredBins = binData.filter(bin => {
    const matchesSearch = bin.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bin.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filters.status === 'all' || bin.status === filters.status;
    
    const matchesFill = filters.fillRange === 'all' || 
                       (filters.fillRange === 'low' && bin.fillLevel < 40) ||
                       (filters.fillRange === 'medium' && bin.fillLevel >= 40 && bin.fillLevel < 70) ||
                       (filters.fillRange === 'high' && bin.fillLevel >= 70);
    
    const matchesLocation = filters.location === 'all' || 
                           bin.location.toLowerCase().includes(filters.location.toLowerCase());
    
    return matchesSearch && matchesStatus && matchesFill && matchesLocation;
  });

  const exportData = () => {
    const csvContent = [
      ['Bin ID', 'Location', 'Fill Level', 'Weight (kg)', 'Odor Level', 'Temperature', 'Humidity', 'Status', 'Last Collection'],
      ...filteredBins.map(bin => [
        bin.id,
        bin.location,
        bin.fillLevel,
        bin.weight,
        bin.odorLevel,
        bin.temperature,
        bin.humidity,
        bin.status,
        bin.lastCollection
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'bin_overview.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-dark-blue">Bin Overview</h1>
        <p className="text-grey mt-1">Comprehensive view of all smart bins and their current status</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-grey" />
              <input
                type="text"
                placeholder="Search by bin ID or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-light-grey transition-colors"
            >
              <Filter className="w-4 h-4 text-dark-blue" />
              <span className="text-sm text-dark-blue">Filters</span>
              {(filters.status !== 'all' || filters.fillRange !== 'all' || filters.location !== 'all') && (
                <span className="w-2 h-2 bg-steel-blue rounded-full"></span>
              )}
            </button>

            <button
              onClick={exportData}
              className="flex items-center space-x-2 px-4 py-2 bg-steel-blue text-white rounded-lg hover:bg-civic-blue transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">Export</span>
            </button>
          </div>

          <div className="text-sm text-grey">
            Showing {filteredBins.length} of {binData.length} bins
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-blue mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
                >
                  <option value="all">All Status</option>
                  <option value="normal">Normal</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-blue mb-2">Fill Level Range</label>
                <select
                  value={filters.fillRange}
                  onChange={(e) => setFilters({...filters, fillRange: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
                >
                  <option value="all">All Levels</option>
                  <option value="low">Low (&lt;40%)</option>
                  <option value="medium">Medium (40-70%)</option>
                  <option value="high">High (&gt;70%)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-blue mb-2">Location</label>
                <input
                  type="text"
                  placeholder="Filter by location..."
                  value={filters.location === 'all' ? '' : filters.location}
                  onChange={(e) => setFilters({...filters, location: e.target.value || 'all'})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-grey">Total Bins</p>
              <p className="text-2xl font-bold text-dark-blue">{filteredBins.length}</p>
            </div>
            <div className="w-12 h-12 bg-steel-blue rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-grey">Critical Bins</p>
              <p className="text-2xl font-bold text-critical">
                {filteredBins.filter(b => b.status === 'critical').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-critical rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">!</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-grey">Avg Fill Level</p>
              <p className="text-2xl font-bold text-dark-blue">
                {filteredBins.length > 0 
                  ? Math.round(filteredBins.reduce((sum, bin) => sum + bin.fillLevel, 0) / filteredBins.length)
                  : 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-healthy rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-grey">Total Weight</p>
              <p className="text-2xl font-bold text-dark-blue">
                {filteredBins.reduce((sum, bin) => sum + bin.weight, 0).toFixed(1)} kg
              </p>
            </div>
            <div className="w-12 h-12 bg-odor rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">kg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bin Status Table */}
      <BinStatusTable 
        limit={null} 
        data={filteredBins} 
      />
    </div>
  );
};

export default BinOverview;
