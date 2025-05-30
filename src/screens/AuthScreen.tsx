import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography } from '../constants';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import EmailVerificationModal from '../components/EmailVerificationModal';

type AuthScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Auth'>;

interface Props {
  navigation: AuthScreenNavigationProp;
}

export default function AuthScreen({ navigation }: Props) {
  const { signUp, signIn, signInAnonymously, signInWithGoogle, signInWithFacebook, isLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const [isSignUp, setIsSignUp] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      if (isSignUp) {
        await signUp(email.trim(), password, username.trim() || undefined);
        // Sign up succeeded - SignedIn component will handle navigation
      } else {
        await signIn(email.trim(), password);
        // Sign in succeeded - SignedIn component will handle navigation
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('verification code')) {
        // Show verification modal
        setShowVerification(true);
      } else {
        Alert.alert('Authentication Error', error instanceof Error ? error.message : 'An error occurred');
      }
    }
  };

  const handleAnonymous = async () => {
    try {
      await signInAnonymously();
      // Sign in succeeded - SignedIn component will handle navigation
    } catch (error) {
      Alert.alert('Error', 'Failed to sign in anonymously');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsProcessingOAuth(true);
      await signInWithGoogle();
      // Navigation will be handled by the useEffect that watches isAuthenticated
    } catch (error) {
      // Only show error if it's not a cancellation
      if (error instanceof Error && !error.message.includes('cancelled')) {
        Alert.alert('Google Sign-In Error', error.message);
      }
    } finally {
      setIsProcessingOAuth(false);
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      await signInWithFacebook();
      // Navigation will be handled by the useEffect that watches isAuthenticated
    } catch (error) {
      Alert.alert('Facebook Sign-In Error', error instanceof Error ? error.message : 'Failed to sign in with Facebook');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
      <Text style={styles.logo}>W</Text>
      <Text style={styles.title}>WhisperChain</Text>
      <Text style={styles.tagline}>Your thoughts, transformed into art.</Text>
      
      <View style={styles.form}>
        {isSignUp && (
          <TextInput
            style={styles.input}
            placeholder="Username (Optional)"
            placeholderTextColor={Colors.textSecondary}
            value={username}
            onChangeText={setUsername}
          />
        )}
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={Colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={Colors.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity 
          style={[styles.primaryButton, isLoading && styles.disabledButton]} 
          onPress={handleAuth}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.textPrimary} />
          ) : (
            <Text style={styles.primaryButtonText}>
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.linkButton} 
          onPress={() => setIsSignUp(!isSignUp)}
        >
          <Text style={styles.linkText}>
            {isSignUp 
              ? 'Already have an account? Sign in.' 
              : "Don't have an account? Sign up."
            }
          </Text>
        </TouchableOpacity>

        {/* Social Login Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>Or continue with</Text>
          <View style={styles.divider} />
        </View>

        {/* Social Login Buttons */}
        <View style={styles.socialButtonsContainer}>
          <TouchableOpacity 
            style={[styles.socialButton, styles.googleButton, (isLoading || isProcessingOAuth) && styles.disabledButton]} 
            onPress={handleGoogleSignIn}
            disabled={isLoading || isProcessingOAuth}
          >
            {isProcessingOAuth ? (
              <ActivityIndicator color="#333" size="small" />
            ) : (
              <>
                <Text style={[styles.socialButtonIcon, { color: '#333' }]}>G</Text>
                <Text style={[styles.socialButtonText, { color: '#333' }]}>Google</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.socialButton, styles.facebookButton, isLoading && styles.disabledButton]} 
            onPress={handleFacebookSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.textPrimary} size="small" />
            ) : (
              <>
                <Text style={[styles.socialButtonIcon, { color: '#fff' }]}>f</Text>
                <Text style={[styles.socialButtonText, { color: '#fff' }]}>Facebook</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={[styles.anonymousButton, isLoading && styles.disabledButton]} 
          onPress={handleAnonymous}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.primaryAccent} />
          ) : (
            <Text style={styles.anonymousButtonText}>Continue as Anonymous</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <EmailVerificationModal
        visible={showVerification}
        onClose={() => setShowVerification(false)}
        onSuccess={() => {
          setShowVerification(false);
          navigation.replace('Main');
        }}
      />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.primaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryAccent,
    marginBottom: 16,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  tagline: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    width: '100%',
    maxWidth: 300,
  },
  input: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.base,
  },
  primaryButton: {
    backgroundColor: Colors.primaryAccent,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  linkButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  linkText: {
    color: Colors.primaryAccent,
    fontSize: Typography.fontSize.sm,
  },
  anonymousButton: {
    borderWidth: 1,
    borderColor: Colors.primaryAccent,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  anonymousButtonText: {
    color: Colors.primaryAccent,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  disabledButton: {
    opacity: 0.6,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.textSecondary,
    opacity: 0.3,
  },
  dividerText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    marginHorizontal: 16,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginHorizontal: -8,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 8,
    borderWidth: 1,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderColor: '#dadce0',
  },
  facebookButton: {
    backgroundColor: '#1877f2',
    borderColor: '#1877f2',
  },
  socialButtonIcon: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    marginRight: 8,
    color: '#333',
  },
  socialButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: '#333',
  },
});