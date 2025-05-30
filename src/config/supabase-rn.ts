// React Native specific Supabase configuration that avoids WebSocket issues
import { createClient } from '@supabase/supabase-js';
import { Environment } from './environment';

// Validate environment variables on import
Environment.validateRequiredVars();

// Completely disable WebSocket before creating client
if (typeof global !== 'undefined') {
  global.WebSocket = undefined;
  global.WebSocketConstructor = undefined;
}

// Create a REST-only Supabase client for React Native
export const supabase = createClient(
  Environment.supabaseUrl, 
  Environment.supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      flowType: 'implicit',
    },
    realtime: {
      // Completely disable realtime
      disabled: true,
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