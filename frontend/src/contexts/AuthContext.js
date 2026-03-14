import React, { createContext, useState, useContext } from 'react';
import { users, rolePermissions, hasPermission, canAccessRoute } from '../data/users';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const login = async (username, password) => {
    setIsLoading(true);
    setError('');

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Find user by username
      const foundUser = users.find(u => u.username === username && u.password === password);

      if (!foundUser) {
        setError('Invalid username or password');
        return false;
      }

      if (!foundUser.isActive) {
        setError('Your account has been deactivated');
        return false;
      }

      // Update last login
      foundUser.lastLogin = new Date().toISOString();

      // Set user session
      setUser({
        ...foundUser,
        permissions: rolePermissions[foundUser.role].permissions,
        roleConfig: rolePermissions[foundUser.role]
      });

      // Store session in localStorage (in production, use secure HTTP-only cookies)
      localStorage.setItem('userSession', JSON.stringify({
        ...foundUser,
        permissions: rolePermissions[foundUser.role].permissions,
        roleConfig: rolePermissions[foundUser.role]
      }));

      return true;
    } catch (err) {
      setError('Login failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userSession');
  };

  const checkAuth = () => {
    const session = localStorage.getItem('userSession');
    if (session) {
      try {
        const userData = JSON.parse(session);
        setUser(userData);
      } catch (err) {
        localStorage.removeItem('userSession');
      }
    }
  };

  const hasUserPermission = (permission) => {
    if (!user) return false;
    return hasPermission(user.permissions, permission);
  };

  const canUserAccessRoute = (route) => {
    if (!user) return false;
    return canAccessRoute(user.role, route);
  };

  // Check for existing session on mount
  React.useEffect(() => {
    // Clear any existing session for demo purposes
    localStorage.removeItem('userSession');
    checkAuth();
  }, []);

  const value = {
    user,
    login,
    logout,
    isLoading,
    error,
    hasPermission: hasUserPermission,
    canAccessRoute: canUserAccessRoute,
    isAuthenticated: !!user,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
