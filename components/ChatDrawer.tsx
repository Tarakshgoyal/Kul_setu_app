import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/utils';
import { getUser } from '@/lib/auth';

const { width } = Dimensions.get('window');

interface FamilyMember {
  personId: string; // Backend uses camelCase
  firstName: string; // Backend uses camelCase
  gender: string;
  photo_url?: string;
  is_online?: boolean;
  last_seen?: string;
}

interface Chat {
  chat_id: string;
  chat_type: 'personal' | 'group';
  chat_name?: string;
  participant_ids: string[];
  participant_names: string[];
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
  group_avatar?: string;
}

interface ChatDrawerProps {
  visible: boolean;
  onClose: () => void;
  onChatSelect: (chat: Chat) => void;
}

export default function ChatDrawer({ visible, onClose, onChatSelect }: ChatDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'contacts'>('chats');
  const [chats, setChats] = useState<Chat[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    if (visible) {
      loadChats();
      loadFamilyMembers();
    }
  }, [visible]);

  useEffect(() => {
    filterMembers();
  }, [searchQuery, familyMembers]);

  const loadChats = async (retryCount = 0) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = [1000, 3000, 5000]; // 1s, 3s, 5s

    try {
      setLoading(true);
      const user = await getUser();
      if (!user) {
        setChats([]);
        return;
      }

      console.log('[ChatDrawer] Loading chats (attempt', retryCount + 1, '/', MAX_RETRIES + 1, ')');

      const response = await fetch(
        `https://kul-setu-backend.onrender.com/chats/${user.familyLineId}`,
        {
          headers: {
            'Authorization': `Bearer ${user.personId}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setChats(data.chats || []);
      } else {
        // Handle server errors with retry
        if ((response.status === 502 || response.status === 500) && retryCount < MAX_RETRIES) {
          console.log(`[ChatDrawer] Server error ${response.status}, retrying in ${RETRY_DELAY[retryCount]}ms...`);
          setLoading(false); // Don't keep loading state during retry delay
          setTimeout(() => loadChats(retryCount + 1), RETRY_DELAY[retryCount]);
          return;
        }

        console.error('Failed to load chats:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setChats([]);
      }
    } catch (error) {
      // Handle network errors with retry
      if (retryCount < MAX_RETRIES) {
        console.log(`[ChatDrawer] Network error, retrying in ${RETRY_DELAY[retryCount]}ms...`, error);
        setLoading(false); // Don't keep loading state during retry delay
        setTimeout(() => loadChats(retryCount + 1), RETRY_DELAY[retryCount]);
        return;
      }

      console.error('Failed to load chats:', error);
      setChats([]);
    } finally {
      if (retryCount === MAX_RETRIES || retryCount === 0) {
        setLoading(false);
      }
    }
  };

  const loadFamilyMembers = async (retryCount = 0) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = [1000, 3000, 5000]; // 1s, 3s, 5s

    try {
      const user = await getUser();
      if (!user) {
        console.log('[ChatDrawer] No user found');
        return;
      }

      console.log('[ChatDrawer] Loading family members for:', user.familyLineId, `(attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);

      const response = await fetch('https://kul-setu-backend.onrender.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          familyLineId: user.familyLineId,
        }),
      });

      console.log('[ChatDrawer] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[ChatDrawer] Response data:', data);
        
        // The /search endpoint returns the array directly, not wrapped in {results: [...]}
        const results = Array.isArray(data) ? data : (data.results || []);
        console.log('[ChatDrawer] Results count:', results.length);
        console.log('[ChatDrawer] First result sample:', results[0]);
        
        // Filter out current user - backend uses camelCase (personId)
        const members = results.filter((m: any) => m.personId !== user.personId);
        console.log('[ChatDrawer] Filtered members count:', members.length);
        console.log('[ChatDrawer] Sample member:', members[0]);
        
        setFamilyMembers(members);
        setFilteredMembers(members);
      } else {
        // Handle server errors with retry
        if ((response.status === 502 || response.status === 500) && retryCount < MAX_RETRIES) {
          console.log(`[ChatDrawer] Server error ${response.status}, retrying in ${RETRY_DELAY[retryCount]}ms...`);
          setTimeout(() => loadFamilyMembers(retryCount + 1), RETRY_DELAY[retryCount]);
          return;
        }
        
        console.error('Failed to load family members:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setFamilyMembers([]);
        setFilteredMembers([]);
      }
    } catch (error) {
      // Handle network errors with retry
      if (retryCount < MAX_RETRIES) {
        console.log(`[ChatDrawer] Network error, retrying in ${RETRY_DELAY[retryCount]}ms...`, error);
        setTimeout(() => loadFamilyMembers(retryCount + 1), RETRY_DELAY[retryCount]);
        return;
      }
      
      console.error('Failed to load family members:', error);
      setFamilyMembers([]);
      setFilteredMembers([]);
    }
  };

  const filterMembers = () => {
    if (!searchQuery.trim()) {
      setFilteredMembers(familyMembers);
      return;
    }

    const filtered = familyMembers.filter((member) => {
      const name = member.firstName || '';
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    });
    setFilteredMembers(filtered);
  };

  const startPersonalChat = async (member: FamilyMember) => {
    try {
      const user = await getUser();
      if (!user) return;

      const response = await fetch('https://kul-setu-backend.onrender.com/chats/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.personId}`,
        },
        body: JSON.stringify({
          chat_type: 'personal',
          participant_ids: [user.personId, member.personId],
          family_line_id: user.familyLineId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onChatSelect(data.chat);
        setActiveTab('chats');
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  const createGroup = async () => {
    if (!groupName.trim() || selectedMembers.length < 2) {
      Alert.alert('Validation Error', 'Please enter group name and select at least 2 members');
      return;
    }

    try {
      console.log('[ChatDrawer] Creating group:', groupName);
      console.log('[ChatDrawer] Selected members:', selectedMembers);
      
      const user = await getUser();
      if (!user) {
        Alert.alert('Error', 'User not found. Please log in again.');
        return;
      }

      console.log('[ChatDrawer] Current user:', user.personId);
      const participantIds = [user.personId, ...selectedMembers];
      console.log('[ChatDrawer] All participants:', participantIds);

      const requestBody = {
        chat_type: 'group',
        chat_name: groupName,
        participant_ids: participantIds,
        family_line_id: user.familyLineId,
      };

      console.log('[ChatDrawer] Request body:', JSON.stringify(requestBody));

      const response = await fetch('https://kul-setu-backend.onrender.com/chats/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.personId}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('[ChatDrawer] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[ChatDrawer] Group created successfully:', data);
        Alert.alert('Success', 'Group created successfully!');
        setShowGroupModal(false);
        setGroupName('');
        setSelectedMembers([]);
        loadChats();
      } else {
        const errorText = await response.text();
        console.error('[ChatDrawer] Failed to create group:', response.status, errorText);
        Alert.alert('Error', `Failed to create group: ${errorText || response.status}`);
      }
    } catch (error) {
      console.error('[ChatDrawer] Exception creating group:', error);
      Alert.alert('Error', `Failed to create group: ${error}`);
    }
  };

  const toggleMemberSelection = (personId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(personId)
        ? prev.filter((id) => id !== personId)
        : [...prev, personId]
    );
  };

  const renderChatItem = ({ item }: { item: Chat }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => onChatSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {item.chat_type === 'group' ? (
          <View style={styles.groupAvatar}>
            <Ionicons name="people" size={24} color="white" />
          </View>
        ) : (
          <View style={styles.avatar}>
            <Ionicons name="person" size={24} color="white" />
          </View>
        )}
        {item.chat_type === 'personal' && (
          <View style={styles.onlineIndicator} />
        )}
      </View>

      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName} numberOfLines={1}>
            {item.chat_type === 'group'
              ? item.chat_name
              : item.participant_names[0]}
          </Text>
          <Text style={styles.chatTime}>
            {formatTime(item.last_message_time)}
          </Text>
        </View>
        <View style={styles.chatFooter}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.last_message || 'No messages yet'}
          </Text>
          {item.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {item.unread_count > 99 ? '99+' : item.unread_count}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderContactItem = ({ item }: { item: FamilyMember }) => (
    <TouchableOpacity
      style={styles.contactItem}
      onPress={() => startPersonalChat(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={24} color="white" />
        </View>
        {item.is_online && <View style={styles.onlineIndicator} />}
      </View>

      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.firstName || 'Unknown'}</Text>
        <Text style={styles.contactStatus}>
          {item.is_online ? 'Online' : `Last seen ${item.last_seen || 'recently'}`}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderGroupMemberItem = ({ item }: { item: FamilyMember }) => {
    const isSelected = selectedMembers.includes(item.personId);

    return (
      <TouchableOpacity
        style={styles.groupMemberItem}
        onPress={() => toggleMemberSelection(item.personId)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={24} color="white" />
          </View>
        </View>

        <Text style={styles.contactName}>{item.firstName || 'Unknown'}</Text>

        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
        </View>
      </TouchableOpacity>
    );
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (!visible) return null;

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <View style={styles.drawer}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Chats</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => setShowGroupModal(true)}
                >
                  <Ionicons name="people-outline" size={24} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton} onPress={onClose}>
                  <Ionicons name="close" size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search messages or contacts..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'chats' && styles.activeTab]}
                onPress={() => setActiveTab('chats')}
              >
                <Text
                  style={[styles.tabText, activeTab === 'chats' && styles.activeTabText]}
                >
                  Chats
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'contacts' && styles.activeTab]}
                onPress={() => setActiveTab('contacts')}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'contacts' && styles.activeTabText,
                  ]}
                >
                  Contacts ({familyMembers.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            {activeTab === 'chats' ? (
              <FlatList
                data={chats}
                renderItem={renderChatItem}
                keyExtractor={(item) => item.chat_id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>No chats yet</Text>
                    <Text style={styles.emptySubtext}>
                      Start a conversation with your family
                    </Text>
                  </View>
                }
              />
            ) : (
              <FlatList
                data={filteredMembers}
                renderItem={renderContactItem}
                keyExtractor={(item) => item.personId}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Ionicons name="people-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>No contacts found</Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Group Creation Modal */}
      <Modal
        visible={showGroupModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGroupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.groupModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Group</Text>
              <TouchableOpacity onPress={() => setShowGroupModal(false)}>
                <Ionicons name="close" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.groupNameInput}
              placeholder="Group name"
              value={groupName}
              onChangeText={setGroupName}
              placeholderTextColor="#999"
            />

            <Text style={styles.sectionTitle}>
              Select members ({selectedMembers.length} selected, minimum 2 required)
            </Text>

            {familyMembers.length === 0 ? (
              <View style={styles.emptyMembersList}>
                <Text style={styles.emptyText}>Loading family members...</Text>
              </View>
            ) : (
              <FlatList
                data={familyMembers}
                renderItem={renderGroupMemberItem}
                keyExtractor={(item) => item.personId}
                style={styles.membersList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyMembersList}>
                    <Text style={styles.emptyText}>No family members found</Text>
                  </View>
                }
              />
            )}

            <TouchableOpacity
              style={[
                styles.createButton,
                (!groupName.trim() || selectedMembers.length < 2) &&
                  styles.createButtonDisabled,
              ]}
              onPress={createGroup}
              disabled={!groupName.trim() || selectedMembers.length < 2}
            >
              <Ionicons name="checkmark" size={20} color="white" />
              <Text style={styles.createButtonText}>Create Group</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  drawer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.foreground,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.sacred,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: 'white',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    flex: 1,
  },
  chatTime: {
    fontSize: 12,
    color: '#999',
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 4,
  },
  contactStatus: {
    fontSize: 14,
    color: '#666',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: width * 0.9,
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  groupNameInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  membersList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  emptyMembersList: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  groupMemberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  createButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
