import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, PanResponder, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/utils';
import { searchFamilyMembers, getAllFamilyMembers, FamilyMember } from '@/lib/familyData';
import { getUser } from '@/lib/auth';

type Tab = 'basic' | 'family' | 'physical' | 'medical' | 'personal' | 'location' | 'education';

export default function SearchScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('basic');
  const [searchResults, setSearchResults] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultsHeight, setResultsHeight] = useState(300);
  const panY = useRef(new Animated.Value(0)).current;
  const [searchFilters, setSearchFilters] = useState({
    // Basic Info
    firstName: '',
    gender: '',
    generation: '',
    ethnicity: '',
    bloodGroup: '',
    isAlive: '',
    
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
    freckles: '',
    baldness: '',
    beardStyle: '',
    
    // Medical Conditions
    diabetes: '',
    heartIssue: '',
    asthma: '',
    colorBlindness: '',
    leftHanded: '',
    isTwin: '',
    otherDisease: '',
    disability: '',
    
    // Personal Traits & Culture
    natureOfPerson: '',
    familyTraditions: '',
    passion: '',
    
    // Location & Background
    nativeLocation: '',
    migrationPath: '',
    
    // Education & Status
    educationLevel: '',
    socioeconomicStatus: '',
  });

  // Ensure we don't render duplicates that would cause duplicate React keys
  const uniqueByPersonId = (list: FamilyMember[]) => {
    const seen = new Set<string>();
    return list.filter((m) => {
      const id = String(m.personId ?? '');
      if (!id) return true;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  };

  useEffect(() => {
    loadAllMembers();
  }, []);

  const loadAllMembers = async () => {
    setLoading(true);
    try {
      // Load all members for the user's family line
      const loggedInUser = await getUser();
      const query: any = {};
      
      if (loggedInUser?.familyLineId) {
        query.familyLineId = loggedInUser.familyLineId;
      }
      
      const members = await searchFamilyMembers(query);
      setSearchResults(uniqueByPersonId(members));
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setSearchFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      // Get logged in user to ensure we filter by their family
      const loggedInUser = await getUser();
      
      // Build search query from filters
      const query: any = {};
      
      // Always include family line ID if available
      if (loggedInUser?.familyLineId) {
        query.familyLineId = loggedInUser.familyLineId;
      }
      
      // Add other filters only if they have values
      if (searchFilters.firstName) query.firstName = searchFilters.firstName;
      if (searchFilters.gender) query.gender = searchFilters.gender;
      if (searchFilters.bloodGroup) query.bloodGroup = searchFilters.bloodGroup;
      if (searchFilters.ethnicity) query.ethnicity = searchFilters.ethnicity;
      if (searchFilters.eyeColor) query.eyeColor = searchFilters.eyeColor;
      if (searchFilters.hairColor) query.hairColor = searchFilters.hairColor;
      if (searchFilters.skinTone) query.skinTone = searchFilters.skinTone;
      if (searchFilters.diabetes) query.conditionDiabetes = searchFilters.diabetes;
      if (searchFilters.heartIssue) query.conditionHeartIssue = searchFilters.heartIssue;
      if (searchFilters.asthma) query.conditionAsthma = searchFilters.asthma;
      if (searchFilters.colorBlindness) query.conditionColorBlindness = searchFilters.colorBlindness;
      if (searchFilters.leftHanded) query.leftHanded = searchFilters.leftHanded;
      if (searchFilters.isTwin) query.isTwin = searchFilters.isTwin;
      if (searchFilters.freckles) query.freckles = searchFilters.freckles;
      if (searchFilters.baldness) query.baldness = searchFilters.baldness;
      if (searchFilters.natureOfPerson) query.natureOfPerson = searchFilters.natureOfPerson;
      if (searchFilters.passion) query.passion = searchFilters.passion;
      if (searchFilters.nativeLocation) query.nativeLocation = searchFilters.nativeLocation;
      if (searchFilters.educationLevel) query.educationLevel = searchFilters.educationLevel;
      if (searchFilters.socioeconomicStatus) query.socioeconomicStatus = searchFilters.socioeconomicStatus;
      if (searchFilters.motherId) query.motherId = searchFilters.motherId;
      if (searchFilters.motherEmail) query.motherEmail = searchFilters.motherEmail;
      if (searchFilters.fatherId) query.fatherId = searchFilters.fatherId;
      if (searchFilters.fatherEmail) query.fatherEmail = searchFilters.fatherEmail;
      if (searchFilters.spouseId) query.spouseId = searchFilters.spouseId;
      if (searchFilters.spouseEmail) query.spouseEmail = searchFilters.spouseEmail;
      if (searchFilters.generation) query.generation = parseInt(searchFilters.generation);
      
      console.log('Searching with query:', query);
      const members = await searchFamilyMembers(query);
      setSearchResults(uniqueByPersonId(members));
    } catch (error) {
      console.error('Error searching:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchFilters({
      firstName: '', gender: '', generation: '', ethnicity: '', bloodGroup: '', isAlive: '',
      motherId: '', motherEmail: '', fatherId: '', fatherEmail: '', spouseId: '', spouseEmail: '', 
      familyLineId: '', sharedAncestryKey: '',
      eyeColor: '', hairColor: '', skinTone: '', birthmark: '', freckles: '', baldness: '', beardStyle: '',
      diabetes: '', heartIssue: '', asthma: '', colorBlindness: '', leftHanded: '', isTwin: '', otherDisease: '', disability: '',
      natureOfPerson: '', familyTraditions: '', passion: '',
      nativeLocation: '', migrationPath: '',
      educationLevel: '', socioeconomicStatus: '',
    });
    loadAllMembers();
  };

  // Pan responder for dragging the results section
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        panY.setOffset(resultsHeight);
      },
      onPanResponderMove: (_, gestureState) => {
        const newHeight = resultsHeight - gestureState.dy;
        if (newHeight >= 100 && newHeight <= 600) {
          panY.setValue(-gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const newHeight = resultsHeight - gestureState.dy;
        const clampedHeight = Math.max(100, Math.min(600, newHeight));
        setResultsHeight(clampedHeight);
        panY.flattenOffset();
        panY.setValue(0);
      },
    })
  ).current;

  const getTabs = () => {
    const tabs: { id: Tab; title: string; icon: string }[] = [
      { id: 'basic', title: 'Basic Info', icon: 'person' },
      { id: 'family', title: 'Family Relations', icon: 'people' },
      { id: 'physical', title: 'Physical', icon: 'eye' },
      { id: 'medical', title: 'Medical', icon: 'medical' },
      { id: 'personal', title: 'Personal Traits', icon: 'heart' },
      { id: 'location', title: 'Location', icon: 'location' },
      { id: 'education', title: 'Education', icon: 'school' }
    ];
    
    return tabs;
  };

  // Reusable pill selector
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
      <TouchableOpacity
        style={[styles.pill, value === '' && styles.pillActive]}
        onPress={() => onChange('')}
      >
        <Text style={[styles.pillText, value === '' && styles.pillTextActive]}>Any</Text>
      </TouchableOpacity>
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

  const YesNoSelector = ({ value, onChange }: { value: string; onChange: (val: string) => void }) => (
    <View style={styles.radioGroup}>
      <TouchableOpacity
        style={[styles.radioButton, value === '' && styles.radioButtonActive]}
        onPress={() => onChange('')}
      >
        <Text style={[styles.radioText, value === '' && styles.radioTextActive]}>Any</Text>
      </TouchableOpacity>
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

  const renderBasicInfo = () => (
    <View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={searchFilters.firstName}
          onChangeText={(value) => handleFilterChange('firstName', value)}
          placeholder="Search by name"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Gender</Text>
        <View style={styles.segmentGroup}>
          <TouchableOpacity
            style={[styles.segmentButton, searchFilters.gender === '' && styles.segmentButtonActive]}
            onPress={() => handleFilterChange('gender', '')}
          >
            <Text style={[styles.segmentText, searchFilters.gender === '' && styles.segmentTextActive]}>Any</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentButton, searchFilters.gender === 'M' && styles.segmentButtonActive]}
            onPress={() => handleFilterChange('gender', 'M')}
          >
            <Text style={[styles.segmentText, searchFilters.gender === 'M' && styles.segmentTextActive]}>Male</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentButton, searchFilters.gender === 'F' && styles.segmentButtonActive]}
            onPress={() => handleFilterChange('gender', 'F')}
          >
            <Text style={[styles.segmentText, searchFilters.gender === 'F' && styles.segmentTextActive]}>Female</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Ethnicity</Text>
        <TextInput
          style={styles.input}
          value={searchFilters.ethnicity}
          onChangeText={(value) => handleFilterChange('ethnicity', value)}
          placeholder="Search by ethnicity"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Blood Group</Text>
        <PillSelect
          options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']}
          value={searchFilters.bloodGroup}
          onChange={(v) => handleFilterChange('bloodGroup', v)}
        />
      </View>
    </View>
  );

  const renderFamilyRelations = () => (
    <View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Mother Email</Text>
        <TextInput
          style={styles.input}
          value={searchFilters.motherEmail}
          onChangeText={(value) => handleFilterChange('motherEmail', value)}
          placeholder="Search by mother's email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Father Email</Text>
        <TextInput
          style={styles.input}
          value={searchFilters.fatherEmail}
          onChangeText={(value) => handleFilterChange('fatherEmail', value)}
          placeholder="Search by father's email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Spouse Email</Text>
        <TextInput
          style={styles.input}
          value={searchFilters.spouseEmail}
          onChangeText={(value) => handleFilterChange('spouseEmail', value)}
          placeholder="Search by spouse's email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Family Line ID</Text>
        <TextInput
          style={styles.input}
          value={searchFilters.familyLineId}
          onChangeText={(value) => handleFilterChange('familyLineId', value)}
          placeholder="Search by family line"
        />
      </View>
    </View>
  );

  const renderPhysical = () => (
    <View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Eye Color</Text>
        <TextInput
          style={styles.input}
          value={searchFilters.eyeColor}
          onChangeText={(value) => handleFilterChange('eyeColor', value)}
          placeholder="e.g., Brown, Blue, Green"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Hair Color</Text>
        <TextInput
          style={styles.input}
          value={searchFilters.hairColor}
          onChangeText={(value) => handleFilterChange('hairColor', value)}
          placeholder="e.g., Black, Brown, Blonde"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Skin Tone</Text>
        <TextInput
          style={styles.input}
          value={searchFilters.skinTone}
          onChangeText={(value) => handleFilterChange('skinTone', value)}
          placeholder="e.g., Fair, Medium, Dark"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Freckles</Text>
        <YesNoSelector
          value={searchFilters.freckles}
          onChange={(value) => handleFilterChange('freckles', value)}
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Baldness</Text>
        <YesNoSelector
          value={searchFilters.baldness}
          onChange={(value) => handleFilterChange('baldness', value)}
        />
      </View>
    </View>
  );

  const renderMedical = () => (
    <View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Diabetes</Text>
        <YesNoSelector
          value={searchFilters.diabetes}
          onChange={(value) => handleFilterChange('diabetes', value)}
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Heart Issues</Text>
        <YesNoSelector
          value={searchFilters.heartIssue}
          onChange={(value) => handleFilterChange('heartIssue', value)}
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Asthma</Text>
        <YesNoSelector
          value={searchFilters.asthma}
          onChange={(value) => handleFilterChange('asthma', value)}
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Color Blindness</Text>
        <YesNoSelector
          value={searchFilters.colorBlindness}
          onChange={(value) => handleFilterChange('colorBlindness', value)}
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Left Handed</Text>
        <YesNoSelector
          value={searchFilters.leftHanded}
          onChange={(value) => handleFilterChange('leftHanded', value)}
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Is Twin</Text>
        <YesNoSelector
          value={searchFilters.isTwin}
          onChange={(value) => handleFilterChange('isTwin', value)}
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
          value={searchFilters.natureOfPerson}
          onChangeText={(value) => handleFilterChange('natureOfPerson', value)}
          placeholder="e.g., Kind, Generous, Wise"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Family Traditions</Text>
        <TextInput
          style={styles.input}
          value={searchFilters.familyTraditions}
          onChangeText={(value) => handleFilterChange('familyTraditions', value)}
          placeholder="Search by traditions"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Passion/Interests</Text>
        <TextInput
          style={styles.input}
          value={searchFilters.passion}
          onChangeText={(value) => handleFilterChange('passion', value)}
          placeholder="Search by hobbies and interests"
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
          value={searchFilters.nativeLocation}
          onChangeText={(value) => handleFilterChange('nativeLocation', value)}
          placeholder="Search by birthplace/origin"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Migration Path</Text>
        <TextInput
          style={styles.input}
          value={searchFilters.migrationPath}
          onChangeText={(value) => handleFilterChange('migrationPath', value)}
          placeholder="Search by places lived"
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
          value={searchFilters.educationLevel}
          onChange={(v) => handleFilterChange('educationLevel', v)}
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Socioeconomic Status</Text>
        <PillSelect
          options={['Lower', 'Middle', 'Upper']}
          value={searchFilters.socioeconomicStatus}
          onChange={(v) => handleFilterChange('socioeconomicStatus', v)}
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

  const renderFamilyMember = (member: FamilyMember) => (
    <TouchableOpacity key={member.personId} style={styles.memberCard}>
      <View style={styles.memberHeader}>
        <View style={styles.memberAvatar}>
          <Text style={styles.memberInitial}>{member.firstName?.charAt(0) || '?'}</Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{member.firstName}</Text>
          <Text style={styles.memberRelation}>{member.natureOfPerson || 'Family Member'}</Text>
          <Text style={styles.memberAge}>ID: {member.personId}</Text>
        </View>
      </View>
      
      <View style={styles.memberDetails}>
        {member.educationLevel && (
          <View style={styles.detailRow}>
            <Ionicons name="school" size={16} color={colors.primary} />
            <Text style={styles.detailText}>{member.educationLevel}</Text>
          </View>
        )}
        {member.nativeLocation && (
          <View style={styles.detailRow}>
            <Ionicons name="location" size={16} color={colors.primary} />
            <Text style={styles.detailText}>{member.nativeLocation}</Text>
          </View>
        )}
        {member.passion && (
          <View style={styles.traitsContainer}>
            <Text style={styles.traitsLabel}>Interests:</Text>
            <View style={styles.traitsRow}>
              {member.passion.split(',').slice(0, 3).map((trait, index) => (
                <View key={`${trait?.trim()?.toLowerCase() || 'trait'}-${index}`} style={styles.traitTag}>
                  <Text style={styles.traitText}>{trait.trim()}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.accent]}
        style={styles.header}
      >
        <Ionicons name="search" size={48} color="white" />
        <Text style={styles.headerTitle}>Search Family</Text>
        <Text style={styles.headerSubtitle}>
          Find family members by filtering various attributes
        </Text>
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer} contentContainerStyle={styles.tabsContent}>
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
        
        <View style={styles.buttonGroup}>
          <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
            <Ionicons name="refresh" size={20} color={colors.primary} />
            <Text style={styles.clearButtonText}>Clear Filters</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <LinearGradient
              colors={[colors.primary, colors.accent]}
              style={styles.searchGradient}
            >
              <Ionicons name="search" size={20} color="white" />
              <Text style={styles.searchButtonText}>Search</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {searchResults.length > 0 && (
        <Animated.View 
          style={[
            styles.resultsSection,
            { 
              height: Animated.add(resultsHeight, panY),
            }
          ]}
        >
          <View 
            {...panResponder.panHandlers}
            style={styles.dragHandle}
          >
            <View style={styles.dragIndicator} />
            <Text style={styles.resultsTitle}>
              {loading ? 'Loading...' : `Results (${searchResults.length})`}
            </Text>
          </View>
          <ScrollView style={styles.resultsScroll}>
            <View style={styles.membersList}>
              {searchResults.map(renderFamilyMember)}
            </View>
          </ScrollView>
        </Animated.View>
      )}
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
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  radioButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 6,
  },
  clearButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  searchButton: {
    flex: 1,
  },
  searchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: 'white',
  },
  dragHandle: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: 8,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  resultsScroll: {
    flex: 1,
  },
  membersList: {
    padding: 12,
    gap: 12,
  },
  memberCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberInitial: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 2,
  },
  memberRelation: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  memberAge: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  memberDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  traitsContainer: {
    marginTop: 8,
  },
  traitsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
    marginBottom: 6,
  },
  traitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  traitTag: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  traitText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
});
