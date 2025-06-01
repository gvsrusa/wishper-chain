import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors, Typography } from '../constants';
import { api } from '../services/api';
import { Whisper, RootStackParamList } from '../types';

type MyWhispersScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MyWhispers'>;

export default function MyWhispersScreen() {
  const navigation = useNavigation<MyWhispersScreenNavigationProp>();
  const [whispers, setWhispers] = useState<Whisper[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserWhispers();
  }, []);

  const fetchUserWhispers = async () => {
    try {
      setIsLoading(true);
      const userWhispers = await api.getUserWhispers();
      setWhispers(userWhispers);
    } catch (error) {
      console.error('Error fetching user whispers:', error);
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryAccent} />
        <Text style={styles.loadingText}>Loading your whispers...</Text>
      </View>
    );
  }

  if (whispers.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="document-text-outline" size={64} color={Colors.textSecondary} />
        <Text style={styles.emptyTitle}>No Whispers Yet</Text>
        <Text style={styles.emptySubtitle}>
          Share your first whisper and watch it transform into poetry
        </Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => navigation.navigate('Write')}
        >
          <Text style={styles.createButtonText}>Create Whisper</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Whispers</Text>
        <Text style={styles.headerSubtitle}>
          {whispers.length} whisper{whispers.length !== 1 ? 's' : ''} shared
        </Text>
      </View>

      <View style={styles.whispersList}>
        {whispers.map((whisper) => (
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
            
            <View style={styles.statsBar}>
              <View style={styles.statItem}>
                <Ionicons 
                  name={whisper.isLiked ? "heart" : "heart-outline"} 
                  size={16} 
                  color={whisper.isLiked ? Colors.love : Colors.textSecondary} 
                />
                <Text style={styles.statText}>{whisper.likes}</Text>
              </View>
              
              <View style={styles.statItem}>
                <Ionicons name="chatbubble-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.statText}>{whisper.chainCount}</Text>
              </View>
              
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.statText}>
                  {whisper.createdAt.toLocaleDateString()}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBackground,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryBackground,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.base,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: Colors.primaryBackground,
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
    marginBottom: 32,
  },
  createButton: {
    backgroundColor: Colors.primaryAccent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createButtonText: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBackground,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: 4,
  },
  headerSubtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.base,
  },
  whispersList: {
    padding: 16,
  },
  whisperCard: {
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
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
    marginBottom: 16,
  },
  transformedText: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.base,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.normal,
    marginBottom: 8,
  },
  originalText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontStyle: 'italic',
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.xs,
    marginLeft: 4,
  },
});