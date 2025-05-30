// Service to handle anonymous users with Clerk
// Since Clerk doesn't support anonymous auth, we'll create a workaround

import AsyncStorage from '@react-native-async-storage/async-storage';

export class AnonymousUserService {
  private static ANONYMOUS_USER_KEY = 'whisperchain_anonymous_user';
  
  /**
   * Create a pseudo-anonymous user account
   * This creates a real Clerk account with generated credentials
   */
  static async createAnonymousUser(): Promise<{
    email: string;
    password: string;
    username: string;
  }> {
    // Generate unique anonymous credentials
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    
    const email = `anon_${timestamp}_${randomId}@whisperchain.app`;
    const password = `${timestamp}${randomId}SecurePass!`;
    const username = `Anon_${randomId}`;
    
    // Store credentials locally for auto-login
    const credentials = { email, password, username };
    
    try {
      // Store in secure storage
      await AsyncStorage.setItem(this.ANONYMOUS_USER_KEY, JSON.stringify(credentials));
    } catch (error) {
      console.error('Failed to store anonymous credentials:', error);
    }
    
    return credentials;
  }
  
  /**
   * Get stored anonymous credentials if they exist
   */
  static async getStoredAnonymousCredentials(): Promise<{
    email: string;
    password: string;
    username: string;
  } | null> {
    try {
      const stored = await AsyncStorage.getItem(this.ANONYMOUS_USER_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to retrieve anonymous credentials:', error);
    }
    return null;
  }
  
  /**
   * Clear anonymous user data
   */
  static async clearAnonymousUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.ANONYMOUS_USER_KEY);
    } catch (error) {
      console.error('Failed to clear anonymous user:', error);
    }
  }
  
  /**
   * Convert anonymous user to regular user
   * This would update the existing account with real email/password
   */
  static async convertToRegularUser(
    newEmail: string,
    newPassword: string,
    newUsername?: string
  ): Promise<void> {
    // This would require backend support to update the Clerk user
    // For now, users would need to create a new account
    this.clearAnonymousUser();
    throw new Error(
      'Please create a new account. Anonymous accounts cannot be converted directly.'
    );
  }
}