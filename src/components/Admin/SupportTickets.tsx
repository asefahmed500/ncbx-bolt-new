import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Plus, Search, Filter, Clock, User, 
  AlertCircle, CheckCircle, Eye, MessageCircle, Tag,
  Calendar, Priority, ArrowUp, ArrowDown, Minus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/useAppStore';

interface SupportTicket {
  id: string;
  user_id: string;
  assigned_admin_id: string | null;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  user?: {
    email: string;
    full_name: string;
  };
  assigned_admin?: {
    email: string;
    full_name: string;
  };
  message_count?: number;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_internal: boolean;
  created_at: string;
  user?: {
    email: string;
    full_name: string;
    role: string;
  };
}

const SupportTickets: React.FC = () => {
  const { user } = useAppStore();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          profiles!support_tickets_user_id_fkey(email, full_name),
          profiles!support_tickets_assigned_admin_id_fkey(email, full_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching tickets:', error);
        return;
      }
      
      const ticketsWithCounts = await Promise.all(
        (data || []).map(async (ticket) => {
          const { count } = await supabase
            .from('support_ticket_messages')
            .select('*', { count: 'exact', head: true })
            .eq('ticket_id', ticket.id);
          
          return {
            ...ticket,
            user: ticket.profiles,
            assigned_admin: ticket.profiles,
            message_count: count || 0
          };
        })
      );
      
      setTickets(ticketsWithCounts);
    } catch (err) {
      console.error('Error in fetchTickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('support_ticket_messages')
        .select(`
          *,
          profiles!support_ticket_messages_user_id_fkey(email, full_name, role)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }
      
      setTicketMessages(data?.map(msg => ({
        ...msg,
        user: msg.profiles
      })) || []);
    } catch (err) {
      console.error('Error in fetchTicketMessages:', err);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const updates: any = { status };
      if (status === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', ticketId);
      
      if (error) {
        console.error('Error updating ticket:', error);
        return;
      }
      
      setTickets(prev => 
        prev.map(ticket => 
          ticket.id === ticketId ? { ...ticket, ...updates } : ticket
        )
      );
      
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (err) {
      console.error('Error in updateTicketStatus:', err);
    }
  };

  const assignTicket = async (ticketId: string, adminId: string | null) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ assigned_admin_id: adminId })
        .eq('id', ticketId);
      
      if (error) {
        console.error('Error assigning ticket:', error);
        return;
      }
      
      setTickets(prev => 
        prev.map(ticket => 
          ticket.id === ticketId ? { ...ticket, assigned_admin_id: adminId } : ticket
        )
      );
    } catch (err) {
      console.error('Error in assignTicket:', err);
    }
  };

  const addMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return;
    
    try {
      const { error } = await supabase
        .from('support_ticket_messages')
        .insert({
          ticket_id: selectedTicket.id,
          user_id: user?.id,
          message: newMessage.trim(),
          is_internal: isInternal
        });
      
      if (error) {
        console.error('Error adding message:', error);
        return;
      }
      
      setNewMessage('');
      setIsInternal(false);
      fetchTicketMessages(selectedTicket.id);
      
      // Update ticket status if it was resolved
      if (selectedTicket.status === 'resolved') {
        updateTicketStatus(selectedTicket.id, 'in_progress');
      }
    } catch (err) {
      console.error('Error in addMessage:', err);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.user?.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    const matchesCategory = filterCategory === 'all' || ticket.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-600 bg-blue-100';
      case 'in_progress': return 'text-yellow-600 bg-yellow-100';
      case 'waiting_user': return 'text-purple-600 bg-purple-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'closed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <ArrowUp className="h-4 w-4 text-red-600" />;
      case 'high': return <ArrowUp className="h-4 w-4 text-orange-600" />;
      case 'medium': return <Minus className="h-4 w-4 text-yellow-600" />;
      case 'low': return <ArrowDown className="h-4 w-4 text-green-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_user">Waiting User</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="general">General</option>
            <option value="technical">Technical</option>
            <option value="billing">Billing</option>
            <option value="feature_request">Feature Request</option>
            <option value="bug_report">Bug Report</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Support Tickets ({filteredTickets.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => {
                setSelectedTicket(ticket);
                fetchTicketMessages(ticket.id);
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-medium text-gray-900">{ticket.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)} flex items-center`}>
                      {getPriorityIcon(ticket.priority)}
                      <span className="ml-1 capitalize">{ticket.priority}</span>
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {ticket.user?.full_name || ticket.user?.email}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {ticket.message_count} messages
                    </div>
                    <div className="flex items-center">
                      <Tag className="h-4 w-4 mr-1" />
                      {ticket.category.replace('_', ' ')}
                    </div>
                  </div>
                  
                  {ticket.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {ticket.tags.map((tag, index) => (
                        <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="ml-4 flex flex-col items-end space-y-2">
                  {ticket.assigned_admin_id ? (
                    <div className="text-sm text-gray-600">
                      Assigned to: {ticket.assigned_admin?.full_name || ticket.assigned_admin?.email}
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        assignTicket(ticket.id, user?.id || null);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Assign to me
                    </button>
                  )}
                  
                  <select
                    value={ticket.status}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateTicketStatus(ticket.id, e.target.value);
                    }}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="waiting_user">Waiting User</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredTickets.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedTicket.title}</h3>
                  <div className="flex items-center space-x-3 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                      {selectedTicket.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedTicket.priority)} flex items-center`}>
                      {getPriorityIcon(selectedTicket.priority)}
                      <span className="ml-1 capitalize">{selectedTicket.priority}</span>
                    </span>
                    <span className="text-sm text-gray-500">
                      {selectedTicket.category.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* Original ticket */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {(selectedTicket.user?.full_name || selectedTicket.user?.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">
                        {selectedTicket.user?.full_name || selectedTicket.user?.email}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(selectedTicket.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{selectedTicket.description}</p>
                </div>

                {/* Messages */}
                {ticketMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-lg p-4 ${
                      message.is_internal 
                        ? 'bg-yellow-50 border border-yellow-200' 
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                          message.user?.role === 'admin' ? 'bg-purple-600' : 'bg-blue-600'
                        }`}>
                          {(message.user?.full_name || message.user?.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">
                          {message.user?.full_name || message.user?.email}
                        </span>
                        {message.user?.role === 'admin' && (
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                            Admin
                          </span>
                        )}
                        {message.is_internal && (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                            Internal
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(message.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{message.message}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Reply Form */}
            <div className="p-6 border-t border-gray-200">
              <div className="space-y-4">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="Type your reply..."
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">Internal note (not visible to user)</span>
                  </label>
                  <button
                    onClick={addMessage}
                    disabled={!newMessage.trim()}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    Send Reply
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SupportTickets;