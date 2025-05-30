// API service with Supabase and fallback
import { Whisper, ChainResponse, User, Theme } from '../types';

let apiService: any = null;

// Try to load Supabase, fallback to simple API if it fails
const initializeAPI = async () => {
  if (apiService) return apiService;
  
  try {
    // Try Supabase first
    const { supabaseApi } = await import('./supabase-api');
    apiService = supabaseApi;
    console.log('✅ Using Supabase API');
    return apiService;
  } catch (error) {
    console.warn('⚠️ Supabase failed, using fallback API:', error);
    // Fall back to simple API
    const { simpleApi } = await import('./api-simple');
    apiService = simpleApi;
    return apiService;
  }
};

// Wrapper functions that initialize the API service
export const api = {
  signUp: async (email: string, password: string, username?: string): Promise<User> => {
    const service = await initializeAPI();
    return service.signUp(email, password, username);
  },

  signIn: async (email: string, password: string): Promise<User> => {
    const service = await initializeAPI();
    return service.signIn(email, password);
  },

  signInAnonymously: async (): Promise<User> => {
    const service = await initializeAPI();
    return service.signInAnonymously();
  },

  getWhispers: async (sortBy: string = 'trending'): Promise<Whisper[]> => {
    const service = await initializeAPI();
    return service.getWhispers(sortBy);
  },

  getWhisperById: async (id: string): Promise<Whisper | null> => {
    const service = await initializeAPI();
    return service.getWhisperById(id);
  },

  createWhisper: async (originalText: string, theme?: string): Promise<Whisper> => {
    const service = await initializeAPI();
    return service.createWhisper(originalText, theme);
  },

  likeWhisper: async (whisperId: string): Promise<void> => {
    const service = await initializeAPI();
    return service.likeWhisper(whisperId);
  },

  getChainResponses: async (whisperId: string): Promise<ChainResponse[]> => {
    const service = await initializeAPI();
    return service.getChainResponses(whisperId);
  },

  createChainResponse: async (whisperId: string, originalText: string): Promise<ChainResponse> => {
    const service = await initializeAPI();
    return service.createChainResponse(whisperId, originalText);
  },

  searchWhispers: async (query: string): Promise<Whisper[]> => {
    const service = await initializeAPI();
    return service.searchWhispers(query);
  },
};