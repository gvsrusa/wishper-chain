import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography } from '../constants';
import { RootStackParamList, Whisper, ChainResponse } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { addWordBreaks } from '../utils/textUtils';

type WhisperChainScreenNavigationProp = StackNavigationProp<RootStackParamList, 'WhisperChain'>;
type WhisperChainScreenRouteProp = RouteProp<RootStackParamList, 'WhisperChain'>;

interface Props {
  navigation: WhisperChainScreenNavigationProp;
  route: WhisperChainScreenRouteProp;
}


export default function WhisperChainScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [whisper, setWhisper] = useState<Whisper | null>(null);
  const [chainResponses, setChainResponses] = useState<ChainResponse[]>([]);
  const [newResponse, setNewResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWhisperAndChain();
  }, [route.params.whisperId]);

  const loadWhisperAndChain = async () => {
    try {
      setLoading(true);
      const [whisperData, chainData] = await Promise.all([
        api.getWhisperById(route.params.whisperId, user?.id),
        api.getChainResponses(route.params.whisperId)
      ]);
      
      if (whisperData) {
        setWhisper(whisperData);
      }
      setChainResponses(chainData);
    } catch (error) {
      console.error('Error loading whisper chain:', error);
      Alert.alert('Error', 'Failed to load whisper chain');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to add to the chain.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Auth') }
      ]);
      return;
    }
    
    if (!newResponse.trim()) return;

    setIsSubmitting(true);
    
    try {
      const response = await api.createChainResponse(
        route.params.whisperId,
        newResponse.trim(),
        user.id
      );
      
      setChainResponses(prev => [...prev, response]);
      setNewResponse('');
      
      // Update whisper chain count
      if (whisper) {
        setWhisper({ ...whisper, chainCount: whisper.chainCount + 1 });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add response to chain');
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
        <Text style={styles.errorText}>Whisper not found</Text>
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
                <Text style={styles.username}>Sophia</Text>
                <Text style={styles.timestamp}>2 hours ago</Text>
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
                    <Text style={styles.username}>Anonymous</Text>
                    <Text style={styles.timestamp}>1 hour ago</Text>
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
            placeholder="Whisper your thoughts..."
            placeholderTextColor={Colors.textSecondary}
            value={newResponse}
            onChangeText={setNewResponse}
            multiline
            maxLength={300}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!newResponse.trim() || isSubmitting) && styles.disabledButton]}
            onPress={handleSubmitResponse}
            disabled={!newResponse.trim() || isSubmitting}
          >
            <Ionicons 
              name={isSubmitting ? "hourglass" : "send"} 
              size={20} 
              color={(!newResponse.trim() || isSubmitting) ? Colors.textSecondary : Colors.textPrimary} 
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
  errorText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.base,
  },
});