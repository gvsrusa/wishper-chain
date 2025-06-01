// API service that integrates with Clerk authentication
import { supabase } from '../config/supabase-rest-only-fixed';
import { Whisper, ChainResponse, User, Theme } from '../types';

// Get the current user from Clerk context
let currentUserId: string | null = null;
let isAuthContextInitialized = false;

export const setAuthContext = (userId: string | null) => {
  currentUserId = userId;
  isAuthContextInitialized = true;
  console.log('Auth context initialized with userId:', userId);
};

export const isAuthReady = () => isAuthContextInitialized;
export const getCurrentUserIdDebug = () => currentUserId;

const getCurrentUserId = (): string | null => {
  console.log('getCurrentUserId called, currentUserId:', currentUserId);
  return currentUserId;
};

// Database types
interface DbWhisper {
  id: string;
  user_id: string;
  original_text: string;
  transformed_text: string;
  theme_id?: string;
  theme_name?: string;
  themes?: { id: string; name: string; color: string };
  likes_count?: number;
  chain_count?: number;
  created_at: string;
  is_liked?: boolean;
  username?: string;
  display_name?: string;
  users?: { id: string; username: string; display_name: string };
}

interface DbChainResponse {
  id: string;
  whisper_id: string;
  user_id: string;
  original_text: string;
  transformed_text: string;
  created_at: string;
  response_order?: number;
  username?: string;
  display_name?: string;
  users?: { id: string; username: string; display_name: string };
}

interface DbTheme {
  id: string;
  name: string;
  description?: string;
  color: string;
  is_active?: boolean;
}

interface DbUser {
  id: string;
  username: string;
  display_name: string;
}

interface DbLike {
  id?: string;
  whisper_id: string;
  user_id: string;
}

// Transform database response to app types
const transformWhisper = (dbWhisper: DbWhisper): Whisper => ({
  id: dbWhisper.id,
  userId: dbWhisper.user_id,
  originalText: dbWhisper.original_text,
  transformedText: dbWhisper.transformed_text,
  theme: dbWhisper.themes?.name || dbWhisper.theme_name,
  likes: dbWhisper.likes_count || 0,
  chainCount: dbWhisper.chain_count || 0,
  createdAt: new Date(dbWhisper.created_at),
  isLiked: dbWhisper.is_liked || false,
  username: dbWhisper.users?.username || dbWhisper.username || 'anonymous',
  displayName: dbWhisper.users?.display_name || dbWhisper.display_name || 'Anonymous',
});

const transformChainResponse = (dbResponse: DbChainResponse): ChainResponse => {
  console.log('Transforming chain response:', dbResponse);
  
  try {
    const transformed = {
      id: dbResponse.id,
      whisperId: dbResponse.whisper_id,
      userId: dbResponse.user_id,
      originalText: dbResponse.original_text,
      transformedText: dbResponse.transformed_text,
      createdAt: dbResponse.created_at ? new Date(dbResponse.created_at) : new Date(),
      username: dbResponse.users?.username || 'anonymous',
      displayName: dbResponse.users?.display_name || 'Anonymous',
    };
    
    console.log('Transformed result:', transformed);
    return transformed;
  } catch (error) {
    console.error('Error in transformChainResponse:', error);
    throw new Error(`Failed to transform chain response: ${error}`);
  }
};

