import React, { useState, useEffect } from 'react';
import { Plus, Globe, Edit3, Search, Filter, Trash2, Copy, ExternalLink, AlertCircle, Calendar, TrendingUp, BarChart3, Zap, Settings, Eye, Upload, Users, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { useWebsites } from '../../hooks/useWebsites';
import WebsiteAnalytics from './WebsiteAnalytics';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '../ui/use-toast';

const Dashboard: React.FC = () => {
  const { user, setCurrentView, setCurrentWebsite } = useAppStore();
  const { websites, loading, error, deleteWebsite, duplicateWebsite, publishWebsite, unpublishWebsite, updateWebsite, getWebsiteCollaborators } = useWebsites();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    domain: ''
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [collaborators, setCollaborators] = useState<Record<string, number>>({});

  // Fetch collaborators for each website
  useEffect(() => {
    const fetchCollaboratorsCount = async () => {
      const counts: Record<string, number> = {};
      
      for (const website of websites) {
        try {
          const websiteCollaborators = await getWebsiteCollaborators(website.id);
          counts[website.id] = websiteCollaborators.length;
        } catch (error) {
          console.error(`Error fetching collaborators for website ${website.id}:`, error);
          counts[website.id] = 0;
        }
      }
      
      setCollaborators(counts);
    };
    
    if (websites.length > 0) {
      fetchCollaboratorsCount();
    }
  }, [websites]);

  // Filter and sort websites
  const filteredAndSortedWebsites = React.useMemo(() => {
    let filtered = websites.filter(website => {
      const matchesSearch = website.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (website.description && website.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           website.template.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (website.domain && website.domain.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesFilter = filterBy === 'all' || website.status === filterBy;
      return matchesSearch && matchesFilter;
    });

    // Sort websites
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'updated':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [websites, searchTerm, filterBy, sortBy]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    const total = websites.length;
    const published = websites.filter(w => w.status === 'published').length;
    const drafts = websites.filter(w => w.status === 'draft').length;
    
    // Calculate this month's websites
    const now = new Date();
    const thisMonth = websites.filter(w => {
      const createdDate = new Date(w.created_at);
      return createdDate.getMonth() === now.getMonth() && 
             createdDate.getFullYear() === now.getFullYear();
    }).length;

    // Calculate this week's websites
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeek = websites.filter(w => 
      new Date(w.created_at) >= oneWeekAgo
    ).length;

    return [
      { 
        label: 'Total Websites', 
        value: total, 
        color: 'bg-blue-500',
        icon: <Globe className="h-5 w-5" />,
        change: thisWeek > 0 ? `+${thisWeek} this week` : 'No new websites this week'
      },
      { 
        label: 'Published', 
        value: published, 
        color: 'bg-green-500',
        icon: <TrendingUp className="h-5 w-5" />,
        change: total > 0 ? `${Math.round((published / total) * 100)}% of total` : '0% of total'
      },
      { 
        label: 'Drafts', 
        value: drafts, 
        color: 'bg-yellow-500',
        icon: <Edit3 className="h-5 w-5" />,
        change: total > 0 ? `${Math.round((drafts / total) * 100)}% of total` : '0% of total'
      },
      { 
        label: 'This Month', 
        value: thisMonth, 
        color: 'bg-purple-500',
        icon: <Calendar className="h-5 w-5" />,
        change: thisMonth > 0 ? `${thisMonth} new website${thisMonth !== 1 ? 's' : ''}` : 'No new websites'
      }
    ];
  }, [websites]);

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

  const handleShowEditModal = (website: typeof websites[0]) => {
    setEditData({
      name: website.name,
      description: website.description || '',
      domain: website.domain || ''
    });
    setEditErrors({});
    setShowEditModal(website.id);
  };

  const validateEditData = () => {
    const newErrors: Record<string, string> = {};

    if (!editData.name.trim()) {
      newErrors.name = 'Website name is required';
    } else if (editData.name.trim().length < 3) {
      newErrors.name = 'Website name must be at least 3 characters';
    } else if (editData.name.trim().length > 50) {
      newErrors.name = 'Website name must be less than 50 characters';
    }

    if (editData.description && editData.description.length > 200) {
      newErrors.description = 'Description must be less than 200 characters';
    }

    if (editData.domain && editData.domain.trim()) {
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
      if (!domainRegex.test(editData.domain.trim())) {
        newErrors.domain = 'Please enter a valid domain (e.g., example.com)';
      }
    }

    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateWebsite = async () => {
    if (!showEditModal || !validateEditData()) return;

    try {
      setIsUpdating(true);
      await updateWebsite(showEditModal, {
        name: editData.name.trim(),
        description: editData.description.trim() || undefined,
        domain: editData.domain.trim() || undefined
      });
      setShowEditModal(null);
      toast({
        title: "Website updated",
        description: "Your website has been updated successfully",
      });
    } catch (error) {
      console.error('Failed to update website:', error);
      setEditErrors({ general: error instanceof Error ? error.message : 'Failed to update website' });
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : 'Failed to update website',
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteWebsite = async (id: string) => {
    try {
      setActionLoading(prev => ({ ...prev, [`delete-${id}`]: true }));
      await deleteWebsite(id);
      setShowDeleteModal(null);
      toast({
        title: "Website deleted",
        description: "Your website has been deleted successfully",
      });
    } catch (err) {
      console.error('Failed to delete website:', err);
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : 'Failed to delete website',
        variant: "destructive",
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [`delete-${id}`]: false }));
    }
  };

  const handleDuplicateWebsite = async (id: string) => {
    try {
      setActionLoading(prev => ({ ...prev, [`duplicate-${id}`]: true }));
      await duplicateWebsite(id);
      toast({
        title: "Website duplicated",
        description: "Your website has been duplicated successfully",
      });
    } catch (err) {
      console.error('Failed to duplicate website:', err);
      toast({
        title: "Duplication failed",
        description: err instanceof Error ? err.message : 'Failed to duplicate website',
        variant: "destructive",
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [`duplicate-${id}`]: false }));
    }
  };

  const handleToggleStatus = async (website: typeof websites[0]) => {
    try {
      setActionLoading(prev => ({ ...prev, [`status-${website.id}`]: true }));
      if (website.status === 'published') {
        await unpublishWebsite(website.id);
        toast({
          title: "Website unpublished",
          description: "Your website is now in draft mode",
        });
      } else {
        await publishWebsite(website.id);
        toast({
          title: "Website published",
          description: "Your website is now live",
        });
      }
    } catch (err) {
      console.error('Failed to toggle website status:', err);
      toast({
        title: "Status change failed",
        description: err instanceof Error ? err.message : 'Failed to change website status',
        variant: "destructive",
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [`status-${website.id}`]: false }));
    }
  };

  const handleViewWebsite = (website: typeof websites[0]) => {
    if (website.domain) {
      window.open(`https://${website.domain}`, '_blank');
    } else {
      // Generate default subdomain
      const websiteName = website.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const websiteId = website.id.substring(0, 8);
      const subdomain = `${websiteName}-${websiteId}.ncbx.app`;
      window.open(`https://${subdomain}`, '_blank');
    }
  };

  const handleShowAnalytics = (websiteId: string) => {
    setShowAnalytics(websiteId === showAnalytics ? null : websiteId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="default"
            className="px-6 py-3"
          >
            Try Again
          </Button>
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
                {websites.length === 0 
                  ? "Ready to create your first website?" 
                  : `You have ${websites.length} website${websites.length !== 1 ? 's' : ''} in your account`
                }
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button
                onClick={handleCreateWebsite}
                className="flex items-center"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Website
              </Button>
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
            <Card key={index} className="border-none shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white`}>
                    {stat.icon}
                  </div>
                  <CardTitle className="text-2xl">{stat.value}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm font-medium">{stat.label}</CardDescription>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Quick Start Banner - Show only if no websites */}
        {websites.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 mb-8 text-white"
          >
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-4 md:mb-0">
                <div className="flex items-center mb-2">
                  <Zap className="h-6 w-6 mr-2" />
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium">
                    Get Started
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-2">Create Your First Website</h3>
                <p className="text-blue-100">
                  Choose from our collection of professional templates and start building your online presence today.
                </p>
              </div>
              <Button
                onClick={handleCreateWebsite}
                variant="secondary"
                className="text-blue-600 px-6 py-3"
              >
                <Plus className="h-4 w-4 mr-2" />
                Browse Templates
              </Button>
            </div>
          </motion.div>
        )}

        {/* Filters and Search - Show only if there are websites */}
        {websites.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm mb-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search websites by name, description, or template..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="h-5 w-5 text-gray-400" />
                  <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Websites ({websites.length})</option>
                    <option value="published">Published ({websites.filter(w => w.status === 'published').length})</option>
                    <option value="draft">Drafts ({websites.filter(w => w.status === 'draft').length})</option>
                  </select>
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name A-Z</option>
                  <option value="updated">Recently Updated</option>
                </select>
              </div>
            </div>

            {/* Active Filters Display */}
            {(searchTerm || filterBy !== 'all') && (
              <div className="mt-4 flex items-center space-x-2">
                <span className="text-sm text-gray-600">Active filters:</span>
                {searchTerm && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    Search: "{searchTerm}"
                  </span>
                )}
                {filterBy !== 'all' && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs capitalize">
                    Status: {filterBy}
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterBy('all');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Clear all
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Results Summary */}
        {websites.length > 0 && (searchTerm || filterBy !== 'all') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mb-6"
          >
            <p className="text-sm text-gray-600">
              Showing {filteredAndSortedWebsites.length} of {websites.length} websites
            </p>
          </motion.div>
        )}

        {/* Websites Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {filteredAndSortedWebsites.length === 0 ? (
            <Card className="p-12 text-center">
              {websites.length === 0 ? (
                // No websites at all
                <>
                  <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <CardTitle className="mb-2">
                    No websites yet
                  </CardTitle>
                  <CardDescription className="mb-6">
                    Create your first website to get started with NCBX
                  </CardDescription>
                  <Button
                    onClick={handleCreateWebsite}
                    variant="default"
                    size="lg"
                  >
                    Create Your First Website
                  </Button>
                </>
              ) : (
                // No websites match filters
                <>
                  <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <CardTitle className="mb-2">
                    No websites found
                  </CardTitle>
                  <CardDescription className="mb-6">
                    Try adjusting your search terms or filters
                  </CardDescription>
                  <div className="flex justify-center gap-3">
                    <Button
                      onClick={() => {
                        setSearchTerm('');
                        setFilterBy('all');
                      }}
                      variant="outline"
                      className="mr-3"
                    >
                      Clear Filters
                    </Button>
                    <Button
                      onClick={handleCreateWebsite}
                      variant="default"
                    >
                      Create New Website
                    </Button>
                  </div>
                </>
              )}
            </Card>
          ) : (
            <div className="space-y-6">
              {filteredAndSortedWebsites.map((website, index) => (
                <React.Fragment key={website.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.05 }}
                    className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden group border border-gray-100"
                  >
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/3 lg:w-1/4 relative">
                        <img
                          src={website.thumbnail || 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=400'}
                          alt={website.name}
                          className="w-full h-48 md:h-full object-cover"
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
                            <Button
                              onClick={() => handleEditWebsite(website)}
                              variant="secondary"
                              className="flex items-center"
                            >
                              <Edit3 className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button 
                              onClick={() => handleViewWebsite(website)}
                              disabled={website.status !== 'published'}
                              className="flex items-center"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="p-6 flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-1 line-clamp-1">
                              {website.name}
                            </h3>
                            {website.description && (
                              <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                                {website.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 mb-3">
                              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                                {website.template}
                              </span>
                              {collaborators[website.id] > 1 && (
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs flex items-center">
                                  <Users className="h-3 w-3 mr-1" />
                                  {collaborators[website.id]} collaborators
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            {website.domain && (
                              <p className="text-sm text-blue-600 font-medium mb-1 truncate">
                                {website.domain}
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              Updated {formatDate(website.updated_at)}
                            </p>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center justify-between">
                          <div className="flex space-x-1">
                            <Button
                              onClick={() => handleEditWebsite(website)}
                              variant="ghost"
                              size="icon"
                              title="Edit website"
                            >
                              <Edit3 className="h-4 w-4 text-gray-600" />
                            </Button>
                            <Button
                              onClick={() => handleShowEditModal(website)}
                              variant="ghost"
                              size="icon"
                              title="Edit properties"
                            >
                              <Settings className="h-4 w-4 text-gray-600" />
                            </Button>
                            <Button
                              onClick={() => handleDuplicateWebsite(website.id)}
                              disabled={actionLoading[`duplicate-${website.id}`]}
                              variant="ghost"
                              size="icon"
                              title="Duplicate website"
                            >
                              {actionLoading[`duplicate-${website.id}`] ? (
                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Copy className="h-4 w-4 text-gray-600" />
                              )}
                            </Button>
                            <Button
                              onClick={() => handleShowAnalytics(website.id)}
                              variant={showAnalytics === website.id ? "secondary" : "ghost"}
                              size="icon"
                              title="View analytics"
                            >
                              <BarChart3 className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => setShowDeleteModal(website.id)}
                              variant="ghost"
                              size="icon"
                              className="hover:bg-red-100 hover:text-red-600"
                              title="Delete website"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                          <div className="flex space-x-2">
                            {website.status === 'published' && (
                              <Button
                                onClick={() => handleViewWebsite(website)}
                                variant="outline"
                                size="sm"
                                className="flex items-center"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            )}
                            <Button
                              onClick={() => handleToggleStatus(website)}
                              disabled={actionLoading[`status-${website.id}`]}
                              variant={website.status === 'published' ? "outline" : "default"}
                              size="sm"
                              className={website.status === 'published' ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200" : ""}
                            >
                              {actionLoading[`status-${website.id}`] ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                website.status === 'published' ? 'Unpublish' : 'Publish'
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Website Analytics */}
                  {showAnalytics === website.id && (
                    <WebsiteAnalytics websiteId={website.id} />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        {websites.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white hover:shadow-md transition-shadow cursor-pointer" onClick={handleCreateWebsite}>
                <CardContent className="p-6">
                  <Plus className="h-8 w-8 text-blue-600 mb-2" />
                  <CardTitle className="text-base">New Website</CardTitle>
                  <CardDescription>Start from template</CardDescription>
                </CardContent>
              </Card>
              <Card className="bg-white hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCurrentView('templates')}>
                <CardContent className="p-6">
                  <Globe className="h-8 w-8 text-green-600 mb-2" />
                  <CardTitle className="text-base">Browse Templates</CardTitle>
                  <CardDescription>Explore gallery</CardDescription>
                </CardContent>
              </Card>
              <Card className="bg-white hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCurrentView('profile')}>
                <CardContent className="p-6">
                  <div className="h-8 w-8 bg-purple-600 rounded mb-2 flex items-center justify-center text-white text-sm font-bold">
                    {user?.plan.charAt(0).toUpperCase()}
                  </div>
                  <CardTitle className="text-base">Manage Plan</CardTitle>
                  <CardDescription>Current: {user?.plan}</CardDescription>
                </CardContent>
              </Card>
              <Card 
                className="bg-white hover:shadow-md transition-shadow cursor-pointer" 
                onClick={() => {
                  // Show analytics for the first website if available
                  if (websites.length > 0) {
                    handleShowAnalytics(websites[0].id);
                  }
                }}
              >
                <CardContent className="p-6">
                  <BarChart3 className="h-8 w-8 text-orange-600 mb-2" />
                  <CardTitle className="text-base">Analytics</CardTitle>
                  <CardDescription>View insights</CardDescription>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <CardHeader>
              <CardTitle>Delete Website</CardTitle>
              <CardDescription>
                Are you sure you want to delete this website? This action cannot be undone and all data will be permanently lost.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-end space-x-3">
              <Button
                onClick={() => setShowDeleteModal(null)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDeleteWebsite(showDeleteModal)}
                disabled={actionLoading[`delete-${showDeleteModal}`]}
                variant="destructive"
                className="flex items-center justify-center"
              >
                {actionLoading[`delete-${showDeleteModal}`] ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Delete'
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Edit Website Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Edit Website Properties</h3>
                <button
                  onClick={() => setShowEditModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              {editErrors.general && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{editErrors.general}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="editName" className="block text-sm font-medium text-gray-700 mb-2">
                    Website Name *
                  </label>
                  <input
                    id="editName"
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      editErrors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter website name"
                  />
                  {editErrors.name && <p className="mt-1 text-sm text-red-600">{editErrors.name}</p>}
                </div>

                <div>
                  <label htmlFor="editDescription" className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    id="editDescription"
                    value={editData.description}
                    onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      editErrors.description ? 'border-red-300' : 'border-gray-300'
                    }`}
                    rows={3}
                    placeholder="Describe your website"
                  />
                  {editErrors.description && <p className="mt-1 text-sm text-red-600">{editErrors.description}</p>}
                  <p className="mt-1 text-xs text-gray-500">
                    {editData.description.length}/200 characters
                  </p>
                </div>

                <div>
                  <label htmlFor="editDomain" className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Domain (Optional)
                  </label>
                  <input
                    id="editDomain"
                    type="text"
                    value={editData.domain}
                    onChange={(e) => setEditData(prev => ({ ...prev, domain: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      editErrors.domain ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="example.com"
                  />
                  {editErrors.domain && <p className="mt-1 text-sm text-red-600">{editErrors.domain}</p>}
                  <p className="mt-1 text-xs text-gray-500">
                    Enter your custom domain without http:// or https://
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <Button
                  onClick={() => setShowEditModal(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateWebsite}
                  disabled={isUpdating}
                  className="flex-1 flex items-center justify-center"
                >
                  {isUpdating ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Update Website
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;