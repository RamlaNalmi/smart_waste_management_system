import React, { useState, useMemo } from 'react';
import { binData } from '../data/dummyData';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import BinDetails from './BinDetails';

const BinStatusTable = ({ limit = null, data = null }) => {
  const tableData = data || binData;
  const [sortConfig, setSortConfig] = useState({ key: 'fillLevel', direction: 'desc' });
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBin, setSelectedBin] = useState(null);

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

  const getStatusTextColor = (status) => {
    switch (status) {
      case 'normal':
        return 'text-healthy';
      case 'warning':
        return 'text-warning';
      case 'critical':
        return 'text-critical';
      default:
        return 'text-grey';
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedData = useMemo(() => {
    let filtered = tableData;
    
    if (filterStatus !== 'all') {
      filtered = tableData.filter(bin => bin.status === filterStatus);
    }

    return [...filtered].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filterStatus, sortConfig]);

  const displayData = limit ? filteredAndSortedData.slice(0, limit) : filteredAndSortedData;

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="w-4 h-4 text-grey" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-steel-blue" />
      : <ArrowDown className="w-4 h-4 text-steel-blue" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-card p-4">
      {selectedBin && (
        <BinDetails 
          bin={selectedBin} 
          onClose={() => setSelectedBin(null)} 
        />
      )}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-dark-blue">Bin Status</h3>
        {!limit && (
          <div className="flex items-center space-x-2">
            <label className="text-sm text-grey">Filter:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-steel-blue"
            >
              <option value="all">All Bins</option>
              <option value="normal">Normal</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2">
                <button
                  onClick={() => handleSort('id')}
                  className="flex items-center space-x-1 text-sm font-medium text-dark-blue hover:text-steel-blue"
                >
                  <span>Bin ID</span>
                  {getSortIcon('id')}
                </button>
              </th>
              <th className="text-left py-3 px-2">
                <button
                  onClick={() => handleSort('location')}
                  className="flex items-center space-x-1 text-sm font-medium text-dark-blue hover:text-steel-blue"
                >
                  <span>Location</span>
                  {getSortIcon('location')}
                </button>
              </th>
              <th className="text-left py-3 px-2">
                <button
                  onClick={() => handleSort('fillLevel')}
                  className="flex items-center space-x-1 text-sm font-medium text-dark-blue hover:text-steel-blue"
                >
                  <span>Fill Level</span>
                  {getSortIcon('fillLevel')}
                </button>
              </th>
              <th className="text-left py-3 px-2">
                <button
                  onClick={() => handleSort('weight')}
                  className="flex items-center space-x-1 text-sm font-medium text-dark-blue hover:text-steel-blue"
                >
                  <span>Weight</span>
                  {getSortIcon('weight')}
                </button>
              </th>
              <th className="text-left py-3 px-2">
                <button
                  onClick={() => handleSort('odorLevel')}
                  className="flex items-center space-x-1 text-sm font-medium text-dark-blue hover:text-steel-blue"
                >
                  <span>Odor</span>
                  {getSortIcon('odorLevel')}
                </button>
              </th>
              <th className="text-left py-3 px-2">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center space-x-1 text-sm font-medium text-dark-blue hover:text-steel-blue"
                >
                  <span>Status</span>
                  {getSortIcon('status')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((bin) => (
              <tr 
                key={bin.id}
                onClick={() => setSelectedBin(bin)}
                className="border-b border-gray-200 hover:bg-light-grey cursor-pointer transition-colors"
              >
                <td className="py-3 px-2">
                  <span className="text-sm font-medium text-dark-blue">{bin.id}</span>
                </td>
                <td className="py-3 px-2">
                  <span className="text-sm text-grey">{bin.location}</span>
                </td>
                <td className="py-3 px-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          bin.fillLevel > 80 ? 'bg-critical' :
                          bin.fillLevel > 60 ? 'bg-warning' : 'bg-healthy'
                        }`}
                        style={{ width: `${bin.fillLevel}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-dark-blue">{bin.fillLevel}%</span>
                  </div>
                </td>
                <td className="py-3 px-2">
                  <span className="text-sm text-dark-blue">{bin.weight} kg</span>
                </td>
                <td className="py-3 px-2">
                  <span className="text-sm text-dark-blue">{bin.odorLevel}</span>
                </td>
                <td className="py-3 px-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bin.status)} text-white`}>
                    {bin.status.charAt(0).toUpperCase() + bin.status.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!limit && (
        <div className="mt-4 text-sm text-grey">
          Showing {displayData.length} of {tableData.length} bins
        </div>
      )}
    </div>
  );
};

export default BinStatusTable;
