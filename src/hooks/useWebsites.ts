import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

export interface Website {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  domain: string | null;
  status: 'draft' | 'published';
  template: string;
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateWebsiteData {
  name: string;
  description?: string;
  template: string;
  thumbnail?: string;
}

export interface UpdateWebsiteData {
  name?: string;
  description?: string;
  domain?: string;
  status?: 'draft' | 'published';
  template?: string;
  thumbnail?: string;
}

export const useWebsites = () => {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAppStore();

  const fetchWebsites = async () => {
    if (!user) {
      setWebsites([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('websites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching websites:', fetchError);
        setError(`Failed to load websites: ${fetchError.message}`);
        return;
      }

      setWebsites(data || []);
    } catch (err) {
      console.error('Error in fetchWebsites:', err);
      setError('An unexpected error occurred while loading websites');
    } finally {
      setLoading(false);
    }
  };

  const createWebsite = async (websiteData: CreateWebsiteData): Promise<Website> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error: insertError } = await supabase
        .from('websites')
        .insert({
          user_id: user.id,
          name: websiteData.name,
          description: websiteData.description || null,
          template: websiteData.template,
          thumbnail: websiteData.thumbnail || null,
          status: 'draft' as const
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating website:', insertError);
        throw new Error(`Failed to create website: ${insertError.message}`);
      }

      // Add to local state
      setWebsites(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error in createWebsite:', err);
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('An unexpected error occurred while creating the website');
    }
  };

  const updateWebsite = async (id: string, updates: UpdateWebsiteData): Promise<Website> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error: updateError } = await supabase
        .from('websites')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id) // Ensure user owns the website
        .select()
        .single();

      if (updateError) {
        console.error('Error updating website:', updateError);
        throw new Error(`Failed to update website: ${updateError.message}`);
      }

      // Update local state
      setWebsites(prev => 
        prev.map(website => 
          website.id === id ? { ...website, ...data } : website
        )
      );

      return data;
    } catch (err) {
      console.error('Error in updateWebsite:', err);
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('An unexpected error occurred while updating the website');
    }
  };

  const deleteWebsite = async (id: string): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { error: deleteError } = await supabase
        .from('websites')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Ensure user owns the website

      if (deleteError) {
        console.error('Error deleting website:', deleteError);
        throw new Error(`Failed to delete website: ${deleteError.message}`);
      }

      // Remove from local state
      setWebsites(prev => prev.filter(website => website.id !== id));
    } catch (err) {
      console.error('Error in deleteWebsite:', err);
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('An unexpected error occurred while deleting the website');
    }
  };

  const duplicateWebsite = async (id: string): Promise<Website> => {
    const originalWebsite = websites.find(w => w.id === id);
    if (!originalWebsite) {
      throw new Error('Website not found');
    }

    try {
      const duplicateData: CreateWebsiteData = {
        name: `${originalWebsite.name} (Copy)`,
        description: originalWebsite.description || undefined,
        template: originalWebsite.template,
        thumbnail: originalWebsite.thumbnail || undefined
      };

      return await createWebsite(duplicateData);
    } catch (err) {
      console.error('Error in duplicateWebsite:', err);
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('An unexpected error occurred while duplicating the website');
    }
  };

  const getWebsiteById = (id: string): Website | undefined => {
    return websites.find(website => website.id === id);
  };

  const getWebsitesByStatus = (status: 'draft' | 'published'): Website[] => {
    return websites.filter(website => website.status === status);
  };

  const searchWebsites = (query: string): Website[] => {
    const lowercaseQuery = query.toLowerCase();
    return websites.filter(website => 
      website.name.toLowerCase().includes(lowercaseQuery) ||
      (website.description && website.description.toLowerCase().includes(lowercaseQuery)) ||
      website.template.toLowerCase().includes(lowercaseQuery)
    );
  };

  // Fetch websites when user changes
  useEffect(() => {
    fetchWebsites();
  }, [user]);

  // Set up real-time subscription for websites
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('websites_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'websites',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time website change:', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              setWebsites(prev => [payload.new as Website, ...prev]);
              break;
            case 'UPDATE':
              setWebsites(prev => 
                prev.map(website => 
                  website.id === payload.new.id ? payload.new as Website : website
                )
              );
              break;
            case 'DELETE':
              setWebsites(prev => 
                prev.filter(website => website.id !== payload.old.id)
              );
              break;
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return {
    websites,
    loading,
    error,
    fetchWebsites,
    createWebsite,
    updateWebsite,
    deleteWebsite,
    duplicateWebsite,
    getWebsiteById,
    getWebsitesByStatus,
    searchWebsites
  };
};