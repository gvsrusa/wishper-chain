// Main API service that works with Clerk authentication
// TEMPORARY: Using mock API to avoid WebSocket issues
export { api } from './api-mock';

// Transform database response to app types
const transformWhisper = (dbWhisper: any): Whisper => ({
  id: dbWhisper.id,
  userId: dbWhisper.user_id,
  originalText: dbWhisper.original_text,
  transformedText: dbWhisper.transformed_text,
  theme: dbWhisper.themes?.name || dbWhisper.theme,
  likes: dbWhisper.likes_count || 0,
  chainCount: dbWhisper.chain_count || 0,
  createdAt: new Date(dbWhisper.created_at),
  isLiked: false, // Will be set based on user's likes
});

const transformChainResponse = (dbResponse: any): ChainResponse => ({
  id: dbResponse.id,
  whisperId: dbResponse.whisper_id,
  userId: dbResponse.user_id,
  originalText: dbResponse.original_text,
  transformedText: dbResponse.transformed_text,
  createdAt: new Date(dbResponse.created_at),
});

export const api = {
  // Whisper operations
  getWhispers: async (sortBy: string = 'trending', userId?: string): Promise<Whisper[]> => {
    try {
      let query = supabase
        .from('whispers')
        .select(`
          *,
          themes (name, accent_color, background_color),
          users (username, display_name, avatar_url)
        `);

      // Apply sorting
      switch (sortBy) {
        case 'trending':
          query = query.order('likes_count', { ascending: false })
                      .order('chain_count', { ascending: false });
          break;
        case 'recent':
          query = query.order('created_at', { ascending: false });
          break;
        case 'following':
          if (userId) {
            // Get whispers from followed users
            const { data: following } = await supabase
              .from('follows')
              .select('following_id')
              .eq('follower_id', userId);
            
            const followingIds = following?.map(f => f.following_id) || [];
            query = query.in('user_id', followingIds);
          }
          query = query.order('created_at', { ascending: false });
          break;
      }

      const { data, error } = await query.limit(50);
      
      if (error) throw error;

      // Get user's likes if authenticated
      let userLikes: string[] = [];
      if (userId) {
        const { data: likes } = await supabase
          .from('likes')
          .select('whisper_id')
          .eq('user_id', userId);
        userLikes = likes?.map(l => l.whisper_id) || [];
      }

      return (data || []).map(whisper => ({
        ...transformWhisper(whisper),
        isLiked: userLikes.includes(whisper.id),
      }));
    } catch (error) {
      console.error('Error fetching whispers:', error);
      return [];
    }
  },

  getWhisperById: async (id: string, userId?: string): Promise<Whisper | null> => {
    try {
      const { data, error } = await supabase
        .from('whispers')
        .select(`
          *,
          themes (name, accent_color, background_color),
          users (username, display_name, avatar_url)
        `)
        .eq('id', id)
        .single();

      if (error || !data) return null;

      // Check if user liked this whisper
      let isLiked = false;
      if (userId) {
        const { data: like } = await supabase
          .from('likes')
          .select('id')
          .eq('whisper_id', id)
          .eq('user_id', userId)
          .single();
        isLiked = !!like;
      }

      return {
        ...transformWhisper(data),
        isLiked,
      };
    } catch (error) {
      console.error('Error fetching whisper:', error);
      return null;
    }
  },

  createWhisper: async (text: string, theme: string, userId: string): Promise<Whisper> => {
    try {
      // Get theme data
      const { data: themeData } = await supabase
        .from('themes')
        .select('id')
        .eq('name', theme)
        .single();

      const { data, error } = await supabase
        .from('whispers')
        .insert({
          user_id: userId,
          original_text: text,
          transformed_text: text, // In real app, this would be AI-transformed
          theme_id: themeData?.id,
          is_anonymous: false,
        })
        .select(`
          *,
          themes (name, accent_color, background_color),
          users (username, display_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      return transformWhisper(data);
    } catch (error) {
      console.error('Error creating whisper:', error);
      throw error;
    }
  },

  // Chain response operations
  getChainResponses: async (whisperId: string): Promise<ChainResponse[]> => {
    try {
      const { data, error } = await supabase
        .from('chain_responses')
        .select(`
          *,
          users (username, display_name, avatar_url)
        `)
        .eq('whisper_id', whisperId)
        .order('position', { ascending: true });

      if (error) throw error;

      return (data || []).map(transformChainResponse);
    } catch (error) {
      console.error('Error fetching chain responses:', error);
      return [];
    }
  },

  createChainResponse: async (
    whisperId: string, 
    text: string, 
    userId: string
  ): Promise<ChainResponse> => {
    try {
      // Get the last position in the chain
      const { data: lastResponse } = await supabase
        .from('chain_responses')
        .select('position')
        .eq('whisper_id', whisperId)
        .order('position', { ascending: false })
        .limit(1)
        .single();

      const position = (lastResponse?.position || 0) + 1;

      const { data, error } = await supabase
        .from('chain_responses')
        .insert({
          whisper_id: whisperId,
          user_id: userId,
          original_text: text,
          transformed_text: text, // In real app, this would be AI-transformed
          position,
        })
        .select(`
          *,
          users (username, display_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      return transformChainResponse(data);
    } catch (error) {
      console.error('Error creating chain response:', error);
      throw error;
    }
  },

  // Like operations
  toggleLike: async (whisperId: string, userId: string): Promise<boolean> => {
    try {
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
          .eq('id', existingLike.id);
        
        if (error) throw error;
        return false;
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({
            whisper_id: whisperId,
            user_id: userId,
          });
        
        if (error) throw error;
        return true;
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  },

  // Theme operations
  getThemes: async (): Promise<Theme[]> => {
    try {
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .order('name');

      if (error) throw error;

      return (data || []).map(theme => ({
        id: theme.id,
        name: theme.name,
        description: theme.description,
        accentColor: theme.accent_color,
        backgroundColor: theme.background_color,
        gradient: theme.gradient_colors,
      }));
    } catch (error) {
      console.error('Error fetching themes:', error);
      return [];
    }
  },

  // User operations (using Clerk sync)
  getUserProfile: async (userId: string) => {
    return ClerkDatabaseSync.getUser(userId);
  },

  updateUserProfile: async (
    userId: string,
    updates: {
      username?: string;
      displayName?: string;
      bio?: string;
      avatarUrl?: string;
    }
  ) => {
    return ClerkDatabaseSync.updateUserProfile(userId, updates);
  },

  // Search operations
  searchWhispers: async (query: string): Promise<Whisper[]> => {
    try {
      const { data, error } = await supabase
        .from('whispers')
        .select(`
          *,
          themes (name, accent_color, background_color),
          users (username, display_name, avatar_url)
        `)
        .or(`original_text.ilike.%${query}%,transformed_text.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return (data || []).map(transformWhisper);
    } catch (error) {
      console.error('Error searching whispers:', error);
      return [];
    }
  },

  // Follow operations
  toggleFollow: async (followerId: string, followingId: string): Promise<boolean> => {
    try {
      // Check if already following
      const { data: existingFollow } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

      if (existingFollow) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('id', existingFollow.id);
        
        if (error) throw error;
        return false;
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: followerId,
            following_id: followingId,
          });
        
        if (error) throw error;
        return true;
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      throw error;
    }
  },

  getFollowers: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          follower:users!follows_follower_id_fkey(
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('following_id', userId);

      if (error) throw error;

      return data?.map(f => f.follower) || [];
    } catch (error) {
      console.error('Error getting followers:', error);
      return [];
    }
  },

  getFollowing: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          following:users!follows_following_id_fkey(
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('follower_id', userId);

      if (error) throw error;

      return data?.map(f => f.following) || [];
    } catch (error) {
      console.error('Error getting following:', error);
      return [];
    }
  },
};