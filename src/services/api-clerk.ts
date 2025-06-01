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
  ai_hashtags?: string[];
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
        .eq('is_published', true)
        .single();

      console.log('Whisper query result:');
      console.log('- Data:', data);
      console.log('- Error:', error);

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

      // Fetch related data with error handling for each
      const [themeResult, userResult, likeResult] = await Promise.all([
        data.theme_id 
          ? supabase.from('themes').select('id, name, color').eq('id', data.theme_id).single()
          : Promise.resolve({ data: null, error: null }),
        supabase.from('users').select('id, username, display_name').eq('id', data.user_id).single(),
        currentUserId 
          ? supabase.from('likes').select('id').eq('whisper_id', id).eq('user_id', currentUserId).maybeSingle()
          : Promise.resolve({ data: null, error: null })
      ]);

      // Log any errors but don't fail the whole request
      if (themeResult?.error) {
        console.warn('Error fetching theme:', themeResult.error);
      }
      if (userResult?.error) {
        console.warn('Error fetching user:', userResult.error);
      }
      if (likeResult?.error) {
        console.warn('Error fetching like status:', likeResult.error);
      }

      const themeData = themeResult?.data as { id: string; name: string; color: string } | null;
      const userData = userResult?.data as { id: string; username: string; display_name: string } | null;

      return transformWhisper({
        ...data,
        theme_name: themeData?.name || 'Unknown',
        themes: themeData,
        username: userData?.username || 'anonymous',
        display_name: userData?.display_name || 'Anonymous',
        users: userData,
        is_liked: !!likeResult?.data,
      });
    } catch (error) {
      console.error('Unexpected error in getWhisperById:', error);
      return null;
    }
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
    const { transformed, hashtags } = await transformText(originalText);

    // First insert the whisper
    const { error: insertError } = await supabase
      .from('whispers')
      .insert({
        user_id: userId,
        original_text: originalText,
        transformed_text: transformed,
        theme_id: themeId,
        ai_hashtags: hashtags,
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
      const { transformed: transformedText } = await transformText(originalText);

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

  getTrendingHashtags: async (limit: number = 10): Promise<{ tag: string; count: number }[]> => {
    try {
      console.log('Fetching trending hashtags...');
      
      // First try to get real data from the database
      const { data, error } = await supabase.rpc('get_trending_hashtags', {
        days_back: 7,
        limit_count: limit
      });

      if (!error && data && data.length > 0) {
        // We have real data!
        return data.map((item: any) => ({
          tag: item.hashtag,
          count: parseInt(item.count) || 0,
        }));
      }

      // If RPC function doesn't exist, try direct query
      if (error && error.message && error.message.includes('function')) {
        console.log('RPC function not found, trying direct query');
        
        // Get all whispers from last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { data: whispers } = await supabase
          .from('whispers')
          .select('ai_hashtags')
          .gte('created_at', sevenDaysAgo.toISOString())
          .eq('is_published', true)
          .not('ai_hashtags', 'is', null);

        if (whispers && whispers.length > 0) {
          // Count hashtags manually
          const hashtagCounts: Record<string, number> = {};
          
          whispers.forEach((w: any) => {
            if (w.ai_hashtags && Array.isArray(w.ai_hashtags)) {
              w.ai_hashtags.forEach((tag: string) => {
                hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
              });
            }
          });

          // Convert to array and sort
          return Object.entries(hashtagCounts)
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
        }
      }

      // Fallback: Generate dynamic hashtags based on time
      console.log('Using fallback hashtags');
      const hour = new Date().getHours();
      const isLateNight = hour >= 22 || hour <= 3;
      const isEvening = hour >= 17 && hour <= 21;
      const isMorning = hour >= 5 && hour <= 11;
      
      // Dynamic hashtags based on time
      const dynamicHashtags: { tag: string; count: number }[] = [];
      
      if (isLateNight) {
        dynamicHashtags.push(
          { tag: '#LateNightThoughts', count: Math.floor(Math.random() * 50) + 70 },
          { tag: '#MidnightConfessions', count: Math.floor(Math.random() * 30) + 40 },
          { tag: '#Insomnia', count: Math.floor(Math.random() * 20) + 15 }
        );
      } else if (isEvening) {
        dynamicHashtags.push(
          { tag: '#EveningReflections', count: Math.floor(Math.random() * 40) + 50 },
          { tag: '#DayRecap', count: Math.floor(Math.random() * 25) + 30 },
          { tag: '#SunsetThoughts', count: Math.floor(Math.random() * 20) + 20 }
        );
      } else if (isMorning) {
        dynamicHashtags.push(
          { tag: '#MorningMotivation', count: Math.floor(Math.random() * 35) + 45 },
          { tag: '#NewDay', count: Math.floor(Math.random() * 25) + 35 },
          { tag: '#EarlyMorningWhispers', count: Math.floor(Math.random() * 15) + 20 }
        );
      }
      
      // Always trending hashtags
      const alwaysTrending = [
        { tag: '#SoulSearching', count: Math.floor(Math.random() * 20) + 35 },
        { tag: '#InnerVoice', count: Math.floor(Math.random() * 20) + 30 },
        { tag: '#QuietMoments', count: Math.floor(Math.random() * 15) + 25 },
        { tag: '#DeepFeels', count: Math.floor(Math.random() * 15) + 20 },
        { tag: '#RandomWhispers', count: Math.floor(Math.random() * 10) + 15 },
        { tag: '#BriefThoughts', count: Math.floor(Math.random() * 10) + 10 },
      ];
      
      // Combine and sort by count
      const allHashtags = [...dynamicHashtags, ...alwaysTrending]
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
      
      return allHashtags;
    } catch (error) {
      console.error('Error in getTrendingHashtags:', error);
      // Return fallback hashtags
      return [
        { tag: '#LateNightThoughts', count: 86 },
        { tag: '#MidnightConfessions', count: 54 },
        { tag: '#SoulSearching', count: 42 },
        { tag: '#InnerVoice', count: 38 },
        { tag: '#QuietMoments', count: 29 },
        { tag: '#DeepFeels', count: 23 },
      ];
    }
  },

  searchWhispersByHashtag: async (hashtag: string): Promise<Whisper[]> => {
    try {
      // Normalize the hashtag
      const normalizedTag = hashtag.toLowerCase().startsWith('#') 
        ? hashtag.toLowerCase() 
        : `#${hashtag.toLowerCase()}`;

      console.log('Searching for whispers with hashtag:', normalizedTag);

      // Since we know the ai_hashtags column might not exist or might cause errors,
      // let's go straight to the fallback approach
      const searchTerm = normalizedTag.substring(1); // Remove # for text search
      
      // Get all whispers
      const { data: allWhispers, error } = await supabase
        .from('whispers')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching whispers:', error);
        return [];
      }

      if (!allWhispers || allWhispers.length === 0) {
        return [];
      }

      // Filter whispers that match the hashtag criteria
      let whispers = allWhispers.filter((w: DbWhisper) => {
        const originalText = (w.original_text || '').toLowerCase();
        const transformedText = (w.transformed_text || '').toLowerCase();
        const createdHour = new Date(w.created_at).getHours();
        
        // Specific filtering logic for each hashtag
        switch(searchTerm) {
          case 'briefthoughts':
            // Short whispers (less than 100 characters)
            return w.original_text && w.original_text.length < 100;
            
          case 'latenightthoughts':
            // Created between 10 PM and 4 AM
            return createdHour >= 22 || createdHour <= 4;
            
          case 'earlymorningwhispers':
            // Created between 4 AM and 7 AM
            return createdHour >= 4 && createdHour <= 7;
            
          case 'eveningreflections':
            // Created between 5 PM and 9 PM
            return createdHour >= 17 && createdHour <= 21;
            
          case 'midnightconfessions':
            // Created around midnight (11 PM - 1 AM) AND contains confession-like content
            return (createdHour >= 23 || createdHour <= 1) && 
                   (originalText.includes('confess') || originalText.includes('secret') || 
                    originalText.includes('truth') || originalText.includes('admit'));
            
          case 'soulsearching':
            // Contains soul-searching keywords
            return originalText.includes('soul') || originalText.includes('spirit') || 
                   originalText.includes('meaning') || originalText.includes('purpose') ||
                   originalText.includes('why') || originalText.includes('searching');
            
          case 'deepfeels':
            // Contains emotional keywords
            return originalText.includes('feel') || originalText.includes('emotion') || 
                   originalText.includes('heart') || originalText.includes('deep') ||
                   transformedText.includes('emotion') || transformedText.includes('feeling');
            
          case 'quietmoments':
            // Contains peaceful keywords
            return originalText.includes('quiet') || originalText.includes('silence') || 
                   originalText.includes('peace') || originalText.includes('calm') ||
                   originalText.includes('still') || originalText.includes('serene');
            
          case 'innervoice':
            // Contains voice/speaking keywords
            return originalText.includes('voice') || originalText.includes('speak') || 
                   originalText.includes('say') || originalText.includes('tell') ||
                   originalText.includes('whisper') || originalText.includes('hear');
            
          case 'dreamscape':
            // Contains dream-related keywords
            return originalText.includes('dream') || originalText.includes('sleep') || 
                   originalText.includes('night') || originalText.includes('imagine') ||
                   originalText.includes('vision') || originalText.includes('fantasy');
            
          case 'emotionalrelease':
            // Contains release/cathartic keywords
            return originalText.includes('cry') || originalText.includes('tear') || 
                   originalText.includes('release') || originalText.includes('let go') ||
                   originalText.includes('free') || originalText.includes('burden');
            
          case 'nostalgia':
            // Contains memory keywords
            return originalText.includes('remember') || originalText.includes('memory') || 
                   originalText.includes('past') || originalText.includes('miss') ||
                   originalText.includes('used to') || originalText.includes('ago');
            
          case 'hopefulwhispers':
            // Contains hope keywords
            return originalText.includes('hope') || originalText.includes('wish') || 
                   originalText.includes('future') || originalText.includes('better') ||
                   originalText.includes('tomorrow') || originalText.includes('someday');
            
          case 'joyfulmoments':
            // Contains joy keywords
            return originalText.includes('happy') || originalText.includes('joy') || 
                   originalText.includes('smile') || originalText.includes('laugh') ||
                   originalText.includes('glad') || originalText.includes('wonderful');
            
          case 'deepcontemplation':
            // Long whispers (more than 200 characters)
            return w.original_text && w.original_text.length > 200;
            
          case 'randomwhispers':
            // Medium length whispers without specific themes
            return w.original_text && 
                   w.original_text.length >= 100 && 
                   w.original_text.length <= 200;
            
          default:
            // For any other hashtags, try generic keyword search
            return originalText.includes(searchTerm) || transformedText.includes(searchTerm);
        }
      });

      // Only return filtered results, don't fall back to all whispers
      whispers = whispers.slice(0, 20);

      // Process whispers with related data
      const currentUserId = getCurrentUserId();
      const themeIds = [...new Set(whispers.map((w: DbWhisper) => w.theme_id).filter(Boolean))];
      const userIds = [...new Set(whispers.map((w: DbWhisper) => w.user_id).filter(Boolean))];

      const [themesResult, usersResult, likesResult] = await Promise.all([
        themeIds.length > 0 ? supabase.from('themes').select('id, name, color').in('id', themeIds) : null,
        userIds.length > 0 ? supabase.from('users').select('id, username, display_name').in('id', userIds) : null,
        currentUserId ? supabase.from('likes').select('whisper_id').eq('user_id', currentUserId) : null
      ]);

      const themeMap = new Map(themesResult?.data?.map((t: DbTheme) => [t.id, t]) || []);
      const userMap = new Map(usersResult?.data?.map((u: DbUser) => [u.id, u]) || []);
      const likedWhisperIds = new Set(likesResult?.data?.map((l: DbLike) => l.whisper_id) || []);

      return whispers.map((w: DbWhisper) => {
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
    } catch (error) {
      console.error('Error searching whispers by hashtag:', error);
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

  // User Profile & Stats
  getUserStats: async (userId?: string): Promise<{ whispersCount: number; chainsStarted: number; achievementsCount: number }> => {
    const uid = userId || getCurrentUserId();
    if (!uid) {
      return { whispersCount: 0, chainsStarted: 0, achievementsCount: 0 };
    }

    try {
      // Get whispers count
      const { data: whispers } = await supabase
        .from('whispers')
        .select('id')
        .eq('user_id', uid)
        .eq('is_published', true);

      // Get chains started (whispers with chain responses)
      const { data: chainsData } = await supabase
        .from('chain_responses')
        .select('whisper_id')
        .eq('user_id', uid);
      
      const uniqueChains = new Set(chainsData?.map(c => c.whisper_id) || []);

      // Calculate achievements (based on actual data)
      let achievementsCount = 0;
      const whispersCount = whispers?.length || 0;
      
      if (whispersCount >= 1) achievementsCount++; // First Whisper
      if (whispersCount >= 10) achievementsCount++; // 10 Whispers Shared
      if (uniqueChains.size >= 1) achievementsCount++; // Thread Starter
      if (uniqueChains.size >= 5) achievementsCount++; // Community Helper

      return {
        whispersCount,
        chainsStarted: uniqueChains.size,
        achievementsCount,
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return { whispersCount: 0, chainsStarted: 0, achievementsCount: 0 };
    }
  },

  getUserWhispers: async (userId?: string): Promise<Whisper[]> => {
    const uid = userId || getCurrentUserId();
    if (!uid) return [];

    try {
      const { data, error } = await supabase
        .from('whispers')
        .select('*')
        .eq('user_id', uid)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user whispers:', error);
        return [];
      }

      if (!data || data.length === 0) return [];

      // Get theme data
      const themeIds = [...new Set(data.map((w: DbWhisper) => w.theme_id).filter(Boolean))];
      const { data: themes } = await supabase
        .from('themes')
        .select('id, name, color')
        .in('id', themeIds);

      const themeMap = new Map(themes?.map((t: DbTheme) => [t.id, t]) || []);

      return data.map((w: DbWhisper) => {
        const theme = themeMap.get(w.theme_id || '') as DbTheme | undefined;
        return transformWhisper({
          ...w,
          theme_name: theme?.name,
          themes: theme,
        });
      });
    } catch (error) {
      console.error('Error in getUserWhispers:', error);
      return [];
    }
  },

  getUserChains: async (userId?: string): Promise<ChainResponse[]> => {
    const uid = userId || getCurrentUserId();
    if (!uid) return [];

    try {
      const { data, error } = await supabase
        .from('chain_responses')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user chains:', error);
        return [];
      }

      if (!data || data.length === 0) return [];

      return data.map((r: DbChainResponse) => transformChainResponse(r));
    } catch (error) {
      console.error('Error in getUserChains:', error);
      return [];
    }
  },

  deleteAccount: async (): Promise<void> => {
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('User must be authenticated to delete account');
    }

    try {
      // Delete in order to respect foreign key constraints
      // 1. Delete likes
      await supabase
        .from('likes')
        .delete()
        .eq('user_id', userId);

      // 2. Delete chain responses
      await supabase
        .from('chain_responses')
        .delete()
        .eq('user_id', userId);

      // 3. Delete whispers
      await supabase
        .from('whispers')
        .delete()
        .eq('user_id', userId);

      // 4. Delete user record
      await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      console.log('Account deletion completed');
    } catch (error) {
      console.error('Error deleting account:', error);
      throw new Error('Failed to delete account data');
    }
  },

  updateUsername: async (newUsername: string): Promise<void> => {
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('User must be authenticated to update username');
    }

    try {
      // Check if username is already taken
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', newUsername)
        .neq('id', userId)
        .single();

      if (existingUser) {
        throw new Error('Username is already taken');
      }

      // Update username in database
      const { error } = await supabase
        .from('users')
        .update({ username: newUsername })
        .eq('id', userId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error updating username:', error);
      throw error;
    }
  },
};

// AI transformation service (placeholder)
const transformText = async (text: string): Promise<{ transformed: string; hashtags: string[] }> => {
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
  
  const transformed = transformations[Math.floor(Math.random() * transformations.length)];
  const hashtags = generateHashtagsFromText(text);
  
  return { transformed, hashtags };
};

// Generate hashtags based on text content and context
const generateHashtagsFromText = (text: string): string[] => {
  const hashtags: string[] = [];
  const lowerText = text.toLowerCase();
  
  // Time-based hashtags
  const hour = new Date().getHours();
  if (hour >= 22 || hour <= 3) {
    hashtags.push('#LateNightThoughts');
  } else if (hour >= 4 && hour <= 6) {
    hashtags.push('#EarlyMorningWhispers');
  } else if (hour >= 17 && hour <= 19) {
    hashtags.push('#EveningReflections');
  }
  
  // Emotion-based hashtags
  if (lowerText.includes('love') || lowerText.includes('heart')) {
    hashtags.push('#LoveWhispers');
  }
  if (lowerText.includes('dream') || lowerText.includes('sleep')) {
    hashtags.push('#DreamScape');
  }
  if (lowerText.includes('sad') || lowerText.includes('cry') || lowerText.includes('tears')) {
    hashtags.push('#EmotionalRelease');
  }
  if (lowerText.includes('happy') || lowerText.includes('joy') || lowerText.includes('smile')) {
    hashtags.push('#JoyfulMoments');
  }
  if (lowerText.includes('miss') || lowerText.includes('memory') || lowerText.includes('remember')) {
    hashtags.push('#Nostalgia');
  }
  if (lowerText.includes('hope') || lowerText.includes('wish') || lowerText.includes('future')) {
    hashtags.push('#HopefulWhispers');
  }
  if (lowerText.includes('fear') || lowerText.includes('scared') || lowerText.includes('afraid')) {
    hashtags.push('#FacingFears');
  }
  
  // Content-based hashtags
  if (lowerText.includes('confession') || lowerText.includes('secret')) {
    hashtags.push('#SecretConfessions');
  }
  if (lowerText.includes('soul') || lowerText.includes('spirit')) {
    hashtags.push('#SoulSearching');
  }
  if (lowerText.includes('quiet') || lowerText.includes('silence') || lowerText.includes('peace')) {
    hashtags.push('#QuietMoments');
  }
  if (lowerText.includes('feeling') || lowerText.includes('emotion')) {
    hashtags.push('#DeepFeels');
  }
  if (lowerText.includes('voice') || lowerText.includes('speak') || lowerText.includes('say')) {
    hashtags.push('#InnerVoice');
  }
  
  // If no specific hashtags match, add general ones based on length/mood
  if (hashtags.length === 0) {
    if (text.length < 50) {
      hashtags.push('#BriefThoughts');
    } else if (text.length > 200) {
      hashtags.push('#DeepContemplation');
    } else {
      hashtags.push('#RandomWhispers');
    }
  }
  
  // Limit to 3 hashtags maximum
  return hashtags.slice(0, 3);
};