export const api = {
  // Authentication - handled by Clerk, these are just for compatibility
  signUp: async (): Promise<User> => {
    throw new Error('Use Clerk authentication directly');
  },

  signIn: async (): Promise<User> => {
    throw new Error('Use Clerk authentication directly');
  },

  signInAnonymously: async (): Promise<User> => {
    throw new Error('Use Clerk authentication directly');
  },

  // Whispers
  getWhispers: async (sortBy: string = 'trending'): Promise<Whisper[]> => {
    // Don't wait for auth - whispers are publicly viewable
    const currentUserId = getCurrentUserId();
    console.log('getWhispers - currentUserId:', currentUserId);
    
    let query = supabase
      .from('whispers')
      .select('*')
      .eq('is_published', true);

    // Apply sorting
    switch (sortBy.toLowerCase()) {
      case 'trending':
        query = query.order('likes_count', { ascending: false });
        break;
      case 'recent':
        query = query.order('created_at', { ascending: false });
        break;
      case 'chains':
        query = query.order('chain_count', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query.limit(50);

    if (error) {
      console.error('Error fetching whispers:', error);
      return [];
    }

    // Fetch related data
    if (data && data.length > 0) {
      const themeIds = [...new Set(data.map((w: DbWhisper) => w.theme_id).filter(Boolean))];
      const userIds = [...new Set(data.map((w: DbWhisper) => w.user_id).filter(Boolean))];

      // Fetch themes and users
      const [themesResult, usersResult, likesResult] = await Promise.all([
        themeIds.length > 0 ? supabase.from('themes').select('id, name, color').in('id', themeIds) : null,
        userIds.length > 0 ? supabase.from('users').select('id, username, display_name').in('id', userIds) : null,
        currentUserId ? supabase.from('likes').select('whisper_id').eq('user_id', currentUserId) : null
      ]);

      const themeMap = new Map(themesResult?.data?.map((t: DbTheme) => [t.id, t]) || []);
      const userMap = new Map(usersResult?.data?.map((u: DbUser) => [u.id, u]) || []);
      const likedWhisperIds = new Set(likesResult?.data?.map((l: DbLike) => l.whisper_id) || []);
      
      console.log('Likes found for user:', likesResult?.data);
      console.log('Liked whisper IDs:', Array.from(likedWhisperIds));

      return data.map((w: DbWhisper) => {
        const theme = themeMap.get(w.theme_id || '') as DbTheme | undefined;
        const user = userMap.get(w.user_id) as DbUser | undefined;
        return transformWhisper({
          ...w,
          theme_name: theme?.name,
          themes: theme,
          username: user?.username,
          display_name: user?.display_name,
          users: user,
          is_liked: likedWhisperIds.has(w.id),
        });
      });
    }

    return [];
  },

  getWhisperById: async (id: string): Promise<Whisper | null> => {
    console.log('getWhisperById called with id:', id);
    
    // Don't wait for auth - whispers are publicly viewable
    const currentUserId = getCurrentUserId();
    
    try {
      const { data, error } = await supabase
        .from('whispers')
        .select('*')
        .eq('id', id)
        .single();

      console.log('Whisper query result:');
      console.log('- Data:', data);
      console.log('- Error:', error);
      console.log('- URL would be:', `${supabase.from('whispers').baseUrl}/whispers?select=*&id=eq.${id}`);

      if (error) {
        console.error('Error fetching whisper:', error);
        console.error('Error details:', { 
          message: error.message, 
          code: error.code, 
          details: error.details,
          hint: error.hint,
          status: error.status 
        });
        return null;
      }
      
      if (!data) {
        console.error('No data returned for whisper ID:', id);
        return null;
      }

    if (data) {
      // Fetch related data
      const [themeResult, userResult, likeResult] = await Promise.all([
        data.theme_id ? supabase.from('themes').select('id, name, color').eq('id', data.theme_id).single() : null,
        supabase.from('users').select('id, username, display_name').eq('id', data.user_id).single(),
        currentUserId ? supabase.from('likes').select('id').eq('whisper_id', id).eq('user_id', currentUserId).single() : null
      ]);

      const themeData = themeResult?.data as { id: string; name: string; color: string } | null;
      const userData = userResult?.data as { id: string; username: string; display_name: string } | null;

      return transformWhisper({
        ...data,
        theme_name: themeData?.name,
        themes: themeData,
        username: userData?.username,
        display_name: userData?.display_name,
        users: userData,
        is_liked: !!likeResult?.data,
      });
    }
    } catch (error) {
      console.error('Unexpected error in getWhisperById:', error);
      return null;
    }

    return null;
  },

  createWhisper: async (originalText: string, theme?: string): Promise<Whisper> => {
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('User must be authenticated to create whispers');
    }

    // Get theme ID if theme name provided
    let themeId = null;
    if (theme) {
      const { data: themeData } = await supabase
        .from('themes')
        .select('id')
        .eq('name', theme)
        .single();
      themeId = themeData?.id;
    }

    // Transform text using AI (placeholder)
    const transformedText = await transformText(originalText);

    // First insert the whisper
    const { error: insertError } = await supabase
      .from('whispers')
      .insert({
        user_id: userId,
        original_text: originalText,
        transformed_text: transformedText,
        theme_id: themeId,
      });

    if (insertError) {
      console.error('Error creating whisper:', insertError);
      throw insertError;
    }

    // Then fetch the created whisper
    const { data, error } = await supabase
      .from('whispers')
      .select('*')
      .eq('user_id', userId)
      .eq('original_text', originalText)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error creating whisper:', error);
      throw error;
    }

    // Fetch user data for the response
    const { data: userData } = await supabase
      .from('users')
      .select('username, display_name')
      .eq('id', userId)
      .single();

    return transformWhisper({
      ...data,
      username: userData?.username,
      display_name: userData?.display_name,
    });
  },

  toggleLike: async (whisperId: string, providedUserId?: string): Promise<boolean> => {
    let userId: string | undefined = providedUserId;
    
    if (!userId) {
      // Wait a moment if auth context is being set
      if (!isAuthContextInitialized) {
        console.log('Waiting for auth context to initialize for toggleLike...');
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      const currentUserIdResult = getCurrentUserId();
      userId = currentUserIdResult ?? undefined;
    }
    
    console.log('toggleLike called - whisperId:', whisperId, 'userId:', userId);
    
    if (!userId) {
      throw new Error('User must be authenticated to like whispers');
    }

    // Check if already liked - just use regular select without single()
    const { data: existingLikes, error: checkError } = await supabase
      .from('likes')
      .select('id')
      .eq('whisper_id', whisperId)
      .eq('user_id', userId)
      .limit(1);

    console.log('Existing likes check:', existingLikes, 'Error:', checkError);

    if (checkError) {
      console.error('Error checking like status:', checkError);
      throw checkError;
    }

    const existingLike = existingLikes && existingLikes.length > 0 ? existingLikes[0] : null;
    console.log('Existing like found:', existingLike);

    if (existingLike) {
      // Unlike
      console.log('Attempting to unlike...');
      const { error } = await supabase
        .from('likes')
        .eq('whisper_id', whisperId)
        .eq('user_id', userId)
        .delete();

      if (error) {
        console.error('Error unliking:', error);
        throw error;
      }
      console.log('Successfully unliked');
      return false; // Now unliked
    } else {
      // Like
      console.log('Attempting to like...');
      const { data, error } = await supabase
        .from('likes')
        .insert({
          whisper_id: whisperId,
          user_id: userId,
        });

      console.log('Like insert result:', data, 'Error:', error);

      if (error) {
        console.error('Error liking:', error);
        throw error;
      }
      console.log('Successfully liked');
      return true; // Now liked
    }
  },

  // Chain responses
  getChainResponses: async (whisperId: string): Promise<ChainResponse[]> => {
    console.log('getChainResponses called with whisperId:', whisperId);
    
    try {
      // Don't wait for auth - chain responses are publicly viewable
      const { data, error } = await supabase
        .from('chain_responses')
        .select('*')
        .eq('whisper_id', whisperId)
        .order('response_order', { ascending: true });

      console.log('Chain responses query result - data:', data, 'error:', error);

      if (error) {
        console.error('Error fetching chain responses:', error);
        console.error('Error details:', { message: error.message, code: error.code, details: error.details });
        return [];
      }

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((r: DbChainResponse) => r.user_id).filter(Boolean))];
      
      // Fetch users
      const { data: users } = await supabase
        .from('users')
        .select('id, username, display_name')
        .in('id', userIds);

      const userMap = new Map(users?.map((u: DbUser) => [u.id, u]) || []);

      return data.map((r: DbChainResponse) => {
        const user = userMap.get(r.user_id) as DbUser | undefined;
        return transformChainResponse({
          ...r,
          username: user?.username,
          display_name: user?.display_name,
          users: user,
        });
      });
    }
    } catch (error) {
      console.error('Unexpected error in getChainResponses:', error);
      return [];
    }

    return [];
  },

  createChainResponse: async (whisperId: string, originalText: string, providedUserId?: string): Promise<ChainResponse> => {
    // Use provided user ID if available, otherwise get from context
    let userId: string | undefined = providedUserId;
    
    if (!userId) {
      // Wait a moment if auth context is being set
      if (!isAuthContextInitialized) {
        console.log('Waiting for auth context to initialize...');
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const currentUserIdResult = getCurrentUserId();
      userId = currentUserIdResult ?? undefined;
    }
    
    console.log('Creating chain response - userId:', userId, 'whisperId:', whisperId);
    
    if (!userId) {
      console.error('No user ID available, currentUserId:', currentUserId, 'providedUserId:', providedUserId);
      throw new Error('User must be authenticated to create chain responses');
    }

    // Get current user info from auth context for fallback
    let currentUserInfo = {
      username: 'anonymous',
      display_name: 'Anonymous'
    };

    try {
      // Get the last response_order for this whisper
      const { data: lastResponse } = await supabase
        .from('chain_responses')
        .select('response_order')
        .eq('whisper_id', whisperId)
        .order('response_order', { ascending: false })
        .limit(1);

      const nextOrder = lastResponse && lastResponse.length > 0 
        ? (lastResponse[0].response_order || 0) + 1 
        : 1;

      console.log('Next response order:', nextOrder);

      // Transform text using AI
      const transformedText = await transformText(originalText);

      // Generate a temporary ID for optimistic UI update
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      // Insert with returning data
      const { data: insertData, error: insertError } = await supabase
        .from('chain_responses')
        .insert({
          whisper_id: whisperId,
          user_id: userId,
          original_text: originalText,
          transformed_text: transformedText,
          response_order: nextOrder,
        });

      if (insertError) {
        console.error('Error creating chain response:', insertError);
        throw insertError;
      }

      console.log('Chain response inserted:', insertData);

      // If we got data back from insert, use it
      let responseData = insertData;
      
      // If no data returned from insert (due to RLS), create optimistic response
      if (!responseData || !responseData.id) {
        console.log('No data returned from insert - using optimistic response');
        // Create an optimistic response with the data we know
        responseData = {
          id: tempId,
          whisper_id: whisperId,
          user_id: userId,
          original_text: originalText,
          transformed_text: transformedText,
          response_order: nextOrder,
          created_at: new Date().toISOString(),
        };
        
        // Try to fetch the real data in the background
        setTimeout(async () => {
          try {
            const { data: realData } = await supabase
              .from('chain_responses')
              .select('*')
              .eq('whisper_id', whisperId)
              .eq('user_id', userId)
              .eq('response_order', nextOrder)
              .single();
            
            if (realData) {
              console.log('Found real chain response data:', realData);
            }
          } catch (error) {
            console.error('Failed to fetch real chain response:', error);
          }
        }, 1000);
      }

      console.log('Using response data from database:', responseData);

      // Fetch user data for the response
      let userData = null;
      try {
        const { data } = await supabase
          .from('users')
          .select('username, display_name')
          .eq('id', userId)
          .single();
        userData = data;
      } catch (error) {
        console.log('Failed to fetch user data, using fallback:', error);
      }

      // Transform the response
      const result = transformChainResponse({
        ...responseData,
        users: userData || currentUserInfo,
      });

      console.log('Transformed chain response:', result);
      return result;
      
    } catch (error) {
      console.error('Error in createChainResponse:', error);
      throw error;
    }
  },

  // Search
  searchWhispers: async (query: string): Promise<Whisper[]> => {
    const currentUserId = getCurrentUserId();
    
    // Fetch whispers and manually filter
    const { data, error } = await supabase
      .from('whispers')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error searching whispers:', error);
      return [];
    }

    // Filter by query
    const filtered = data?.filter((w: DbWhisper) => 
      w.original_text.toLowerCase().includes(query.toLowerCase()) ||
      w.transformed_text.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 20) || [];

    if (filtered.length > 0) {
      const themeIds = [...new Set(filtered.map((w: DbWhisper) => w.theme_id).filter(Boolean))];
      const userIds = [...new Set(filtered.map((w: DbWhisper) => w.user_id).filter(Boolean))];

      // Fetch related data
      const [themesResult, usersResult, likesResult] = await Promise.all([
        themeIds.length > 0 ? supabase.from('themes').select('id, name, color').in('id', themeIds) : null,
        userIds.length > 0 ? supabase.from('users').select('id, username, display_name').in('id', userIds) : null,
        currentUserId ? supabase.from('likes').select('whisper_id').eq('user_id', currentUserId) : null
      ]);

      const themeMap = new Map(themesResult?.data?.map((t: DbTheme) => [t.id, t]) || []);
      const userMap = new Map(usersResult?.data?.map((u: DbUser) => [u.id, u]) || []);
      const likedWhisperIds = new Set(likesResult?.data?.map((l: DbLike) => l.whisper_id) || []);

      return filtered.map((w: DbWhisper) => {
        const theme = themeMap.get(w.theme_id || '') as DbTheme | undefined;
        const user = userMap.get(w.user_id) as DbUser | undefined;
        return transformWhisper({
          ...w,
          theme_name: theme?.name,
          themes: theme,
          username: user?.username,
          display_name: user?.display_name,
          users: user,
          is_liked: likedWhisperIds.has(w.id),
        });
      });
    }

    return [];
  },

  // Themes
  getThemes: async (): Promise<Theme[]> => {
    const { data, error } = await supabase
      .from('themes')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching themes:', error);
      return [];
    }

    return data?.map((theme: DbTheme) => ({
      id: theme.id,
      name: theme.name,
      description: theme.description || '',
      accentColor: theme.color,
      backgroundColor: '#1a1a2e',
      gradient: [theme.color, '#1a1a2e'],
    })) || [];
  },

  getThemesWithCounts: async (): Promise<(Theme & { whisperCount: number })[]> => {
    try {
      // Execute raw SQL to get theme counts efficiently
      const { data, error } = await supabase.rpc('get_theme_counts');
      
      if (error) {
        console.error('Error fetching theme counts:', error);
        // Fallback to regular method
        const { data: themes } = await supabase
          .from('themes')
          .select('*')
          .eq('is_active', true);

        if (!themes) return [];

        // Get counts individually
        const themesWithCounts = await Promise.all(
          themes.map(async (theme: DbTheme) => {
            const { data: whispers } = await supabase
              .from('whispers')
              .select('id')
              .eq('theme_id', theme.id)
              .eq('is_published', true);

            return {
              id: theme.id,
              name: theme.name,
              description: theme.description || '',
              accentColor: theme.color,
              backgroundColor: '#1a1a2e',
              gradient: [theme.color, '#1a1a2e'],
              whisperCount: whispers?.length || 0,
            };
          })
        );

        return themesWithCounts;
      }

      // Transform the RPC result
      return data?.map((theme: any) => ({
        id: theme.id,
        name: theme.name,
        description: theme.description || '',
        accentColor: theme.color,
        backgroundColor: '#1a1a2e',
        gradient: [theme.color, '#1a1a2e'],
        whisperCount: parseInt(theme.whisper_count) || 0,
      })) || [];
    } catch (error) {
      console.error('Error in getThemesWithCounts:', error);
      return [];
    }
  },

  getWhispersByTheme: async (themeName: string): Promise<Whisper[]> => {
    // First get the theme ID
    const { data: themeData } = await supabase
      .from('themes')
      .select('id')
      .eq('name', themeName)
      .single();

    if (!themeData) {
      return [];
    }

    // Then get whispers for that theme
    const currentUserId = getCurrentUserId();
    const { data, error } = await supabase
      .from('whispers')
      .select('*')
      .eq('theme_id', themeData.id)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching whispers by theme:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Get user data for the whispers
    const userIds = [...new Set(data.map((w: DbWhisper) => w.user_id).filter(Boolean))];
    const { data: users } = await supabase
      .from('users')
      .select('id, username, display_name')
      .in('id', userIds);

    const userMap = new Map(users?.map((u: DbUser) => [u.id, u]) || []);

    return data.map((w: DbWhisper) => {
      const user = userMap.get(w.user_id) as DbUser | undefined;
      return transformWhisper({
        ...w,
        theme_name: themeName,
        username: user?.username,
        display_name: user?.display_name,
        users: user,
      });
    });
  },
};

// AI transformation service (placeholder)
const transformText = async (text: string): Promise<string> => {
  // TODO: Replace with actual AI service (OpenAI, Gemini, etc.)
  const transformations = [
    `Like whispers in the wind, "${text}" dances through eternity`,
    `In the garden of thoughts, "${text}" blooms into poetry`,
    `Through cosmic lens, "${text}" becomes stardust symphony`,
    `Where words meet soul, "${text}" transforms into pure emotion`,
    `From depths unknown, "${text}" emerges as crystallized feeling`,
  ];
  
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return transformations[Math.floor(Math.random() * transformations.length)];
};