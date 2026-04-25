import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { acknowledgeAlert, fetchAlerts } from '../services/api';

const RecentAlerts = ({ limit = null }) => {
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState('');

  const loadAlerts = async () => {
    try {
      setError('');
      setAlerts(await fetchAlerts());
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadAlerts();
    const refreshTimer = setInterval(loadAlerts, 5000);
    return () => clearInterval(refreshTimer);
  }, []);

  const displayAlerts = limit ? alerts.slice(0, limit) : alerts;

  const getAlertIcon = (type) => (
    <AlertTriangle className={`w-4 h-4 ${type === 'critical' ? 'text-critical' : type === 'warning' ? 'text-warning' : 'text-grey'}`} />
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

  const handleAcknowledge = async (alertId) => {
    await acknowledgeAlert(alertId);
    await loadAlerts();
  };

  return (
    <div className="bg-white rounded-lg shadow-card p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-dark-blue">Recent Alerts</h3>
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-grey" />
          <span className="text-sm text-grey">Live</span>
        </div>
      </div>

      {error && <div className="mb-3 text-sm text-red-700">{error}</div>}

      <div className="space-y-3">
        {displayAlerts.map((alert) => (
          <div key={alert.id} className={`border-l-4 p-3 rounded-r-lg ${getAlertColor(alert.type)} ${alert.acknowledged ? 'opacity-60' : 'opacity-100'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-dark-blue">{alert.device_id}</span>
                    {!alert.acknowledged && <span className="w-2 h-2 bg-critical rounded-full animate-pulse"></span>}
                  </div>
                  <p className="text-sm text-grey mb-2">{alert.message}</p>
                  <p className="text-xs text-grey">{formatTimeAgo(alert.timestamp)}</p>
                </div>
              </div>
              {alert.acknowledged ? (
                <div className="flex items-center space-x-1 text-healthy">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs">Acknowledged</span>
                </div>
              ) : alert.derived ? (
                <span className="text-xs text-grey">Live condition</span>
              ) : (
                <button onClick={() => handleAcknowledge(alert.id)} className="text-xs px-2 py-1 bg-steel-blue text-white rounded hover:bg-civic-blue transition-colors">
                  Acknowledge
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {displayAlerts.length === 0 && (
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-grey mx-auto mb-3" />
          <p className="text-grey">No active alerts</p>
        </div>
      )}
    </div>
  );
};

export default RecentAlerts;
