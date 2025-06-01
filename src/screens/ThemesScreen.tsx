import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../constants';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Theme } from '../types';

type ThemesScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface ThemeWithCount extends Theme {
  whisperCount: number;
  icon: string;
}

const themeIcons: Record<string, string> = {
  'Love': 'heart',
  'Dreams': 'moon',
  'Fear': 'flash',
  'Joy': 'sunny',
  'Hope': 'leaf',
  'Sadness': 'rainy',
  'Nature': 'flower',
  'Abstract': 'shapes',
  'Loneliness': 'person',
  'Friendship': 'people',
};

export default function ThemesScreen() {
  const navigation = useNavigation<ThemesScreenNavigationProp>();
  const { user } = useAuth();
  const [themes, setThemes] = useState<ThemeWithCount[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<{ tag: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load themes when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadThemes();
      loadTrendingHashtags();
    }, [])
  );

  const loadThemes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all themes with counts efficiently
      const themesWithCounts = await api.getThemesWithCounts();
      
      // Add icon to each theme and sort by count
      const processedThemes = themesWithCounts
        .map(theme => ({
          ...theme,
          icon: themeIcons[theme.name] || 'shapes',
        }))
        .sort((a, b) => b.whisperCount - a.whisperCount);
      
      setThemes(processedThemes);
    } catch (err) {
      console.error('Error loading themes:', err);
      setError('Failed to load themes');
    } finally {
      setLoading(false);
    }
  };

  const loadTrendingHashtags = async () => {
    try {
      const hashtags = await api.getTrendingHashtags(6);
      setTrendingHashtags(hashtags);
    } catch (err) {
      console.error('Error loading trending hashtags:', err);
      // Use default hashtags as fallback
      setTrendingHashtags([
        { tag: '#LateNightThoughts', count: 86 },
        { tag: '#MidnightConfessions', count: 54 },
        { tag: '#SoulSearching', count: 42 },
        { tag: '#InnerVoice', count: 38 },
        { tag: '#QuietMoments', count: 29 },
        { tag: '#DeepFeels', count: 23 },
      ]);
    }
  };

  const handleThemePress = (themeName: string) => {
    // Navigate to a filtered view of whispers for this theme
    navigation.navigate('Search', { initialQuery: '', filterTheme: themeName });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primaryAccent} />
        <Text style={styles.loadingText}>Loading themes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadThemes}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.subtitle}>Discover whispers by emotion and feeling.</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Themes</Text>
        <View style={styles.themeGrid}>
          {themes.map((theme) => (
            <TouchableOpacity 
              key={theme.id} 
              style={styles.themeCard}
              onPress={() => handleThemePress(theme.name)}
            >
              <View style={[styles.themeIcon, { backgroundColor: theme.accentColor }]}>
                <Ionicons 
                  name={theme.icon as keyof typeof Ionicons.glyphMap} 
                  size={32} 
                  color={Colors.textPrimary} 
                />
              </View>
              <Text style={styles.themeName}>{theme.name}</Text>
              <Text style={styles.whisperCount}>
                {theme.whisperCount} {theme.whisperCount === 1 ? 'whisper' : 'whispers'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.statsSection}>
        <Text style={styles.statsTitle}>Community Activity</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {themes.reduce((sum, theme) => sum + theme.whisperCount, 0)}
            </Text>
            <Text style={styles.statLabel}>Total Whispers</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{themes.length}</Text>
            <Text style={styles.statLabel}>Active Themes</Text>
          </View>
        </View>
      </View>

      {/* Trending Topics Section */}
      <View style={styles.trendingSection}>
        <Text style={styles.trendingTitle}>Trending Topics</Text>
        <View style={styles.trendingContainer}>
          {trendingHashtags.map((topic, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.trendingTag}
              onPress={() => navigation.navigate('Search', { initialQuery: topic.tag })}
            >
              <Text style={styles.trendingTagText}>{topic.tag}</Text>
              <Text style={styles.trendingCount}>{topic.count} whispers</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBackground,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    margin: 16,
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: 16,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  themeCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: '48%',
    marginBottom: 16,
  },
  themeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  themeName: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: 4,
  },
  whisperCount: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  statsSection: {
    margin: 16,
    marginBottom: 32,
  },
  statsTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: '48%',
  },
  statNumber: {
    color: Colors.primaryAccent,
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    marginTop: 4,
  },
  trendingSection: {
    margin: 16,
    marginBottom: 32,
  },
  trendingTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: 16,
  },
  trendingContainer: {
    marginTop: 8,
  },
  trendingTag: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendingTagText: {
    color: Colors.primaryAccent,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  trendingCount: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
  },
});