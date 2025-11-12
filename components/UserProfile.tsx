import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/utils';
import { getUser } from '@/lib/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserProfileProps {
  visible: boolean;
  onClose: () => void;
}

const API_BASE = (process as any)?.env?.EXPO_PUBLIC_API_URL ?? 'https://kul-setu-backend.onrender.com';

export default function UserProfile({ visible, onClose }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [editedProfile, setEditedProfile] = useState<any>({});

  useEffect(() => {
    if (visible) {
      loadUserProfile();
    }
  }, [visible]);

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      const user = await getUser();
      if (!user) {
        Alert.alert('Error', 'Please log in to view your profile');
        onClose();
        return;
      }

      // Fetch full profile from backend using email
      const response = await fetch(`${API_BASE}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });

      if (response.ok) {
        const members = await response.json();
        if (members && members.length > 0) {
          const profile = members[0]; // Get first matching profile
          setUserProfile(profile);
          setEditedProfile({ ...profile });
        } else {
          // Use basic user info if no full profile found
          const basicProfile = {
            ...user,
            familyLineId: user.familyLineId || user.familyId || '',
          };
          setUserProfile(basicProfile);
          setEditedProfile({ ...basicProfile });
        }
      } else {
        const basicProfile = {
          ...user,
          familyLineId: user.familyLineId || user.familyId || '',
        };
        setUserProfile(basicProfile);
        setEditedProfile({ ...basicProfile });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditedProfile((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const user = await getUser();
      
      // Update profile on backend
      const response = await fetch(`${API_BASE}/members/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personId: userProfile.personId,
          ...editedProfile,
        }),
      });

      if (response.ok) {
        // Update local user data
        if (user) {
          const updatedUser = {
            ...user,
            firstName: editedProfile.firstName || user.firstName,
            lastName: editedProfile.lastName || user.lastName,
            email: editedProfile.email || user.email,
          };
          await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        }

        setUserProfile(editedProfile);
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        // Try to parse error, but handle HTML responses
        let errorMessage = 'Failed to update profile';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } else {
            const errorText = await response.text();
            console.log('Non-JSON response:', errorText.substring(0, 200));
            errorMessage = `Server error: ${response.status}`;
          }
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile. The backend endpoint may not be available.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile({ ...userProfile });
    setIsEditing(false);
  };

  const renderField = (label: string, field: string, value: any, editable: boolean = true) => {
    // Get the actual value from editedProfile for the current field
    const fieldValue = editedProfile[field];
    const displayValue = fieldValue !== null && fieldValue !== undefined && fieldValue !== '' ? String(fieldValue) : 'Not specified';
    
    if (!isEditing || !editable) {
      return (
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <Text style={styles.fieldValue}>{displayValue}</Text>
        </View>
      );
    }

    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput
          style={styles.fieldInput}
          value={editedProfile[field] || ''}
          onChangeText={(text) => handleInputChange(field, text)}
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor="#999"
        />
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient colors={[colors.primary, colors.accent]} style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity
            onPress={() => {
              if (isEditing) {
                handleCancel();
              } else {
                setIsEditing(true);
              }
            }}
            style={styles.editButton}
          >
            <Ionicons name={isEditing ? "close-circle" : "create"} size={24} color="white" />
          </TouchableOpacity>
        </LinearGradient>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        ) : (
          <ScrollView style={styles.content}>
            {/* Basic Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              {renderField('Full Name', 'firstName', editedProfile.firstName)}
              {renderField('Email', 'email', editedProfile.email)}
              {renderField('Gender', 'gender', editedProfile.gender === 'M' ? 'Male' : editedProfile.gender === 'F' ? 'Female' : editedProfile.gender)}
              {renderField('Generation', 'generation', editedProfile.generation)}
              {renderField('Blood Group', 'bloodGroup', editedProfile.bloodGroup)}
              {renderField('Ethnicity', 'ethnicity', editedProfile.ethnicity)}
              {renderField('Date of Birth', 'dob', editedProfile.dob)}
              {renderField('Family Line ID', 'familyLineId', editedProfile.familyLineId, false)}
            </View>

            {/* Physical Characteristics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Physical Characteristics</Text>
              {renderField('Eye Color', 'eyeColor', editedProfile.eyeColor)}
              {renderField('Hair Color', 'hairColor', editedProfile.hairColor)}
              {renderField('Skin Tone', 'skinTone', editedProfile.skinTone)}
              {renderField('Birthmark', 'birthmark', editedProfile.birthmark)}
              {renderField('Freckles', 'freckles', editedProfile.freckles)}
              {renderField('Baldness', 'baldness', editedProfile.baldness)}
              {renderField('Beard Style', 'beardStyle', editedProfile.beardStyle)}
            </View>

            {/* Medical Conditions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Medical Information</Text>
              {renderField('Diabetes', 'conditionDiabetes', editedProfile.conditionDiabetes)}
              {renderField('Heart Issue', 'conditionHeartIssue', editedProfile.conditionHeartIssue)}
              {renderField('Asthma', 'conditionAsthma', editedProfile.conditionAsthma)}
              {renderField('Color Blindness', 'conditionColorBlindness', editedProfile.conditionColorBlindness)}
              {renderField('Left Handed', 'leftHanded', editedProfile.leftHanded)}
              {renderField('Is Twin', 'isTwin', editedProfile.isTwin)}
              {renderField('Other Disease', 'otherDisease', editedProfile.otherDisease)}
              {renderField('Disability', 'disability', editedProfile.disability)}
            </View>

            {/* Personal Traits */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Traits</Text>
              {renderField('Nature of Person', 'natureOfPerson', editedProfile.natureOfPerson)}
              {renderField('Family Traditions', 'familyTraditions', editedProfile.familyTraditions)}
              {renderField('Passion', 'passion', editedProfile.passion)}
            </View>

            {/* Location */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location & Background</Text>
              {renderField('Native Location', 'nativeLocation', editedProfile.nativeLocation)}
              {renderField('Migration Path', 'migrationPath', editedProfile.migrationPath)}
            </View>

            {/* Education */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Education & Status</Text>
              {renderField('Education Level', 'educationLevel', editedProfile.educationLevel)}
              {renderField('Socioeconomic Status', 'socioeconomicStatus', editedProfile.socioeconomicStatus)}
            </View>

            {/* Save Button */}
            {isEditing && (
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={saving}
              >
                <LinearGradient
                  colors={[colors.primary, colors.accent]}
                  style={styles.saveGradient}
                >
                  {saving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="white" />
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            <View style={styles.bottomPadding} />
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  editButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  fieldValue: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
  },
  fieldInput: {
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f9f9f9',
  },
  saveButton: {
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 40,
  },
});
