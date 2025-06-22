import React, { useState, useEffect } from 'react';
import { 
  Users, Globe, CreditCard, TrendingUp, Search, Filter, 
  Shield, Edit, Trash2, AlertCircle, CheckCircle, Crown,
  BarChart3, Calendar, DollarSign, Activity, MessageSquare,
  Settings, Bell, Download, Upload, Mail, UserCheck,
  Clock, Target, Zap, Eye, MoreHorizontal
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { supabase } from '../../lib/supabase';
import UserManagement from './UserManagement';
import SupportTickets from './SupportTickets';
import BehavioralAnalytics from './BehavioralAnalytics';
import BulkOperations from './BulkOperations';
import SystemNotifications from './SystemNotifications';

interface AdminStats {
  total_users: number;
  active_users_today: number;
  active_users_week: number;
  active_users_month: number;
  new_users_today: number;
  new_users_week: number;
  new_users_month: number;
  users_by_plan: Record<string, number>;
  users_by_role: Record<string, number>;
  top_activities: Array<{ action: string; count: number }>;
}

interface SupportStats {
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  resolved_today: number;
  avg_resolution_time: string;
  tickets_by_category: Record<string, number>;
  tickets_by_priority: Record<string, number>;
}

const AdminDashboard: React.FC = () => {
  const { user, setCurrentView } = useAppStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [supportStats, setSupportStats] = useState<SupportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Redirect if not admin
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setCurrentView('dashboard');
    }
  }, [user, setCurrentView]);

  // Fetch admin data
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAdminData();
      fetchNotifications();
    }
  }, [user]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user statistics
      const { data: userStats, error: userStatsError } = await supabase
        .rpc('admin_get_user_stats');

      if (userStatsError) {
        throw new Error(`Failed to fetch user statistics: ${userStatsError.message}`);
      }

      if (userStats && userStats.length > 0) {
        setAdminStats(userStats[0]);
      }

      // Fetch support statistics
      const { data: supportData, error: supportError } = await supabase
        .rpc('admin_get_support_stats');

      if (supportError) {
        throw new Error(`Failed to fetch support statistics: ${supportError.message}`);
      }

      if (supportData && supportData.length > 0) {
        setSupportStats(supportData[0]);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('system_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      setNotifications(data || []);
    } catch (err) {
      console.error('Error in fetchNotifications:', err);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'users', name: 'User Management', icon: <Users className="h-4 w-4" /> },
    { id: 'support', name: 'Support Tickets', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'analytics', name: 'Behavioral Analytics', icon: <Activity className="h-4 w-4" /> },
    { id: 'bulk', name: 'Bulk Operations', icon: <Zap className="h-4 w-4" /> },
    { id: 'notifications', name: 'Notifications', icon: <Bell className="h-4 w-4" /> },
  ];

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You need admin privileges to access this page</p>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Shield className="h-8 w-8 text-purple-600" />
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              </div>
              <p className="text-gray-600">Comprehensive system management and analytics</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchAdminData}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center"
              >
                <Activity className="h-4 w-4 mr-2" />
                Refresh Data
              </button>
              <div className="relative">
                <Bell className="h-6 w-6 text-gray-600" />
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notifications.filter(n => !n.is_read).length}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center"
          >
            <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </motion.div>
        )}

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Key Metrics */}
              {adminStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <span className="text-2xl font-bold text-gray-900">{adminStats.total_users}</span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 mb-1">Total Users</h3>
                    <p className="text-xs text-gray-500">+{adminStats.new_users_today} today</p>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Activity className="h-6 w-6 text-green-600" />
                      </div>
                      <span className="text-2xl font-bold text-gray-900">{adminStats.active_users_today}</span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 mb-1">Active Today</h3>
                    <p className="text-xs text-gray-500">{adminStats.active_users_week} this week</p>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <MessageSquare className="h-6 w-6 text-purple-600" />
                      </div>
                      <span className="text-2xl font-bold text-gray-900">{supportStats?.open_tickets || 0}</span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 mb-1">Open Tickets</h3>
                    <p className="text-xs text-gray-500">{supportStats?.resolved_today || 0} resolved today</p>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-orange-600" />
                      </div>
                      <span className="text-2xl font-bold text-gray-900">{adminStats.new_users_week}</span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 mb-1">New This Week</h3>
                    <p className="text-xs text-gray-500">{adminStats.new_users_month} this month</p>
                  </div>
                </div>
              )}

              {/* Charts and Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Distribution */}
                {adminStats && (
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">By Plan</h4>
                        <div className="space-y-2">
                          {Object.entries(adminStats.users_by_plan).map(([plan, count]) => (
                            <div key={plan} className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 capitalize">{plan}</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${(count / adminStats.total_users) * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium text-gray-900">{count}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">By Role</h4>
                        <div className="space-y-2">
                          {Object.entries(adminStats.users_by_role).map(([role, count]) => (
                            <div key={role} className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 capitalize">{role}</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-purple-600 h-2 rounded-full" 
                                    style={{ width: `${(count / adminStats.total_users) * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium text-gray-900">{count}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Top Activities */}
                {adminStats && (
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top User Activities</h3>
                    <div className="space-y-3">
                      {adminStats.top_activities.slice(0, 8).map((activity, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{activity.action.replace(/_/g, ' ')}</span>
                          <span className="text-sm font-medium text-gray-900">{activity.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Notifications */}
              {notifications.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent System Notifications</h3>
                  <div className="space-y-3">
                    {notifications.slice(0, 5).map((notification) => (
                      <div key={notification.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          notification.severity === 'critical' ? 'bg-red-500' :
                          notification.severity === 'warning' ? 'bg-yellow-500' :
                          notification.severity === 'error' ? 'bg-red-400' : 'bg-blue-500'
                        }`}></div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
                          <p className="text-sm text-gray-600">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'support' && <SupportTickets />}
          {activeTab === 'analytics' && <BehavioralAnalytics />}
          {activeTab === 'bulk' && <BulkOperations />}
          {activeTab === 'notifications' && <SystemNotifications notifications={notifications} onRefresh={fetchNotifications} />}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;