import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Bell, Shield, Palette, Database } from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    // General Settings
    systemName: 'Smart Waste Management System',
    refreshInterval: '30',
    timezone: 'Asia/Colombo',
    language: 'en',
    
    // Alert Settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    criticalAlertThreshold: 85,
    warningAlertThreshold: 60,
    
    // Sensor Settings
    fillPercentageThreshold: 70,
    gasThreshold: 80,
    
    // Security Settings
    sessionTimeout: '60',
    twoFactorAuth: false,
    passwordExpiry: '90',
    
    // Data Settings
    dataRetention: '365',
    backupFrequency: 'daily',
    exportFormat: 'csv'
  });

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = () => {
    // Simulate saving settings
    console.log('Settings saved:', settings);
    alert('Settings saved successfully!');
  };

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'sensors', label: 'Sensors', icon: Database },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette }
  ];

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-dark-blue mb-4">System Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-blue mb-2">System Name</label>
            <input
              type="text"
              value={settings.systemName}
              onChange={(e) => handleSettingChange('general', 'systemName', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-blue mb-2">Refresh Interval (seconds)</label>
            <select
              value={settings.refreshInterval}
              onChange={(e) => handleSettingChange('general', 'refreshInterval', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
            >
              <option value="15">15 seconds</option>
              <option value="30">30 seconds</option>
              <option value="60">1 minute</option>
              <option value="300">5 minutes</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-blue mb-2">Timezone</label>
            <select
              value={settings.timezone}
              onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
            >
              <option value="Asia/Colombo">Asia/Colombo</option>
              <option value="UTC">UTC</option>
              <option value="Asia/Kolkata">Asia/Kolkata</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-blue mb-2">Language</label>
            <select
              value={settings.language}
              onChange={(e) => handleSettingChange('general', 'language', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
            >
              <option value="en">English</option>
              <option value="si">Sinhala</option>
              <option value="ta">Tamil</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAlertSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-dark-blue mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="font-medium text-dark-blue">Email Notifications</p>
              <p className="text-sm text-grey">Receive alerts via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => handleSettingChange('alerts', 'emailNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-steel-blue rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-steel-blue"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="font-medium text-dark-blue">SMS Notifications</p>
              <p className="text-sm text-grey">Receive critical alerts via SMS</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.smsNotifications}
                onChange={(e) => handleSettingChange('alerts', 'smsNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-steel-blue rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-steel-blue"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="font-medium text-dark-blue">Push Notifications</p>
              <p className="text-sm text-grey">Browser push notifications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.pushNotifications}
                onChange={(e) => handleSettingChange('alerts', 'pushNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-steel-blue rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-steel-blue"></div>
            </label>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-dark-blue mb-4">Alert Thresholds</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-blue mb-2">Critical Alert Threshold (%)</label>
            <input
              type="number"
              value={settings.criticalAlertThreshold}
              onChange={(e) => handleSettingChange('alerts', 'criticalAlertThreshold', e.target.value)}
              min="0"
              max="100"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-blue mb-2">Warning Alert Threshold (%)</label>
            <input
              type="number"
              value={settings.warningAlertThreshold}
              onChange={(e) => handleSettingChange('alerts', 'warningAlertThreshold', e.target.value)}
              min="0"
              max="100"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSensorSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-dark-blue mb-4">Sensor Thresholds</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-blue mb-2">fill_percentage Threshold (%)</label>
            <input
              type="number"
              value={settings.fillPercentageThreshold}
              onChange={(e) => handleSettingChange('sensors', 'fillPercentageThreshold', e.target.value)}
              min="0"
              max="100"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-blue mb-2">gas Threshold</label>
            <input
              type="number"
              value={settings.gasThreshold}
              onChange={(e) => handleSettingChange('sensors', 'gasThreshold', e.target.value)}
              min="0"
              max="100"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-dark-blue mb-4">Security Configuration</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="font-medium text-dark-blue">Two-Factor Authentication</p>
              <p className="text-sm text-grey">Require 2FA for all admin users</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.twoFactorAuth}
                onChange={(e) => handleSettingChange('security', 'twoFactorAuth', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-steel-blue rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-steel-blue"></div>
            </label>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div>
            <label className="block text-sm font-medium text-dark-blue mb-2">Session Timeout (minutes)</label>
            <select
              value={settings.sessionTimeout}
              onChange={(e) => handleSettingChange('security', 'sessionTimeout', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
            >
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
              <option value="240">4 hours</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-blue mb-2">Password Expiry (days)</label>
            <select
              value={settings.passwordExpiry}
              onChange={(e) => handleSettingChange('security', 'passwordExpiry', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
            >
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
              <option value="365">Never</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-dark-blue mb-4">Data Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-blue mb-2">Data Retention (days)</label>
            <select
              value={settings.dataRetention}
              onChange={(e) => handleSettingChange('data', 'dataRetention', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
            >
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
              <option value="1095">3 years</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-blue mb-2">Backup Frequency</label>
            <select
              value={settings.backupFrequency}
              onChange={(e) => handleSettingChange('data', 'backupFrequency', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'alerts':
        return renderAlertSettings();
      case 'sensors':
        return renderSensorSettings();
      case 'security':
        return renderSecuritySettings();
      case 'appearance':
        return renderAppearanceSettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-blue">Settings</h1>
          <p className="text-grey mt-1">Configure system settings and preferences</p>
        </div>
        <button
          onClick={saveSettings}
          className="flex items-center space-x-2 px-4 py-2 bg-steel-blue text-white rounded-lg hover:bg-civic-blue transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings Tabs */}
        <div className="lg:w-64">
          <div className="bg-white rounded-lg shadow-card p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-steel-blue text-white'
                        : 'text-dark-blue hover:bg-light-grey'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-card p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
