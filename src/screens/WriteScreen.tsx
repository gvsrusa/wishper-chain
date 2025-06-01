import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography } from '../constants';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

type WriteScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const themes = [
  { name: 'Love', color: Colors.love },
  { name: 'Fear', color: Colors.fear },
  { name: 'Dreams', color: Colors.dreams },
  { name: 'Nature', color: Colors.nature },
  { name: 'Abstract', color: Colors.abstract },
  { name: 'Joy', color: Colors.joy },
  { name: 'Hope', color: Colors.hope },
  { name: 'Sadness', color: Colors.sadness },
];

export default function WriteScreen() {
  const navigation = useNavigation<WriteScreenNavigationProp>();
  const { user } = useAuth();
  const [whisperText, setWhisperText] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [customTheme, setCustomTheme] = useState('');
  const [showCustomTheme, setShowCustomTheme] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to create whispers.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Auth') }
      ]);
      return;
    }
    
    if (!whisperText.trim()) {
      Alert.alert('Error', 'Please enter your thoughts before whispering.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const themeToUse = showCustomTheme ? customTheme.trim() : selectedTheme;
      
      await api.createWhisper(
        whisperText.trim(),
        themeToUse || 'Abstract'
      );
      
      Alert.alert(
        'Whisper Shared!', 
        'Your thoughts have been transformed and shared with the community.',
        [{ text: 'OK', onPress: () => {
          setWhisperText('');
          setSelectedTheme(null);
          setCustomTheme('');
          setShowCustomTheme(false);
          navigation.navigate('Main', { screen: 'Home' });
        }}]
      );
    } catch (error) {
      Alert.alert(
        'Error', 
        error instanceof Error ? error.message : 'Failed to create whisper. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectTheme = (themeName: string) => {
    setSelectedTheme(selectedTheme === themeName ? null : themeName);
    setShowCustomTheme(false);
    setCustomTheme('');
  };

  const handleCustomTheme = () => {
    setShowCustomTheme(true);
    setSelectedTheme(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.instruction}>
        Share your thoughts, feelings, or dreams...
      </Text>
      
      <TextInput
        style={styles.textInput}
        placeholder="What's on your mind?"
        placeholderTextColor={Colors.textSecondary}
        value={whisperText}
        onChangeText={setWhisperText}
        multiline
        maxLength={500}
        textAlignVertical="top"
      />
      
      <Text style={styles.characterCount}>
        {whisperText.length}/500
      </Text>
      
      <View style={styles.themeSection}>
        <Text style={styles.sectionTitle}>Optional: Select a Theme</Text>
        
        <View style={styles.themeChips}>
          {themes.map((theme) => (
            <TouchableOpacity
              key={theme.name}
              style={[
                styles.themeChip,
                { backgroundColor: theme.color },
                selectedTheme === theme.name && styles.selectedChip
              ]}
              onPress={() => selectTheme(theme.name)}
            >
              <Text style={styles.themeChipText}>{theme.name}</Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={[
              styles.themeChip,
              styles.customChip,
              showCustomTheme && styles.selectedChip
            ]}
            onPress={handleCustomTheme}
          >
            <Text style={styles.customChipText}>+ Custom</Text>
          </TouchableOpacity>
        </View>
        
        {showCustomTheme && (
          <TextInput
            style={styles.customThemeInput}
            placeholder="Enter custom theme (max 3 words)"
            placeholderTextColor={Colors.textSecondary}
            value={customTheme}
            onChangeText={setCustomTheme}
            maxLength={30}
          />
        )}
      </View>
      
      <TouchableOpacity
        style={[styles.submitButton, (!whisperText.trim() || isSubmitting) && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={!whisperText.trim() || isSubmitting}
      >
        {isSubmitting ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.textPrimary} size="small" />
            <Text style={styles.loadingText}>Transforming...</Text>
          </View>
        ) : (
          <Text style={[styles.submitButtonText, (!whisperText.trim() || isSubmitting) && styles.disabledButtonText]}>
            Whisper It
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBackground,
  },
  contentContainer: {
    padding: 20,
  },
  instruction: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.base,
    marginBottom: 16,
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.base,
    minHeight: 120,
    marginBottom: 8,
    textAlignVertical: 'top',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  characterCount: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    textAlign: 'right',
    marginBottom: 24,
  },
  themeSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: 16,
  },
  themeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginVertical: -4,
  },
  themeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 4,
  },
  selectedChip: {
    borderWidth: 2,
    borderColor: Colors.primaryAccent,
  },
  themeChipText: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  customChip: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.primaryAccent,
  },
  customChipText: {
    color: Colors.primaryAccent,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  customThemeInput: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.sm,
  },
  submitButton: {
    backgroundColor: Colors.primaryAccent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
  },
  disabledButton: {
    backgroundColor: Colors.disabled,
  },
  disabledButtonText: {
    color: Colors.textSecondary,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginLeft: 8,
  },
});