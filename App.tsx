import React from 'react';
import { StatusBar } from 'expo-status-bar';
import './polyfills';
import { ClerkProvider } from '@clerk/clerk-expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { tokenCache } from './src/services/tokenCache';
import { Environment } from './src/config/environment';

export default function App() {
  return (
    <SafeAreaProvider>
      <ClerkProvider 
        publishableKey={Environment.clerkPublishableKey}
        tokenCache={tokenCache}
      >
        <RootNavigator />
        <StatusBar style="light" />
      </ClerkProvider>
    </SafeAreaProvider>
  );
}