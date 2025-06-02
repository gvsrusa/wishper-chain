import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors, Typography } from '../constants';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { RootStackParamList } from '../types';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

export default function ProfileScreen() {
  const { signOut, user } = useAuth();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    whispersCount: 0,
    chainsStarted: 0,
    achievementsCount: 0,
  });

  const achievements = [
    { name: 'First Whisper', icon: 'pencil', isEarned: stats.whispersCount >= 1 },
    { name: '10 Whispers Shared', icon: 'chatbubbles', isEarned: stats.whispersCount >= 10 },
    { name: 'Thread Starter', icon: 'link', isEarned: stats.chainsStarted >= 1 },
    { name: 'Community Helper', icon: 'people', isEarned: stats.chainsStarted >= 5 },
    { name: 'Guessed Right 5 Times', icon: 'checkmark-circle', isEarned: false },
  ];

  // Refresh stats whenever screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchUserStats();
    }, [])
  );

  const fetchUserStats = async () => {
    try {
      setIsLoading(true);
      const userStats = await api.getUserStats();
      setStats(userStats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={32} color={Colors.textPrimary} />
        </View>
        <Text style={styles.displayName}>{user?.displayName || 'Anonymous'}</Text>
        <Text style={styles.status}>{user?.email || 'Anonymous Whisperer'}</Text>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryAccent} />
        </View>
      ) : (
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.whispersCount}</Text>
            <Text style={styles.statLabel}>Whispers Shared</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.chainsStarted}</Text>
            <Text style={styles.statLabel}>Chains Started</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.achievementsCount}</Text>
            <Text style={styles.statLabel}>Achievements</Text>
          </View>
        </View>
      )}
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        {achievements.map((achievement, index) => (
          <View key={index} style={styles.achievementItem}>
            <View style={[
              styles.achievementIcon, 
              achievement.isEarned ? styles.earnedIcon : styles.lockedIcon
            ]}>
              <Ionicons 
                name={(achievement.icon && achievement.icon in Ionicons.glyphMap) ? achievement.icon as keyof typeof Ionicons.glyphMap : 'trophy-outline'} 
                size={20} 
                color={achievement.isEarned ? Colors.textPrimary : Colors.textSecondary} 
              />
            </View>
            <Text style={[
              styles.achievementName,
              !achievement.isEarned && styles.lockedText
            ]}>
              {achievement.name}
            </Text>
            {achievement.isEarned && (
              <Ionicons name="checkmark" size={20} color={Colors.success} />
            )}
          </View>
        ))}
      </View>
      
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('MyWhispers')}
        >
          <Ionicons name="document-text-outline" size={24} color={Colors.textSecondary} />
          <Text style={styles.menuText}>My Whispers</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('MyChains')}
        >
          <Ionicons name="link-outline" size={24} color={Colors.textSecondary} />
          <Text style={styles.menuText}>My Chains</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={24} color={Colors.textSecondary} />
          <Text style={styles.menuText}>Settings</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.menuItem, styles.signOutItem]} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={24} color={Colors.error} />
          <Text style={[styles.menuText, styles.signOutText]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBackground,
  },
  header: {
    alignItems: 'center',
    padding: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  displayName: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: 4,
  },
  status: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.base,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    padding: 20,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  statNumber: {
    color: Colors.primaryAccent,
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: 4,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
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
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  earnedIcon: {
    backgroundColor: Colors.primaryAccent,
  },
  lockedIcon: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.textSecondary,
  },
  achievementName: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.base,
  },
  lockedText: {
    color: Colors.textSecondary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuText: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.base,
    marginLeft: 12,
  },
  signOutItem: {
    marginTop: 16,
  },
  signOutText: {
    color: Colors.error,
  },
  loadingContainer: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
});