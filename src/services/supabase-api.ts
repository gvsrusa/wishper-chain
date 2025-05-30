import { supabase } from '../config/supabase-simple';
import { Whisper, ChainResponse, User, Theme } from '../types';

// Transform database response to app types
const transformWhisper = (dbWhisper: any): Whisper => ({
  id: dbWhisper.id,
  userId: dbWhisper.user_id,
  originalText: dbWhisper.original_text,
  transformedText: dbWhisper.transformed_text,
  theme: dbWhisper.themes?.name,
  likes: dbWhisper.likes_count,
  chainCount: dbWhisper.chain_count,
  createdAt: new Date(dbWhisper.created_at),
  isLiked: false, // Will be set separately based on user's likes
});

const transformChainResponse = (dbResponse: any): ChainResponse => ({
  id: dbResponse.id,
  whisperId: dbResponse.whisper_id,
  userId: dbResponse.user_id,
  originalText: dbResponse.original_text,
  transformedText: dbResponse.transformed_text,
  createdAt: new Date(dbResponse.created_at),
});

export const supabaseApi = {
  // Authentication
  signUp: async (email: string, password: string, username?: string): Promise<User> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    // Create user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: data.user?.id,
        email,
        username,
        display_name: username || `User${Math.floor(Math.random() * 10000)}`,
        is_anonymous: false,
      })
      .select()
      .single();

    if (profileError) throw profileError;

    return {
      id: profile.id,
      email: profile.email,
      username: profile.username,
      isAnonymous: profile.is_anonymous,
      displayName: profile.display_name,
      createdAt: new Date(profile.created_at),
    };
  },

  signIn: async (email: string, password: string): Promise<User> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) throw profileError;

    return {
      id: profile.id,
      email: profile.email,
      username: profile.username,
      isAnonymous: profile.is_anonymous,
      displayName: profile.display_name,
      createdAt: new Date(profile.created_at),
    };
  },

  signInAnonymously: async (): Promise<User> => {
    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) throw error;

    // Create anonymous user profile
    const displayName = `Anonymous${Math.floor(Math.random() * 10000)}`;
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: data.user?.id,
        display_name: displayName,
        is_anonymous: true,
      })
      .select()
      .single();

    if (profileError) throw profileError;

    return {
      id: profile.id,
      username: profile.username,
      isAnonymous: profile.is_anonymous,
      displayName: profile.display_name,
      createdAt: new Date(profile.created_at),
    };
  },

  // Whispers
  getWhispers: async (sortBy: string = 'trending'): Promise<Whisper[]> => {
    let query = supabase
      .from('whispers')
      .select(`
        *,
        themes(name, color)
      `);

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

    if (error) throw error;

    return data.map(transformWhisper);
  },

  getWhisperById: async (id: string): Promise<Whisper | null> => {
    const { data, error } = await supabase
      .from('whispers')
      .select(`
        *,
        themes(name, color)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return transformWhisper(data);
  },

  createWhisper: async (originalText: string, theme?: string): Promise<Whisper> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

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

    // Transform text using AI (placeholder - replace with actual AI service)
    const transformedText = await transformText(originalText);

    const { data, error } = await supabase
      .from('whispers')
      .insert({
        user_id: user.id,
        original_text: originalText,
        transformed_text: transformedText,
        theme_id: themeId,
      })
      .select(`
        *,
        themes(name, color)
      `)
      .single();

    if (error) throw error;

    return transformWhisper(data);
  },

  likeWhisper: async (whisperId: string): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('whisper_likes')
      .select('id')
      .eq('whisper_id', whisperId)
      .eq('user_id', user.id)
      .single();

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('whisper_likes')
        .delete()
        .eq('whisper_id', whisperId)
        .eq('user_id', user.id);

      if (error) throw error;
    } else {
      // Like
      const { error } = await supabase
        .from('whisper_likes')
        .insert({
          whisper_id: whisperId,
          user_id: user.id,
        });

      if (error) throw error;
    }
  },

  // Chain responses
  getChainResponses: async (whisperId: string): Promise<ChainResponse[]> => {
    const { data, error } = await supabase
      .from('chain_responses')
      .select('*')
      .eq('whisper_id', whisperId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data.map(transformChainResponse);
  },

  createChainResponse: async (whisperId: string, originalText: string): Promise<ChainResponse> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Transform text using AI
    const transformedText = await transformText(originalText);

    const { data, error } = await supabase
      .from('chain_responses')
      .insert({
        whisper_id: whisperId,
        user_id: user.id,
        original_text: originalText,
        transformed_text: transformedText,
      })
      .select()
      .single();

    if (error) throw error;

    return transformChainResponse(data);
  },

  // Search
  searchWhispers: async (query: string): Promise<Whisper[]> => {
    const { data, error } = await supabase
      .from('whispers')
      .select(`
        *,
        themes(name, color)
      `)
      .or(`original_text.ilike.%${query}%,transformed_text.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    return data.map(transformWhisper);
  },

  // Themes
  getThemes: async (): Promise<Theme[]> => {
    const { data, error } = await supabase
      .from('themes')
      .select(`
        *,
        whispers(count)
      `)
      .order('name');

    if (error) throw error;

    return data.map(theme => ({
      id: theme.id,
      name: theme.name,
      description: theme.description,
      accentColor: theme.accent_color || theme.color || '#6366f1',
      backgroundColor: theme.background_color || '#1a1a2e',
      gradient: theme.gradient_colors,
    }));
  },
};

// AI transformation service (placeholder)
const transformText = async (text: string): Promise<string> => {
  // TODO: Replace with actual AI service (OpenAI, Gemini, etc.)
  const transformations = [
    `Like poetry written by moonlight, ${text.toLowerCase()} becomes a symphony of silent understanding.`,
    `In whispered winds of consciousness, "${text}" transforms into ethereal beauty beyond words.`,
    `Through the lens of dreams, ${text.toLowerCase()} blooms into verses of the heart's deepest truths.`,
    `As starlight touches earth, "${text}" becomes a tapestry woven from threads of pure emotion.`,
    `From the depths of feeling, ${text.toLowerCase()} emerges as art painted with invisible brushstrokes.`,
  ];
  
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return transformations[Math.floor(Math.random() * transformations.length)];
};