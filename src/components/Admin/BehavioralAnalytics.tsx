import React, { useState, useEffect } from 'react';
import { 
  Activity, TrendingUp, Users, Eye, Clock, MousePointer,
  BarChart3, PieChart, Calendar, Filter, Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';

interface BehavioralData {
  event_type: string;
  count: number;
  unique_users: number;
  avg_session_duration: number;
  bounce_rate: number;
}

interface UserSegment {
  id: string;
  name: string;
  description: string;
  user_count: number;
  criteria: any;
  created_at: string;
}

const BehavioralAnalytics: React.FC = () => {
  const [behavioralData, setBehavioralData] = useState<BehavioralData[]>([]);
  const [userSegments, setUserSegments] = useState<UserSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30');
  const [selectedMetric, setSelectedMetric] = useState<'events' | 'users' | 'sessions'>('events');

  useEffect(() => {
    fetchBehavioralData();
    fetchUserSegments();
  }, [timeRange]);

  const fetchBehavioralData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('admin_get_behavioral_analytics', {
        days_back: parseInt(timeRange)
      });
      
      if (error) {
        console.error('Error fetching behavioral data:', error);
        return;
      }
      
      setBehavioralData(data || []);
    } catch (err) {
      console.error('Error in fetchBehavioralData:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSegments = async () => {
    try {
      const { data, error } = await supabase
        .from('user_segments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching user segments:', error);
        return;
      }
      
      setUserSegments(data || []);
    } catch (err) {
      console.error('Error in fetchUserSegments:', err);
    }
  };

  const createUserSegment = async () => {
    const name = prompt('Segment name:');
    const description = prompt('Segment description:');
    
    if (!name || !description) return;
    
    const criteria = {
      plan: 'pro', // Example criteria
      created_after: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    try {
      const { data, error } = await supabase.rpc('admin_create_user_segment', {
        segment_name: name,
        segment_description: description,
        criteria,
        admin_id: 'current-admin-id' // Replace with actual admin ID
      });
      
      if (error) {
        console.error('Error creating segment:', error);
        return;
      }
      
      fetchUserSegments();
    } catch (err) {
      console.error('Error in createUserSegment:', err);
    }
  };

  const exportAnalytics = () => {
    const csvContent = [
      ['Event Type', 'Count', 'Unique Users', 'Avg Session Duration', 'Bounce Rate'].join(','),
      ...behavioralData.map(item => [
        item.event_type,
        item.count,
        item.unique_users,
        item.avg_session_duration,
        item.bounce_rate
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `behavioral-analytics-${timeRange}days.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const topEvents = behavioralData.slice(0, 10);
  const totalEvents = behavioralData.reduce((sum, item) => sum + item.count, 0);
  const totalUsers = behavioralData.reduce((sum, item) => sum + item.unique_users, 0);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center space-x-4">
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
          
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="events">Events</option>
            <option value="users">Unique Users</option>
            <option value="sessions">Sessions</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={createUserSegment}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Create Segment
          </button>
          <button
            onClick={exportAnalytics}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/*  Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{totalEvents.toLocaleString()}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Events</h3>
          <p className="text-xs text-gray-500">Last {timeRange} days</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{totalUsers.toLocaleString()}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Active Users</h3>
          <p className="text-xs text-gray-500">Last {timeRange} days</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Eye className="h-6 w-6 text-purple-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {behavioralData.length > 0 ? 
                (behavioralData.reduce((sum, item) => sum + item.bounce_rate, 0) / behavioralData.length).toFixed(1) + '%' : 
                '0%'}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Avg. Bounce Rate</h3>
          <p className="text-xs text-gray-500">Last {timeRange} days</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {behavioralData.length > 0 ? 
                Math.round(behavioralData.reduce((sum, item) => sum + item.avg_session_duration, 0) / behavioralData.length) + 's' : 
                '0s'}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Avg. Session Duration</h3>
          <p className="text-xs text-gray-500">Last {timeRange} days</p>
        </div>
      </div>

      {/* Top Events */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Top User Events</h3>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {topEvents.map((event, index) => (
              <div key={index} className="flex items-center">
                <div className="w-8 text-sm font-medium text-gray-500">{index + 1}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{event.event_type.replace(/_/g, ' ')}</div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{event.count.toLocaleString()} events</span>
                    <span>{event.unique_users.toLocaleString()} users</span>
                  </div>
                </div>
                <div className="w-32">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(event.count / (totalEvents || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Segments */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">User Segments</h3>
        </div>
        
        <div className="p-6">
          {userSegments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userSegments.map((segment) => (
                <div key={segment.id} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-1">{segment.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{segment.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{segment.user_count} users</span>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      View Users
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No segments created</h3>
              <p className="text-gray-500 mb-4">Create segments to group users by behavior or attributes</p>
              <button
                onClick={createUserSegment}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                Create First Segment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Placeholder for Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Trends</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Event trend chart will appear here</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <PieChart className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">User distribution chart will appear here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BehavioralAnalytics;