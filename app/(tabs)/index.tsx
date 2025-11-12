import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, FlatList, ActivityIndicator, Modal, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import { colors, gradients } from '@/lib/utils';
import NotificationBanner from '@/components/NotificationBanner';
import Notifications from '@/components/Notifications';
import ApiStatus from '@/components/ApiStatus';
import FamilyFeed from '@/components/FamilyFeed';
import ChatDrawer from '@/components/ChatDrawer';
import ChatScreen from '@/components/ChatScreen';
import StoryViewer from '@/components/StoryViewer';
import UserProfile from '@/components/UserProfile';
import { logout, getUser } from '@/lib/auth';
import { apiService } from '@/lib/api';

interface Story {
  id: string;
  name: string;
  hasStory: boolean;
  isOwn?: boolean;
  personId?: string;
  stories?: Array<{
    storyId: string;
    mediaUrl: string;
    mediaType: string;
    createdAt: string;
    expiresAt: string;
    viewsCount: number;
  }>;
}

interface BackendStory {
  id: string;
  name: string;
  hasStory: boolean;
  isOwn: boolean;
  personId: string;
  userId: string;
  stories: Array<{
    storyId: string;
    mediaUrl: string;
    mediaType: string;
    createdAt: string;
    expiresAt: string;
    viewsCount: number;
  }>;
}

