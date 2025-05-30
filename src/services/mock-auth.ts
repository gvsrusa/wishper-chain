// Mock authentication for development
// This simulates being logged in as a test user

import { supabase } from '../config/supabase-rest-only-fixed';

export const mockAuth = {
  // Mock user that matches your database
  currentUser: {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'luna@example.com',
    username: 'moonwhisperer',
    display_name: 'Luna Starlight',
  },

  // Simulate sign in
  signIn: async () => {
    // In a real app, this would create a session
    // For now, just return the mock user
    console.log('Mock sign in as:', mockAuth.currentUser.username);
    return { user: mockAuth.currentUser, error: null };
  },

  // Get current user
  getUser: () => {
    return mockAuth.currentUser;
  },

  // For API calls that need auth context
  getAuthHeaders: () => {
    // In production, this would include the user's JWT token
    // For development with anon key, we just use the regular headers
    return {};
  }
};

// Update the API to use this mock user ID
export const getCurrentUserId = () => {
  return mockAuth.currentUser.id;
};