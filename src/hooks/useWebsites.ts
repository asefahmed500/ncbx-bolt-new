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
        setError(fetchError.message);
        return;
      }

      setWebsites(data || []);
    } catch (err) {
      console.error('Error in fetchWebsites:', err);
      setError('Failed to fetch websites');
    } finally {
      setLoading(false);
    }
  };

  const createWebsite = async (websiteData: {
    name: string;
    description?: string;
    template: string;
    thumbnail?: string;
  }) => {
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
          status: 'draft'
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating website:', insertError);
        throw new Error(insertError.message);
      }

      // Add to local state
      setWebsites(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error in createWebsite:', err);
      throw err;
    }
  };

  const updateWebsite = async (id: string, updates: Partial<Website>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('websites')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user?.id) // Ensure user owns the website
        .select()
        .single();

      if (updateError) {
        console.error('Error updating website:', updateError);
        throw new Error(updateError.message);
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
      throw err;
    }
  };

  const deleteWebsite = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('websites')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id); // Ensure user owns the website

      if (deleteError) {
        console.error('Error deleting website:', deleteError);
        throw new Error(deleteError.message);
      }

      // Remove from local state
      setWebsites(prev => prev.filter(website => website.id !== id));
    } catch (err) {
      console.error('Error in deleteWebsite:', err);
      throw err;
    }
  };

  const duplicateWebsite = async (id: string) => {
    const originalWebsite = websites.find(w => w.id === id);
    if (!originalWebsite) {
      throw new Error('Website not found');
    }

    return createWebsite({
      name: `${originalWebsite.name} (Copy)`,
      description: originalWebsite.description || undefined,
      template: originalWebsite.template,
      thumbnail: originalWebsite.thumbnail || undefined
    });
  };

  // Fetch websites when user changes
  useEffect(() => {
    fetchWebsites();
  }, [user]);

  return {
    websites,
    loading,
    error,
    fetchWebsites,
    createWebsite,
    updateWebsite,
    deleteWebsite,
    duplicateWebsite
  };
};