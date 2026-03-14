import React, { useState } from 'react';
import { binData, wasteTrendData, fillDistributionData } from '../data/dummyData';
import { FileText, Download, BarChart3, TrendingUp } from 'lucide-react';

const Reports = () => {
  const [dateRange, setDateRange] = useState('7days');
  const [reportType, setReportType] = useState('summary');
  const [format, setFormat] = useState('pdf');

  const generateReport = () => {
    // Simulate report generation
    const reportData = {
      type: reportType,
      dateRange: dateRange,
      format: format,
      timestamp: new Date().toISOString(),
      data: {
        totalBins: binData.length,
        criticalBins: binData.filter(b => b.status === 'critical').length,
        warningBins: binData.filter(b => b.status === 'warning').length,
        normalBins: binData.filter(b => b.status === 'normal').length,
        averageFill: Math.round(binData.reduce((sum, bin) => sum + bin.fillLevel, 0) / binData.length),
        totalWeight: binData.reduce((sum, bin) => sum + bin.weight, 0).toFixed(1),
        wasteTrend: wasteTrendData,
        fillDistribution: fillDistributionData
      }
    };

    // Create downloadable file
    const content = JSON.stringify(reportData, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `waste-management-report-${Date.now()}.${format}`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const reportTemplates = [
    {
      id: 'summary',
      name: 'Daily Summary Report',
      description: 'Overview of daily waste collection metrics and bin status',
      icon: BarChart3,
      metrics: ['Total Collections', 'Average Fill Levels', 'Critical Alerts', 'Response Times']
    },
    {
      id: 'weekly',
      name: 'Weekly Performance Report',
      description: 'Detailed weekly analysis of waste management operations',
      icon: TrendingUp,
      metrics: ['Waste Trends', 'Collection Efficiency', 'Bin Health Scores', 'Cost Analysis']
    },
    {
      id: 'hygiene',
      name: 'Hygiene & Compliance Report',
      description: 'Environmental monitoring and compliance metrics',
      icon: FileText,
      metrics: ['Odor Levels', 'Temperature Monitoring', 'Humidity Levels', 'Health Scores']
    },
    {
      id: 'operational',
      name: 'Operational Efficiency Report',
      description: 'Route optimization and resource utilization analysis',
      icon: BarChart3,
      metrics: ['Route Efficiency', 'Fuel Consumption', 'Collection Times', 'Resource Allocation']
    }
  ];

  const recentReports = [
    {
      id: 1,
      name: 'Daily Summary - Mar 13, 2024',
      type: 'summary',
      generated: '2024-03-14 09:00',
      format: 'PDF',
      size: '2.4 MB'
    },
    {
      id: 2,
      name: 'Weekly Performance - Mar 7-13, 2024',
      type: 'weekly',
      generated: '2024-03-14 08:30',
      format: 'Excel',
      size: '1.8 MB'
    },
    {
      id: 3,
      name: 'Hygiene Report - Mar 13, 2024',
      type: 'hygiene',
      generated: '2024-03-14 07:15',
      format: 'PDF',
      size: '3.1 MB'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-dark-blue">Reports</h1>
        <p className="text-grey mt-1">Generate and download waste management reports</p>
      </div>

      {/* Report Generator */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <h2 className="text-lg font-semibold text-dark-blue mb-4">Generate New Report</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-dark-blue mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
            >
              <option value="summary">Daily Summary</option>
              <option value="weekly">Weekly Performance</option>
              <option value="hygiene">Hygiene & Compliance</option>
              <option value="operational">Operational Efficiency</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-blue mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
            >
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="3months">Last 3 Months</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-blue mb-2">Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue"
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={generateReport}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-steel-blue text-white rounded-lg hover:bg-civic-blue transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Generate Report</span>
            </button>
          </div>
        </div>

        {/* Report Templates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportTemplates.map((template) => {
            const Icon = template.icon;
            return (
              <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:border-steel-blue transition-colors">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-steel-blue rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-dark-blue">{template.name}</h3>
                    <p className="text-sm text-grey mt-1">{template.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {template.metrics.map((metric, index) => (
                        <span key={index} className="text-xs bg-light-grey text-dark-blue px-2 py-1 rounded">
                          {metric}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-dark-blue">Recent Reports</h2>
          <button className="text-sm text-steel-blue hover:text-civic-blue font-medium">
            View All Reports →
          </button>
        </div>

        <div className="space-y-3">
          {recentReports.map((report) => (
            <div key={report.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-light-grey transition-colors">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-light-grey rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-steel-blue" />
                </div>
                <div>
                  <h4 className="font-medium text-dark-blue">{report.name}</h4>
                  <div className="flex items-center space-x-4 text-sm text-grey mt-1">
                    <span>{report.generated}</span>
                    <span>•</span>
                    <span>{report.format}</span>
                    <span>•</span>
                    <span>{report.size}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 text-sm border border-gray-200 rounded-lg hover:bg-light-grey transition-colors">
                  Preview
                </button>
                <button className="px-3 py-1 text-sm bg-steel-blue text-white rounded-lg hover:bg-civic-blue transition-colors">
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Report Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-card p-6">
          <h3 className="text-lg font-semibold text-dark-blue mb-4">Report Generation Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-grey">Reports Generated Today</span>
              <span className="text-sm font-medium text-dark-blue">12</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-grey">This Week</span>
              <span className="text-sm font-medium text-dark-blue">48</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-grey">This Month</span>
              <span className="text-sm font-medium text-dark-blue">186</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <h3 className="text-lg font-semibold text-dark-blue mb-4">Popular Report Types</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-grey">Daily Summary</span>
              <span className="text-sm font-medium text-dark-blue">45%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-grey">Weekly Performance</span>
              <span className="text-sm font-medium text-dark-blue">30%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-grey">Hygiene Reports</span>
              <span className="text-sm font-medium text-dark-blue">15%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-grey">Operational</span>
              <span className="text-sm font-medium text-dark-blue">10%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <h3 className="text-lg font-semibold text-dark-blue mb-4">Storage Usage</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-grey">Total Storage Used</span>
              <span className="text-sm font-medium text-dark-blue">2.8 GB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-grey">Available Space</span>
              <span className="text-sm font-medium text-healthy">7.2 GB</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-steel-blue h-2 rounded-full" style={{ width: '28%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
