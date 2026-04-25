import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import BinOverview from './components/BinOverview';
import Analytics from './components/Analytics';
import Alerts from './components/Alerts';
import MapView from './components/MapView';
import MapPlaceholder from './components/MapPlaceholder';
import Reports from './components/Reports';
import Settings from './components/Settings';
import UserManagement from './components/UserManagement';
import ChatSidebar from './components/ChatSidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './index.css';

function AppContent() {
  const [activeView, setActiveView] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { user, canAccessRoute, isLoading } = useAuth();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-civic-blue via-steel-blue to-civic-blue flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <Trash2 className="w-8 h-8 text-civic-blue" />
          </div>
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white mt-4 text-lg">Initializing Smart Waste System...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    // Check if user can access the requested route
    if (!canAccessRoute(activeView)) {
      // Redirect to dashboard if route is not accessible
      setActiveView('dashboard');
    }

    switch (activeView) {
      case 'dashboard':
        return (
          <ProtectedRoute requiredPermission="dashboard:view">
            <Dashboard />
          </ProtectedRoute>
        );
      case 'bins':
        return (
          <ProtectedRoute requiredPermission="bins:view">
            <BinOverview />
          </ProtectedRoute>
        );
      case 'analytics':
        return (
          <ProtectedRoute requiredPermission="analytics:view">
            <Analytics />
          </ProtectedRoute>
        );
      case 'alerts':
        return (
          <ProtectedRoute requiredPermission="alerts:view">
            <Alerts />
          </ProtectedRoute>
        );
      case 'map':
        return (
          <ProtectedRoute requiredPermission="map:view">
            <MapView />
          </ProtectedRoute>
        );
      case 'reports':
        return (
          <ProtectedRoute requiredPermission="reports:view">
            <Reports />
          </ProtectedRoute>
        );
      case 'settings':
        return (
          <ProtectedRoute requiredPermission="settings:view">
            <Settings />
          </ProtectedRoute>
        );
      case 'users':
        return (
          <ProtectedRoute requiredPermission="users:view">
            <UserManagement />
          </ProtectedRoute>
        );
      default:
        return (
          <ProtectedRoute requiredPermission="dashboard:view">
            <Dashboard />
          </ProtectedRoute>
        );
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      {user ? (
        <div className="flex h-screen bg-light-grey">
          <Sidebar 
            activeView={activeView} 
            setActiveView={setActiveView} 
            userRole={user?.role}
            userPermissions={user?.permissions}
          />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header 
              isDarkMode={isDarkMode} 
              setIsDarkMode={setIsDarkMode}
              user={user}
              onChatToggle={() => setIsChatOpen(!isChatOpen)}
            />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-light-grey">
              {renderContent()}
            </main>
          </div>
          <ChatSidebar isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </div>
      ) : (
        <Login />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
