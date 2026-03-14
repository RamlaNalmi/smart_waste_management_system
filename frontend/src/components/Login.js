import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Shield, Trash2, AlertCircle, CheckCircle, Zap, Droplets, Wind } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState({ username: false, password: false });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const { login, isLoading, error } = useAuth();

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(username, password);
  };

  const demoUsers = [
    { username: 'admin', password: 'admin123', role: 'Administrator', description: 'Full system access', icon: Shield, color: 'bg-critical' },
    { username: 'supervisor', password: 'super123', role: 'Supervisor', description: 'Monitor and manage operations', icon: Zap, color: 'bg-warning' },
    { username: 'collector1', password: 'collect123', role: 'Collector', description: 'Field operations', icon: Trash2, color: 'bg-steel-blue' },
    { username: 'auditor', password: 'audit123', role: 'Auditor', description: 'Read-only analytics', icon: CheckCircle, color: 'bg-healthy' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-civic-blue via-steel-blue to-civic-blue flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Moving gradient orbs */}
        <div className="absolute w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute w-96 h-96 bg-civic-blue rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute w-96 h-96 bg-steel-blue rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white opacity-20"
            style={{
              width: Math.random() * 4 + 1 + 'px',
              height: Math.random() * 4 + 1 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animation: `float-up ${Math.random() * 10 + 10}s infinite ease-in-out`,
              animationDelay: Math.random() * 5 + 's'
            }}
          />
        ))}

        {/* Mouse follower */}
        <div
          className="absolute w-32 h-32 bg-white rounded-full mix-blend-screen filter blur-xl opacity-20 pointer-events-none"
          style={{
            left: mousePosition.x - 64,
            top: mousePosition.y - 64,
            transition: 'all 0.3s ease-out'
          }}
        />
      </div>

      {/* Login Container */}
      <div className="relative z-10 w-full max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Side - Branding */}
          <div className="text-white text-center lg:text-left">
            <div className="mb-8">
              <div className="flex items-center justify-center lg:justify-start space-x-3 mb-6">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform duration-300">
                  <Trash2 className="w-8 h-8 text-civic-blue" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
                    Smart Waste
                  </h1>
                  <p className="text-xl opacity-90">Management System</p>
                </div>
              </div>
              
              <h2 className="text-2xl font-semibold mb-4">
                Colombo Municipal Council
              </h2>
              <p className="text-lg opacity-90 leading-relaxed mb-8">
                Data-driven waste management for cleaner public spaces. 
                Monitor bins, optimize collections, and maintain hygiene standards 
                across the city.
              </p>
            </div>

            {/* Animated Features */}
            <div className="space-y-4">
              {[
                { icon: CheckCircle, text: 'Real-time bin monitoring', delay: 'delay-100' },
                { icon: Droplets, text: 'Environmental analytics', delay: 'delay-200' },
                { icon: Shield, text: 'Role-based access control', delay: 'delay-300' },
                { icon: Wind, text: 'Automated alerts system', delay: 'delay-400' }
              ].map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className={`flex items-center space-x-3 transform translate-x-0 opacity-100 animate-fade-in ${feature.delay}`}>
                    <Icon className="w-6 h-6 text-green-400" />
                    <span>{feature.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="bg-white bg-opacity-95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 transform hover:scale-105 transition-transform duration-300">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-steel-blue to-civic-blue rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-dark-blue">Welcome Back</h2>
              <p className="text-grey mt-2">Sign in to access your dashboard</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div>
                <label className="block text-sm font-medium text-dark-blue mb-2">
                  Username
                </label>
                <div className={`relative transition-all duration-200 ${
                  isFocused.username ? 'transform scale-105' : ''
                }`}>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setIsFocused({...isFocused, username: true})}
                    onBlur={() => setIsFocused({...isFocused, username: false})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent transition-all duration-200 bg-white bg-opacity-80"
                    placeholder="Enter your username"
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Shield className="w-5 h-5 text-grey" />
                  </div>
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-dark-blue mb-2">
                  Password
                </label>
                <div className={`relative transition-all duration-200 ${
                  isFocused.password ? 'transform scale-105' : ''
                }`}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsFocused({...isFocused, password: true})}
                    onBlur={() => setIsFocused({...isFocused, password: false})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent transition-all duration-200 bg-white bg-opacity-80"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-grey hover:text-dark-blue transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg animate-shake">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-steel-blue to-civic-blue text-white py-3 rounded-lg font-medium hover:from-civic-blue hover:to-steel-blue transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <span>Sign In →</span>
                )}
              </button>
            </form>

            {/* Demo Accounts */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-dark-blue mb-4 text-center">
                Quick Access - Demo Accounts
              </h3>
              <div className="space-y-2">
                {demoUsers.map((user, index) => {
                  const Icon = user.icon;
                  return (
                    <div
                      key={index}
                      className="bg-light-grey rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 hover:shadow-md"
                      onClick={() => {
                        setUsername(user.username);
                        setPassword(user.password);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 ${user.color} rounded-full flex items-center justify-center`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-dark-blue">{user.role}</div>
                            <div className="text-xs text-grey">{user.description}</div>
                          </div>
                        </div>
                        <div className="text-xs text-grey text-right">
                          <div className="font-mono">{user.username}</div>
                          <div className="font-mono">{user.password}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Animation Styles */}
      <style jsx>{`
        @keyframes float-up {
          0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
          10% { opacity: 0.2; }
          90% { opacity: 0.2; }
          100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }
        
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        @keyframes fade-in {
          0% { transform: translateX(-20px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .delay-100 {
          animation-delay: 0.1s;
        }
        
        .delay-200 {
          animation-delay: 0.2s;
        }
        
        .delay-300 {
          animation-delay: 0.3s;
        }
        
        .delay-400 {
          animation-delay: 0.4s;
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
          opacity: 0;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Login;
