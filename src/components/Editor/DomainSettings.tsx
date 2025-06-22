import React, { useState, useEffect } from 'react';
import { Globe, CheckCircle, AlertCircle, ExternalLink, Copy, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDomains } from '../../hooks/useDomains';
import { useToast } from '../ui/use-toast';

interface DomainSettingsProps {
  website: {
    id: string;
    name: string;
    domain?: string;
    status: 'draft' | 'published';
  };
  onClose: () => void;
}

const DomainSettings: React.FC<DomainSettingsProps> = ({ website, onClose }) => {
  const { connectCustomDomain, disconnectDomain, getDomainStatus, loading } = useDomains();
  const { toast } = useToast();
  
  const [customDomain, setCustomDomain] = useState(website.domain || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [domainStatus, setDomainStatus] = useState<any>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [domainInstructions, setDomainInstructions] = useState<any>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    if (website.domain) {
      checkDomainStatus(website.domain);
    }
  }, [website.domain]);

  const validateDomain = () => {
    if (!customDomain) {
      setErrors({ domain: 'Please enter a domain name' });
      return false;
    }

    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    if (!domainRegex.test(customDomain)) {
      setErrors({ domain: 'Please enter a valid domain name (e.g., example.com)' });
      return false;
    }
    
    setErrors({});
    return true;
  };

  const handleConnect = async () => {
    if (!validateDomain()) return;
    
    const result = await connectCustomDomain(website.id, customDomain);
    
    if (result.success) {
      toast({
        title: "Domain connected",
        description: result.message,
      });
      
      if (result.data?.domainInstructions) {
        setDomainInstructions(result.data.domainInstructions);
        setShowInstructions(true);
      }
    } else {
      setErrors({ domain: result.error || 'Failed to connect domain' });
      toast({
        title: "Connection failed",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    if (!website.domain) return;
    
    const result = await disconnectDomain(website.id);
    
    if (result.success) {
      setCustomDomain('');
      setDomainStatus(null);
      setDomainInstructions(null);
      setShowInstructions(false);
      
      toast({
        title: "Domain disconnected",
        description: result.message,
      });
    } else {
      toast({
        title: "Disconnection failed",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const checkDomainStatus = async (domain: string) => {
    setCheckingStatus(true);
    const result = await getDomainStatus(domain);
    setCheckingStatus(false);
    
    if (result.success && result.data?.status) {
      setDomainStatus(result.data.status);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Text copied successfully",
    });
  };

  const getDefaultSubdomain = () => {
    const websiteName = website.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const websiteId = website.id.substring(0, 8);
    return `${websiteName}-${websiteId}.ncbx.app`;
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
              <Globe className="h-6 w-6 text-blue-600 mr-3" />
              <h3 className="text-2xl font-bold text-gray-900">Domain Settings</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          {/* Default Subdomain */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Default Subdomain</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Your website is available at:</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyToClipboard(`https://${getDefaultSubdomain()}`)}
                    className="p-1 hover:bg-gray-200 rounded"
                    title="Copy URL"
                  >
                    <Copy className="h-4 w-4 text-gray-600" />
                  </button>
                  <a
                    href={`https://${getDefaultSubdomain()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-gray-200 rounded"
                    title="Open website"
                  >
                    <ExternalLink className="h-4 w-4 text-gray-600" />
                  </a>
                </div>
              </div>
              <div className="text-blue-600 font-medium break-all">
                https://{getDefaultSubdomain()}
              </div>
            </div>
          </div>

          {/* Custom Domain */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Custom Domain</h4>
            
            {website.domain ? (
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-medium text-green-800">Domain Connected</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => copyToClipboard(`https://${website.domain}`)}
                        className="p-1 hover:bg-green-100 rounded"
                        title="Copy URL"
                      >
                        <Copy className="h-4 w-4 text-green-600" />
                      </button>
                      <a
                        href={`https://${website.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-green-100 rounded"
                        title="Open website"
                      >
                        <ExternalLink className="h-4 w-4 text-green-600" />
                      </a>
                    </div>
                  </div>
                  <div className="text-green-800 font-medium break-all">
                    https://{website.domain}
                  </div>
                </div>

                {domainStatus && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center justify-between">
                      <span>Domain Status</span>
                      <button
                        onClick={() => checkDomainStatus(website.domain!)}
                        disabled={checkingStatus}
                        className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
                      >
                        {checkingStatus ? (
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3 mr-1" />
                        )}
                        Refresh
                      </button>
                    </h5>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">DNS Configuration</span>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          domainStatus.dns.configured 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {domainStatus.dns.configured ? 'Configured' : 'Pending'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">SSL Certificate</span>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          domainStatus.ssl.configured 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {domainStatus.ssl.configured ? 'Active' : 'Pending'}
                        </span>
                      </div>
                      
                      {domainStatus.ssl.configured && (
                        <div className="text-xs text-gray-500">
                          SSL certificate valid until {new Date(domainStatus.ssl.validUntil).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleDisconnect}
                  disabled={loading}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    'Disconnect Domain'
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 mb-4">
                    Connect your own domain to give your website a professional look.
                  </p>
                  
                  <div>
                    <label htmlFor="customDomain" className="block text-sm font-medium text-gray-700 mb-2">
                      Domain Name
                    </label>
                    <input
                      id="customDomain"
                      type="text"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      placeholder="example.com"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.domain ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.domain && <p className="mt-1 text-sm text-red-600">{errors.domain}</p>}
                    <p className="mt-1 text-xs text-gray-500">
                      Enter your domain without http:// or https://
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleConnect}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    'Connect Domain'
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Domain Setup Instructions */}
          {showInstructions && domainInstructions && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Domain Setup Instructions</h4>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h5 className="text-sm font-medium text-blue-800 mb-3">
                  Follow these steps to connect your domain:
                </h5>
                
                <ol className="space-y-2 text-sm text-blue-700 list-decimal pl-5 mb-4">
                  {domainInstructions.instructions.steps.map((step: string, index: number) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
                
                <div className="bg-white p-3 rounded-lg mb-3">
                  <h6 className="text-xs font-medium text-gray-700 mb-2">DNS Records</h6>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-gray-600">Type</th>
                          <th className="px-3 py-2 text-left text-gray-600">Name</th>
                          <th className="px-3 py-2 text-left text-gray-600">Value</th>
                          <th className="px-3 py-2 text-left text-gray-600">TTL</th>
                          <th className="px-3 py-2 text-left text-gray-600"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {domainInstructions.dnsRecords.map((record: any, index: number) => (
                          <tr key={index} className="border-t border-gray-100">
                            <td className="px-3 py-2 font-medium">{record.type}</td>
                            <td className="px-3 py-2">{record.name}</td>
                            <td className="px-3 py-2 font-mono">{record.value}</td>
                            <td className="px-3 py-2">{record.ttl}</td>
                            <td className="px-3 py-2">
                              <button
                                onClick={() => copyToClipboard(record.value)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Copy value"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="text-xs text-blue-600">
                  <AlertCircle className="h-3 w-3 inline mr-1" />
                  DNS changes can take up to 48 hours to propagate globally.
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DomainSettings;