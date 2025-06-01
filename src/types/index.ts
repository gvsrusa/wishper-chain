export interface User {
  id: string;
  username?: string;
  email?: string;
  isAnonymous: boolean;
  displayName: string;
  avatarUrl?: string;
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
  username?: string;
  displayName?: string;
}

export interface ChainResponse {
  id: string;
  whisperId: string;
  userId: string;
  originalText: string;
  transformedText: string;
  createdAt: Date;
  username?: string;
  displayName?: string;
}

export interface Theme {
  id: string;
  name: string;
  description?: string;
  accentColor: string;
  backgroundColor: string;
  gradient?: string[];
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
  Auth: undefined;
  Main: undefined;
  WhisperChain: { whisperId: string };
  Settings: undefined;
  Search: { initialQuery?: string; filterTheme?: string } | undefined;
  MyWhispers: undefined;
  MyChains: undefined;
};