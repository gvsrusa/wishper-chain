import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useAuth as useClerkAuth, useUser as useClerkUser, useSignIn, useSignUp } from '@clerk/clerk-expo';
import { User } from '../types';
import { ClerkDatabaseSync } from '../services/clerk-database-sync';
import { AnonymousUserService } from '../services/anonymous-user';

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
  const { signIn: clerkSignIn, isLoaded: signInLoaded, setActive: setActiveSignIn } = useSignIn();
  const { signUp: clerkSignUp, isLoaded: signUpLoaded, setActive: setActiveSignUp } = useSignUp();
  const [syncedUser, setSyncedUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

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
          // Fallback to basic user data if sync fails
          setSyncedUser({
            id: clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress || '',
            username: clerkUser.username || clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0],
            displayName: clerkUser.fullName || clerkUser.username || clerkUser.primaryEmailAddress?.emailAddress || 'Anonymous',
            avatarUrl: clerkUser.imageUrl,
            isAnonymous,
            createdAt: clerkUser.createdAt ? new Date(clerkUser.createdAt) : new Date(),
          });
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
      if (result.status === 'complete' && result.createdSessionId) {
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

      if (result.status === 'complete' && result.createdSessionId) {
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
      const storedCreds = AnonymousUserService.getStoredAnonymousCredentials();
      
      if (storedCreds && clerkSignIn) {
        try {
          const result = await clerkSignIn.create({
            identifier: storedCreds.email,
            password: storedCreds.password,
          });

          if (result.status === 'complete' && result.createdSessionId) {
            await setActiveSignIn({
              session: result.createdSessionId,
            });
            return;
          }
        } catch (error) {
          console.log('Failed to sign in with stored anonymous credentials, creating new ones');
          AnonymousUserService.clearAnonymousUser();
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
      if (result.status === 'complete' && result.createdSessionId) {
        await setActiveSignUp({
          session: result.createdSessionId,
        });
      }
    } catch (error: any) {
      console.error('Anonymous sign in error:', error);
      throw new Error('Failed to sign in anonymously. Please try regular sign up.');
    }
  };

  const signInWithGoogle = async () => {
    if (!clerkSignIn) throw new Error('Sign in not available');
    
    try {
      await clerkSignIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: 'whisperchain://oauth-redirect',
        redirectUrlComplete: 'whisperchain://dashboard',
      });
    } catch (error: any) {
      console.error('Google sign in error:', error);
      throw new Error(error.errors?.[0]?.message || 'Failed to sign in with Google');
    }
  };

  const signInWithFacebook = async () => {
    if (!clerkSignIn) throw new Error('Sign in not available');
    
    try {
      await clerkSignIn.authenticateWithRedirect({
        strategy: 'oauth_facebook',
        redirectUrl: 'whisperchain://oauth-redirect',
        redirectUrlComplete: 'whisperchain://dashboard',
      });
    } catch (error: any) {
      console.error('Facebook sign in error:', error);
      throw new Error(error.errors?.[0]?.message || 'Failed to sign in with Facebook');
    }
  };

  const signOut = async () => {
    try {
      await clerkSignOut();
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