import React, { useState } from 'react';
import { Users, MessageCircle, Plus, Check, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCollaboration } from '../../hooks/useCollaboration';
import { useAppStore } from '../../store/useAppStore';

interface CollaborationPanelProps {
  websiteId: string;
}

const CollaborationPanel: React.FC<CollaborationPanelProps> = ({ websiteId }) => {
  const { user } = useAppStore();
  const {
    activeSessions,
    comments,
    addComment,
    resolveComment
  } = useCollaboration(websiteId);

  const [showCommentForm, setShowCommentForm] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'comments'>('users');

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const comment = await addComment(
      selectedElement,
      newComment.trim(),
      { x: 0, y: 0 }
    );

    if (comment) {
      setNewComment('');
      setShowCommentForm(false);
      setSelectedElement(null);
    }
  };

  const handleResolveComment = async (commentId: string) => {
    await resolveComment(commentId);
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
    return `${diffDays}d ago`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const activeUsers = activeSessions.filter(session => session.user_id !== user?.id);

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Collaboration</h3>
        
        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="h-4 w-4 mr-2" />
            Users ({activeSessions.length})
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'comments'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Comments ({comments.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'users' && (
          <div className="p-4">
            {/* Current User */}
            {user && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">You</h4>
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                    ) : (
                      getInitials(user.name)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500">Owner</p>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              </div>
            )}

            {/* Active Users */}
            {activeUsers.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Active Users ({activeUsers.length})
                </h4>
                <div className="space-y-2">
                  {activeUsers.map((session) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {session.user?.avatar_url ? (
                          <img 
                            src={session.user.avatar_url} 
                            alt={session.user.full_name} 
                            className="w-8 h-8 rounded-full" 
                          />
                        ) : (
                          getInitials(session.user?.full_name || 'User')
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {session.user?.full_name || 'Anonymous User'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatTimeAgo(session.last_ping)}
                        </p>
                      </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {activeUsers.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-sm font-medium text-gray-900 mb-2">No other users online</h3>
                <p className="text-xs text-gray-500">
                  Invite collaborators to work together in real-time
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="p-4">
            {/* Add Comment Button */}
            <button
              onClick={() => setShowCommentForm(true)}
              className="w-full mb-4 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Comment
            </button>

            {/* Comment Form */}
            <AnimatePresence>
              {showCommentForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 bg-blue-50 p-4 rounded-lg"
                >
                  <h4 className="text-sm font-medium text-gray-900 mb-2">New Comment</h4>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                    rows={3}
                    placeholder="Type your comment here..."
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        setShowCommentForm(false);
                        setNewComment('');
                      }}
                      className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 text-sm hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      Add Comment
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Comments List */}
            {comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`p-3 rounded-lg border ${
                      comment.is_resolved
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                          {comment.user?.avatar_url ? (
                            <img 
                              src={comment.user.avatar_url} 
                              alt={comment.user.full_name} 
                              className="w-6 h-6 rounded-full" 
                            />
                          ) : (
                            getInitials(comment.user?.full_name || 'User')
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {comment.user?.full_name || 'Anonymous User'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTimeAgo(comment.created_at)}
                      </span>
                    </div>
                    
                    <p className={`text-sm ${comment.is_resolved ? 'text-gray-500' : 'text-gray-700'}`}>
                      {comment.content}
                    </p>
                    
                    {comment.element_id && (
                      <div className="mt-1 text-xs text-gray-500">
                        Element: {comment.element_id}
                      </div>
                    )}
                    
                    {/* Comment Actions */}
                    <div className="mt-2 flex justify-between items-center">
                      {comment.is_resolved ? (
                        <span className="text-xs text-green-600 flex items-center">
                          <Check className="h-3 w-3 mr-1" />
                          Resolved
                        </span>
                      ) : (
                        <button
                          onClick={() => handleResolveComment(comment.id)}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Resolve
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          setNewComment(`Replying to: "${comment.content.substring(0, 30)}..."\n\n`);
                          setShowCommentForm(true);
                        }}
                        className="text-xs text-gray-600 hover:text-gray-800"
                      >
                        Reply
                      </button>
                    </div>
                    
                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-3 pl-4 border-l-2 border-gray-200 space-y-3">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="text-sm">
                            <div className="flex items-center space-x-2 mb-1">
                              <div className="w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                {reply.user?.avatar_url ? (
                                  <img 
                                    src={reply.user.avatar_url} 
                                    alt={reply.user.full_name} 
                                    className="w-5 h-5 rounded-full" 
                                  />
                                ) : (
                                  getInitials(reply.user?.full_name || 'User')
                                )}
                              </div>
                              <span className="text-xs font-medium text-gray-900">
                                {reply.user?.full_name || 'Anonymous User'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatTimeAgo(reply.created_at)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-700">{reply.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-sm font-medium text-gray-900 mb-2">No comments yet</h3>
                <p className="text-xs text-gray-500">
                  Add comments to collaborate with your team
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-600">
              {activeSessions.length} active user{activeSessions.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={() => setActiveTab(activeTab === 'users' ? 'comments' : 'users')}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Switch to {activeTab === 'users' ? 'Comments' : 'Users'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollaborationPanel;