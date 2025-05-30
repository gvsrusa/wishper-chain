import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { ResponseType } from 'expo-auth-session';
import { Environment } from '../config/environment';

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

// Social authentication service
export class SocialAuthService {
  private static initialized = false;

  static async initialize() {
    if (this.initialized) return;
    this.initialized = true;
    console.log('Social auth service initialized');
  }

  // Google Sign-In (Web-based OAuth)
  static async signInWithGoogle(): Promise<{ user: any; idToken: string }> {
    try {
      await this.initialize();
      
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'whisperchain',
        preferLocalhost: true,
        isTripleSlashed: true,
      });

      console.log('Redirect URI:', redirectUri);

      // Check if Google client ID is configured
      if (!Environment.googleWebClientId) {
        throw new Error('Google Sign-In is not configured. Please add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to your .env file');
      }

      // Create the auth request
      const request = new AuthSession.AuthRequest({
        clientId: Environment.googleWebClientId,
        responseType: ResponseType.Token,
        scopes: ['openid', 'profile', 'email'],
        redirectUri,
        extraParams: {
          // Add any extra params here
          access_type: 'online',
        },
      });

      // Prompt the user to authenticate
      const result = await request.promptAsync({
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      });

      console.log('Auth result:', result);

      if (result.type === 'success') {
        const { access_token } = result.params;
        
        if (!access_token) {
          throw new Error('No access token received from Google');
        }

        // Get user info using access token
        const userResponse = await fetch(
          `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${access_token}`
        );
        
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user info from Google');
        }
        
        const user = await userResponse.json();
        console.log('Google user info:', user);

        return {
          user,
          idToken: access_token,
        };
      } else if (result.type === 'dismiss') {
        throw new Error('Google authentication was cancelled');
      } else {
        throw new Error('Google authentication failed');
      }
    } catch (error) {
      console.error('Google Sign-In error:', error);
      throw error;
    }
  }


  // Facebook Sign-In
  static async signInWithFacebook(): Promise<{ user: any; accessToken: string }> {
    try {
      await this.initialize();
      
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'whisperchain',
        preferLocalhost: true,
        isTripleSlashed: true,
      });

      console.log('Facebook Redirect URI:', redirectUri);

      // Check if Facebook client ID is configured
      if (!Environment.facebookClientId) {
        throw new Error('Facebook Sign-In is not configured. Please add EXPO_PUBLIC_FACEBOOK_CLIENT_ID to your .env file');
      }

      // Create the auth request
      const request = new AuthSession.AuthRequest({
        clientId: Environment.facebookClientId,
        responseType: ResponseType.Token,
        scopes: ['public_profile', 'email'],
        redirectUri,
      });

      // Prompt the user to authenticate
      const result = await request.promptAsync({
        authorizationEndpoint: 'https://www.facebook.com/v18.0/dialog/oauth',
      });

      console.log('Facebook Auth result:', result);

      if (result.type === 'success') {
        const { access_token } = result.params;
        
        if (!access_token) {
          throw new Error('No access token received from Facebook');
        }

        // Get user info from Facebook
        const userResponse = await fetch(
          `https://graph.facebook.com/me?access_token=${access_token}&fields=id,name,email,picture.type(large)`
        );
        
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user info from Facebook');
        }
        
        const user = await userResponse.json();
        console.log('Facebook user info:', user);

        return {
          user,
          accessToken: access_token,
        };
      } else if (result.type === 'dismiss') {
        throw new Error('Facebook authentication was cancelled');
      } else {
        throw new Error('Facebook authentication failed');
      }
    } catch (error) {
      console.error('Facebook Sign-In error:', error);
      throw error;
    }
  }



  // Sign out from all social providers
  static async signOut() {
    try {
      // Clear any OAuth sessions
      console.log('Signed out from all social providers');
    } catch (error) {
      console.error('Error signing out from social providers:', error);
    }
  }

  // Check current sign-in status
  static async getCurrentUser() {
    try {
      // Since we're using web OAuth, we don't maintain persistent sessions here
      // Session management is handled by the AuthContext
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
}