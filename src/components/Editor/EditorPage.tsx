import React from 'react';
import { 
  Monitor, Tablet, Smartphone, Eye, Save, Undo, Redo, 
  Settings, Users, Share2, ArrowLeft 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import ComponentLibrary from './ComponentLibrary';
import Canvas from './Canvas';
import PropertiesPanel from './PropertiesPanel';

const EditorPage: React.FC = () => {
  const { 
    currentWebsite, 
    editorMode, 
    isPreviewMode, 
    setEditorMode, 
    togglePreviewMode,
    setCurrentView 
  } = useAppStore();

  const [showComponentLibrary, setShowComponentLibrary] = React.useState(true);
  const [showPropertiesPanel, setShowPropertiesPanel] = React.useState(true);

  if (!currentWebsite) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No website selected</h2>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Top Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {currentWebsite.name}
            </h1>
            <p className="text-sm text-gray-500">
              {currentWebsite.status === 'published' ? 'Published' : 'Draft'} • Last saved 2 minutes ago
            </p>
          </div>
        </div>

        {/* Center Controls */}
        <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setEditorMode('desktop')}
            className={`p-2 rounded-md transition-colors ${
              editorMode === 'desktop' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Desktop View"
          >
            <Monitor className="h-4 w-4" />
          </button>
          <button
            onClick={() => setEditorMode('tablet')}
            className={`p-2 rounded-md transition-colors ${
              editorMode === 'tablet' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Tablet View"
          >
            <Tablet className="h-4 w-4" />
          </button>
          <button
            onClick={() => setEditorMode('mobile')}
            className={`p-2 rounded-md transition-colors ${
              editorMode === 'mobile' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Mobile View"
          >
            <Smartphone className="h-4 w-4" />
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Undo"
            >
              <Undo className="h-4 w-4 text-gray-600" />
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Redo"
            >
              <Redo className="h-4 w-4 text-gray-600" />
            </button>
          </div>
          
          <div className="w-px h-6 bg-gray-300"></div>
          
          <button
            onClick={togglePreviewMode}
            className={`flex items-center px-3 py-2 rounded-lg font-medium transition-colors ${
              isPreviewMode
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Eye className="h-4 w-4 mr-2" />
            {isPreviewMode ? 'Exit Preview' : 'Preview'}
          </button>
          
          <button className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">
            <Users className="h-4 w-4 mr-2" />
            Collaborate
          </button>
          
          <button className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
            <Save className="h-4 w-4 mr-2" />
            Save
          </button>
          
          <button className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
            <Share2 className="h-4 w-4 mr-2" />
            Publish
          </button>
        </div>
      </motion.div>

      {/* Main Editor Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Component Library */}
        {!isPreviewMode && showComponentLibrary && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="w-80 bg-white border-r border-gray-200 flex flex-col"
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Components</h3>
                <button
                  onClick={() => setShowComponentLibrary(false)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <Settings className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>
            <ComponentLibrary />
          </motion.div>
        )}

        {/* Canvas Area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex-1 flex flex-col bg-gray-50"
        >
          <Canvas 
            editorMode={editorMode}
            isPreviewMode={isPreviewMode}
          />
        </motion.div>

        {/* Properties Panel */}
        {!isPreviewMode && showPropertiesPanel && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-80 bg-white border-l border-gray-200 flex flex-col"
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Properties</h3>
                <button
                  onClick={() => setShowPropertiesPanel(false)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <Settings className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>
            <PropertiesPanel />
          </motion.div>
        )}
      </div>

      {/* Toggle Panels */}
      {!isPreviewMode && (
        <>
          {!showComponentLibrary && (
            <button
              onClick={() => setShowComponentLibrary(true)}
              className="fixed left-4 top-1/2 transform -translate-y-1/2 bg-white border border-gray-300 p-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors z-50"
              title="Show Components"
            >
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
            </button>
          )}
          
          {!showPropertiesPanel && (
            <button
              onClick={() => setShowPropertiesPanel(true)}
              className="fixed right-4 top-1/2 transform -translate-y-1/2 bg-white border border-gray-300 p-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors z-50"
              title="Show Properties"
            >
              <Settings className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default EditorPage;