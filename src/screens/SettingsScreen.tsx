import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Switch, ScrollView, StyleSheet, Alert, ActivityIndicator, TextInput, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors, Typography } from '../constants';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { RootStackParamList } from '../types';

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { signOut } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [chainNotifications, setChainNotifications] = useState(true);
  const [achievementNotifications, setAchievementNotifications] = useState(true);
  const [guessDataSharing, setGuessDataSharing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your whispers, chains, and profile data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            Alert.alert(
              'Final Confirmation',
              'This is your last chance. Are you absolutely sure you want to delete your account?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete My Account',
                  style: 'destructive',
                  onPress: performAccountDeletion
                }
              ]
            );
          }
        }
      ]
    );
  };

  const performAccountDeletion = async () => {
    try {
      setIsDeleting(true);
      
      // Delete account data from database
      await api.deleteAccount();
      
      // Sign out from Clerk
      await signOut();
      
      Alert.alert(
        'Account Deleted', 
        'Your account has been successfully deleted.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigation will be handled by auth state change
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert('Error', 'Failed to delete account. Please try again or contact support.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleChangeUsername = () => {
    Alert.prompt(
      'Change Username',
      'Enter your new username:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async (newUsername) => {
            if (!newUsername || newUsername.trim().length < 3) {
              Alert.alert('Error', 'Username must be at least 3 characters long.');
              return;
            }

            try {
              await api.updateUsername(newUsername.trim());
              Alert.alert('Success', 'Username updated successfully.');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to update username.');
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const handleChangeEmail = () => {
    Alert.alert(
      'Change Email',
      'Email changes must be done through your account provider. Please visit your account settings in your browser.',
      [
        { text: 'OK' }
      ]
    );
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'Password changes must be done through your account provider. Please visit your account settings in your browser.',
      [
        { text: 'OK' }
      ]
    );
  };

  const handleHelpFAQ = () => {
    Alert.alert(
      'Help & FAQ',
      'Frequently Asked Questions:\n\n• How do I create a whisper?\nTap the Write tab and enter your thoughts.\n\n• How do chains work?\nOthers can respond to your whispers, creating a chain of connected thoughts.\n\n• Can I delete my whispers?\nCurrently, whispers cannot be deleted once published.\n\n• How are whispers transformed?\nOur AI transforms your raw thoughts into poetic expressions while preserving the original meaning.',
      [{ text: 'OK' }]
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Choose how you\'d like to contact our support team:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Email',
          onPress: () => {
            Linking.openURL('mailto:support@whisperchain.app?subject=WhisperChain%20Support');
          }
        }
      ]
    );
  };

  const handleTermsOfService = () => {
    Alert.alert(
      'Terms of Service',
      'By using WhisperChain, you agree to:\n\n• Share thoughts respectfully\n• Not post harmful or inappropriate content\n• Respect other users\' privacy\n• Allow transformation of your text\n\nFull terms available at: whisperchain.app/terms',
      [
        { text: 'OK' },
        {
          text: 'View Full Terms',
          onPress: () => {
            Linking.openURL('https://whisperchain.app/terms');
          }
        }
      ]
    );
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(
      'Privacy Policy',
      'WhisperChain respects your privacy:\n\n• We only collect necessary data\n• Your whispers are anonymous by default\n• We don\'t share personal information\n• You can delete your account anytime\n\nFull policy available at: whisperchain.app/privacy',
      [
        { text: 'OK' },
        {
          text: 'View Full Policy',
          onPress: () => {
            Linking.openURL('https://whisperchain.app/privacy');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity style={styles.settingItem} onPress={handleChangeUsername}>
          <Ionicons name="person-outline" size={24} color={Colors.textSecondary} />
          <Text style={styles.settingText}>Change Username</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem} onPress={handleChangeEmail}>
          <Ionicons name="mail-outline" size={24} color={Colors.textSecondary} />
          <Text style={styles.settingText}>Change Email</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem} onPress={handleChangePassword}>
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
        
        <TouchableOpacity style={styles.settingItem} onPress={handleHelpFAQ}>
          <Ionicons name="help-circle-outline" size={24} color={Colors.textSecondary} />
          <Text style={styles.settingText}>Help & FAQ</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem} onPress={handleContactSupport}>
          <Ionicons name="mail-outline" size={24} color={Colors.textSecondary} />
          <Text style={styles.settingText}>Contact Support</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem} onPress={handleTermsOfService}>
          <Ionicons name="document-text-outline" size={24} color={Colors.textSecondary} />
          <Text style={styles.settingText}>Terms of Service</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem} onPress={handlePrivacyPolicy}>
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
        <TouchableOpacity 
          style={[styles.dangerItem, isDeleting && styles.dangerItemDisabled]} 
          onPress={handleDeleteAccount}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color={Colors.error} />
          ) : (
            <Ionicons name="trash-outline" size={24} color={Colors.error} />
          )}
          <Text style={styles.dangerText}>
            {isDeleting ? 'Deleting Account...' : 'Delete Account'}
          </Text>
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
  dangerItemDisabled: {
    opacity: 0.6,
  },
});