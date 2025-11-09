import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService, User } from './api';

const USER_KEY = 'kul_setu_user';

export const getUser = async (): Promise<User | null> => {
  try {
    const userData = await AsyncStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

export const setUser = async (user: User): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error setting user:', error);
  }
};

export const logout = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('Error logging out:', error);
  }
};

export const login = async (email: string, password: string): Promise<User | null> => {
  try {
    console.log('Auth service: Attempting login for', email);
    const response = await apiService.login(email, password);
    console.log('Auth service: API response:', response);
    
    if (response.success && response.user) {
      console.log('Auth service: Login successful, saving user');
      await setUser(response.user);
      return response.user;
    }
    
    console.log('Auth service: Login failed - no user in response');
    return null;
  } catch (error) {
    console.error('Auth service: Login error:', error);
    throw error;
  }
};

export const signup = async (userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  familyId?: string;
  personId?: string;
}): Promise<User | null> => {
  try {
    const response = await apiService.signup(userData);
    if (response.success) {
      return await login(userData.email, userData.password);
    }
    return null;
  } catch (error) {
    console.error('Signup error:', error);
    return null;
  }
};

export { User };