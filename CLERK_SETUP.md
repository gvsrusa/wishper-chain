# Clerk Setup Guide for WhisperChain

This guide will help you complete the setup of Clerk authentication for your WhisperChain app.

## Step 1: Create Clerk Account and Application

1. Go to [Clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Choose "React Native (Expo)" as your framework

## Step 2: Configure Authentication Methods

In your Clerk dashboard:

1. **Enable Email/Password Authentication:**
   - Go to "User & Authentication" → "Email, Phone, Username"
   - Enable "Email address" 
   - Enable "Password"
   - Set email address as required

2. **Configure Email Verification:**
   - Go to "User & Authentication" → "Email, Phone, Username"
   - Enable "Verify email address"
   - Choose "Email verification code" strategy

3. **Enable Social Login (Optional):**
   - Go to "User & Authentication" → "Social connections"
   - Enable "Google" and/or "Facebook"
   - Add your OAuth client IDs from Google/Facebook consoles

## Step 3: Update Environment Variables

Update your `.env` file with the Clerk publishable key:

```env
# Clerk Configuration
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here

# Keep existing Supabase config for database
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 4: Run Database Migration

1. **Backup your existing database first!**

2. Run the migration script in your Supabase SQL editor:
   ```sql
   -- Copy and paste the contents of database-migration-clerk.sql
   ```

3. The migration will:
   - Rename existing users table to `users_backup`
   - Create new users table with Clerk support
   - Update all foreign key references
   - Add the `create_or_update_user_from_clerk` function

## Step 5: Configure OAuth Providers (Optional)

### Google OAuth Setup:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create/select a project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `https://your-clerk-domain.clerk.accounts.dev/v1/oauth_callback`
6. Copy Client ID to Clerk dashboard

### Facebook OAuth Setup:
1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create an app
3. Add "Facebook Login" product
4. Add redirect URI: `https://your-clerk-domain.clerk.accounts.dev/v1/oauth_callback`
5. Copy App ID to Clerk dashboard

## Step 6: Test the Integration

1. Start your Expo app:
   ```bash
   npm start
   ```

2. Test the following flows:
   - Email/password sign up (with verification)
   - Email/password sign in
   - Anonymous sign in (creates temporary account)
   - Social login (if configured)
   - Sign out

## Step 7: App Configuration

Update your `app.json` if using custom schemes:

```json
{
  "expo": {
    "scheme": "whisperchain",
    "plugins": [
      "expo-secure-store",
      "expo-web-browser"
    ]
  }
}
```

## Troubleshooting

### Common Issues:

1. **"Clerk publishable key not found"**
   - Ensure your `.env` file has the correct key
   - Restart Expo after changing environment variables

2. **Database sync errors**
   - Check Supabase connection
   - Verify the migration was run successfully
   - Check console logs for specific errors

3. **Email verification not working**
   - Check Clerk email settings
   - Verify email templates are configured
   - Check spam folder for verification emails

4. **Social login redirect issues**
   - Verify redirect URIs in OAuth provider settings
   - Check Clerk social connection configuration
   - Ensure URL scheme matches in app.json

### Anonymous User Flow:

The app creates pseudo-anonymous accounts by:
1. Generating unique email/password combinations
2. Creating real Clerk accounts with these credentials
3. Storing credentials locally for persistence
4. Marking users as anonymous in the database

Anonymous users can:
- Create whispers and chain responses
- View all content
- Like whispers
- Participate fully in the app

They cannot:
- Access account settings
- Change their profile
- Recover their account if lost

## Production Considerations

1. **Environment Variables:**
   - Use production Clerk keys for production builds
   - Set up proper environment management

2. **Email Templates:**
   - Customize Clerk email templates to match your brand
   - Configure proper sender addresses

3. **Rate Limiting:**
   - Configure appropriate rate limits in Clerk
   - Monitor usage and costs

4. **Data Migration:**
   - Plan migration from development to production
   - Consider user data export/import tools

## Support

If you encounter issues:
1. Check Clerk documentation: https://clerk.com/docs
2. Check Supabase documentation: https://supabase.com/docs
3. Review console logs for specific error messages
4. Check network connectivity and API status

The integration is now complete! Your WhisperChain app uses Clerk for authentication while maintaining Supabase for database operations.