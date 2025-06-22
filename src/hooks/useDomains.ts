import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { getEntriLinks } from '../lib/entri';

export interface DomainResult {
  success: boolean;
  error?: string;
  message?: string;
  data?: any;
}

export const useDomains = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAppStore();

  const connectCustomDomain = async (websiteId: string, domain: string): Promise<DomainResult> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      setLoading(true);
      setError(null);

      // Validate domain format
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
      if (!domainRegex.test(domain)) {
        return { 
          success: false, 
          error: 'Please enter a valid domain name (e.g., example.com)' 
        };
      }

      // Check if domain is already in use
      const { data: existingDomain, error: checkError } = await supabase
        .from('websites')
        .select('id')
        .eq('domain', domain)
        .not('id', 'eq', websiteId)
        .maybeSingle();

      if (checkError) {
        throw new Error(`Failed to check domain availability: ${checkError.message}`);
      }

      if (existingDomain) {
        return { 
          success: false, 
          error: 'This domain is already in use by another website' 
        };
      }

      // Get domain connection instructions
      const links = await getEntriLinks({ id: domain });

      // Update website with domain
      const { data, error: updateError } = await supabase
        .from('websites')
        .update({ domain })
        .eq('id', websiteId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update domain: ${updateError.message}`);
      }

      return { 
        success: true, 
        message: 'Domain connected successfully!',
        data: { 
          website: data,
          domainInstructions: links
        }
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect domain';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const disconnectDomain = async (websiteId: string): Promise<DomainResult> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: updateError } = await supabase
        .from('websites')
        .update({ domain: null })
        .eq('id', websiteId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to disconnect domain: ${updateError.message}`);
      }

      return { 
        success: true, 
        message: 'Domain disconnected successfully!',
        data: { website: data }
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect domain';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const getDomainStatus = async (domain: string): Promise<DomainResult> => {
    try {
      setLoading(true);
      setError(null);

      // In a real implementation, this would check DNS records and SSL status
      // For demo purposes, we'll simulate a successful check
      const status = {
        dns: {
          configured: true,
          records: [
            { type: 'A', name: domain, value: '76.76.21.21', status: 'valid' },
            { type: 'CNAME', name: `www.${domain}`, value: 'cname.ncbx.app', status: 'valid' }
          ]
        },
        ssl: {
          configured: true,
          issuer: 'Let\'s Encrypt',
          validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        }
      };

      return { 
        success: true, 
        data: { status }
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check domain status';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    connectCustomDomain,
    disconnectDomain,
    getDomainStatus
  };
};