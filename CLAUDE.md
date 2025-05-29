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

### Mock Data
The app currently uses mock data in `api.ts` with simulated network delays. The `transformText` function provides placeholder AI transformations that should be replaced with actual AI service integration.