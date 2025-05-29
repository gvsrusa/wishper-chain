import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../constants';

const achievements = [
  { name: 'First Whisper', icon: 'pencil', isEarned: true },
  { name: '10 Whispers Shared', icon: 'chatbubbles', isEarned: true },
  { name: 'Thread Starter', icon: 'link', isEarned: false },
  { name: 'Community Helper', icon: 'people', isEarned: false },
  { name: 'Guessed Right 5 Times', icon: 'checkmark-circle', isEarned: false },
];

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={32} color={Colors.textPrimary} />
        </View>
        <Text style={styles.displayName}>Dreamer79</Text>
        <Text style={styles.status}>Anonymous Whisperer</Text>
      </View>
      
      <View style={styles.statsSection}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>7</Text>
          <Text style={styles.statLabel}>Whispers Shared</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>3</Text>
          <Text style={styles.statLabel}>Chains Started</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>2</Text>
          <Text style={styles.statLabel}>Achievements</Text>
        </View>
      </View>
      
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
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="document-text-outline" size={24} color={Colors.textSecondary} />
          <Text style={styles.menuText}>My Whispers</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="link-outline" size={24} color={Colors.textSecondary} />
          <Text style={styles.menuText}>My Chains</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="settings-outline" size={24} color={Colors.textSecondary} />
          <Text style={styles.menuText}>Settings</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.menuItem, styles.signOutItem]}>
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
});