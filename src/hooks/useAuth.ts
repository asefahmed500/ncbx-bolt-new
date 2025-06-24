import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { User, Session } from '@supabase/supabase-js';

// Global state to prevent race conditions
const globalAuthState = {
  initialized: false,
  initializing: false,
  subscription: null as { unsubscribe: () => void } | null,
  lastSession: null as Session | null,
  referenceCount: 0,
};

interface AuthResult {
  success: boolean;
  error?: string;
  message?: string;
  needsVerification?: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState({
    user: null as User | null,
    session: null as Session | null,
    loading: true,
    error: null as string | null,
  });

  const mountedRef = useRef(true);

  const handleUserSession = useCallback(async (user: User | null, session: Session | null = null) => {
    if (!mountedRef.current) return;

    const { setUser, setCurrentView, currentView } = useAppStore.getState();
    
    if (!user) {
      setUser(null);
      // Only change view if we're not already on landing or auth
      if (!['landing', 'auth'].includes(currentView)) {
        setCurrentView('landing');
      }
      setAuthState(prev => ({
        ...prev,
        user: null,
        session: null,
        loading: false,
        error: null,
      }));
      return;
    }

    try {
      let profile = null;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && !['PGRST116', '42P01'].includes(error.code)) {
          console.warn('Profile fetch warning:', error);
        } else if (data) {
          profile = data;
        }
      } catch (err) {
        console.warn('Profile fetch failed:', err);
      }

      if (!mountedRef.current) return;

      const appUser = {
        id: user.id,
        name: profile?.full_name ||
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split('@')[0] ||
              'User',
        email: user.email || '',
        avatar: profile?.avatar_url ||
                user.user_metadata?.avatar_url ||
                user.user_metadata?.picture ||
                null,
        plan: (profile?.plan as 'free' | 'pro' | 'business') || 'free',
        role: (profile?.role as 'user' | 'admin') || 
              (user.email === 'asefahmed500@gmail.com' ? 'admin' : 'user'),
      };

      setUser(appUser);
      
      // Only redirect to dashboard if user is on landing or auth pages
      const currentState = useAppStore.getState();
      if (['landing', 'auth'].includes(currentState.currentView)) {
        setCurrentView('dashboard');
      }
      
      setAuthState(prev => ({
        ...prev,
        user,
        session,
        loading: false,
        error: null,
      }));
    } catch (err) {
      console.error('Error handling user session:', err);
      if (!mountedRef.current) return;
      
      setUser(null);
      setCurrentView('landing');
      setAuthState(prev => ({
        ...prev,
        error: 'Failed to load user profile',
        loading: false,
      }));
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName?: string): Promise<AuthResult> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            name: fullName,
          }
        }
      });

      if (error) {
        setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
        return { success: false, error: error.message };
      }

      if (data.user && !data.session) {
        setAuthState(prev => ({ ...prev, loading: false }));
        return {
          success: true,
          needsVerification: true,
          message: 'Please check your email and click the confirmation link to complete your registration.'
        };
      }

      if (data.session) {
        await handleUserSession(data.user, data.session);
        return { success: true, message: 'Account created successfully!' };
      }

      return { success: false, error: 'Unknown error occurred' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, [handleUserSession]);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
        return { success: false, error: error.message };
      }

      if (data.session && data.user) {
        await handleUserSession(data.user, data.session);
        return { success: true, message: 'Signed in successfully!' };
      }

      return { success: false, error: 'Invalid credentials' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, [handleUserSession]);

  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) {
        setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      setAuthState(prev => ({ ...prev, loading: false }));

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        message: 'Password reset email sent. Please check your inbox.'
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const resendConfirmation = useCallback(async (email: string): Promise<AuthResult> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      setAuthState(prev => ({ ...prev, loading: false }));

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        message: 'Confirmation email sent. Please check your inbox.'
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string): Promise<AuthResult> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
        return { success: false, error: error.message };
      }

      if (data.user) {
        await handleUserSession(data.user);
        return { success: true, message: 'Password updated successfully!' };
      }

      return { success: false, error: 'Failed to update password' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, [handleUserSession]);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      const { logout } = useAppStore.getState();
      logout();
      
      console.log('✅ User signed out successfully');
    } catch (err) {
      console.error('❌ Sign out error:', err);
      
      const { logout } = useAppStore.getState();
      logout();
      
      throw err;
    }
  }, []);

  const initializeAuth = useCallback(async () => {
    if (globalAuthState.initializing) {
      return;
    }

    globalAuthState.initializing = true;
    console.log('🔍 Initializing auth...');

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      globalAuthState.lastSession = session;
      
      if (session?.user) {
        console.log('✅ Found existing session');
        await handleUserSession(session.user, session);
      } else {
        console.log('ℹ️ No session found');
        await handleUserSession(null);
      }

      if (!globalAuthState.subscription) {
        globalAuthState.subscription = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log(`🔍 Auth event: ${event}`);
          
          if (session === globalAuthState.lastSession) {
            return;
          }
          
          globalAuthState.lastSession = session;
          await handleUserSession(session?.user || null, session);
        }).data.subscription;
      }

      globalAuthState.initialized = true;
    } catch (err) {
      console.error('❌ Auth initialization error:', err);
      await handleUserSession(null);
    } finally {
      globalAuthState.initializing = false;
    }
  }, [handleUserSession]);

  useEffect(() => {
    mountedRef.current = true;
    globalAuthState.referenceCount++;

    const initialize = async () => {
      if (!globalAuthState.initialized && !globalAuthState.initializing) {
        await initializeAuth();
      } else if (globalAuthState.initialized) {
        const { data: { session } } = await supabase.auth.getSession();
        await handleUserSession(session?.user || null, session);
      }
    };

    initialize();

    return () => {
      mountedRef.current = false;
      globalAuthState.referenceCount--;

      if (globalAuthState.referenceCount === 0 && globalAuthState.subscription) {
        globalAuthState.subscription.unsubscribe();
        globalAuthState.subscription = null;
        globalAuthState.initialized = false;
      }
    };
  }, [initializeAuth, handleUserSession]);

  return {
    ...authState,
    isAuthenticated: !!authState.user,
    signUp,
    signIn,
    signInWithGoogle,
    resetPassword,
    resendConfirmation,
    updatePassword,
    signOut,
  };
};