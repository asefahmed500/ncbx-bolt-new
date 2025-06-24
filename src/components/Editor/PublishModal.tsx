/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Globe, AlertCircle, CheckCircle, Copy, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDomains } from '../../hooks/useDomains';
import { useToast } from '../ui/use-toast';

interface PublishModalProps {
  website: {
    id: string;
    name: string;
    status: 'draft' | 'published';
    domain?: string;
  };
  onClose: () => void;
  onPublish: (customDomain?: string) => void;
  isPublishing: boolean;
}

const PublishModal: React.FC<PublishModalProps> = ({ 
  website, 
  onClose, 
  onPublish,
  isPublishing
}) => {
  const { connectCustomDomain, loading: domainLoading } = useDomains();
  const { toast } = useToast();
  
  const [customDomain, setCustomDomain] = useState(website.domain || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [publishOption, setPublishOption] = useState<'subdomain' | 'custom'>(
    website.domain && !website.domain.includes('.ncbx.app') ? 'custom' : 'subdomain'
  );
  const [domainInstructions, setDomainInstructions] = useState<any>(null);
  const [showDomainInstructions, setShowDomainInstructions] = useState(false);

  const validateDomain = () => {
    if (publishOption === 'custom' && customDomain) {
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
      if (!domainRegex.test(customDomain)) {
        setErrors({ domain: 'Please enter a valid domain name (e.g., example.com)' });
        return false;
      }
    }
    
    setErrors({});
    return true;
  };

  const handlePublish = async () => {
    if (!validateDomain()) return;
    
    if (publishOption === 'custom' && customDomain) {
      // Connect domain first
      const domainResult = await connectCustomDomain(website.id, customDomain);
      
      if (!domainResult.success) {
        setErrors({ domain: domainResult.error || 'Failed to connect domain' });
        toast({
          title: "Domain connection failed",
          description: domainResult.error,
          variant: "destructive",
        });
        return;
      }
      
      if (domainResult.data?.domainInstructions) {
        setDomainInstructions(domainResult.data.domainInstructions);
        setShowDomainInstructions(true);
      }
    }
    
    // Publish the website
    const domain = publishOption === 'custom' ? customDomain : undefined;
    onPublish(domain);
  };

  const getDefaultSubdomain = () => {
    const websiteName = website.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const websiteId = website.id.substring(0, 8);
    return `${websiteName}-${websiteId}.ncbx.app`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Text copied successfully",
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl max-w-lg w-full overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">
              {website.status === 'published' ? 'Manage Publication' : 'Publish Website'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          {website.status === 'published' ? (
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Website Published</h4>
                  <p className="text-gray-600">Your website is live and accessible to visitors</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Website URL</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => copyToClipboard(`https://${website.domain || getDefaultSubdomain()}`)}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="Copy URL"
                    >
                      <Copy className="h-4 w-4 text-gray-600" />
                    </button>
                    <a
                      href={`https://${website.domain || getDefaultSubdomain()}`}
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
                  https://{website.domain || getDefaultSubdomain()}
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h5 className="text-sm font-medium text-yellow-800 mb-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Unpublish Website?
                </h5>
                <p className="text-sm text-yellow-700 mb-3">
                  Unpublishing will make your website inaccessible to visitors. You can republish it anytime.
                </p>
                <button
                  onClick={() => onPublish()}
                  disabled={isPublishing}
                  className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isPublishing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    'Unpublish Website'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <Globe className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Ready to go live?</h4>
                  <p className="text-gray-600">Choose how visitors will access your website</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    publishOption === 'subdomain'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => setPublishOption('subdomain')}
                >
                  <div className="flex items-start">
                    <div className={`w-5 h-5 rounded-full border flex-shrink-0 mt-0.5 mr-3 flex items-center justify-center ${
                      publishOption === 'subdomain' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                    }`}>
                      {publishOption === 'subdomain' && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <h5 className="text-base font-medium text-gray-900 mb-1">Use NCBX Subdomain</h5>
                      <p className="text-sm text-gray-600 mb-2">
                        Quick and easy - no additional setup required
                      </p>
                      <div className="text-sm font-medium text-blue-600 break-all">
                        https://{getDefaultSubdomain()}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    publishOption === 'custom'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => setPublishOption('custom')}
                >
                  <div className="flex items-start">
                    <div className={`w-5 h-5 rounded-full border flex-shrink-0 mt-0.5 mr-3 flex items-center justify-center ${
                      publishOption === 'custom' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                    }`}>
                      {publishOption === 'custom' && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h5 className="text-base font-medium text-gray-900 mb-1">Use Custom Domain</h5>
                      <p className="text-sm text-gray-600 mb-2">
                        Connect your own domain for a professional look
                      </p>
                      
                      {publishOption === 'custom' && (
                        <div className="mt-3">
                          <input
                            type="text"
                            value={customDomain}
                            onChange={(e) => setCustomDomain(e.target.value)}
                            placeholder="yourdomain.com"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.domain ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                          {errors.domain && (
                            <p className="mt-1 text-sm text-red-600">{errors.domain}</p>
                          )}
                          <p className="mt-1 text-xs text-gray-500">
                            Enter your domain without http:// or https://
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showAdvanced ? 'Hide' : 'Show'} advanced options
                </button>
              </div>

              {showAdvanced && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Advanced Options</h5>
                  
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                      <span className="text-sm text-gray-700">Enable SSL/HTTPS</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                      <span className="text-sm text-gray-700">Enable SEO optimization</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                      <span className="text-sm text-gray-700">Enable analytics tracking</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Domain Setup Instructions */}
          {showDomainInstructions && domainInstructions && (
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

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            
            {website.status !== 'published' && (
              <button
                onClick={handlePublish}
                disabled={isPublishing || domainLoading}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isPublishing || domainLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <>
                    <Globe className="h-4 w-4 mr-2" />
                    Publish Website
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PublishModal;