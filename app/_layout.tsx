import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { getUser, User } from '@/lib/auth';

const queryClient = new QueryClient();

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  const checkAuth = async () => {
    try {
      const currentUser = await getUser();
      console.log('AuthProvider: Current user:', currentUser);
      setUser(currentUser);
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    console.log('AuthProvider: User state changed', { user: !!user, inAuthGroup, segments });

    if (!user && !inAuthGroup) {
      console.log('AuthProvider: Redirecting to auth');
      router.replace('/auth');
    } else if (user && inAuthGroup) {
      console.log('AuthProvider: Redirecting to tabs');
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading]);

  // Listen for auth state changes
  useEffect(() => {
    const interval = setInterval(checkAuth, 1000);
    return () => clearInterval(interval);
  }, []);

  return children;
}

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ title: 'Register Family' }} />
            <Stack.Screen name="search" options={{ title: 'Search Family' }} />
            <Stack.Screen name="profile/[id]" options={{ title: 'Profile' }} />
            <Stack.Screen name="rituals" options={{ title: 'Rituals' }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