export default function HomeScreen() {
  const [chatDrawerVisible, setChatDrawerVisible] = useState(false);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [chatScreenVisible, setChatScreenVisible] = useState(false);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [savedPosts, setSavedPosts] = useState<string[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [uploadingStory, setUploadingStory] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    loadUserAndStories();
  }, []);

  const loadUserAndStories = async () => {
    try {
      const currentUser = await getUser();
      setUser(currentUser);

      if (!currentUser?.familyLineId) {
        console.log('No family line ID found');
        setLoadingStories(false);
        return;
      }

      // Fetch real stories from backend
      const storiesResponse = await apiService.getStories(currentUser.familyLineId);
      
      if (storiesResponse.success && storiesResponse.stories) {
        // Map backend stories to UI format
        const backendStories: BackendStory[] = storiesResponse.stories.map(userStory => ({
          id: userStory.userId,
          name: userStory.userName,
          hasStory: userStory.hasStory,
          isOwn: userStory.userId === currentUser.personId,
          personId: userStory.userId,
          userId: userStory.userId,
          stories: userStory.stories,
        }));

        // Add "Your Story" if user doesn't have story yet
        const hasOwnStory = backendStories.some(s => s.userId === currentUser.personId);
        const storiesData: Story[] = [
          {
            id: currentUser.personId || 'own',
            name: 'Your Story',
            hasStory: hasOwnStory,
            isOwn: true,
            personId: currentUser.personId,
            stories: hasOwnStory ? backendStories.find(s => s.userId === currentUser.personId)?.stories || [] : [],
          },
          ...backendStories.filter(s => s.userId !== currentUser.personId).map(s => ({
            id: s.id,
            name: s.name,
            hasStory: s.hasStory,
            isOwn: s.isOwn,
            personId: s.personId,
            stories: s.stories,
          })),
        ];

        setStories(storiesData);
      } else {
        // No stories yet, show "Your Story" only
        setStories([
          {
            id: currentUser.personId || 'own',
            name: 'Your Story',
            hasStory: false,
            isOwn: true,
            personId: currentUser.personId,
          },
        ]);
      }
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoadingStories(false);
    }
  };

  const handleChatSelect = (chat: any) => {
    setSelectedChat(chat);
    setChatDrawerVisible(false);
    setChatScreenVisible(true);
  };

  const handleCloseChatScreen = () => {
    setChatScreenVisible(false);
    setSelectedChat(null);
  };

  const handleStoryPress = (index: number) => {
    const story = stories[index];
    
    if (story.isOwn && !story.hasStory) {
      // Open create story modal
      setShowCreateStory(true);
    } else if (story.hasStory) {
      // Open story viewer
      setSelectedStoryIndex(index);
      setShowStoryViewer(true);
    }
  };

  const handleCreateStory = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library');
        return;
      }

      // Pick image or video
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
      });

      if (result.canceled) return;

      setUploadingStory(true);
      setShowCreateStory(false);

      const asset = result.assets[0];
      const mediaType = asset.type === 'video' ? 'video' : 'image';

      // Upload media
      const uploadResponse = await apiService.uploadMedia(
        asset.uri,
        `story_${Date.now()}.${mediaType === 'video' ? 'mp4' : 'jpg'}`,
        mediaType === 'video' ? 'video/mp4' : 'image/jpeg'
      );

      if (!uploadResponse.success || !uploadResponse.url) {
        throw new Error('Failed to upload media');
      }

      // Create story
      const storyResponse = await apiService.createStory({
        userId: user.personId,
        userName: `${user.firstName} ${user.lastName || ''}`.trim(),
        familyLineId: user.familyLineId,
        mediaUrl: uploadResponse.url,
        mediaType: mediaType,
      });

      if (storyResponse.success) {
        Alert.alert('Success', 'Story created successfully!');
        await loadUserAndStories(); // Reload stories
      } else {
        throw new Error('Failed to create story');
      }
    } catch (error) {
      console.error('Error creating story:', error);
      Alert.alert('Error', 'Failed to create story. Please try again.');
    } finally {
      setUploadingStory(false);
    }
  };

  const toggleLike = (postId: string) => {
    setLikedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  const toggleSave = (postId: string) => {
    setSavedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  const renderStory = ({ item, index }: { item: typeof stories[0]; index: number }) => (
    <TouchableOpacity 
      style={styles.storyItem}
      onPress={() => handleStoryPress(index)}
    >
      <View style={[
        styles.storyRing,
        item.hasStory && styles.storyRingActive,
        item.isOwn && !item.hasStory && styles.storyRingOwn
      ]}>
        <View style={styles.storyAvatar}>
          <Text style={styles.storyAvatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
          {item.isOwn && !item.hasStory && (
            <View style={styles.addStoryButton}>
              <Ionicons name="add" size={14} color="white" />
            </View>
          )}
        </View>
      </View>
      <Text style={styles.storyName} numberOfLines={1}>{item.name}</Text>
    </TouchableOpacity>
  );
  
  const handleLogout = async () => {
    // Use native Alert on iOS/Android and a confirm dialog on Web
    if (Platform.OS === 'web') {
      try {
        const hasConfirm = typeof (globalThis as any).confirm === 'function';
        const confirmed = hasConfirm ? (globalThis as any).confirm('Are you sure you want to logout?') : true;
        if (!confirmed) return;
        await logout();
        router.replace('/auth');
      } catch (error) {
        Alert.alert('Error', 'Failed to logout. Please try again.');
        console.error('Logout error (web):', error);
      }
      return;
    }

    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/auth');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const features = [
    {
      icon: 'person-add' as const,
      title: 'Register Family',
      description: 'Add your family members with detailed spiritual and personal attributes',
      route: '/register',
      gradient: gradients.spiritual
    },
    {
      icon: 'search' as const,
      title: 'Search Connections',
      description: 'Find family connections through traits, nature, and shared characteristics',
      route: '/search',
      gradient: gradients.sacred
    },
    {
      icon: 'people' as const,
      title: 'Family Profiles',
      description: 'Beautiful detailed profiles with photos, videos, and spiritual insights',
      route: '/tree',
      gradient: gradients.divine
    }
  ];

  return (
    <>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setChatDrawerVisible(true)}
            style={styles.chatButton}
          >
            <Ionicons name="chatbubbles-outline" size={24} color={colors.primary} />
          </TouchableOpacity>

          <Text style={styles.appTitle}>kul setu</Text>

          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => setShowProfile(true)}
            >
              <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
              <Ionicons name="log-out-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stories Section */}
        <View style={styles.storiesSection}>
          {loadingStories ? (
            <View style={styles.storiesLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={stories}
              renderItem={renderStory}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.storiesList}
            />
          )}
        </View>

      

        {/* Posts Feed */}
        <View style={styles.feedSection}>
          <FamilyFeed />
        </View>
      </ScrollView>

      {/* Chat Components */}
      <ChatDrawer
        visible={chatDrawerVisible}
        onClose={() => setChatDrawerVisible(false)}
        onChatSelect={handleChatSelect}
      />
      <ChatScreen
        visible={chatScreenVisible}
        chat={selectedChat}
        onClose={handleCloseChatScreen}
      />

      {/* Story Viewer */}
      {showStoryViewer && (
        <StoryViewer
          visible={showStoryViewer}
          userStories={stories
            .filter(s => s.hasStory && s.stories)
            .map(s => ({
              userId: s.personId || s.id,
              userName: s.name,
              stories: s.stories || [],
            }))}
          initialUserIndex={Math.max(0, selectedStoryIndex - 1)}
          currentUserId={user?.personId}
          onClose={() => setShowStoryViewer(false)}
          onStoryComplete={() => {
            setShowStoryViewer(false);
            loadUserAndStories();
          }}
        />
      )}

      {/* Create Story Modal */}
      <Modal
        visible={showCreateStory}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateStory(false)}
      >
        <View style={styles.createStoryOverlay}>
          <View style={styles.createStoryModal}>
            <View style={styles.createStoryHeader}>
              <Text style={styles.createStoryTitle}>Create Story</Text>
              <TouchableOpacity onPress={() => setShowCreateStory(false)}>
                <Ionicons name="close" size={28} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <Text style={styles.createStoryDescription}>
              Share a moment with your family. Your story will be visible for 24 hours.
            </Text>

            <TouchableOpacity
              style={styles.createStoryButton}
              onPress={handleCreateStory}
            >
              <Ionicons name="images-outline" size={24} color="white" />
              <Text style={styles.createStoryButtonText}>Choose Photo or Video</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.createStoryButton, styles.createStoryCameraButton]}
              onPress={async () => {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                  Alert.alert('Permission Required', 'Please allow camera access');
                  return;
                }
                const result = await ImagePicker.launchCameraAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.All,
                  allowsEditing: true,
                  aspect: [9, 16],
                  quality: 0.8,
                });
                if (!result.canceled) {
                  setShowCreateStory(false);
                  setUploadingStory(true);
                  // Handle upload (same as handleCreateStory)
                  const asset = result.assets[0];
                  const mediaType = asset.type === 'video' ? 'video' : 'image';
                  try {
                    const uploadResponse = await apiService.uploadMedia(
                      asset.uri,
                      `story_${Date.now()}.${mediaType === 'video' ? 'mp4' : 'jpg'}`,
                      mediaType === 'video' ? 'video/mp4' : 'image/jpeg'
                    );
                    if (uploadResponse.success && uploadResponse.url) {
                      const storyResponse = await apiService.createStory({
                        userId: user.personId,
                        userName: `${user.firstName} ${user.lastName || ''}`.trim(),
                        familyLineId: user.familyLineId,
                        mediaUrl: uploadResponse.url,
                        mediaType: mediaType,
                      });
                      if (storyResponse.success) {
                        Alert.alert('Success', 'Story created!');
                        await loadUserAndStories();
                      }
                    }
                  } catch (error) {
                    Alert.alert('Error', 'Failed to create story');
                  } finally {
                    setUploadingStory(false);
                  }
                }
              }}
            >
              <Ionicons name="camera-outline" size={24} color="white" />
              <Text style={styles.createStoryButtonText}>Take Photo or Video</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Uploading Indicator */}
      {uploadingStory && (
        <View style={styles.uploadingOverlay}>
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.uploadingText}>Creating story...</Text>
          </View>
        </View>
      )}

      {/* User Profile Modal */}
      <UserProfile visible={showProfile} onClose={() => setShowProfile(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  chatButton: {
    padding: 8,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  
  // Stories Section
  storiesSection: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 12,
  },
  storiesLoading: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storiesList: {
    paddingHorizontal: 16,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 70,
  },
  storyRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    padding: 3,
    backgroundColor: '#e5e7eb',
    marginBottom: 6,
  },
  storyRingActive: {
    backgroundColor: '#f59e0b',
  },
  storyRingOwn: {
    backgroundColor: '#10b981',
  },
  storyAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
    position: 'relative',
  },
  addStoryButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  storyName: {
    fontSize: 11,
    color: colors.text,
    textAlign: 'center',
  },

  // Create Post Section
  createPostSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 8,
    borderBottomColor: '#e5e7eb',
    gap: 12,
  },
  createPostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createPostInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  createPostPlaceholder: {
    color: '#9ca3af',
    fontSize: 15,
  },
  imageButton: {
    padding: 8,
  },

  // Posts Feed
  feedSection: {
    paddingTop: 8,
  },

  // Story Viewer & Create Story Modal
  createStoryOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  createStoryModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  createStoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  createStoryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  createStoryDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  createStoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    gap: 10,
  },
  createStoryCameraButton: {
    backgroundColor: colors.secondary,
  },
  createStoryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  uploadingContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 16,
  },
  uploadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  storyAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});