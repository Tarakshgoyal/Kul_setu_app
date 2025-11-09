import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/utils';
import { apiService } from '@/lib/api';
import { getUser } from '@/lib/auth';

interface Notification {
  notificationId: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  isRead: boolean;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const user = await getUser();
      const data = await apiService.getNotifications(user?.email);
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'disease':
        return 'medical';
      case 'ritual':
        return 'calendar';
      default:
        return 'information-circle';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'disease':
        return '#DC2626';
      case 'ritual':
        return '#9333EA';
      default:
        return '#3B82F6';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      {/* Notification Bell Button */}
      <TouchableOpacity
        style={styles.bellButton}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Ionicons name="notifications-outline" size={24} color={colors.primary} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Notifications Panel Modal */}
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <TouchableOpacity 
            style={styles.panel}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Ionicons name="notifications" size={20} color={colors.primary} />
                <Text style={styles.headerTitle}>Notifications</Text>
              </View>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <Text style={styles.headerSubtitle}>
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
            </Text>

            {/* Notifications List */}
            <ScrollView style={styles.scrollView}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Loading notifications...</Text>
                </View>
              ) : notifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="notifications-off-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyText}>No notifications yet</Text>
                </View>
              ) : (
                <View style={styles.notificationsList}>
                  {notifications.map((notification) => (
                    <View
                      key={notification.notificationId}
                      style={[
                        styles.notificationItem,
                        !notification.isRead && styles.unreadItem
                      ]}
                    >
                      <View style={styles.notificationIcon}>
                        <Ionicons 
                          name={getNotificationIcon(notification.type) as any} 
                          size={20} 
                          color={getNotificationColor(notification.type)} 
                        />
                      </View>
                      <View style={styles.notificationContent}>
                        <View style={styles.notificationHeader}>
                          <Text style={styles.notificationTitle}>{notification.title}</Text>
                          <View style={[styles.typeBadge, { backgroundColor: getNotificationColor(notification.type) }]}>
                            <Text style={styles.typeBadgeText}>
                              {notification.type === 'disease' ? 'Health' : 
                               notification.type === 'ritual' ? 'Ritual' : 'Info'}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.notificationMessage}>{notification.message}</Text>
                        <Text style={styles.notificationTime}>{formatDate(notification.createdAt)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bellButton: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 60,
  },
  panel: {
    width: 380,
    maxWidth: '90%',
    maxHeight: 600,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
  },
  headerSubtitle: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  scrollView: {
    maxHeight: 500,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
  },
  notificationsList: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  unreadItem: {
    backgroundColor: '#F3E8FF',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
    gap: 4,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  typeBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  notificationMessage: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
});
