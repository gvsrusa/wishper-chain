import { Whisper, ChainResponse, User, Theme } from '../types';

// Mock data
const mockUser: User = {
  id: 'user1',
  username: 'Dreamer79',
  isAnonymous: true,
  displayName: 'Dreamer79',
  createdAt: new Date(),
};

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
  {
    id: '3',
    userId: 'user3',
    originalText: 'The sunset reminds me of better days',
    transformedText: 'Golden memories paint the evening sky, whispering promises of dawn yet to come.',
    theme: 'Hope',
    likes: 32,
    chainCount: 5,
    createdAt: new Date(),
    isLiked: false,
  },
];

// Mock API functions
export const api = {
  // Authentication
  signUp: async (email: string, password: string, username?: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return mockUser;
  },

  signIn: async (email: string, password: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return mockUser;
  },

  signInAnonymously: async (): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockUser;
  },

  // Whispers
  getWhispers: async (sortBy: string = 'trending'): Promise<Whisper[]> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return mockWhispers;
  },

  getWhisperById: async (id: string): Promise<Whisper | null> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockWhispers.find(w => w.id === id) || null;
  },

  createWhisper: async (originalText: string, theme?: string): Promise<Whisper> => {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate AI processing
    
    const newWhisper: Whisper = {
      id: Date.now().toString(),
      userId: mockUser.id,
      originalText,
      transformedText: await transformText(originalText),
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
    return [
      {
        id: '1',
        whisperId,
        userId: 'user2',
        originalText: 'But sometimes islands become lighthouses',
        transformedText: 'Yet from solitude springs the beacon that guides lost souls through tempestuous nights.',
        createdAt: new Date(),
      },
    ];
  },

  createChainResponse: async (whisperId: string, originalText: string): Promise<ChainResponse> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      id: Date.now().toString(),
      whisperId,
      userId: mockUser.id,
      originalText,
      transformedText: await transformText(originalText),
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

// AI transformation service
const transformText = async (text: string): Promise<string> => {
  // Simple mock transformation - in real app this would call OpenAI/Gemini API
  const transformations = [
    `Like poetry written by moonlight, ${text.toLowerCase()} becomes a symphony of silent understanding.`,
    `In whispered winds of consciousness, "${text}" transforms into ethereal beauty beyond words.`,
    `Through the lens of dreams, ${text.toLowerCase()} blooms into verses of the heart's deepest truths.`,
    `As starlight touches earth, "${text}" becomes a tapestry woven from threads of pure emotion.`,
    `From the depths of feeling, ${text.toLowerCase()} emerges as art painted with invisible brushstrokes.`,
  ];
  
  return transformations[Math.floor(Math.random() * transformations.length)];
};