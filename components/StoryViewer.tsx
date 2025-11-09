import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  Alert,
  Animated,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { apiService } from '../lib/api';

const { width, height } = Dimensions.get('window');
const colors = {
  primary: '#FF6B35',
  secondary: '#004E89',
};

interface Story {
  storyId: string;
  mediaUrl: string;
  mediaType: string;
  createdAt: string;
  expiresAt: string;
  viewsCount: number;
}

interface UserStories {
  userId: string;
  userName: string;
  stories: Story[];
}

interface StoryViewerProps {
  visible: boolean;
  userStories: UserStories[];
  initialUserIndex: number;
  currentUserId?: string;
  onClose: () => void;
  onStoryComplete?: () => void;
}

const StoryViewer: React.FC<StoryViewerProps> = ({
  visible,
  userStories,
  initialUserIndex,
  currentUserId,
  onClose,
  onStoryComplete,
}) => {
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress] = useState(new Animated.Value(0));
  const [isPaused, setIsPaused] = useState(false);
  const videoRef = useRef<Video>(null);

  const currentUser = userStories[currentUserIndex];
  const currentStory = currentUser?.stories[currentStoryIndex];
  const isOwner = currentUser?.userId === currentUserId;

  const STORY_DURATION = 5000; // 5 seconds for images

  useEffect(() => {
    if (!visible || !currentStory || isPaused) return;

    // Mark story as viewed
    apiService.viewStory(currentStory.storyId);

    // Animate progress bar
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished) {
        handleNext();
      }
    });

    return () => {
      animation.stop();
    };
  }, [currentStoryIndex, currentUserIndex, visible, isPaused]);

  const handleNext = () => {
    if (currentStoryIndex < currentUser.stories.length - 1) {
      // Next story for same user
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else if (currentUserIndex < userStories.length - 1) {
      // Next user
      setCurrentUserIndex(currentUserIndex + 1);
      setCurrentStoryIndex(0);
    } else {
      // All stories complete
      onClose();
      onStoryComplete?.();
    }
  };

  const handlePrevious = () => {
    if (currentStoryIndex > 0) {
      // Previous story for same user
      setCurrentStoryIndex(currentStoryIndex - 1);
    } else if (currentUserIndex > 0) {
      // Previous user
      const prevUserIndex = currentUserIndex - 1;
      setCurrentUserIndex(prevUserIndex);
      setCurrentStoryIndex(userStories[prevUserIndex].stories.length - 1);
    }
  };

  const handleTapLeft = () => {
    handlePrevious();
  };

  const handleTapRight = () => {
    handleNext();
  };

  const handleLongPressStart = () => {
    setIsPaused(true);
  };

  const handleLongPressEnd = () => {
    setIsPaused(false);
  };

  const handleDeleteStory = () => {
    Alert.alert(
      'Delete Story',
      'Are you sure you want to delete this story?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteStory(currentStory.storyId, currentUserId || '');
              Alert.alert('Success', 'Story deleted');
              handleNext();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete story');
            }
          },
        },
      ]
    );
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const created = new Date(timestamp);
    const diffMs = now.getTime() - created.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMinutes > 0) return `${diffMinutes}m ago`;
    return 'Just now';
  };

  if (!visible || !currentUser || !currentStory) return null;

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        {/* Progress bars */}
        <View style={styles.progressContainer}>
          {currentUser.stories.map((_, index) => (
            <View key={index} style={styles.progressBarBackground}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width:
                      index < currentStoryIndex
                        ? '100%'
                        : index === currentStoryIndex
                        ? progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          })
                        : '0%',
                  },
                ]}
              />
            </View>
          ))}
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {currentUser.userName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{currentUser.userName}</Text>
              <Text style={styles.timestamp}>{getTimeAgo(currentStory.createdAt)}</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            {isOwner && (
              <TouchableOpacity onPress={handleDeleteStory} style={styles.iconButton}>
                <Ionicons name="trash-outline" size={24} color="white" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={styles.iconButton}>
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Story Content */}
        <View style={styles.storyContent}>
          {/* Touch areas for navigation */}
          <TouchableOpacity
            style={styles.leftTouchArea}
            activeOpacity={1}
            onPress={handleTapLeft}
            onLongPress={handleLongPressStart}
            onPressOut={handleLongPressEnd}
          />
          <TouchableOpacity
            style={styles.rightTouchArea}
            activeOpacity={1}
            onPress={handleTapRight}
            onLongPress={handleLongPressStart}
            onPressOut={handleLongPressEnd}
          />

          {currentStory.mediaType === 'video' ? (
            <Video
              ref={videoRef}
              source={{ uri: currentStory.mediaUrl }}
              style={styles.media}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={!isPaused}
              isLooping={false}
              onPlaybackStatusUpdate={(status) => {
                if ('didJustFinish' in status && status.didJustFinish) {
                  handleNext();
                }
              }}
            />
          ) : (
            <Image source={{ uri: currentStory.mediaUrl }} style={styles.media} resizeMode="contain" />
          )}
        </View>

        {/* Footer with view count */}
        <View style={styles.footer}>
          <View style={styles.viewCount}>
            <Ionicons name="eye-outline" size={18} color="white" />
            <Text style={styles.viewCountText}>{currentStory.viewsCount} views</Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 8,
    gap: 4,
  },
  progressBarBackground: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  userDetails: {
    gap: 2,
  },
  userName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  storyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  media: {
    width: width,
    height: height - 150,
  },
  leftTouchArea: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.3,
    zIndex: 10,
  },
  rightTouchArea: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: width * 0.7,
    zIndex: 10,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  viewCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewCountText: {
    color: 'white',
    fontSize: 14,
  },
});

export default StoryViewer;
