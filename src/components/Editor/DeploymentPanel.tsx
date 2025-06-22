import React, { useState, useEffect } from 'react';
import { Rocket, CheckCircle, AlertCircle, Loader, ExternalLink, Copy, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDeployment, DeploymentStatus } from '../../hooks/useDeployment';
import { useToast } from '../ui/use-toast';

interface DeploymentPanelProps {
  websiteId: string;
  onClose: () => void;
}

const DeploymentPanel: React.FC<DeploymentPanelProps> = ({ websiteId, onClose }) => {
  const { deployWebsite, getDeploymentStatus, getLatestDeployment, loading } = useDeployment();
  const { toast } = useToast();
  
  const [deploymentId, setDeploymentId] = useState<string | null>(null);
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load latest deployment on mount
  useEffect(() => {
    loadLatestDeployment();
  }, [websiteId]);

  // Poll for status updates when deploying
  useEffect(() => {
    if (deploymentId && (isDeploying || deploymentStatus?.status === 'in_progress')) {
      const interval = setInterval(() => {
        checkDeploymentStatus(deploymentId);
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [deploymentId, isDeploying, deploymentStatus]);

  const loadLatestDeployment = async () => {
    try {
      const deployment = await getLatestDeployment(websiteId);
      if (deployment) {
        setDeploymentStatus(deployment);
        setDeploymentId(deployment.id);
      }
    } catch (err) {
      console.error('Error loading latest deployment:', err);
    }
  };

  const checkDeploymentStatus = async (id: string) => {
    try {
      const status = await getDeploymentStatus(id);
      if (status) {
        setDeploymentStatus(status);
        
        if (status.status !== 'in_progress') {
          setIsDeploying(false);
          
          if (status.status === 'completed') {
            toast({
              title: "Deployment successful",
              description: "Your website has been deployed successfully",
            });
          } else if (status.status === 'failed') {
            toast({
              title: "Deployment failed",
              description: "There was an error deploying your website",
              variant: "destructive",
            });
          }
        }
      }
    } catch (err) {
      console.error('Error checking deployment status:', err);
    }
  };

  const handleDeploy = async () => {
    try {
      setIsDeploying(true);
      setError(null);
      
      const result = await deployWebsite(websiteId);
      
      if (result.success) {
        setDeploymentId(result.data?.deploymentId);
        toast({
          title: "Deployment started",
          description: "Your website is being deployed",
        });
      } else {
        setIsDeploying(false);
        setError(result.error || 'Failed to start deployment');
        toast({
          title: "Deployment failed",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (err) {
      setIsDeploying(false);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast({
        title: "Deployment error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "URL copied successfully",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Rocket className="h-6 w-6 text-purple-600 mr-3" />
              <h3 className="text-2xl font-bold text-gray-900">Website Deployment</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Current Deployment Status */}
          {deploymentStatus ? (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Deployment Status</h4>
              
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(deploymentStatus.status)}`}>
                      {deploymentStatus.status.charAt(0).toUpperCase() + deploymentStatus.status.slice(1)}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDate(deploymentStatus.deployed_at)}
                  </span>
                </div>
                
                {deploymentStatus.status === 'in_progress' && (
                  <div className="flex items-center justify-center py-6">
                    <div className="flex flex-col items-center">
                      <Loader className="h-8 w-8 text-blue-600 animate-spin mb-3" />
                      <p className="text-blue-600 font-medium">Deploying your website...</p>
                      <p className="text-sm text-gray-500 mt-1">This may take a few moments</p>
                    </div>
                  </div>
                )}
                
                {deploymentStatus.status === 'completed' && deploymentStatus.deployment_url && (
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Deployment URL</h5>
                      <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                        <span className="text-blue-600 font-medium break-all">
                          {deploymentStatus.deployment_url}
                        </span>
                        <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                          <button
                            onClick={() => copyToClipboard(deploymentStatus.deployment_url!)}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Copy URL"
                          >
                            <Copy className="h-4 w-4 text-gray-600" />
                          </button>
                          <a
                            href={deploymentStatus.deployment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Open website"
                          >
                            <ExternalLink className="h-4 w-4 text-gray-600" />
                          </a>
                        </div>
                      </div>
                    </div>
                    
                    {deploymentStatus.custom_domain && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Custom Domain</h5>
                        <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                          <span className="text-blue-600 font-medium break-all">
                            https://{deploymentStatus.custom_domain}
                          </span>
                          <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                            <button
                              onClick={() => copyToClipboard(`https://${deploymentStatus.custom_domain}`)}
                              className="p-1 hover:bg-gray-100 rounded"
                              title="Copy URL"
                            >
                              <Copy className="h-4 w-4 text-gray-600" />
                            </button>
                            <a
                              href={`https://${deploymentStatus.custom_domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 hover:bg-gray-100 rounded"
                              title="Open website"
                            >
                              <ExternalLink className="h-4 w-4 text-gray-600" />
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200 flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-green-800 font-medium">Deployment Successful</p>
                        <p className="text-sm text-green-700 mt-1">
                          Your website is now live and accessible to visitors.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {deploymentStatus.status === 'failed' && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200 flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-800 font-medium">Deployment Failed</p>
                      <p className="text-sm text-red-700 mt-1">
                        There was an error deploying your website. Please try again or contact support.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-between">
                <button
                  onClick={loadLatestDeployment}
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Status
                </button>
                
                {deploymentStatus.status !== 'in_progress' && (
                  <button
                    onClick={handleDeploy}
                    disabled={isDeploying || loading}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center"
                  >
                    {isDeploying || loading ? (
                      <Loader className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Rocket className="h-4 w-4 mr-2" />
                    )}
                    Deploy Again
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-100 mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Deploy?</h4>
                <p className="text-gray-600 mb-4">
                  Deploying your website will make it accessible to visitors at your custom domain or a generated subdomain.
                </p>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700">Your website will be built and optimized for performance</p>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700">SSL certificate will be automatically provisioned</p>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700">Content will be distributed via global CDN for fast loading</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleDeploy}
                disabled={isDeploying || loading}
                className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isDeploying || loading ? (
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Rocket className="h-4 w-4 mr-2" />
                )}
                Deploy Website
              </button>
            </div>
          )}

          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Deployment History</h4>
            
            {/* In a real app, this would show actual deployment history */}
            <div className="text-center py-6 text-gray-500">
              <p>Deployment history will appear here</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DeploymentPanel;