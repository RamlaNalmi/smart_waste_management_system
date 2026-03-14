import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { wasteTrendData, fillDistributionData, environmentalData } from '../data/dummyData';
import { TrendingUp, Droplets, Thermometer, Wind } from 'lucide-react';

const Analytics = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-dark-blue">Analytics & Trends</h1>
        <p className="text-grey mt-1">Waste management insights and environmental monitoring</p>
      </div>

      {/* Waste Generation Trend */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-steel-blue" />
            <h3 className="text-lg font-semibold text-dark-blue">Waste Generation Trend</h3>
          </div>
          <select className="text-sm border border-gray-200 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-steel-blue">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 3 Months</option>
          </select>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={wasteTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: '#7F8C8D' }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#7F8C8D' }}
              label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft', style: { fill: '#7F8C8D' } }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px' }}
              formatter={(value) => [`${value} kg`, 'Waste Weight']}
            />
            <Line 
              type="monotone" 
              dataKey="weight" 
              stroke="#3A6EA5" 
              strokeWidth={2}
              dot={{ fill: '#3A6EA5', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Fill Level Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-card p-6">
          <h3 className="text-lg font-semibold text-dark-blue mb-6">Fill Level Distribution</h3>
          
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={fillDistributionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="status" 
                tick={{ fontSize: 12, fill: '#7F8C8D' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#7F8C8D' }}
                label={{ value: 'Number of Bins', angle: -90, position: 'insideLeft', style: { fill: '#7F8C8D' } }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px' }}
              />
              <Bar 
                dataKey="count" 
                fill="#3A6EA5"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-4 space-y-2">
            {fillDistributionData.map((item) => (
              <div key={item.status} className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    item.status === 'Normal' ? 'bg-healthy' :
                    item.status === 'Warning' ? 'bg-warning' : 'bg-critical'
                  }`}></div>
                  <span className="text-sm text-grey">{item.status}</span>
                </div>
                <span className="text-sm font-medium text-dark-blue">{item.count} bins ({item.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hygiene Metrics */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <h3 className="text-lg font-semibold text-dark-blue mb-6">Hygiene Metrics Overview</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-light-grey rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Wind className="w-4 h-4 text-odor" />
                <span className="text-sm text-grey">Average Odor Level</span>
              </div>
              <p className="text-2xl font-bold text-dark-blue">5.2</p>
              <p className="text-xs text-healthy mt-1">↓ 0.8 from yesterday</p>
            </div>
            
            <div className="bg-light-grey rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Thermometer className="w-4 h-4 text-critical" />
                <span className="text-sm text-grey">Avg Temperature</span>
              </div>
              <p className="text-2xl font-bold text-dark-blue">27.8°C</p>
              <p className="text-xs text-warning mt-1">↑ 1.2°C from baseline</p>
            </div>
            
            <div className="bg-light-grey rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Droplets className="w-4 h-4 text-humidity" />
                <span className="text-sm text-grey">Avg Humidity</span>
              </div>
              <p className="text-2xl font-bold text-dark-blue">67%</p>
              <p className="text-xs text-grey mt-1">Normal range</p>
            </div>
            
            <div className="bg-light-grey rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-4 h-4 text-healthy" />
                <span className="text-sm text-grey">Health Score</span>
              </div>
              <p className="text-2xl font-bold text-dark-blue">78/100</p>
              <p className="text-xs text-healthy mt-1">↑ 5 points this week</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-grey">Bins with High Odor</span>
              <span className="text-sm font-medium text-warning">3 bins</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-grey">Temperature Alerts</span>
              <span className="text-sm font-medium text-critical">2 bins</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-grey">Hygiene Compliance</span>
              <span className="text-sm font-medium text-healthy">92%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Environmental Trends */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <h3 className="text-lg font-semibold text-dark-blue mb-6">Environmental Trends</h3>
        
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={environmentalData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12, fill: '#7F8C8D' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#7F8C8D' }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px' }}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="temperature" 
              stackId="1"
              stroke="#E74C3C" 
              fill="#E74C3C" 
              fillOpacity={0.6}
              name="Temperature (°C)"
            />
            <Area 
              type="monotone" 
              dataKey="humidity" 
              stackId="2"
              stroke="#3498DB" 
              fill="#3498DB" 
              fillOpacity={0.6}
              name="Humidity (%)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Collection Efficiency */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-card p-6">
          <h3 className="text-lg font-semibold text-dark-blue mb-4">Collection Efficiency</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-grey">On-Time Collections</span>
                <span className="text-dark-blue font-medium">85%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-healthy h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-grey">Route Optimization</span>
                <span className="text-dark-blue font-medium">72%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-steel-blue h-2 rounded-full" style={{ width: '72%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-grey">Fuel Efficiency</span>
                <span className="text-dark-blue font-medium">91%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-humidity h-2 rounded-full" style={{ width: '91%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <h3 className="text-lg font-semibold text-dark-blue mb-4">Peak Hours Analysis</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-grey">Morning Peak (6-9 AM)</span>
              <span className="text-sm font-medium text-warning">High Activity</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-grey">Mid-day (12-2 PM)</span>
              <span className="text-sm font-medium text-healthy">Moderate</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-grey">Evening (5-8 PM)</span>
              <span className="text-sm font-medium text-warning">High Activity</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-grey">Night (9 PM-5 AM)</span>
              <span className="text-sm font-medium text-healthy">Low Activity</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <h3 className="text-lg font-semibold text-dark-blue mb-4">Weekly Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-grey">Total Collections</span>
              <span className="text-sm font-medium text-dark-blue">84</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-grey">Waste Processed</span>
              <span className="text-sm font-medium text-dark-blue">1,247 kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-grey">Avg Response Time</span>
              <span className="text-sm font-medium text-dark-blue">2.1 hrs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-grey">Critical Alerts</span>
              <span className="text-sm font-medium text-critical">12</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
