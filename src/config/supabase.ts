import { createClient } from '@supabase/supabase-js';
import { Environment } from './environment';

// Validate environment variables on import
Environment.validateRequiredVars();

export const supabase = createClient(
  Environment.supabaseUrl, 
  Environment.supabaseAnonKey,
  {
    auth: {
      // Disable auth since we're using Clerk
      autoRefreshToken: false,
      persistSession: false,
    },
    realtime: {
      // Disable realtime to avoid WebSocket issues
      params: {
        eventsPerSecond: 0,
      },
    },
    global: {
      // Use HTTP only, no WebSockets
      headers: {
        'X-Client-Info': 'supabase-js/react-native',
      },
    },
  }
);