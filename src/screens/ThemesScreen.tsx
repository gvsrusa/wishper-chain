import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../constants';

const popularThemes = [
  { name: 'Love', color: Colors.love, icon: 'heart', whisperCount: 1234 },
  { name: 'Dreams', color: Colors.dreams, icon: 'moon', whisperCount: 987 },
  { name: 'Fear', color: Colors.fear, icon: 'flash', whisperCount: 756 },
  { name: 'Joy', color: Colors.joy, icon: 'sunny', whisperCount: 654 },
  { name: 'Hope', color: Colors.hope, icon: 'leaf', whisperCount: 543 },
  { name: 'Sadness', color: Colors.sadness, icon: 'rainy', whisperCount: 432 },
];

const trendingTags = [
  '#LateNightThoughts',
  '#MidnightConfessions',
  '#SoulSearching',
  '#InnerVoice',
  '#QuietMoments',
  '#DeepFeels',
];

export default function ThemesScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.subtitle}>Discover whispers by emotion and feeling.</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular Themes</Text>
        <View style={styles.themeGrid}>
          {popularThemes.map((theme) => (
            <TouchableOpacity key={theme.name} style={styles.themeCard}>
              <View style={[styles.themeIcon, { backgroundColor: theme.color }]}>
                <Ionicons 
                  name={theme.icon as keyof typeof Ionicons.glyphMap} 
                  size={32} 
                  color={Colors.textPrimary} 
                />
              </View>
              <Text style={styles.themeName}>{theme.name}</Text>
              <Text style={styles.whisperCount}>
                {theme.whisperCount.toLocaleString()} whispers
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trending Now</Text>
        <View style={styles.trendingContainer}>
          {trendingTags.map((tag, index) => (
            <TouchableOpacity key={index} style={styles.trendingTag}>
              <Text style={styles.trendingTagText}>{tag}</Text>
              <Text style={styles.trendingCount}>
                {Math.floor(Math.random() * 100) + 20} whispers
              </Text>
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
  trendingContainer: {
    marginVertical: -6,
  },
  trendingTag: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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