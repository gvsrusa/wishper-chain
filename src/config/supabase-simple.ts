import { createClient } from '@supabase/supabase-js';
import { Environment } from './environment';

// Validate environment variables on import
Environment.validateRequiredVars();

// Custom storage adapter for Expo SecureStore
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return require('expo-secure-store').getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    return require('expo-secure-store').setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    return require('expo-secure-store').deleteItemAsync(key);
  },
};

// Create Supabase client with React Native specific options
export const supabase = createClient(
  Environment.supabaseUrl, 
  Environment.supabaseAnonKey,
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    realtime: {
      // Disable realtime to avoid WebSocket issues
      params: {
        eventsPerSecond: 0,
      },
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-react-native',
      },
    },
  }
);