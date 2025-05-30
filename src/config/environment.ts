import Constants from 'expo-constants';

export const Environment = {
  // Clerk Configuration
  clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
  
  // Supabase Configuration (for database only)
  supabaseUrl: Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  
  // Google Authentication
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
  googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
  googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '', // Server-side only
  
  // Facebook Authentication
  facebookClientId: process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_ID || '',
  
  // AI Service Configuration
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  
  // App Configuration
  appEnv: Constants.expoConfig?.extra?.appEnv || process.env.EXPO_PUBLIC_APP_ENV || 'development',
  
  // Helper functions
  isDevelopment: () => Environment.appEnv === 'development',
  isProduction: () => Environment.appEnv === 'production',
  
  // Validation
  validateRequiredVars: () => {
    const missing = [];
    
    if (!Environment.clerkPublishableKey) missing.push('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY');
    if (!Environment.supabaseUrl) missing.push('EXPO_PUBLIC_SUPABASE_URL');
    if (!Environment.supabaseAnonKey) missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
};