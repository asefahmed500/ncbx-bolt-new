import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { Trash2, Copy, Move, Eye, EyeOff, Lock, Unlock, Plus, Settings } from 'lucide-react';
import { useToast } from '../ui/use-toast';

interface Component {
  id: string;
  type: string;
  content: string;
  styles: Record<string, any>;
  position: { x: number; y: number };
  size: { width: number; height: number };
  locked: boolean;
  hidden: boolean;
  layer: number;
}

interface CanvasProps {
  editorMode: 'desktop' | 'tablet' | 'mobile';
  isPreviewMode: boolean;
  onContentChange?: (content: any) => void;
}

const Canvas: React.FC<CanvasProps> = ({ editorMode, isPreviewMode, onContentChange }) => {
  const { selectedComponent, setSelectedComponent } = useAppStore();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const [components, setComponents] = useState<Component[]>([
    {
      id: '1',
      type: 'text',
      content: 'Welcome to Your Website',
      styles: { 
        fontSize: '2.5rem', 
        fontWeight: 'bold', 
        color: '#1f2937',
        textAlign: 'center',
        lineHeight: '1.2'
      },
      position: { x: 50, y: 50 },
      size: { width: 600, height: 80 },
      locked: false,
      hidden: false,
      layer: 1
    },
    {
      id: '2',
      type: 'text',
      content: 'This is a sample paragraph. You can edit this text by clicking on it and modifying the content in the properties panel. Drag and drop components to build your perfect website.',
      styles: { 
        fontSize: '1.125rem', 
        color: '#6b7280', 
        lineHeight: '1.7',
        textAlign: 'left'
      },
      position: { x: 50, y: 150 },
      size: { width: 500, height: 100 },
      locked: false,
      hidden: false,
      layer: 2
    },
    {
      id: '3',
      type: 'button',
      content: 'Get Started',
      styles: { 
        backgroundColor: '#3b82f6', 
        color: 'white', 
        padding: '16px 32px',
        borderRadius: '12px',
        border: 'none',
        fontWeight: '600',
        fontSize: '1.125rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      },
      position: { x: 50, y: 280 },
      size: { width: 160, height: 56 },
      locked: false,
      hidden: false,
      layer: 3
    }
  ]);

  const [draggedComponent, setDraggedComponent] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });
  const [history, setHistory] = useState<Component[][]>([components]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [contextMenuComponentId, setContextMenuComponentId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const editRef = useRef<HTMLTextAreaElement | null>(null);

  const canvasWidth = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px'
  };

  const canvasHeight = {
    desktop: '1200px',
    tablet: '1024px',
    mobile: '800px'
  };

  // Notify parent of content changes
  useEffect(() => {
    if (onContentChange) {
      onContentChange({
        components,
        settings: {
          theme: 'light',
          layout: 'standard'
        }
      });
    }
  }, [components, onContentChange]);

  // Save to history for undo/redo
  const saveToHistory = (newComponents: Component[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newComponents]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo functionality
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setComponents([...history[historyIndex - 1]]);
      
      toast({
        title: "Undo",
        description: "Previous action undone",
      });
    }
  };

  // Redo functionality
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setComponents([...history[historyIndex + 1]]);
      
      toast({
        title: "Redo",
        description: "Action redone",
      });
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditing) return; // Don't handle shortcuts while editing text
      
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              handleRedo();
            } else {
              handleUndo();
            }
            break;
          case 'y':
            e.preventDefault();
            handleRedo();
            break;
          case 'c':
            if (selectedComponent) {
              e.preventDefault();
              handleCopyComponent(selectedComponent);
            }
            break;
          case 'v':
            e.preventDefault();
            handlePasteComponent();
            break;
          case 'd':
            if (selectedComponent) {
              e.preventDefault();
              handleDuplicateComponent(selectedComponent);
            }
            break;
          case 's':
            e.preventDefault();
            toast({
              title: "Save shortcut detected",
              description: "Your changes will be saved",
            });
            break;
        }
      }
      
      if (e.key === 'Delete' && selectedComponent) {
        e.preventDefault();
        handleDeleteComponent(selectedComponent);
      }
      
      if (e.key === 'Escape') {
        if (isEditing) {
          setIsEditing(null);
        } else if (showContextMenu) {
          setShowContextMenu(false);
        } else {
          setSelectedComponent(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedComponent, historyIndex, history, isEditing, showContextMenu]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showContextMenu) {
        setShowContextMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showContextMenu]);

  // Focus edit field when editing starts
  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [isEditing]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const componentData = e.dataTransfer.getData('component');
    if (componentData) {
      const component = JSON.parse(componentData);
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newComponent: Component = {
        id: Date.now().toString(),
        type: component.id,
        content: getDefaultContent(component.id),
        styles: getDefaultStyles(component.id),
        position: { x: Math.max(0, x - 50), y: Math.max(0, y - 25) },
        size: getDefaultSize(component.id),
        locked: false,
        hidden: false,
        layer: Math.max(...components.map(c => c.layer), 0) + 1
      };

      const newComponents = [...components, newComponent];
      setComponents(newComponents);
      saveToHistory(newComponents);
      setSelectedComponent(newComponent.id);
      
      toast({
        title: "Component added",
        description: `Added ${component.name} component`,
      });
    }
  };

  const getDefaultContent = (type: string): string => {
    switch (type) {
      case 'text': return 'New text element';
      case 'heading': return 'New Heading';
      case 'button': return 'Button';
      case 'image': return 'Image placeholder';
      case 'container': return '';
      case 'divider': return '';
      default: return 'Element';
    }
  };

  const getDefaultStyles = (type: string): Record<string, any> => {
    switch (type) {
      case 'text':
        return { 
          fontSize: '1rem', 
          color: '#374151',
          lineHeight: '1.6',
          fontFamily: 'Inter, sans-serif'
        };
      case 'heading':
        return { 
          fontSize: '2rem', 
          color: '#1f2937',
          fontWeight: 'bold',
          lineHeight: '1.2',
          fontFamily: 'Inter, sans-serif'
        };
      case 'button':
        return { 
          backgroundColor: '#3b82f6', 
          color: 'white', 
          padding: '12px 24px',
          borderRadius: '8px',
          border: 'none',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        };
      case 'image':
        return { 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover',
          borderRadius: '8px'
        };
      case 'container':
        return {
          backgroundColor: '#f9fafb',
          border: '2px dashed #d1d5db',
          borderRadius: '8px',
          padding: '20px'
        };
      case 'divider':
        return {
          height: '2px',
          backgroundColor: '#e5e7eb',
          border: 'none'
        };
      default:
        return {};
    }
  };

  const getDefaultSize = (type: string): { width: number; height: number } => {
    switch (type) {
      case 'text': return { width: 300, height: 60 };
      case 'heading': return { width: 400, height: 80 };
      case 'button': return { width: 120, height: 48 };
      case 'image': return { width: 300, height: 200 };
      case 'container': return { width: 400, height: 300 };
      case 'divider': return { width: 300, height: 2 };
      default: return { width: 200, height: 100 };
    }
  };

  const handleComponentClick = (componentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPreviewMode) {
      setSelectedComponent(componentId);
    }
  };

  const handleComponentDoubleClick = (componentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPreviewMode) {
      // Enter text editing mode for text components
      const component = components.find(c => c.id === componentId);
      if (component && (component.type === 'text' || component.type === 'heading' || component.type === 'button')) {
        setIsEditing(componentId);
        setEditContent(component.content);
      }
    }
  };

  const handleComponentContextMenu = (componentId: string, e: React.MouseEvent) => {
    if (isPreviewMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMenuComponentId(componentId);
    setShowContextMenu(true);
  };

  const handleComponentDragStart = (componentId: string, e: React.MouseEvent) => {
    if (isPreviewMode) return;
    
    const component = components.find(c => c.id === componentId);
    if (!component || component.locked) return;
    
    setDraggedComponent(componentId);
    setStartPoint({ x: e.clientX, y: e.clientY });
    
    document.addEventListener('mousemove', handleComponentDragMove);
    document.addEventListener('mouseup', handleComponentDragEnd);
  };

  const handleComponentDragMove = (e: MouseEvent) => {
    if (!draggedComponent) return;
    
    const component = components.find(c => c.id === draggedComponent);
    if (!component) return;
    
    const deltaX = e.clientX - startPoint.x;
    const deltaY = e.clientY - startPoint.y;
    
    const newComponents = components.map(c => 
      c.id === draggedComponent 
        ? { 
            ...c, 
            position: { 
              x: Math.max(0, c.position.x + deltaX), 
              y: Math.max(0, c.position.y + deltaY) 
            } 
          } 
        : c
    );
    
    setComponents(newComponents);
    setStartPoint({ x: e.clientX, y: e.clientY });
  };

  const handleComponentDragEnd = () => {
    if (draggedComponent) {
      saveToHistory(components);
      setDraggedComponent(null);
    }
    
    document.removeEventListener('mousemove', handleComponentDragMove);
    document.removeEventListener('mouseup', handleComponentDragEnd);
  };

  const handleResizeStart = (componentId: string, direction: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPreviewMode) return;
    
    const component = components.find(c => c.id === componentId);
    if (!component || component.locked) return;
    
    setIsResizing(componentId);
    setResizeDirection(direction);
    setStartPoint({ x: e.clientX, y: e.clientY });
    setStartSize({ width: component.size.width, height: component.size.height });
    
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing || !resizeDirection) return;
    
    const component = components.find(c => c.id === isResizing);
    if (!component) return;
    
    const deltaX = e.clientX - startPoint.x;
    const deltaY = e.clientY - startPoint.y;
    
    let newWidth = startSize.width;
    let newHeight = startSize.height;
    
    if (resizeDirection.includes('e')) {
      newWidth = Math.max(50, startSize.width + deltaX);
    } else if (resizeDirection.includes('w')) {
      newWidth = Math.max(50, startSize.width - deltaX);
    }
    
    if (resizeDirection.includes('s')) {
      newHeight = Math.max(20, startSize.height + deltaY);
    } else if (resizeDirection.includes('n')) {
      newHeight = Math.max(20, startSize.height - deltaY);
    }
    
    const newComponents = components.map(c => 
      c.id === isResizing 
        ? { ...c, size: { width: newWidth, height: newHeight } } 
        : c
    );
    
    setComponents(newComponents);
  };

  const handleResizeEnd = () => {
    if (isResizing) {
      saveToHistory(components);
      setIsResizing(null);
      setResizeDirection(null);
    }
    
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };

  const handleEditComplete = () => {
    if (!isEditing) return;
    
    const newComponents = components.map(c => 
      c.id === isEditing 
        ? { ...c, content: editContent } 
        : c
    );
    
    setComponents(newComponents);
    saveToHistory(newComponents);
    setIsEditing(null);
    
    toast({
      title: "Content updated",
      description: "Text content has been updated",
    });
  };

  const handleDeleteComponent = (componentId: string) => {
    const newComponents = components.filter(c => c.id !== componentId);
    setComponents(newComponents);
    saveToHistory(newComponents);
    if (selectedComponent === componentId) {
      setSelectedComponent(null);
    }
    
    toast({
      title: "Component deleted",
      description: "Component has been removed",
    });
  };

  const handleCopyComponent = (componentId: string) => {
    const component = components.find(c => c.id === componentId);
    if (component) {
      localStorage.setItem('copiedComponent', JSON.stringify(component));
      
      toast({
        title: "Component copied",
        description: "Component copied to clipboard",
      });
    }
  };

  const handlePasteComponent = () => {
    const copiedData = localStorage.getItem('copiedComponent');
    if (copiedData) {
      const copiedComponent = JSON.parse(copiedData);
      const newComponent: Component = {
        ...copiedComponent,
        id: Date.now().toString(),
        position: {
          x: copiedComponent.position.x + 20,
          y: copiedComponent.position.y + 20
        },
        layer: Math.max(...components.map(c => c.layer), 0) + 1
      };
      
      const newComponents = [...components, newComponent];
      setComponents(newComponents);
      saveToHistory(newComponents);
      setSelectedComponent(newComponent.id);
      
      toast({
        title: "Component pasted",
        description: "Component has been pasted",
      });
    }
  };

  const handleDuplicateComponent = (componentId: string) => {
    const component = components.find(c => c.id === componentId);
    if (component) {
      const newComponent: Component = {
        ...component,
        id: Date.now().toString(),
        position: {
          x: component.position.x + 20,
          y: component.position.y + 20
        },
        layer: Math.max(...components.map(c => c.layer), 0) + 1
      };
      
      const newComponents = [...components, newComponent];
      setComponents(newComponents);
      saveToHistory(newComponents);
      setSelectedComponent(newComponent.id);
      
      toast({
        title: "Component duplicated",
        description: "Component has been duplicated",
      });
    }
  };

  const handleToggleVisibility = (componentId: string) => {
    const newComponents = components.map(c => 
      c.id === componentId ? { ...c, hidden: !c.hidden } : c
    );
    setComponents(newComponents);
    saveToHistory(newComponents);
    
    const component = components.find(c => c.id === componentId);
    toast({
      title: component?.hidden ? "Component shown" : "Component hidden",
      description: component?.hidden ? "Component is now visible" : "Component is now hidden",
    });
  };

  const handleToggleLock = (componentId: string) => {
    const newComponents = components.map(c => 
      c.id === componentId ? { ...c, locked: !c.locked } : c
    );
    setComponents(newComponents);
    saveToHistory(newComponents);
    
    const component = components.find(c => c.id === componentId);
    toast({
      title: component?.locked ? "Component unlocked" : "Component locked",
      description: component?.locked ? "Component can now be moved" : "Component is now locked",
    });
  };

  const handleLayerChange = (componentId: string, direction: 'up' | 'down') => {
    const component = components.find(c => c.id === componentId);
    if (!component) return;

    const newComponents = components.map(c => {
      if (c.id === componentId) {
        const newLayer = direction === 'up' ? c.layer + 1 : Math.max(1, c.layer - 1);
        return { ...c, layer: newLayer };
      }
      return c;
    });

    setComponents(newComponents);
    saveToHistory(newComponents);
    
    toast({
      title: "Layer changed",
      description: `Component moved ${direction === 'up' ? 'forward' : 'backward'}`,
    });
  };

  const renderComponent = (component: Component) => {
    if (component.hidden && !isPreviewMode) {
      return null;
    }

    const isSelected = selectedComponent === component.id && !isPreviewMode;
    
    const baseStyles = {
      position: 'absolute' as const,
      left: component.position.x,
      top: component.position.y,
      width: component.size.width,
      height: component.size.height,
      zIndex: component.layer,
      cursor: isPreviewMode ? 'default' : (component.locked ? 'not-allowed' : 'move'),
      opacity: component.hidden ? 0.3 : 1,
      ...component.styles
    };

    const wrapperStyles = {
      display: 'inline-block',
      outline: isSelected ? '2px solid #3b82f6' : 'none',
      outlineOffset: '2px',
      position: 'relative' as const
    };

    let content;
    switch (component.type) {
      case 'text':
      case 'heading':
        content = isEditing === component.id ? (
          <textarea
            ref={editRef}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onBlur={handleEditComplete}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.shiftKey === false) {
                e.preventDefault();
                handleEditComplete();
              }
            }}
            style={{
              ...baseStyles,
              resize: 'none',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: 'inherit',
              overflow: 'auto'
            }}
          />
        ) : (
          <div style={baseStyles}>
            {component.content}
          </div>
        );
        break;
      
      case 'button':
        content = isEditing === component.id ? (
          <textarea
            ref={editRef}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onBlur={handleEditComplete}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleEditComplete();
              }
            }}
            style={{
              ...baseStyles,
              resize: 'none',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: 'inherit',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          />
        ) : (
          <button style={baseStyles} disabled={!isPreviewMode}>
            {component.content}
          </button>
        );
        break;
      
      case 'image':
        content = (
          <div style={baseStyles} className="flex items-center justify-center border-2 border-dashed border-gray-300 bg-gray-50">
            <span className="text-gray-500 text-sm">Image Placeholder</span>
          </div>
        );
        break;

      case 'container':
        content = (
          <div style={baseStyles} className="flex items-center justify-center">
            <span className="text-gray-400 text-sm">Container</span>
          </div>
        );
        break;

      case 'divider':
        content = (
          <hr style={baseStyles} />
        );
        break;
      
      default:
        content = (
          <div style={baseStyles}>
            {component.content}
          </div>
        );
    }

    return (
      <div
        key={component.id}
        style={wrapperStyles}
        onClick={(e) => handleComponentClick(component.id, e)}
        onDoubleClick={(e) => handleComponentDoubleClick(component.id, e)}
        onContextMenu={(e) => handleComponentContextMenu(component.id, e)}
        onMouseDown={(e) => !component.locked && handleComponentDragStart(component.id, e)}
      >
        {content}
        
        {/* Selection Controls */}
        {isSelected && !isPreviewMode && (
          <div className="absolute -top-8 left-0 flex items-center space-x-1 bg-blue-600 text-white px-2 py-1 rounded text-xs">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleVisibility(component.id);
              }}
              className="hover:bg-blue-700 p-1 rounded"
              title={component.hidden ? "Show" : "Hide"}
            >
              {component.hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleLock(component.id);
              }}
              className="hover:bg-blue-700 p-1 rounded"
              title={component.locked ? "Unlock" : "Lock"}
            >
              {component.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopyComponent(component.id);
              }}
              className="hover:bg-blue-700 p-1 rounded"
              title="Copy"
            >
              <Copy className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteComponent(component.id);
              }}
              className="hover:bg-red-600 p-1 rounded"
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Resize Handles */}
        {isSelected && !isPreviewMode && !component.locked && (
          <>
            <div 
              className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-600 border border-white cursor-se-resize"
              onMouseDown={(e) => handleResizeStart(component.id, 'se', e)}
            ></div>
            <div 
              className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 border border-white cursor-ne-resize"
              onMouseDown={(e) => handleResizeStart(component.id, 'ne', e)}
            ></div>
            <div 
              className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-600 border border-white cursor-sw-resize"
              onMouseDown={(e) => handleResizeStart(component.id, 'sw', e)}
            ></div>
            <div 
              className="absolute -top-1 -left-1 w-3 h-3 bg-blue-600 border border-white cursor-nw-resize"
              onMouseDown={(e) => handleResizeStart(component.id, 'nw', e)}
            ></div>
          </>
        )}
      </div>
    );
  };

  // Sort components by layer for proper rendering order
  const sortedComponents = [...components].sort((a, b) => a.layer - b.layer);

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
            height: canvasHeight[editorMode],
            maxWidth: '100%',
            minHeight: '800px'
          }}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !isPreviewMode && setSelectedComponent(null)}
          ref={canvasRef}
        >
          {/* Canvas Content */}
          <div className="relative w-full h-full">
            {sortedComponents.map(renderComponent)}
            
            {/* Drop Zone Indicator */}
            {!isPreviewMode && components.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 m-8 rounded-lg">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎨</div>
                  <h3 className="text-xl font-semibold mb-2">Start Building</h3>
                  <p className="text-sm">Drag components from the sidebar to get started</p>
                  <div className="mt-4 text-xs space-y-1">
                    <p><kbd className="bg-gray-200 px-2 py-1 rounded">Ctrl+Z</kbd> Undo</p>
                    <p><kbd className="bg-gray-200 px-2 py-1 rounded">Ctrl+C</kbd> Copy</p>
                    <p><kbd className="bg-gray-200 px-2 py-1 rounded">Ctrl+V</kbd> Paste</p>
                    <p><kbd className="bg-gray-200 px-2 py-1 rounded">Del</kbd> Delete</p>
                  </div>
                </div>
              </div>
            )}

            {/* Grid Lines (optional) */}
            {!isPreviewMode && (
              <div className="absolute inset-0 pointer-events-none opacity-10">
                <svg width="100%" height="100%">
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
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

          {/* Context Menu */}
          {showContextMenu && contextMenuComponentId && (
            <div 
              className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
              style={{ 
                left: contextMenuPosition.x, 
                top: contextMenuPosition.y,
                minWidth: '180px'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                onClick={() => {
                  handleCopyComponent(contextMenuComponentId);
                  setShowContextMenu(false);
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </button>
              <button 
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                onClick={() => {
                  handleDuplicateComponent(contextMenuComponentId);
                  setShowContextMenu(false);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Duplicate
              </button>
              <button 
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                onClick={() => {
                  handleToggleLock(contextMenuComponentId);
                  setShowContextMenu(false);
                }}
              >
                {components.find(c => c.id === contextMenuComponentId)?.locked ? (
                  <>
                    <Unlock className="h-4 w-4 mr-2" />
                    Unlock
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Lock
                  </>
                )}
              </button>
              <button 
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                onClick={() => {
                  handleToggleVisibility(contextMenuComponentId);
                  setShowContextMenu(false);
                }}
              >
                {components.find(c => c.id === contextMenuComponentId)?.hidden ? (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Show
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Hide
                  </>
                )}
              </button>
              <button 
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                onClick={() => {
                  handleLayerChange(contextMenuComponentId, 'up');
                  setShowContextMenu(false);
                }}
              >
                <Move className="h-4 w-4 mr-2" />
                Bring Forward
              </button>
              <button 
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                onClick={() => {
                  handleLayerChange(contextMenuComponentId, 'down');
                  setShowContextMenu(false);
                }}
              >
                <Move className="h-4 w-4 mr-2" />
                Send Backward
              </button>
              <div className="border-t border-gray-200 my-1"></div>
              <button 
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                onClick={() => {
                  handleDeleteComponent(contextMenuComponentId);
                  setShowContextMenu(false);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          )}
        </motion.div>
      </div>
      
      {/* Canvas Info */}
      {!isPreviewMode && (
        <div className="flex justify-center mt-4">
          <div className="bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-200 flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {editorMode.charAt(0).toUpperCase() + editorMode.slice(1)} View • 
              {components.length} component{components.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>History: {historyIndex + 1}/{history.length}</span>
              <button
                onClick={handleUndo}
                disabled={historyIndex === 0}
                className="px-2 py-1 bg-gray-100 rounded disabled:opacity-50"
              >
                Undo
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex === history.length - 1}
                className="px-2 py-1 bg-gray-100 rounded disabled:opacity-50"
              >
                Redo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;