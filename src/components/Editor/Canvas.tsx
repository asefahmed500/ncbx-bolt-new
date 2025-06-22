import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';

interface CanvasProps {
  editorMode: 'desktop' | 'tablet' | 'mobile';
  isPreviewMode: boolean;
}

const Canvas: React.FC<CanvasProps> = ({ editorMode, isPreviewMode }) => {
  const { selectedComponent, setSelectedComponent } = useAppStore();
  const [components, setComponents] = React.useState<Array<{
    id: string;
    type: string;
    content: string;
    styles: Record<string, any>;
    position: { x: number; y: number };
  }>>([
    {
      id: '1',
      type: 'text',
      content: 'Welcome to Your Website',
      styles: { fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' },
      position: { x: 50, y: 50 }
    },
    {
      id: '2',
      type: 'text',
      content: 'This is a sample paragraph. You can edit this text by clicking on it and modifying the content in the properties panel.',
      styles: { fontSize: '1rem', color: '#6b7280', lineHeight: '1.6' },
      position: { x: 50, y: 120 }
    },
    {
      id: '3',
      type: 'button',
      content: 'Get Started',
      styles: { 
        backgroundColor: '#3b82f6', 
        color: 'white', 
        padding: '12px 24px',
        borderRadius: '8px',
        border: 'none',
        fontWeight: '600'
      },
      position: { x: 50, y: 200 }
    }
  ]);

  const canvasWidth = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px'
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const componentData = e.dataTransfer.getData('component');
    if (componentData) {
      const component = JSON.parse(componentData);
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newComponent = {
        id: Date.now().toString(),
        type: component.id,
        content: getDefaultContent(component.id),
        styles: getDefaultStyles(component.id),
        position: { x, y }
      };

      setComponents(prev => [...prev, newComponent]);
    }
  };

  const getDefaultContent = (type: string): string => {
    switch (type) {
      case 'text': return 'New text element';
      case 'button': return 'Button';
      case 'image': return 'Image placeholder';
      default: return 'Element';
    }
  };

  const getDefaultStyles = (type: string): Record<string, any> => {
    switch (type) {
      case 'text':
        return { fontSize: '1rem', color: '#374151' };
      case 'button':
        return { 
          backgroundColor: '#3b82f6', 
          color: 'white', 
          padding: '8px 16px',
          borderRadius: '6px',
          border: 'none'
        };
      case 'image':
        return { width: '200px', height: '150px', backgroundColor: '#f3f4f6' };
      default:
        return {};
    }
  };

  const handleComponentClick = (componentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPreviewMode) {
      setSelectedComponent(componentId);
    }
  };

  const renderComponent = (component: typeof components[0]) => {
    const isSelected = selectedComponent === component.id && !isPreviewMode;
    
    const baseStyles = {
      position: 'absolute' as const,
      left: component.position.x,
      top: component.position.y,
      cursor: isPreviewMode ? 'default' : 'pointer',
      ...component.styles
    };

    const wrapperStyles = {
      display: 'inline-block',
      outline: isSelected ? '2px solid #3b82f6' : 'none',
      outlineOffset: '2px'
    };

    switch (component.type) {
      case 'text':
        return (
          <div
            key={component.id}
            style={wrapperStyles}
            onClick={(e) => handleComponentClick(component.id, e)}
          >
            <div style={baseStyles}>
              {component.content}
            </div>
          </div>
        );
      
      case 'button':
        return (
          <div
            key={component.id}
            style={wrapperStyles}
            onClick={(e) => handleComponentClick(component.id, e)}
          >
            <button style={baseStyles}>
              {component.content}
            </button>
          </div>
        );
      
      case 'image':
        return (
          <div
            key={component.id}
            style={wrapperStyles}
            onClick={(e) => handleComponentClick(component.id, e)}
          >
            <div style={baseStyles} className="flex items-center justify-center border-2 border-dashed border-gray-300">
              <span className="text-gray-500">Image Placeholder</span>
            </div>
          </div>
        );
      
      default:
        return (
          <div
            key={component.id}
            style={wrapperStyles}
            onClick={(e) => handleComponentClick(component.id, e)}
          >
            <div style={baseStyles}>
              {component.content}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-100 p-8">
      <div className="flex justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-white shadow-xl rounded-lg overflow-hidden relative"
          style={{ 
            width: canvasWidth[editorMode],
            minHeight: '800px',
            maxWidth: '100%'
          }}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !isPreviewMode && setSelectedComponent(null)}
        >
          {/* Canvas Content */}
          <div className="relative w-full h-full p-8">
            {components.map(renderComponent)}
            
            {/* Drop Zone Indicator */}
            {!isPreviewMode && components.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 m-8 rounded-lg">
                <div className="text-center">
                  <div className="text-6xl mb-4">📱</div>
                  <h3 className="text-xl font-semibold mb-2">Start Building</h3>
                  <p>Drag components from the sidebar to get started</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Device Frame (for tablet/mobile) */}
          {editorMode !== 'desktop' && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm">
                {editorMode.charAt(0).toUpperCase() + editorMode.slice(1)} Preview
              </div>
            </div>
          )}
        </motion.div>
      </div>
      
      {/* Canvas Info */}
      {!isPreviewMode && (
        <div className="flex justify-center mt-4">
          <div className="bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-200">
            <span className="text-sm text-gray-600">
              {editorMode.charAt(0).toUpperCase() + editorMode.slice(1)} View • 
              {components.length} component{components.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;