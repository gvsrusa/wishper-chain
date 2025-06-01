import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  ScrollView, 
  StyleSheet,
  Alert,
  Platform,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../constants';
import { Picker } from '@react-native-picker/picker';
import Svg, { Path, G, Circle } from 'react-native-svg';

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
    // Data for visualizations
    const ageData = [
      { label: '19-25', value: 45, color: Colors.primaryAccent },
      { label: '26-40', value: 30, color: Colors.secondaryAccent },
      { label: '13-18', value: 15, color: Colors.dreams },
      { label: '41+', value: 10, color: Colors.hope },
    ];

    // Create pie chart paths
    const createPieSlice = () => {
      const total = ageData.reduce((sum, item) => sum + item.value, 0);
      let cumulativePercentage = 0;
      const size = 150;
      const center = size / 2;
      const radius = size / 2 - 15;

      return ageData.map((item) => {
        const percentage = item.value / total;
        const startAngle = cumulativePercentage * Math.PI * 2 - Math.PI / 2;
        const endAngle = (cumulativePercentage + percentage) * Math.PI * 2 - Math.PI / 2;
        
        const x1 = center + radius * Math.cos(startAngle);
        const y1 = center + radius * Math.sin(startAngle);
        const x2 = center + radius * Math.cos(endAngle);
        const y2 = center + radius * Math.sin(endAngle);
        
        const largeArcFlag = percentage > 0.5 ? 1 : 0;
        
        const pathData = [
          `M ${center} ${center}`,
          `L ${x1} ${y1}`,
          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
          'Z'
        ].join(' ');
        
        cumulativePercentage += percentage;
        
        return {
          ...item,
          path: pathData,
        };
      });
    };

    const pieData = createPieSlice();

    return (
      <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.overlay}>
          <View style={[styles.modal, styles.statsModal]}>
            <View style={styles.header}>
              <Text style={styles.title}>Community Insights</Text>
              <TouchableOpacity onPress={resetAndClose}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.insightHeader}>
                <Ionicons name="analytics" size={20} color={Colors.primaryAccent} />
                <Text style={[styles.insightSubtitle, { marginLeft: 8 }]}>
                  Based on {Math.floor(Math.random() * 900 + 100)} community guesses
                </Text>
              </View>

              {/* Age Distribution Pie Chart */}
              <View style={styles.statSection}>
                <Text style={styles.statTitle}>Age Distribution</Text>
                <View style={styles.pieChartContainer}>
                  <Svg width={150} height={150} viewBox="0 0 150 150">
                    <G>
                      {pieData.map((slice, index) => (
                        <Path
                          key={index}
                          d={slice.path}
                          fill={slice.color}
                          stroke={Colors.modalBackground}
                          strokeWidth={2}
                        />
                      ))}
                    </G>
                    {/* Center circle for donut effect */}
                    <Circle
                      cx={75}
                      cy={75}
                      r={30}
                      fill={Colors.modalBackground}
                    />
                  </Svg>
                  <View style={styles.pieChartLegend}>
                    {ageData.map((item, index) => (
                      <View key={index} style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                        <Text style={styles.legendText}>{item.label}</Text>
                        <Text style={styles.legendPercent}>{item.value}%</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              {/* Country Distribution */}
              <View style={styles.statSection}>
                <Text style={styles.statTitle}>Geographic Distribution</Text>
                <View style={styles.countryContainer}>
                  <View style={styles.countryItem}>
                    <Text style={styles.countryName}>🇺🇸 United States</Text>
                    <View style={styles.countryBarBg}>
                      <View style={[styles.countryBar, { width: '38%' }]} />
                      <Text style={styles.countryPercent}>38%</Text>
                    </View>
                  </View>
                  <View style={styles.countryItem}>
                    <Text style={styles.countryName}>🇨🇦 Canada</Text>
                    <View style={styles.countryBarBg}>
                      <View style={[styles.countryBar, { width: '22%' }]} />
                      <Text style={styles.countryPercent}>22%</Text>
                    </View>
                  </View>
                  <View style={styles.countryItem}>
                    <Text style={styles.countryName}>🇬🇧 United Kingdom</Text>
                    <View style={styles.countryBarBg}>
                      <View style={[styles.countryBar, { width: '15%' }]} />
                      <Text style={styles.countryPercent}>15%</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Gender Distribution */}
              <View style={styles.statSection}>
                <Text style={styles.statTitle}>Gender Distribution</Text>
                <View style={styles.genderContainer}>
                  <View style={styles.genderCard}>
                    <View style={[styles.genderCircle, { backgroundColor: Colors.love + '20' }]}>
                      <Text style={[styles.genderIcon, { color: Colors.love }]}>♀</Text>
                    </View>
                    <Text style={styles.genderPercent}>52%</Text>
                    <Text style={styles.genderLabel}>Female</Text>
                  </View>
                  <View style={styles.genderCard}>
                    <View style={[styles.genderCircle, { backgroundColor: Colors.dreams + '20' }]}>
                      <Text style={[styles.genderIcon, { color: Colors.dreams }]}>♂</Text>
                    </View>
                    <Text style={styles.genderPercent}>35%</Text>
                    <Text style={styles.genderLabel}>Male</Text>
                  </View>
                  <View style={styles.genderCard}>
                    <View style={[styles.genderCircle, { backgroundColor: Colors.hope + '20' }]}>
                      <Text style={[styles.genderIcon, { color: Colors.hope }]}>⚧</Text>
                    </View>
                    <Text style={styles.genderPercent}>13%</Text>
                    <Text style={styles.genderLabel}>Other</Text>
                  </View>
                </View>
              </View>

              <View style={styles.disclaimerBox}>
                <Ionicons name="information-circle" size={16} color={Colors.textSecondary} />
                <Text style={[styles.disclaimer, { marginLeft: 8 }]}>
                  These insights are based on anonymous community guesses and do not reveal 
                  the actual whisperer's identity or demographics.
                </Text>
              </View>
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
  statsModal: {
    maxHeight: '90%',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  insightSubtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
  },
  statSection: {
    marginBottom: 28,
  },
  statTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: 16,
    textAlign: 'center',
  },
  pieChartContainer: {
    alignItems: 'center',
  },
  pieChartLegend: {
    marginTop: 16,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    paddingHorizontal: 20,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.sm,
    flex: 1,
  },
  legendPercent: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  countryContainer: {
    paddingHorizontal: 20,
  },
  countryItem: {
    marginBottom: 12,
  },
  countryName: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.sm,
    marginBottom: 4,
  },
  countryBarBg: {
    height: 24,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  countryBar: {
    height: '100%',
    backgroundColor: Colors.primaryAccent,
    borderRadius: 12,
  },
  countryPercent: {
    position: 'absolute',
    right: 8,
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  genderCard: {
    alignItems: 'center',
  },
  genderCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  genderIcon: {
    fontSize: 24,
    fontWeight: Typography.fontWeight.bold,
  },
  genderPercent: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: 4,
  },
  genderLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
  },
  disclaimerBox: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  disclaimer: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontStyle: 'italic',
    flex: 1,
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.xs,
  },
});