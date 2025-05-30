// API service that integrates with Clerk authentication
import { supabase } from '../config/supabase-rest-only-fixed';
import { Whisper, ChainResponse, User, Theme } from '../types';
import { useAuth } from '@clerk/clerk-expo';

// Get the current user from Clerk context
let getCurrentUserFromContext: (() => string | null) | null = null;

export const setAuthContext = (authGetter: () => string | null) => {
  getCurrentUserFromContext = authGetter;
};

const getCurrentUserId = (): string | null => {
  if (getCurrentUserFromContext) {
    return getCurrentUserFromContext();
  }
  console.warn('Auth context not set. Call setAuthContext in your app initialization.');
  return null;
};

// Transform database response to app types
const transformWhisper = (dbWhisper: any, currentUserId?: string | null): Whisper => ({
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
  // Authentication - handled by Clerk, these are just for compatibility
  signUp: async (email: string, password: string, username?: string): Promise<User> => {
    throw new Error('Use Clerk authentication directly');
  },

  signIn: async (email: string, password: string): Promise<User> => {
    throw new Error('Use Clerk authentication directly');
  },

  signInAnonymously: async (): Promise<User> => {
    throw new Error('Use Clerk authentication directly');
  },

  // Whispers
  getWhispers: async (sortBy: string = 'trending'): Promise<Whisper[]> => {
    const currentUserId = getCurrentUserId();
    
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
      const themeIds = [...new Set(data.map(w => w.theme_id).filter(Boolean))];
      const userIds = [...new Set(data.map(w => w.user_id).filter(Boolean))];

      // Fetch themes and users
      const [themesResult, usersResult, likesResult] = await Promise.all([
        themeIds.length > 0 ? supabase.from('themes').select('id, name, color').in('id', themeIds) : null,
        userIds.length > 0 ? supabase.from('users').select('id, username, display_name').in('id', userIds) : null,
        currentUserId ? supabase.from('likes').select('whisper_id').eq('user_id', currentUserId) : null
      ]);

      const themeMap = new Map(themesResult?.data?.map(t => [t.id, t]) || []);
      const userMap = new Map(usersResult?.data?.map(u => [u.id, u]) || []);
      const likedWhisperIds = new Set(likesResult?.data?.map(l => l.whisper_id) || []);

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
          is_liked: likedWhisperIds.has(w.id),
        }, currentUserId);
      });
    }

    return [];
  },

  getWhisperById: async (id: string): Promise<Whisper | null> => {
    const currentUserId = getCurrentUserId();
    
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
      // Fetch related data
      const [themeResult, userResult, likeResult] = await Promise.all([
        data.theme_id ? supabase.from('themes').select('id, name, color').eq('id', data.theme_id).single() : null,
        supabase.from('users').select('id, username, display_name').eq('id', data.user_id).single(),
        currentUserId ? supabase.from('likes').select('id').eq('whisper_id', id).eq('user_id', currentUserId).single() : null
      ]);

      return transformWhisper({
        ...data,
        theme_name: themeResult?.data?.name,
        themes: themeResult?.data,
        username: userResult?.data?.username,
        display_name: userResult?.data?.display_name,
        users: userResult?.data,
        is_liked: !!likeResult?.data,
      }, currentUserId);
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
    const userId = providedUserId || getCurrentUserId();
    if (!userId) {
      throw new Error('User must be authenticated to like whispers');
    }

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
      return false; // Now unliked
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
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('User must be authenticated to create chain responses');
    }

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

    // Fetch user data
    const { data: userData } = await supabase
      .from('users')
      .select('username, display_name')
      .eq('id', userId)
      .single();

    return transformChainResponse({
      ...data,
      username: userData?.username,
      display_name: userData?.display_name,
    });
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
    const filtered = data?.filter(w => 
      w.original_text.toLowerCase().includes(query.toLowerCase()) ||
      w.transformed_text.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 20) || [];

    if (filtered.length > 0) {
      const themeIds = [...new Set(filtered.map(w => w.theme_id).filter(Boolean))];
      const userIds = [...new Set(filtered.map(w => w.user_id).filter(Boolean))];

      // Fetch related data
      const [themesResult, usersResult, likesResult] = await Promise.all([
        themeIds.length > 0 ? supabase.from('themes').select('id, name, color').in('id', themeIds) : null,
        userIds.length > 0 ? supabase.from('users').select('id, username, display_name').in('id', userIds) : null,
        currentUserId ? supabase.from('likes').select('whisper_id').eq('user_id', currentUserId) : null
      ]);

      const themeMap = new Map(themesResult?.data?.map(t => [t.id, t]) || []);
      const userMap = new Map(usersResult?.data?.map(u => [u.id, u]) || []);
      const likedWhisperIds = new Set(likesResult?.data?.map(l => l.whisper_id) || []);

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
          is_liked: likedWhisperIds.has(w.id),
        }, currentUserId);
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