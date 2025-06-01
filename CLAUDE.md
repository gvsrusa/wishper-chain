# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm start` - Start Expo development server
- `npm run android` - Run on Android emulator/device
- `npm run ios` - Run on iOS simulator/device
- `npm run web` - Run in web browser

## Architecture Overview

WhisperChain is a React Native Expo app that transforms personal thoughts into poetic expressions through AI. Users write raw thoughts that get transformed into artistic "whispers" which can then form collaborative chains as others respond.

### Project Vision
WhisperChain provides a safe, anonymous space for users to share thoughts, feelings, and dreams. The app's core value proposition is transforming raw personal expressions into poetic/artistic forms while fostering empathy and connection through collaborative "whisper chains". Key features include themed collections, gamification elements (achievements, "Guess the Whisperer"), and community insights. See `backup/docs/PRD.md` for complete product specifications.

### Tech Stack
- **Framework**: React Native with Expo SDK 53.0.0
- **Language**: TypeScript
- **Authentication**: Clerk (@clerk/clerk-expo)
- **Database**: Supabase (PostgreSQL with RLS)
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **State Management**: React Context API
- **Styling**: Custom theme system with expo-linear-gradient

### Navigation Structure
- **RootNavigator** (Stack): Manages app-wide navigation flow
  - Handles Clerk auth state (SignedIn/SignedOut)
  - Routes: Splash → Auth → Main App
- **BottomTabNavigator**: Main app interface with 4 tabs
  - Home: Browse whisper chains
  - Write: Create new whispers
  - Themes: Explore themed collections
  - Profile: User settings and content

### Authentication Architecture
The app uses Clerk for authentication with custom Supabase integration:

- **Clerk Setup**: Handles email/password, social OAuth (Google/Facebook), and email verification
- **Anonymous Users**: Custom implementation using generated Clerk accounts
- **Database Sync**: `clerk-database-sync.ts` syncs Clerk users to Supabase users table
- **Token Management**: Secure token storage via expo-secure-store

#### Clerk Configuration Requirements
- Enable Email/Password authentication with email verification
- Configure OAuth providers (Google, Facebook) with proper redirect URIs
- Set up email verification using verification code strategy
- Anonymous users created with generated email/password combinations
- See `CLERK_SETUP.md` for detailed setup instructions

### Database Architecture
- **Configuration**: Supabase client in `src/config/supabase.ts` (auth disabled, uses Clerk tokens)
- **Schema**: `database-schema-complete.sql` defines all tables, RLS policies, and triggers
- **API Services**:
  - `api-clerk.ts` - Production API with Clerk authentication
  - `supabase-api.ts` - Direct Supabase integration
  - `api-mock.ts` - Mock data for development
  - `api-with-fallback.ts` - Graceful fallback to mock data

### Core Data Flow
1. User authentication via Clerk
2. Database sync creates/updates Supabase user record
3. User writes raw text in WriteScreen
4. Text transformation (currently mock, placeholder for AI)
5. Whisper creation with theme assignment
6. Real-time updates for likes and chain responses

### Environment Configuration
Required environment variables (in `.env`):
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_SUPABASE_URL=https://...
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Metro Configuration
Custom Metro config handles Node.js polyfills and disables problematic modules:
- WebSocket modules stubbed to avoid React Native issues
- Buffer and crypto polyfills configured
- Custom resolver for platform-specific modules

### Key Implementation Details
- **Error Handling**: API services use try-catch with fallback to mock data
- **Type Safety**: Comprehensive TypeScript types in `src/types/index.ts`
- **Security**: Clerk handles auth, Supabase RLS policies control data access
- **Performance**: Disabled Supabase realtime/websockets for stability

### Development Notes
- No test framework currently configured
- No linting setup (ESLint/Prettier)
- Mock AI transformation needs replacement with actual service (OpenAI/Gemini)
- Anonymous user credentials stored locally - users lose access if app data cleared

## Additional Resources

### Documentation
- **CLERK_SETUP.md**: Step-by-step Clerk authentication setup guide
- **backup/docs/PRD.md**: Complete Product Requirements Document with feature specifications

### Database Scripts
Located in root directory:
- **Schema Management**:
  - `database-schema-complete.sql` - Full database schema with tables, functions, and policies
  - `database-migration-clerk.sql` - Migration script for Clerk integration
- **RLS Policies**:
  - `clerk-rls-policies.sql` - Clerk-specific RLS policies
  - `production-rls-policies.sql` - Production environment policies
  - `development-rls-policies.sql` - Development environment policies
- **Testing & Data**:
  - `insert-sample-data.sql`, `simple-data-insert.sql` - Sample data for testing
  - `disable-rls-for-testing.sql` - Temporarily disable RLS for testing
  - `diagnose-and-fix-users.sql` - User table diagnostics

### App Configuration Details
From `app.json`:
- **URL Scheme**: `whisperchain://` for deep linking
- **Default Theme**: Dark mode (`userInterfaceStyle: "dark"`)
- **Splash Screen**: Purple background (#1A1033) matching app theme
- **Expo Plugins**: `expo-secure-store`, `expo-web-browser`

### TypeScript Configuration
- Strict mode enabled for type safety
- Extends Expo's base TypeScript configuration

### Build & Bundle Configuration
The `metro.config.js` implements critical workarounds:
- **Polyfills**: crypto → react-native-crypto, buffer → @craftzdog/react-native-buffer
- **Disabled Modules**: WebSocket and related modules stubbed to prevent React Native conflicts
- **Module Resolution**: Configured for React Native, browser, and main fields

### Troubleshooting Scripts
- `test-android-bundle.js` - Android bundle testing
- `android_test.js` - Android-specific tests
- `websocket-disable.js`, `stub.js` - WebSocket workaround modules