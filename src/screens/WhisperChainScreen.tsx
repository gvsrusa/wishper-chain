import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../constants';
import { RootStackParamList, Whisper, ChainResponse } from '../types';

type WhisperChainScreenNavigationProp = StackNavigationProp<RootStackParamList, 'WhisperChain'>;
type WhisperChainScreenRouteProp = RouteProp<RootStackParamList, 'WhisperChain'>;

interface Props {
  navigation: WhisperChainScreenNavigationProp;
  route: WhisperChainScreenRouteProp;
}

const mockWhisper: Whisper = {
  id: '1',
  userId: 'user1',
  originalText: 'I feel so alone in this crowded room',
  transformedText: 'In seas of faces, an island stands alone, yearning for connection across the silent waves.',
  theme: 'Loneliness',
  likes: 24,
  chainCount: 8,
  createdAt: new Date(),
  isLiked: false,
};

const mockChainResponses: ChainResponse[] = [
  {
    id: '1',
    whisperId: '1',
    userId: 'user2',
    originalText: 'But sometimes islands become lighthouses',
    transformedText: 'Yet from solitude springs the beacon that guides lost souls through tempestuous nights.',
    createdAt: new Date(),
  },
  {
    id: '2',
    whisperId: '1',
    userId: 'user3',
    originalText: 'I see you, fellow wanderer',
    transformedText: 'Across the void, one heart recognizes another, bridging distance with understanding.',
    createdAt: new Date(),
  },
];

export default function WhisperChainScreen({ navigation, route }: Props) {
  const [chainResponses, setChainResponses] = useState(mockChainResponses);
  const [newResponse, setNewResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitResponse = () => {
    if (!newResponse.trim()) return;

    setIsSubmitting(true);
    
    // Simulate API call and AI transformation
    setTimeout(() => {
      const response: ChainResponse = {
        id: Date.now().toString(),
        whisperId: route.params.whisperId,
        userId: 'currentUser',
        originalText: newResponse,
        transformedText: `${newResponse} transformed into beautiful prose...`,
        createdAt: new Date(),
      };
      
      setChainResponses(prev => [...prev, response]);
      setNewResponse('');
      setIsSubmitting(false);
    }, 1500);
  };

  const getThemeColor = (theme: string) => {
    return Colors.sadness; // Default for loneliness
  };

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
            <View style={[styles.themeTag, { backgroundColor: getThemeColor(mockWhisper.theme || '') }]}>
              <Text style={styles.themeText}>{mockWhisper.theme}</Text>
            </View>
          </View>
          
          <Text style={styles.transformedText}>{mockWhisper.transformedText}</Text>
          <Text style={styles.originalText}>"{mockWhisper.originalText}"</Text>
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
              
              <Text style={styles.chainTransformedText}>{response.transformedText}</Text>
              <Text style={styles.chainOriginalText}>"{response.originalText}"</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add Response Input */}
      <View style={styles.inputSection}>
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
  transformedText: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.lg,
    lineHeight: Typography.lineHeight.relaxed,
    marginBottom: 8,
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
  chainTransformedText: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.base,
    lineHeight: Typography.lineHeight.normal,
    marginBottom: 6,
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
});