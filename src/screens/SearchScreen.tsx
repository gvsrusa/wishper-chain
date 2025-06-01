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
import { RouteProp } from '@react-navigation/native';
import { Colors, Typography } from '../constants';
import { RootStackParamList, Whisper, Theme } from '../types';
import { api } from '../services/api';

type SearchScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Search'>;
type SearchScreenRouteProp = RouteProp<RootStackParamList, 'Search'>;

interface Props {
  navigation: SearchScreenNavigationProp;
  route: SearchScreenRouteProp;
}

export default function SearchScreen({ navigation, route }: Props) {
  const { initialQuery = '', filterTheme = null } = route.params || {};
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Whisper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(filterTheme);
  const [themes, setThemes] = useState<Theme[]>([]);

  useEffect(() => {
    // Load themes on mount
    loadThemes();
    
    // If we have a filterTheme, load whispers for that theme immediately
    if (filterTheme) {
      loadThemeWhispers();
    }
  }, []);

  useEffect(() => {
    if (query.length > 2 || selectedTheme) {
      const timeoutId = setTimeout(() => {
        performSearch();
      }, 500);

      return () => clearTimeout(timeoutId);
    } else if (!selectedTheme) {
      setResults([]);
      setHasSearched(false);
    }
  }, [query, selectedTheme]);

  const loadThemes = async () => {
    try {
      const allThemes = await api.getThemes();
      setThemes(allThemes);
    } catch (error) {
      console.error('Error loading themes:', error);
    }
  };

  const loadThemeWhispers = async () => {
    if (!selectedTheme) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const themeWhispers = await api.getWhispersByTheme(selectedTheme);
      setResults(themeWhispers);
    } catch (error) {
      console.error('Error loading theme whispers:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const performSearch = async () => {
    if (query.trim().length < 3 && !selectedTheme) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      let searchResults: Whisper[] = [];
      
      if (selectedTheme && query.trim().length > 0) {
        // Search within theme
        const themeWhispers = await api.getWhispersByTheme(selectedTheme);
        searchResults = themeWhispers.filter(whisper => 
          whisper.originalText.toLowerCase().includes(query.toLowerCase()) ||
          whisper.transformedText.toLowerCase().includes(query.toLowerCase())
        );
      } else if (selectedTheme) {
        // Just get all whispers for the theme
        searchResults = await api.getWhispersByTheme(selectedTheme);
      } else {
        // Regular search across all whispers
        searchResults = await api.searchWhispers(query);
      }
      
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleThemeSelect = (theme: string | null) => {
    setSelectedTheme(theme);
    setQuery(''); // Clear query when switching themes
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
            placeholder={selectedTheme ? `Search in ${selectedTheme}...` : "Search whispers..."}
            placeholderTextColor={Colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            autoFocus={!selectedTheme}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Theme filter chips */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.themeFilters}
        contentContainerStyle={styles.themeFiltersContent}
      >
        <TouchableOpacity
          style={[
            styles.themeChip,
            !selectedTheme && styles.themeChipActive
          ]}
          onPress={() => handleThemeSelect(null)}
        >
          <Text style={[
            styles.themeChipText,
            !selectedTheme && styles.themeChipTextActive
          ]}>All</Text>
        </TouchableOpacity>
        
        {themes.map((theme) => (
          <TouchableOpacity
            key={theme.id}
            style={[
              styles.themeChip,
              selectedTheme === theme.name && styles.themeChipActive,
              { borderColor: theme.accentColor }
            ]}
            onPress={() => handleThemeSelect(theme.name)}
          >
            <Text style={[
              styles.themeChipText,
              selectedTheme === theme.name && styles.themeChipTextActive
            ]}>{theme.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
              {selectedTheme 
                ? `No whispers found in ${selectedTheme}. Try searching in all themes.`
                : 'Try different keywords or browse themes to discover whispers'}
            </Text>
          </View>
        )}

        {!isLoading && !hasSearched && query.length === 0 && !selectedTheme && (
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>Search Whispers</Text>
            <Text style={styles.emptySubtitle}>
              Find whispers by searching their content or selecting a theme above
            </Text>
          </View>
        )}

        {results.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsHeader}>
              {results.length} whisper{results.length !== 1 ? 's' : ''} 
              {selectedTheme ? ` in ${selectedTheme}` : ' found'}
              {query && selectedTheme ? ` matching "${query}"` : ''}
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
                
                <View style={styles.textContent}>
                  <Text style={styles.transformedText} numberOfLines={0}>
                    {whisper.transformedText}
                  </Text>
                  <Text style={styles.originalText} numberOfLines={0}>
                    "{whisper.originalText}"
                  </Text>
                </View>
                
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
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    paddingHorizontal: 16,
    maxWidth: '100%',
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
    overflow: 'hidden',
    minHeight: 120,
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
  textContent: {
    flex: 1,
    width: '100%',
  },
  transformedText: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.base,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.normal,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  originalText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontStyle: 'italic',
    marginBottom: 16,
    flexWrap: 'wrap',
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
  },
  interactionBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 24,
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  interactionText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.xs,
    marginLeft: 4,
  },
  themeFilters: {
    maxHeight: 50,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBackground,
  },
  themeFiltersContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  themeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBackground,
    backgroundColor: Colors.cardBackground,
    marginRight: 8,
  },
  themeChipActive: {
    backgroundColor: Colors.primaryAccent,
    borderColor: Colors.primaryAccent,
  },
  themeChipText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  themeChipTextActive: {
    color: Colors.textPrimary,
  },
});