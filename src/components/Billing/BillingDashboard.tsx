import React, { useState, useEffect } from 'react';
import { CreditCard, Download, Calendar, AlertCircle, CheckCircle, ExternalLink, Loader, DollarSign, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStripe, BillingSummary, PaymentMethod, Invoice } from '../../hooks/useStripe';
import { useAppStore } from '../../store/useAppStore';

const BillingDashboard: React.FC = () => {
  const { user } = useAppStore();
  const { 
    loading, 
    error, 
    plans, 
    createCheckoutSession, 
    createPortalSession, 
    getBillingSummary, 
    getPaymentMethods, 
    getInvoices,
    cancelSubscription,
    reactivateSubscription
  } = useStripe();

  const [billingSummary, setBillingSummary] = useState<BillingSummary | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadBillingData();
  }, [user]);

  const loadBillingData = async () => {
    if (!user) return;

    try {
      setLoadingData(true);
      const [summary, methods, invoiceList] = await Promise.all([
        getBillingSummary(),
        getPaymentMethods(),
        getInvoices()
      ]);

      setBillingSummary(summary);
      setPaymentMethods(methods);
      setInvoices(invoiceList);
    } catch (err) {
      console.error('Error loading billing data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan || !plan.stripePriceId) return;

    try {
      setActionLoading(prev => ({ ...prev, [`upgrade-${planId}`]: true }));
      await createCheckoutSession(plan.stripePriceId);
    } catch (err) {
      console.error('Error upgrading plan:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [`upgrade-${planId}`]: false }));
    }
  };

  const handleManageBilling = async () => {
    try {
      setActionLoading(prev => ({ ...prev, portal: true }));
      await createPortalSession();
    } catch (err) {
      console.error('Error opening billing portal:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, portal: false }));
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, cancel: true }));
      const result = await cancelSubscription();
      if (result.success) {
        await loadBillingData();
      }
    } catch (err) {
      console.error('Error canceling subscription:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, cancel: false }));
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      setActionLoading(prev => ({ ...prev, reactivate: true }));
      const result = await reactivateSubscription();
      if (result.success) {
        await loadBillingData();
      }
    } catch (err) {
      console.error('Error reactivating subscription:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, reactivate: false }));
    }
  };

  const formatCurrency = (amount: number, currency = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'trialing':
      case 'paid':
        return 'text-green-600 bg-green-100';
      case 'past_due':
      case 'unpaid':
        return 'text-yellow-600 bg-yellow-100';
      case 'canceled':
      case 'incomplete':
      case 'void':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
        <p className="text-gray-600">Please sign in to view your billing information</p>
      </div>
    );
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading billing information...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Current Plan Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Current Plan</h2>
          {billingSummary && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(billingSummary.subscription_status)}`}>
              {billingSummary.subscription_status.replace('_', ' ').toUpperCase()}
            </span>
          )}
        </div>

        {billingSummary ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Current Plan</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 capitalize">{billingSummary.plan_id}</p>
              <p className="text-sm text-gray-600">
                {billingSummary.cancel_at_period_end ? 'Cancels' : 'Renews'} on {formatDate(billingSummary.current_period_end)}
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Next Payment</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(billingSummary.next_invoice_amount)}
              </p>
              <p className="text-sm text-gray-600">Due {formatDate(billingSummary.current_period_end)}</p>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <CreditCard className="h-5 w-5 text-purple-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Payment Method</span>
              </div>
              {billingSummary.payment_method_brand ? (
                <>
                  <p className="text-lg font-semibold text-gray-900 capitalize">
                    {billingSummary.payment_method_brand} •••• {billingSummary.payment_method_last_four}
                  </p>
                  <p className="text-sm text-gray-600">Primary payment method</p>
                </>
              ) : (
                <p className="text-sm text-gray-600">No payment method on file</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">You're currently on the free plan</p>
            <p className="text-sm text-gray-500">Upgrade to unlock premium features</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mt-6">
          <button
            onClick={handleManageBilling}
            disabled={actionLoading.portal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
          >
            {actionLoading.portal ? (
              <Loader className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ExternalLink className="h-4 w-4 mr-2" />
            )}
            Manage Billing
          </button>

          {billingSummary?.cancel_at_period_end ? (
            <button
              onClick={handleReactivateSubscription}
              disabled={actionLoading.reactivate}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {actionLoading.reactivate ? (
                <Loader className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Reactivate Subscription
            </button>
          ) : billingSummary && (
            <button
              onClick={handleCancelSubscription}
              disabled={actionLoading.cancel}
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {actionLoading.cancel ? (
                <Loader className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <AlertCircle className="h-4 w-4 mr-2" />
              )}
              Cancel Subscription
            </button>
          )}
        </div>
      </motion.div>

      {/* Available Plans */}
      {(!billingSummary || billingSummary.plan_id === 'free') && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">Upgrade Your Plan</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.filter(plan => plan.id !== 'free').map((plan) => (
              <div
                key={plan.id}
                className={`border rounded-lg p-6 ${plan.popular ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'}`}
              >
                {plan.popular && (
                  <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium mb-4 inline-block">
                    Most Popular
                  </div>
                )}
                <h4 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h4>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-600">/{plan.interval}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={actionLoading[`upgrade-${plan.id}`]}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {actionLoading[`upgrade-${plan.id}`] ? (
                    <Loader className="h-4 w-4 animate-spin mx-auto" />
                  ) : (
                    `Upgrade to ${plan.name}`
                  )}
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Payment Methods */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Payment Methods</h3>
          <button
            onClick={handleManageBilling}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Add Payment Method
          </button>
        </div>

        {paymentMethods.length > 0 ? (
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900 capitalize">
                      {method.brand} •••• {method.last_four}
                    </p>
                    <p className="text-sm text-gray-600">
                      Expires {method.exp_month}/{method.exp_year}
                    </p>
                  </div>
                </div>
                {method.is_default && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    Default
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No payment methods on file</p>
            <p className="text-sm text-gray-500">Add a payment method to manage your subscription</p>
          </div>
        )}
      </motion.div>

      {/* Invoice History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-6">Invoice History</h3>

        {invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-900">
                      {formatDate(invoice.due_date)}
                    </td>
                    <td className="py-3 px-4 text-gray-900">
                      {formatCurrency(invoice.amount_due)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {invoice.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        {invoice.hosted_invoice_url && (
                          <a
                            href={invoice.hosted_invoice_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 text-sm"
                          >
                            View
                          </a>
                        )}
                        {invoice.invoice_pdf && (
                          <a
                            href={invoice.invoice_pdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            PDF
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No invoices yet</p>
            <p className="text-sm text-gray-500">Your invoice history will appear here</p>
          </div>
        )}
      </motion.div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
          <p className="text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
};

export default BillingDashboard;