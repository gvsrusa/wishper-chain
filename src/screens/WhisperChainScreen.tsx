import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography } from '../constants';
import { RootStackParamList, Whisper, ChainResponse } from '../types';
import { api, getCurrentUserIdDebug, setAuthContext } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useApiReady } from '../components/AuthenticatedApp';
import { addWordBreaks } from '../utils/textUtils';

type WhisperChainScreenNavigationProp = StackNavigationProp<RootStackParamList, 'WhisperChain'>;
type WhisperChainScreenRouteProp = RouteProp<RootStackParamList, 'WhisperChain'>;

interface Props {
  navigation: WhisperChainScreenNavigationProp;
  route: WhisperChainScreenRouteProp;
}


export default function WhisperChainScreen({ navigation, route }: Props) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { isApiReady } = useApiReady();
  const insets = useSafeAreaInsets();
  const [whisper, setWhisper] = useState<Whisper | null>(null);
  const [chainResponses, setChainResponses] = useState<ChainResponse[]>([]);
  const [newResponse, setNewResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const isMounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  

  useEffect(() => {
    // Load data immediately - whispers are publicly viewable
    const whisperId = route.params?.whisperId;
    console.log('WhisperChainScreen mounted, whisperId:', whisperId);
    console.log('Route params:', route.params);
    console.log('Initial states - loading:', loading, 'isApiReady:', isApiReady, 'isAuthLoading:', isAuthLoading);
    
    if (!whisperId) {
      console.error('No whisperId provided in route params!');
      setLoading(false);
      Alert.alert('Error', 'No whisper ID provided');
      return;
    }
    
    loadWhisperAndChain();
  }, [route.params?.whisperId]);

  // Track when auth is ready
  useEffect(() => {
    if (!isAuthLoading && user && isApiReady) {
      console.log('Auth and API are ready, user:', user.id);
      // Double-check the API has the correct user ID
      const apiUserId = getCurrentUserIdDebug();
      if (apiUserId !== user.id) {
        console.warn('API user ID mismatch, re-setting auth context');
        setAuthContext(user.id);
      }
      setIsAuthReady(true);
    } else if (!isAuthLoading && !user) {
      console.log('Auth loaded but no user');
      setIsAuthReady(false);
    } else if (!isApiReady) {
      console.log('Waiting for API context to be ready');
      setIsAuthReady(false);
    }
  }, [isAuthLoading, user, isApiReady]);

  const loadWhisperAndChain = async () => {
    // Prevent multiple simultaneous loads
    if (loading) {
      console.log('Already loading, skipping...');
      return;
    }
    
    console.log('loadWhisperAndChain called, current loading state:', loading);
    
    try {
      setLoading(true);
      console.log('Loading whisper chain data...');
      
      const whisperId = route.params?.whisperId;
      if (!whisperId) {
        throw new Error('No whisper ID available');
      }
      
      console.log('Calling API with whisperId:', whisperId);
      
      // Call APIs directly without race condition
      const [whisperData, chainData] = await Promise.all([
        api.getWhisperById(whisperId),
        api.getChainResponses(whisperId)
      ]);
      
      // Check if still mounted before updating state
      if (!isMounted.current) {
        console.log('Component unmounted, skipping state update');
        return;
      }
      
      if (whisperData) {
        setWhisper(whisperData);
      }
      setChainResponses(chainData || []);
      console.log('Whisper chain data loaded successfully');
    } catch (error: any) {
      console.error('Error loading whisper chain:', error);
      console.error('Error stack:', error?.stack);
      
      if (!isMounted.current) return;
      
      // Show error and navigate back
      Alert.alert(
        'Error', 
        'Failed to load whisper chain', 
        [
          {
            text: 'Go Back',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleSubmitResponse = async () => {
    const currentApiUserId = getCurrentUserIdDebug();
    console.log('handleSubmitResponse called:');
    console.log('- isAuthReady:', isAuthReady);
    console.log('- isApiReady:', isApiReady);
    console.log('- user from context:', user?.id);
    console.log('- user ID in API:', currentApiUserId);
    
    if (!user || !isAuthReady || !isApiReady) {
      if (isAuthLoading || !isApiReady) {
        Alert.alert('Please Wait', 'Initializing...');
        return;
      }
      
      Alert.alert('Authentication Required', 'Please sign in to add to the chain.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Auth') }
      ]);
      return;
    }
    
    if (!newResponse.trim()) return;

    setIsSubmitting(true);
    
    try {
      // Ensure auth context is set with current user
      if (currentApiUserId !== user.id) {
        console.log('Setting auth context before creating response');
        setAuthContext(user.id);
        // Small delay to ensure it's set
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      console.log('Calling createChainResponse with user:', user.id);
      const response = await api.createChainResponse(
        route.params.whisperId,
        newResponse.trim(),
        user.id  // Pass user ID directly
      );
      
      console.log('Response received:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', response ? Object.keys(response) : 'null');
      
      if (!response) {
        throw new Error('No response received from server');
      }
      
      if (!response.id) {
        console.error('Response missing id:', response);
        throw new Error('Invalid response received from server - missing ID');
      }
      
      // Add the response to the list
      setChainResponses(prev => {
        console.log('Adding response to chain responses');
        return [...prev, response];
      });
      
      setNewResponse('');
      
      // Update whisper chain count locally
      if (whisper) {
        setWhisper({ ...whisper, chainCount: whisper.chainCount + 1 });
      }
      
      console.log('Successfully added chain response');
    } catch (error: any) {
      console.error('Error creating chain response:', error);
      console.error('Error type:', typeof error);
      console.error('Error details:', error?.message || 'Unknown error');
      console.error('Error stack:', error?.stack);
      
      // More specific error messages
      let errorMessage = 'Failed to add response to chain';
      if (error?.message) {
        if (error.message.includes('No data returned')) {
          errorMessage = 'Server did not return response data. Please try again.';
        } else if (error.message.includes('Invalid response')) {
          errorMessage = 'Invalid response from server. Please try again.';
        } else if (error.message.includes('authenticated')) {
          errorMessage = 'You must be signed in to respond.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getThemeColor = (theme?: string) => {
    if (!theme) return Colors.abstract;
    switch (theme.toLowerCase()) {
      case 'loneliness':
      case 'sadness':
        return Colors.sadness;
      case 'dreams':
        return Colors.dreams;
      case 'love':
        return Colors.love;
      case 'fear':
        return Colors.fear;
      case 'nature':
        return Colors.nature;
      case 'joy':
        return Colors.joy;
      case 'hope':
        return Colors.hope;
      default:
        return Colors.abstract;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primaryAccent} />
        <Text style={styles.loadingText}>Loading whisper chain...</Text>
      </View>
    );
  }

  if (!whisper) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="warning-outline" size={64} color={Colors.error} />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorText}>This whisper may have been removed or is no longer available.</Text>
        <TouchableOpacity 
          style={styles.errorButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Original Whisper */}
        <View style={styles.originalWhisper}>
          <View style={styles.whisperHeader}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={20} color={Colors.textPrimary} />
              </View>
              <View>
                <Text style={styles.username}>{whisper.displayName || whisper.username || 'Anonymous'}</Text>
                <Text style={styles.timestamp}>{new Date(whisper.createdAt).toLocaleTimeString()}</Text>
              </View>
            </View>
            <View style={[styles.themeTag, { backgroundColor: getThemeColor(whisper.theme) }]}>
              <Text style={styles.themeText}>{whisper.theme}</Text>
            </View>
          </View>
          
          <View style={styles.transformedTextContainer}>
            <Text style={styles.transformedText}>{addWordBreaks(whisper.transformedText)}</Text>
          </View>
          <Text style={styles.originalText}>"{whisper.originalText}"</Text>
        </View>

        {/* Chain Responses */}
        <View style={styles.chainSection}>
          <Text style={styles.chainTitle}>Chain Responses</Text>
          {chainResponses.map((response) => (
            <View key={response.id} style={styles.chainResponse}>
              <View style={styles.whisperHeader}>
                <View style={styles.userInfo}>
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={20} color={Colors.textPrimary} />
                  </View>
                  <View>
                    <Text style={styles.username}>{response.displayName || response.username || 'Anonymous'}</Text>
                    <Text style={styles.timestamp}>{new Date(response.createdAt).toLocaleTimeString()}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.chainTransformedTextContainer}>
                <Text style={styles.chainTransformedText}>{addWordBreaks(response.transformedText)}</Text>
              </View>
              <Text style={styles.chainOriginalText}>"{response.originalText}"</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add Response Input */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <View style={[styles.inputSection, { paddingBottom: 16 + insets.bottom }]}>
          <TextInput
            style={styles.responseInput}
            placeholder={(!isAuthReady || !isApiReady) ? "Initializing..." : "Whisper your thoughts..."}
            placeholderTextColor={Colors.textSecondary}
            value={newResponse}
            onChangeText={setNewResponse}
            multiline
            maxLength={300}
            editable={isAuthReady && isApiReady}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!newResponse.trim() || isSubmitting || !isAuthReady || !isApiReady) && styles.disabledButton]}
            onPress={handleSubmitResponse}
            disabled={!newResponse.trim() || isSubmitting || !isAuthReady || !isApiReady}
          >
            <Ionicons 
              name={isSubmitting ? "hourglass" : (!isAuthReady || !isApiReady) ? "time" : "send"} 
              size={20} 
              color={(!newResponse.trim() || isSubmitting || !isAuthReady || !isApiReady) ? Colors.textSecondary : Colors.textPrimary} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBackground,
  },
  content: {
    flex: 1,
  },
  originalWhisper: {
    backgroundColor: Colors.cardBackground,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primaryAccent,
  },
  whisperHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryAccent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  username: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  timestamp: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.xs,
  },
  themeTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  themeText: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  transformedTextContainer: {
    width: '100%',
    marginBottom: 8,
  },
  transformedText: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.lg,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.lg,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  originalText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontStyle: 'italic',
  },
  chainSection: {
    paddingHorizontal: 16,
  },
  chainTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: 16,
  },
  chainResponse: {
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    marginLeft: 20,
  },
  chainTransformedTextContainer: {
    width: '100%',
    marginBottom: 6,
  },
  chainTransformedText: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.base,
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.base,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  chainOriginalText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontStyle: 'italic',
  },
  inputSection: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.cardBackground,
    alignItems: 'flex-end',
  },
  responseInput: {
    flex: 1,
    backgroundColor: Colors.primaryBackground,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.base,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: Colors.primaryAccent,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: Colors.disabled,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.base,
    marginTop: 16,
  },
  errorTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    marginHorizontal: 32,
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: Colors.primaryAccent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  errorButtonText: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
});