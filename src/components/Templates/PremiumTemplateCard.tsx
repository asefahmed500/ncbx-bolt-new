import React, { useState } from 'react';
import { Star, Lock, CheckCircle, CreditCard, Eye, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { PremiumTemplate, useStripe } from '../../hooks/useStripe';
import { useAppStore } from '../../store/useAppStore';

interface PremiumTemplateCardProps {
  template: PremiumTemplate;
  onUse: (template: PremiumTemplate) => void;
  index: number;
}

const PremiumTemplateCard: React.FC<PremiumTemplateCardProps> = ({ template, onUse, index }) => {
  const { user } = useAppStore();
  const { purchaseTemplate, loading } = useStripe();
  const [showPreview, setShowPreview] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price / 100);
  };

  const handlePurchase = async () => {
    if (!user) return;

    try {
      setIsPurchasing(true);
      await purchaseTemplate(template.id);
    } catch (error) {
      console.error('Error purchasing template:', error);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleUse = () => {
    if (template.has_access) {
      onUse(template);
    } else {
      handlePurchase();
    }
  };

  const canAccess = template.has_access || user?.plan === 'pro' || user?.plan === 'business';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: index * 0.05 }}
        className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden group border border-gray-100 relative"
      >
        {/* Premium Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center">
            <Star className="h-3 w-3 mr-1 fill-current" />
            Premium
          </span>
        </div>

        {/* Access Status */}
        <div className="absolute top-3 right-3 z-10">
          {canAccess ? (
            <div className="bg-green-500 text-white p-2 rounded-full">
              <CheckCircle className="h-4 w-4" />
            </div>
          ) : (
            <div className="bg-gray-900 bg-opacity-75 text-white p-2 rounded-full">
              <Lock className="h-4 w-4" />
            </div>
          )}
        </div>

        {/* Template Preview */}
        <div className="relative">
          <img
            src={template.thumbnail_url}
            alt={template.name}
            className={`w-full h-48 object-cover transition-all duration-300 ${
              canAccess ? 'group-hover:scale-105' : 'filter blur-sm'
            }`}
          />
          
          {/* Overlay */}
          <div className={`absolute inset-0 transition-all ${
            canAccess 
              ? 'bg-black bg-opacity-0 group-hover:bg-opacity-20' 
              : 'bg-black bg-opacity-30'
          }`}>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowPreview(true)}
                  className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-900 px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </button>
                <button
                  onClick={handleUse}
                  disabled={isPurchasing || loading}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                    canAccess
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600'
                  }`}
                >
                  {isPurchasing || loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : canAccess ? (
                    <Zap className="h-4 w-4 mr-2" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  {canAccess ? 'Use Template' : 'Purchase'}
                </button>
              </div>
            </div>
          </div>

          {/* Price Tag */}
          {!canAccess && (
            <div className="absolute bottom-3 left-3">
              <div className="bg-white bg-opacity-95 backdrop-blur-sm px-3 py-1 rounded-full">
                <span className="text-lg font-bold text-gray-900">
                  {formatPrice(template.price, template.currency)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Template Info */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
                {template.name}
              </h3>
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                {template.description}
              </p>
              <span className="inline-block bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium capitalize">
                {template.category}
              </span>
            </div>
          </div>

          {/* Features */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Features:</h4>
            <div className="space-y-1">
              {template.features.slice(0, 3).map((feature, idx) => (
                <div key={idx} className="flex items-center text-xs text-gray-600">
                  <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                  {feature}
                </div>
              ))}
              {template.features.length > 3 && (
                <p className="text-xs text-gray-500">
                  +{template.features.length - 3} more features
                </p>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-4">
            {template.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Action Button */}
          <button
            onClick={handleUse}
            disabled={isPurchasing || loading}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
              canAccess
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600'
            }`}
          >
            {isPurchasing || loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : canAccess ? (
              <Zap className="h-4 w-4 mr-2" />
            ) : (
              <CreditCard className="h-4 w-4 mr-2" />
            )}
            {canAccess ? 'Use This Template' : `Purchase for ${formatPrice(template.price, template.currency)}`}
          </button>

          {/* Access Info */}
          {!canAccess && (
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500">
                Or upgrade to Pro/Business for access to all premium templates
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{template.name} Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <img
                src={template.preview_url || template.thumbnail_url}
                alt={template.name}
                className="w-full h-auto rounded-lg"
              />
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowPreview(false);
                  handleUse();
                }}
                disabled={isPurchasing || loading}
                className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center ${
                  canAccess
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600'
                }`}
              >
                {isPurchasing || loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : canAccess ? (
                  <Zap className="h-4 w-4 mr-2" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                {canAccess ? 'Use Template' : `Purchase for ${formatPrice(template.price, template.currency)}`}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default PremiumTemplateCard;