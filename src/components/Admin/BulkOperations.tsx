import React, { useState, useEffect } from 'react';
import { 
  Zap, Users, Mail, Download, Upload, CheckCircle, 
  AlertCircle, Clock, Play, Pause, X, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/useAppStore';

interface BulkOperation {
  id: string;
  admin_user_id: string;
  operation_type: string;
  target_count: number;
  processed_count: number;
  success_count: number;
  error_count: number;
  status: string;
  parameters: any;
  results: any;
  error_log: string[];
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

const BulkOperations: React.FC = () => {
  const { user } = useAppStore();
  const [operations, setOperations] = useState<BulkOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewOperation, setShowNewOperation] = useState(false);
  const [operationType, setOperationType] = useState<string>('update_plan');
  const [operationParams, setOperationParams] = useState<any>({
    plan: 'pro',
    role: 'user',
    target_criteria: 'all'
  });
  const [selectedOperation, setSelectedOperation] = useState<BulkOperation | null>(null);

  useEffect(() => {
    fetchOperations();
  }, []);

  const fetchOperations = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('bulk_operations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching operations:', error);
        return;
      }
      
      setOperations(data || []);
    } catch (err) {
      console.error('Error in fetchOperations:', err);
    } finally {
      setLoading(false);
    }
  };

  const createBulkOperation = async () => {
    if (!user) return;
    
    try {
      let userIds: string[] = [];
      let updates: any = {};
      
      // In a real implementation, you would fetch user IDs based on criteria
      // For demo purposes, we'll use a placeholder
      if (operationType === 'update_plan') {
        updates = { plan: operationParams.plan };
      } else if (operationType === 'update_role') {
        updates = { role: operationParams.role };
      }
      
      const { data, error } = await supabase.rpc('admin_bulk_update_users', {
        user_ids: userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000'], // Placeholder
        updates,
        admin_id: user.id
      });
      
      if (error) {
        console.error('Error creating bulk operation:', error);
        return;
      }
      
      setShowNewOperation(false);
      fetchOperations();
    } catch (err) {
      console.error('Error in createBulkOperation:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'running': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getOperationTypeLabel = (type: string) => {
    switch (type) {
      case 'bulk_user_update': return 'Bulk User Update';
      case 'bulk_email': return 'Bulk Email';
      case 'data_export': return 'Data Export';
      case 'data_import': return 'Data Import';
      default: return type.replace(/_/g, ' ');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getProgress = (operation: BulkOperation) => {
    if (operation.target_count === 0) return 0;
    return Math.round((operation.processed_count / operation.target_count) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Bulk Operations</h3>
        <button
          onClick={() => setShowNewOperation(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center"
        >
          <Zap className="h-4 w-4 mr-2" />
          New Operation
        </button>
      </div>

      {/* Operations List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Operation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {operations.map((operation) => (
                <tr key={operation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                        {operation.operation_type.includes('user') ? (
                          <Users className="h-5 w-5 text-purple-600" />
                        ) : operation.operation_type.includes('email') ? (
                          <Mail className="h-5 w-5 text-purple-600" />
                        ) : operation.operation_type.includes('export') ? (
                          <Download className="h-5 w-5 text-purple-600" />
                        ) : operation.operation_type.includes('import') ? (
                          <Upload className="h-5 w-5 text-purple-600" />
                        ) : (
                          <Zap className="h-5 w-5 text-purple-600" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {getOperationTypeLabel(operation.operation_type)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {operation.target_count} targets
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(operation.status)}`}>
                      {operation.status.charAt(0).toUpperCase() + operation.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                        <div 
                          className={`h-2.5 rounded-full ${
                            operation.status === 'completed' ? 'bg-green-600' : 
                            operation.status === 'failed' ? 'bg-red-600' : 'bg-blue-600'
                          }`} 
                          style={{ width: `${getProgress(operation)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {getProgress(operation)}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {operation.success_count} succeeded, {operation.error_count} failed
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(operation.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(operation.completed_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedOperation(operation)}
                      className="text-purple-600 hover:text-purple-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {operations.length === 0 && (
          <div className="text-center py-12">
            <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No operations found</h3>
            <p className="text-gray-500 mb-4">Create a bulk operation to manage multiple users at once</p>
            <button
              onClick={() => setShowNewOperation(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              Create Operation
            </button>
          </div>
        )}
      </div>

      {/* New Operation Modal */}
      {showNewOperation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-2xl w-full"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">New Bulk Operation</h3>
                <button
                  onClick={() => setShowNewOperation(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Operation Type
                  </label>
                  <select
                    value={operationType}
                    onChange={(e) => setOperationType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="update_plan">Update User Plan</option>
                    <option value="update_role">Update User Role</option>
                    <option value="send_email">Send Email</option>
                    <option value="export_data">Export User Data</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Users
                  </label>
                  <select
                    value={operationParams.target_criteria}
                    onChange={(e) => setOperationParams({ ...operationParams, target_criteria: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">All Users</option>
                    <option value="free_plan">Free Plan Users</option>
                    <option value="pro_plan">Pro Plan Users</option>
                    <option value="business_plan">Business Plan Users</option>
                    <option value="inactive">Inactive Users (30+ days)</option>
                    <option value="new">New Users (Last 7 days)</option>
                  </select>
                </div>
                
                {operationType === 'update_plan' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Plan
                    </label>
                    <select
                      value={operationParams.plan}
                      onChange={(e) => setOperationParams({ ...operationParams, plan: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="business">Business</option>
                    </select>
                  </div>
                )}
                
                {operationType === 'update_role' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Role
                    </label>
                    <select
                      value={operationParams.role}
                      onChange={(e) => setOperationParams({ ...operationParams, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                )}
                
                {operationType === 'send_email' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Subject
                      </label>
                      <input
                        type="text"
                        value={operationParams.subject || ''}
                        onChange={(e) => setOperationParams({ ...operationParams, subject: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter email subject"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Content
                      </label>
                      <textarea
                        value={operationParams.content || ''}
                        onChange={(e) => setOperationParams({ ...operationParams, content: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={4}
                        placeholder="Enter email content"
                      />
                    </div>
                  </>
                )}
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowNewOperation(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createBulkOperation}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Create Operation
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Operation Details Modal */}
      {selectedOperation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {getOperationTypeLabel(selectedOperation.operation_type)}
                </h3>
                <button
                  onClick={() => setSelectedOperation(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Operation Details</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className={`text-sm font-medium ${
                          selectedOperation.status === 'completed' ? 'text-green-600' :
                          selectedOperation.status === 'failed' ? 'text-red-600' :
                          selectedOperation.status === 'running' ? 'text-blue-600' :
                          'text-gray-600'
                        }`}>
                          {selectedOperation.status.charAt(0).toUpperCase() + selectedOperation.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Created:</span>
                        <span className="text-sm text-gray-900">{formatDate(selectedOperation.created_at)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Started:</span>
                        <span className="text-sm text-gray-900">{formatDate(selectedOperation.started_at)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Completed:</span>
                        <span className="text-sm text-gray-900">{formatDate(selectedOperation.completed_at)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Target Count:</span>
                        <span className="text-sm text-gray-900">{selectedOperation.target_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Processed:</span>
                        <span className="text-sm text-gray-900">{selectedOperation.processed_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Success:</span>
                        <span className="text-sm text-green-600">{selectedOperation.success_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Errors:</span>
                        <span className="text-sm text-red-600">{selectedOperation.error_count}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Progress</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Overall Progress</span>
                        <span className="text-sm font-medium text-gray-900">
                          {getProgress(selectedOperation)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${
                            selectedOperation.status === 'completed' ? 'bg-green-600' : 
                            selectedOperation.status === 'failed' ? 'bg-red-600' : 'bg-blue-600'
                          }`} 
                          style={{ width: `${getProgress(selectedOperation)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{selectedOperation.success_count}</div>
                        <div className="text-xs text-green-600">Successful</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{selectedOperation.error_count}</div>
                        <div className="text-xs text-red-600">Failed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {selectedOperation.target_count - selectedOperation.processed_count}
                        </div>
                        <div className="text-xs text-gray-600">Pending</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Error Log */}
              {selectedOperation.error_count > 0 && selectedOperation.error_log && selectedOperation.error_log.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Error Log</h4>
                  <div className="bg-red-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                    <ul className="space-y-1">
                      {selectedOperation.error_log.map((error, index) => (
                        <li key={index} className="text-sm text-red-600">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedOperation(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                {selectedOperation.status === 'running' && (
                  <button
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Pause className="h-4 w-4 mr-2 inline" />
                    Cancel Operation
                  </button>
                )}
                {selectedOperation.status === 'completed' && (
                  <button
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="h-4 w-4 mr-2 inline" />
                    Download Results
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default BulkOperations;