import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/utils';
import { apiService } from '@/lib/api';

export default function ApiStatus() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  useEffect(() => {
    checkApiStatus();
    const interval = setInterval(checkApiStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkApiStatus = async () => {
    try {
      await apiService.healthCheck();
      setStatus('online');
      setLastCheck(new Date());
    } catch (error) {
      setStatus('offline');
      setLastCheck(new Date());
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'online': return '#4CAF50';
      case 'offline': return '#F44336';
      default: return '#FF9800';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'online': return 'checkmark-circle';
      case 'offline': return 'close-circle';
      default: return 'time';
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={checkApiStatus}>
      <Ionicons 
        name={getStatusIcon() as any} 
        size={16} 
        color={getStatusColor()} 
      />
      <Text style={[styles.text, { color: getStatusColor() }]}>
        API {status === 'checking' ? 'Checking...' : status.toUpperCase()}
      </Text>
      {lastCheck && (
        <Text style={styles.timestamp}>
          {lastCheck.toLocaleTimeString()}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 6,
    gap: 4,
    alignSelf: 'flex-start',
    margin: 16,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 10,
    color: '#666',
  },
});