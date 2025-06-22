import React, { useState, useEffect } from 'react';
import { 
  Monitor, Tablet, Smartphone, Eye, Save, Undo, Redo, 
  Settings, Users, Share2, ArrowLeft, CheckCircle, AlertCircle,
  Layers, MessageSquare, Globe, Code, Zap, Rocket
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { useWebsites } from '../../hooks/useWebsites';
import ComponentLibrary from './ComponentLibrary';
import Canvas from './Canvas';
import PropertiesPanel from './PropertiesPanel';
import CollaborationPanel from './CollaborationPanel';
import PublishModal from './PublishModal';
import VersionHistoryPanel from './VersionHistoryPanel';
import DomainSettings from './DomainSettings';
import DeploymentPanel from './DeploymentPanel';
import { useToast } from '../ui/use-toast';
import MadeWithBolt from '../MadeWithBolt';

const EditorPage: React.FC = () => {
  const { 
    currentWebsite, 
    editorMode, 
    isPreviewMode, 
    setEditorMode, 
    togglePreviewMode,
    setCurrentView,
    setCurrentWebsite,
    user
  } = useAppStore();

  const { 
    updateWebsite, 
    publishWebsite, 
    unpublishWebsite, 
    saveWebsiteVersion 
  } = useWebsites();

  const { toast } = useToast();

  const [showComponentLibrary, setShowComponentLibrary] = useState(true);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(true);
  const [showCollaborationPanel, setShowCollaborationPanel] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showDomainSettings, setShowDomainSettings] = useState(false);
  const [showDeploymentPanel, setShowDeploymentPanel] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [editorContent, setEditorContent] = useState<any>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Auto-save functionality
  useEffect(() => {
    if (!currentWebsite || !hasUnsavedChanges) return;

    const autoSaveInterval = setInterval(() => {
      handleAutoSave();
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [currentWebsite, hasUnsavedChanges, editorContent]);

  // Prompt before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleContentChange = (newContent: any) => {
    setEditorContent(newContent);
    setHasUnsavedChanges(true);
  };

  const handleAutoSave = async () => {
    if (!currentWebsite || !hasUnsavedChanges) return;

    try {
      setIsSaving(true);
      await saveWebsiteVersion(currentWebsite.id, editorContent, 'Auto-save');
      setLastSaved(new Date());
      setSaveMessage('Auto-saved');
      setHasUnsavedChanges(false);
      setTimeout(() => setSaveMessage(''), 2000);
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSave = async () => {
    if (!currentWebsite) return;

    try {
      setIsSaving(true);
      setSaveMessage('Saving...');
      
      await saveWebsiteVersion(currentWebsite.id, editorContent, 'Manual save');
      
      setLastSaved(new Date());
      setSaveMessage('Saved successfully');
      setHasUnsavedChanges(false);
      
      toast({
        title: "Changes saved",
        description: "Your website has been saved successfully",
      });
      
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Save failed:', error);
      setSaveMessage('Save failed');
      
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save changes",
        variant: "destructive",
      });
      
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async (customDomain?: string) => {
    if (!currentWebsite) return;

    try {
      setIsPublishing(true);
      
      // Save current version first
      if (hasUnsavedChanges) {
        await saveWebsiteVersion(currentWebsite.id, editorContent, 'Pre-publish save');
        setHasUnsavedChanges(false);
      }
      
      if (currentWebsite.status === 'published') {
        await unpublishWebsite(currentWebsite.id);
        setCurrentWebsite({
          ...currentWebsite,
          status: 'draft'
        });
        setSaveMessage('Website unpublished');
        
        toast({
          title: "Website unpublished",
          description: "Your website is now in draft mode",
        });
      } else {
        const updatedWebsite = await publishWebsite(currentWebsite.id, customDomain);
        setCurrentWebsite({
          ...currentWebsite,
          status: 'published',
          domain: updatedWebsite.domain
        });
        setSaveMessage('Website published successfully!');
        
        toast({
          title: "Website published",
          description: "Your website is now live",
        });
      }
      
      setShowPublishModal(false);
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Publish/unpublish failed:', error);
      setSaveMessage('Failed to update website status');
      
      toast({
        title: "Publishing failed",
        description: error instanceof Error ? error.message : "Failed to publish website",
        variant: "destructive",
      });
      
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsPublishing(false);
    }
  };

  const formatLastSaved = () => {
    if (!lastSaved) return 'Never saved';
    
    const now = new Date();
    const diffMs = now.getTime() - lastSaved.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just saved';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return lastSaved.toLocaleDateString();
  };

  if (!currentWebsite) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No website selected</h2>
          <p className="text-gray-600 mb-6">Please select a website from your dashboard to start editing.</p>
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
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                currentWebsite.status === 'published' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {currentWebsite.status === 'published' ? 'Published' : 'Draft'}
              </span>
              <span>•</span>
              <span>{formatLastSaved()}</span>
              {saveMessage && (
                <>
                  <span>•</span>
                  <span className={`flex items-center ${
                    saveMessage.includes('failed') || saveMessage.includes('error') 
                      ? 'text-red-600' 
                      : 'text-green-600'
                  }`}>
                    {saveMessage.includes('failed') || saveMessage.includes('error') ? (
                      <AlertCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    )}
                    {saveMessage}
                  </span>
                </>
              )}
            </div>
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
            onClick={() => setShowVersionHistory(!showVersionHistory)}
            className={`p-2 rounded-lg transition-colors ${
              showVersionHistory
                ? 'bg-purple-100 text-purple-700'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Version History"
          >
            <Layers className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => setShowCollaborationPanel(!showCollaborationPanel)}
            className={`p-2 rounded-lg transition-colors ${
              showCollaborationPanel
                ? 'bg-blue-100 text-blue-700'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Collaboration"
          >
            <Users className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => setShowDomainSettings(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Domain Settings"
          >
            <Globe className="h-4 w-4 text-gray-600" />
          </button>
          
          <button
            onClick={() => setShowDeploymentPanel(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Deploy Website"
          >
            <Rocket className="h-4 w-4 text-gray-600" />
          </button>
          
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
          
          <button 
            onClick={handleManualSave}
            disabled={isSaving || !hasUnsavedChanges}
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </button>
          
          <button 
            onClick={() => setShowPublishModal(true)}
            disabled={isPublishing}
            className={`flex items-center px-3 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              currentWebsite.status === 'published'
                ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isPublishing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Share2 className="h-4 w-4 mr-2" />
            )}
            {currentWebsite.status === 'published' ? 'Unpublish' : 'Publish'}
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

        {/* Version History Panel */}
        {!isPreviewMode && showVersionHistory && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="w-80 bg-white border-r border-gray-200 flex flex-col"
          >
            <VersionHistoryPanel 
              websiteId={currentWebsite.id}
              onClose={() => setShowVersionHistory(false)}
            />
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
            onContentChange={handleContentChange}
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

        {/* Collaboration Panel */}
        {!isPreviewMode && showCollaborationPanel && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <CollaborationPanel websiteId={currentWebsite.id} />
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

      {/* Publish Modal */}
      {showPublishModal && (
        <PublishModal
          website={currentWebsite}
          onClose={() => setShowPublishModal(false)}
          onPublish={handlePublish}
          isPublishing={isPublishing}
        />
      )}

      {/* Domain Settings Modal */}
      {showDomainSettings && (
        <DomainSettings
          website={currentWebsite}
          onClose={() => setShowDomainSettings(false)}
        />
      )}

      {/* Deployment Panel */}
      {showDeploymentPanel && (
        <DeploymentPanel
          websiteId={currentWebsite.id}
          onClose={() => setShowDeploymentPanel(false)}
        />
      )}

      {/* Keyboard Shortcuts Help */}
      <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-xs opacity-0 hover:opacity-100 transition-opacity">
        <div className="space-y-1">
          <div>Ctrl+S: Save</div>
          <div>Ctrl+Z: Undo</div>
          <div>Ctrl+Y: Redo</div>
          <div>P: Preview</div>
        </div>
      </div>

      {/* Made with Bolt button is added in the App component */}
    </div>
  );
};

export default EditorPage;