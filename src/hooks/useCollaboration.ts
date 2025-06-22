import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

export interface UserSession {
  id: string;
  user_id: string;
  website_id: string;
  cursor_position: any;
  selected_element: string | null;
  is_active: boolean;
  last_ping: string;
  user?: {
    full_name: string;
    email: string;
    avatar_url: string;
  };
}

export interface WebsiteComment {
  id: string;
  website_id: string;
  user_id: string;
  element_id: string | null;
  content: string;
  position: any;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    full_name: string;
    email: string;
    avatar_url: string;
  };
  replies?: WebsiteComment[];
}

export const useCollaboration = (websiteId: string | null) => {
  const { user } = useAppStore();
  const [activeSessions, setActiveSessions] = useState<UserSession[]>([]);
  const [comments, setComments] = useState<WebsiteComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create or update user session
  const createSession = useCallback(async () => {
    if (!user || !websiteId) return;

    try {
      const sessionToken = `${user.id}-${websiteId}-${Date.now()}`;
      
      const { error } = await supabase
        .from('user_sessions')
        .upsert({
          user_id: user.id,
          website_id: websiteId,
          session_token: sessionToken,
          is_active: true,
          last_ping: new Date().toISOString()
        });

      if (error) {
        console.error('Error creating session:', error);
      }
    } catch (err) {
      console.error('Error in createSession:', err);
    }
  }, [user, websiteId]);

  // Update cursor position
  const updateCursorPosition = useCallback(async (position: any) => {
    if (!user || !websiteId) return;

    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({
          cursor_position: position,
          last_ping: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('website_id', websiteId);

      if (error) {
        console.error('Error updating cursor position:', error);
      }
    } catch (err) {
      console.error('Error in updateCursorPosition:', err);
    }
  }, [user, websiteId]);

  // Update selected element
  const updateSelectedElement = useCallback(async (elementId: string | null) => {
    if (!user || !websiteId) return;

    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({
          selected_element: elementId,
          last_ping: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('website_id', websiteId);

      if (error) {
        console.error('Error updating selected element:', error);
      }
    } catch (err) {
      console.error('Error in updateSelectedElement:', err);
    }
  }, [user, websiteId]);

  // Ping to keep session alive
  const pingSession = useCallback(async () => {
    if (!user || !websiteId) return;

    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({
          last_ping: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('website_id', websiteId);

      if (error) {
        console.error('Error pinging session:', error);
      }
    } catch (err) {
      console.error('Error in pingSession:', err);
    }
  }, [user, websiteId]);

  // End session
  const endSession = useCallback(async () => {
    if (!user || !websiteId) return;

    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({
          is_active: false
        })
        .eq('user_id', user.id)
        .eq('website_id', websiteId);

      if (error) {
        console.error('Error ending session:', error);
      }
    } catch (err) {
      console.error('Error in endSession:', err);
    }
  }, [user, websiteId]);

  // Fetch active sessions
  const fetchActiveSessions = useCallback(async () => {
    if (!websiteId) return;

    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select(`
          *,
          profiles!user_sessions_user_id_fkey(full_name, email, avatar_url)
        `)
        .eq('website_id', websiteId)
        .eq('is_active', true)
        .gte('last_ping', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Active in last 5 minutes

      if (error) {
        console.error('Error fetching active sessions:', error);
        return;
      }

      const sessions = data?.map(session => ({
        ...session,
        user: session.profiles
      })) || [];

      setActiveSessions(sessions);
    } catch (err) {
      console.error('Error in fetchActiveSessions:', err);
    }
  }, [websiteId]);

  // Add comment
  const addComment = useCallback(async (
    elementId: string | null,
    content: string,
    position: any = {},
    parentId: string | null = null
  ): Promise<WebsiteComment | null> => {
    if (!user || !websiteId) return null;

    try {
      const { data, error } = await supabase
        .from('website_comments')
        .insert({
          website_id: websiteId,
          user_id: user.id,
          element_id: elementId,
          content,
          position,
          parent_id: parentId
        })
        .select(`
          *,
          profiles!website_comments_user_id_fkey(full_name, email, avatar_url)
        `)
        .single();

      if (error) {
        console.error('Error adding comment:', error);
        return null;
      }

      const newComment = {
        ...data,
        user: data.profiles
      };

      setComments(prev => [newComment, ...prev]);
      return newComment;
    } catch (err) {
      console.error('Error in addComment:', err);
      return null;
    }
  }, [user, websiteId]);

  // Resolve comment
  const resolveComment = useCallback(async (commentId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('website_comments')
        .update({
          is_resolved: true,
          resolved_by: user.id,
          resolved_at: new Date().toISOString()
        })
        .eq('id', commentId);

      if (error) {
        console.error('Error resolving comment:', error);
        return false;
      }

      setComments(prev => 
        prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, is_resolved: true, resolved_by: user.id, resolved_at: new Date().toISOString() }
            : comment
        )
      );

      return true;
    } catch (err) {
      console.error('Error in resolveComment:', err);
      return false;
    }
  }, [user]);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    if (!websiteId) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('website_comments')
        .select(`
          *,
          profiles!website_comments_user_id_fkey(full_name, email, avatar_url)
        `)
        .eq('website_id', websiteId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comments:', error);
        setError(error.message);
        return;
      }

      // Organize comments with replies
      const commentsMap = new Map();
      const rootComments: WebsiteComment[] = [];

      data?.forEach(comment => {
        const commentWithUser = {
          ...comment,
          user: comment.profiles,
          replies: []
        };
        
        commentsMap.set(comment.id, commentWithUser);
        
        if (!comment.parent_id) {
          rootComments.push(commentWithUser);
        }
      });

      // Add replies to parent comments
      data?.forEach(comment => {
        if (comment.parent_id) {
          const parent = commentsMap.get(comment.parent_id);
          const child = commentsMap.get(comment.id);
          if (parent && child) {
            parent.replies.push(child);
          }
        }
      });

      setComments(rootComments);
    } catch (err) {
      console.error('Error in fetchComments:', err);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [websiteId]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!websiteId) return;

    // Subscribe to session changes
    const sessionsSubscription = supabase
      .channel(`sessions_${websiteId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_sessions',
          filter: `website_id=eq.${websiteId}`
        },
        () => {
          fetchActiveSessions();
        }
      )
      .subscribe();

    // Subscribe to comment changes
    const commentsSubscription = supabase
      .channel(`comments_${websiteId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'website_comments',
          filter: `website_id=eq.${websiteId}`
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      sessionsSubscription.unsubscribe();
      commentsSubscription.unsubscribe();
    };
  }, [websiteId, fetchActiveSessions, fetchComments]);

  // Initialize session and fetch data
  useEffect(() => {
    if (websiteId && user) {
      createSession();
      fetchActiveSessions();
      fetchComments();

      // Set up ping interval
      const pingInterval = setInterval(pingSession, 30000); // Ping every 30 seconds

      return () => {
        clearInterval(pingInterval);
        endSession();
      };
    }
  }, [websiteId, user, createSession, fetchActiveSessions, fetchComments, pingSession, endSession]);

  return {
    activeSessions,
    comments,
    loading,
    error,
    updateCursorPosition,
    updateSelectedElement,
    addComment,
    resolveComment,
    fetchComments,
    fetchActiveSessions
  };
};