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

export interface WebsiteVersion {
  id: string;
  website_id: string;
  version_number: number;
  content: any;
  changes_summary: string;
  created_by: string;
  created_at: string;
  is_published: boolean;
  published_at: string | null;
}

export interface WebsiteCollaborator {
  id: string;
  website_id: string;
  user_id: string;
  role: string;
  permissions: any;
  invited_by: string;
  invited_at: string;
  accepted_at: string | null;
  last_active: string;
}

export interface WebsiteAnalytics {
  date: string;
  page_views: number;
  unique_visitors: number;
  bounce_rate: number;
  avg_session_duration: number;
}

export interface CreateWebsiteData {
  name: string;
  description?: string;
  template: string;
  thumbnail?: string;
  initialContent?: any;
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

      // Fetch websites where user is a collaborator
      const { data: collaborations, error: collabError } = await supabase
        .from('website_collaborators')
        .select(`
          website_id,
          role,
          permissions,
          websites!inner(*)
        `)
        .eq('user_id', user.id);

      if (collabError) {
        console.error('Error fetching websites:', collabError);
        setError(`Failed to load websites: ${collabError.message}`);
        return;
      }

      // Extract websites from collaborations
      const websiteData = collaborations?.map(collab => collab.websites).flat() || [];
      setWebsites(websiteData);
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
      console.log('Creating website with data:', websiteData);

      // Use the new create_website_with_version function
      const { data, error: createError } = await supabase.rpc('create_website_with_version', {
        website_name: websiteData.name.trim(),
        website_description: websiteData.description?.trim() || null,
        website_template: websiteData.template.trim(),
        initial_content: websiteData.initialContent || {}
      });

      if (createError) {
        console.error('Error creating website:', createError);
        throw new Error(`Failed to create website: ${createError.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error('Website was created but no data was returned');
      }

      const websiteId = data[0].website_id;

      // Fetch the created website
      const { data: newWebsite, error: fetchError } = await supabase
        .from('websites')
        .select('*')
        .eq('id', websiteId)
        .single();

      if (fetchError || !newWebsite) {
        throw new Error('Website created but failed to fetch details');
      }

      console.log('Website created successfully:', newWebsite);

      // Add to local state
      setWebsites(prev => [newWebsite, ...prev]);
      return newWebsite;
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
        .eq('id', id);

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

  const publishWebsite = async (id: string, customDomain?: string): Promise<Website> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('Publishing website:', id);

      // Use the publish_website function
      const { data, error: publishError } = await supabase.rpc('publish_website', {
        website_uuid: id,
        custom_domain_name: customDomain || null
      });

      if (publishError) {
        console.error('Error publishing website:', publishError);
        throw new Error(`Failed to publish website: ${publishError.message}`);
      }

      // Fetch updated website
      const { data: updatedWebsite, error: fetchError } = await supabase
        .from('websites')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !updatedWebsite) {
        throw new Error('Website published but failed to fetch updated details');
      }

      // Update local state
      setWebsites(prev => 
        prev.map(website => 
          website.id === id ? updatedWebsite : website
        )
      );

      return updatedWebsite;
    } catch (err) {
      console.error('Error in publishWebsite:', err);
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('An unexpected error occurred while publishing the website');
    }
  };

  const unpublishWebsite = async (id: string): Promise<Website> => {
    console.log('Unpublishing website:', id);
    return updateWebsite(id, { status: 'draft' });
  };

  const saveWebsiteVersion = async (websiteId: string, content: any, changesSummary?: string): Promise<string> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await supabase.rpc('save_website_version', {
        website_uuid: websiteId,
        content_data: content,
        changes_description: changesSummary || 'Auto-save'
      });

      if (error) {
        throw new Error(`Failed to save version: ${error.message}`);
      }

      return data; // Returns version ID
    } catch (err) {
      console.error('Error saving website version:', err);
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('An unexpected error occurred while saving the website version');
    }
  };

  const getWebsiteVersions = async (websiteId: string): Promise<WebsiteVersion[]> => {
    try {
      const { data, error } = await supabase
        .from('website_versions')
        .select('*')
        .eq('website_id', websiteId)
        .order('version_number', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch versions: ${error.message}`);
      }

      return data || [];
    } catch (err) {
      console.error('Error fetching website versions:', err);
      return [];
    }
  };

  const getWebsiteCollaborators = async (websiteId: string): Promise<WebsiteCollaborator[]> => {
    try {
      const { data, error } = await supabase
        .from('website_collaborators')
        .select(`
          *,
          profiles!website_collaborators_user_id_fkey(email, full_name, avatar_url)
        `)
        .eq('website_id', websiteId);

      if (error) {
        throw new Error(`Failed to fetch collaborators: ${error.message}`);
      }

      return data || [];
    } catch (err) {
      console.error('Error fetching website collaborators:', err);
      return [];
    }
  };

  const inviteCollaborator = async (
    websiteId: string, 
    email: string, 
    role: string = 'editor',
    permissions: any = { edit: true, publish: false, delete: false }
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('invite_collaborator', {
        website_uuid: websiteId,
        collaborator_email: email,
        collaborator_role: role,
        collaborator_permissions: permissions
      });

      if (error) {
        throw new Error(`Failed to invite collaborator: ${error.message}`);
      }

      return data;
    } catch (err) {
      console.error('Error inviting collaborator:', err);
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('An unexpected error occurred while inviting the collaborator');
    }
  };

  const getWebsiteAnalytics = async (
    websiteId: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<WebsiteAnalytics[]> => {
    try {
      const { data, error } = await supabase.rpc('get_website_analytics', {
        website_uuid: websiteId,
        start_date: startDate || null,
        end_date: endDate || null
      });

      if (error) {
        throw new Error(`Failed to fetch analytics: ${error.message}`);
      }

      return data || [];
    } catch (err) {
      console.error('Error fetching website analytics:', err);
      return [];
    }
  };

  const recordPageView = async (websiteId: string, visitorData: any = {}): Promise<void> => {
    try {
      const { error } = await supabase.rpc('record_page_view', {
        website_uuid: websiteId,
        visitor_data: visitorData
      });

      if (error) {
        console.error('Error recording page view:', error);
      }
    } catch (err) {
      console.error('Error in recordPageView:', err);
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
          table: 'websites'
        },
        (payload) => {
          console.log('Real-time website change:', payload);
          
          // Refresh websites when changes occur
          fetchWebsites();
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
    saveWebsiteVersion,
    getWebsiteVersions,
    getWebsiteCollaborators,
    inviteCollaborator,
    getWebsiteAnalytics,
    recordPageView,
    getWebsiteById,
    getWebsitesByStatus,
    searchWebsites
  };
};