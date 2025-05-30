import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Token cache for Clerk
export const tokenCache = {
  async getToken(key: string) {
    try {
      if (Platform.OS !== 'web') {
        return await SecureStore.getItemAsync(key);
      }
      // For web, fall back to localStorage
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error getting token from cache:', error);
      return null;
    }
  },
  
  async saveToken(key: string, value: string) {
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(key, value);
      } else {
        // For web, fall back to localStorage
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Error saving token to cache:', error);
    }
  },
  
  async deleteToken(key: string) {
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync(key);
      } else {
        // For web, fall back to localStorage
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Error deleting token from cache:', error);
    }
  }
};