import React, { createContext, useContext, ReactNode, useEffect, useState, useCallback } from 'react';
import { useAuth as useClerkAuth, useUser as useClerkUser, useSignIn, useSignUp, useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { User } from '../types';
import { ClerkDatabaseSync } from '../services/clerk-database-sync';
import { AnonymousUserService } from '../services/anonymous-user';

// Warm up the browser for OAuth
WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, username?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { isLoaded: authLoaded, userId, signOut: clerkSignOut } = useClerkAuth();
  const { user: clerkUser, isLoaded: userLoaded } = useClerkUser();
  const signInHook = useSignIn();
  const signUpHook = useSignUp();
  const { startOAuthFlow: startGoogleOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startFacebookOAuthFlow } = useOAuth({ strategy: 'oauth_facebook' });
  const [syncedUser, setSyncedUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Handle cases where hooks might be null/undefined
  const clerkSignIn = signInHook?.signIn;
  const signInLoaded = signInHook?.isLoaded ?? true;
  const setActiveSignIn = signInHook?.setActive;
  
  const clerkSignUp = signUpHook?.signUp;
  const signUpLoaded = signUpHook?.isLoaded ?? true;
  const setActiveSignUp = signUpHook?.setActive;

  const isLoading = !authLoaded || !userLoaded || !signInLoaded || !signUpLoaded || isSyncing;

  // Sync Clerk user with database whenever clerkUser changes
  useEffect(() => {
    if (clerkUser && userId) {
      setIsSyncing(true);
      
      // Check if this is an anonymous user
      const email = clerkUser.primaryEmailAddress?.emailAddress || '';
      const isAnonymous = email.includes('@whisperchain.app');
      
      ClerkDatabaseSync.syncUser(clerkUser)
        .then(user => {
          setSyncedUser({
            ...user,
            isAnonymous, // Override with detected anonymous status
          });
        })
        .catch(error => {
          console.error('Failed to sync user:', error);
          // Don't set a fallback user if sync fails - this prevents using wrong IDs
          setSyncedUser(null);
        })
        .finally(() => {
          setIsSyncing(false);
        });
    } else {
      setSyncedUser(null);
      setIsSyncing(false);
    }
  }, [clerkUser, userId]);

  const user = syncedUser;

  const signUp = async (email: string, password: string, username?: string) => {
    if (!clerkSignUp) throw new Error('Sign up not available');
    
    try {
      const result = await clerkSignUp.create({
        emailAddress: email,
        password,
        username,
      });

      // If email verification is needed
      if (result.status === 'missing_requirements') {
        // Send verification email
        await clerkSignUp.prepareEmailAddressVerification({
          strategy: 'email_code',
        });
        
        // In a real app, you'd handle the verification flow here
        throw new Error('Please check your email for verification code');
      }

      // If sign up is complete, set the session
      if (result.status === 'complete' && result.createdSessionId && setActiveSignUp) {
        await setActiveSignUp({
          session: result.createdSessionId,
        });
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.errors?.[0]?.message || 'Failed to sign up');
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!clerkSignIn) throw new Error('Sign in not available');
    
    try {
      const result = await clerkSignIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete' && result.createdSessionId && setActiveSignIn) {
        await setActiveSignIn({
          session: result.createdSessionId,
        });
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.errors?.[0]?.message || 'Failed to sign in');
    }
  };

  const signInAnonymously = async () => {
    if (!clerkSignUp) throw new Error('Sign up not available');
    
    try {
      // First, try to sign in with existing anonymous credentials
      const storedCreds = await AnonymousUserService.getStoredAnonymousCredentials();
      
      if (storedCreds && clerkSignIn) {
        try {
          const result = await clerkSignIn.create({
            identifier: storedCreds.email,
            password: storedCreds.password,
          });

          if (result.status === 'complete' && result.createdSessionId && setActiveSignIn) {
            await setActiveSignIn({
              session: result.createdSessionId,
            });
            return;
          }
        } catch (error) {
          console.log('Failed to sign in with stored anonymous credentials, creating new ones');
          await AnonymousUserService.clearAnonymousUser();
        }
      }
      
      // Create new anonymous user
      const anonymousCreds = await AnonymousUserService.createAnonymousUser();
      
      const result = await clerkSignUp.create({
        emailAddress: anonymousCreds.email,
        password: anonymousCreds.password,
        username: anonymousCreds.username,
      });

      // For anonymous users, we'll skip email verification
      if (result.status === 'complete' && result.createdSessionId && setActiveSignUp) {
        await setActiveSignUp({
          session: result.createdSessionId,
        });
      }
    } catch (error: any) {
      console.error('Anonymous sign in error:', error);
      throw new Error('Failed to sign in anonymously. Please try regular sign up.');
    }
  };

  const signInWithGoogle = useCallback(async () => {
    try {
      if (!startGoogleOAuthFlow) {
        throw new Error('Google OAuth is not available');
      }
      
      const result = await startGoogleOAuthFlow();
      const { createdSessionId, setActive } = result;
      
      // Check if the OAuth flow was completed
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (error: any) {
      console.error('Google sign in error:', error);
      
      // Handle different error structures
      const errorMessage = error?.errors?.[0]?.message || 
                          error?.message || 
                          error?.error || 
                          'Failed to sign in with Google. Please ensure Google OAuth is configured in your Clerk dashboard.';
      throw new Error(errorMessage);
    }
  }, [startGoogleOAuthFlow]);

  const signInWithFacebook = async () => {
    try {
      if (!startFacebookOAuthFlow) {
        throw new Error('Facebook OAuth is not available');
      }
      
      const { createdSessionId, setActive } = await startFacebookOAuthFlow();
      
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (error: any) {
      console.error('Facebook sign in error:', error);
      // Handle different error structures
      const errorMessage = error?.errors?.[0]?.message || 
                          error?.message || 
                          'Failed to sign in with Facebook. Please ensure Facebook OAuth is configured in your Clerk dashboard.';
      throw new Error(errorMessage);
    }
  };

  const signOut = async () => {
    try {
      // Clear any anonymous user credentials
      if (user?.isAnonymous) {
        await AnonymousUserService.clearAnonymousUser();
      }
      
      // Sign out from Clerk
      await clerkSignOut();
      
      // Clear synced user state
      setSyncedUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    // Clerk automatically manages user data refreshing
    // This is a no-op but kept for API compatibility
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!userId,
    signUp,
    signIn,
    signInAnonymously,
    signInWithGoogle,
    signInWithFacebook,
    signOut,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}