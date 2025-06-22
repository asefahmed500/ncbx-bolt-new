import React from 'react';
import { Eye, EyeOff, Lock, Unlock, Copy, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LayerItem {
  id: string;
  name: string;
  type: string;
  layer: number;
  visible: boolean;
  locked: boolean;
  children?: LayerItem[];
  expanded?: boolean;
}

interface LayersPanelProps {
  selectedComponent: string | null;
  onSelectComponent: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDeleteComponent: (id: string) => void;
  onDuplicateComponent: (id: string) => void;
  onReorderLayers: (draggedId: string, targetId: string, position: 'above' | 'below') => void;
}

const LayersPanel: React.FC<LayersPanelProps> = ({
  selectedComponent,
  onSelectComponent,
  onToggleVisibility,
  onToggleLock,
  onDeleteComponent,
  onDuplicateComponent,
  onReorderLayers
}) => {
  const [layers, setLayers] = React.useState<LayerItem[]>([
    {
      id: 'header',
      name: 'Header Section',
      type: 'container',
      layer: 10,
      visible: true,
      locked: false,
      expanded: true,
      children: [
        {
          id: '1',
          name: 'Main Heading',
          type: 'heading',
          layer: 11,
          visible: true,
          locked: false
        },
        {
          id: '2',
          name: 'Subtitle Text',
          type: 'text',
          layer: 12,
          visible: true,
          locked: false
        }
      ]
    },
    {
      id: 'content',
      name: 'Content Section',
      type: 'container',
      layer: 20,
      visible: true,
      locked: false,
      expanded: true,
      children: [
        {
          id: '3',
          name: 'Call to Action',
          type: 'button',
          layer: 21,
          visible: true,
          locked: false
        },
        {
          id: '4',
          name: 'Feature Image',
          type: 'image',
          layer: 22,
          visible: true,
          locked: true
        }
      ]
    },
    {
      id: '5',
      name: 'Background Element',
      type: 'divider',
      layer: 1,
      visible: true,
      locked: false
    }
  ]);

  const [draggedItem, setDraggedItem] = React.useState<string | null>(null);
  const [dropTarget, setDropTarget] = React.useState<{ id: string; position: 'above' | 'below' } | null>(null);

  const getComponentIcon = (type: string) => {
    const iconClass = "h-4 w-4";
    switch (type) {
      case 'text': return <span className={`${iconClass} flex items-center justify-center font-bold`}>T</span>;
      case 'heading': return <span className={`${iconClass} flex items-center justify-center font-bold text-lg`}>H</span>;
      case 'button': return <div className={`${iconClass} bg-blue-500 rounded`}></div>;
      case 'image': return <div className={`${iconClass} bg-green-500 rounded`}></div>;
      case 'container': return <div className={`${iconClass} border-2 border-gray-400 rounded`}></div>;
      case 'divider': return <div className="w-4 h-1 bg-gray-400 rounded"></div>;
      default: return <div className={`${iconClass} bg-gray-400 rounded`}></div>;
    }
  };

  const handleToggleExpanded = (id: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === id ? { ...layer, expanded: !layer.expanded } : layer
    ));
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedItem && draggedItem !== id) {
      const rect = e.currentTarget.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      const position = e.clientY < midpoint ? 'above' : 'below';
      setDropTarget({ id, position });
    }
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedItem && dropTarget) {
      onReorderLayers(draggedItem, dropTarget.id, dropTarget.position);
    }
    setDraggedItem(null);
    setDropTarget(null);
  };

  const renderLayerItem = (layer: LayerItem, depth: number = 0) => {
    const isSelected = selectedComponent === layer.id;
    const isDragging = draggedItem === layer.id;
    const isDropTarget = dropTarget?.id === layer.id;

    return (
      <div key={layer.id}>
        {/* Drop indicator above */}
        {isDropTarget && dropTarget?.position === 'above' && (
          <div className="h-0.5 bg-blue-500 mx-2 rounded"></div>
        )}
        
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: isDragging ? 0.5 : 1, x: 0 }}
          className={`flex items-center space-x-2 p-2 mx-2 rounded-lg transition-all cursor-pointer ${
            isSelected 
              ? 'bg-blue-100 border border-blue-300' 
              : 'hover:bg-gray-50 border border-transparent'
          }`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          draggable
          onDragStart={(e) => handleDragStart(e, layer.id)}
          onDragOver={(e) => handleDragOver(e, layer.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, layer.id)}
          onClick={() => onSelectComponent(layer.id)}
        >
          {/* Expand/Collapse Button */}
          {layer.children && layer.children.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleExpanded(layer.id);
              }}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              {layer.expanded ? (
                <ChevronDown className="h-3 w-3 text-gray-600" />
              ) : (
                <ChevronRight className="h-3 w-3 text-gray-600" />
              )}
            </button>
          )}
          
          {/* Component Icon */}
          <div className="flex-shrink-0">
            {getComponentIcon(layer.type)}
          </div>
          
          {/* Layer Name */}
          <div className="flex-1 min-w-0">
            <span className={`text-sm truncate ${isSelected ? 'font-medium text-blue-900' : 'text-gray-900'}`}>
              {layer.name}
            </span>
            <div className="text-xs text-gray-500">
              {layer.type} • Layer {layer.layer}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility(layer.id);
              }}
              className="p-1 hover:bg-gray-200 rounded"
              title={layer.visible ? "Hide" : "Show"}
            >
              {layer.visible ? (
                <Eye className="h-3 w-3 text-gray-600" />
              ) : (
                <EyeOff className="h-3 w-3 text-gray-400" />
              )}
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleLock(layer.id);
              }}
              className="p-1 hover:bg-gray-200 rounded"
              title={layer.locked ? "Unlock" : "Lock"}
            >
              {layer.locked ? (
                <Lock className="h-3 w-3 text-gray-600" />
              ) : (
                <Unlock className="h-3 w-3 text-gray-400" />
              )}
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicateComponent(layer.id);
              }}
              className="p-1 hover:bg-gray-200 rounded"
              title="Duplicate"
            >
              <Copy className="h-3 w-3 text-gray-600" />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteComponent(layer.id);
              }}
              className="p-1 hover:bg-red-200 rounded"
              title="Delete"
            >
              <Trash2 className="h-3 w-3 text-red-600" />
            </button>
          </div>
        </motion.div>
        
        {/* Drop indicator below */}
        {isDropTarget && dropTarget?.position === 'below' && (
          <div className="h-0.5 bg-blue-500 mx-2 rounded"></div>
        )}
        
        {/* Children */}
        <AnimatePresence>
          {layer.expanded && layer.children && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {layer.children.map(child => renderLayerItem(child, depth + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Layers</h3>
          <div className="flex items-center space-x-1">
            <button
              className="p-1 hover:bg-gray-100 rounded text-xs"
              title="Expand All"
            >
              <ChevronDown className="h-4 w-4 text-gray-600" />
            </button>
            <button
              className="p-1 hover:bg-gray-100 rounded text-xs"
              title="Collapse All"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Drag to reorder • Click to select
        </p>
      </div>
      
      {/* Layers List */}
      <div className="flex-1 overflow-y-auto">
        <div className="py-2 space-y-1">
          {layers.map(layer => renderLayerItem(layer))}
        </div>
      </div>
      
      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="grid grid-cols-2 gap-2">
          <button className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            Group
          </button>
          <button className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            Ungroup
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500 text-center">
          {layers.length} layers • {layers.filter(l => l.visible).length} visible
        </div>
      </div>
    </div>
  );
};

export default LayersPanel;