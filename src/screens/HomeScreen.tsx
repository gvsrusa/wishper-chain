import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;
import { Colors, Typography } from '../constants';
import { Whisper } from '../types';
import GuessTheWhispererModal from '../components/GuessTheWhispererModal';

const mockWhispers: Whisper[] = [
  {
    id: '1',
    userId: 'user1',
    originalText: 'I feel so alone in this crowded room',
    transformedText: 'In seas of faces, an island stands alone, yearning for connection across the silent waves.',
    theme: 'Loneliness',
    likes: 24,
    chainCount: 8,
    createdAt: new Date(),
    isLiked: false,
  },
  {
    id: '2',
    userId: 'user2',
    originalText: 'Dreaming of flying away from all my problems',
    transformedText: 'Wings of hope unfurl beneath starlit skies, carrying dreams beyond the weight of earthly burdens.',
    theme: 'Dreams',
    likes: 15,
    chainCount: 12,
    createdAt: new Date(),
    isLiked: true,
  },
];

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [whispers, setWhispers] = useState(mockWhispers);
  const [sortBy, setSortBy] = useState('Trending');
  const [guessModalVisible, setGuessModalVisible] = useState(false);
  const [selectedWhisperId, setSelectedWhisperId] = useState<string>('');

  const handleLike = (whisperId: string) => {
    setWhispers(prevWhispers =>
      prevWhispers.map(whisper =>
        whisper.id === whisperId
          ? {
              ...whisper,
              isLiked: !whisper.isLiked,
              likes: whisper.isLiked ? whisper.likes - 1 : whisper.likes + 1,
            }
          : whisper
      )
    );
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
        {whispers.map((whisper) => (
          <TouchableOpacity 
            key={whisper.id} 
            style={styles.whisperCard}
            onPress={() => handleWhisperPress(whisper.id)}
          >
            <View style={[styles.themeTag, { backgroundColor: getThemeColor(whisper.theme) }]}>
              <Text style={styles.themeText}>{whisper.theme}</Text>
            </View>
            
            <Text style={styles.transformedText}>{whisper.transformedText}</Text>
            <Text style={styles.originalText}>"{whisper.originalText}"</Text>
            
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
        ))}
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
    marginBottom: 16,
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
});