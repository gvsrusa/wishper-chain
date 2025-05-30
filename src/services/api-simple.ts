// Simplified API for development/fallback
import { Whisper, ChainResponse, User, Theme } from '../types';

// Mock data for fallback
const mockWhispers: Whisper[] = [
  {
    id: '1',
    userId: 'user1',
    originalText: 'I feel so alone in this crowded room',
    transformedText: 'In seas of faces, an island stands alone, yearning for connection across the silent waves.',
    theme: 'Loneliness',
    likes: 24,
    chainCount: 8,
    createdAt: new Date(),
    isLiked: false,
  },
  {
    id: '2',
    userId: 'user2',
    originalText: 'Dreaming of flying away from all my problems',
    transformedText: 'Wings of hope unfurl beneath starlit skies, carrying dreams beyond the weight of earthly burdens.',
    theme: 'Dreams',
    likes: 15,
    chainCount: 12,
    createdAt: new Date(),
    isLiked: true,
  },
];

const mockUser: User = {
  id: 'user1',
  username: 'Dreamer79',
  isAnonymous: true,
  displayName: 'Dreamer79',
  createdAt: new Date(),
};

export const simpleApi = {
  // Authentication
  signUp: async (email: string, password: string, username?: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { ...mockUser, email, username, isAnonymous: false };
  },

  signIn: async (email: string, password: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { ...mockUser, email, isAnonymous: false };
  },

  signInAnonymously: async (): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockUser;
  },

  // Whispers
  getWhispers: async (sortBy: string = 'trending'): Promise<Whisper[]> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return [...mockWhispers];
  },

  getWhisperById: async (id: string): Promise<Whisper | null> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockWhispers.find(w => w.id === id) || null;
  },

  createWhisper: async (originalText: string, theme?: string): Promise<Whisper> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newWhisper: Whisper = {
      id: Date.now().toString(),
      userId: mockUser.id,
      originalText,
      transformedText: `✨ ${originalText} becomes poetry in the digital realm ✨`,
      theme,
      likes: 0,
      chainCount: 0,
      createdAt: new Date(),
      isLiked: false,
    };
    
    return newWhisper;
  },

  likeWhisper: async (whisperId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
  },

  // Chain responses
  getChainResponses: async (whisperId: string): Promise<ChainResponse[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [];
  },

  createChainResponse: async (whisperId: string, originalText: string): Promise<ChainResponse> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      id: Date.now().toString(),
      whisperId,
      userId: mockUser.id,
      originalText,
      transformedText: `In response: ${originalText} flows like a river of consciousness.`,
      createdAt: new Date(),
    };
  },

  // Search
  searchWhispers: async (query: string): Promise<Whisper[]> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return mockWhispers.filter(whisper => 
      whisper.transformedText.toLowerCase().includes(query.toLowerCase()) ||
      whisper.originalText.toLowerCase().includes(query.toLowerCase())
    );
  },
};