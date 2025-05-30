import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Colors } from '../constants';
import { RootStackParamList } from '../types';
import { SignedIn, SignedOut, useAuth } from '@clerk/clerk-expo';
import { View, ActivityIndicator } from 'react-native';

// Import navigators and screens
import BottomTabNavigator from './BottomTabNavigator';
import AuthScreen from '../screens/AuthScreen';
import WhisperChainScreen from '../screens/WhisperChainScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SearchScreen from '../screens/SearchScreen';
import { AuthProvider } from '../context/AuthContext';

const Stack = createStackNavigator<RootStackParamList>();

function MainStack() {
  return (
    <AuthProvider>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.primaryBackground,
          },
          headerTintColor: Colors.textPrimary,
          headerTitleStyle: {
            fontWeight: '600',
          },
          cardStyle: {
            backgroundColor: Colors.primaryBackground,
          },
        }}
      >
        <Stack.Screen 
          name="Main" 
          component={BottomTabNavigator} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="WhisperChain" 
          component={WhisperChainScreen} 
          options={{ title: 'Whisper Chain' }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{ title: 'Settings' }}
        />
        <Stack.Screen 
          name="Search" 
          component={SearchScreen} 
          options={{ title: 'Search Whispers' }}
        />
      </Stack.Navigator>
    </AuthProvider>
  );
}

export default function RootNavigator() {
  const { isLoaded } = useAuth();
  
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primaryBackground }}>
        <ActivityIndicator size="large" color={Colors.primaryAccent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <SignedIn>
        <MainStack />
      </SignedIn>
      <SignedOut>
        <AuthProvider>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              cardStyle: {
                backgroundColor: Colors.primaryBackground,
              },
            }}
          >
            <Stack.Screen 
              name="Auth" 
              component={AuthScreen} 
            />
          </Stack.Navigator>
        </AuthProvider>
      </SignedOut>
    </NavigationContainer>
  );
}