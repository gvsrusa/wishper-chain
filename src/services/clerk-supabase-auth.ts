// Clerk-Supabase Authentication Integration
// This service manages the sync between Clerk auth and Supabase database

import type { UserResource } from '@clerk/types';
import { supabase } from '../config/supabase-rest-only-fixed';
import { User } from '../types';

export class ClerkSupabaseAuth {
  /**
   * Create or update user in Supabase when they sign in with Clerk
   */
  static async syncUser(clerkUser: UserResource): Promise<User> {
    try {
      // Prepare user data
      const userData = {
        id: clerkUser.id, // Use Clerk ID as primary key
        clerk_user_id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || null,
        username: clerkUser.username || clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] || `user_${clerkUser.id.slice(-6)}`,
        display_name: clerkUser.fullName || clerkUser.firstName || clerkUser.username || 'Anonymous',
        first_name: clerkUser.firstName || null,
        last_name: clerkUser.lastName || null,
        avatar_url: clerkUser.imageUrl || null,
        is_anonymous: false, // Clerk users are not anonymous
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Check if user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', clerkUser.id)
        .single();

      let user;
      
      if (fetchError && fetchError.code === 'PGRST116') {
        // User doesn't exist, create new
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert(userData)
          .select()
          .single();

        if (insertError) {
          console.error('Error creating user:', insertError);
          throw insertError;
        }

        user = newUser;
      } else if (existingUser) {
        // User exists, update
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            email: userData.email,
            username: userData.username,
            display_name: userData.display_name,
            first_name: userData.first_name,
            last_name: userData.last_name,
            avatar_url: userData.avatar_url,
            last_seen: userData.last_seen,
            updated_at: userData.updated_at,
          })
          .eq('id', clerkUser.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating user:', updateError);
          throw updateError;
        }

        user = updatedUser;
      } else {
        throw new Error('Unexpected error fetching user');
      }

      // Return formatted user
      return {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        isAnonymous: user.is_anonymous,
        createdAt: new Date(user.created_at),
      };
    } catch (error) {
      console.error('Error syncing user with database:', error);
      
      // Return basic user data as fallback
      return {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        username: clerkUser.username || clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] || `user_${clerkUser.id.slice(-6)}`,
        displayName: clerkUser.fullName || clerkUser.firstName || clerkUser.username || 'Anonymous',
        avatarUrl: clerkUser.imageUrl,
        isAnonymous: false,
        createdAt: new Date(),
      };
    }
  }

  /**
   * Get the current user's ID for API calls
   * This is used by the API layer to identify the user
   */
  static getCurrentUserId(): string | null {
    // In a React Native app, we'd typically get this from the auth context
    // For now, return null and let the API layer handle it
    return null;
  }

  /**
   * Create an anonymous user in the database
   */
  static async createAnonymousUser(tempId: string): Promise<User> {
    const anonymousData = {
      id: tempId,
      clerk_user_id: tempId,
      username: `anon_${tempId.slice(-8)}`,
      display_name: 'Anonymous',
      is_anonymous: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('users')
      .insert(anonymousData)
      .select()
      .single();

    if (error) {
      console.error('Error creating anonymous user:', error);
      throw error;
    }

    return {
      id: data.id,
      email: '',
      username: data.username,
      displayName: data.display_name,
      isAnonymous: data.is_anonymous,
      createdAt: new Date(data.created_at),
    };
  }
}