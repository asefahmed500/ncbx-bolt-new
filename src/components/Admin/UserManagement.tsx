import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Edit, Trash2, Mail, Shield, 
  MoreHorizontal, Download, Upload, UserCheck, UserX,
  Calendar, Activity, Eye, MessageSquare, Settings
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/useAppStore';

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
  last_activity: string;
  activity_count: number;
}

const UserManagement: React.FC = () => {
  const { user } = useAppStore();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'admin'>('all');
  const [filterPlan, setFilterPlan] = useState<'all' | 'free' | 'pro' | 'business'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'activity'>('newest');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showUserDetails, setShowUserDetails] = useState<string | null>(null);
  const [userActivity, setUserActivity] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('admin_get_all_users_detailed');
      
      if (error) {
        console.error('Error fetching users:', error);
        return;
      }
      
      setUsers(data || []);
    } catch (err) {
      console.error('Error in fetchUsers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserActivity = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('admin_get_user_activity', {
        target_user_id: userId,
        days_back: 30
      });
      
      if (error) {
        console.error('Error fetching user activity:', error);
        return;
      }
      
      setUserActivity(data || []);
    } catch (err) {
      console.error('Error in fetchUserActivity:', err);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      const { error } = await supabase.rpc('admin_update_user_role', {
        target_user_id: userId,
        new_role: newRole
      });

      if (error) {
        throw new Error(error.message);
      }

      setUsers(prev => 
        prev.map(u => 
          u.id === userId ? { ...u, role: newRole } : u
        )
      );
    } catch (err) {
      console.error('Error updating user role:', err);
    }
  };

  const updateUserPlan = async (userId: string, newPlan: 'free' | 'pro' | 'business') => {
    try {
      const { error } = await supabase.rpc('admin_update_user_plan', {
        target_user_id: userId,
        new_plan: newPlan
      });

      if (error) {
        throw new Error(error.message);
      }

      setUsers(prev => 
        prev.map(u => 
          u.id === userId ? { ...u, plan: newPlan } : u
        )
      );
    } catch (err) {
      console.error('Error updating user plan:', err);
    }
  };

  const sendCommunication = async (userIds: string[], subject: string, content: string) => {
    try {
      const { error } = await supabase.rpc('admin_send_communication', {
        target_user_ids: userIds,
        communication_type: 'email',
        subject,
        content,
        admin_id: user?.id
      });

      if (error) {
        throw new Error(error.message);
      }

      alert('Communication sent successfully!');
    } catch (err) {
      console.error('Error sending communication:', err);
      alert('Failed to send communication');
    }
  };

  const exportUsers = () => {
    const csvContent = [
      ['Email', 'Name', 'Role', 'Plan', 'Created', 'Websites', 'Last Activity'].join(','),
      ...filteredAndSortedUsers.map(user => [
        user.email,
        user.full_name || '',
        user.role,
        user.plan,
        new Date(user.created_at).toLocaleDateString(),
        user.website_count,
        user.last_activity ? new Date(user.last_activity).toLocaleDateString() : 'Never'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredAndSortedUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesPlan = filterPlan === 'all' || user.plan === filterPlan;
    return matchesSearch && matchesRole && matchesPlan;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'name':
        return (a.full_name || a.email).localeCompare(b.full_name || b.email);
      case 'activity':
        return (b.activity_count || 0) - (a.activity_count || 0);
      default:
        return 0;
    }
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>
          
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="business">Business</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name A-Z</option>
            <option value="activity">Most Active</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-3">
          {selectedUsers.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{selectedUsers.length} selected</span>
              <button
                onClick={() => {
                  const subject = prompt('Email subject:');
                  const content = prompt('Email content:');
                  if (subject && content) {
                    sendCommunication(selectedUsers, subject, content);
                  }
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
              >
                <Mail className="h-4 w-4 mr-1 inline" />
                Email
              </button>
            </div>
          )}
          
          <button
            onClick={exportUsers}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredAndSortedUsers.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(filteredAndSortedUsers.map(u => u.id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Websites
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedUsers.map((userData) => (
                <tr key={userData.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(userData.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(prev => [...prev, userData.id]);
                        } else {
                          setSelectedUsers(prev => prev.filter(id => id !== userData.id));
                        }
                      }}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                        {(userData.full_name || userData.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {userData.full_name || 'No name'}
                        </div>
                        <div className="text-sm text-gray-500">{userData.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={userData.role}
                      onChange={(e) => updateUserRole(userData.id, e.target.value as 'user' | 'admin')}
                      disabled={userData.id === user?.id}
                      className={`text-sm rounded-full px-3 py-1 font-medium border-0 focus:ring-2 focus:ring-purple-500 ${
                        userData.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-gray-100 text-gray-800'
                      } ${userData.id === user?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={userData.plan}
                      onChange={(e) => updateUserPlan(userData.id, e.target.value as 'free' | 'pro' | 'business')}
                      className={`text-sm rounded-full px-3 py-1 font-medium border-0 focus:ring-2 focus:ring-purple-500 ${
                        userData.plan === 'business' 
                          ? 'bg-purple-100 text-purple-800'
                          : userData.plan === 'pro'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="business">Business</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {userData.website_count || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTimeAgo(userData.last_activity)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(userData.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setShowUserDetails(userData.id);
                          fetchUserActivity(userData.id);
                        }}
                        className="text-purple-600 hover:text-purple-900"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          const subject = prompt('Email subject:');
                          const content = prompt('Email content:');
                          if (subject && content) {
                            sendCommunication([userData.id], subject, content);
                          }
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Send Email"
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">User Details</h3>
                <button
                  onClick={() => setShowUserDetails(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* User Activity Timeline */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Activity Timeline (Last 30 Days)</h4>
                {userActivity.length > 0 ? (
                  <div className="space-y-3">
                    {userActivity.map((day, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">
                            {new Date(day.date).toLocaleDateString()}
                          </span>
                          <span className="text-sm text-gray-500">
                            {day.activity_count} activities
                          </span>
                        </div>
                        <div className="space-y-1">
                          {day.activities.slice(0, 5).map((activity: any, actIndex: number) => (
                            <div key={actIndex} className="text-sm text-gray-600">
                              {activity.action.replace(/_/g, ' ')} 
                              {activity.resource_type && ` - ${activity.resource_type}`}
                              <span className="text-gray-400 ml-2">
                                {new Date(activity.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                          ))}
                          {day.activities.length > 5 && (
                            <div className="text-sm text-gray-500">
                              +{day.activities.length - 5} more activities
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No activity data available</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;