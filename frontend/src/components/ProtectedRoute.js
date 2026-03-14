import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Login from './Login';

const ProtectedRoute = ({ children, requiredPermission = null }) => {
  const { isAuthenticated, user, hasPermission } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen bg-light-grey flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-card p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-warning rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-dark-blue mb-2">Access Denied</h2>
            <p className="text-grey mb-6">
              You don't have permission to access this page. Please contact your administrator if you believe this is an error.
            </p>
            <div className="bg-light-grey rounded-lg p-4 text-left">
              <p className="text-sm text-grey mb-2">
                <strong>Your Role:</strong> {user?.roleConfig?.label || 'Unknown'}
              </p>
              <p className="text-sm text-grey">
                <strong>Required Permission:</strong> {requiredPermission}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
