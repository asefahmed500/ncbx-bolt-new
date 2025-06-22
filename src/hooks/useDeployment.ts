import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

export interface DeploymentResult {
  success: boolean;
  error?: string;
  message?: string;
  data?: any;
}

export interface DeploymentStatus {
  id: string;
  website_id: string;
  version_id: string;
  deployment_url: string | null;
  custom_domain: string | null;
  status: string;
  deployed_by: string;
  deployed_at: string;
}

export const useDeployment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAppStore();

  const deployWebsite = async (websiteId: string): Promise<DeploymentResult> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: functionError } = await supabase.functions.invoke('deploy-website', {
        body: {
          websiteId,
          userId: user.id
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      return { 
        success: true, 
        message: data.message,
        data: { deploymentId: data.deploymentId }
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to deploy website';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const getDeploymentStatus = async (deploymentId: string): Promise<DeploymentStatus | null> => {
    try {
      const { data, error } = await supabase
        .from('website_deployments')
        .select('*')
        .eq('id', deploymentId)
        .single();

      if (error) {
        console.error('Error fetching deployment status:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error in getDeploymentStatus:', err);
      return null;
    }
  };

  const getLatestDeployment = async (websiteId: string): Promise<DeploymentStatus | null> => {
    try {
      const { data, error } = await supabase
        .from('website_deployments')
        .select('*')
        .eq('website_id', websiteId)
        .order('deployed_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching latest deployment:', error);
        return null;
      }

      return data || null;
    } catch (err) {
      console.error('Error in getLatestDeployment:', err);
      return null;
    }
  };

  return {
    loading,
    error,
    deployWebsite,
    getDeploymentStatus,
    getLatestDeployment
  };
};