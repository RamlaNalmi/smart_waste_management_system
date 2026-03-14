import React, { useState } from 'react';
import { alertsData, binData } from '../data/dummyData';
import { AlertTriangle, CheckCircle, Clock, Filter, Search, Bell, X } from 'lucide-react';

const Alerts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [alerts, setAlerts] = useState(alertsData);

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.binId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || alert.type === filterType;
    const matchesStatus = filterStatus === 'all' || 
                        (filterStatus === 'acknowledged' && alert.acknowledged) ||
                        (filterStatus === 'unacknowledged' && !alert.acknowledged);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const acknowledgeAlert = (alertId) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const acknowledgeAll = () => {
    setAlerts(alerts.map(alert => ({ ...alert, acknowledged: true })));
  };

  const deleteAlert = (alertId) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId));
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-critical" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-grey" />;
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'critical':
        return 'border-l-critical bg-red-50';
      case 'warning':
        return 'border-l-warning bg-yellow-50';
      default:
        return 'border-l-grey bg-gray-50';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const alertTime = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - alertTime) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const getBinInfo = (binId) => {
    return binData.find(bin => bin.id === binId);
  };

  const criticalCount = alerts.filter(a => a.type === 'critical' && !a.acknowledged).length;
  const warningCount = alerts.filter(a => a.type === 'warning' && !a.acknowledged).length;
  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <div className="p-6 space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-blue">Alerts & Notifications</h1>
          <p className="text-grey mt-1">Monitor and manage system alerts and notifications</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Bell className="w-6 h-6 text-steel-blue" />
            {unacknowledgedCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-critical rounded-full animate-pulse"></span>
            )}
          </div>
        </div>
      </div>

      {/* Alert Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-grey">Total Alerts</p>
              <p className="text-2xl font-bold text-dark-blue">{alerts.length}</p>
            </div>
            <div className="w-12 h-12 bg-steel-blue rounded-lg flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-grey">Critical</p>
              <p className="text-2xl font-bold text-critical">{criticalCount}</p>
            </div>
            <div className="w-12 h-12 bg-critical rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-grey">Warning</p>
              <p className="text-2xl font-bold text-warning">{warningCount}</p>
            </div>
            <div className="w-12 h-12 bg-warning rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-grey">Unacknowledged</p>
              <p className="text-2xl font-bold text-dark-blue">{unacknowledgedCount}</p>
            </div>
            <div className="w-12 h-12 bg-odor rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
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

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
            >
              <option value="all">All Types</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
            >
              <option value="all">All Status</option>
              <option value="unacknowledged">Unacknowledged</option>
              <option value="acknowledged">Acknowledged</option>
            </select>

            {unacknowledgedCount > 0 && (
              <button
                onClick={acknowledgeAll}
                className="px-4 py-2 bg-steel-blue text-white rounded-lg hover:bg-civic-blue transition-colors"
              >
                Acknowledge All
              </button>
            )}
          </div>

          <div className="text-sm text-grey">
            Showing {filteredAlerts.length} of {alerts.length} alerts
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-card p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-grey mx-auto mb-3" />
            <p className="text-grey">No alerts found</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const binInfo = getBinInfo(alert.binId);
            return (
              <div
                key={alert.id}
                className={`border-l-4 p-4 rounded-r-lg shadow-card ${getAlertColor(alert.type)} ${
                  !alert.acknowledged ? 'opacity-100' : 'opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-semibold text-dark-blue">{alert.binId}</span>
                        {!alert.acknowledged && (
                          <span className="w-2 h-2 bg-critical rounded-full animate-pulse"></span>
                        )}
                        <span className="text-sm text-grey">
                          {binInfo?.location || 'Unknown Location'}
                        </span>
                      </div>
                      <p className="text-dark-blue mb-2">{alert.message}</p>
                      <div className="flex items-center space-x-4 text-sm text-grey">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(alert.timestamp)}</span>
                        </div>
                        {binInfo && (
                          <>
                            <span>•</span>
                            <span>Fill: {binInfo.fillLevel}%</span>
                            <span>•</span>
                            <span>Weight: {binInfo.weight} kg</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {alert.acknowledged ? (
                      <div className="flex items-center space-x-1 text-healthy">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs">Acknowledged</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="px-3 py-1 bg-steel-blue text-white text-sm rounded hover:bg-civic-blue transition-colors"
                      >
                        Acknowledge
                      </button>
                    )}
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="p-1 text-grey hover:text-critical transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Alert Trends */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <h3 className="text-lg font-semibold text-dark-blue mb-4">Alert Trends (Last 7 Days)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-critical">12</div>
            <div className="text-sm text-grey">Critical Alerts</div>
            <div className="text-xs text-healthy mt-1">↓ 3 from last week</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">28</div>
            <div className="text-sm text-grey">Warning Alerts</div>
            <div className="text-xs text-warning mt-1">↑ 5 from last week</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-dark-blue">95%</div>
            <div className="text-sm text-grey">Response Rate</div>
            <div className="text-xs text-healthy mt-1">↑ 2% from last week</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alerts;
