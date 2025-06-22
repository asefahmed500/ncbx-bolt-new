import React from 'react';
import { Plus, Globe, Edit3, MoreHorizontal, Search, Filter, Trash2, Copy, ExternalLink, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { useWebsites } from '../../hooks/useWebsites';

const Dashboard: React.FC = () => {
  const { user, setCurrentView, setCurrentWebsite } = useAppStore();
  const { websites, loading, error, deleteWebsite, duplicateWebsite } = useWebsites();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterBy, setFilterBy] = React.useState('all');
  const [showDeleteModal, setShowDeleteModal] = React.useState<string | null>(null);

  const filteredWebsites = websites.filter(website => {
    const matchesSearch = website.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (website.description && website.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterBy === 'all' || website.status === filterBy;
    return matchesSearch && matchesFilter;
  });

  const handleCreateWebsite = () => {
    setCurrentView('templates');
  };

  const handleEditWebsite = (website: typeof websites[0]) => {
    // Convert database website to app store format
    const appWebsite = {
      id: website.id,
      name: website.name,
      description: website.description || '',
      domain: website.domain || undefined,
      status: website.status,
      lastModified: new Date(website.updated_at),
      template: website.template,
      thumbnail: website.thumbnail || undefined
    };
    
    setCurrentWebsite(appWebsite);
    setCurrentView('editor');
  };

  const handleDeleteWebsite = async (id: string) => {
    try {
      await deleteWebsite(id);
      setShowDeleteModal(null);
    } catch (err) {
      console.error('Failed to delete website:', err);
      // You could add a toast notification here
    }
  };

  const handleDuplicateWebsite = async (id: string) => {
    try {
      await duplicateWebsite(id);
    } catch (err) {
      console.error('Failed to duplicate website:', err);
      // You could add a toast notification here
    }
  };

  const stats = [
    { label: 'Total Websites', value: websites.length, color: 'bg-blue-500' },
    { label: 'Published', value: websites.filter(w => w.status === 'published').length, color: 'bg-green-500' },
    { label: 'Drafts', value: websites.filter(w => w.status === 'draft').length, color: 'bg-yellow-500' },
    { label: 'This Month', value: websites.filter(w => 
      new Date(w.created_at).getMonth() === new Date().getMonth() &&
      new Date(w.created_at).getFullYear() === new Date().getFullYear()
    ).length, color: 'bg-purple-500' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your websites...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load websites</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your websites and track your progress
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={handleCreateWebsite}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Website
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center">
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white font-bold text-xl mr-4`}>
                  {stat.value}
                </div>
                <div>
                  <p className="text-gray-600 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search websites..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Websites</option>
                  <option value="published">Published</option>
                  <option value="draft">Drafts</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Websites Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {filteredWebsites.length === 0 ? (
            <div className="bg-white rounded-xl p-12 shadow-sm text-center">
              <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm || filterBy !== 'all' ? 'No websites found' : 'No websites yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterBy !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Create your first website to get started'
                }
              </p>
              {!searchTerm && filterBy === 'all' && (
                <button
                  onClick={handleCreateWebsite}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Create Your First Website
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWebsites.map((website, index) => (
                <motion.div
                  key={website.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden group"
                >
                  <div className="relative">
                    <img
                      src={website.thumbnail || 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=400'}
                      alt={website.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-4 right-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        website.status === 'published' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {website.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditWebsite(website)}
                          className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center"
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit
                        </button>
                        {website.domain && (
                          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          {website.name}
                        </h3>
                        {website.description && (
                          <p className="text-gray-600 text-sm mb-2">
                            {website.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          Template: {website.template}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        {website.domain && (
                          <p className="text-sm text-blue-600 font-medium mb-1">
                            {website.domain}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          Modified {new Date(website.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditWebsite(website)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit website"
                        >
                          <Edit3 className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDuplicateWebsite(website.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Duplicate website"
                        >
                          <Copy className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(website.id)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete website"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={handleCreateWebsite}
              className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-left"
            >
              <Plus className="h-8 w-8 text-blue-600 mb-2" />
              <h4 className="font-semibold text-gray-900">New Website</h4>
              <p className="text-sm text-gray-600">Start from template</p>
            </button>
            <button
              onClick={() => setCurrentView('templates')}
              className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-left"
            >
              <Globe className="h-8 w-8 text-green-600 mb-2" />
              <h4 className="font-semibold text-gray-900">Browse Templates</h4>
              <p className="text-sm text-gray-600">Explore gallery</p>
            </button>
            <button className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-left">
              <div className="h-8 w-8 bg-purple-600 rounded mb-2 flex items-center justify-center text-white text-sm font-bold">
                {user?.plan.charAt(0).toUpperCase()}
              </div>
              <h4 className="font-semibold text-gray-900">Upgrade Plan</h4>
              <p className="text-sm text-gray-600">Unlock more features</p>
            </button>
            <button className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-left">
              <div className="h-8 w-8 bg-orange-600 rounded mb-2 flex items-center justify-center text-white">
                <ExternalLink className="h-4 w-4" />
              </div>
              <h4 className="font-semibold text-gray-900">Help Center</h4>
              <p className="text-sm text-gray-600">Get support</p>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Website</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this website? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteWebsite(showDeleteModal)}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;