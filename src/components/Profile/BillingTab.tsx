import React from 'react';
import BillingDashboard from '../Billing/BillingDashboard';

const BillingTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Billing & Subscription</h3>
        <p className="text-gray-600 text-sm">
          Manage your subscription, payment methods, and billing history
        </p>
      </div>
      
      <BillingDashboard />
    </div>
  );
};

export default BillingTab;