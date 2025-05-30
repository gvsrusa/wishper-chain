# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm start` - Start Expo development server
- `npm run android` - Run on Android emulator/device
- `npm run ios` - Run on iOS simulator/device
- `npm run web` - Run in web browser

## Architecture Overview

WhisperChain is a React Native Expo app that transforms personal thoughts into poetic expressions through AI. The app uses a dual-navigation structure:

### Navigation Structure
- **RootNavigator** (Stack): Manages app-wide navigation flow from splash → auth → main app
- **BottomTabNavigator**: Main app interface with 4 tabs (Home, Write, Themes, Profile)

### Core Data Flow
- User writes raw thoughts in WriteScreen
- API service (`src/services/api.ts`) transforms text using mock AI (placeholder for OpenAI/Gemini)
- Transformed "whispers" appear as poetic content in feeds
- Users can create "chain responses" - continuing conversations on existing whispers

### Key Features
- Anonymous and registered user support
- Theme-based categorization of whispers
- Social interactions (likes, chains)
- Dark purple theme with gradient UI

### File Organization
- `/src/screens/` - All screen components
- `/src/navigation/` - Navigation setup
- `/src/types/index.ts` - TypeScript definitions for User, Whisper, ChainResponse, Theme
- `/src/constants/colors.ts` - App color palette
- `/src/services/api.ts` - Mock API layer (currently returns hardcoded data)

### Database Integration
The app is configured to use Supabase as the backend database:

- **Configuration**: `src/config/supabase.ts` - requires SUPABASE_URL and SUPABASE_ANON_KEY
- **Schema**: `database-schema.sql` - complete database schema with tables, policies, and triggers
- **API Layer**: `src/services/supabase-api.ts` - replaces mock API with real Supabase calls
- **Mock Fallback**: `src/services/api.ts` - original mock implementation for development

### Setup Steps
1. Create Supabase project at https://supabase.com
2. Run `database-schema.sql` in Supabase SQL editor
3. Copy `.env.example` to `.env` and add your Supabase credentials:
   - `EXPO_PUBLIC_SUPABASE_URL=your_project_url`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key`
4. Replace imports from `api.ts` to `supabase-api.ts` in components

### Environment Variables
- **Configuration**: `src/config/environment.ts` - centralized environment variable management
- **Validation**: Automatically validates required variables on app start
- **Security**: `.env` file is gitignored to protect sensitive data

### AI Integration
The `transformText` function in `supabase-api.ts` currently uses mock transformations and should be replaced with actual AI service (OpenAI, Gemini, etc.).