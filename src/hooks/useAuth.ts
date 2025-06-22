import { useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null
  });

  const { setUser, setCurrentView } = useAppStore();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setAuthState(prev => ({ ...prev, error: error.message, loading: false }));
          return;
        }

        if (session?.user) {
          await handleUserSession(session.user);
        }

        setAuthState(prev => ({
          ...prev,
          user: session?.user || null,
          session,
          loading: false
        }));
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        setAuthState(prev => ({ 
          ...prev, 
          error: 'Failed to initialize authentication', 
          loading: false 
        }));
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (session?.user) {
          await handleUserSession(session.user);
        } else {
          setUser(null);
        }

        setAuthState(prev => ({
          ...prev,
          user: session?.user || null,
          session,
          loading: false,
          error: null
        }));

        // Handle redirect after OAuth
        if (event === 'SIGNED_IN' && session) {
          setCurrentView('dashboard');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setCurrentView]);

  const handleUserSession = async (user: User) => {
    try {
      // First, try to fetch the profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle(); // Use maybeSingle() instead of single() to avoid PGRST116 error

      // If there's an error other than "no rows returned", log it
      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      // If profile doesn't exist, try to create it
      if (!profile) {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
            avatar_url: user.user_metadata?.avatar_url || null,
            plan: 'free'
          })
          .select()
          .single();

        // If insertion fails due to duplicate key (race condition), fetch the existing profile
        if (insertError) {
          if (insertError.code === '23505') {
            // Duplicate key error - profile was created by another process
            console.log('Profile already exists, fetching existing profile...');
            const { data: existingProfile, error: fetchError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();

            if (fetchError) {
              console.error('Error fetching existing profile after duplicate key error:', fetchError);
              return;
            }

            // Use the existing profile
            setUserFromProfile(existingProfile, user);
          } else {
            console.error('Error creating profile:', insertError);
            return;
          }
        } else {
          // Successfully created new profile
          setUserFromProfile(newProfile, user);
        }
      } else {
        // Profile exists, use it
        setUserFromProfile(profile, user);
      }
    } catch (error) {
      console.error('Error handling user session:', error);
    }
  };

  const setUserFromProfile = (profile: any, user: User) => {
    setUser({
      id: user.id,
      name: profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || 'User',
      email: user.email || '',
      avatar: profile?.avatar_url || user.user_metadata?.avatar_url,
      plan: profile?.plan || 'free'
    });
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message, loading: false }));
        return { success: false, error: error.message };
      }

      if (data.user && !data.session) {
        // Email confirmation required
        return { 
          success: true, 
          message: 'Please check your email for a confirmation link.' 
        };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }));
      return { success: false, error: errorMessage };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message, loading: false }));
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }));
      return { success: false, error: errorMessage };
    }
  };

  const signInWithGoogle = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message, loading: false }));
        return { success: false, error: error.message };
      }

      // OAuth will redirect, so we don't need to handle success here
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }));
      return { success: false, error: errorMessage };
    }
  };

  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { error } = await supabase.auth.signOut();

      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message, loading: false }));
        return { success: false, error: error.message };
      }

      setCurrentView('landing');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }));
      return { success: false, error: errorMessage };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, message: 'Password reset email sent!' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      return { success: false, error: errorMessage };
    }
  };

  return {
    ...authState,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword
  };
};