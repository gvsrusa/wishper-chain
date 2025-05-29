export interface User {
  id: string;
  username?: string;
  email?: string;
  isAnonymous: boolean;
  displayName: string;
  createdAt: Date;
}

export interface Whisper {
  id: string;
  userId: string;
  originalText: string;
  transformedText: string;
  theme?: string;
  likes: number;
  chainCount: number;
  createdAt: Date;
  isLiked?: boolean;
}

export interface ChainResponse {
  id: string;
  whisperId: string;
  userId: string;
  originalText: string;
  transformedText: string;
  createdAt: Date;
}

export interface Theme {
  id: string;
  name: string;
  color: string;
  icon?: string;
  whisperCount: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  isEarned: boolean;
  earnedAt?: Date;
}

export type BottomTabParamList = {
  Home: undefined;
  Write: undefined;
  Themes: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
  WhisperChain: { whisperId: string };
  Settings: undefined;
  Search: undefined;
};