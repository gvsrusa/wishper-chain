// Service to sync Clerk users with Supabase database
// TEMPORARY: Disabled to avoid WebSocket issues
import type { UserResource } from '@clerk/types';
import { User } from '../types';

export class ClerkDatabaseSync {
  /**
   * Sync a Clerk user to the Supabase database
   * Called after successful authentication
   */
  static async syncUser(clerkUser: UserResource): Promise<User> {
    // TEMPORARY: Return mock user data to avoid WebSocket issues
    return {
      id: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress || '',
      username: clerkUser.username || clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0],
      displayName: clerkUser.fullName || clerkUser.username || 'User',
      avatarUrl: clerkUser.imageUrl,
      isAnonymous: false,
      createdAt: new Date(),
    };
  }

  /**
   * Get user from database by Clerk ID
   */
  static async getUser(clerkUserId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_user_id', clerkUserId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        username: data.username,
        displayName: data.display_name,
        avatarUrl: data.avatar_url,
        isAnonymous: data.is_anonymous,
        createdAt: new Date(data.created_at),
      };
    } catch (error) {
      console.error('Error fetching user from database:', error);
      return null;
    }
  }

  /**
   * Update user profile in database
   */
  static async updateUserProfile(
    clerkUserId: string, 
    updates: {
      username?: string;
      displayName?: string;
      bio?: string;
      avatarUrl?: string;
    }
  ): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          username: updates.username,
          display_name: updates.displayName,
          bio: updates.bio,
          avatar_url: updates.avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('clerk_user_id', clerkUserId)
        .select()
        .single();

      if (error || !data) {
        throw error;
      }

      return {
        id: data.id,
        email: data.email,
        username: data.username,
        displayName: data.display_name,
        avatarUrl: data.avatar_url,
        isAnonymous: data.is_anonymous,
        createdAt: new Date(data.created_at),
      };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
  }
}