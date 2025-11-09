import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/utils';
import { registerFamilyMember } from '@/lib/familyData';
import { getUser } from '@/lib/auth';

type Tab = 'basic' | 'family' | 'physical' | 'medical' | 'personal' | 'location' | 'education';

export default function RegisterScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('basic');
  const [userFamilyLineId, setUserFamilyLineId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredName, setRegisteredName] = useState('');
  const [formData, setFormData] = useState({
    // Basic Info
    firstName: '',
    gender: 'M',
    generation: '1',
    ethnicity: '',
    bloodGroup: '',
    dob: '',
    dod: '',
    causeOfDeath: '',
    isAlive: true,
    
    // Family Relationships
    motherId: '',
    motherEmail: '',
    fatherId: '',
    fatherEmail: '',
    spouseId: '',
    spouseEmail: '',
    familyLineId: '',
    sharedAncestryKey: '',
    
    // Physical Characteristics
    eyeColor: '',
    hairColor: '',
    skinTone: '',
    birthmark: '',
    freckles: 'No',
    baldness: 'No',
    beardStyle: '',
    
    // Medical Conditions
    diabetes: 'No',
    heartIssue: 'No',
    asthma: 'No',
    colorBlindness: 'No',
    leftHanded: 'No',
    isTwin: 'No',
    otherDisease: '',
    disability: '',
    
    // Personal Traits & Culture (only for deceased)
    natureOfPerson: '',
    favNatureOfPerson: '',
    familyTraditions: '',
    passion: '',
    
    // Location & Background (only for deceased)
    nativeLocation: '',
    migrationPath: '',
    
    // Education & Status (only for deceased)
    educationLevel: '',
    socioeconomicStatus: '',
  });

  // Load user's family line ID on component mount
  useEffect(() => {
    const loadUserFamilyId = async () => {
      const loggedInUser = await getUser();
      if (loggedInUser?.familyLineId) {
        setUserFamilyLineId(loggedInUser.familyLineId);
        // Pre-fill family line ID in form
        setFormData(prev => ({ ...prev, familyLineId: loggedInUser.familyLineId || '' }));
      }
    };
    loadUserFamilyId();
  }, []);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getTabs = () => {
    const baseTabs: { id: Tab; title: string; icon: string }[] = [
      { id: 'basic', title: 'Basic Info', icon: 'person' },
      { id: 'family', title: 'Family Relations', icon: 'people' },
      { id: 'physical', title: 'Physical', icon: 'eye' },
      { id: 'medical', title: 'Medical', icon: 'medical' },
    ];
    
    if (!formData.isAlive) {
      baseTabs.push(
        { id: 'personal', title: 'Personal Traits', icon: 'heart' },
        { id: 'location', title: 'Location', icon: 'location' },
        { id: 'education', title: 'Education', icon: 'school' }
      );
    }
    
    return baseTabs;
  };

  // Reusable pill selector for small enumerations
  const PillSelect = ({
    options,
    value,
    onChange,
  }: {
    options: string[];
    value: string;
    onChange: (v: string) => void;
  }) => (
    <View style={styles.pillGroup}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[styles.pill, value === opt && styles.pillActive]}
          onPress={() => onChange(opt)}
        >
          <Text style={[styles.pillText, value === opt && styles.pillTextActive]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const handleSubmit = async () => {
    console.log('=== REGISTER SUBMIT STARTED ===');
    console.log('Form data:', formData);
    
    // Validation
    if (!formData.firstName) {
      console.log('Validation failed: No first name');
      Alert.alert('Validation Error', 'Please enter the person\'s name');
      return;
    }

    if (!formData.gender) {
      console.log('Validation failed: No gender');
      Alert.alert('Validation Error', 'Please select gender');
      return;
    }

    // Use user's family line ID if form field is empty
    const finalFamilyLineId = formData.familyLineId || userFamilyLineId;
    console.log('Final family line ID:', finalFamilyLineId);
    
    if (!finalFamilyLineId) {
      console.log('Validation failed: No family line ID');
      Alert.alert('Error', 'Family Line ID is required. Please log in to register family members.');
      return;
    }

    console.log('Validation passed, building member data...');
    console.log('Calling API to register member...');
    
    setIsSubmitting(true);
    
    try {
      // Build memberData object with only non-empty fields
      const memberData: any = {
        firstName: formData.firstName,
        gender: formData.gender,
        generation: parseInt(formData.generation) || 1,
        familyLineId: finalFamilyLineId,
      };

      // Add optional fields only if they have values
      if (formData.ethnicity) memberData.ethnicity = formData.ethnicity;
      if (formData.bloodGroup) memberData.bloodGroup = formData.bloodGroup;
      
      // Date fields - only include if filled
      if (formData.isAlive && formData.dob) {
        memberData.dob = formData.dob;
      } else if (!formData.isAlive) {
        if (formData.dod) memberData.dod = formData.dod;
        if (formData.causeOfDeath) memberData.causeOfDeath = formData.causeOfDeath;
      }
      
      // Family relationships - include both IDs and emails
      if (formData.motherId) memberData.motherId = formData.motherId;
      if (formData.motherEmail) memberData.motherEmail = formData.motherEmail;
      if (formData.fatherId) memberData.fatherId = formData.fatherId;
      if (formData.fatherEmail) memberData.fatherEmail = formData.fatherEmail;
      if (formData.spouseId) memberData.spouseId = formData.spouseId;
      if (formData.spouseEmail) memberData.spouseEmail = formData.spouseEmail;
      if (formData.sharedAncestryKey) memberData.sharedAncestryKey = formData.sharedAncestryKey;
      
      // Physical characteristics
      if (formData.eyeColor) memberData.eyeColor = formData.eyeColor;
      if (formData.hairColor) memberData.hairColor = formData.hairColor;
      if (formData.skinTone) memberData.skinTone = formData.skinTone;
      if (formData.birthmark) memberData.birthmark = formData.birthmark;
      if (formData.freckles && formData.freckles !== 'No') memberData.freckles = formData.freckles;
      if (formData.baldness && formData.baldness !== 'No') memberData.baldness = formData.baldness;
      if (formData.beardStyle) memberData.beardStyleTrend = formData.beardStyle;
      
      // Medical conditions
      if (formData.diabetes && formData.diabetes !== 'No') memberData.conditionDiabetes = formData.diabetes;
      if (formData.heartIssue && formData.heartIssue !== 'No') memberData.conditionHeartIssue = formData.heartIssue;
      if (formData.asthma && formData.asthma !== 'No') memberData.conditionAsthma = formData.asthma;
      if (formData.colorBlindness && formData.colorBlindness !== 'No') memberData.conditionColorBlindness = formData.colorBlindness;
      if (formData.leftHanded && formData.leftHanded !== 'No') memberData.leftHanded = formData.leftHanded;
      if (formData.isTwin && formData.isTwin !== 'No') memberData.isTwin = formData.isTwin;
      if (formData.otherDisease) memberData.otherDisease = formData.otherDisease;
      if (formData.disability) memberData.disability = formData.disability;
      
      // Personal traits (for deceased only)
      if (!formData.isAlive) {
        if (formData.natureOfPerson) memberData.natureOfPerson = formData.natureOfPerson;
        if (formData.familyTraditions) memberData.familyTraditions = formData.familyTraditions;
        if (formData.passion) memberData.passion = formData.passion;
        if (formData.nativeLocation) memberData.nativeLocation = formData.nativeLocation;
        if (formData.migrationPath) memberData.migrationPath = formData.migrationPath;
        if (formData.educationLevel) memberData.educationLevel = formData.educationLevel;
        if (formData.socioeconomicStatus) memberData.socioeconomicStatus = formData.socioeconomicStatus;
      }

      console.log('Submitting family member data:', memberData);
      const success = await registerFamilyMember(memberData);
      console.log('Registration API call completed. Success:', success);
      
      if (success) {
        console.log('Registration successful, showing success alert');
        setRegisteredName(formData.firstName);
        setShowSuccessModal(true);
        // Reset form
        setFormData({
          firstName: '', gender: 'M', generation: '1', ethnicity: '', bloodGroup: '',
          dob: '', dod: '', causeOfDeath: '', isAlive: true, 
          motherId: '', motherEmail: '', fatherId: '', fatherEmail: '',
          spouseId: '', spouseEmail: '', familyLineId: userFamilyLineId, sharedAncestryKey: '', 
          eyeColor: '', hairColor: '',
          skinTone: '', birthmark: '', freckles: 'No', baldness: 'No', beardStyle: '',
          diabetes: 'No', heartIssue: 'No', asthma: 'No', colorBlindness: 'No',
          leftHanded: 'No', isTwin: 'No', otherDisease: '', disability: '',
          natureOfPerson: '', favNatureOfPerson: '', familyTraditions: '', passion: '',
          nativeLocation: '', migrationPath: '', educationLevel: '', socioeconomicStatus: '',
        });
        setActiveTab('basic');
      } else {
        console.log('Registration failed, showing error alert');
        Alert.alert(
          'Registration Failed',
          'Failed to register family member. Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert(
        'Error',
        'Something went wrong while registering the family member. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBasicInfo = () => (
    <View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.firstName}
          onChangeText={(value) => handleInputChange('firstName', value)}
          placeholder="Enter full name"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Gender *</Text>
        <View style={styles.segmentGroup}>
          <TouchableOpacity
            style={[styles.segmentButton, formData.gender === 'M' && styles.segmentButtonActive]}
            onPress={() => handleInputChange('gender', 'M')}
          >
            <Text style={[styles.segmentText, formData.gender === 'M' && styles.segmentTextActive]}>Male</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentButton, formData.gender === 'F' && styles.segmentButtonActive]}
            onPress={() => handleInputChange('gender', 'F')}
          >
            <Text style={[styles.segmentText, formData.gender === 'F' && styles.segmentTextActive]}>Female</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Generation</Text>
        <TextInput
          style={styles.input}
          value={formData.generation}
          onChangeText={(value) => handleInputChange('generation', value)}
          placeholder="Enter generation number"
          keyboardType="numeric"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Ethnicity</Text>
        <TextInput
          style={styles.input}
          value={formData.ethnicity}
          onChangeText={(value) => handleInputChange('ethnicity', value)}
          placeholder="Enter ethnicity"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Blood Group</Text>
        <PillSelect
          options={[
            'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
          ]}
          value={formData.bloodGroup}
          onChange={(v) => handleInputChange('bloodGroup', v)}
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Are they alive?</Text>
        <View style={styles.radioGroup}>
          <TouchableOpacity
            style={[styles.radioButton, formData.isAlive && styles.radioButtonActive]}
            onPress={() => handleInputChange('isAlive', true)}
          >
            <Text style={[styles.radioText, formData.isAlive && styles.radioTextActive]}>Alive</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.radioButton, !formData.isAlive && styles.radioButtonActive]}
            onPress={() => handleInputChange('isAlive', false)}
          >
            <Text style={[styles.radioText, !formData.isAlive && styles.radioTextActive]}>Deceased</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {formData.isAlive ? (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date of Birth</Text>
          <TextInput
            style={styles.input}
            value={formData.dob}
            onChangeText={(value) => handleInputChange('dob', value)}
            placeholder="YYYY-MM-DD"
          />
        </View>
      ) : (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date of Death</Text>
            <TextInput
              style={styles.input}
              value={formData.dod}
              onChangeText={(value) => handleInputChange('dod', value)}
              placeholder="YYYY-MM-DD"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cause of Death</Text>
            <TextInput
              style={styles.input}
              value={formData.causeOfDeath}
              onChangeText={(value) => handleInputChange('causeOfDeath', value)}
              placeholder="Enter cause of death"
            />
          </View>
        </>
      )}
    </View>
  );

  const renderFamilyRelations = () => (
    <View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Mother Email</Text>
        <TextInput
          style={styles.input}
          value={formData.motherEmail}
          onChangeText={(value) => handleInputChange('motherEmail', value)}
          placeholder="Enter mother's email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Father Email</Text>
        <TextInput
          style={styles.input}
          value={formData.fatherEmail}
          onChangeText={(value) => handleInputChange('fatherEmail', value)}
          placeholder="Enter father's email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Spouse Email</Text>
        <TextInput
          style={styles.input}
          value={formData.spouseEmail}
          onChangeText={(value) => handleInputChange('spouseEmail', value)}
          placeholder="Enter spouse's email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Family Line ID {userFamilyLineId ? '(Auto-filled)' : ''}</Text>
        <TextInput
          style={[styles.input, userFamilyLineId && styles.inputDisabled]}
          value={formData.familyLineId}
          onChangeText={(value) => handleInputChange('familyLineId', value)}
          placeholder={userFamilyLineId ? userFamilyLineId : "Will use your family line ID"}
          editable={!userFamilyLineId}
        />
        {userFamilyLineId && (
          <Text style={styles.helpText}>
            Using your family line ID. All family members you register will be part of your family tree.
          </Text>
        )}
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Shared Ancestry Key</Text>
        <TextInput
          style={styles.input}
          value={formData.sharedAncestryKey}
          onChangeText={(value) => handleInputChange('sharedAncestryKey', value)}
          placeholder="Enter ancestry key"
        />
      </View>
    </View>
  );

  const YesNoSelector = ({ value, onChange }: { value: string; onChange: (val: string) => void }) => (
    <View style={styles.radioGroup}>
      <TouchableOpacity
        style={[styles.radioButton, value === 'Yes' && styles.radioButtonActive]}
        onPress={() => onChange('Yes')}
      >
        <Text style={[styles.radioText, value === 'Yes' && styles.radioTextActive]}>Yes</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.radioButton, value === 'No' && styles.radioButtonActive]}
        onPress={() => onChange('No')}
      >
        <Text style={[styles.radioText, value === 'No' && styles.radioTextActive]}>No</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPhysical = () => (
    <View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Eye Color</Text>
        <TextInput
          style={styles.input}
          value={formData.eyeColor}
          onChangeText={(value) => handleInputChange('eyeColor', value)}
          placeholder="e.g., Brown, Blue, Green"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Hair Color</Text>
        <TextInput
          style={styles.input}
          value={formData.hairColor}
          onChangeText={(value) => handleInputChange('hairColor', value)}
          placeholder="e.g., Black, Brown, Blonde"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Skin Tone</Text>
        <TextInput
          style={styles.input}
          value={formData.skinTone}
          onChangeText={(value) => handleInputChange('skinTone', value)}
          placeholder="e.g., Fair, Medium, Dark"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Birthmark</Text>
        <TextInput
          style={styles.input}
          value={formData.birthmark}
          onChangeText={(value) => handleInputChange('birthmark', value)}
          placeholder="Describe any birthmarks"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Freckles</Text>
        <YesNoSelector
          value={formData.freckles}
          onChange={(value) => handleInputChange('freckles', value)}
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Baldness</Text>
        <YesNoSelector
          value={formData.baldness}
          onChange={(value) => handleInputChange('baldness', value)}
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Beard Style</Text>
        <TextInput
          style={styles.input}
          value={formData.beardStyle}
          onChangeText={(value) => handleInputChange('beardStyle', value)}
          placeholder="Describe beard style"
        />
      </View>
    </View>
  );

  const renderMedical = () => (
    <View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Diabetes</Text>
        <YesNoSelector
          value={formData.diabetes}
          onChange={(value) => handleInputChange('diabetes', value)}
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Heart Issues</Text>
        <YesNoSelector
          value={formData.heartIssue}
          onChange={(value) => handleInputChange('heartIssue', value)}
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Asthma</Text>
        <YesNoSelector
          value={formData.asthma}
          onChange={(value) => handleInputChange('asthma', value)}
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Color Blindness</Text>
        <YesNoSelector
          value={formData.colorBlindness}
          onChange={(value) => handleInputChange('colorBlindness', value)}
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Left Handed</Text>
        <YesNoSelector
          value={formData.leftHanded}
          onChange={(value) => handleInputChange('leftHanded', value)}
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Is Twin</Text>
        <YesNoSelector
          value={formData.isTwin}
          onChange={(value) => handleInputChange('isTwin', value)}
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Other Diseases</Text>
        <TextInput
          style={styles.input}
          value={formData.otherDisease}
          onChangeText={(value) => handleInputChange('otherDisease', value)}
          placeholder="List any other diseases"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Disability</Text>
        <TextInput
          style={styles.input}
          value={formData.disability}
          onChangeText={(value) => handleInputChange('disability', value)}
          placeholder="Describe any disabilities"
        />
      </View>
    </View>
  );

  const renderPersonalTraits = () => (
    <View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nature of Person</Text>
        <TextInput
          style={styles.input}
          value={formData.natureOfPerson}
          onChangeText={(value) => handleInputChange('natureOfPerson', value)}
          placeholder="e.g., Kind, Generous, Wise"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Favorite Nature Traits</Text>
        <TextInput
          style={styles.input}
          value={formData.favNatureOfPerson}
          onChangeText={(value) => handleInputChange('favNatureOfPerson', value)}
          placeholder="Their favorite personality traits"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Family Traditions</Text>
        <TextInput
          style={styles.input}
          value={formData.familyTraditions}
          onChangeText={(value) => handleInputChange('familyTraditions', value)}
          placeholder="Describe family traditions they followed"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Passion/Interests</Text>
        <TextInput
          style={styles.input}
          value={formData.passion}
          onChangeText={(value) => handleInputChange('passion', value)}
          placeholder="Their hobbies and interests"
        />
      </View>
    </View>
  );

  const renderLocation = () => (
    <View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Native Location</Text>
        <TextInput
          style={styles.input}
          value={formData.nativeLocation}
          onChangeText={(value) => handleInputChange('nativeLocation', value)}
          placeholder="Their place of birth/origin"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Migration Path</Text>
        <TextInput
          style={styles.input}
          value={formData.migrationPath}
          onChangeText={(value) => handleInputChange('migrationPath', value)}
          placeholder="Places they lived/moved to"
        />
      </View>
    </View>
  );

  const renderEducation = () => (
    <View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Education Level</Text>
        <PillSelect
          options={["High School", "Bachelor's", "Master's", 'PhD']}
          value={formData.educationLevel}
          onChange={(v) => handleInputChange('educationLevel', v)}
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Socioeconomic Status</Text>
        <PillSelect
          options={['Lower', 'Middle', 'Upper']}
          value={formData.socioeconomicStatus}
          onChange={(v) => handleInputChange('socioeconomicStatus', v)}
        />
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic': return renderBasicInfo();
      case 'family': return renderFamilyRelations();
      case 'physical': return renderPhysical();
      case 'medical': return renderMedical();
      case 'personal': return renderPersonalTraits();
      case 'location': return renderLocation();
      case 'education': return renderEducation();
      default: return renderBasicInfo();
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.accent]}
        style={styles.header}
      >
        <Ionicons name="person-add" size={48} color="white" />
        <Text style={styles.headerTitle}>Register Family Member</Text>
        <Text style={styles.headerSubtitle}>
          Add detailed information about your family member
        </Text>
      </LinearGradient>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={64} color={colors.primary} />
            </View>
            <Text style={styles.modalTitle}>Success! 🎉</Text>
            <Text style={styles.modalMessage}>
              {registeredName} has been successfully added to your family tree.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowSuccessModal(false)}
            >
              <LinearGradient
                colors={[colors.primary, colors.accent]}
                style={styles.modalButtonGradient}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {getTabs().map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.id ? colors.primary : '#666'}
            />
            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.form}>
        {renderTabContent()}
        
        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <LinearGradient
            colors={isSubmitting ? ['#999', '#666'] : [colors.primary, colors.accent]}
            style={styles.submitGradient}
          >
            {isSubmitting ? (
              <>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.submitText}>Registering...</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark" size={24} color="white" />
                <Text style={styles.submitText}>Register Family Member</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  tabsContainer: {
    backgroundColor: 'white',
    paddingVertical: 6,
    paddingHorizontal: 5,
    height: 50,
    marginTop: -8,
    marginBottom: 4,
    flexGrow: 0,
    flexShrink: 0,
  },
  tabsContent: {
    alignItems: 'center',
    flexGrow: 0,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    height: 38,
    marginHorizontal: 4,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    gap: 6,
  },
  activeTab: {
    backgroundColor: colors.secondary,
  },
  tabText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
  },
  form: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  pillGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'white',
  },
  pillActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  pillTextActive: {
    color: colors.primary,
  },
  segmentGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  segmentButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'white',
  },
  segmentButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  segmentText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  segmentTextActive: {
    color: 'white',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  radioButton: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'white',
  },
  radioButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  radioText: {
    fontSize: 14,
    color: '#666',
  },
  radioTextActive: {
    color: 'white',
  },
  submitButton: {
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  submitText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  modalButton: {
    width: '100%',
    marginTop: 8,
  },
  modalButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});