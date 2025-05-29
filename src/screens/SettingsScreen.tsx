import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Switch, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../constants';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [chainNotifications, setChainNotifications] = useState(true);
  const [achievementNotifications, setAchievementNotifications] = useState(true);
  const [guessDataSharing, setGuessDataSharing] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Account Deleted', 'Your account has been successfully deleted.');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="person-outline" size={24} color={Colors.textSecondary} />
          <Text style={styles.settingText}>Change Username</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="mail-outline" size={24} color={Colors.textSecondary} />
          <Text style={styles.settingText}>Change Email</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="lock-closed-outline" size={24} color={Colors.textSecondary} />
          <Text style={styles.settingText}>Change Password</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        
        <View style={styles.settingItem}>
          <Ionicons name="notifications-outline" size={24} color={Colors.textSecondary} />
          <Text style={styles.settingText}>Push Notifications</Text>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: Colors.disabled, true: Colors.primaryAccent }}
            thumbColor={Colors.textPrimary}
          />
        </View>
        
        <View style={styles.settingItem}>
          <Ionicons name="chatbubble-outline" size={24} color={Colors.textSecondary} />
          <Text style={styles.settingText}>Chain Responses</Text>
          <Switch
            value={chainNotifications}
            onValueChange={setChainNotifications}
            trackColor={{ false: Colors.disabled, true: Colors.primaryAccent }}
            thumbColor={Colors.textPrimary}
            disabled={!notifications}
          />
        </View>
        
        <View style={styles.settingItem}>
          <Ionicons name="trophy-outline" size={24} color={Colors.textSecondary} />
          <Text style={styles.settingText}>Achievements</Text>
          <Switch
            value={achievementNotifications}
            onValueChange={setAchievementNotifications}
            trackColor={{ false: Colors.disabled, true: Colors.primaryAccent }}
            thumbColor={Colors.textPrimary}
            disabled={!notifications}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy</Text>
        
        <View style={styles.settingItem}>
          <Ionicons name="analytics-outline" size={24} color={Colors.textSecondary} />
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingText}>Community Insights</Text>
            <Text style={styles.settingDescription}>
              Allow your demographic data to be used for "Guess the Whisperer" insights
            </Text>
          </View>
          <Switch
            value={guessDataSharing}
            onValueChange={setGuessDataSharing}
            trackColor={{ false: Colors.disabled, true: Colors.primaryAccent }}
            thumbColor={Colors.textPrimary}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="help-circle-outline" size={24} color={Colors.textSecondary} />
          <Text style={styles.settingText}>Help & FAQ</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="mail-outline" size={24} color={Colors.textSecondary} />
          <Text style={styles.settingText}>Contact Support</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="document-text-outline" size={24} color={Colors.textSecondary} />
          <Text style={styles.settingText}>Terms of Service</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="shield-outline" size={24} color={Colors.textSecondary} />
          <Text style={styles.settingText}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        
        <View style={styles.settingItem}>
          <Ionicons name="information-circle-outline" size={24} color={Colors.textSecondary} />
          <Text style={styles.settingText}>App Version</Text>
          <Text style={styles.versionText}>1.0.0</Text>
        </View>
      </View>

      <View style={styles.dangerSection}>
        <TouchableOpacity style={styles.dangerItem} onPress={handleDeleteAccount}>
          <Ionicons name="trash-outline" size={24} color={Colors.error} />
          <Text style={styles.dangerText}>Delete Account</Text>
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
  section: {
    margin: 16,
    marginBottom: 32,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingText: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.base,
    marginLeft: 12,
  },
  settingTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  settingDescription: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    marginTop: 2,
  },
  versionText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.base,
  },
  dangerSection: {
    margin: 16,
    marginTop: 32,
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  dangerText: {
    flex: 1,
    color: Colors.error,
    fontSize: Typography.fontSize.base,
    marginLeft: 12,
    fontWeight: Typography.fontWeight.medium,
  },
});