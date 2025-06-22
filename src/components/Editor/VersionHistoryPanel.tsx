import React, { useState, useEffect } from 'react';
import { Clock, ArrowLeft, RotateCcw, Check, X, AlertCircle, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWebsites, WebsiteVersion } from '../../hooks/useWebsites';

interface VersionHistoryPanelProps {
  websiteId: string;
  onClose: () => void;
}

const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({ websiteId, onClose }) => {
  const { getWebsiteVersions } = useWebsites();
  const [versions, setVersions] = useState<WebsiteVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

  useEffect(() => {
    fetchVersions();
  }, [websiteId]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWebsiteVersions(websiteId);
      setVersions(data);
    } catch (err) {
      console.error('Error fetching versions:', err);
      setError('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = (versionId: string) => {
    setSelectedVersion(versionId);
    setShowRestoreConfirm(true);
  };

  const confirmRestore = async () => {
    // In a real implementation, this would restore the selected version
    setShowRestoreConfirm(false);
    setSelectedVersion(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    
    return formatDate(dateString);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={onClose}
              className="p-1 mr-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900">Version History</h3>
          </div>
          <button
            onClick={fetchVersions}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RotateCcw className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader className="h-6 w-6 text-blue-600 animate-spin" />
            <span className="ml-2 text-gray-600">Loading versions...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-center p-4">
            <div>
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-gray-700">{error}</p>
              <button
                onClick={fetchVersions}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : versions.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center p-4">
            <div>
              <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-700">No versions found</p>
              <p className="text-sm text-gray-500 mt-1">
                Save changes to create new versions
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {versions.map((version) => (
              <div
                key={version.id}
                className={`border rounded-lg p-3 transition-colors ${
                  version.is_published
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm font-medium text-gray-900">
                      Version {version.version_number}
                    </span>
                  </div>
                  <div className="flex items-center">
                    {version.is_published && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mr-2">
                        Published
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(version.created_at)}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">
                  {version.changes_summary || 'No description'}
                </p>
                
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => handleRestore(version.id)}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Restore this version
                  </button>
                  
                  <button className="text-xs text-gray-600 hover:text-gray-800">
                    View changes
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Restore Confirmation Modal */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Restore Version</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to restore this version? Your current unsaved changes will be lost.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowRestoreConfirm(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRestore}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restore
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default VersionHistoryPanel;