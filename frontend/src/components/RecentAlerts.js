import React from 'react';
import { alertsData } from '../data/dummyData';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const RecentAlerts = ({ limit = null }) => {
  const displayAlerts = limit ? alertsData.slice(0, limit) : alertsData;

  const getAlertIcon = (type) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-critical" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-grey" />;
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

  return (
    <div className="bg-white rounded-lg shadow-card p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-dark-blue">Recent Alerts</h3>
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-grey" />
          <span className="text-sm text-grey">Live</span>
        </div>
      </div>

      <div className="space-y-3">
        {displayAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`border-l-4 p-3 rounded-r-lg ${getAlertColor(alert.type)} ${
              !alert.acknowledged ? 'opacity-100' : 'opacity-60'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-dark-blue">
                      {alert.binId}
                    </span>
                    {!alert.acknowledged && (
                      <span className="w-2 h-2 bg-critical rounded-full animate-pulse"></span>
                    )}
                  </div>
                  <p className="text-sm text-grey mb-2">{alert.message}</p>
                  <p className="text-xs text-grey">{formatTimeAgo(alert.timestamp)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {alert.acknowledged ? (
                  <div className="flex items-center space-x-1 text-healthy">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs">Acknowledged</span>
                  </div>
                ) : (
                  <button className="text-xs px-2 py-1 bg-steel-blue text-white rounded hover:bg-civic-blue transition-colors">
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {!limit && alertsData.length === 0 && (
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-grey mx-auto mb-3" />
          <p className="text-grey">No active alerts</p>
        </div>
      )}

      {!limit && alertsData.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button className="text-sm text-steel-blue hover:text-civic-blue font-medium">
            View All Alerts →
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentAlerts;
