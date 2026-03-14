import React, { useState } from 'react';
import { Users, Plus, Edit2, Trash2, Search, Mail, Phone, Shield } from 'lucide-react';

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [users, setUsers] = useState([
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@colombo.gov',
      phone: '+94 77 123 4567',
      role: 'admin',
      status: 'active',
      lastLogin: '2024-03-14 10:30',
      assignedBins: ['All'],
      department: 'Municipal Council'
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@colombo.gov',
      phone: '+94 77 234 5678',
      role: 'supervisor',
      status: 'active',
      lastLogin: '2024-03-14 09:15',
      assignedBins: ['BIN-001', 'BIN-002', 'BIN-003', 'BIN-004'],
      department: 'Waste Management'
    },
    {
      id: 3,
      name: 'Robert Wilson',
      email: 'robert.wilson@colombo.gov',
      phone: '+94 77 345 6789',
      role: 'collector',
      status: 'active',
      lastLogin: '2024-03-14 08:45',
      assignedBins: ['BIN-005', 'BIN-006', 'BIN-007'],
      department: 'Collection Services'
    },
    {
      id: 4,
      name: 'Sarah Johnson',
      email: 'sarah.johnson@colombo.gov',
      phone: '+94 77 456 7890',
      role: 'collector',
      status: 'inactive',
      lastLogin: '2024-03-12 16:20',
      assignedBins: ['BIN-008', 'BIN-009', 'BIN-010'],
      department: 'Collection Services'
    },
    {
      id: 5,
      name: 'Michael Brown',
      email: 'michael.brown@colombo.gov',
      phone: '+94 77 567 8901',
      role: 'guest',
      status: 'active',
      lastLogin: '2024-03-14 11:00',
      assignedBins: ['Read-only access'],
      department: 'Audit Department'
    }
  ]);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'collector',
    department: '',
    assignedBins: []
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  const handleAddUser = () => {
    const user = {
      ...newUser,
      id: users.length + 1,
      status: 'active',
      lastLogin: 'Never',
      assignedBins: newUser.role === 'admin' ? ['All'] : newUser.assignedBins
    };
    
    setUsers([...users, user]);
    setNewUser({
      name: '',
      email: '',
      phone: '',
      role: 'collector',
      department: '',
      assignedBins: []
    });
    setShowAddUser(false);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
  };

  const handleUpdateUser = () => {
    setUsers(users.map(user => 
      user.id === editingUser.id ? editingUser : user
    ));
    setEditingUser(null);
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  const toggleUserStatus = (userId) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
        : user
    ));
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-critical text-white';
      case 'supervisor':
        return 'bg-warning text-white';
      case 'collector':
        return 'bg-steel-blue text-white';
      case 'guest':
        return 'bg-grey text-white';
      default:
        return 'bg-grey text-white';
    }
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'text-healthy' : 'text-warning';
  };

  const rolePermissions = {
    admin: ['Full system access', 'User management', 'All bin management', 'System configuration'],
    supervisor: ['View all bins', 'Monitor alerts', 'Assign collection routes', 'Generate reports'],
    collector: ['View assigned bins', 'Receive alerts', 'Update collection status', 'Route navigation'],
    guest: ['Read-only analytics', 'View trends', 'Generate reports', 'Limited data access']
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-blue">User Management</h1>
          <p className="text-grey mt-1">Manage system users and permissions</p>
        </div>
        <button
          onClick={() => setShowAddUser(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-steel-blue text-white rounded-lg hover:bg-civic-blue transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-grey">Total Users</p>
              <p className="text-2xl font-bold text-dark-blue">{users.length}</p>
            </div>
            <div className="w-12 h-12 bg-steel-blue rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-grey">Active Users</p>
              <p className="text-2xl font-bold text-healthy">
                {users.filter(u => u.status === 'active').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-healthy rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">✓</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-grey">Admins</p>
              <p className="text-2xl font-bold text-critical">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-critical rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-grey">Collectors</p>
              <p className="text-2xl font-bold text-steel-blue">
                {users.filter(u => u.role === 'collector').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-steel-blue rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
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
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue"
              />
            </div>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="supervisor">Supervisor</option>
              <option value="collector">Collector</option>
              <option value="guest">Guest</option>
            </select>
          </div>

          <div className="text-sm text-grey">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-light-grey">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-medium text-dark-blue">User</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-dark-blue">Role</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-dark-blue">Department</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-dark-blue">Assigned Bins</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-dark-blue">Status</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-dark-blue">Last Login</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-dark-blue">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-light-grey">
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-dark-blue">{user.name}</p>
                      <div className="flex items-center space-x-2 text-sm text-grey mt-1">
                        <Mail className="w-3 h-3" />
                        <span>{user.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-grey mt-1">
                        <Phone className="w-3 h-3" />
                        <span>{user.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-grey">{user.department}</td>
                  <td className="py-4 px-6">
                    <div className="text-sm text-grey">
                      {Array.isArray(user.assignedBins) 
                        ? user.assignedBins.length > 2 
                          ? `${user.assignedBins.length} bins`
                          : user.assignedBins.join(', ')
                        : user.assignedBins
                      }
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${getStatusColor(user.status)}`}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className="text-xs text-steel-blue hover:text-civic-blue"
                      >
                        Toggle
                      </button>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-grey">{user.lastLogin}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-1 text-grey hover:text-steel-blue transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1 text-grey hover:text-critical transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Permissions Info */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <h3 className="text-lg font-semibold text-dark-blue mb-4">Role Permissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(rolePermissions).map(([role, permissions]) => (
            <div key={role} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-dark-blue mb-2 capitalize">{role}</h4>
              <ul className="space-y-1">
                {permissions.map((permission, index) => (
                  <li key={index} className="text-sm text-grey flex items-start">
                    <span className="text-healthy mr-2">•</span>
                    {permission}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-dark-blue mb-4">Add New User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-blue mb-1">Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-blue mb-1">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-blue mb-1">Phone</label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-blue mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
                >
                  <option value="collector">Collector</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="guest">Guest</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-blue mb-1">Department</label>
                <input
                  type="text"
                  value={newUser.department}
                  onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddUser(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-light-grey transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                className="px-4 py-2 bg-steel-blue text-white rounded-lg hover:bg-civic-blue transition-colors"
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-dark-blue mb-4">Edit User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-blue mb-1">Name</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-blue mb-1">Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-blue mb-1">Phone</label>
                <input
                  type="tel"
                  value={editingUser.phone}
                  onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-blue mb-1">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
                >
                  <option value="collector">Collector</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="guest">Guest</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-blue mb-1">Department</label>
                <input
                  type="text"
                  value={editingUser.department}
                  onChange={(e) => setEditingUser({...editingUser, department: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-light-grey transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                className="px-4 py-2 bg-steel-blue text-white rounded-lg hover:bg-civic-blue transition-colors"
              >
                Update User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
