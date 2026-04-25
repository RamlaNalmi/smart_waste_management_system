import React from 'react';
import { Bell, User, Moon, Sun, LogOut, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Header = ({ isDarkMode, setIsDarkMode, user, onChatToggle }) => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white shadow-card border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-civic-blue rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CMC</span>
            </div>
            <h1 className="text-xl font-bold text-dark-blue">Smart Waste Management Dashboard</h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Chat with AI Button */}
          <button
            onClick={onChatToggle}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-civic-blue text-white hover:bg-steel-blue transition-colors"
            title="Chat with AI"
          >
            <MessageCircle size={18} />
            <span className="text-sm font-medium">Chat</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-lg hover:bg-light-grey transition-colors"
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-dark-blue" />
            ) : (
              <Moon className="w-5 h-5 text-dark-blue" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button className="p-2 rounded-lg hover:bg-light-grey transition-colors relative">
              <Bell className="w-5 h-5 text-dark-blue" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-critical rounded-full"></span>
            </button>
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm font-medium text-dark-blue">{user?.name}</p>
              <p className="text-xs text-grey capitalize">{user?.roleConfig?.label || user?.role}</p>
            </div>
            <div className="w-10 h-10 bg-steel-blue rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-light-grey transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-grey" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
