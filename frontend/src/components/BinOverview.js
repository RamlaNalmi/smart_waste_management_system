import React, { useEffect, useMemo, useState } from 'react';
import { Download, Plus, Search, X } from 'lucide-react';
import BinStatusTable from './BinStatusTable';
import { createRegisteredBin, fetchBins, fetchNextDeviceId, fetchRegisteredBins } from '../services/api';

const BinOverview = () => {
  const [bins, setBins] = useState([]);
  const [registeredBins, setRegisteredBins] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [newBin, setNewBin] = useState({
    device_id: '',
    height: '',
    address: '',
    latitude: '',
    longitude: ''
  });

  const loadBins = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setError('');
      const [readings, registrations] = await Promise.all([
        fetchBins(),
        fetchRegisteredBins()
      ]);
      setBins(readings);
      setRegisteredBins(registrations);
    } catch (err) {
      setError(err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadBins(true);
    const refreshTimer = setInterval(() => loadBins(false), 5000);
    return () => clearInterval(refreshTimer);
  }, []);

  const openRegisterForm = async () => {
    try {
      setFormError('');
      const nextDevice = await fetchNextDeviceId();
      setNewBin((current) => ({ ...current, device_id: nextDevice.device_id }));
      setShowRegisterForm(true);
    } catch (err) {
      setFormError(err.message);
      setShowRegisterForm(true);
    }
  };

  const filteredBins = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return bins.filter((reading) =>
      reading.device_id.toLowerCase().includes(query) ||
      reading.fill_status.toLowerCase().includes(query) ||
      reading.topic.toLowerCase().includes(query)
    );
  }, [bins, searchTerm]);

  const exportData = () => {
    const csvContent = [
      ['_id', 'device_id', 'distance', 'fill_percentage', 'fill_status', 'gas', 'gas_alert', 'angleX', 'angleY', 'fall_detected', 'timestamp', 'topic', 'received_at'],
      ...filteredBins.map((reading) => [
        reading.id,
        reading.device_id,
        reading.distance ?? '',
        reading.fill_percentage,
        reading.fill_status,
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

  const averageFill = filteredBins.length
    ? Math.round(filteredBins.reduce((sum, reading) => sum + reading.fill_percentage, 0) / filteredBins.length)
    : 0;

  const registerBin = async (event) => {
    event.preventDefault();

    try {
      setFormError('');
      await createRegisteredBin({
        height: Number(newBin.height),
        location: {
          address: newBin.address,
          latitude: Number(newBin.latitude),
          longitude: Number(newBin.longitude)
        }
      });

      setNewBin({
        device_id: '',
        height: '',
        address: '',
        latitude: '',
        longitude: ''
      });
      setShowRegisterForm(false);
      await loadBins(false);
    } catch (err) {
      setFormError(err.message);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-blue">Database Readings</h1>
          <p className="text-grey mt-1">IoT readings plus a separate registered-bin table for height and map location</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openRegisterForm}
            className="flex items-center space-x-2 px-4 py-2 bg-steel-blue text-white rounded-lg hover:bg-civic-blue transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">Add Bin</span>
          </button>
          <button
            onClick={exportData}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-200 bg-white text-dark-blue rounded-lg hover:bg-light-grey transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Export</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && <div className="text-sm text-grey">Loading readings from database...</div>}

      {showRegisterForm && (
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-dark-blue">Add Registered Bin</h3>
              <p className="text-sm text-grey">The device_id is generated automatically. Use it in the ESP32 payload for this bin.</p>
            </div>
            <button onClick={() => setShowRegisterForm(false)} className="text-grey hover:text-dark-blue">
              <X className="w-5 h-5" />
            </button>
          </div>

          {formError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <form onSubmit={registerBin} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-blue mb-2">Device ID</label>
              <div className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-light-grey text-dark-blue font-mono">
                {newBin.device_id || 'Generating...'}
              </div>
            </div>
            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-dark-blue mb-2">Location Address</label>
              <input
                value={newBin.address}
                onChange={(event) => setNewBin({ ...newBin, address: event.target.value })}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
                placeholder="Example: SLIIT Main Building"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-blue mb-2">Height (cm)</label>
              <input
                type="number"
                min="1"
                value={newBin.height}
                onChange={(event) => setNewBin({ ...newBin, height: event.target.value })}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-blue mb-2">Latitude</label>
              <input
                type="number"
                step="any"
                value={newBin.latitude}
                onChange={(event) => setNewBin({ ...newBin, latitude: event.target.value })}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-blue mb-2">Longitude</label>
              <input
                type="number"
                step="any"
                value={newBin.longitude}
                onChange={(event) => setNewBin({ ...newBin, longitude: event.target.value })}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full px-4 py-2 bg-steel-blue text-white rounded-lg hover:bg-civic-blue transition-colors">
                Save Bin
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-grey" />
            <input
              type="text"
              placeholder="Search by device, fill status, or topic..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue"
            />
          </div>

          <div className="text-sm text-grey">
            Showing {filteredBins.length} of {bins.length} readings
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard label="Total Readings" value={filteredBins.length} />
        <SummaryCard label="Average Fill" value={`${averageFill}%`} />
        <SummaryCard label="Gas Alerts" value={filteredBins.filter((reading) => reading.gas_alert).length} />
        <SummaryCard label="Fall Detected" value={filteredBins.filter((reading) => reading.fall_detected).length} />
      </div>

      <div className="bg-white rounded-lg shadow-card p-4">
        <h3 className="text-lg font-semibold text-dark-blue mb-4">Registered Bins</h3>
        {registeredBins.length === 0 ? (
          <p className="text-sm text-grey">No registered bins yet. Add a bin to place it on the map.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-sm font-medium text-dark-blue">Device ID</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-dark-blue">Height</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-dark-blue">Address</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-dark-blue">Latitude</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-dark-blue">Longitude</th>
                </tr>
              </thead>
              <tbody>
                {registeredBins.map((bin) => (
                  <tr key={bin.id} className="border-b border-gray-200">
                    <td className="py-3 px-2 text-sm font-medium text-dark-blue">{bin.device_id}</td>
                    <td className="py-3 px-2 text-sm text-dark-blue">{bin.height} cm</td>
                    <td className="py-3 px-2 text-sm text-grey">{bin.address}</td>
                    <td className="py-3 px-2 text-sm text-dark-blue">{bin.latitude}</td>
                    <td className="py-3 px-2 text-sm text-dark-blue">{bin.longitude}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <BinStatusTable data={filteredBins} />
    </div>
  );
};

const SummaryCard = ({ label, value }) => (
  <div className="bg-white rounded-lg shadow-card p-4">
    <p className="text-sm text-grey">{label}</p>
    <p className="text-2xl font-bold text-dark-blue">{value}</p>
  </div>
);

export default BinOverview;
