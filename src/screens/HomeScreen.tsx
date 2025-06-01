import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;
import { Colors, Typography } from '../constants';
import { Whisper } from '../types';
import GuessTheWhispererModal from '../components/GuessTheWhispererModal';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { addWordBreaks } from '../utils/textUtils';
import { useAuthenticatedApi } from '../hooks/useAuthenticatedApi';


export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useAuth();
  useAuthenticatedApi(); // Set up auth context for API calls
  const [whispers, setWhispers] = useState<Whisper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('Trending');
  const [guessModalVisible, setGuessModalVisible] = useState(false);
  const [selectedWhisperId, setSelectedWhisperId] = useState<string>('');

  // Load whispers on component mount
  useEffect(() => {
    // Only load whispers when we have a user (auth is ready)
    if (user) {
      loadWhispers();
    }
  }, [sortBy, user]);

  const loadWhispers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getWhispers(sortBy.toLowerCase(), user?.id);
      setWhispers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load whispers');
      console.error('Error loading whispers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (whisperId: string) => {
    if (!user) {
      // Could navigate to auth or show login prompt
      navigation.navigate('Auth');
      return;
    }
    
    try {
      // Find current whisper state
      const currentWhisper = whispers.find(w => w.id === whisperId);
      console.log('Current whisper before toggle:', currentWhisper);
      console.log('User object:', user);
      console.log('User ID being used:', user.id);
      
      const isLiked = await api.toggleLike(whisperId, user.id);
      console.log('Toggle result - isLiked:', isLiked);
      
      // Optimistically update UI
      setWhispers(prevWhispers =>
        prevWhispers.map(whisper => {
          if (whisper.id === whisperId) {
            const newLikes = isLiked ? whisper.likes + 1 : Math.max(0, whisper.likes - 1);
            console.log('Updating whisper - was liked:', whisper.isLiked, 'now liked:', isLiked);
            console.log('Like count - was:', whisper.likes, 'now:', newLikes);
            return {
              ...whisper,
              isLiked: isLiked,
              likes: newLikes,
            };
          }
          return whisper;
        })
      );
    } catch (err) {
      console.error('Error liking whisper:', err);
      // Revert optimistic update on error
      setWhispers(prevWhispers => [...prevWhispers]);
    }
  };

  const handleGuess = (whisperId: string) => {
    setSelectedWhisperId(whisperId);
    setGuessModalVisible(true);
  };

  const handleWhisperPress = (whisperId: string) => {
    navigation.navigate('WhisperChain', { whisperId });
  };

  const handleSearchPress = () => {
    navigation.navigate('Search');
  };

  const getThemeColor = (theme: string) => {
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.sortButton}>
          <Text style={styles.sortText}>{sortBy}</Text>
          <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSearchPress}>
          <Ionicons name="search" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.feed}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.primaryAccent} />
            <Text style={styles.loadingText}>Loading whispers...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadWhispers}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : whispers.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No whispers yet. Be the first to share!</Text>
          </View>
        ) : (
          whispers.map((whisper) => (
          <TouchableOpacity 
            key={whisper.id} 
            style={styles.whisperCard}
            onPress={() => handleWhisperPress(whisper.id)}
          >
            <View style={[styles.themeTag, { backgroundColor: getThemeColor(whisper.theme || 'abstract') }]}>
              <Text style={styles.themeText}>{whisper.theme || 'Abstract'}</Text>
            </View>
            
            <View style={styles.transformedTextContainer}>
              <Text style={styles.transformedText}>
                {addWordBreaks(whisper.transformedText)}
              </Text>
            </View>
            <Text style={styles.originalText} numberOfLines={2} ellipsizeMode="tail">
              "{whisper.originalText}"
            </Text>
            
            <View style={styles.interactionBar}>
              <TouchableOpacity 
                style={styles.interactionButton}
                onPress={() => handleLike(whisper.id)}
              >
                <Ionicons 
                  name={whisper.isLiked ? "heart" : "heart-outline"} 
                  size={20} 
                  color={whisper.isLiked ? Colors.love : Colors.textSecondary} 
                />
                <Text style={styles.interactionText}>{whisper.likes}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.interactionButton}>
                <Ionicons name="chatbubble-outline" size={20} color={Colors.textSecondary} />
                <Text style={styles.interactionText}>{whisper.chainCount}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.interactionButton}
                onPress={() => handleGuess(whisper.id)}
              >
                <Ionicons name="globe-outline" size={20} color={Colors.textSecondary} />
                <Text style={styles.interactionText}>Guess</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <GuessTheWhispererModal
        visible={guessModalVisible}
        onClose={() => setGuessModalVisible(false)}
        whisperId={selectedWhisperId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBackground,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBackground,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sortText: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.sm,
    marginRight: 4,
  },
  feed: {
    flex: 1,
  },
  whisperCard: {
    backgroundColor: Colors.cardBackground,
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
  },
  themeTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  themeText: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  transformedTextContainer: {
    width: '100%',
    marginBottom: 12,
  },
  transformedText: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.base,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  originalText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontStyle: 'italic',
    marginBottom: 16,
    flexWrap: 'wrap',
    width: '100%',
  },
  interactionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  interactionText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    marginLeft: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 200,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    marginTop: 12,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.lg,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.primaryAccent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
});