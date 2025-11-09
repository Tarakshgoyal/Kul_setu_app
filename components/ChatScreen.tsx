import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { colors } from '@/lib/utils';
import { getUser } from '@/lib/auth';

interface Message {
  message_id: string;
  sender_id: string;
  sender_name: string;
  message_text?: string;
  message_type: 'text' | 'image' | 'video' | 'file';
  media_url?: string;
  timestamp: string;
  is_read: boolean;
  reply_to?: string;
}

interface Chat {
  chat_id: string;
  chat_type: 'personal' | 'group';
  chat_name?: string;
  participant_ids: string[];
  participant_names: string[];
  group_avatar?: string;
}

interface ChatScreenProps {
  visible: boolean;
  chat: Chat | null;
  onClose: () => void;
}

export default function ChatScreen({ visible, chat, onClose }: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (visible && chat) {
      loadMessages();
      loadCurrentUser();
      // Poll for new messages every 3 seconds
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [visible, chat]);

  // Cleanup audio when component unmounts or chat closes
  useEffect(() => {
    return () => {
      if (sound) {
        console.log('[ChatScreen] Unloading sound on cleanup');
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const loadCurrentUser = async () => {
    const user = await getUser();
    if (user && user.personId) {
      setCurrentUserId(user.personId);
    }
  };

  const loadMessages = async () => {
    if (!chat) return;

    try {
      const user = await getUser();
      if (!user) return;

      const response = await fetch(
        `https://kul-setu-backend.onrender.com/chats/messages/${chat.chat_id}`,
        {
          headers: {
            'Authorization': `Bearer ${user.personId}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        // Mark messages as read
        markAsRead();
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const markAsRead = async () => {
    if (!chat) return;

    try {
      const user = await getUser();
      if (!user) return;

      await fetch(
        `https://kul-setu-backend.onrender.com/chats/mark-read/${chat.chat_id}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.personId}`,
          },
        }
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() && !selectedImage) return;

    try {
      setLoading(true);
      const user = await getUser();
      if (!user) return;

      let mediaUrl = null;
      if (selectedImage) {
        // Upload image
        const uploadResponse = await uploadImage(selectedImage);
        if (uploadResponse) {
          mediaUrl = uploadResponse;
        }
      }

      const response = await fetch(
        'https://kul-setu-backend.onrender.com/chats/send-message',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.personId}`,
          },
          body: JSON.stringify({
            chat_id: chat?.chat_id,
            message_text: messageText.trim(),
            message_type: selectedImage ? 'image' : 'text',
            media_url: mediaUrl,
            reply_to: replyTo?.message_id,
          }),
        }
      );

      if (response.ok) {
        setMessageText('');
        setSelectedImage(null);
        setReplyTo(null);
        loadMessages();
        flatListRef.current?.scrollToEnd();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (imageUri: string): Promise<string | null> => {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();

      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onloadend = async () => {
          try {
            const base64data = reader.result as string;
            const uploadResponse = await fetch(
              'https://kul-setu-backend.onrender.com/upload/media',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  file: base64data,
                  fileName: `chat-image-${Date.now()}.jpg`,
                  fileType: 'image/jpeg',
                }),
              }
            );

            if (uploadResponse.ok) {
              const data = await uploadResponse.json();
              resolve(data.url);
            } else {
              reject(new Error('Upload failed'));
            }
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to upload image:', error);
      return null;
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const startRecording = async () => {
    try {
      console.log('[ChatScreen] Requesting audio permissions...');
      const { status } = await Audio.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant microphone permissions to record voice messages');
        return;
      }

      console.log('[ChatScreen] Setting audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('[ChatScreen] Starting recording...');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      console.log('[ChatScreen] Recording started successfully');
    } catch (error) {
      console.error('[ChatScreen] Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) {
        console.log('[ChatScreen] No active recording to stop');
        return;
      }

      console.log('[ChatScreen] Stopping recording...');
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      
      const uri = recording.getURI();
      console.log('[ChatScreen] Recording stopped, URI:', uri);
      
      setRecording(null);

      if (uri) {
        console.log('[ChatScreen] Uploading voice message...');
        setLoading(true);
        
        // Upload audio file
        const audioUrl = await uploadAudio(uri);
        
        if (audioUrl) {
          // Send as voice message
          await sendVoiceMessage(audioUrl);
          console.log('[ChatScreen] Voice message sent successfully');
        } else {
          Alert.alert('Error', 'Failed to upload voice message');
        }
        
        setLoading(false);
      }
    } catch (error) {
      console.error('[ChatScreen] Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to save recording. Please try again.');
      setLoading(false);
    }
  };

  const uploadAudio = async (audioUri: string): Promise<string | null> => {
    try {
      console.log('[ChatScreen] Fetching audio blob from URI:', audioUri);
      const response = await fetch(audioUri);
      const blob = await response.blob();

      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onloadend = async () => {
          try {
            const base64data = reader.result as string;
            console.log('[ChatScreen] Uploading audio to backend...');
            
            const uploadResponse = await fetch(
              'https://kul-setu-backend.onrender.com/upload/media',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  file: base64data,
                  fileName: `voice-message-${Date.now()}.m4a`,
                  fileType: 'audio/m4a',
                }),
              }
            );

            if (uploadResponse.ok) {
              const data = await uploadResponse.json();
              console.log('[ChatScreen] Audio uploaded successfully:', data.url);
              resolve(data.url);
            } else {
              console.error('[ChatScreen] Upload failed:', uploadResponse.status);
              reject(new Error('Upload failed'));
            }
          } catch (error) {
            console.error('[ChatScreen] Upload error:', error);
            reject(error);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('[ChatScreen] Failed to upload audio:', error);
      return null;
    }
  };

  const sendVoiceMessage = async (audioUrl: string) => {
    try {
      const user = await getUser();
      if (!user) return;

      console.log('[ChatScreen] Sending voice message to chat:', chat?.chat_id);

      const response = await fetch(
        'https://kul-setu-backend.onrender.com/chats/send-message',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.personId}`,
          },
          body: JSON.stringify({
            chat_id: chat?.chat_id,
            message_text: '🎤 Voice message',
            message_type: 'file',
            media_url: audioUrl,
          }),
        }
      );

      if (response.ok) {
        console.log('[ChatScreen] Voice message sent successfully');
        loadMessages();
        flatListRef.current?.scrollToEnd();
      } else {
        console.error('[ChatScreen] Failed to send voice message:', response.status);
        Alert.alert('Error', 'Failed to send voice message');
      }
    } catch (error) {
      console.error('[ChatScreen] Failed to send voice message:', error);
      Alert.alert('Error', 'Failed to send voice message');
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const playVoiceMessage = async (messageId: string, audioUrl: string) => {
    try {
      console.log('[ChatScreen] Playing voice message:', messageId, audioUrl);

      // If already playing this message, pause it
      if (playingAudio === messageId) {
        console.log('[ChatScreen] Pausing audio');
        if (sound) {
          await sound.pauseAsync();
          setPlayingAudio(null);
        }
        return;
      }

      // Stop any currently playing audio
      if (sound) {
        console.log('[ChatScreen] Stopping previous audio');
        await sound.unloadAsync();
        setSound(null);
      }

      // Load and play new audio
      console.log('[ChatScreen] Loading new audio from:', audioUrl);
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true },
        (status) => {
          // Playback status update callback
          if (status.isLoaded && status.didJustFinish) {
            console.log('[ChatScreen] Audio playback finished');
            setPlayingAudio(null);
          }
        }
      );

      setSound(newSound);
      setPlayingAudio(messageId);
      console.log('[ChatScreen] Audio playing');

    } catch (error) {
      console.error('[ChatScreen] Failed to play voice message:', error);
      Alert.alert('Error', 'Failed to play voice message');
      setPlayingAudio(null);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const user = await getUser();
      if (!user) return;

      const response = await fetch(
        `https://kul-setu-backend.onrender.com/chats/delete-message/${messageId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${user.personId}`,
          },
        }
      );

      if (response.ok) {
        loadMessages();
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const handleLongPress = (message: Message) => {
    if (message.sender_id === currentUserId) {
      Alert.alert(
        'Message Options',
        'What would you like to do?',
        [
          { text: 'Reply', onPress: () => setReplyTo(message) },
          { text: 'Delete', onPress: () => deleteMessage(message.message_id), style: 'destructive' },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else {
      Alert.alert(
        'Message Options',
        'What would you like to do?',
        [
          { text: 'Reply', onPress: () => setReplyTo(message) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender_id === currentUserId;
    const showSenderName = chat?.chat_type === 'group' && !isOwnMessage;

    return (
      <TouchableOpacity
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.7}
      >
        {item.reply_to && (
          <View style={styles.replyContainer}>
            <Text style={styles.replyText} numberOfLines={1}>
              Replying to: {item.reply_to}
            </Text>
          </View>
        )}

        {showSenderName && (
          <Text style={styles.senderName}>{item.sender_name}</Text>
        )}

        {item.message_type === 'image' && item.media_url && (
          <Image source={{ uri: item.media_url }} style={styles.messageImage} />
        )}

        {item.message_type === 'file' && item.media_url && item.message_text?.includes('Voice message') && (
          <TouchableOpacity 
            style={styles.voiceMessageContainer}
            onPress={() => playVoiceMessage(item.message_id, item.media_url!)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={playingAudio === item.message_id ? "pause-circle" : "play-circle"} 
              size={32} 
              color={isOwnMessage ? '#fff' : colors.primary} 
            />
            <View style={styles.voiceMessageInfo}>
              <Text style={[styles.voiceMessageText, isOwnMessage && { color: '#fff' }]}>
                Voice message
              </Text>
              <Text style={[styles.voiceMessageDuration, isOwnMessage && { color: '#e0e0e0' }]}>
                {playingAudio === item.message_id ? 'Playing...' : 'Tap to play'}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {item.message_text && !item.message_text?.includes('Voice message') && (
          <Text style={[styles.messageText, isOwnMessage && styles.ownMessageText]}>
            {item.message_text}
          </Text>
        )}

        <View style={styles.messageFooter}>
          <Text style={[styles.messageTime, isOwnMessage && styles.ownMessageTime]}>
            {formatTime(item.timestamp)}
          </Text>
          {isOwnMessage && (
            <Ionicons
              name={item.is_read ? 'checkmark-done' : 'checkmark'}
              size={16}
              color={item.is_read ? '#4CAF50' : '#999'}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (!visible || !chat) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.chatHeader}
            onPress={() => setShowInfo(true)}
          >
            <View style={styles.headerAvatar}>
              <Ionicons
                name={chat.chat_type === 'group' ? 'people' : 'person'}
                size={24}
                color="white"
              />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>
                {chat.chat_type === 'group'
                  ? chat.chat_name
                  : (chat.participant_names && chat.participant_names.length > 0 
                      ? chat.participant_names[0] 
                      : 'Unknown')}
              </Text>
              <Text style={styles.headerSubtitle}>
                {chat.chat_type === 'group'
                  ? `${chat.participant_ids?.length || 0} members`
                  : 'Tap for info'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="videocam-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="call-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.message_id}
          contentContainerStyle={styles.messagesList}
          inverted={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>
                Start the conversation!
              </Text>
            </View>
          }
        />

        {/* Reply Preview */}
        {replyTo && (
          <View style={styles.replyPreview}>
            <View style={styles.replyContent}>
              <Text style={styles.replyLabel}>Replying to {replyTo.sender_name}</Text>
              <Text style={styles.replyMessage} numberOfLines={1}>
                {replyTo.message_text}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setReplyTo(null)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        )}

        {/* Image Preview */}
        {selectedImage && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => setSelectedImage(null)}
            >
              <Ionicons name="close-circle" size={28} color="#DC2626" />
            </TouchableOpacity>
          </View>
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.attachButton} onPress={pickImage}>
            <Ionicons name="add-circle" size={28} color={colors.primary} />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1000}
            placeholderTextColor="#999"
          />

          {messageText.trim() || selectedImage ? (
            <TouchableOpacity
              style={styles.sendButton}
              onPress={sendMessage}
              disabled={loading}
            >
              <Ionicons name="send" size={24} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[
                styles.micButton,
                isRecording && styles.micButtonRecording
              ]}
              onPress={toggleRecording}
            >
              <Ionicons 
                name={isRecording ? "stop-circle" : "mic"} 
                size={24} 
                color={isRecording ? "#fff" : colors.primary} 
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Chat Info Modal */}
        <Modal
          visible={showInfo}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowInfo(false)}
        >
          <View style={styles.infoOverlay}>
            <View style={styles.infoModal}>
              <View style={styles.infoHeader}>
                <Text style={styles.infoTitle}>
                  {chat.chat_type === 'group' ? 'Group Info' : 'Contact Info'}
                </Text>
                <TouchableOpacity onPress={() => setShowInfo(false)}>
                  <Ionicons name="close" size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {chat.chat_type === 'group' ? (
                <View style={styles.infoContent}>
                  <View style={styles.groupInfoAvatar}>
                    <Ionicons name="people" size={48} color="white" />
                  </View>
                  <Text style={styles.groupName}>{chat.chat_name}</Text>
                  <Text style={styles.memberCount}>
                    {chat.participant_ids?.length || 0} members
                  </Text>

                  <View style={styles.membersList}>
                    <Text style={styles.membersTitle}>Members</Text>
                    {(chat.participant_names || []).map((name, index) => (
                      <View key={index} style={styles.memberItem}>
                        <View style={styles.memberAvatar}>
                          <Ionicons name="person" size={20} color="white" />
                        </View>
                        <Text style={styles.memberName}>{name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <View style={styles.infoContent}>
                  <View style={styles.contactInfoAvatar}>
                    <Ionicons name="person" size={48} color="white" />
                  </View>
                  <Text style={styles.contactInfoName}>
                    {chat.participant_names && chat.participant_names.length > 0 
                      ? chat.participant_names[0] 
                      : 'Unknown'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 8,
  },
  backButton: {
    padding: 8,
  },
  chatHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  iconButton: {
    padding: 8,
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    maxWidth: '75%',
    marginBottom: 12,
    borderRadius: 12,
    padding: 12,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  replyContainer: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    paddingLeft: 8,
    paddingVertical: 4,
    marginBottom: 8,
    borderRadius: 4,
  },
  replyText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 16,
    color: colors.foreground,
    lineHeight: 22,
  },
  ownMessageText: {
    color: 'white',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    color: '#666',
  },
  ownMessageTime: {
    color: 'rgba(255,255,255,0.8)',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  replyContent: {
    flex: 1,
  },
  replyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
  },
  replyMessage: {
    fontSize: 14,
    color: '#666',
  },
  imagePreviewContainer: {
    backgroundColor: 'white',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 8,
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButton: {
    padding: 8,
  },
  micButtonRecording: {
    backgroundColor: '#ef4444',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  infoModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  infoContent: {
    padding: 20,
    alignItems: 'center',
  },
  groupInfoAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.sacred,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  contactInfoAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  groupName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 8,
  },
  contactInfoName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  memberCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  membersList: {
    width: '100%',
  },
  membersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberName: {
    fontSize: 16,
    color: colors.foreground,
  },
  voiceMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  voiceMessageInfo: {
    flex: 1,
  },
  voiceMessageText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 2,
  },
  voiceMessageDuration: {
    fontSize: 12,
    color: '#666',
  },
});
