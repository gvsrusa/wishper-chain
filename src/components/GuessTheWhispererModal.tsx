import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  ScrollView, 
  StyleSheet,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../constants';
import { Picker } from '@react-native-picker/picker';

interface Props {
  visible: boolean;
  onClose: () => void;
  whisperId: string;
}

const ageRanges = ['13-18', '19-25', '26-40', '41+'];
const genders = ['Male', 'Female', 'Other'];
const countries = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 
  'Germany', 'France', 'Spain', 'Italy', 'Netherlands', 'Belgium',
  'Switzerland', 'Austria', 'Sweden', 'Norway', 'Denmark', 'Finland',
  'Poland', 'Czech Republic', 'Japan', 'South Korea', 'China', 'India',
  'Brazil', 'Mexico', 'Argentina', 'Chile', 'South Africa', 'Nigeria',
  'Egypt', 'Israel', 'UAE', 'Saudi Arabia', 'Turkey', 'Russia',
  'New Zealand', 'Singapore', 'Malaysia', 'Thailand', 'Philippines',
  'Indonesia', 'Vietnam', 'Pakistan', 'Bangladesh', 'Other'
];

export default function GuessTheWhispererModal({ visible, onClose, whisperId }: Props) {
  const [selectedAge, setSelectedAge] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const handleSubmitGuess = () => {
    if (!selectedAge || !selectedCountry) {
      Alert.alert('Incomplete', 'Please select at least age and country to submit your guess.');
      return;
    }

    // Simulate API call
    setTimeout(() => {
      setShowStats(true);
    }, 1000);
  };

  const resetAndClose = () => {
    setSelectedAge(null);
    setSelectedGender(null);
    setSelectedCountry(null);
    setShowStats(false);
    onClose();
  };

  if (showStats) {
    return (
      <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.header}>
              <Text style={styles.title}>Community Insights</Text>
              <TouchableOpacity onPress={resetAndClose}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
              <Text style={styles.subtitle}>
                Here's what the community guessed about this whisperer:
              </Text>

              <View style={styles.statSection}>
                <Text style={styles.statTitle}>Age Range</Text>
                <View style={styles.statBar}>
                  <View style={[styles.statSegment, { flex: 3 }]}>
                    <Text style={styles.statLabel}>19-25: 45%</Text>
                  </View>
                  <View style={[styles.statSegment, { flex: 2 }]}>
                    <Text style={styles.statLabel}>26-40: 30%</Text>
                  </View>
                  <View style={[styles.statSegment, { flex: 1.5 }]}>
                    <Text style={styles.statLabel}>13-18: 15%</Text>
                  </View>
                  <View style={[styles.statSegment, { flex: 1 }]}>
                    <Text style={styles.statLabel}>41+: 10%</Text>
                  </View>
                </View>
              </View>

              <View style={styles.statSection}>
                <Text style={styles.statTitle}>Most Guessed Country</Text>
                <Text style={styles.bigStat}>United States (38%)</Text>
                <Text style={styles.statSubtext}>
                  Followed by Canada (22%) and United Kingdom (15%)
                </Text>
              </View>

              <View style={styles.statSection}>
                <Text style={styles.statTitle}>Gender Distribution</Text>
                <View style={styles.genderStats}>
                  <Text style={styles.statText}>Female: 52%</Text>
                  <Text style={styles.statText}>Male: 35%</Text>
                  <Text style={styles.statText}>Other/Prefer not to say: 13%</Text>
                </View>
              </View>

              <Text style={styles.disclaimer}>
                These insights are based on anonymous community guesses and do not reveal 
                the actual whisperer's identity or demographics.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Guess the Whisperer</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.subtitle}>
              Help us understand our community better! Your anonymous guesses contribute to valuable insights about our whisper patterns.
            </Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Age Range</Text>
              <View style={styles.chipContainer}>
                {ageRanges.map((age) => (
                  <TouchableOpacity
                    key={age}
                    style={[
                      styles.chip,
                      selectedAge === age && styles.selectedChip
                    ]}
                    onPress={() => setSelectedAge(age)}
                  >
                    <Text style={[
                      styles.chipText,
                      selectedAge === age && styles.selectedChipText
                    ]}>
                      {age}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Country</Text>
              {Platform.OS === 'ios' ? (
                <TouchableOpacity 
                  style={styles.pickerButton}
                  onPress={() => setShowCountryPicker(true)}
                >
                  <Text style={styles.pickerButtonText}>
                    {selectedCountry || 'Select a country'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              ) : (
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedCountry}
                    onValueChange={(itemValue) => setSelectedCountry(itemValue)}
                    style={styles.picker}
                    dropdownIconColor={Colors.textSecondary}
                  >
                    <Picker.Item label="Select a country" value={null} />
                    {countries.map((country) => (
                      <Picker.Item key={country} label={country} value={country} />
                    ))}
                  </Picker>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gender (Optional)</Text>
              <View style={styles.chipContainer}>
                {genders.map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    style={[
                      styles.chip,
                      selectedGender === gender && styles.selectedChip
                    ]}
                    onPress={() => setSelectedGender(gender)}
                  >
                    <Text style={[
                      styles.chipText,
                      selectedGender === gender && styles.selectedChipText
                    ]}>
                      {gender}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!selectedAge || !selectedCountry) && styles.disabledButton
              ]}
              onPress={handleSubmitGuess}
              disabled={!selectedAge || !selectedCountry}
            >
              <Text style={[
                styles.submitButtonText,
                (!selectedAge || !selectedCountry) && styles.disabledButtonText
              ]}>
                Reveal Stats
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
      
      {/* iOS Country Picker Modal */}
      {Platform.OS === 'ios' && (
        <Modal visible={showCountryPicker} transparent animationType="slide">
          <TouchableOpacity 
            style={styles.pickerModalOverlay} 
            activeOpacity={1}
            onPress={() => setShowCountryPicker(false)}
          >
            <View style={styles.pickerModalContent}>
              <View style={styles.pickerModalHeader}>
                <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                  <Text style={styles.pickerModalDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <Picker
                selectedValue={selectedCountry}
                onValueChange={(itemValue) => setSelectedCountry(itemValue)}
                style={styles.iosPicker}
              >
                <Picker.Item label="Select a country" value={null} />
                {countries.map((country) => (
                  <Picker.Item key={country} label={country} value={country} />
                ))}
              </Picker>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  modal: {
    backgroundColor: Colors.modalBackground,
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBackground,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  content: {
    padding: 20,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.sm,
    marginBottom: 24,
    paddingTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginVertical: -4,
  },
  chip: {
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBackground,
    margin: 4,
  },
  selectedChip: {
    backgroundColor: Colors.primaryAccent,
    borderColor: Colors.primaryAccent,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
  },
  selectedChipText: {
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  submitButton: {
    backgroundColor: Colors.primaryAccent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  disabledButton: {
    backgroundColor: Colors.disabled,
  },
  disabledButtonText: {
    color: Colors.textSecondary,
  },
  statSection: {
    marginBottom: 20,
  },
  statTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: 8,
  },
  statBar: {
    flexDirection: 'row',
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
  },
  statSegment: {
    backgroundColor: Colors.primaryAccent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
  },
  statLabel: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  bigStat: {
    color: Colors.primaryAccent,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  statSubtext: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    marginTop: 4,
  },
  genderStats: {
    marginVertical: -2,
  },
  statText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    marginVertical: 2,
  },
  disclaimer: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
  },
  pickerButton: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.base,
  },
  pickerContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    color: Colors.textPrimary,
    backgroundColor: Colors.cardBackground,
  },
  pickerModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerModalContent: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  pickerModalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.modalBackground,
    alignItems: 'flex-end',
  },
  pickerModalDone: {
    color: Colors.primaryAccent,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  iosPicker: {
    backgroundColor: Colors.cardBackground,
    height: 200,
  },
});