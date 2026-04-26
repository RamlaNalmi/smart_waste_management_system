import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, Search, Bell, X } from 'lucide-react';
import { acknowledgeAlert as acknowledgeAlertRequest, deleteAlert as deleteAlertRequest, fetchAlerts } from '../services/api';

const Alerts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAlerts = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setError('');
      setAlerts(await fetchAlerts());
    } catch (err) {
      setError(err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts(true);
    const refreshTimer = setInterval(() => loadAlerts(false), 5000);
    return () => clearInterval(refreshTimer);
  }, []);

  const filteredAlerts = useMemo(() => alerts.filter(alert => {
    const matchesSearch = alert.device_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || alert.type === filterType;
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'acknowledged' && alert.acknowledged) ||
      (filterStatus === 'unacknowledged' && !alert.acknowledged);

    return matchesSearch && matchesType && matchesStatus;
  }), [alerts, filterStatus, filterType, searchTerm]);

  const acknowledgeAlert = async (alertId) => {
    await acknowledgeAlertRequest(alertId);
    await loadAlerts();
  };

  const acknowledgeAll = async () => {
    await Promise.all(
      alerts
        .filter(alert => !alert.acknowledged && !alert.derived)
        .map(alert => acknowledgeAlertRequest(alert.id))
    );
    await loadAlerts();
  };

  const deleteAlert = async (alertId) => {
    await deleteAlertRequest(alertId);
    await loadAlerts();
  };

  const getAlertIcon = (type) => (
    <AlertTriangle className={`w-5 h-5 ${type === 'critical' ? 'text-critical' : type === 'warning' ? 'text-warning' : 'text-grey'}`} />
  );

  const getAlertColor = (type) => {
    if (type === 'critical') return 'border-l-critical bg-red-50';
    if (type === 'warning') return 'border-l-warning bg-yellow-50';
    return 'border-l-grey bg-gray-50';
  };

  const formatTimeAgo = (timestamp) => {
    const diffInMinutes = Math.floor((new Date() - new Date(timestamp)) / (1000 * 60));
    if (diffInMinutes < 60) return `${Math.max(diffInMinutes, 0)} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const criticalCount = alerts.filter(a => a.type === 'critical').length;
  const warningCount = alerts.filter(a => a.type === 'warning').length;
  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

  const applySummaryFilter = (type, status) => {
    setFilterType(type);
    setFilterStatus(status);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-blue">Alerts & Notifications</h1>
          <p className="text-grey mt-1">Condition-based alerts generated only from database fields</p>
        </div>
        <div className="relative">
          <Bell className="w-6 h-6 text-steel-blue" />
          {unacknowledgedCount > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-critical rounded-full animate-pulse"></span>}
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {loading && <div className="text-sm text-grey">Loading alerts from database...</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Alerts"
          value={alerts.length}
          color="bg-steel-blue"
          icon={<Bell className="w-6 h-6 text-white" />}
          active={filterType === 'all' && filterStatus === 'all'}
          onClick={() => applySummaryFilter('all', 'all')}
        />
        <SummaryCard
          label="Critical"
          value={criticalCount}
          color="bg-critical"
          icon={<AlertTriangle className="w-6 h-6 text-white" />}
          active={filterType === 'critical' && filterStatus === 'all'}
          onClick={() => applySummaryFilter('critical', 'all')}
        />
        <SummaryCard
          label="Warning"
          value={warningCount}
          color="bg-warning"
          icon={<AlertTriangle className="w-6 h-6 text-white" />}
          active={filterType === 'warning' && filterStatus === 'all'}
          onClick={() => applySummaryFilter('warning', 'all')}
        />
        <SummaryCard
          label="Unacknowledged"
          value={unacknowledgedCount}
          color="bg-odor"
          icon={<Clock className="w-6 h-6 text-white" />}
          active={filterType === 'all' && filterStatus === 'unacknowledged'}
          onClick={() => applySummaryFilter('all', 'unacknowledged')}
        />
      </div>

      <div className="bg-white rounded-lg shadow-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-grey" />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue"
              />
            </div>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue">
              <option value="all">All Types</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue">
              <option value="all">All Status</option>
              <option value="unacknowledged">Unacknowledged</option>
              <option value="acknowledged">Acknowledged</option>
            </select>
            {unacknowledgedCount > 0 && (
              <button onClick={acknowledgeAll} className="px-4 py-2 bg-steel-blue text-white rounded-lg hover:bg-civic-blue transition-colors">
                Acknowledge All
              </button>
            )}
          </div>
          <div className="text-sm text-grey">Showing {filteredAlerts.length} of {alerts.length} alerts</div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-card p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-grey mx-auto mb-3" />
            <p className="text-grey">No alerts found</p>
          </div>
        ) : filteredAlerts.map((alert) => (
          <div key={alert.id} className={`border-l-4 p-4 rounded-r-lg shadow-card ${getAlertColor(alert.type)} ${alert.acknowledged ? 'opacity-60' : 'opacity-100'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="font-semibold text-dark-blue">{alert.device_id}</span>
                    {!alert.acknowledged && <span className="w-2 h-2 bg-critical rounded-full animate-pulse"></span>}
                    <span className="text-sm text-grey">{alert.alertType}</span>
                  </div>
                  <p className="text-dark-blue mb-2">{alert.message}</p>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-grey">
                    <span>{formatTimeAgo(alert.timestamp)}</span>
                    <span>Fill: {alert.fill_percentage}%</span>
                    <span>Gas: {alert.gas ?? '-'}</span>
                    <span>Gas alert: {alert.gas_alert ? 'true' : 'false'}</span>
                    <span>Fall detected: {alert.fall_detected ? 'true' : 'false'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                {alert.acknowledged ? (
                  <div className="flex items-center space-x-1 text-healthy">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs">Acknowledged</span>
                  </div>
                ) : alert.derived ? (
                  <span className="text-xs text-grey">Clears when fixed</span>
                ) : (
                  <button onClick={() => acknowledgeAlert(alert.id)} className="px-3 py-1 bg-steel-blue text-white text-sm rounded hover:bg-civic-blue transition-colors">
                    Acknowledge
                  </button>
                )}
                {!alert.derived && (
                  <button onClick={() => deleteAlert(alert.id)} className="p-1 text-grey hover:text-critical transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SummaryCard = ({ label, value, color, icon, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`w-full bg-white rounded-lg shadow-card p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-steel-blue ${
      active ? 'ring-2 ring-steel-blue' : ''
    }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-grey">{label}</p>
        <p className="text-2xl font-bold text-dark-blue">{value}</p>
      </div>
      <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
        {icon}
      </div>
    </div>
  </button>
);

export default Alerts;
