import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Alert } from 'react-native';
import { Colors, Typography } from '../constants';
import { useSignUp } from '@clerk/clerk-expo';

interface EmailVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EmailVerificationModal({ visible, onClose, onSuccess }: EmailVerificationModalProps) {
  const { signUp, setActive, isLoaded } = useSignUp();
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerification = async () => {
    if (!signUp || !isLoaded) return;
    if (!verificationCode.trim()) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    setIsVerifying(true);
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      });

      if (completeSignUp.status === 'complete' && completeSignUp.createdSessionId) {
        await setActive({ session: completeSignUp.createdSessionId });
        onSuccess();
      } else {
        Alert.alert('Error', 'Verification failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      Alert.alert('Error', error.errors?.[0]?.message || 'Failed to verify email');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!signUp || !isLoaded) return;

    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      Alert.alert('Success', 'Verification code resent to your email');
    } catch (error: any) {
      Alert.alert('Error', error.errors?.[0]?.message || 'Failed to resend code');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent a verification code to your email. Please enter it below.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter verification code"
            placeholderTextColor={Colors.textSecondary}
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="number-pad"
            maxLength={6}
          />

          <TouchableOpacity
            style={[styles.verifyButton, isVerifying && styles.disabledButton]}
            onPress={handleVerification}
            disabled={isVerifying}
          >
            {isVerifying ? (
              <ActivityIndicator color={Colors.textPrimary} />
            ) : (
              <Text style={styles.verifyButtonText}>Verify Email</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleResendCode}
            disabled={isVerifying}
          >
            <Text style={styles.resendButtonText}>Resend Code</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={isVerifying}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 350,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    backgroundColor: Colors.primaryBackground,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.lg,
    textAlign: 'center',
    letterSpacing: 8,
  },
  verifyButton: {
    backgroundColor: Colors.primaryAccent,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  verifyButtonText: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  resendButton: {
    alignItems: 'center',
    marginBottom: 12,
  },
  resendButtonText: {
    color: Colors.primaryAccent,
    fontSize: Typography.fontSize.sm,
    textDecorationLine: 'underline',
  },
  cancelButton: {
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
  },
  disabledButton: {
    opacity: 0.6,
  },
});