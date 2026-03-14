import React from 'react';
import { Trash2, Gauge, AlertTriangle, Package } from 'lucide-react';
import { kpiData, binData } from '../data/dummyData';
import BinStatusTable from './BinStatusTable';
import RecentAlerts from './RecentAlerts';
import { useAuth } from '../contexts/AuthContext';

const KPICard = ({ title, value, icon: Icon, color, unit = '' }) => {
  return (
    <div className="bg-white rounded-lg shadow-card p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-grey font-medium">{title}</p>
          <p className="text-2xl font-bold text-dark-blue mt-1">
            {value}{unit}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  
  // Filter data based on user role and assigned bins
  const getUserBins = () => {
    if (!user) return binData;
    
    if (user.role === 'admin') {
      return binData; // Admin sees all bins
    }
    
    if (user.assignedBins && user.assignedBins.includes('All')) {
      return binData;
    }
    
    // For collectors and others, show only assigned bins
    return binData.filter(bin => 
      user.assignedBins && user.assignedBins.includes(bin.id)
    );
  };

  const userBins = getUserBins();
  const criticalBins = userBins.filter(bin => bin.status === 'critical').length;
  const warningBins = userBins.filter(bin => bin.status === 'warning').length;
  const normalBins = userBins.filter(bin => bin.status === 'normal').length;

  // Role-specific KPI calculations
  const getRoleSpecificKPIs = () => {
    switch (user?.role) {
      case 'collector':
        return {
          activeBins: userBins.length,
          averageFill: Math.round(userBins.reduce((sum, bin) => sum + bin.fillLevel, 0) / userBins.length),
          highRiskBins: criticalBins + warningBins,
          wasteCollectedToday: Math.round(userBins.reduce((sum, bin) => sum + bin.weight, 0) * 0.8) // Estimated collections
        };
      case 'supervisor':
        return {
          activeBins: userBins.length,
          averageFill: Math.round(userBins.reduce((sum, bin) => sum + bin.fillLevel, 0) / userBins.length),
          highRiskBins: criticalBins + warningBins,
          wasteCollectedToday: Math.round(userBins.reduce((sum, bin) => sum + bin.weight, 0) * 0.9)
        };
      case 'guest':
        return {
          activeBins: binData.length, // Guests see total stats
          averageFill: Math.round(binData.reduce((sum, bin) => sum + bin.fillLevel, 0) / binData.length),
          highRiskBins: binData.filter(bin => bin.status === 'critical' || bin.status === 'warning').length,
          wasteCollectedToday: kpiData.wasteCollectedToday
        };
      default: // admin
        return kpiData;
    }
  };

  const roleKPIs = getRoleSpecificKPIs();

  return (
    <div className="p-6 space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-dark-blue">Dashboard Overview</h1>
        <p className="text-grey mt-1">
          {user?.role === 'collector' 
            ? 'Your assigned bins and collection status'
            : user?.role === 'guest'
            ? 'System-wide waste management metrics'
            : 'Real-time waste management metrics and alerts'
          }
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Active Bins"
          value={roleKPIs.activeBins}
          icon={Trash2}
          color="bg-steel-blue"
        />
        <KPICard
          title="Average Fill"
          value={roleKPIs.averageFill}
          icon={Gauge}
          color="bg-healthy"
          unit="%"
        />
        <KPICard
          title="High Risk Bins"
          value={roleKPIs.highRiskBins}
          icon={AlertTriangle}
          color="bg-warning"
        />
        <KPICard
          title="Waste Collected Today"
          value={roleKPIs.wasteCollectedToday}
          icon={Package}
          color="bg-odor"
          unit=" kg"
        />
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-card p-6">
          <h3 className="text-lg font-semibold text-dark-blue mb-4">Bin Status Distribution</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-healthy rounded-full"></div>
                <span className="text-sm text-grey">Normal</span>
              </div>
              <span className="text-sm font-medium text-dark-blue">{normalBins} bins</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-warning rounded-full"></div>
                <span className="text-sm text-grey">Warning</span>
              </div>
              <span className="text-sm font-medium text-dark-blue">{warningBins} bins</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-critical rounded-full"></div>
                <span className="text-sm text-grey">Critical</span>
              </div>
              <span className="text-sm font-medium text-dark-blue">{criticalBins} bins</span>
            </div>
          </div>
        </div>

        {/* <div className="bg-white rounded-lg shadow-card p-6">
          <h3 className="text-lg font-semibold text-dark-blue mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-grey">Total Weight Today</span>
              <span className="text-sm font-medium text-dark-blue">
                {userBins.reduce((sum, bin) => sum + bin.weight, 0).toFixed(1)} kg
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-grey">Collections Completed</span>
              <span className="text-sm font-medium text-dark-blue">
                {Math.round(userBins.length * 0.67)} of {userBins.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-grey">Average Response Time</span>
              <span className="text-sm font-medium text-dark-blue">2.3 hours</span>
            </div>
          </div>
        </div> */}

        <div className="bg-white rounded-lg shadow-card p-6">
          <h3 className="text-lg font-semibold text-dark-blue mb-4">System Health</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-grey">Sensor Uptime</span>
              <span className="text-sm font-medium text-healthy">98.5%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-grey">Data Sync Status</span>
              <span className="text-sm font-medium text-healthy">Live</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-grey">Last Update</span>
              <span className="text-sm font-medium text-dark-blue">2 min ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BinStatusTable limit={5} data={userBins} />
        {user?.role !== 'guest' && <RecentAlerts limit={5} />}
      </div>
    </div>
  );
};

export default Dashboard;
