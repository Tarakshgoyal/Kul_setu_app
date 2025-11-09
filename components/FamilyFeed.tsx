import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, ActivityIndicator, Modal, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/lib/utils';
import { getUser } from '@/lib/auth';
import { apiService } from '@/lib/api';

interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  timestamp: string;
  likes: number;
  comments: number;
  isLiked: boolean;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

export default function FamilyFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showPostMenu, setShowPostMenu] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadPosts();
    }
  }, [user]);

  const loadUser = async () => {
    const currentUser = await getUser();
    setUser(currentUser);
  };

  const loadPosts = async () => {
    if (!user) return;
    
    try {
      setRefreshing(true);
      const response = await apiService.getPostsFeed({
        familyLineId: user.familyLineId || 'F01',
        userId: user.id || user.personId,
        limit: 20,
      });

      if (response.success && response.posts) {
        setPosts(response.posts);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      Alert.alert('Error', 'Failed to load posts. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;

    setLoading(true);
    try {
      const postData: any = {
        userId: user?.id || user?.personId,
        content: newPostContent,
      };

      // Upload image to S3 if selected
      if (selectedImage) {
        try {
          const imageFileName = `image-${Date.now()}.jpg`;
          const uploadResponse = await apiService.uploadMedia(selectedImage, imageFileName, 'image/jpeg');
          
          if (uploadResponse.success && uploadResponse.url) {
            postData.imageUrl = uploadResponse.url;
          } else {
            Alert.alert('Warning', 'Image upload failed. Posting without image.');
          }
        } catch (error) {
          console.error('Image upload error:', error);
          Alert.alert('Warning', 'Image upload failed. Posting without image.');
        }
      }

      // Upload video to S3 if selected
      if (selectedVideo) {
        try {
          const videoFileName = `video-${Date.now()}.mp4`;
          const uploadResponse = await apiService.uploadMedia(selectedVideo, videoFileName, 'video/mp4');
          
          if (uploadResponse.success && uploadResponse.url) {
            postData.videoUrl = uploadResponse.url;
          } else {
            Alert.alert('Warning', 'Video upload failed. Posting without video.');
          }
        } catch (error) {
          console.error('Video upload error:', error);
          Alert.alert('Warning', 'Video upload failed. Posting without video.');
        }
      }

      const response = await apiService.createPost(postData);

      if (response.success && response.post) {
        setPosts([response.post, ...posts]);
        setNewPostContent('');
        setSelectedImage(null);
        setSelectedVideo(null);
        setShowCreatePost(false);
        Alert.alert('Success', 'Post created successfully!');
      } else {
        Alert.alert('Error', response.error || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload photos.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setSelectedVideo(null); // Clear video if image is selected
        setShowCreatePost(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const pickVideo = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload videos.');
        return;
      }

      // Launch video picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedVideo(result.assets[0].uri);
        setSelectedImage(null); // Clear image if video is selected
        setShowCreatePost(true);
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video. Please try again.');
    }
  };

  const removeMedia = () => {
    setSelectedImage(null);
    setSelectedVideo(null);
  };

  const handleDeletePost = async (postId: string) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.deletePost(postId, user?.id || user?.personId);
              
              if (response.success) {
                setPosts(posts.filter(post => post.id !== postId));
                Alert.alert('Success', 'Post deleted successfully!');
              } else {
                Alert.alert('Error', response.error || 'Failed to delete post');
              }
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Failed to delete post. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await apiService.likePost(postId, user?.id || user?.personId);
      
      if (response.success) {
        setPosts(posts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              isLiked: response.isLiked,
              likes: response.likesCount,
            };
          }
          return post;
        }));
      }
    } catch (error) {
      console.error('Error liking post:', error);
      Alert.alert('Error', 'Failed to like post. Please try again.');
    }
  };

  const handleOpenComments = async (postId: string) => {
    setSelectedPostId(postId);
    setShowCommentsModal(true);
    loadComments(postId);
  };

  const loadComments = async (postId: string) => {
    try {
      setLoadingComments(true);
      const response = await apiService.getPostComments(postId);
      
      if (response.success && response.comments) {
        setComments(response.comments);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      Alert.alert('Error', 'Failed to load comments.');
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPostId) return;

    try {
      const response = await apiService.addComment(selectedPostId, {
        userId: user?.id || user?.personId,
        comment: newComment,
      });

      if (response.success) {
        // Reload comments
        await loadComments(selectedPostId);
        
        // Update post comment count
        setPosts(posts.map(post => {
          if (post.id === selectedPostId) {
            return {
              ...post,
              comments: response.commentsCount || post.comments + 1,
            };
          }
          return post;
        }));
        
        setNewComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment.');
    }
  };

  const handleShare = (post: Post) => {
    setSelectedPost(post);
    setShowShareModal(true);
  };

  const handleCopyLink = async () => {
    try {
      const postLink = `https://kul-setu.app/post/${selectedPost?.id}`;
      
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(postLink);
        Alert.alert('Success', 'Link copied to clipboard!');
      } else {
        // For React Native, you'd use Clipboard from '@react-native-clipboard/clipboard'
        // But we'll use a simple alert for now
        Alert.alert('Share Link', postLink, [
          { text: 'OK', style: 'default' }
        ]);
      }
      
      setShowShareModal(false);
    } catch (error) {
      console.error('Error copying link:', error);
      Alert.alert('Error', 'Failed to copy link.');
    }
  };

  const handleShareToChat = () => {
    setShowShareModal(false);
    Alert.alert('Share to Chat', 'This feature will open the chat drawer to share the post with family members.', [
      { text: 'OK', style: 'default' }
    ]);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={styles.container}>
      {/* Create Post Section */}
      <View style={styles.createPostSection}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user ? getInitials(user.firstName) : 'U'}
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.createPostInput}
          onPress={() => setShowCreatePost(true)}
        >
          <Text style={styles.createPostPlaceholder}>
            Share a family story, memory, or photo...
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={pickImage}
        >
          <Ionicons name="image" size={24} color={colors.primary} />
          <Text style={styles.actionButtonText}>Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={pickVideo}
        >
          <Ionicons name="videocam" size={24} color="#DC2626" />
          <Text style={styles.actionButtonText}>Video</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setShowCreatePost(true)}
        >
          <Ionicons name="calendar" size={24} color="#10B981" />
          <Text style={styles.actionButtonText}>Event</Text>
        </TouchableOpacity>
      </View>

      {/* Posts Feed */}
      {refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="images-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No posts yet</Text>
          <Text style={styles.emptyText}>Be the first to share a family story!</Text>
        </View>
      ) : (
        <ScrollView style={styles.feed}>
          {posts.map((post) => (
          <TouchableOpacity 
            key={post.id} 
            activeOpacity={1}
            onPress={() => setShowPostMenu(null)}
          >
            <View style={styles.postCard}>
            {/* Post Header */}
            <View style={styles.postHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(post.userName)}</Text>
              </View>
              <View style={styles.postInfo}>
                <Text style={styles.userName}>{post.userName}</Text>
                <Text style={styles.timestamp}>{formatTimestamp(post.timestamp)}</Text>
              </View>
              {/* Three-dot menu for post options */}
              <TouchableOpacity 
                style={styles.menuButton}
                onPress={() => setShowPostMenu(showPostMenu === post.id ? null : post.id)}
              >
                <Ionicons name="ellipsis-horizontal" size={24} color="#666" />
              </TouchableOpacity>
              
              {/* Post Menu Dropdown */}
              {showPostMenu === post.id && (
                <View style={styles.postMenuDropdown}>
                  {(post.userId === (user?.id || user?.personId)) && (
                    <TouchableOpacity 
                      style={styles.menuItem}
                      onPress={() => {
                        setShowPostMenu(null);
                        handleDeletePost(post.id);
                      }}
                    >
                      <Ionicons name="trash-outline" size={20} color="#DC2626" />
                      <Text style={[styles.menuItemText, styles.menuItemDanger]}>Delete Post</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={styles.menuItem}
                    onPress={() => {
                      setShowPostMenu(null);
                      Alert.alert('Report', 'Report functionality will be available soon.');
                    }}
                  >
                    <Ionicons name="flag-outline" size={20} color="#666" />
                    <Text style={styles.menuItemText}>Report Post</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.menuItem}
                    onPress={() => {
                      setShowPostMenu(null);
                      Alert.alert('Hide', 'This post will be hidden from your feed.');
                    }}
                  >
                    <Ionicons name="eye-off-outline" size={20} color="#666" />
                    <Text style={styles.menuItemText}>Hide Post</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Post Content */}
            <Text style={styles.postContent}>{post.content}</Text>

            {/* Post Image */}
            {post.imageUrl && (
              <View style={styles.postImageContainer}>
                <Image 
                  source={{ uri: post.imageUrl }} 
                  style={styles.postImage}
                  resizeMode="cover"
                  onError={(error) => console.log('Image load error:', error.nativeEvent.error)}
                />
              </View>
            )}

            {/* Post Stats */}
            <View style={styles.postStats}>
              <View style={styles.statsLeft}>
                <Ionicons name="heart" size={16} color="#DC2626" />
                <Text style={styles.statsText}>{post.likes}</Text>
              </View>
              <Text style={styles.statsText}>{post.comments} comments</Text>
            </View>

            {/* Post Actions */}
            <View style={styles.postActions}>
              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => handleLike(post.id)}
              >
                <Ionicons 
                  name={post.isLiked ? "heart" : "heart-outline"} 
                  size={22} 
                  color={post.isLiked ? "#DC2626" : "#666"} 
                />
                <Text style={[styles.actionText, post.isLiked && styles.likedText]}>
                  Like
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => handleOpenComments(post.id)}
              >
                <Ionicons name="chatbubble-outline" size={22} color="#666" />
                <Text style={styles.actionText}>Comment</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => handleShare(post)}
              >
                <Ionicons name="share-outline" size={22} color="#666" />
                <Text style={styles.actionText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      )
      }

      {/* Create Post Modal */}
      <Modal
        visible={showCreatePost}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreatePost(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Post</Text>
              <TouchableOpacity onPress={() => setShowCreatePost(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.postAuthor}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user ? getInitials(user.firstName) : 'U'}
                  </Text>
                </View>
                <Text style={styles.authorName}>
                  {user?.firstName || 'You'}
                </Text>
              </View>

              <TextInput
                style={styles.postTextInput}
                placeholder="What's on your mind? Share a family story, memory, or update..."
                placeholderTextColor="#999"
                multiline
                value={newPostContent}
                onChangeText={setNewPostContent}
                autoFocus
              />

              {/* Selected Media Preview */}
              {selectedImage && (
                <View style={styles.mediaPreview}>
                  <Image 
                    source={{ uri: selectedImage }} 
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                  <TouchableOpacity style={styles.removeMediaButton} onPress={removeMedia}>
                    <Ionicons name="close-circle" size={28} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              )}

              {selectedVideo && (
                <View style={styles.mediaPreview}>
                  <View style={styles.videoPlaceholder}>
                    <Ionicons name="videocam" size={48} color="#666" />
                    <Text style={styles.videoText}>Video selected</Text>
                  </View>
                  <TouchableOpacity style={styles.removeMediaButton} onPress={removeMedia}>
                    <Ionicons name="close-circle" size={28} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.mediaOptions}>
                <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
                  <Ionicons name="image" size={24} color={colors.primary} />
                  <Text style={styles.mediaButtonText}>Add Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.mediaButton} onPress={pickVideo}>
                  <Ionicons name="videocam" size={24} color="#DC2626" />
                  <Text style={styles.mediaButtonText}>Add Video</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.postButton, !newPostContent.trim() && styles.postButtonDisabled]}
              onPress={handleCreatePost}
              disabled={!newPostContent.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.postButtonText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Comments Modal */}
      <Modal
        visible={showCommentsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCommentsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setShowCommentsModal(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Comments List */}
            <ScrollView style={styles.commentsContainer}>
              {loadingComments ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : comments.length === 0 ? (
                <View style={styles.emptyCommentsContainer}>
                  <Ionicons name="chatbubbles-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyCommentsText}>No comments yet</Text>
                  <Text style={styles.emptyCommentsSubtext}>Be the first to comment!</Text>
                </View>
              ) : (
                comments.map((comment) => (
                  <View key={comment.id} style={styles.commentItem}>
                    <View style={styles.commentAvatar}>
                      <Text style={styles.avatarText}>{getInitials(comment.userName)}</Text>
                    </View>
                    <View style={styles.commentContent}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentUserName}>{comment.userName}</Text>
                        <Text style={styles.commentTime}>{formatTimestamp(comment.timestamp)}</Text>
                      </View>
                      <Text style={styles.commentText}>{comment.text}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Add Comment Input */}
            <View style={styles.addCommentContainer}>
              <View style={styles.commentAvatar}>
                <Text style={styles.avatarText}>
                  {user ? getInitials(user.firstName) : 'U'}
                </Text>
              </View>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment..."
                placeholderTextColor="#999"
                value={newComment}
                onChangeText={setNewComment}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]}
                onPress={handleAddComment}
                disabled={!newComment.trim()}
              >
                <Ionicons 
                  name="send" 
                  size={20} 
                  color={newComment.trim() ? colors.primary : "#D1D5DB"} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowShareModal(false)}
      >
        <TouchableOpacity 
          style={styles.shareModalOverlay}
          activeOpacity={1}
          onPress={() => setShowShareModal(false)}
        >
          <View style={styles.shareModalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.shareModalHeader}>
              <Text style={styles.shareModalTitle}>Share Post</Text>
              <TouchableOpacity onPress={() => setShowShareModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Post Preview */}
            {selectedPost && (
              <View style={styles.sharePostPreview}>
                <View style={styles.sharePostHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(selectedPost.userName)}</Text>
                  </View>
                  <View style={styles.sharePostInfo}>
                    <Text style={styles.sharePostUser}>{selectedPost.userName}</Text>
                    <Text style={styles.sharePostTime}>{formatTimestamp(selectedPost.timestamp)}</Text>
                  </View>
                </View>
                <Text style={styles.sharePostContent} numberOfLines={3}>
                  {selectedPost.content}
                </Text>
              </View>
            )}

            {/* Share Options */}
            <View style={styles.shareOptions}>
              <TouchableOpacity style={styles.shareOption} onPress={handleCopyLink}>
                <View style={styles.shareOptionIcon}>
                  <Ionicons name="link-outline" size={24} color={colors.primary} />
                </View>
                <View style={styles.shareOptionContent}>
                  <Text style={styles.shareOptionTitle}>Copy Link</Text>
                  <Text style={styles.shareOptionDescription}>Share via any app</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareOption} onPress={handleShareToChat}>
                <View style={styles.shareOptionIcon}>
                  <Ionicons name="chatbubbles-outline" size={24} color="#10B981" />
                </View>
                <View style={styles.shareOptionContent}>
                  <Text style={styles.shareOptionTitle}>Share to Chat</Text>
                  <Text style={styles.shareOptionDescription}>Send to family members</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareOption} onPress={() => {
                setShowShareModal(false);
                Alert.alert('Coming Soon', 'Share to external apps feature will be available soon!');
              }}>
                <View style={styles.shareOptionIcon}>
                  <Ionicons name="share-social-outline" size={24} color="#3B82F6" />
                </View>
                <View style={styles.shareOptionContent}>
                  <Text style={styles.shareOptionTitle}>More Options</Text>
                  <Text style={styles.shareOptionDescription}>WhatsApp, Email, etc.</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  createPostSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarContainer: {
    width: 40,
    height: 40,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  createPostInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  createPostPlaceholder: {
    color: '#9CA3AF',
    fontSize: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#374151',
    fontWeight: '500',
    fontSize: 14,
  },
  feed: {
    gap: 16,
  },
  postCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  postInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 13,
    color: '#6B7280',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },
  menuButton: {
    padding: 8,
  },
  postMenuDropdown: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 180,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemText: {
    fontSize: 15,
    color: colors.foreground,
    fontWeight: '500',
  },
  menuItemDanger: {
    color: '#DC2626',
  },
  postContent: {
    fontSize: 15,
    color: colors.foreground,
    lineHeight: 22,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  postImageContainer: {
    width: '100%',
    marginBottom: 12,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#F3F4F6',
  },
  postStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  likedText: {
    color: '#DC2626',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.foreground,
  },
  modalBody: {
    padding: 16,
  },
  postAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  postTextInput: {
    fontSize: 16,
    color: colors.foreground,
    minHeight: 150,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  mediaOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  mediaButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  mediaPreview: {
    position: 'relative',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  videoPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  videoText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  removeMediaButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 14,
  },
  postButton: {
    backgroundColor: colors.primary,
    margin: 16,
    marginTop: 0,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  postButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.foreground,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  // Comments styles
  commentsContainer: {
    maxHeight: 400,
    paddingHorizontal: 16,
  },
  emptyCommentsContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCommentsText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginTop: 12,
  },
  emptyCommentsSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    gap: 12,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  commentTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  commentText: {
    fontSize: 14,
    color: colors.foreground,
    lineHeight: 20,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  // Share modal styles
  shareModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  shareModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  shareModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  shareModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
  },
  sharePostPreview: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sharePostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  sharePostInfo: {
    flex: 1,
  },
  sharePostUser: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  sharePostTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  sharePostContent: {
    fontSize: 14,
    color: colors.foreground,
    lineHeight: 20,
  },
  shareOptions: {
    padding: 12,
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  shareOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  shareOptionContent: {
    flex: 1,
  },
  shareOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 2,
  },
  shareOptionDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
});

