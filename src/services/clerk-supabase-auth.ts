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
      // Generate a unique username if not provided by Clerk
      let suggestedUsername = clerkUser.username;
      if (!suggestedUsername && clerkUser.primaryEmailAddress?.emailAddress) {
        suggestedUsername = clerkUser.primaryEmailAddress.emailAddress.split('@')[0];
      }
      if (!suggestedUsername) {
        suggestedUsername = `user_${clerkUser.id.slice(-6)}`;
      }
      
      const userData = {
        clerk_user_id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || null,
        username: suggestedUsername,
        display_name: clerkUser.fullName || clerkUser.firstName || clerkUser.username || 'Anonymous',
        first_name: clerkUser.firstName || null,
        last_name: clerkUser.lastName || null,
        avatar_url: clerkUser.imageUrl || null,
        is_anonymous: false,
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Check if user exists by clerk_user_id
      const { data: userByClerkId } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_user_id', clerkUser.id)
        .maybeSingle();
      
      // If email is provided, also check by email
      let userByEmail = null;
      if (userData.email) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('email', userData.email)
          .maybeSingle();
        userByEmail = data;
      }

      let user;
      
      // Scenario 1: No existing user found
      if (!userByClerkId && !userByEmail) {
        // User doesn't exist, create new
        // For new users, let database generate UUID
        const insertData: any = {
          ...userData,
        };

        const { data: insertResult, error: insertError } = await supabase
          .from('users')
          .insert(insertData);
        
        let newUser = null;
        if (!insertError && insertResult) {
          // After insert, fetch the created user
          const { data: fetchedUser } = await supabase
            .from('users')
            .select('*')
            .eq('clerk_user_id', clerkUser.id)
            .single();
          newUser = fetchedUser;
        }

        if (insertError) {
          // If insert fails due to username conflict, try with a modified username
          if (insertError.message?.includes('username')) {
            console.log('Username conflict, generating unique username');
            insertData.username = `${userData.username}_${Date.now().toString(36).slice(-4)}`;
            const { data: retryResult, error: retryError } = await supabase
              .from('users')
              .insert(insertData);
            
            let retryUser = null;
            if (!retryError && retryResult) {
              // After insert, fetch the created user
              const { data: fetchedUser } = await supabase
                .from('users')
                .select('*')
                .eq('clerk_user_id', clerkUser.id)
                .single();
              retryUser = fetchedUser;
            }
            
            if (retryError) {
              console.error('Error creating user:', retryError);
              throw retryError;
            }
            
            user = retryUser;
          } else {
            // Other insert error - throw it
            console.error('Error creating user:', insertError);
            throw insertError;
          }
        } else {
          user = newUser;
        }
      }
      // Scenario 2: User exists with same clerk_user_id
      else if (userByClerkId) {
        user = userByClerkId;
        console.log('Found existing user by clerk_user_id:', user.id);
        
        // Only update last_seen timestamp
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            last_seen: userData.last_seen,
            updated_at: userData.updated_at
          })
          .eq('id', user.id);
          
        if (updateError) {
          console.error('Error updating last_seen:', updateError);
        }
      }
      // Scenario 3: User exists with same email but different clerk_user_id
      else if (userByEmail && !userByClerkId) {
        // This happens when switching auth providers (e.g., email to Google)
        console.log('Found user by email, updating clerk_user_id');
        user = userByEmail;
        
        // Update the clerk_user_id to link this Clerk account
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            clerk_user_id: clerkUser.id,
            last_seen: userData.last_seen,
            updated_at: userData.updated_at
          })
          .eq('id', userByEmail.id);
          
        if (updateError) {
          console.error('Error updating clerk_user_id:', updateError);
          throw updateError;
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
      clerk_user_id: tempId,
      username: `anon_${tempId.slice(-8)}`,
      display_name: 'Anonymous',
      is_anonymous: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('users')
      .insert(anonymousData);
    
    if (error) {
      console.error('Error creating anonymous user:', error);
      throw error;
    }
    
    // After insert, fetch the created user
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', tempId)
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