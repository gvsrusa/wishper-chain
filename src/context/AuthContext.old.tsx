import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { api } from '../services/api-with-fallback';
import { SocialAuthService } from '../services/social-auth';
import * as SecureStore from 'expo-secure-store';

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

const USER_STORAGE_KEY = 'whisperchain_user';
const AUTH_TOKEN_KEY = 'whisperchain_auth_token';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored user on app start
  useEffect(() => {
    checkStoredAuth();
  }, []);

  const checkStoredAuth = async () => {
    try {
      const storedUser = await SecureStore.getItemAsync(USER_STORAGE_KEY);
      const storedToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      
      if (storedUser && storedToken) {
        const parsedUser = JSON.parse(storedUser);
        // Validate token is still valid (optional - depends on your auth system)
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Error checking stored auth:', error);
      // Clear invalid stored data
      await clearStoredAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const storeUserData = async (userData: User, token?: string) => {
    try {
      await SecureStore.setItemAsync(USER_STORAGE_KEY, JSON.stringify(userData));
      if (token) {
        await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
      }
    } catch (error) {
      console.error('Error storing user data:', error);
    }
  };

  const clearStoredAuth = async () => {
    try {
      await SecureStore.deleteItemAsync(USER_STORAGE_KEY);
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Error clearing stored auth:', error);
    }
  };

  const signUp = async (email: string, password: string, username?: string) => {
    try {
      setIsLoading(true);
      const userData = await api.signUp(email, password, username);
      setUser(userData);
      await storeUserData(userData);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const userData = await api.signIn(email, password);
      setUser(userData);
      await storeUserData(userData);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInAnonymously = async () => {
    try {
      setIsLoading(true);
      const userData = await api.signInAnonymously();
      setUser(userData);
      await storeUserData(userData);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      const { user: googleUser, idToken } = await SocialAuthService.signInWithGoogle();
      
      // Create user data from Google response
      const userData: User = {
        id: googleUser.id,
        email: googleUser.email,
        username: googleUser.email?.split('@')[0] || undefined,
        displayName: googleUser.name || googleUser.email || 'Google User',
        isAnonymous: false,
        createdAt: new Date(),
      };
      
      setUser(userData);
      await storeUserData(userData, idToken);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithFacebook = async () => {
    try {
      setIsLoading(true);
      const { user: fbUser, accessToken } = await SocialAuthService.signInWithFacebook();
      
      // Create user data from Facebook response
      const userData: User = {
        id: fbUser.id,
        email: fbUser.email,
        username: fbUser.email?.split('@')[0] || undefined,
        displayName: fbUser.name || fbUser.email || 'Facebook User',
        isAnonymous: false,
        createdAt: new Date(),
      };
      
      setUser(userData);
      await storeUserData(userData, accessToken);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      // Sign out from social providers
      await SocialAuthService.signOut();
      // Clear user state
      setUser(null);
      // Clear stored data
      await clearStoredAuth();
    } catch (error) {
      console.error('Error during sign out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    // TODO: Implement user data refresh from server
    console.log('Refresh user data');
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
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