import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Trash2, TrendingUp, Activity, AlertTriangle, X } from 'lucide-react';

const BinDetails = ({ bin, onClose }) => {
  const [historicalData, setHistoricalData] = useState([]);
  const [predictedData, setPredictedData] = useState([]);
  const [odorHistoricalData, setOdorHistoricalData] = useState([]);
  const [timeToFull, setTimeToFull] = useState('');
  const [fillRate, setFillRate] = useState('');
  const [touchStart, setTouchStart] = useState(null);

  useEffect(() => {
    if (bin) {
      // Calculate fill rate and time to full
      setFillRate(calculateFillRate(bin.fillLevel));
      setTimeToFull(calculateTimeToFull(bin.fillLevel));

      // Generate historical and predicted data
      const historical = generateHistoricalData(bin.fillLevel);
      const predicted = generatePredictedData(bin.fillLevel, historical);
      const odorHistorical = generateOdorHistoricalData(bin.odorLevel);

      setHistoricalData(historical);
      setPredictedData(predicted);
      setOdorHistoricalData(odorHistorical);
    }
  }, [bin]);

  const calculateFillRate = (currentFill) => {
    if (currentFill >= 90) return 'Very Fast';
    if (currentFill >= 75) return 'Fast';
    if (currentFill >= 50) return 'Moderate';
    if (currentFill >= 25) return 'Slow';
    return 'Very Slow';
  };

  const calculateTimeToFull = (currentFill) => {
    const hoursToFull = Math.max(0, Math.round((100 - currentFill) / (100 / 24))); // 24h cycle
    if (hoursToFull === 0) return 'Full';
    if (hoursToFull < 1) return '< 1 hour';
    if (hoursToFull < 24) return `~${hoursToFull} hours`;
    return `~${Math.round(hoursToFull / 24)} days`;
  };

  const generateHistoricalData = (currentFill) => {
    const data = [];
    const today = new Date();

    for (let i = 9; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      let fillLevel = currentFill - i * 3 + (Math.random() * 8 - 4);
      fillLevel = Math.max(0, Math.min(100, fillLevel));
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fillLevel: Math.round(fillLevel),
        type: 'historical',
      });
    }

    return data.reverse();
  };

  const generateOdorHistoricalData = (currentOdor) => {
    const data = [];
    const today = new Date();
    
    for (let i = 9; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Simulate odor level with realistic patterns
      let odorLevel = currentOdor + (Math.random() * 4 - 2);
      odorLevel = Math.max(1, Math.min(10, odorLevel));
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        odorLevel: Math.round(odorLevel),
        type: 'historical'
      });
    }
    
    return data.reverse();
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (touchStart !== null) {
      const currentX = e.touches[0].clientX;
      const diff = currentX - touchStart;
      if (Math.abs(diff) > 50) {
        onClose();
      }
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  const generatePredictedData = (currentFill, historical) => {
    const data = [];
    const today = new Date();
    const lastHistorical = historical[historical.length - 1];
    const baseFill = lastHistorical ? lastHistorical.fillLevel : currentFill;

    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const prevFill = i === 1 ? baseFill : data[i - 2].fillLevel;
      let predictedFill = prevFill + 3 + (Math.random() * 4 - 2);
      predictedFill = Math.max(0, Math.min(100, predictedFill));
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fillLevel: Math.round(predictedFill),
        type: 'predicted',
      });
    }

    return data;
  };

  const allData = [...historicalData, ...predictedData];

  const getStatusColor = (status) => {
    switch (status) {
      case 'normal':
        return 'text-healthy bg-green-50 border-healthy';
      case 'warning':
        return 'text-warning bg-yellow-50 border-warning';
      case 'critical':
        return 'text-critical bg-red-50 border-critical';
      default:
        return 'text-grey bg-gray-50 border-grey';
    }
  };

  if (!bin) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-steel-blue text-white p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Trash2 className="w-6 h-6" />
            <h2 className="text-xl font-bold">{bin.id} - {bin.location}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex h-[calc(100%-80px)] overflow-hidden">
          {/* Left Side - Current Status */}
          <div className="w-1/3 bg-light-grey p-6 border-r border-gray-200 overflow-y-auto">
            <h3 className="text-lg font-semibold text-dark-blue mb-6">Current Status</h3>

            {/* Status Badge */}
            <div className="mb-6">
              <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full border ${getStatusColor(bin.status)}`}>
                <span className="text-sm font-medium">
                  {bin.status.charAt(0).toUpperCase() + bin.status.slice(1)}
                </span>
              </div>
            </div>

            {/* Metrics */}
            <div className="space-y-4">
              <MetricCard label="Current Fill Level" value={`${bin.fillLevel}%`} status={bin.fillLevel} icon={<TrendingUp className="w-4 h-4 text-steel-blue" />} />
              <MetricCard label="Fill Rate" value={fillRate} icon={<Activity className="w-4 h-4 text-steel-blue" />} />
              <MetricCard label="Weight" value={`${bin.weight} kg`} icon={<Activity className="w-4 h-4 text-steel-blue" />} />
              <MetricCard label="Odor Level" value={bin.odorLevel} icon={<Activity className="w-4 h-4 text-steel-blue" />} />
            </div>

            {/* Alerts */}
            {bin.status === 'critical' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                <div className="flex items-center space-x-2 text-red-700">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">Critical Alert</span>
                </div>
                <p className="text-sm text-red-600 mt-1">
                  Bin requires immediate attention. Fill level exceeds safe threshold.
                </p>
              </div>
            )}
          </div>

          {/* Right Side - Chart & Actions */}
          <div className="flex-1 p-6 flex flex-col overflow-y-auto">
            <h3 className="text-lg font-semibold text-dark-blue mb-6">
              Fill Level Trend (Historical + Predicted)
            </h3>

            <div className="flex-1 bg-light-grey p-4 rounded-lg">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={allData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="fillLevel" stroke="#3A6EA5" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <h3 className="text-lg font-semibold text-dark-blue mb-6 mt-6">
              Odor Level Trend (Historical Only)
            </h3>

            <div className="flex-1 bg-light-grey p-4 rounded-lg">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={odorHistoricalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  
                  {/* Odor Threshold Lines */}
                  <Line
                    type="monotone"
                    dataKey={() => 3}
                    stroke="#FFA500"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    dot={false}
                    name="Low Threshold"
                  />
                  <Line
                    type="monotone"
                    dataKey={() => 7}
                    stroke="#FF6B6B"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    dot={false}
                    name="High Threshold"
                  />
                  
                  <Line type="monotone" dataKey="odorLevel" stroke="#FFA500" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex space-x-3 mt-4">
              <button className="px-4 py-2 bg-steel-blue text-white rounded-lg hover:bg-civic-blue transition-colors">
                Generate Report
              </button>
              <button className="px-4 py-2 bg-white border border-gray-300 text-dark-blue rounded-lg hover:bg-light-grey transition-colors">
                Schedule Collection
              </button>
            </div>

            <div className="mt-2 text-sm text-grey">
              Last Updated: {new Date().toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable metric card component
const MetricCard = ({ label, value, icon, status }) => {
  const getFillColor = (val) => {
    if (!val) return 'bg-gray-300';
    if (val >= 80) return 'bg-red-500';
    if (val >= 60) return 'bg-yellow-400';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-grey">{label}</span>
        {icon}
      </div>
      <div className="text-xl font-semibold text-dark-blue">{value}</div>
      {status !== undefined && (
        <div className="w-full bg-light-grey rounded-full h-2 mt-2">
          <div className={`h-2 rounded-full transition-all duration-300 ${getFillColor(status)}`} style={{ width: `${status}%` }}></div>
        </div>
      )}
    </div>
  );
};

export default BinDetails;