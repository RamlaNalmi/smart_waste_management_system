import React from 'react';
import { 
  LayoutDashboard, 
  Trash2, 
  TrendingUp, 
  AlertTriangle, 
  MapPin, 
  FileText, 
  Settings, 
  Users 
} from 'lucide-react';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard:view' },
  { id: 'bins', label: 'Bin Overview', icon: Trash2, permission: 'bins:view' },
  { id: 'analytics', label: 'Analytics / Trends', icon: TrendingUp, permission: 'analytics:view' },
  { id: 'alerts', label: 'Alerts & Notifications', icon: AlertTriangle, permission: 'alerts:view' },
  { id: 'map', label: 'Map View', icon: MapPin, permission: 'map:view' },
  { id: 'reports', label: 'Reports', icon: FileText, permission: 'reports:view' },
  { id: 'settings', label: 'Settings', icon: Settings, permission: 'settings:view' },
  { id: 'users', label: 'User Management', icon: Users, permission: 'users:view' },
];

const Sidebar = ({ activeView, setActiveView, userRole, userPermissions }) => {
  const filteredMenuItems = menuItems.filter(item => 
    userPermissions && userPermissions.includes(item.permission)
  );

  return (
    <aside className="w-64 bg-white shadow-card border-r border-gray-200">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-dark-blue mb-6">Navigation</h2>
        <nav className="space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-steel-blue text-white'
                    : 'text-dark-blue hover:bg-light-grey'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Role Indicator */}
      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-healthy rounded-full"></div>
          <span className="text-sm text-grey">Current Role:</span>
          <span className="text-sm font-medium text-dark-blue capitalize">{userRole}</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
