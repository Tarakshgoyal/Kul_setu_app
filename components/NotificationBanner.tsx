import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/utils';
import { apiService } from '@/lib/api';
import { getUser } from '@/lib/auth';

export default function NotificationBanner() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(() => {
      if (notifications.length > 1) {
        setCurrentIndex((prev) => (prev + 1) % notifications.length);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [notifications.length]);

  const loadNotifications = async () => {
    try {
      const user = await getUser();
      const notifs = await apiService.getNotifications(user?.email);
      if (notifs.length > 0) {
        setNotifications(notifs.slice(0, 3)); // Show only first 3
        setVisible(true);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  if (!visible || notifications.length === 0) {
    return null;
  }

  const currentNotification = notifications[currentIndex];

  return (
    <View style={styles.container}>
      <View style={styles.notification}>
        <Ionicons 
          name={currentNotification.type === 'disease' ? 'medical' : 'notifications'} 
          size={20} 
          color={colors.primary} 
        />
        <Text style={styles.title} numberOfLines={1}>
          {currentNotification.title}
        </Text>
        <TouchableOpacity onPress={() => setVisible(false)}>
          <Ionicons name="close" size={20} color="#666" />
        </TouchableOpacity>
      </View>
      {notifications.length > 1 && (
        <View style={styles.dots}>
          {notifications.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                { backgroundColor: index === currentIndex ? colors.primary : '#ccc' }
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.secondary,
    margin: 16,
    borderRadius: 8,
    padding: 12,
  },
  notification: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});