import React from 'react';
import { Search, Filter, Star, Eye, ArrowRight, Zap, Plus, CheckCircle, AlertCircle, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { useWebsites } from '../../hooks/useWebsites';
import { useStripe, PremiumTemplate } from '../../hooks/useStripe';
import PremiumTemplateCard from './PremiumTemplateCard';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '../ui/use-toast';

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  preview: string;
  rating: number;
  downloads: number;
  isPremium: boolean;
  tags: string[];
  features: string[];
}

const TemplatesPage: React.FC = () => {
  const { user, setCurrentWebsite, setCurrentView } = useAppStore();
  const { createWebsite } = useWebsites();
  const { getPremiumTemplates } = useStripe();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('popular');
  const [showPremiumOnly, setShowPremiumOnly] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = React.useState<Template | PremiumTemplate | null>(null);
  const [websiteData, setWebsiteData] = React.useState({
    name: '',
    description: ''
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [premiumTemplates, setPremiumTemplates] = React.useState<PremiumTemplate[]>([]);
  const [loadingPremium, setLoadingPremium] = React.useState(true);

  // Redirect to auth if not logged in
  React.useEffect(() => {
    if (!user) {
      setCurrentView('auth');
    }
  }, [user, setCurrentView]);

  // Load premium templates
  React.useEffect(() => {
    loadPremiumTemplates();
  }, [user]);

  const loadPremiumTemplates = async () => {
    try {
      setLoadingPremium(true);
      const templates = await getPremiumTemplates();
      setPremiumTemplates(templates);
    } catch (error) {
      console.error('Error loading premium templates:', error);
    } finally {
      setLoadingPremium(false);
    }
  };

  const categories = [
    { id: 'all', name: 'All Templates', count: 24 },
    { id: 'business', name: 'Business', count: 8 },
    { id: 'portfolio', name: 'Portfolio', count: 6 },
    { id: 'ecommerce', name: 'E-commerce', count: 4 },
    { id: 'blog', name: 'Blog', count: 3 },
    { id: 'restaurant', name: 'Restaurant', count: 2 },
    { id: 'creative', name: 'Creative', count: 1 }
  ];

  const freeTemplates: Template[] = [
    {
      id: '1',
      name: 'Modern Business',
      category: 'business',
      description: 'Clean and professional template perfect for modern businesses and startups',
      preview: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=500',
      rating: 4.9,
      downloads: 1245,
      isPremium: false,
      tags: ['responsive', 'modern', 'clean'],
      features: ['Contact forms', 'Service sections', 'Team showcase', 'Testimonials']
    },
    {
      id: '4',
      name: 'Restaurant Deluxe',
      category: 'restaurant',
      description: 'Elegant template for restaurants and food businesses with menu showcase',
      preview: 'https://images.pexels.com/photos/958546/pexels-photo-958546.jpeg?auto=compress&cs=tinysrgb&w=500',
      rating: 4.6,
      downloads: 654,
      isPremium: false,
      tags: ['restaurant', 'food', 'elegant'],
      features: ['Menu display', 'Reservation system', 'Gallery', 'Location map']
    },
    {
      id: '6',
      name: 'Minimalist Blog',
      category: 'blog',
      description: 'Clean and minimal blog template with great typography and readability',
      preview: 'https://images.pexels.com/photos/261662/pexels-photo-261662.jpeg?auto=compress&cs=tinysrgb&w=500',
      rating: 4.5,
      downloads: 432,
      isPremium: false,
      tags: ['blog', 'minimal', 'typography'],
      features: ['Article layouts', 'Category pages', 'Author profiles', 'Comments']
    },
    {
      id: '8',
      name: 'Personal Brand',
      category: 'portfolio',
      description: 'Perfect template for personal branding and professional online presence',
      preview: 'https://images.pexels.com/photos/374016/pexels-photo-374016.jpeg?auto=compress&cs=tinysrgb&w=500',
      rating: 4.7,
      downloads: 1123,
      isPremium: false,
      tags: ['personal', 'brand', 'professional'],
      features: ['About section', 'Resume/CV', 'Portfolio', 'Blog']
    }
  ];

  // Combine free and premium templates
  const allTemplates = [
    ...freeTemplates,
    ...premiumTemplates.map(pt => ({
      id: pt.id,
      name: pt.name,
      category: pt.category,
      description: pt.description,
      preview: pt.thumbnail_url,
      rating: 4.8, // Default rating for premium templates
      downloads: 0, // Premium templates don't show downloads
      isPremium: true,
      tags: pt.tags,
      features: pt.features
    }))
  ];

  const filteredTemplates = allTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesPremiumFilter = !showPremiumOnly || template.isPremium;
    return matchesSearch && matchesCategory && matchesPremiumFilter;
  });

  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.downloads - a.downloads;
      case 'rating':
        return b.rating - a.rating;
      case 'newest':
        return b.id.localeCompare(a.id);
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const handleUseTemplate = (template: Template | PremiumTemplate) => {
    if (!user) {
      setCurrentView('auth');
      return;
    }

    // Check if it's a premium template and user has access
    if ('price' in template) {
      // This is a premium template
      const premiumTemplate = template as PremiumTemplate;
      if (!premiumTemplate.has_access && user.plan === 'free') {
        setErrors({ plan: 'This is a premium template. Upgrade your plan or purchase individually to use it.' });
        toast({
          title: "Premium template",
          description: "This is a premium template. Upgrade your plan or purchase individually to use it.",
          variant: "destructive",
        });
        return;
      }
    }

    setShowCreateModal(template);
    setWebsiteData({
      name: `My ${template.name} Website`,
      description: `Website created from ${template.name} template`
    });
    setErrors({});
  };

  const validateWebsiteData = () => {
    const newErrors: Record<string, string> = {};

    if (!websiteData.name.trim()) {
      newErrors.name = 'Website name is required';
    } else if (websiteData.name.length < 3) {
      newErrors.name = 'Website name must be at least 3 characters';
    } else if (websiteData.name.length > 50) {
      newErrors.name = 'Website name must be less than 50 characters';
    }

    if (websiteData.description && websiteData.description.length > 200) {
      newErrors.description = 'Description must be less than 200 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateWebsite = async () => {
    if (!showCreateModal || !user) return;

    if (!validateWebsiteData()) return;

    try {
      setIsCreating(showCreateModal.id);
      
      // Create website in database
      const newWebsite = await createWebsite({
        name: websiteData.name.trim(),
        description: websiteData.description.trim() || undefined,
        template: showCreateModal.name,
        thumbnail: 'preview' in showCreateModal ? showCreateModal.preview : showCreateModal.thumbnail_url
      });
      
      // Convert to app store format and navigate to editor
      const appWebsite = {
        id: newWebsite.id,
        name: newWebsite.name,
        description: newWebsite.description || '',
        domain: newWebsite.domain || undefined,
        status: newWebsite.status,
        lastModified: new Date(newWebsite.updated_at),
        template: newWebsite.template,
        thumbnail: newWebsite.thumbnail || undefined
      };
      
      setCurrentWebsite(appWebsite);
      setShowCreateModal(null);
      setCurrentView('editor');
      
      toast({
        title: "Website created",
        description: "Your new website has been created successfully",
      });
    } catch (error) {
      console.error('Failed to create website:', error);
      setErrors({ general: error instanceof Error ? error.message : 'Failed to create website' });
      toast({
        title: "Creation failed",
        description: error instanceof Error ? error.message : 'Failed to create website',
        variant: "destructive",
      });
    } finally {
      setIsCreating(null);
    }
  };

  const handleQuickCreate = async (template: Template) => {
    if (!user) {
      setCurrentView('auth');
      return;
    }

    // Check plan restrictions for premium templates
    if (template.isPremium && user.plan === 'free') {
      setErrors({ plan: 'This is a premium template. Upgrade your plan to use it.' });
      toast({
        title: "Premium template",
        description: "This is a premium template. Upgrade your plan to use it.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(template.id);
      
      // Create website with default name
      const newWebsite = await createWebsite({
        name: `My ${template.name} Website`,
        description: `Website created from ${template.name} template`,
        template: template.name,
        thumbnail: template.preview
      });
      
      // Convert to app store format and navigate to editor
      const appWebsite = {
        id: newWebsite.id,
        name: newWebsite.name,
        description: newWebsite.description || '',
        domain: newWebsite.domain || undefined,
        status: newWebsite.status,
        lastModified: new Date(newWebsite.updated_at),
        template: newWebsite.template,
        thumbnail: newWebsite.thumbnail || undefined
      };
      
      setCurrentWebsite(appWebsite);
      setCurrentView('editor');
      
      toast({
        title: "Website created",
        description: "Your new website has been created successfully",
      });
    } catch (error) {
      console.error('Failed to create website:', error);
      setErrors({ general: error instanceof Error ? error.message : 'Failed to create website' });
      toast({
        title: "Creation failed",
        description: error instanceof Error ? error.message : 'Failed to create website',
        variant: "destructive",
      });
    } finally {
      setIsCreating(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to browse and use templates</p>
          <Button
            onClick={() => setCurrentView('auth')}
            variant="default"
            size="lg"
          >
            Sign In
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
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Perfect Template
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Start with a professionally designed template and customize it to match your vision. 
            All templates are fully responsive and optimized for performance.
          </p>
        </motion.div>

        {/* Error Messages */}
        {errors.general && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center max-w-2xl mx-auto"
          >
            <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
            <p className="text-red-700 text-sm">{errors.general}</p>
          </motion.div>
        )}

        {errors.plan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between max-w-2xl mx-auto"
          >
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-500 mr-3 flex-shrink-0" />
              <p className="text-yellow-700 text-sm">{errors.plan}</p>
            </div>
            <Button
              onClick={() => setCurrentView('profile')}
              variant="default"
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              Upgrade Plan
            </Button>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search templates..."
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
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name} ({category.count})
                    </option>
                  ))}
                </select>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest</option>
                <option value="name">Name A-Z</option>
              </select>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showPremiumOnly}
                  onChange={(e) => setShowPremiumOnly(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 flex items-center">
                  <Crown className="h-4 w-4 text-yellow-500 mr-1" />
                  Premium Only
                </span>
              </label>
            </div>
          </div>
        </motion.div>

        {/* Premium Templates Section */}
        {!showPremiumOnly && premiumTemplates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Crown className="h-6 w-6 text-yellow-500 mr-2" />
                  Premium Templates
                </h2>
                <p className="text-gray-600">Professional templates with advanced features</p>
              </div>
              <Button
                onClick={() => setShowPremiumOnly(true)}
                variant="link"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                View All Premium →
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {premiumTemplates.slice(0, 4).map((template, index) => (
                <PremiumTemplateCard
                  key={template.id}
                  template={template}
                  onUse={handleUseTemplate}
                  index={index}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Templates Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {showPremiumOnly ? 'Premium Templates' : 'All Templates'}
            </h2>
            <span className="text-gray-600">
              {sortedTemplates.length} template{sortedTemplates.length !== 1 ? 's' : ''} found
            </span>
          </div>

          {sortedTemplates.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No templates found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedTemplates.map((template, index) => {
                // Render premium templates with special component
                if (template.isPremium && 'price' in template) {
                  const premiumTemplate = premiumTemplates.find(pt => pt.id === template.id);
                  if (premiumTemplate) {
                    return (
                      <PremiumTemplateCard
                        key={template.id}
                        template={premiumTemplate}
                        onUse={handleUseTemplate}
                        index={index}
                      />
                    );
                  }
                }

                // Render free templates
                return (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.05 }}
                    className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden group border border-gray-100"
                  >
                    <div className="relative">
                      <img
                        src={template.preview}
                        alt={template.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          Free
                        </span>
                      </div>
                      <div className="absolute top-3 right-3 flex space-x-2">
                        <button className="bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-full transition-colors">
                          <Eye className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleQuickCreate(template)}
                            disabled={isCreating === template.id}
                            variant="default"
                            className="flex items-center"
                          >
                            {isCreating === template.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            ) : (
                              <Plus className="h-4 w-4 mr-2" />
                            )}
                            Quick Start
                          </Button>
                          <Button
                            onClick={() => handleUseTemplate(template)}
                            variant="secondary"
                          >
                            Customize
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {template.name}
                          </h3>
                          <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                            {template.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                            {template.rating}
                          </div>
                          <div>{template.downloads.toLocaleString()} uses</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {template.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <Button
                        onClick={() => handleUseTemplate(template)}
                        disabled={isCreating === template.id}
                        variant="default"
                        className="w-full flex items-center justify-center"
                      >
                        {isCreating === template.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          'Use This Template'
                        )}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Load More */}
        {sortedTemplates.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center mt-12"
          >
            <Button variant="outline" size="lg">
              Load More Templates
            </Button>
          </motion.div>
        )}
      </div>

      {/* Create Website Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Create New Website</h3>
                <button
                  onClick={() => setShowCreateModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              {/* Template Preview */}
              <div className="mb-6">
                <div className="relative rounded-lg overflow-hidden">
                  <img
                    src={'preview' in showCreateModal ? showCreateModal.preview : showCreateModal.thumbnail_url}
                    alt={showCreateModal.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h4 className="text-lg font-semibold">{showCreateModal.name}</h4>
                    <p className="text-sm opacity-90">{showCreateModal.description}</p>
                  </div>
                </div>
              </div>

              {/* Template Features */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Template Features</h4>
                <div className="grid grid-cols-2 gap-2">
                  {showCreateModal.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              {/* Website Details Form */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="websiteName" className="block text-sm font-medium text-gray-700 mb-2">
                    Website Name *
                  </label>
                  <input
                    id="websiteName"
                    type="text"
                    value={websiteData.name}
                    onChange={(e) => setWebsiteData(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your website name"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="websiteDescription" className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    id="websiteDescription"
                    value={websiteData.description}
                    onChange={(e) => setWebsiteData(prev => ({ ...prev, description: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.description ? 'border-red-300' : 'border-gray-300'
                    }`}
                    rows={3}
                    placeholder="Describe your website (optional)"
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                  <p className="mt-1 text-xs text-gray-500">
                    {websiteData.description.length}/200 characters
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 mt-6">
                <Button
                  onClick={() => setShowCreateModal(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateWebsite}
                  disabled={isCreating === showCreateModal.id}
                  className="flex-1 flex items-center justify-center"
                >
                  {isCreating === showCreateModal.id ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="h-4 w-4 mr-2" />
                  )}
                  Create Website
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default TemplatesPage;