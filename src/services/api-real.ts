import { supabase } from '../config/supabase-rest-only-fixed';
import { Whisper, ChainResponse, User, Theme } from '../types';
import { getCurrentUserId } from './mock-auth';

// Transform database response to app types
const transformWhisper = (dbWhisper: any, currentUserId?: string): Whisper => ({
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

const transformChainResponse = (dbResponse: any): ChainResponse => ({
  id: dbResponse.id,
  whisperId: dbResponse.whisper_id,
  userId: dbResponse.user_id,
  originalText: dbResponse.original_text,
  transformedText: dbResponse.transformed_text,
  createdAt: new Date(dbResponse.created_at),
  username: dbResponse.users?.username || 'anonymous',
  displayName: dbResponse.users?.display_name || 'Anonymous',
});

export const api = {
  // Authentication - using mock for now since we're not doing real auth
  signUp: async (email: string, password: string, username?: string): Promise<User> => {
    // For testing, return a mock user
    return {
      id: getCurrentUserId(),
      email,
      username: username || 'testuser',
      isAnonymous: false,
      displayName: username || 'Test User',
      createdAt: new Date(),
    };
  },

  signIn: async (email: string, password: string): Promise<User> => {
    // For testing, return the first user
    return {
      id: getCurrentUserId(),
      email,
      username: 'moonwhisperer',
      isAnonymous: false,
      displayName: 'Luna Starlight',
      createdAt: new Date(),
    };
  },

  signInAnonymously: async (): Promise<User> => {
    return {
      id: '550e8400-e29b-41d4-a716-446655440003',
      username: 'anonymous',
      isAnonymous: true,
      displayName: 'Anonymous Poet',
      createdAt: new Date(),
    };
  },

  // Whispers
  getWhispers: async (sortBy: string = 'trending'): Promise<Whisper[]> => {
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

    // Fetch themes and users separately
    if (data && data.length > 0) {
      const themeIds = [...new Set(data.map(w => w.theme_id).filter(Boolean))];
      const userIds = [...new Set(data.map(w => w.user_id).filter(Boolean))];

      // Fetch themes
      const { data: themes } = await supabase
        .from('themes')
        .select('id, name, color')
        .in('id', themeIds);

      // Fetch users
      const { data: users } = await supabase
        .from('users')
        .select('id, username, display_name')
        .in('id', userIds);

      // Create lookup maps
      const themeMap = new Map(themes?.map(t => [t.id, t]) || []);
      const userMap = new Map(users?.map(u => [u.id, u]) || []);

      // Transform with joined data
      return data.map(w => {
        const theme = themeMap.get(w.theme_id);
        const user = userMap.get(w.user_id);
        return transformWhisper({
          ...w,
          theme_name: theme?.name,
          themes: theme,
          username: user?.username,
          display_name: user?.display_name,
          users: user,
        });
      });
    }

    return [];
  },

  getWhisperById: async (id: string): Promise<Whisper | null> => {
    const { data, error } = await supabase
      .from('whispers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching whisper:', error);
      return null;
    }

    if (data) {
      // Fetch theme and user
      const [themeResult, userResult] = await Promise.all([
        data.theme_id ? supabase.from('themes').select('id, name, color').eq('id', data.theme_id).single() : null,
        supabase.from('users').select('id, username, display_name').eq('id', data.user_id).single()
      ]);

      return transformWhisper({
        ...data,
        theme_name: themeResult?.data?.name,
        themes: themeResult?.data,
        username: userResult?.data?.username,
        display_name: userResult?.data?.display_name,
        users: userResult?.data,
      });
    }

    return null;
  },

  createWhisper: async (originalText: string, theme?: string): Promise<Whisper> => {
    // For testing, use a hardcoded user ID
    const userId = getCurrentUserId();

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

    const { data, error } = await supabase
      .from('whispers')
      .insert({
        user_id: userId,
        original_text: originalText,
        transformed_text: transformedText,
        theme_id: themeId,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating whisper:', error);
      throw error;
    }

    return transformWhisper(data);
  },

  likeWhisper: async (whisperId: string): Promise<void> => {
    // For testing, use a hardcoded user ID
    const userId = getCurrentUserId();

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('whisper_id', whisperId)
      .eq('user_id', userId)
      .single();

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('whisper_id', whisperId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error unliking:', error);
        throw error;
      }
    } else {
      // Like
      const { error } = await supabase
        .from('likes')
        .insert({
          whisper_id: whisperId,
          user_id: userId,
        });

      if (error) {
        console.error('Error liking:', error);
        throw error;
      }
    }
  },

  // Alias for compatibility
  toggleLike: async (whisperId: string, userId?: string): Promise<boolean> => {
    // For testing, use a hardcoded user ID
    const actualUserId = userId || getCurrentUserId();

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('whisper_id', whisperId)
      .eq('user_id', actualUserId)
      .single();

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('whisper_id', whisperId)
        .eq('user_id', actualUserId);

      if (error) {
        console.error('Error unliking:', error);
        throw error;
      }
      return false; // Now unliked
    } else {
      // Like
      const { error } = await supabase
        .from('likes')
        .insert({
          whisper_id: whisperId,
          user_id: actualUserId,
        });

      if (error) {
        console.error('Error liking:', error);
        throw error;
      }
      return true; // Now liked
    }
  },

  // Chain responses
  getChainResponses: async (whisperId: string): Promise<ChainResponse[]> => {
    const { data, error } = await supabase
      .from('chain_responses')
      .select('*')
      .eq('whisper_id', whisperId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching chain responses:', error);
      return [];
    }

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(r => r.user_id).filter(Boolean))];
      
      // Fetch users
      const { data: users } = await supabase
        .from('users')
        .select('id, username, display_name')
        .in('id', userIds);

      const userMap = new Map(users?.map(u => [u.id, u]) || []);

      return data.map(r => {
        const user = userMap.get(r.user_id);
        return transformChainResponse({
          ...r,
          username: user?.username,
          display_name: user?.display_name,
          users: user,
        });
      });
    }

    return [];
  },

  createChainResponse: async (whisperId: string, originalText: string): Promise<ChainResponse> => {
    // For testing, use a hardcoded user ID
    const userId = getCurrentUserId();

    // Transform text using AI
    const transformedText = await transformText(originalText);

    const { data, error } = await supabase
      .from('chain_responses')
      .insert({
        whisper_id: whisperId,
        user_id: userId,
        original_text: originalText,
        transformed_text: transformedText,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating chain response:', error);
      throw error;
    }

    return transformChainResponse(data);
  },

  // Search
  searchWhispers: async (query: string): Promise<Whisper[]> => {
    // For simple search, we'll fetch whispers and manually filter
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
    const filtered = data?.filter(w => 
      w.original_text.toLowerCase().includes(query.toLowerCase()) ||
      w.transformed_text.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 20) || [];

    if (filtered.length > 0) {
      const themeIds = [...new Set(filtered.map(w => w.theme_id).filter(Boolean))];
      const userIds = [...new Set(filtered.map(w => w.user_id).filter(Boolean))];

      // Fetch themes and users
      const [themesResult, usersResult] = await Promise.all([
        themeIds.length > 0 ? supabase.from('themes').select('id, name, color').in('id', themeIds) : null,
        userIds.length > 0 ? supabase.from('users').select('id, username, display_name').in('id', userIds) : null
      ]);

      const themeMap = new Map(themesResult?.data?.map(t => [t.id, t]) || []);
      const userMap = new Map(usersResult?.data?.map(u => [u.id, u]) || []);

      return filtered.map(w => {
        const theme = themeMap.get(w.theme_id);
        const user = userMap.get(w.user_id);
        return transformWhisper({
          ...w,
          theme_name: theme?.name,
          themes: theme,
          username: user?.username,
          display_name: user?.display_name,
          users: user,
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

    return data?.map(theme => ({
      id: theme.id,
      name: theme.name,
      description: theme.description || '',
      accentColor: theme.color,
      backgroundColor: '#1a1a2e',
      gradient: [theme.color, '#1a1a2e'],
    })) || [];
  },

  // User Profile
  getUserProfile: async (userId: string): Promise<any> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return {
      ...data,
      totalWhispers: data?.total_whispers || 0,
      totalLikesReceived: data?.total_likes_received || 0,
      followersCount: data?.followers_count || 0,
      followingCount: data?.following_count || 0,
    };
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