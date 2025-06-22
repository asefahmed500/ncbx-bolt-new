import React from 'react';
import { Type, Image, Square, Layout, Video, Map, FileText, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface ComponentItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  category: 'Basic' | 'Media' | 'Layout' | 'Advanced';
  description: string;
}

const ComponentLibrary: React.FC = () => {
  const [activeCategory, setActiveCategory] = React.useState<string>('Basic');

  const categories = ['Basic', 'Media', 'Layout', 'Advanced'];

  const components: ComponentItem[] = [
    // Basic Components
    { id: 'text', name: 'Text', icon: <Type className="h-5 w-5" />, category: 'Basic', description: 'Add text content' },
    { id: 'button', name: 'Button', icon: <Square className="h-5 w-5" />, category: 'Basic', description: 'Interactive button' },
    { id: 'divider', name: 'Divider', icon: <div className="w-5 h-px bg-current" />, category: 'Basic', description: 'Section divider' },
    
    // Media Components
    { id: 'image', name: 'Image', icon: <Image className="h-5 w-5" />, category: 'Media', description: 'Add images' },
    { id: 'video', name: 'Video', icon: <Video className="h-5 w-5" />, category: 'Media', description: 'Embed videos' },
    { id: 'gallery', name: 'Gallery', icon: <Layout className="h-5 w-5" />, category: 'Media', description: 'Image gallery' },
    
    // Layout Components
    { id: 'container', name: 'Container', icon: <Layout className="h-5 w-5" />, category: 'Layout', description: 'Content container' },
    { id: 'columns', name: 'Columns', icon: <div className="flex space-x-1"><div className="w-2 h-5 bg-current" /><div className="w-2 h-5 bg-current" /></div>, category: 'Layout', description: 'Multi-column layout' },
    { id: 'hero', name: 'Hero Section', icon: <Square className="h-5 w-5" />, category: 'Layout', description: 'Hero banner' },
    
    // Advanced Components
    { id: 'form', name: 'Form', icon: <FileText className="h-5 w-5" />, category: 'Advanced', description: 'Contact forms' },
    { id: 'map', name: 'Map', icon: <Map className="h-5 w-5" />, category: 'Advanced', description: 'Interactive map' },
    { id: 'testimonials', name: 'Testimonials', icon: <Users className="h-5 w-5" />, category: 'Advanced', description: 'Customer reviews' }
  ];

  const filteredComponents = components.filter(
    component => component.category === activeCategory
  );

  const handleDragStart = (e: React.DragEvent, component: ComponentItem) => {
    e.dataTransfer.setData('component', JSON.stringify(component));
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Category Tabs */}
      <div className="flex border-b border-gray-200">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
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
        {filteredComponents.map((component, index) => (
          <motion.div
            key={component.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            draggable
            onDragStart={(e) => handleDragStart(e, component)}
            className="group bg-gray-50 hover:bg-blue-50 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-colors border border-transparent hover:border-blue-200"
          >
            <div className="flex items-center space-x-3">
              <div className="text-gray-600 group-hover:text-blue-600 transition-colors">
                {component.icon}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-900">
                  {component.name}
                </h4>
                <p className="text-xs text-gray-500 group-hover:text-blue-600">
                  {component.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Tips */}
      <div className="p-4 bg-blue-50 border-t border-blue-200">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Quick Tips</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Drag components to the canvas</li>
          <li>• Click to select and edit</li>
          <li>• Use Ctrl+Z to undo</li>
        </ul>
      </div>
    </div>
  );
};

export default ComponentLibrary;