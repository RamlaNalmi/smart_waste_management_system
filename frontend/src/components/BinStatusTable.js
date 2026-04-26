import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import BinDetails from './BinDetails';

const EMPTY_TABLE_DATA = [];

const BinStatusTable = ({ limit = null, data = null }) => {
  const tableData = useMemo(() => data || EMPTY_TABLE_DATA, [data]);
  const [sortConfig, setSortConfig] = useState({ key: 'received_at', direction: 'desc' });
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBin, setSelectedBin] = useState(null);

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
    const filtered = filterStatus === 'all'
      ? tableData
      : tableData.filter((reading) => reading.uiStatus === filterStatus);

    return [...filtered].sort((a, b) => {
      const aValue = a[sortConfig.key] ?? '';
      const bValue = b[sortConfig.key] ?? '';

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filterStatus, sortConfig, tableData]);

  const displayData = limit ? filteredAndSortedData.slice(0, limit) : filteredAndSortedData;

  return (
    <div className="bg-white rounded-lg shadow-card p-4">
      {selectedBin && <BinDetails bin={selectedBin} onClose={() => setSelectedBin(null)} />}

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-dark-blue">Database Readings</h3>
        {!limit && (
          <div className="flex items-center space-x-2">
            <label className="text-sm text-grey">Filter:</label>
            <select
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-steel-blue"
            >
              <option value="all">All</option>
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
              {[
                ['device_id', 'Device ID'],
                ['location', 'Location'],
                ['distance', 'Distance'],
                ['bin_weight', 'Weight'],
                ['fill_percentage', 'Fill %'],
                ['fill_status', 'Fill Status'],
                ['gas', 'Gas'],
                ['received_at', 'Received At'],
                ['uiStatus', 'Alert Level']
              ].map(([key, label]) => (
                <th key={key} className="text-left py-3 px-2">
                  <button
                    onClick={() => handleSort(key)}
                    className="flex items-center space-x-1 text-sm font-medium text-dark-blue hover:text-steel-blue"
                  >
                    <span>{label}</span>
                    {getSortIcon(key)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.map((reading) => (
              <tr
                key={reading.id}
                onClick={() => setSelectedBin(reading)}
                className="border-b border-gray-200 hover:bg-light-grey cursor-pointer transition-colors"
              >
                <td className="py-3 px-2 text-sm font-medium text-dark-blue">{reading.device_id}</td>
                <td className="py-3 px-2 text-sm text-dark-blue max-w-[220px] truncate" title={reading.location || '-'}>
                  {reading.location || '-'}
                </td>
                <td className="py-3 px-2 text-sm text-dark-blue">{reading.distance ?? '-'}</td>
                <td className="py-3 px-2 text-sm text-dark-blue">
                  {reading.bin_weight === null ? '-' : `${reading.bin_weight} kg`}
                </td>
                <td className="py-3 px-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          reading.fill_percentage >= 90 ? 'bg-critical' :
                          reading.fill_percentage >= 70 ? 'bg-warning' : 'bg-healthy'
                        }`}
                        style={{ width: `${reading.fill_percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-dark-blue">{reading.fill_percentage}%</span>
                  </div>
                </td>
                <td className="py-3 px-2 text-sm text-dark-blue">{reading.fill_status}</td>
                <td className="py-3 px-2 text-sm text-dark-blue">{reading.gas ?? '-'}</td>
                <td className="py-3 px-2 text-sm text-grey">
                  {reading.received_at ? new Date(reading.received_at).toLocaleString() : '-'}
                </td>
                <td className="py-3 px-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reading.uiStatus)} text-white`}>
                    {reading.uiStatus}
                  </span>
                </td>
              </tr>
            ))}
            {displayData.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-sm text-grey">
                  No database readings match this view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!limit && (
        <div className="mt-4 text-sm text-grey">
          Showing {displayData.length} of {tableData.length} database readings
        </div>
      )}
    </div>
  );
};

export default BinStatusTable;
