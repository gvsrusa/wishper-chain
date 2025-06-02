import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors, Typography } from '../constants';
import { api } from '../services/api';
import { ChainResponse, RootStackParamList } from '../types';

type MyChainsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MyChains'>;

export default function MyChainsScreen() {
  const navigation = useNavigation<MyChainsScreenNavigationProp>();
  const [chains, setChains] = useState<ChainResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [groupedChains, setGroupedChains] = useState<{ [whisperId: string]: ChainResponse[] }>({});

  // Refresh chains whenever screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchUserChains();
    }, [])
  );

  const fetchUserChains = async () => {
    try {
      setIsLoading(true);
      const userChains = await api.getUserChains();
      setChains(userChains);
      
      // Group chains by whisper ID
      const grouped = userChains.reduce((acc, chain) => {
        if (!acc[chain.whisperId]) {
          acc[chain.whisperId] = [];
        }
        acc[chain.whisperId].push(chain);
        return acc;
      }, {} as { [whisperId: string]: ChainResponse[] });
      
      setGroupedChains(grouped);
    } catch (error) {
      console.error('Error fetching user chains:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChainPress = (whisperId: string) => {
    navigation.navigate('WhisperChain', { 
      whisperId,
      onRefresh: () => {
        // Refresh chains when coming back
        fetchUserChains();
      }
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryAccent} />
        <Text style={styles.loadingText}>Loading your chains...</Text>
      </View>
    );
  }

  if (chains.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="link-outline" size={64} color={Colors.textSecondary} />
        <Text style={styles.emptyTitle}>No Chains Yet</Text>
        <Text style={styles.emptySubtitle}>
          Start responding to whispers to create meaningful chains
        </Text>
        <TouchableOpacity 
          style={styles.browseButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.browseButtonText}>Browse Whispers</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Chain Responses</Text>
        <Text style={styles.headerSubtitle}>
          {chains.length} response{chains.length !== 1 ? 's' : ''} across {Object.keys(groupedChains).length} chain{Object.keys(groupedChains).length !== 1 ? 's' : ''}
        </Text>
      </View>

      {Object.entries(groupedChains).map(([whisperId, whisperChains]) => (
        <TouchableOpacity
          key={whisperId}
          style={styles.chainGroup}
          onPress={() => handleChainPress(whisperId)}
        >
          <View style={styles.chainHeader}>
            <Ionicons name="link" size={20} color={Colors.primaryAccent} />
            <Text style={styles.chainTitle}>Chain ({whisperChains.length} response{whisperChains.length !== 1 ? 's' : ''})</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </View>
          
          {whisperChains.map((chain, index) => (
            <View key={chain.id} style={styles.chainItem}>
              <View style={styles.chainContent}>
                <Text style={styles.transformedText} numberOfLines={2}>
                  {chain.transformedText}
                </Text>
                <Text style={styles.originalText} numberOfLines={1}>
                  "{chain.originalText}"
                </Text>
              </View>
              <Text style={styles.chainDate}>{formatDate(chain.createdAt)}</Text>
            </View>
          ))}
        </TouchableOpacity>
      ))}
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
  browseButton: {
    backgroundColor: Colors.primaryAccent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  browseButtonText: {
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
  chainGroup: {
    margin: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    overflow: 'hidden',
  },
  chainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryBackground,
  },
  chainTitle: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    marginLeft: 8,
  },
  chainItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryBackground,
  },
  chainContent: {
    marginBottom: 8,
  },
  transformedText: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.base,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.normal,
    marginBottom: 4,
  },
  originalText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontStyle: 'italic',
  },
  chainDate: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.xs,
  },
});