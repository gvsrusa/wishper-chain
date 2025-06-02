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
      // First, try to use the upsert function if it exists
      const { data: functionResult, error: functionError } = await supabase
        .rpc('upsert_user_from_clerk', {
          p_clerk_user_id: clerkUser.id,
          p_email: clerkUser.primaryEmailAddress?.emailAddress || null,
          p_username: clerkUser.username || null,
          p_first_name: clerkUser.firstName || null,
          p_last_name: clerkUser.lastName || null,
          p_display_name: clerkUser.fullName || clerkUser.firstName || clerkUser.username || 'Anonymous',
          p_avatar_url: clerkUser.imageUrl || null,
        });

      if (!functionError && functionResult) {
        return {
          id: functionResult.id,
          email: functionResult.email,
          username: functionResult.username,
          displayName: functionResult.display_name,
          avatarUrl: functionResult.avatar_url,
          isAnonymous: functionResult.is_anonymous,
          createdAt: new Date(functionResult.created_at),
        };
      }

      // Fallback to direct table operations if function doesn't exist
      console.log('Using fallback sync method');
      
      // Prepare user data
      const userData = {
        email: clerkUser.primaryEmailAddress?.emailAddress || null,
        username: clerkUser.username || clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] || `user_${clerkUser.id.slice(-6)}`,
        display_name: clerkUser.fullName || clerkUser.firstName || clerkUser.username || 'Anonymous',
        avatar_url: clerkUser.imageUrl || null,
        is_anonymous: false,
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Check if user exists by id (using Clerk ID as primary key)
      const { data: existingUsers, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', clerkUser.id);

      let user;
      
      if (!existingUsers || existingUsers.length === 0) {
        // User doesn't exist, create new
        // For new users, use Clerk ID as primary key
        const insertData: any = {
          id: clerkUser.id, // Use Clerk ID as primary key
          email: userData.email,
          username: userData.username,
          display_name: userData.display_name,
          avatar_url: userData.avatar_url,
          is_anonymous: userData.is_anonymous,
          last_seen: userData.last_seen,
          created_at: new Date().toISOString(),
        };

        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert(insertData);

        if (insertError) {
          // If insert fails with Clerk ID, try without specifying ID (let DB generate UUID)
          delete insertData.id;
          const { data: retryUser, error: retryError } = await supabase
            .from('users')
            .insert(insertData);
          
          if (retryError) {
            console.error('Error creating user:', retryError);
            throw retryError;
          }
          
          user = insertData; // Use the data we tried to insert
        } else {
          user = insertData; // Successfully inserted
        }
      } else {
        // User exists, update
        user = existingUsers[0];
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            email: userData.email,
            username: userData.username,
            display_name: userData.display_name,
            avatar_url: userData.avatar_url,
            last_seen: userData.last_seen,
            updated_at: userData.updated_at,
          })
          .eq('id', clerkUser.id);

        if (updateError) {
          console.error('Error updating user:', updateError);
          // Use existing user data if update fails
        } else {
          // Update succeeded, merge the updated data with existing user
          user = { ...user, ...userData };
        }
      }

      // Return formatted user
      console.log('Synced user from database:', user);
      return {
        id: user.id,  // This should be the database UUID, not Clerk ID
        email: user.email,
        username: user.username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        isAnonymous: user.is_anonymous,
        createdAt: new Date(user.created_at),
      };
    } catch (error) {
      console.error('Error syncing user with database:', error);
      // Don't throw the error, just log it and return fallback data
      // This allows the app to continue functioning even if sync fails
      
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