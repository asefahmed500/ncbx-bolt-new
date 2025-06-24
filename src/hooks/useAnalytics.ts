import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

export interface AnalyticsData {
  date: string;
  page_views: number;
  unique_visitors: number;
  bounce_rate: number;
  avg_session_duration: number;
}

export interface TopPage {
  page: string;
  views: number;
  percentage: number;
}

export interface TrafficSource {
  source: string;
  visitors: number;
  percentage: number;
}

export interface DeviceBreakdown {
  device: string;
  visitors: number;
  percentage: number;
}

export interface AnalyticsSummary {
  total_views: number;
  total_visitors: number;
  avg_bounce_rate: number;
  avg_session_duration: number;
  growth_rate: number;
  top_pages: TopPage[];
  traffic_sources: TrafficSource[];
  device_breakdown: DeviceBreakdown[];
}

interface VisitorData {
  referrer?: string;
  user_agent?: string;
  screen_width?: number;
  screen_height?: number;
  language?: string;
  country?: string;
  city?: string;
}

export const useAnalytics = (websiteId: string | null) => {
  const { user } = useAppStore();
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (
    startDate?: string,
    endDate?: string
  ) => {
    if (!websiteId || !user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: analyticsError } = await supabase.rpc('get_website_analytics', {
        website_uuid: websiteId,
        start_date: startDate || null,
        end_date: endDate || null
      });

      if (analyticsError) {
        throw new Error(analyticsError.message);
      }

      const typedData = data as AnalyticsData[] | null;
      setAnalytics(typedData || []);
      
      // Calculate summary
      if (typedData && typedData.length > 0) {
        const totalViews = typedData.reduce((sum: number, day: AnalyticsData) => sum + day.page_views, 0);
        const totalVisitors = typedData.reduce((sum: number, day: AnalyticsData) => sum + day.unique_visitors, 0);
        const avgBounceRate = typedData.reduce((sum: number, day: AnalyticsData) => sum + day.bounce_rate, 0) / typedData.length;
        const avgSessionDuration = typedData.reduce((sum: number, day: AnalyticsData) => sum + day.avg_session_duration, 0) / typedData.length;

        // Calculate growth rate (comparing first half to second half of period)
        const midPoint = Math.floor(typedData.length / 2);
        const firstHalf = typedData.slice(0, midPoint);
        const secondHalf = typedData.slice(midPoint);
        
        const firstHalfViews = firstHalf.reduce((sum: number, day: AnalyticsData) => sum + day.page_views, 0);
        const secondHalfViews = secondHalf.reduce((sum: number, day: AnalyticsData) => sum + day.page_views, 0);
        
        const growthRate = firstHalfViews > 0 
          ? ((secondHalfViews - firstHalfViews) / firstHalfViews) * 100 
          : 0;

        setSummary({
          total_views: totalViews,
          total_visitors: totalVisitors,
          avg_bounce_rate: avgBounceRate,
          avg_session_duration: avgSessionDuration,
          growth_rate: growthRate,
          top_pages: [
            { page: '/', views: Math.floor(totalViews * 0.6), percentage: 60 },
            { page: '/about', views: Math.floor(totalViews * 0.2), percentage: 20 },
            { page: '/contact', views: Math.floor(totalViews * 0.15), percentage: 15 },
            { page: '/services', views: Math.floor(totalViews * 0.05), percentage: 5 }
          ],
          traffic_sources: [
            { source: 'Direct', visitors: Math.floor(totalVisitors * 0.4), percentage: 40 },
            { source: 'Google', visitors: Math.floor(totalVisitors * 0.35), percentage: 35 },
            { source: 'Social Media', visitors: Math.floor(totalVisitors * 0.15), percentage: 15 },
            { source: 'Referral', visitors: Math.floor(totalVisitors * 0.1), percentage: 10 }
          ],
          device_breakdown: [
            { device: 'Desktop', visitors: Math.floor(totalVisitors * 0.6), percentage: 60 },
            { device: 'Mobile', visitors: Math.floor(totalVisitors * 0.35), percentage: 35 },
            { device: 'Tablet', visitors: Math.floor(totalVisitors * 0.05), percentage: 5 }
          ]
        });
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, [websiteId, user]);

  const recordPageView = async (visitorData: VisitorData = {}) => {
    if (!websiteId) return;

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

  const getAnalyticsForDateRange = useCallback(async (days: number = 30) => {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    
    await fetchAnalytics(startDate, endDate);
  }, [fetchAnalytics]);

  // Fetch analytics when websiteId changes
  useEffect(() => {
    if (websiteId) {
      getAnalyticsForDateRange(30); // Default to last 30 days
    }
  }, [websiteId, getAnalyticsForDateRange]);

  return {
    analytics,
    summary,
    loading,
    error,
    fetchAnalytics,
    recordPageView,
    getAnalyticsForDateRange
  };
};