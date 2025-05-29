import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors, Typography } from '../constants';
import { RootStackParamList, Whisper } from '../types';
import { api } from '../services/api';

type SearchScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Search'>;

interface Props {
  navigation: SearchScreenNavigationProp;
}

export default function SearchScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Whisper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (query.length > 2) {
      const timeoutId = setTimeout(() => {
        performSearch();
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setResults([]);
      setHasSearched(false);
    }
  }, [query]);

  const performSearch = async () => {
    if (query.trim().length < 3) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const searchResults = await api.searchWhispers(query);
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhisperPress = (whisperId: string) => {
    navigation.navigate('WhisperChain', { whisperId });
  };

  const getThemeColor = (theme: string) => {
    switch (theme?.toLowerCase()) {
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
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search whispers..."
            placeholderTextColor={Colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primaryAccent} />
            <Text style={styles.loadingText}>Searching whispers...</Text>
          </View>
        )}

        {!isLoading && hasSearched && results.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No whispers found</Text>
            <Text style={styles.emptySubtitle}>
              Try different keywords or browse themes to discover whispers
            </Text>
          </View>
        )}

        {!isLoading && !hasSearched && query.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>Search Whispers</Text>
            <Text style={styles.emptySubtitle}>
              Find whispers by searching their content or themes
            </Text>
          </View>
        )}

        {results.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsHeader}>
              {results.length} whisper{results.length !== 1 ? 's' : ''} found
            </Text>
            
            {results.map((whisper) => (
              <TouchableOpacity 
                key={whisper.id} 
                style={styles.whisperCard}
                onPress={() => handleWhisperPress(whisper.id)}
              >
                <View style={[styles.themeTag, { backgroundColor: getThemeColor(whisper.theme || '') }]}>
                  <Text style={styles.themeText}>{whisper.theme}</Text>
                </View>
                
                <Text style={styles.transformedText}>{whisper.transformedText}</Text>
                <Text style={styles.originalText}>"{whisper.originalText}"</Text>
                
                <View style={styles.interactionBar}>
                  <View style={styles.interactionButton}>
                    <Ionicons 
                      name={whisper.isLiked ? "heart" : "heart-outline"} 
                      size={16} 
                      color={whisper.isLiked ? Colors.love : Colors.textSecondary} 
                    />
                    <Text style={styles.interactionText}>{whisper.likes}</Text>
                  </View>
                  
                  <View style={styles.interactionButton}>
                    <Ionicons name="chatbubble-outline" size={16} color={Colors.textSecondary} />
                    <Text style={styles.interactionText}>{whisper.chainCount}</Text>
                  </View>
                  
                  <View style={styles.interactionButton}>
                    <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
                    <Text style={styles.interactionText}>
                      {whisper.createdAt ? whisper.createdAt.toLocaleDateString() : 'N/A'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBackground,
  },
  searchHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBackground,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.base,
    marginLeft: 12,
    marginRight: 8,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.base,
    marginTop: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.normal,
  },
  resultsContainer: {
    padding: 16,
  },
  resultsHeader: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    marginBottom: 16,
    textAlign: 'center',
  },
  whisperCard: {
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
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
    fontSize: Typography.fontSize.base,
    lineHeight: Typography.lineHeight.normal,
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
    fontSize: Typography.fontSize.xs,
    marginLeft: 4,
  },
});