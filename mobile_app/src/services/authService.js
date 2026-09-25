import { apiClient } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
  // Register with email and password
  async register(name, email, password) {
    try {
      const response = await apiClient.post('/auth/register', { name, email, password });
      if (response.data.token) {
        await AsyncStorage.setItem('@auth_token', response.data.token);
      }
      return { error: false, user: response.data.user };
    } catch (err) {
      return { error: true, message: err.message };
    }
  },

  // Login with email and password
  async login(email, password) {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      if (response.data.token) {
        await AsyncStorage.setItem('@auth_token', response.data.token);
      }
      return { error: false, user: response.data.user };
    } catch (err) {
      return { error: true, message: err.message };
    }
  },

  // Get current user profile
  async getMe() {
    try {
      const response = await apiClient.get('/auth/me');
      return { error: false, user: response.data.user };
    } catch (err) {
      return { error: true, message: err.message };
    }
  },

  // Update profile
  async updateProfile(profileData) {
    try {
      const response = await apiClient.put('/users/profile', profileData);
      return { error: false, user: response.data.user };
    } catch (err) {
      return { error: true, message: err.message };
    }
  },

  // Logout
  async logout() {
    try {
      await AsyncStorage.removeItem('@auth_token');
      return { error: false };
    } catch (err) {
      return { error: true, message: err.message };
    }
  }
};
