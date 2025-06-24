import React from 'react';
import { Type, Image, Square, Layout, Video, Map, FileText, Users, Minus, Box, Grid, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

interface ComponentItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  category: 'Basic' | 'Media' | 'Layout' | 'Advanced' | 'Forms';
  description: string;
  preview?: string;
}

const ComponentLibrary: React.FC = () => {
  const [activeCategory, setActiveCategory] = React.useState<string>('Basic');
  const [searchTerm, setSearchTerm] = React.useState('');

  const categories = ['Basic', 'Layout', 'Media', 'Forms', 'Advanced'];

  const components: ComponentItem[] = [
    // Basic Components
    { 
      id: 'text', 
      name: 'Text', 
      icon: <Type className="h-5 w-5" />, 
      category: 'Basic', 
      description: 'Add text content with rich formatting',
      preview: 'Lorem ipsum dolor sit amet...'
    },
    { 
      id: 'heading', 
      name: 'Heading', 
      icon: <div className="font-bold text-lg">H</div>, 
      category: 'Basic', 
      description: 'Add headings and titles',
      preview: 'Your Heading Here'
    },
    { 
      id: 'button', 
      name: 'Button', 
      icon: <Square className="h-5 w-5" />, 
      category: 'Basic', 
      description: 'Interactive button with actions',
      preview: 'Click Me'
    },
    { 
      id: 'divider', 
      name: 'Divider', 
      icon: <Minus className="h-5 w-5" />, 
      category: 'Basic', 
      description: 'Horizontal line separator',
      preview: '─────────'
    },
    
    // Layout Components
    { 
      id: 'container', 
      name: 'Container', 
      icon: <Box className="h-5 w-5" />, 
      category: 'Layout', 
      description: 'Content container with padding',
      preview: '□ Container'
    },
    { 
      id: 'columns', 
      name: 'Columns', 
      icon: <Grid className="h-5 w-5" />, 
      category: 'Layout', 
      description: 'Multi-column layout',
      preview: '║ ║ ║'
    },
    { 
      id: 'hero', 
      name: 'Hero Section', 
      icon: <Layout className="h-5 w-5" />, 
      category: 'Layout', 
      description: 'Large banner section',
      preview: 'Hero Banner'
    },
    { 
      id: 'section', 
      name: 'Section', 
      icon: <Layers className="h-5 w-5" />, 
      category: 'Layout', 
      description: 'Content section wrapper',
      preview: 'Section Block'
    },
    
    // Media Components
    { 
      id: 'image', 
      name: 'Image', 
      icon: <Image className="h-5 w-5" />, 
      category: 'Media', 
      description: 'Add images and photos',
      preview: '🖼️ Image'
    },
    { 
      id: 'video', 
      name: 'Video', 
      icon: <Video className="h-5 w-5" />, 
      category: 'Media', 
      description: 'Embed videos from YouTube, Vimeo',
      preview: '▶️ Video'
    },
    { 
      id: 'gallery', 
      name: 'Gallery', 
      icon: <Grid className="h-5 w-5" />, 
      category: 'Media', 
      description: 'Image gallery with lightbox',
      preview: '🖼️ 🖼️ 🖼️'
    },
    { 
      id: 'icon', 
      name: 'Icon', 
      icon: <div className="text-lg">⭐</div>, 
      category: 'Media', 
      description: 'Icons and symbols',
      preview: '⭐ Icon'
    },
    
    // Form Components
    { 
      id: 'form', 
      name: 'Contact Form', 
      icon: <FileText className="h-5 w-5" />, 
      category: 'Forms', 
      description: 'Contact form with validation',
      preview: '📝 Form'
    },
    { 
      id: 'input', 
      name: 'Input Field', 
      icon: <div className="border-b-2 border-gray-400 w-4 h-3"></div>, 
      category: 'Forms', 
      description: 'Text input field',
      preview: '[ Input ]'
    },
    { 
      id: 'textarea', 
      name: 'Text Area', 
      icon: <div className="border border-gray-400 w-4 h-4"></div>, 
      category: 'Forms', 
      description: 'Multi-line text input',
      preview: '[ Text Area ]'
    },
    { 
      id: 'checkbox', 
      name: 'Checkbox', 
      icon: <div className="w-3 h-3 border border-gray-400 flex items-center justify-center text-xs">✓</div>, 
      category: 'Forms', 
      description: 'Checkbox input',
      preview: '☑️ Option'
    },
    
    // Advanced Components
    { 
      id: 'map', 
      name: 'Map', 
      icon: <Map className="h-5 w-5" />, 
      category: 'Advanced', 
      description: 'Interactive Google Maps',
      preview: '🗺️ Map'
    },
    { 
      id: 'testimonials', 
      name: 'Testimonials', 
      icon: <Users className="h-5 w-5" />, 
      category: 'Advanced', 
      description: 'Customer testimonials slider',
      preview: '💬 Reviews'
    },
    { 
      id: 'pricing', 
      name: 'Pricing Table', 
      icon: <div className="text-lg">$</div>, 
      category: 'Advanced', 
      description: 'Pricing plans comparison',
      preview: '💰 Pricing'
    },
    { 
      id: 'countdown', 
      name: 'Countdown', 
      icon: <div className="text-lg">⏰</div>, 
      category: 'Advanced', 
      description: 'Countdown timer',
      preview: '⏰ Timer'
    },
    { 
      id: 'social', 
      name: 'Social Links', 
      icon: <div className="text-lg">📱</div>, 
      category: 'Advanced', 
      description: 'Social media links',
      preview: '📱 Social'
    },
    { 
      id: 'blog', 
      name: 'Blog Posts', 
      icon: <FileText className="h-5 w-5" />, 
      category: 'Advanced', 
      description: 'Blog post listing',
      preview: '📰 Blog'
    }
  ];

  const filteredComponents = components.filter(component => {
    const matchesCategory = activeCategory === 'All' || component.category === activeCategory;
    const matchesSearch = component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         component.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleDragStart = (e: React.DragEvent, component: ComponentItem) => {
    e.dataTransfer.setData('component', JSON.stringify(component));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <input
          type="text"
          placeholder="Search components..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`flex-shrink-0 px-3 py-2 text-sm font-medium transition-colors ${
              activeCategory === category
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Components List */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {filteredComponents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-sm">No components found</p>
            <p className="text-xs">Try adjusting your search</p>
          </div>
        ) : (
          filteredComponents.map((component, index) => (
            <motion.div
              key={component.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="relative group bg-gray-50 hover:bg-blue-50 rounded-lg p-3 transition-all border border-transparent hover:border-blue-200 hover:shadow-sm"
            >
              <div
                draggable
                onDragStart={(e: React.DragEvent) => handleDragStart(e, component)}
                className="cursor-grab active:cursor-grabbing"
              >
                <div className="flex items-start space-x-3">
                  <div className="text-gray-600 group-hover:text-blue-600 transition-colors flex-shrink-0 mt-1">
                    {component.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-900 truncate">
                        {component.name}
                      </h4>
                      <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded-full">
                        {component.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 group-hover:text-blue-600 line-clamp-2 mb-2">
                      {component.description}
                    </p>
                    {component.preview && (
                      <div className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">
                        {component.preview}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Drag Indicator */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                  <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                  <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                  <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                  <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Quick Tips */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-t border-gray-200">
        <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Quick Tips</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Drag components to the canvas</li>
          <li>• Double-click text to edit inline</li>
          <li>• Use <kbd className="bg-blue-200 px-1 rounded">Ctrl+D</kbd> to duplicate</li>
          <li>• Press <kbd className="bg-blue-200 px-1 rounded">Del</kbd> to delete selected</li>
          <li>• Right-click for context menu</li>
        </ul>
      </div>
    </div>
  );
};

export default ComponentLibrary;