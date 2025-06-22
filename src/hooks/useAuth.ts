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

export interface AuthResult {
  success: boolean;
  error?: string;
  message?: string;
  needsVerification?: boolean;
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
        
        try {
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

          // Handle different auth events
          switch (event) {
            case 'SIGNED_IN':
              if (session) {
                setCurrentView('dashboard');
              }
              break;
            case 'SIGNED_OUT':
              setCurrentView('landing');
              break;
            case 'PASSWORD_RECOVERY':
              // Handle password recovery if needed
              break;
            case 'TOKEN_REFRESHED':
              // Token was refreshed successfully
              break;
            case 'USER_UPDATED':
              // User data was updated
              if (session?.user) {
                await handleUserSession(session.user);
              }
              break;
          }
        } catch (error) {
          console.error('Error handling auth state change:', error);
          setAuthState(prev => ({
            ...prev,
            error: 'Authentication error occurred',
            loading: false
          }));
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setCurrentView]);

  const handleUserSession = async (user: User): Promise<void> => {
    try {
      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
        throw new Error('Failed to fetch user profile');
      }

      // If profile doesn't exist, create it
      if (!profile) {
        const profileData = {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || 
                    user.user_metadata?.name || 
                    user.user_metadata?.display_name || 
                    '',
          avatar_url: user.user_metadata?.avatar_url || 
                     user.user_metadata?.picture || 
                     null,
          plan: 'free' as const,
          role: user.email === 'admin@gmail.com' ? 'admin' as const : 'user' as const
        };

        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert(profileData)
          .select()
          .single();

        if (insertError) {
          // Handle race condition - profile might have been created by another session
          if (insertError.code === '23505') {
            console.log('Profile already exists, fetching existing profile...');
            const { data: existingProfile, error: fetchError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();

            if (fetchError) {
              console.error('Error fetching existing profile:', fetchError);
              throw new Error('Failed to fetch existing profile');
            }

            setUserFromProfile(existingProfile, user);
          } else {
            console.error('Error creating profile:', insertError);
            throw new Error('Failed to create user profile');
          }
        } else {
          setUserFromProfile(newProfile, user);
        }
      } else {
        // Profile exists, update it with latest auth data if needed
        const shouldUpdate = 
          profile.email !== user.email ||
          (!profile.full_name && (user.user_metadata?.full_name || user.user_metadata?.name)) ||
          (!profile.avatar_url && (user.user_metadata?.avatar_url || user.user_metadata?.picture)) ||
          (user.email === 'admin@gmail.com' && profile.role !== 'admin');

        if (shouldUpdate) {
          const updates: any = {};
          if (profile.email !== user.email) updates.email = user.email;
          if (!profile.full_name && (user.user_metadata?.full_name || user.user_metadata?.name)) {
            updates.full_name = user.user_metadata?.full_name || user.user_metadata?.name;
          }
          if (!profile.avatar_url && (user.user_metadata?.avatar_url || user.user_metadata?.picture)) {
            updates.avatar_url = user.user_metadata?.avatar_url || user.user_metadata?.picture;
          }
          // Ensure admin@gmail.com always has admin role
          if (user.email === 'admin@gmail.com' && profile.role !== 'admin') {
            updates.role = 'admin';
            updates.plan = 'business';
          }

          const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single();

          if (updateError) {
            console.error('Error updating profile:', updateError);
            // Still use the existing profile if update fails
            setUserFromProfile(profile, user);
          } else {
            setUserFromProfile(updatedProfile, user);
          }
        } else {
          setUserFromProfile(profile, user);
        }
      }
    } catch (error) {
      console.error('Error handling user session:', error);
      // Set basic user info even if profile operations fail
      setUser({
        id: user.id,
        name: user.user_metadata?.full_name || 
              user.user_metadata?.name || 
              user.user_metadata?.display_name || 
              'User',
        email: user.email || '',
        avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture,
        plan: 'free',
        role: user.email === 'admin@gmail.com' ? 'admin' : 'user'
      });
    }
  };

  const setUserFromProfile = (profile: any, user: User) => {
    setUser({
      id: user.id,
      name: profile?.full_name || 
            user.user_metadata?.full_name || 
            user.user_metadata?.name || 
            user.user_metadata?.display_name || 
            'User',
      email: user.email || profile?.email || '',
      avatar: profile?.avatar_url || 
              user.user_metadata?.avatar_url || 
              user.user_metadata?.picture,
      plan: profile?.plan || 'free',
      role: profile?.role || (user.email === 'admin@gmail.com' ? 'admin' : 'user')
    });
  };

  const signUp = async (email: string, password: string, fullName?: string): Promise<AuthResult> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || '',
            name: fullName || ''
          }
        }
      });

      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message, loading: false }));
        return { success: false, error: error.message };
      }

      if (data.user && !data.session) {
        // Email confirmation required
        setAuthState(prev => ({ ...prev, loading: false }));
        return { 
          success: true, 
          needsVerification: true,
          message: 'Please check your email for a confirmation link to complete your registration.' 
        };
      }

      if (data.user && data.session) {
        // User is immediately signed in (email confirmation disabled)
        setAuthState(prev => ({ ...prev, loading: false }));
        return { success: true };
      }

      setAuthState(prev => ({ ...prev, loading: false }));
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during signup';
      setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }));
      return { success: false, error: errorMessage };
    }
  };

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        let errorMessage = error.message;
        
        // Provide more user-friendly error messages
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and click the confirmation link before signing in.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Too many login attempts. Please wait a moment before trying again.';
        }

        setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }));
        return { success: false, error: errorMessage };
      }

      setAuthState(prev => ({ ...prev, loading: false }));
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during sign in';
      setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }));
      return { success: false, error: errorMessage };
    }
  };

  const signInWithGoogle = async (): Promise<AuthResult> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        let errorMessage = error.message;
        
        if (error.message.includes('OAuth')) {
          errorMessage = 'Google sign-in is not properly configured. Please contact support.';
        }

        setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }));
        return { success: false, error: errorMessage };
      }

      // OAuth will redirect, so we don't set loading to false here
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred with Google sign-in';
      setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }));
      return { success: false, error: errorMessage };
    }
  };

  const signOut = async (): Promise<AuthResult> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { error } = await supabase.auth.signOut();

      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message, loading: false }));
        return { success: false, error: error.message };
      }

      // Clear user state and redirect
      setUser(null);
      setCurrentView('landing');
      setAuthState(prev => ({ ...prev, loading: false }));
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during sign out';
      setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }));
      return { success: false, error: errorMessage };
    }
  };

  const resetPassword = async (email: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) {
        let errorMessage = error.message;
        
        if (error.message.includes('rate limit')) {
          errorMessage = 'Too many password reset requests. Please wait before trying again.';
        } else if (error.message.includes('not found')) {
          errorMessage = 'No account found with this email address.';
        }
        
        return { success: false, error: errorMessage };
      }

      return { 
        success: true, 
        message: 'Password reset email sent! Please check your inbox and follow the instructions.' 
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      return { success: false, error: errorMessage };
    }
  };

  const updatePassword = async (newPassword: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, message: 'Password updated successfully!' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      return { success: false, error: errorMessage };
    }
  };

  const updateProfile = async (updates: {
    full_name?: string;
    avatar_url?: string;
  }): Promise<AuthResult> => {
    try {
      if (!authState.user) {
        return { success: false, error: 'No user logged in' };
      }

      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: updates
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      // Update profile table
      const { error: profileError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', authState.user.id);

      if (profileError) {
        return { success: false, error: profileError.message };
      }

      return { success: true, message: 'Profile updated successfully!' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      return { success: false, error: errorMessage };
    }
  };

  const resendConfirmation = async (email: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        message: 'Confirmation email sent! Please check your inbox.' 
      };
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
    resetPassword,
    updatePassword,
    updateProfile,
    resendConfirmation
  };
};