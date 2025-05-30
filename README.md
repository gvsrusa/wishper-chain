# WhisperChain

A social writing app where thoughts transform into art through collaborative whisper chains.

## Features

- **Whisper Chains**: Start a whisper and watch it transform as others add their creativity
- **Beautiful Themes**: Multiple visual themes to express your mood
- **Social Authentication**: Sign in with Google, Facebook, or email
- **Real-time Collaboration**: See whispers evolve in real-time
- **Anonymous Mode**: Participate without revealing your identity

## Tech Stack

- **Frontend**: React Native (Expo)
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **Styling**: Custom theme system with dynamic colors
- **Navigation**: React Navigation

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd wishper-chain
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Clerk Configuration
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key

   # Supabase Configuration (for database)
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # App Configuration
   EXPO_PUBLIC_APP_ENV=development
   ```

4. **Set up Clerk**
   - Create a Clerk account at https://clerk.com
   - Create a new application
   - Enable Email/Password authentication
   - Enable Google and Facebook OAuth providers (optional)
   - Copy your publishable key to the `.env` file

5. **Set up Supabase**
   - Create a Supabase project at https://supabase.com
   - Run the database schema from `database-schema-complete.sql`
   - Copy your project URL and anon key to the `.env` file

6. **Run the app**
   ```bash
   # Start the development server
   npm start

   # Run on iOS
   npm run ios

   # Run on Android
   npm run android

   # Run on web
   npm run web
   ```

## Authentication Flow

The app uses Clerk for authentication with the following features:
- Email/password sign up with email verification
- Social login (Google, Facebook)
- Secure token storage using expo-secure-store
- Automatic session management

## Project Structure

```
src/
├── components/          # Reusable components
├── constants/          # Theme colors and typography
├── context/           # Auth context and providers
├── navigation/        # Navigation configuration
├── screens/           # App screens
├── services/          # API and external services
├── types/             # TypeScript definitions
└── utils/             # Helper functions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.