import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Clock, ArrowUp, ArrowDown, Smartphone, Laptop, Tablet } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAnalytics, AnalyticsSummary } from '../../hooks/useAnalytics';

interface WebsiteAnalyticsProps {
  websiteId: string;
}

const WebsiteAnalytics: React.FC<WebsiteAnalyticsProps> = ({ websiteId }) => {
  const { analytics, summary, loading, error, getAnalyticsForDateRange } = useAnalytics(websiteId);
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30');

  useEffect(() => {
    getAnalyticsForDateRange(parseInt(timeRange));
  }, [timeRange, websiteId]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-48 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load analytics</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => getAnalyticsForDateRange(parseInt(timeRange))}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // If no data yet, show placeholder
  if (!summary) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data yet</h3>
          <p className="text-gray-600">
            Analytics data will appear here after your website is published and receives visitors.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white rounded-xl p-6 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 sm:mb-0">Website Analytics</h3>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setTimeRange('7')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              timeRange === '7' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
            }`}
          >
            7 days
          </button>
          <button
            onClick={() => setTimeRange('30')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              timeRange === '30' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
            }`}
          >
            30 days
          </button>
          <button
            onClick={() => setTimeRange('90')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              timeRange === '90' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
            }`}
          >
            90 days
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div className={`flex items-center text-xs font-medium ${
              summary.growth_rate >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {summary.growth_rate >= 0 ? (
                <ArrowUp className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDown className="h-3 w-3 mr-1" />
              )}
              {Math.abs(Math.round(summary.growth_rate))}%
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Page Views</p>
          <p className="text-2xl font-bold text-gray-900">{summary.total_views.toLocaleString()}</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-xs text-gray-500">
              {timeRange} days
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Unique Visitors</p>
          <p className="text-2xl font-bold text-gray-900">{summary.total_visitors.toLocaleString()}</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-red-600" />
            </div>
            <div className="text-xs text-gray-500">
              Avg
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Bounce Rate</p>
          <p className="text-2xl font-bold text-gray-900">{summary.avg_bounce_rate.toFixed(1)}%</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-xs text-gray-500">
              Avg
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Session Duration</p>
          <p className="text-2xl font-bold text-gray-900">
            {Math.floor(summary.avg_session_duration / 60)}m {summary.avg_session_duration % 60}s
          </p>
        </div>
      </div>

      {/* Traffic Chart */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Traffic Overview</h4>
        <div className="bg-gray-50 rounded-lg p-4 h-64 flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Interactive chart will appear here with real data</p>
          </div>
        </div>
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Pages */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Pages</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-3">
              {summary.top_pages.map((page, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium mr-3">
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-900">{page.page}</span>
                  </div>
                  <div className="text-sm text-gray-600">{page.views.toLocaleString()} views</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Device Breakdown */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Device Breakdown</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-4">
              {summary.device_breakdown.map((device, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      {device.device === 'Desktop' && <Laptop className="h-4 w-4 text-blue-600 mr-2" />}
                      {device.device === 'Mobile' && <Smartphone className="h-4 w-4 text-green-600 mr-2" />}
                      {device.device === 'Tablet' && <Tablet className="h-4 w-4 text-purple-600 mr-2" />}
                      <span className="text-sm text-gray-900">{device.device}</span>
                    </div>
                    <span className="text-sm text-gray-600">{device.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        device.device === 'Desktop' ? 'bg-blue-600' : 
                        device.device === 'Mobile' ? 'bg-green-600' : 'bg-purple-600'
                      }`}
                      style={{ width: `${device.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WebsiteAnalytics;