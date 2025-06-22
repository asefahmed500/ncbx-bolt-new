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
      throw new Error('User not authenticated. Please sign in to create a website.');
    }

    // Validate input data
    if (!websiteData.name || !websiteData.name.trim()) {
      throw new Error('Website name is required');
    }

    if (websiteData.name.trim().length < 3) {
      throw new Error('Website name must be at least 3 characters long');
    }

    if (websiteData.name.trim().length > 50) {
      throw new Error('Website name must be less than 50 characters');
    }

    if (!websiteData.template || !websiteData.template.trim()) {
      throw new Error('Template is required');
    }

    if (websiteData.description && websiteData.description.length > 200) {
      throw new Error('Description must be less than 200 characters');
    }

    try {
      const insertData = {
        user_id: user.id,
        name: websiteData.name.trim(),
        description: websiteData.description?.trim() || null,
        template: websiteData.template.trim(),
        thumbnail: websiteData.thumbnail || null,
        status: 'draft' as const,
        domain: null
      };

      console.log('Creating website with data:', insertData);

      const { data, error: insertError } = await supabase
        .from('websites')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating website:', insertError);
        
        // Provide user-friendly error messages
        if (insertError.code === '23505') {
          throw new Error('A website with this name already exists. Please choose a different name.');
        } else if (insertError.code === '23503') {
          throw new Error('Invalid user account. Please sign out and sign in again.');
        } else if (insertError.message.includes('row-level security')) {
          throw new Error('Permission denied. Please check your account permissions.');
        } else {
          throw new Error(`Failed to create website: ${insertError.message}`);
        }
      }

      if (!data) {
        throw new Error('Website was created but no data was returned');
      }

      console.log('Website created successfully:', data);

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

    if (!id || !id.trim()) {
      throw new Error('Website ID is required');
    }

    // Validate updates
    if (updates.name !== undefined) {
      if (!updates.name || !updates.name.trim()) {
        throw new Error('Website name cannot be empty');
      }
      if (updates.name.trim().length < 3) {
        throw new Error('Website name must be at least 3 characters long');
      }
      if (updates.name.trim().length > 50) {
        throw new Error('Website name must be less than 50 characters');
      }
    }

    if (updates.description !== undefined && updates.description && updates.description.length > 200) {
      throw new Error('Description must be less than 200 characters');
    }

    if (updates.domain !== undefined && updates.domain) {
      // Basic domain validation
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
      if (!domainRegex.test(updates.domain.trim())) {
        throw new Error('Please enter a valid domain name (e.g., example.com)');
      }
    }

    try {
      // Clean up the updates object
      const cleanUpdates: any = {};
      if (updates.name !== undefined) cleanUpdates.name = updates.name.trim();
      if (updates.description !== undefined) cleanUpdates.description = updates.description?.trim() || null;
      if (updates.domain !== undefined) cleanUpdates.domain = updates.domain?.trim() || null;
      if (updates.status !== undefined) cleanUpdates.status = updates.status;
      if (updates.template !== undefined) cleanUpdates.template = updates.template.trim();
      if (updates.thumbnail !== undefined) cleanUpdates.thumbnail = updates.thumbnail || null;

      console.log('Updating website:', id, 'with data:', cleanUpdates);

      const { data, error: updateError } = await supabase
        .from('websites')
        .update(cleanUpdates)
        .eq('id', id)
        .eq('user_id', user.id) // Ensure user owns the website
        .select()
        .single();

      if (updateError) {
        console.error('Error updating website:', updateError);
        
        if (updateError.code === 'PGRST116') {
          throw new Error('Website not found or you do not have permission to update it');
        } else if (updateError.code === '23505') {
          if (updateError.message.includes('domain')) {
            throw new Error('This domain is already taken. Please choose a different domain.');
          } else {
            throw new Error('A website with this name already exists. Please choose a different name.');
          }
        } else {
          throw new Error(`Failed to update website: ${updateError.message}`);
        }
      }

      if (!data) {
        throw new Error('Website was updated but no data was returned');
      }

      console.log('Website updated successfully:', data);

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

    if (!id || !id.trim()) {
      throw new Error('Website ID is required');
    }

    try {
      console.log('Deleting website:', id);

      const { error: deleteError } = await supabase
        .from('websites')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Ensure user owns the website

      if (deleteError) {
        console.error('Error deleting website:', deleteError);
        
        if (deleteError.code === 'PGRST116') {
          throw new Error('Website not found or you do not have permission to delete it');
        } else {
          throw new Error(`Failed to delete website: ${deleteError.message}`);
        }
      }

      console.log('Website deleted successfully');

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
      console.log('Duplicating website:', id);

      // Generate unique name for duplicate
      let duplicateName = `${originalWebsite.name} (Copy)`;
      let counter = 1;
      
      // Check if name already exists and increment counter
      while (websites.some(w => w.name === duplicateName)) {
        counter++;
        duplicateName = `${originalWebsite.name} (Copy ${counter})`;
      }

      const duplicateData: CreateWebsiteData = {
        name: duplicateName,
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

  const publishWebsite = async (id: string): Promise<Website> => {
    console.log('Publishing website:', id);
    return updateWebsite(id, { status: 'published' });
  };

  const unpublishWebsite = async (id: string): Promise<Website> => {
    console.log('Unpublishing website:', id);
    return updateWebsite(id, { status: 'draft' });
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
      website.template.toLowerCase().includes(lowercaseQuery) ||
      (website.domain && website.domain.toLowerCase().includes(lowercaseQuery))
    );
  };

  // Fetch websites when user changes
  useEffect(() => {
    fetchWebsites();
  }, [user]);

  // Set up real-time subscription for websites
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscription for user:', user.id);

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
              setWebsites(prev => {
                // Check if website already exists to avoid duplicates
                const exists = prev.some(w => w.id === payload.new.id);
                if (exists) return prev;
                return [payload.new as Website, ...prev];
              });
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
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Unsubscribing from real-time updates');
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
    publishWebsite,
    unpublishWebsite,
    getWebsiteById,
    getWebsitesByStatus,
    searchWebsites
  };
};