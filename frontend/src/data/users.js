export const users = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@colombo.gov',
    password: 'admin123', // In production, this should be hashed
    name: 'John Administrator',
    role: 'admin',
    department: 'Municipal Council',
    phone: '+94 77 123 4567',
    permissions: [
      'dashboard:view',
      'bins:view',
      'bins:manage',
      'analytics:view',
      'alerts:view',
      'alerts:manage',
      'map:view',
      'reports:view',
      'reports:generate',
      'settings:view',
      'settings:manage',
      'users:view',
      'users:manage',
      'system:configure'
    ],
    assignedBins: ['All'],
    lastLogin: null,
    isActive: true
  },
  {
    id: 2,
    username: 'supervisor',
    email: 'supervisor@colombo.gov',
    password: 'super123',
    name: 'Jane Supervisor',
    role: 'supervisor',
    department: 'Waste Management',
    phone: '+94 77 234 5678',
    permissions: [
      'dashboard:view',
      'bins:view',
      'analytics:view',
      'alerts:view',
      'map:view',
      'reports:view',
      'reports:generate'
    ],
    assignedBins: ['BIN-001', 'BIN-002', 'BIN-003', 'BIN-004', 'BIN-005', 'BIN-006'],
    lastLogin: null,
    isActive: true
  },
  {
    id: 3,
    username: 'collector1',
    email: 'collector1@colombo.gov',
    password: 'collect123',
    name: 'Robert Collector',
    role: 'collector',
    department: 'Collection Services',
    phone: '+94 77 345 6789',
    permissions: [
      'dashboard:view',
      'bins:view',
      'alerts:view',
      'map:view'
    ],
    assignedBins: ['BIN-007', 'BIN-008', 'BIN-009'],
    lastLogin: null,
    isActive: true
  },
  {
    id: 4,
    username: 'collector2',
    email: 'collector2@colombo.gov',
    password: 'collect123',
    name: 'Sarah Collector',
    role: 'collector',
    department: 'Collection Services',
    phone: '+94 77 456 7890',
    permissions: [
      'dashboard:view',
      'bins:view',
      'alerts:view',
      'map:view'
    ],
    assignedBins: ['BIN-010', 'BIN-011', 'BIN-012'],
    lastLogin: null,
    isActive: true
  },
  {
    id: 5,
    username: 'auditor',
    email: 'auditor@colombo.gov',
    password: 'audit123',
    name: 'Michael Auditor',
    role: 'guest',
    department: 'Audit Department',
    phone: '+94 77 567 8901',
    permissions: [
      'dashboard:view',
      'analytics:view',
      'reports:view',
      'reports:generate'
    ],
    assignedBins: ['Read-only access'],
    lastLogin: null,
    isActive: true
  }
];

export const rolePermissions = {
  admin: {
    label: 'Administrator',
    level: 4,
    permissions: [
      'dashboard:view',
      'bins:view',
      'bins:manage',
      'analytics:view',
      'alerts:view',
      'alerts:manage',
      'map:view',
      'reports:view',
      'reports:generate',
      'settings:view',
      'settings:manage',
      'users:view',
      'users:manage',
      'system:configure'
    ],
    menuItems: ['dashboard', 'bins', 'analytics', 'alerts', 'map', 'reports', 'settings', 'users']
  },
  supervisor: {
    label: 'Supervisor',
    level: 3,
    permissions: [
      'dashboard:view',
      'bins:view',
      'analytics:view',
      'alerts:view',
      'map:view',
      'reports:view',
      'reports:generate'
    ],
    menuItems: ['dashboard', 'bins', 'analytics', 'alerts', 'map', 'reports']
  },
  collector: {
    label: 'Collector',
    level: 2,
    permissions: [
      'dashboard:view',
      'bins:view',
      'alerts:view',
      'map:view'
    ],
    menuItems: ['dashboard', 'bins', 'alerts', 'map']
  },
  guest: {
    label: 'Guest/Auditor',
    level: 1,
    permissions: [
      'dashboard:view',
      'analytics:view',
      'reports:view',
      'reports:generate'
    ],
    menuItems: ['dashboard', 'analytics', 'reports']
  }
};

export const hasPermission = (userPermissions, requiredPermission) => {
  return userPermissions.includes(requiredPermission);
};

export const canAccessRoute = (userRole, route) => {
  const roleConfig = rolePermissions[userRole];
  return roleConfig && roleConfig.menuItems.includes(route);
};
