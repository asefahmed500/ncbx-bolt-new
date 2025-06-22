import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Globe, 
  TrendingUp, 
  DollarSign, 
  Shield, 
  Settings, 
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus,
  AlertCircle,
  CheckCircle,
  Calendar,
  BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { supabase } from '../../lib/supabase';

interface SystemStats {
  total_users: number;
  total_websites: number;
  total_published_websites: number;
  total_premium_templates: number;
  users_this_month: number;
  websites_this_month: number;
  free_users: number;
  pro_users: number;
  business_users: number;
}

interface UserData {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'admin';
  plan: 'free' | 'pro' | 'business';
  created_at: string;
  updated_at: string;
  last_sign_in_at: string;
  website_count: number;
}

const AdminDashboard: React.FC = () => {
  const { user, setCurrentView } = useAppStore();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'admin'>('all');
  const [filterPlan, setFilterPlan] = useState<'all' | 'free' | 'pro' | 'business'>('all');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // Redirect if not admin
  useEffect(() => {
    if (!user) {
      setCurrentView('auth');
      return;
    }
    
    if (user.role !== 'admin') {
      setCurrentView('dashboard');
      return;
    }

    loadAdminData();
  }, [user, setCurrentView]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load system statistics
      const { data: statsData, error: statsError } = await supabase.rpc('admin_get_system_stats');
      if (statsError) throw statsError;

      // Load all users
      const { data: usersData, error: usersError } = await supabase.rpc('admin_get_all_users');
      if (usersError) throw usersError;

      setStats(statsData[0]);
      setUsers(usersData || []);
    } catch (err) {
      console.error('Error loading admin data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      setActionLoading(prev => ({ ...prev, [`role-${userId}`]: true }));
      
      const { error } = await supabase.rpc('admin_update_user_role', {
        target_user_id: userId,
        new_role: newRole
      });

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        action_type: 'update_user_role',
        target_user_id: userId,
        new_values: { role: newRole }
      });

      // Reload data
      await loadAdminData();
    } catch (err) {
      console.error('Error updating user role:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user role');
    } finally {
      setActionLoading(prev => ({ ...prev, [`role-${userId}`]: false }));
    }
  };

  const handleUpdateUserPlan = async (userId: string, newPlan: 'free' | 'pro' | 'business') => {
    try {
      setActionLoading(prev => ({ ...prev, [`plan-${userId}`]: true }));
      
      const { error } = await supabase.rpc('admin_update_user_plan', {
        target_user_id: userId,
        new_plan: newPlan
      });

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        action_type: 'update_user_plan',
        target_user_id: userId,
        new_values: { plan: newPlan }
      });

      // Reload data
      await loadAdminData();
    } catch (err) {
      console.error('Error updating user plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user plan');
    } finally {
      setActionLoading(prev => ({ ...prev, [`plan-${userId}`]: false }));
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesPlan = filterPlan === 'all' || user.plan === filterPlan;
    return matchesSearch && matchesRole && matchesPlan;
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleBadgeColor = (role: string) => {
    return role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800';
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'pro': return 'bg-green-100 text-green-800';
      case 'business': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
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
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Shield className="h-8 w-8 text-blue-600 mr-3" />
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Manage users, monitor system performance, and oversee platform operations
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={loadAdminData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Refresh Data
              </button>
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

        {/* Stats Cards */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-sm text-green-600 font-medium">
                  +{stats.users_this_month} this month
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.total_users}</p>
              <p className="text-sm text-gray-600">Total Users</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Globe className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-sm text-green-600 font-medium">
                  +{stats.websites_this_month} this month
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.total_websites}</p>
              <p className="text-sm text-gray-600">Total Websites</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-sm text-gray-600">
                  {Math.round((stats.total_published_websites / stats.total_websites) * 100)}% published
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.total_published_websites}</p>
              <p className="text-sm text-gray-600">Published Websites</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
                <span className="text-sm text-gray-600">
                  {stats.pro_users + stats.business_users} paid
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.total_premium_templates}</p>
              <p className="text-sm text-gray-600">Premium Templates</p>
            </div>
          </motion.div>
        )}

        {/* Plan Distribution */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Distribution</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-600">{stats.free_users}</p>
                <p className="text-sm text-gray-500">Free Users</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-gray-500 h-2 rounded-full" 
                    style={{ width: `${(stats.free_users / stats.total_users) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.pro_users}</p>
                <p className="text-sm text-gray-500">Pro Users</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${(stats.pro_users / stats.total_users) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{stats.business_users}</p>
                <p className="text-sm text-gray-500">Business Users</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full" 
                    style={{ width: `${(stats.business_users / stats.total_users) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Users Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center">
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search users by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="user">Users</option>
                <option value="admin">Admins</option>
              </select>
              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Plans</option>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="business">Business</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">User</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Role</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Plan</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Websites</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Joined</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Last Sign In</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((userData) => (
                  <tr key={userData.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium text-gray-900">{userData.full_name || 'No name'}</p>
                        <p className="text-sm text-gray-600">{userData.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(userData.role)}`}>
                        {userData.role}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getPlanBadgeColor(userData.plan)}`}>
                        {userData.plan}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-900">{userData.website_count}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-600 text-sm">{formatDate(userData.created_at)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-600 text-sm">{formatDate(userData.last_sign_in_at)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <select
                          value={userData.role}
                          onChange={(e) => handleUpdateUserRole(userData.id, e.target.value as 'user' | 'admin')}
                          disabled={actionLoading[`role-${userData.id}`]}
                          className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                        <select
                          value={userData.plan}
                          onChange={(e) => handleUpdateUserPlan(userData.id, e.target.value as 'free' | 'pro' | 'business')}
                          disabled={actionLoading[`plan-${userData.id}`]}
                          className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                        >
                          <option value="free">Free</option>
                          <option value="pro">Pro</option>
                          <option value="business">Business</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No users found</p>
              <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;