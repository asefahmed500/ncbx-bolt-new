import React from 'react';
import { Search, Filter, Star, Eye, ArrowRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';

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
}

const TemplatesPage: React.FC = () => {
  const { setCurrentWebsite, setCurrentView, addWebsite } = useAppStore();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('popular');

  const categories = [
    { id: 'all', name: 'All Templates', count: 48 },
    { id: 'business', name: 'Business', count: 12 },
    { id: 'portfolio', name: 'Portfolio', count: 8 },
    { id: 'ecommerce', name: 'E-commerce', count: 10 },
    { id: 'blog', name: 'Blog', count: 6 },
    { id: 'restaurant', name: 'Restaurant', count: 5 },
    { id: 'creative', name: 'Creative', count: 7 }
  ];

  const templates: Template[] = [
    {
      id: '1',
      name: 'Modern Business',
      category: 'business',
      description: 'Clean and professional template perfect for modern businesses',
      preview: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=500',
      rating: 4.9,
      downloads: 1245,
      isPremium: false,
      tags: ['responsive', 'modern', 'clean']
    },
    {
      id: '2',
      name: 'Creative Portfolio',
      category: 'portfolio',
      description: 'Showcase your work with this stunning portfolio template',
      preview: 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=500',
      rating: 4.8,
      downloads: 987,
      isPremium: true,
      tags: ['creative', 'portfolio', 'animated']
    },
    {
      id: '3',
      name: 'E-commerce Pro',
      category: 'ecommerce',
      description: 'Complete online store solution with shopping cart',
      preview: 'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg?auto=compress&cs=tinysrgb&w=500',
      rating: 4.7,
      downloads: 2156,
      isPremium: true,
      tags: ['ecommerce', 'shop', 'product']
    },
    {
      id: '4',
      name: 'Restaurant Deluxe',
      category: 'restaurant',
      description: 'Elegant template for restaurants and food businesses',
      preview: 'https://images.pexels.com/photos/958546/pexels-photo-958546.jpeg?auto=compress&cs=tinysrgb&w=500',
      rating: 4.6,
      downloads: 654,
      isPremium: false,
      tags: ['restaurant', 'food', 'elegant']
    },
    {
      id: '5',
      name: 'Startup Landing',
      category: 'business',
      description: 'High-converting landing page for startups',
      preview: 'https://images.pexels.com/photos/3183153/pexels-photo-3183153.jpeg?auto=compress&cs=tinysrgb&w=500',
      rating: 4.9,
      downloads: 1876,
      isPremium: true,
      tags: ['startup', 'landing', 'conversion']
    },
    {
      id: '6',
      name: 'Minimalist Blog',
      category: 'blog',
      description: 'Clean and minimal blog template with great typography',
      preview: 'https://images.pexels.com/photos/261662/pexels-photo-261662.jpeg?auto=compress&cs=tinysrgb&w=500',
      rating: 4.5,
      downloads: 432,
      isPremium: false,
      tags: ['blog', 'minimal', 'typography']
    },
    {
      id: '7',
      name: 'Creative Agency',
      category: 'creative',
      description: 'Bold and dynamic template for creative agencies',
      preview: 'https://images.pexels.com/photos/196667/pexels-photo-196667.jpeg?auto=compress&cs=tinysrgb&w=500',
      rating: 4.8,
      downloads: 789,
      isPremium: true,
      tags: ['agency', 'creative', 'bold']
    },
    {
      id: '8',
      name: 'Personal Brand',
      category: 'portfolio',
      description: 'Perfect for personal branding and professional presence',
      preview: 'https://images.pexels.com/photos/374016/pexels-photo-374016.jpeg?auto=compress&cs=tinysrgb&w=500',
      rating: 4.7,
      downloads: 1123,
      isPremium: false,
      tags: ['personal', 'brand', 'professional']
    }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.downloads - a.downloads;
      case 'rating':
        return b.rating - a.rating;
      case 'newest':
        return b.id.localeCompare(a.id);
      default:
        return 0;
    }
  });

  const handleUseTemplate = (template: Template) => {
    const newWebsite = {
      id: Date.now().toString(),
      name: `${template.name} Website`,
      description: `Website created from ${template.name} template`,
      status: 'draft' as const,
      lastModified: new Date(),
      template: template.name,
      thumbnail: template.preview
    };
    
    addWebsite(newWebsite);
    setCurrentWebsite(newWebsite);
    setCurrentView('editor');
  };

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
              </select>
            </div>
          </div>
        </motion.div>

        {/* Featured Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 mb-8 text-white"
        >
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center mb-2">
                <Zap className="h-6 w-6 mr-2" />
                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium">
                  New
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-2">AI-Powered Templates</h3>
              <p className="text-blue-100">
                Get personalized template recommendations based on your business type and style preferences.
              </p>
            </div>
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Try AI Assistant
            </button>
          </div>
        </motion.div>

        {/* Templates Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
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
              {sortedTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden group"
                >
                  <div className="relative">
                    <img
                      src={template.preview}
                      alt={template.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {template.isPremium && (
                      <div className="absolute top-3 left-3">
                        <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                          Premium
                        </span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 flex space-x-2">
                      <button className="bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-full transition-colors">
                        <Eye className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => handleUseTemplate(template)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center"
                      >
                        Use Template
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </button>
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
                    <button
                      onClick={() => handleUseTemplate(template)}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Use This Template
                    </button>
                  </div>
                </motion.div>
              ))}
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
            <button className="bg-white text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors border border-gray-300">
              Load More Templates
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TemplatesPage;